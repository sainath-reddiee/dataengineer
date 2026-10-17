# Snowflake Dynamic Data Masking and Row Access Policies: A Production Guide

> **Editor notes**
>
> - Changed: removed the TL;DR and replaced it with a short intro; points from the TL;DR that were not in the body (one policy per column, type matching, Enterprise Edition) are already covered in the comparison table, the first code explanation and the FAQ. Turned the bold gotcha pseudo-headings, the "One Principle" line and the FAQ questions into real headings. Added explanations before the longer SQL blocks. Removed nearly all em-dashes.
> - Links: the body link "Cortex AI at scale" and the related-reading entry pointed to `snowflake-cortex-token-usage-monitoring`, which is being 301'd into `snowflake-cortex-ai-hidden-token-costs`. I repointed the body link to the keeper and dropped the duplicate related-reading entry.
> - **Check before publishing:** (1) `POLICY_CONTEXT` syntax. The post uses `SELECT POLICY_CONTEXT('<query>', OBJECT_CONSTRUCT('role', ...))`; my understanding is that Snowflake's documented form is `EXECUTE USING POLICY_CONTEXT(CURRENT_ROLE => '...') AS SELECT ...`, and that it simulates policies that are already attached, so "test before applying" may not be accurate. Please run it and correct the code and prose (and FAQ answer) if needed. (2) `SYS_CONTEXT('SNOWFLAKE$CURRENT', 'IS_AGENT_ACTIVATED')`: confirm the function name, namespace, GA status and that it returns TRUE for managed MCP server sessions (FAQ claim). (3) "Snowflake never modifies or encrypts the stored data": Snowflake encrypts all data at rest, so this reads as wrong. Suggest "masking does not change the stored data". I left the sentence as written. (4) The materialized view limitation and the suggested workaround. (5) Whether cloning a table with a masking policy requires APPLY privileges on the cloning role. (6) The exact error strings quoted in the gotchas and FAQ.

This post is for Snowflake engineers who need to prove column-level and row-level access controls to an auditor, including controls that hold when an AI agent runs the query. It covers how Dynamic Data Masking and Row Access Policies differ, how to set them up and test them, how tag-based masking scales them across a schema, how `IS_AGENT_ACTIVATED` masks data from agents, and the gotchas that catch teams the first time.

The governance review lands on a Wednesday. Your company needs to prove that analysts in one region cannot see customer PII from another, that customer emails are masked for anyone below the data steward tier, and (this one is new) that AI agents querying your warehouse cannot extract raw PII even when the agent runs under a privileged role. You have two weeks.

Snowflake has the tools for all three. Dynamic Data Masking controls what value a user sees in a column. Row Access Policies control which rows they see at all. And since 2026, a context function called `IS_AGENT_ACTIVATED` lets your masking policies detect when a Cortex AI agent is making the query and mask accordingly, whatever role the agent runs under. Together they form a governance stack that scales from a single sensitive column to millions of rows across hundreds of tables, if you configure them correctly. If you don't, they are bypassable in ways that are easy to miss until an auditor asks.

## DDM vs Row Access Policies: the conceptual split

The confusion between these two features is understandable, since both restrict what users see, but they operate at different layers. Dynamic Data Masking (DDM) is column-level: it controls the *value* returned for a column based on the querying role. Row Access Policies (RAP) are row-level: they filter which rows are visible. Most enterprise setups need both.

![Diagram of the two policy layers: masking policies change column values and row access policies filter rows, while stored data stays untouched and policy logic runs at query time](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/masking_policy_layers.png?resize=943%2C504&ssl=1)

The bottom of that diagram carries the most important fact: **Snowflake never modifies or encrypts the stored data**. Both policies evaluate entirely at query runtime. A row filtered by a Row Access Policy still exists in storage. A value masked to `****` is still the original string on disk. That means Time Travel, data sharing and cloning still work normally. It also means a user with direct access to the underlying storage (unlikely, but worth knowing) would see plain text.

