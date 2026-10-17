# Snowflake Cortex Code Cost Control: Setting Per-User Credit Limits

> **Editor notes**
>
> - Changed: dropped "2026 Guide" from the title; replaced bold H3 pseudo-headings with a `##`/`###` hierarchy; removed em-dashes; removed a stray paragraph containing only the word "sql" above the monitoring query; merged the separate "full syntax" link lines into the sections they belong to; added short prose before the longer code blocks. All code, parameter names, numbers and opinions are unchanged.
> - Broken links to fix: three internal links point to `#`: "What Is Snowflake Cortex Code and How I Taught Myself to Use It", "How I Wired Snowflake's Native dbt Projects to Airflow" and "Snowflake Cortex Pricing: What Every Data Engineer Should Know". The intro link labelled "Cortex Code" points to `/articles/snowflake-cortex-ai-complete-guide-2026`; check that is the intended target.
> - Facts to check (I checked the Snowflake docs page on 2026-10-17 where noted):
>   - "Exactly two parameters": the cost controls page now lists a third, `CORTEX_CODE_DESKTOP_DAILY_EST_CREDIT_LIMIT_PER_USER`, for Cortex Code Desktop. The post, the tables and the practical setup should probably cover it.
>   - "Set by ACCOUNTADMIN only": the docs say ACCOUNTADMIN or a role with sufficient privileges to modify the account or user object.
>   - The monitoring query will likely fail. `SNOWFLAKE.ACCOUNT_USAGE.CORTEX_FUNCTIONS_USAGE_HISTORY` has columns `TOKENS` and `TOKEN_CREDITS`, not `tokens_used` and `credits_used`, and the docs say this view is no longer updated (they point to `CORTEX_AISQL_USAGE_HISTORY`). It may also not include Cortex Code usage at all; check the Cortex Code observability page for the right view. I did not change the code.
>   - "Snowflake will notify users before charges formally begin" for Snowsight: the billing page now simply says Snowsight usage is billed on token consumption, so this sentence is probably outdated.
>   - `CORTEX_AGENT_USER` as the role that grants Cortex Code access: I could not confirm this role name. Check which database role or privilege actually gates Cortex Code.
>   - The audit script is described as copied unchanged from the docs, but it has an added first comment line. Re-copy it from the docs page if you want it to match exactly.
> - Nothing cut.

This post is for Snowflake admins and data engineering leads whose teams use Cortex Code. It explains how Cortex Code is billed on each surface, the per-user credit limit parameters Snowflake provides, how to set account defaults and per-user overrides, how to audit overrides, and how to watch actual usage.

When I first started using [Cortex Code](/articles/snowflake-cortex-ai-complete-guide-2026), cost was the last thing on my mind. It's right there in the Snowsight UI, it feels like a built-in feature, and nothing in the interface tells you that tokens are being consumed behind the scenes.

Then I read the official docs properly, not just the feature overview but the cost controls section, and found something I hadn't seen covered anywhere: Snowflake has a native, dedicated [cost control](/articles/snowflake-cost-optimization-techniques-2026) system for [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/credit-usage-limit) that most people don't know exists. Two parameters, per user, per surface, which an ACCOUNTADMIN can configure in seconds. If you run Cortex Code in your account, especially with a team, you need to set these up.

[ADD YOUR OWN: what your own Cortex Code usage cost before you set limits, for example the estimated credits for a typical day or week of use, and where you found that number]

## How Cortex Code billing works

If you're new to Cortex Code, read my earlier post [What Is Snowflake Cortex Code and How I Taught Myself to Use It](#) first. It covers what the tool does and how to access it in Snowsight. This post picks up at the cost control layer.

Cortex Code runs on two surfaces, each with its own billing model:

- **Cortex Code in Snowsight**, the browser-based UI. Token-based billing tied to your existing Snowflake account. Snowflake will notify users before charges formally begin, but [AI service costs](/articles/snowflake-cortex-cost-comparison) are already accumulating underneath.
- **Cortex Code CLI**, the command-line agent. Already billing on token consumption: pay-as-you-go for existing Snowflake accounts, or a subscription for individual sign-ups.

