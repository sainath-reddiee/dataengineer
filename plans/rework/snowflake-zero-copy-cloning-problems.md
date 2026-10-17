# The Problems with Snowflake Zero-Copy Cloning That Nobody Talks About

> **Editor notes**
>
> - Changed: removed the TL;DR block (and the line "This article covers what zero-copy cloning actually does...") and folded a one-line "who it's for" into the existing intro; turned the plain-text all-caps headings into `##` headings; FAQ questions made into `###` subheadings; removed em-dashes from prose; added short explanations around the longer code blocks; renamed "Related blogs" to "Further reading". Code blocks unchanged apart from language tags (sql, javascript stored procedure kept as sql since it is a CREATE PROCEDURE statement).
> - **Check before republishing (high priority):** Problem 2 says masking policies and row access policies are not inherited by clones. Snowflake's cloning docs say policy assignments on a table's columns are generally carried over to the clone (when cloning a database or schema, the clone references the cloned policy if the policy lives in the same container). Please test this on your account and correct Problem 2, the FAQ answer and the "best practice" FAQ if the docs are right. The removed TL;DR also said clones don't inherit resource monitors; resource monitors attach to warehouses, not tables, so I dropped that claim.
> - Check: Problem 5 says streams are not cloned when you clone "a table or schema". Snowflake docs say cloning a database or schema does clone the streams inside it (unconsumed records become inaccessible); cloning a single table does not bring streams with it. Please verify and adjust.
> - Check: the audit queries filter `snowflake.account_usage.tables` on `clone_group_id`. As far as I know `CLONE_GROUP_ID` lives in `ACCOUNT_USAGE.TABLE_STORAGE_METRICS`, where every table has one (a table that is not a clone has `clone_group_id = id`). If so, `WHERE clone_group_id IS NOT NULL` returns every table, and `bytes` in `TABLES` is not the clone's owned storage. Please run the queries and confirm.
> - Check: the expiry-tag example puts the JSON `COMMENT` on a database (`CREATE DATABASE uat_db ... COMMENT =`) but then reads `comment` from `account_usage.tables`, which holds table comments. Either tag tables or query `account_usage.databases`.
> - Check: the Time Travel error text "Statement time travel is not available for this object" should be the exact message Snowflake returns.
> - Check: the internal link "The Problem with Incremental Models in dbt Nobody Talks About" points to `/articles/dbt-tests-pass-bad-data`, the same URL as the dbt tests article. Fix the slug if a separate incremental-models post exists.
> - Cut: TL;DR block (repeated the body). Nothing else cut.

Every time I demo Snowflake to someone new, zero-copy cloning gets the biggest reaction. You type one line and get an instant copy of a table, or an entire database, with no data duplication and no storage cost at the moment of creation. It feels like magic.

And it is impressive engineering. I'm not here to tell you it's a bad feature. It's one of my favourite things about Snowflake and I use it constantly.

But I've watched teams get badly surprised by it. A dev environment clone that started silently inflating the storage bill. A cloned database used for UAT that bypassed data masking policies on PII columns. A Time Travel query on a clone that returned nothing because the source table's retention window had already expired.

None of these are edge cases. They're predictable consequences of how zero-copy cloning works, and the marketing language around "instant, free copies" tends to hide them. If you use clones for dev, UAT or migrations, this post walks through how cloning works under the hood, five places where it catches teams out, and how to use it without it becoming a liability.

## How zero-copy cloning actually works

When you clone a table in Snowflake, you're not copying data. You're creating a new metadata pointer that references the same underlying micro-partitions as the source object.

```sql
-- Instant. No data movement. No storage cost at this moment.
CREATE TABLE orders_clone CLONE orders;

-- Works for schemas too
CREATE SCHEMA dev_schema CLONE prod_schema;

-- And entire databases
CREATE DATABASE dev_db CLONE prod_db;
```

At the moment of creation, the clone costs you nothing in storage. Both the original and the clone point to the same micro-partitions. The moment either side changes, Snowflake uses copy-on-write: the modified micro-partition is written fresh for whichever side made the change.

Think of it like a fork of a Git repo. At fork time, both repos share the same commit history. The moment either side commits, they diverge, and the more they diverge, the more independent storage you accumulate. Zero-copy cloning works the same way, except the "commits" are DML operations and the cost is real money.