| Dimension | Dynamic Data Masking | Row Access Policy |
| --- | --- | --- |
| Controls | Column value (what is shown) | Row visibility (which rows exist) |
| Attachment | One policy per column | One policy per table or view |
| Data types | Input type must match output type | Always returns BOOLEAN (include/exclude) |
| Performance impact | Minimal: evaluates per column in result | COUNT(*) triggers full scan without clustering |
| Mapping table | Not applicable | Required for role-to-region entitlements |
| Works with streams | Yes | Yes: RAP applied when stream reads source table |
| Works with data sharing | Yes | Yes |
| Works with materialized views | Not directly: apply to base table instead | Yes |
| Edition required | Enterprise+ | Enterprise+ |

## Setting up Dynamic Data Masking

The setup is always the same three steps: create a policy, grant privileges, apply it to a column. The complexity is in the policy logic itself, getting the `CASE` conditions right so the right roles see the right data.

### Creating and applying a basic masking policy

```sql
-- Step 1: Create a dedicated masking admin role (security officer)
CREATE ROLE masking_admin;
GRANT CREATE MASKING POLICY ON SCHEMA prod_db.sensitive_schema TO ROLE masking_admin;
GRANT APPLY MASKING POLICY ON ACCOUNT TO ROLE masking_admin;

-- Step 2: Create the masking policy (runs as masking_admin)
CREATE OR REPLACE MASKING POLICY prod_db.sensitive_schema.email_mask
  AS (val STRING) RETURNS STRING ->
  CASE
    -- AI agents: always mask regardless of role
    WHEN SYS_CONTEXT('SNOWFLAKE$CURRENT', 'IS_AGENT_ACTIVATED')::BOOLEAN = TRUE
      THEN REGEXP_REPLACE(val, '(^[^@]{2}).*(@.*$)', '\\1***\\2')
    -- Data stewards see plain text
    WHEN CURRENT_ROLE() IN ('DATA_STEWARD', 'PRIVACY_OFFICER')
      THEN val
    -- Analysts see partially masked email
    WHEN CURRENT_ROLE() = 'ANALYST'
      THEN REGEXP_REPLACE(val, '(^[^@]{2}).*(@.*$)', '\\1***\\2')
    -- Everyone else sees fully redacted
    ELSE '****@****.***'
  END;

-- Step 3: Apply to the column
ALTER TABLE prod_db.customers_schema.customers
  MODIFY COLUMN email
  SET MASKING POLICY prod_db.sensitive_schema.email_mask;
```

Two things to notice. First, the `IS_AGENT_ACTIVATED` check comes *before* the role checks, and that ordering matters. If a Cortex Agent is running under `DATA_STEWARD`, the role check would allow plain text, but the agent check intercepts it first. Second, the policy declares `val STRING` and returns `STRING`. Input and output types must match exactly, so if you apply this policy to a `TIMESTAMP` column, Snowflake rejects it with a type mismatch error. One policy, one data type, and only one masking policy per column at a time.

### Testing with POLICY_CONTEXT before applying

Applying a masking policy to a production column and then testing it is backwards. Use `POLICY_CONTEXT` to simulate the query as a specific role without switching sessions or touching the policy attachment:

```sql
-- Simulate what ANALYST role would see on the email column
SELECT POLICY_CONTEXT(
  'SELECT email FROM prod_db.customers_schema.customers LIMIT 5',
  OBJECT_CONSTRUCT('role', 'ANALYST')
);

-- Simulate what DATA_STEWARD sees
SELECT POLICY_CONTEXT(
  'SELECT email FROM prod_db.customers_schema.customers LIMIT 5',
  OBJECT_CONSTRUCT('role', 'DATA_STEWARD')
);
```