The key point: unlike virtual warehouses, where you can set a Resource Monitor with a credit quota, Cortex Code has its own cost control parameters that Resource Monitors don't cover. You have to set them explicitly.

For the full official breakdown, see Snowflake's [Cortex Code billing documentation](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code).

## The two parameters

Snowflake provides exactly two parameters for Cortex Code cost control. Both are set by ACCOUNTADMIN only, work on a rolling 24-hour window per user, and are independent of each other.

| Parameter | Surface Controlled | Default |
|---|---|---|
| `CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER` | Cortex Code CLI | `-1` (unlimited) |
| `CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER` | Cortex Code in Snowsight | `-1` (unlimited) |

What the values mean:

| Value | Behaviour |
|---|---|
| `-1` (default) | No limit, unlimited access |
| `0` | Access blocked entirely for that user |
| Any positive number | Access blocked once estimated credits exceed that number in the past 24 hours |

Full parameter reference: [Cost controls for Cortex Code (Snowflake docs)](https://docs.snowflake.com/en/user-guide/cortex-code/credit-usage-limit).

## Setting the limits

### Account-level limits

This is the first thing I'd do: set a sensible default for every user at the account level. Anyone who goes over it is blocked until the rolling window resets. No silent runaway spend.

```sql
-- Cap all users at 20 credits per day for CLI
ALTER ACCOUNT SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 20;

-- Cap all users at 20 credits per day in Snowsight
ALTER ACCOUNT SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 20;
```

To remove an account-level limit and restore unlimited access:

```sql
ALTER ACCOUNT UNSET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER;
ALTER ACCOUNT UNSET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER;
```

For the full syntax, see [ALTER ACCOUNT (Snowflake docs)](https://docs.snowflake.com/en/sql-reference/sql/alter-account).

### Per-user overrides

A user-level setting overrides the account-level setting for that user. Everyone else keeps the account default.

```sql
-- Power user gets a higher CLI limit than the account default
ALTER USER power_user SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 50;

-- Junior analyst gets a tighter Snowsight limit
ALTER USER junior_analyst SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 5;

-- Block a service account or contractor from Snowsight entirely
ALTER USER contractor_account SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 0;
```

Setting the value to `0` blocks that user completely on that surface, which is useful for service accounts that should never use Cortex Code interactively.

To remove a user-level override and fall back to the account default:

```sql
ALTER USER junior_analyst UNSET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER;
```

For the full syntax, see [ALTER USER (Snowflake docs)](https://docs.snowflake.com/en/sql-reference/sql/alter-user).

## A practical setup for a team

Here's how I'd configure this for a typical [data engineering](https://dataengineerhub.blog/articles) team with senior engineers, analysts and a few service accounts. The script sets a 20-credit default on both surfaces, raises the CLI limit to 50 for named senior engineers, and blocks the Airflow and dbt service users on both surfaces. Replace the user names with your own.

```sql
-- Step 1: Set sensible defaults for the whole account
ALTER ACCOUNT SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 20;
ALTER ACCOUNT SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 20;

-- Step 2: Give senior engineers more headroom on CLI
ALTER USER senior_eng_1 SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 50;
ALTER USER senior_eng_2 SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 50;

-- Step 3: Block service accounts from both surfaces
ALTER USER airflow_svc SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 0;
ALTER USER airflow_svc SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 0;

ALTER USER dbt_svc SET CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER = 0;
ALTER USER dbt_svc SET CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER = 0;
```

If you run [dbt projects](https://docs.snowflake.com/en/user-guide/data-engineering/dbt-projects-on-snowflake) natively inside Snowflake, you'll already have dedicated service accounts; I covered that setup in [How I Wired Snowflake's Native dbt Projects to Airflow](#). Those same service accounts should be blocked from Cortex Code with a `0` limit.

Service accounts should never use Cortex Code. Setting them to `0` explicitly means that even if someone accidentally grants `CORTEX_AGENT_USER` to a service role, the credit limit acts as a safety net.

[ADD YOUR OWN: how you arrived at 20 credits as the default, for example what a normal day of Cortex Code use looked like for you or your team in estimated credits]

## Auditing who has custom limits

The official docs include a script that lists every user with a per-user override, which is what you need for a quarterly governance review. It runs `SHOW USERS`, loops over each user, runs `SHOW PARAMETERS` for the CLI limit in that user's scope, and keeps only rows where the level is `USER`, meaning a real override rather than the inherited account value.

```sql
-- Audit all users with a custom CLI credit limit override
EXECUTE IMMEDIATE $$
DECLARE
  current_user STRING;
  rs_users RESULTSET;
  res      RESULTSET;
BEGIN
  CREATE OR REPLACE TEMPORARY TABLE _param_overrides (user_name STRING, param_value STRING);

  SHOW USERS;
  rs_users := (SELECT "name" FROM TABLE(RESULT_SCAN(LAST_QUERY_ID())));

  FOR record IN rs_users DO
    current_user := record."name";

    EXECUTE IMMEDIATE
      'SHOW PARAMETERS LIKE ''CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER'' IN USER "' || :current_user || '"';

    INSERT INTO _param_overrides (user_name, param_value)
      SELECT :current_user, "value"
      FROM TABLE(RESULT_SCAN(LAST_QUERY_ID()))
      WHERE "level" = 'USER';
  END FOR;

  res := (SELECT * FROM _param_overrides);
  RETURN TABLE(res);
END;
$$;
```

To audit Snowsight overrides instead, swap `CORTEX_CODE_CLI_DAILY_EST_CREDIT_LIMIT_PER_USER` for `CORTEX_CODE_SNOWSIGHT_DAILY_EST_CREDIT_LIMIT_PER_USER` in the `SHOW PARAMETERS LIKE` clause. Run both regularly. The script is taken directly from the [official Snowflake cost controls page](https://docs.snowflake.com/en/user-guide/cortex-code/credit-usage-limit); I haven't modified it.

## What happens when a user hits the limit

When a user's rolling 24-hour usage goes over the threshold, that surface returns an error saying the daily credit limit has been reached. They can't use it again until enough time passes for their usage to drop below the limit. The other surface is unaffected: hitting the CLI limit doesn't lock them out of Snowsight.

Admins can raise or remove the limit at any time to restore access immediately, without waiting for the window to roll.

Tell your team before you set limits, because nobody likes a sudden block mid-workflow. Set the limits, tell people what they are, and tell them who to contact for a temporary increase.

[ADD YOUR OWN: the exact error message a user sees in the CLI and in Snowsight when the limit is reached, ideally as a screenshot, so readers can recognize it]

## Monitoring actual usage

The credit limits control access and stop runaway spend. You also want visibility into consumption before anyone hits a limit, so pair the limits with a monitoring query:

```sql
SELECT
    DATE_TRUNC('day', start_time)   AS usage_day,
    function_name,
    model_name,
    SUM(tokens_used)                AS total_tokens,
    SUM(credits_used)               AS total_credits
FROM snowflake.account_usage.cortex_functions_usage_history
WHERE start_time >= CURRENT_DATE - 30
GROUP BY 1, 2, 3
ORDER BY usage_day DESC, total_credits DESC;
```

This shows which models and functions are driving cost across the account over the last 30 days, by day. The credit limits stop the bleeding; this query tells you where it's coming from.

For more on how Snowflake bills AI functions in general (token rates, model pricing differences, and what output tokens mean for your bill), see my post [Snowflake Cortex Pricing: What Every Data Engineer Should Know](#) and the official [Snowflake Service Consumption Table](https://www.snowflake.com/legal/snowflake-service-consumption-table/), which is the source of truth for current credit rates.

## The setup in five steps

A sensible Cortex Code cost control setup takes about 10 minutes:

1. Set account-level daily limits for both CLI and Snowsight. 20 credits is a reasonable starting default.
2. Override upward for power users who need more headroom.
3. Override to `0` for all service accounts.
4. Run the audit script quarterly to catch drift as people join or leave the team.
5. Monitor `cortex_functions_usage_history` for spend patterns alongside your limits.

The alternative is the default: `-1` for every user, unlimited spend, and a bill that arrives before anyone realized the meter was running.