## Problem 1: Storage costs that creep up invisibly

A team clones production to create a development environment. The dev team runs experiments, updates records and backfills some columns. Six weeks later, storage is up 40%. Every modified micro-partition in the dev database is now independent storage. Production kept its micro-partitions too, so you're paying for both.

The cost also compounds with Time Travel. If production has 90-day retention and you clone it for dev, the clone also starts with 90-day retention, so DML in dev accumulates 90 days of write history.

```sql
-- Clone with reduced Time Travel for non-production environments
CREATE DATABASE dev_db CLONE prod_db;

-- Immediately reduce Time Travel on the clone
ALTER DATABASE dev_db SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- Or set it at schema level for finer control
ALTER SCHEMA dev_db.analytics SET DATA_RETENTION_TIME_IN_DAYS = 0;
```

Audit the clone storage footprint regularly:

```sql
-- Find clones and their storage footprint
SELECT
    table_catalog,
    table_schema,
    table_name,
    clone_group_id,
    bytes / (1024 * 1024 * 1024)        AS size_gb,
    row_count,
    created                              AS clone_created_at
FROM snowflake.account_usage.tables
WHERE clone_group_id IS NOT NULL
  AND deleted IS NULL
ORDER BY bytes DESC;
```

This lists cloned tables that still exist, largest first, with their size in GB and when they were created. Run it on a schedule rather than once.

[ADD YOUR OWN: an anonymised result from one of your accounts showing how much storage a dev clone had built up, and over how many weeks]

This kind of invisible cost creep comes up a lot with Snowflake features that look free until you read the bill. I covered a similar case in [Why I Stopped Using Snowflake Tasks for Orchestration](/articles/why-i-stopped-using-snowflake-tasks-orchestration).

## Problem 2: Governance policies don't follow the clone

Dynamic data masking policies are not automatically inherited by clones. The clone is a new object with no masking policies applied.

```sql
-- On prod table — email is masked for non-PII roles
SELECT email FROM prod_orders LIMIT 5;
-- Result: ***@***.com (masked)

-- On the clone without explicit policy assignment
SELECT email FROM orders_clone LIMIT 5;
-- Result: john.doe@company.com (unmasked raw PII)
```

The same applies to row access policies. A user restricted to one region in production can see all regions on the clone.

[ADD YOUR OWN: a side-by-side screenshot of the same SELECT run on the prod table and on the clone under a non-PII role, so readers can see the behaviour on a real account]

The fix is to make policy application part of your clone process:

```sql
-- Step 1: Clone the table
CREATE TABLE dev_db.analytics.orders CLONE prod_db.analytics.orders;

-- Step 2: Re-apply masking policies immediately
ALTER TABLE dev_db.analytics.orders
    MODIFY COLUMN email
    SET MASKING POLICY prod_db.security.email_mask;

ALTER TABLE dev_db.analytics.orders
    MODIFY COLUMN phone_number
    SET MASKING POLICY prod_db.security.phone_mask;

-- Step 3: Re-apply row access policy
ALTER TABLE dev_db.analytics.orders
    ADD ROW ACCESS POLICY prod_db.security.region_access_policy
    ON (region_code);
```

The policies stay in `prod_db.security` and are attached to the cloned table's `email`, `phone_number` and `region_code` columns. Replace the column and policy names with your own.

Better still, wrap it in a stored procedure so policy application is part of the clone operation itself:

```sql
CREATE OR REPLACE PROCEDURE create_governed_clone(
    source_table      VARCHAR,
    target_table      VARCHAR,
    masking_policies  ARRAY
)
RETURNS STRING
LANGUAGE JAVASCRIPT
AS
$$
    var clone_stmt = snowflake.execute({
        sqlText: `CREATE TABLE ${TARGET_TABLE} CLONE ${SOURCE_TABLE}`
    });

    for (var i = 0; i < MASKING_POLICIES.length; i++) {
        var policy = MASKING_POLICIES[i];
        snowflake.execute({
            sqlText: `ALTER TABLE ${TARGET_TABLE}
                      MODIFY COLUMN ${policy.column}
                      SET MASKING POLICY ${policy.policy_name}`
        });
    }

    return 'Clone created with governance policies applied: ' + TARGET_TABLE;
$$;
```