This is the function the [official column-level security docs](https://docs.snowflake.com/en/user-guide/security-column-intro) recommend for pre-deployment validation. It also works for Row Access Policies, and can simulate both at once when a column is covered by both policy types.

[ADD YOUR OWN: the output of the two POLICY_CONTEXT calls above (or your corrected version) side by side, showing the ANALYST partial mask and the DATA_STEWARD plain text on a test table]

## Tag-based masking: the pattern that scales

Manual column-by-column masking breaks at scale. A schema with 200 tables, each with 3 to 5 PII columns, means 600 to 1,000 individual `ALTER COLUMN SET MASKING POLICY` commands, and every new table added to that schema needs the same treatment. Miss one during a 2 AM data load and you've exposed PII until the next audit cycle.

Tag-based masking inverts the relationship. Instead of attaching a policy to a column, you attach the policy to a *tag*, then tag the schema. Every column in every table in that schema with a matching data type is protected automatically, including tables added in the future.

![Tag-based masking flow: tag the schema once and every future table with a string column picks up the mask automatically](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/masking_tag_flow-1024x495.png?resize=1024%2C495&ssl=1)

The script below creates a `pii_email` tag, binds the `email_mask` policy from the previous section to it, sets the tag on the whole `customers_schema`, and then lists the columns the policy now protects. Swap in your own database, schema and policy names. Note that `ACCOUNT_USAGE` views can lag, so a freshly tagged column may not appear in `POLICY_REFERENCES` straight away.

```sql
-- Create the tag
CREATE OR REPLACE TAG prod_db.governance_schema.pii_email
  COMMENT = 'Marks columns containing raw email addresses';

-- Bind the masking policy to the tag
ALTER TAG prod_db.governance_schema.pii_email
  SET MASKING POLICY prod_db.sensitive_schema.email_mask;

-- Apply the tag at schema level (protects all existing + future tables)
ALTER SCHEMA prod_db.customers_schema
  SET TAG prod_db.governance_schema.pii_email = 'true';

-- Verify which columns are now protected
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.POLICY_REFERENCES
WHERE POLICY_DB = 'PROD_DB'
  AND POLICY_NAME = 'EMAIL_MASK'
ORDER BY REF_COLUMN_NAME;
```

One limitation to know upfront: a column can be protected by a directly assigned masking policy *and* a tag-based masking policy at the same time, but if both exist, [the directly assigned policy takes precedence](https://docs.snowflake.com/en/user-guide/tag-based-masking-policies). That is useful for exceptions: tag the schema for broad protection, then override specific columns with stricter or looser policies applied directly.

[ADD YOUR OWN: the POLICY_REFERENCES result after tagging a schema, ideally including a table created after the tag was set, to show it was picked up automatically]

## IS_AGENT_ACTIVATED: governing AI agent access

This is the most operationally important addition to the masking feature set in 2026, and it sits squarely where data governance meets the AI agent infrastructure your team is probably already building.

The problem it solves: when a Cortex Agent, or any AI agent connecting through an [MCP server](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide), runs a query, it does so under a Snowflake role. If that role has ANALYST-level access to a table, the agent reads the same data an analyst would. But analysts are humans who can be trained not to copy PII out of their query results. An agent processing thousands of rows and writing results to an output table, or sending them to an external API, is a different risk profile entirely.

![IS_AGENT_ACTIVATED is evaluated before the role check, so a privileged agent gets the same mask as an unprivileged one](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/masking_agent_panel.png?resize=1020%2C504&ssl=1)

`IS_AGENT_ACTIVATED` is read through `SYS_CONTEXT` in the masking policy body. When Snowflake detects that the current session is an AI agent context (a Cortex Agent, or a session initiated through the Cortex Agent API), it returns `TRUE`. The masking policy evaluates it before any role check, so the agent cannot bypass it by inheriting a privileged role.

The phone-number policy below follows the same order as the email policy: agents always get a fully masked value, privacy officers and data stewards see the real number, analysts see the last four digits, and everyone else gets the full mask.

```sql
-- Masking policy that distinguishes human analysts from AI agents
-- even when both share the same Snowflake role
CREATE OR REPLACE MASKING POLICY prod_db.sensitive_schema.pii_phone_mask
  AS (val STRING) RETURNS STRING ->
  CASE
    -- Block AI agents regardless of their active role
    WHEN SYS_CONTEXT('SNOWFLAKE$CURRENT', 'IS_AGENT_ACTIVATED')::BOOLEAN = TRUE
      THEN '***-***-****'
    -- Privacy officers see the real number
    WHEN CURRENT_ROLE() IN ('PRIVACY_OFFICER', 'DATA_STEWARD')
      THEN val
    -- Analysts see last 4 digits only
    WHEN CURRENT_ROLE() = 'ANALYST'
      THEN CONCAT('***-***-', RIGHT(val, 4))
    ELSE '***-***-****'
  END;
```

If you're running [Cortex AI at scale](https://dataengineerhub.blog/articles/snowflake-cortex-ai-hidden-token-costs), this pattern belongs in your governance playbook. The risk is real: an agent running a monitoring query over millions of rows, combined with an output path to a downstream system or an email notification, can exfiltrate PII that your masking policies were designed to protect, simply because the agent's role was granted for legitimate operational reasons rather than for raw data access.

[ADD YOUR OWN: the same SELECT on the phone or email column run once by a human session and once through a Cortex Agent under the same role, showing the plain and masked results]

## Row Access Policies: controlling visible rows

A Row Access Policy returns a boolean expression that Snowflake evaluates per row. Rows where it returns `TRUE` are visible; rows where it returns `FALSE` are hidden as if they don't exist. The standard pattern uses a mapping table that maps roles (or users) to the regions or segments they're allowed to see.

The script below builds that mapping table (each regional analyst role sees its own region, `GLOBAL_ADMIN` sees all three), creates a policy that checks the current role against it, attaches the policy to the `customer_region` column of an orders table, and confirms the attachment. Replace the roles and regions with your own entitlements.

```sql
-- Mapping table: which roles can see which regions
CREATE TABLE prod_db.governance_schema.region_access_map (
  role_name   VARCHAR,
  region_code VARCHAR
);

INSERT INTO prod_db.governance_schema.region_access_map VALUES
  ('EMEA_ANALYST',  'EMEA'),
  ('APAC_ANALYST',  'APAC'),
  ('US_ANALYST',    'US'),
  ('GLOBAL_ADMIN',  'EMEA'),
  ('GLOBAL_ADMIN',  'APAC'),
  ('GLOBAL_ADMIN',  'US');

-- Row Access Policy using the mapping table
CREATE OR REPLACE ROW ACCESS POLICY prod_db.governance_schema.region_row_policy
  AS (region_col VARCHAR) RETURNS BOOLEAN ->
  EXISTS (
    SELECT 1
    FROM prod_db.governance_schema.region_access_map
    WHERE role_name   = CURRENT_ROLE()
      AND region_code = region_col
  );

-- Apply to the orders table
ALTER TABLE prod_db.sales_schema.orders
  ADD ROW ACCESS POLICY prod_db.governance_schema.region_row_policy
  ON (customer_region);

-- Audit: confirm attachment
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.POLICY_REFERENCES
WHERE POLICY_NAME = 'REGION_ROW_POLICY';
```

The mapping table pattern is flexible. You can join on user name instead of role, add more segmentation dimensions, or drive it from a table managed by your identity system. The key constraint is that **the protected table itself cannot be the mapping table**; Snowflake rejects circular references. External tables are also unsupported as mapping tables.

## The gotchas

### Dropping a masking policy that's still attached fails with a cryptic error

You cannot `DROP MASKING POLICY` while it is attached to any column. The error says the policy "cannot be dropped as it is associated with one or more entities." To drop it, find all attachments with `SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.POLICY_REFERENCES WHERE POLICY_NAME = '<name>'`, run `ALTER TABLE ... MODIFY COLUMN ... UNSET MASKING POLICY` on each one, then drop. This is also why cloning a table with a masking policy requires the cloning role to have APPLY privileges: the clone carries the policy attachment.

### Restoring a Time Traveled table can produce a masking policy error

If you drop a masking policy and then restore a table from Time Travel that was protected by it, Snowflake throws: *"Column already attached to a masking policy that does not exist."* The fix is to `UNSET` the ghost policy reference on the restored column and reapply a current policy. It is rare, but it will happen in a disaster recovery scenario if policies are managed separately from table DDL. Our [Time Travel and Fail-safe guide](https://dataengineerhub.blog/articles/snowflake-time-travel-fail-safe-guide) covers the broader restore workflow.

### A Row Access Policy on a large unclustered table turns COUNT(*) into a full scan

Without a RAP, `SELECT COUNT(*) FROM big_table` completes in milliseconds because Snowflake reads the metadata. With a RAP attached, Snowflake must evaluate the row filter for every row to count the visible ones, which triggers a full table scan. For very large tables, clustering on the column used in the RAP filter (for example `customer_region`) lets Snowflake prune [micro-partitions](https://docs.snowflake.com/en/user-guide/tables-micro-partitions) and greatly reduces scan cost. The [official Row Access Policy docs](https://docs.snowflake.com/en/user-guide/security-row-intro) call this out under performance considerations.

[ADD YOUR OWN: Query Profile screenshots of COUNT(*) on one of your large tables with and without the row access policy, showing partitions scanned and elapsed time]

### Materialized views and masking policies don't mix directly

You cannot create a materialized view that includes a column protected by a masking policy; Snowflake rejects it at creation time with an "unsupported feature" error. The workaround is to apply the masking policy after the materialized view is created, on the *base table*, not on the view. Alternatively, create the MV without the sensitive columns and handle masking in a view layer on top.

### CURRENT_ROLE() returns the active role, not every role the user has

A masking policy that checks `CURRENT_ROLE() IN ('DATA_STEWARD')` will not trigger for a user who *has* the DATA_STEWARD role but is currently operating under ANALYST. Users must explicitly `USE ROLE DATA_STEWARD` to activate that branch. If your governance model needs "any of your roles" logic, use `IS_ROLE_IN_SESSION` instead. This is one of the most common mis-implementations in the field, and [AI agent governance setups](https://dataengineerhub.blog/articles/governing-ai-agents-snowflake-coco-mcp-security) are particularly exposed because agents often operate under a single fixed role.

## Tag the schema, not the column

Write the policy once and let Snowflake enforce it on every table you load from now on, including the one at 2 AM that nobody remembers to govern by hand.

## FAQ

### What Snowflake edition is required for Dynamic Data Masking?

Enterprise Edition or higher, for both Dynamic Data Masking and Row Access Policies. Standard Edition provides basic role-based access control through privileges and object ownership, but not policy-driven column masking or row filtering. If you're evaluating governance features, this is often the first planning constraint to surface.

### Can I apply two masking policies to the same column?

No. A column can have only one masking policy attached at a time. If you try to apply a second, Snowflake returns: "Specified column already attached to another masking policy." Consolidate your logic into a single policy using CASE expressions, or UNSET the existing policy before applying the new one. Tag-based and directly assigned policies can coexist on the same column, but the directly assigned policy takes precedence.

### Does IS_AGENT_ACTIVATED work with MCP server connections?

Yes. When an AI agent connects to Snowflake through a managed MCP server and invokes a SQL tool, the resulting session is flagged as an agent context and IS_AGENT_ACTIVATED returns TRUE. Masking policies with the IS_AGENT_ACTIVATED check therefore block raw PII access for agents connecting through MCP; the same governance applies however the agent starts the session.

### How do I test a masking policy without applying it to a production column?

Use the POLICY_CONTEXT function. It simulates query execution as a specified role, including evaluating any masking or row access policies on the queried objects, and returns what that role would see. You can pass both role and session context into the simulation. This is the pre-deployment validation approach Snowflake's documentation recommends.

### Does a Row Access Policy affect Time Travel queries?

Yes. Row Access Policies apply to Time Travel queries using the AT or BEFORE clause, and the policy evaluates against the current session context, not the historical one. A user querying a historical snapshot only sees rows they are entitled to see now, even if the entitlement table has changed since that timestamp.

### Can Dynamic Data Masking and Row Access Policies be used together on the same table?

Yes, and that is the recommended pattern for most enterprise use cases. Row Access Policies filter which rows are returned; Dynamic Data Masking then controls what values are visible in those rows. Use POLICY_CONTEXT to simulate queries with both policies active and verify the combined behavior before applying to production.

**Related reading:** [Using MCP Servers with Snowflake](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide) · [Snowflake Cortex AI hidden token costs and monitoring](https://dataengineerhub.blog/articles/snowflake-cortex-ai-hidden-token-costs) · [Snowflake Time Travel and Fail-safe](https://dataengineerhub.blog/articles/snowflake-time-travel-fail-safe-guide) · [Governing AI agents in Snowflake](https://dataengineerhub.blog/articles/governing-ai-agents-snowflake-coco-mcp-security) · [Using Dynamic Data Masking (official)](https://docs.snowflake.com/en/user-guide/security-column-ddm-use) · [Row Access Policies (official)](https://docs.snowflake.com/en/user-guide/security-row-intro) · [Tag-based masking policies (official)](https://docs.snowflake.com/en/user-guide/tag-based-masking-policies)