The procedure clones the source table, then loops over the `masking_policies` array, where each element is an object with a `column` and a `policy_name`, and applies each policy to the new table. Note that JavaScript procedures refer to arguments in upper case (`TARGET_TABLE`, `MASKING_POLICIES`), and this version handles masking policies only, not row access policies.

A clone without its governance policies re-applied is a compliance gap, not a convenience feature. If you run dbt on top of Snowflake, the same mindset applies; see [The Problem with dbt Tests Nobody Talks About](/articles/dbt-tests-pass-bad-data).

## Problem 3: Time Travel on clones isn't what you think

A clone's Time Travel history starts from its creation date. On the clone object, you cannot go back to a point before the clone was created.

```sql
-- Source table: exists since 2024-01-01, 90-day retention
-- Clone created: 2024-03-01

-- This works — within the clone's own history
SELECT * FROM orders_clone
AT (TIMESTAMP => '2024-03-15 10:00:00'::TIMESTAMP_TZ);

-- This FAILS — before the clone existed
SELECT * FROM orders_clone
AT (TIMESTAMP => '2024-02-01 10:00:00'::TIMESTAMP_TZ);
-- Error: Statement time travel is not available for this object

-- For pre-clone history, query the SOURCE table
SELECT * FROM orders
AT (TIMESTAMP => '2024-02-01 10:00:00'::TIMESTAMP_TZ);
```

The first query reads the clone at a point after it was created and works. The second asks the clone for a point before it existed and fails. For that history, go back to the source table, as in the third query.

Also watch the source's retention window: if you clone a table near the end of it, any history that expires on the source is gone, and the clone can't reach it.

## Problem 4: Clone sprawl and the invisible cost problem

Cloning is so easy that people create clones for everything: UAT, load testing, feature branches, one-off investigations that were supposed to be deleted on Friday. Three months later, nobody knows what exists or how far it has diverged.

Full clone audit query:

```sql
SELECT
    t.table_catalog                                   AS database_name,
    t.table_schema                                    AS schema_name,
    t.table_name,
    t.clone_group_id,
    t.row_count,
    ROUND(t.bytes / POW(1024, 3), 3)                  AS size_gb,
    t.created                                         AS created_at,
    t.last_altered                                    AS last_modified_at,
    DATEDIFF('day', t.created, CURRENT_TIMESTAMP())   AS age_days,
    CASE
        WHEN DATEDIFF('day', t.last_altered, CURRENT_TIMESTAMP()) > 30
        THEN 'STALE — review for deletion'
        ELSE 'Active'
    END AS staleness_flag
FROM snowflake.account_usage.tables t
WHERE t.clone_group_id IS NOT NULL
  AND t.deleted IS NULL
ORDER BY t.bytes DESC;
```

This extends the earlier query with age in days and a staleness flag for any clone not altered in the last 30 days. Change the 30-day threshold to suit how long your UAT and test clones normally live.

Tag every clone at creation with expiry metadata:

```sql
CREATE DATABASE uat_db CLONE prod_db
    COMMENT = '{"purpose": "UAT for v2.4 release", "owner": "data-platform@company.com", "expires": "2024-04-30", "ticket": "JIRA-1234"}';

-- Query clones past their expiry date
SELECT
    table_catalog,
    table_schema,
    table_name,
    TRY_PARSE_JSON(comment):expires::DATE AS expiry_date,
    TRY_PARSE_JSON(comment):owner::STRING AS owner
FROM snowflake.account_usage.tables
WHERE clone_group_id IS NOT NULL
  AND deleted IS NULL
  AND TRY_PARSE_JSON(comment):expires::DATE < CURRENT_DATE();
```

The comment is plain JSON, so you can parse it with `TRY_PARSE_JSON` and filter on the `expires` date to find clones that should already be gone, along with who owns them.

## Problem 5: Cloning streams and tasks doesn't work how you expect

Streams are not cloned when you clone a table or schema. The clone contains the data but has no streams attached.

```sql
-- Prod table has a stream attached
SHOW STREAMS ON TABLE prod_db.analytics.orders;
-- Returns: orders_cdc_stream

-- Clone the table
CREATE TABLE dev_db.analytics.orders CLONE prod_db.analytics.orders;

-- Check streams on clone
SHOW STREAMS ON TABLE dev_db.analytics.orders;
-- Returns: (empty)
```

If you need CDC streams on cloned tables, create them explicitly after cloning:

```sql
CREATE OR REPLACE STREAM dev_db.analytics.orders_cdc_stream
    ON TABLE dev_db.analytics.orders
    APPEND_ONLY = FALSE
    SHOW_INITIAL_ROWS = FALSE;

CREATE OR REPLACE TASK dev_db.analytics.process_orders_changes
    WAREHOUSE = dev_wh
    SCHEDULE = '5 minute'
    WHEN SYSTEM$STREAM_HAS_DATA('dev_db.analytics.orders_cdc_stream')
AS
    CALL dev_db.analytics.process_orders_sp();
```

This recreates the stream on the cloned table and a task that runs every five minutes, but only when the stream has new data. Point `WAREHOUSE` at a dev warehouse, never a production one.

Tasks are cloned, but they start in a SUSPENDED state and don't auto-resume. That is the correct behaviour (you don't want dev tasks firing against prod targets), but it surprises teams expecting a live copy of the pipeline. If your pipeline relies on dbt incremental models consuming from those streams, the failure compounds further; see [The Problem with Incremental Models in dbt Nobody Talks About](/articles/dbt-tests-pass-bad-data).

## When zero-copy cloning is the right tool

Before risky migrations, clone first to get an instant rollback point:

```sql
-- Before a risky migration
CREATE TABLE orders_pre_migration CLONE orders;

-- Run your migration
ALTER TABLE orders ADD COLUMN new_column VARCHAR;
UPDATE orders SET new_column = derive_value(existing_column);

-- If something went wrong:
-- DROP TABLE orders;
-- ALTER TABLE orders_pre_migration RENAME TO orders;
```

Instant dev environments, UAT cycles and zero-downtime data fixes are all excellent use cases. The feature is great. Using it without understanding the lifecycle is where teams get into trouble.

If you want to go further on cost reduction for dev workloads, pairing a clone strategy with DuckDB is worth exploring: [How to Query Snowflake in DuckDB and Cut Your Bill While Doing It](/articles/query-snowflake-in-duckdb-cut-costs).

[ADD YOUR OWN: the clone checklist or naming convention your team actually uses, or a short story of the migration where a pre-migration clone saved you]

## Frequently asked questions

### Does zero-copy cloning in Snowflake really cost nothing?

At creation, yes. The cost begins the moment either side is modified, through copy-on-write. In active dev environments that change frequently, storage costs can grow significantly over weeks, and Time Travel retention on the clone compounds this.

### Do data masking policies transfer when you clone a table?

No. Masking policies are not inherited by clones. Sensitive columns are exposed in plain text on the clone unless you explicitly re-apply policies after creation. Treat clone creation and policy application as a single atomic operation.

### Can I use Time Travel on a clone to go back before it was created?

No. A clone's Time Travel history starts at its creation date. For history before the clone was created, query the source table directly.

### Are Snowflake streams copied when you clone a table?

No. Streams are not part of the clone operation. Create them explicitly on the clone if your pipeline depends on CDC. Tasks are cloned but start suspended.

### How do I audit all clones in my Snowflake account?

Query `snowflake.account_usage.tables` filtering on `clone_group_id IS NOT NULL`. Tag clones at creation with JSON metadata in the `COMMENT` field (owner, expiry, purpose) to make audits actionable.

### What's the best practice for cloning production for dev?

Clone, then immediately: reduce Time Travel retention to 0 or 1 day, re-apply all masking and row access policies, set a resource monitor on dev warehouses, and tag the clone with an expiry date in the `COMMENT` field.

## Further reading

- [Snowflake docs: cloning objects](https://docs.snowflake.com/en/user-guide/object-clone)
- [Snowflake dynamic data masking docs](https://docs.snowflake.com/en/user-guide/security-column-ddm-intro)
- [Snowflake Time Travel docs](https://docs.snowflake.com/en/user-guide/data-time-travel)
- [Snowflake resource monitors docs](https://docs.snowflake.com/en/user-guide/resource-monitors)
- [Snowflake Streams](https://docs.snowflake.com/en/user-guide/streams-intro)
