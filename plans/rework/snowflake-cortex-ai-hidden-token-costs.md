# Snowflake Cortex AI Hidden Token Costs: Where They Hide and How to Monitor Them

> **Editor notes**
>
> - **Merge:** `snowflake-cortex-token-usage-monitoring` (being 301'd here) is folded in as the new section "Monitoring and alerting on Cortex spend". I brought over what this post lacked: the usage-view coverage map, the monthly-by-user and agent-attribution queries, the three automation patterns (account-level Snowflake Alert, per-user limits via hourly Tasks, runaway query cancellation with `SYSTEM$CANCEL_QUERY`), the email-delivery prerequisite, and three gotchas (5-minute latency gap, QUERY_TAG attribution, MCP metadata in the agent view). I did **not** bring over its "daily credit burn by function and model" query (this post already has one), its intro, its TL;DR, its principle quote (merged into the closing section) or its FAQ (every answer repeated the body). Its related-reading links to the MCP server guide and cost comparison are kept.
> - **Must resolve before publishing: the two posts disagree on the canonical view.** This post's daily query uses `CORTEX_FUNCTIONS_USAGE_HISTORY` with a `credits_used` column and warns against summing it with `CORTEX_AISQL_USAGE_HISTORY`. The monitoring post says the newer `CORTEX_AI_FUNCTIONS_USAGE_HISTORY` (column `credits`) is canonical. I kept both code blocks unchanged, so the merged post currently names two different "canonical" views. Pick one, align the column names across all queries, and fix the prose in "Per-agent attribution and the daily function query" and the first gotcha to match.
> - **Code issues to check (I did not change the code):** (1) the label-overhead query ends in `LIMIT 5000` after an aggregate, so it scans and counts tokens for the whole table and returns one row; to sample, use `SAMPLE (5000 ROWS)` or a subquery. (2) `AI_COUNT_TOKENS` is called with two arguments (model, text); confirm the current signature. (3) The `AI_OBSERVABILITY_EVENTS` query uses flat columns (`agent_name`, `input_tokens`, `event_timestamp`); confirm these exist, since event tables often store attributes in JSON. (4) The alert has `WAREHOUSE = ` with no value and will not compile. (5) Column names in `CORTEX_FUNCTIONS_USAGE_HISTORY` and `CORTEX_AGENT_USAGE_HISTORY` (`credits_used`, `total_credits`, `request_id`). (6) The long-running exemption paragraph mixes role revocation and query cancellation; confirm which procedure the `NOT ARRAY_CONTAINS` check belongs in.
> - **Facts to verify:** AI Credits introduced April 2026 at $2.00 global / $2.20 regional; Search serving at 6.3 AI Credits per GB per month; 970 tokens per page; 50 tokens per second of audio; the 1.18 billion record / nearly $5,000 example (no source linked; add one); `CORTEX_ENABLED_CROSS_REGION` values; Cortex Search embedding cost appearing in `CORTEX_SEARCH_SERVING_USAGE_HISTORY`; `CORTEX_AGENT_USAGE_HISTORY` GA on 25 Feb 2026; `CORTEX_AI_FUNCTIONS_USAGE_HISTORY` availability (the monitoring post said "GA since March 2026" in its TL;DR but "Nov 17 2025" in its table); "CoWork" as an agent invocation path; the 10 to 60x model price spread and the 60 to 80% and 50 to 90% savings figures.
> - Other changes: removed the TL;DR, turned bold gotcha pseudo-headings and "The One Principle" into real headings, added language tags, removed nearly all em-dashes. The monitoring post used relative links (`/articles/...`); I kept them as written in Related reading, but check they resolve.

This post is for Snowflake engineers running Cortex AI functions, Cortex Search or Cortex Agents who want to know why the bill doesn't match the demo. It maps the three cost meters, shows the maths behind each hidden cost, and gives you the SQL and alerting patterns to catch them before your finance team does.

The demo works. It always does. You call `AI_CLASSIFY` on a sample of 10,000 rows, the credits barely move, and someone in the room says "this is so much cheaper than sending data to an external API." Three weeks later your first real workload hits production (a million rows, five label classes, a moderately verbose model) and the bill is three times what you modelled. Nobody touched the model. Nobody changed the prompt. The data volume was planned. What went wrong?

The short answer: Snowflake Cortex AI has three independent cost meters running in parallel, and two of them are nearly invisible until you go looking. The warehouse credit line your resource monitors watch is only one of the three. The other two, AI token consumption and always-on serving compute, accumulate quietly in tables most engineers haven't queried yet. After the [April 2026 introduction of AI Credits as a separate billing currency](https://docs.snowflake.com/en/user-guide/snowflake-cortex/pricing), the gap between what teams expect to pay and what lands on the invoice got wider, not narrower.

![The three Cortex AI billing layers: warehouse compute, AI token consumption and serving compute](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/08/cortex_billing_layers.png?resize=943%2C504)

## Why the demo lied to you

The confusion starts with how Snowflake traditionally teaches cost intuition. For years the mental model was: bigger warehouse, more credits, more cost. You learned to right-size warehouses, use auto-suspend and watch the METERING_HISTORY view. That model works fine for compute-heavy SQL. It actively misleads you for Cortex AI.

When you run a Cortex AI function, [the warehouse compute cost still applies](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-cost): your virtual warehouse is active while the query runs, so those credits accumulate. But the AI token charges are separate, billed in a different currency against a different meter, and they show up in different Account Usage views. A demo on a SMALL warehouse processing 10,000 rows barely registers on either meter. A production run of one million rows with a frontier model is a completely different animal.

One well-documented real-world example: a team processed 1.18 billion records using Cortex Functions and received a single-query bill of nearly $5,000, almost entirely from token costs, with minimal warehouse compute. Their resource monitors never triggered, because resource monitors don't watch the AI token meter. The bill simply appeared.

The April 2026 billing restructure added another wrinkle. Snowflake introduced **AI Credits** as a separate billing currency, flat-priced at $2.00 per credit for global routing or $2.20 for regional routing, independent of your Snowflake edition. An Enterprise customer and a Standard customer pay exactly the same rate for AI inference, but the two credit types appear as separate line items and need separate monitoring logic. If you built a cost dashboard before April 2026, it is almost certainly incomplete.

## The token inflation you're not accounting for

Most engineers assume tokens billed equals tokens in my text. For `AI_COMPLETE` with a hand-written prompt, that is roughly correct. For the structured AI functions (`AI_CLASSIFY`, `AI_SENTIMENT`, `AI_FILTER`, `AI_AGG`, `AI_SUMMARIZE`, `AI_TRANSLATE`) it is wrong in ways the documentation buries in a footnote.

According to Snowflake's cost documentation, these functions **add a system prompt to your input text before sending it to the model**. The billed token count is therefore always higher than the number of tokens in the text you provide. You pay for the system prompt on every row. You have no visibility into how long it is. You cannot opt out.

For `AI_CLASSIFY` the hidden cost compounds: **your label list, descriptions and examples are counted as input tokens for every record processed, not once per call**. With five label classes and 30-word descriptions each, you're paying for roughly 150 extra tokens on every row. Run that against a million-row table and you've added 150 million tokens of cost that had nothing to do with your data. A five-class classifier with verbose descriptions can multiply your expected token count by 2 to 4 times.

![How AI_CLASSIFY label descriptions inflate input tokens on every row](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/08/classify_token_blowup.png?resize=943%2C504)

The fix is to measure before you scale. Snowflake provides an `AI_COUNT_TOKENS` function that reports token counts without incurring LLM charges. Use it on a sample to calibrate your label overhead before committing to a full-table run. Replace `your_table`, `your_text_column` and the category string with your own:

```sql
-- Estimate label overhead before running AI_CLASSIFY at scale
SELECT
  COUNT(*) AS sample_rows,
  AVG(SNOWFLAKE.CORTEX.AI_COUNT_TOKENS(
    'llama3.1-8b',
    your_text_column
  )) AS avg_text_tokens,
  -- Add your label string manually to see the combined token count
  AVG(SNOWFLAKE.CORTEX.AI_COUNT_TOKENS(
    'llama3.1-8b',
    your_text_column || ' CATEGORIES: positive, negative, neutral, urgent, spam'
  )) AS avg_with_labels_tokens
FROM your_table
LIMIT 5000;
```

The gap between `avg_text_tokens` and `avg_with_labels_tokens` is your label overhead per row. Multiply by row count and by the per-million-token rate for your chosen model to get a cost estimate before you fire the real query. It takes five minutes and can prevent a four-figure surprise.

[ADD YOUR OWN: the output of this query on one of your own tables (avg_text_tokens vs avg_with_labels_tokens), and the cost estimate you worked out from it]

Model selection is still the single largest cost lever. The same classification workload can differ by 10 to 60 times in price depending on which model you choose.

## The two-currency problem

Before you build a cost dashboard, you need to know which features bill in which currency, because the monitoring SQL differs by type.

| Cortex Feature | Credit Type | Billing Dimension | Primary Usage View |
| --- | --- | --- | --- |
| AI Functions (AI_COMPLETE, AI_CLASSIFY, AI_EMBED, etc.) | AI Credit | Per million tokens (input + output) | `CORTEX_FUNCTIONS_USAGE_HISTORY` |
| Cortex Agents | AI Credit | Per million tokens; additive across sub-calls | `CORTEX_AGENT_USAGE_HISTORY` |
| Cortex Search (serving) | AI Credit | Per GB indexed per month, continuous | `CORTEX_SEARCH_SERVING_USAGE_HISTORY` |
| Cortex Search (embedding) | AI Credit | Per token on insert/update | `CORTEX_SEARCH_SERVING_USAGE_HISTORY` |
| AI Parse Doc | AI Credit | Per 1,000 pages; each page = 970 tokens | `CORTEX_DOCUMENT_PROCESSING_USAGE_HISTORY` |
| Cortex Analyst API (standalone) | Platform Credit | Per 1,000 messages | `METERING_DAILY_HISTORY` |
| Cortex Fine-tuning | Platform Credit | Per compute job | `METERING_DAILY_HISTORY` |
| Virtual Warehouse (any query) | Platform Credit | Per second, 60-second minimum | `WAREHOUSE_METERING_HISTORY` |

The important detail: **Cortex AI Functions like `AI_COMPLETE` run two meters at once**. You pay AI Credits for the tokens and Platform Credits for the warehouse time your query consumed. A query that takes 30 seconds on a MEDIUM warehouse and processes 500,000 tokens bills on two separate ledgers, and neither cancels the other. Snowflake recommends [using no larger than a MEDIUM warehouse](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-cost) for Cortex AI calls, because a larger warehouse doesn't speed up token processing. It just burns more Platform Credits for the same result.

## The Cortex Search idle tax

Cortex Search is architecturally different from the AI SQL functions. It is a managed vector-search service: you create a search service over a table, Snowflake indexes it, and you query it through a REST call or through Cortex Agents. The billing reflects that, and it is the most surprising line item for teams that build and then deprioritise a search-based RAG feature.

Cortex Search serving compute bills continuously per GB of indexed data per month while the service is resumed, whether or not any queries are running. The Snowflake pricing documentation says it plainly: *"A running search service incurs costs even when it isn't serving queries."* Based on the Service Consumption Table, the serving rate is 6.3 AI Credits per GB per month. At the global AI Credit price of $2.00, that is $12.60 per GB per month, at rest.

Here is the maths for a team with several Cortex Search services:

| Scenario | Indexed Data (GB) | AI Credits/mo | Cost/mo (global) |
| --- | --- | --- | --- |
| Single knowledge base (small) | 20 GB | 126 Cr | $252 / mo |
| Single knowledge base (medium) | 70 GB | 441 Cr | $882 / mo |
| 5 domain services × 70 GB | 350 GB | 2,205 Cr | $4,410 / mo |
| Dev service (left running) | 30 GB | 189 Cr | $378 / mo (wasted) |

The dev service row is where most teams first notice the problem. Someone spun up a search service in a development environment to prototype a chatbot, priorities shifted, and the service kept running. It doesn't consume query tokens because nobody is hitting it. It consumes serving compute because it exists. That is $378 a month for a service that produced zero output in that billing period.

![Cortex Search serving cost accumulating on an idle service with no queries](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/08/cortex_search_idle.png?resize=949%2C504&ssl=1)

The mitigation is simple: configure `AUTO_SUSPEND` on any search service with predictable idle windows, and manually suspend development services when a feature is deprioritised. Snowflake Batch Search is an alternative for workloads that don't need real-time retrieval; its serving compute runs only during the batch job, not continuously.

[ADD YOUR OWN: a CORTEX_SEARCH_SERVING_USAGE_HISTORY result or billing screenshot for one of your search services during a period with no queries, showing the credits it still used]

## Cortex Agents: the cost multiplier nobody drew on the whiteboard

Cortex Agents are billed per million tokens, in AI Credits, at rates set by the underlying model. That sounds simple. The complication is that agents orchestrate multi-step workflows, and every step that invokes a sub-service generates its own token consumption. [Snowflake's pricing docs state it directly](https://docs.snowflake.com/en/user-guide/snowflake-cortex/pricing): costs are additive across the underlying services the agent invokes.

A realistic agent loop looks like this:

1. The agent receives a user question (input tokens).
2. It calls Cortex Search to retrieve context (embedding tokens plus serving compute).
3. It calls Cortex Analyst to generate SQL (Analyst tokens).
4. It executes the SQL on a warehouse (Platform Credits).
5. It calls an LLM to formulate the final answer (more input and output tokens).

The user sees a single response. Your billing dashboard sees five separate line items, split across two credit types and spread across four usage views.

### Per-agent attribution and the daily function query

Standard monitoring through `CORTEX_FUNCTIONS_USAGE_HISTORY` doesn't give agent-specific breakdowns. For token-level visibility per agent, query `SNOWFLAKE.LOCAL.AI_OBSERVABILITY_EVENTS`, a system table that captures token counts, models used, timing and execution context for each agent invocation. It isn't surfaced by default in the Snowflake UI; you have to query it directly. The query below sums input and output tokens per agent, model and day over the last 30 days, and needs ACCOUNTADMIN or the SNOWFLAKE_TELEMETRY privilege:

```sql
-- Per-agent token cost attribution
-- Requires ACCOUNTADMIN or SNOWFLAKE_TELEMETRY privilege
SELECT
  agent_name,
  model_name,
  DATE_TRUNC('day', event_timestamp) AS event_day,
  SUM(input_tokens)                  AS total_input_tokens,
  SUM(output_tokens)                 AS total_output_tokens,
  SUM(input_tokens + output_tokens)  AS total_tokens
FROM SNOWFLAKE.LOCAL.AI_OBSERVABILITY_EVENTS
WHERE event_timestamp >= CURRENT_DATE - 30
GROUP BY 1, 2, 3
ORDER BY total_tokens DESC;
```

For AI SQL functions, your canonical daily monitoring query should look like the one below. It breaks the last 30 days down by function and model and converts credits to an estimated dollar figure at the $2.00 global rate (change the multiplier to 2.20 if your account uses regional routing):

```sql
-- Cortex AI function cost by model and function — last 30 days
-- Use CORTEX_FUNCTIONS_USAGE_HISTORY as the single source; do NOT sum
-- across CORTEX_AISQL_USAGE_HISTORY and CORTEX_FUNCTIONS_USAGE_HISTORY together
SELECT
  DATE_TRUNC('day', start_time)   AS usage_day,
  function_name,
  model_name,
  SUM(input_tokens)               AS input_tokens,
  SUM(output_tokens)              AS output_tokens,
  SUM(credits_used)               AS ai_credits,
  ROUND(SUM(credits_used) * 2.00, 2) AS est_cost_usd
FROM SNOWFLAKE.ACCOUNT_USAGE.CORTEX_FUNCTIONS_USAGE_HISTORY
WHERE start_time >= CURRENT_DATE - 30
GROUP BY 1, 2, 3
ORDER BY ai_credits DESC;
```

One critical warning from Snowflake's community documentation: the views `CORTEX_AISQL_USAGE_HISTORY`, `CORTEX_FUNCTIONS_USAGE_HISTORY` and an incremental metering path all overlap. **Summing them produces double-counts.** Pick one canonical view per service type and reconcile totals against the matching service type in `METERING_DAILY_HISTORY`.

## Non-text inputs: the per-page and per-second trap

If your team uses Cortex for document intelligence (contract review, PDF extraction, audio transcription), the token model changes again. `AI_PARSE_DOCUMENT` and `AI_EXTRACT` bill by page rather than by text token: each page counts as **970 tokens**. A 50-page contract is 48,500 tokens before a single word of your prompt or the model's output enters the meter.

Audio bills at **50 tokens per second**. A one-hour customer support call is 180,000 audio tokens before output tokens are added. At frontier model rates, an hour of audio can cost far more than a thousand-word document.

The implication for pipeline design is to always pre-filter. Before sending a document to `AI_EXTRACT`, check the page count. Before sending audio to a transcription function, check the duration. For PDFs, page-level sampling (sending only the pages likely to contain the target information) can reduce cost by 60 to 80% compared with sending the full document.

## Monitoring and alerting on Cortex spend

Knowing where the costs live is half the job. The other half is a monitoring stack that catches them while they're happening: the right usage views, plus three automation patterns.

### Which usage view covers what

Snowflake has iterated on these views several times since Cortex launched, and as of mid-2026 they have distinct coverage. Using the wrong one doesn't produce an error; it just produces incomplete data.

![Map of the Cortex usage views and which services each one covers](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/monitoring_views_map.png?resize=943%2C504&ssl=1)

| View | Covers | Latency | Available Since |
| --- | --- | --- | --- |
| `CORTEX_AI_FUNCTIONS_USAGE_HISTORY` | All AI SQL functions: AI_COMPLETE, AI_CLASSIFY, AI_SUMMARIZE, AI_SENTIMENT, AI_TRANSLATE, AI_FILTER, AI_EXTRACT, AI_PARSE_DOCUMENT, AI_AGG, AI_EMBED_TEXT | 2 to 5 min | Nov 17 2025 |
| `CORTEX_AGENT_USAGE_HISTORY` | Cortex Agents invoked via the Agent API or CoWork. One row per agent request, includes per-tool sub-call breakdown | Near real-time | Feb 25 2026 (GA) |
| `AI_OBSERVABILITY_EVENTS` (SNOWFLAKE.LOCAL) | Agent traces and spans; Cortex Search request logs (if REQUEST_LOGGING enabled); CoCo spans for every prompt | Varies by service | Rolling |
| `CORTEX_AISQL_USAGE_HISTORY` | Older view, still present. Overlaps with CORTEX_AI_FUNCTIONS_USAGE_HISTORY. **Do not sum both.** | Use new view instead | Legacy |
| `CORTEX_SEARCH_SERVING_USAGE_HISTORY` | Cortex Search serving compute (the continuous GB/month charge) | Account Usage latency | On GA |

[Snowflake's AI Observability docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/ai-observability) are explicit that built-in AI SQL functions like `AI_COMPLETE` and `AI_CLASSIFY` do *not* write traces to `AI_OBSERVABILITY_EVENTS`. The observability table is for agents, CoCo prompts and search requests, where you need conversation-level detail rather than credit totals. Cortex Search writes there only when `REQUEST_LOGGING` is enabled on the service.

### Monthly spend by user

Joining to `USERS` gives you email and default role, which makes it much easier to follow up with a specific person when their consumption spikes.

```sql
-- Monthly credit consumption by user — last 3 months
SELECT
  DATE_TRUNC('month', h.start_time)  AS usage_month,
  u.name                             AS user_name,
  u.email,
  u.default_role,
  SUM(h.credits)                     AS ai_credits,
  COUNT(DISTINCT h.query_id)         AS distinct_queries
FROM SNOWFLAKE.ACCOUNT_USAGE.CORTEX_AI_FUNCTIONS_USAGE_HISTORY h
JOIN SNOWFLAKE.ACCOUNT_USAGE.USERS u ON h.user_id = u.user_id
WHERE h.start_time >= DATEADD('month', -3, CURRENT_TIMESTAMP())
GROUP BY 1, 2, 3, 4
ORDER BY usage_month DESC, ai_credits DESC;
```

### Agent attribution from CORTEX_AGENT_USAGE_HISTORY

Each row in `CORTEX_AGENT_USAGE_HISTORY` covers one agent request and includes sub-call detail, so you can see which tool leg (Analyst, Search, SQL) consumed the most credits within each request. This query rolls requests, credits and tokens up by agent, user and day:

```sql
-- Agent credit attribution by agent and user — last 30 days
SELECT
  DATE_TRUNC('day', start_time)  AS usage_day,
  agent_id,
  user_id,
  SUM(total_credits)             AS ai_credits,
  COUNT(request_id)              AS requests,
  SUM(input_tokens)              AS input_tokens,
  SUM(output_tokens)             AS output_tokens
FROM SNOWFLAKE.ACCOUNT_USAGE.CORTEX_AGENT_USAGE_HISTORY
WHERE start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
GROUP BY 1, 2, 3
ORDER BY usage_day DESC, ai_credits DESC;
```

If you've connected AI agents to Snowflake through an [MCP server](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide), those requests still flow through the same Cortex infrastructure and appear in this view. You don't need a separate monitoring path for MCP-invoked agents.

### Pattern 1: account-level monthly spend alert

Resource Monitors don't cover AI Credits, so you need a separate alerting mechanism. Snowflake Alerts, the native scheduled condition-check object, are the right tool. The pattern is a NOTIFICATION INTEGRATION wired to email recipients, an Alert that fires hourly against the usage view, and a stored procedure that sends the email and prevents duplicate alerts within a calendar month.

![Flow of the hourly Snowflake Alert checking monthly AI spend and calling the email procedure](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/alert_task_flow.png?resize=943%2C519&ssl=1)

The key detail from Snowflake's docs: the alert tracks an `AI_FUNCTIONS_ALERT_STATE` table so only one email fires per calendar month per alert name. Without that guard, a threshold breach at 9 AM would send 15 hourly emails by midnight. The stored procedure checks the state table first, inserts a record if none exists for the current month, then sends the notification.

For `SYSTEM$SEND_EMAIL` to work, every recipient address must meet three conditions at once: it is listed in `ALLOWED_RECIPIENTS` on the notification integration, it is used as the `to_email` argument in the procedure body, and it is set as the verified `EMAIL` field on a Snowflake user in the account. Missing any one produces a generic "not allowed" error with no indication of which condition failed.

The minimal setup below creates the integration and an hourly alert. Set your own warehouse after `WAREHOUSE =`, replace the recipient address, and change the 1000-credit threshold in both places. The `SEND_MONTHLY_SPEND_ALERT` procedure is the one described above.

```sql
-- Minimal alert setup — replace 1000 with your actual threshold
CREATE OR REPLACE NOTIFICATION INTEGRATION ai_cost_alerts
  TYPE = EMAIL
  ENABLED = TRUE
  ALLOWED_RECIPIENTS = ('finops@yourcompany.com');

-- Alert: fires every hour if monthly spend exceeds threshold
CREATE OR REPLACE ALERT ai_functions_monthly_spend_alert
  WAREHOUSE = 
  SCHEDULE = 'USING CRON 0 * * * * UTC'
  IF (EXISTS (
    SELECT 1
    FROM SNOWFLAKE.ACCOUNT_USAGE.CORTEX_AI_FUNCTIONS_USAGE_HISTORY
    WHERE start_time >= DATE_TRUNC('month', CURRENT_TIMESTAMP())
    HAVING SUM(credits) > 1000  -- adjust threshold
  ))
  THEN
    CALL SEND_MONTHLY_SPEND_ALERT(1000);

ALTER ALERT ai_functions_monthly_spend_alert RESUME;
```

[ADD YOUR OWN: the alert email you received from this setup (redacted), or the exact "not allowed" error SYSTEM$SEND_EMAIL returned before all three recipient conditions were met]

### Pattern 2: per-user monthly spending limits

Account-level alerts tell you the house is on fire. Per-user limits stop any single user from starting it. The implementation uses a role gate: access to Cortex AI functions flows through a dedicated `AI_FUNCTIONS_USER_ROLE`, and an hourly Task revokes that role from any user who exceeds their monthly credit budget. A separate monthly Task restores it on the first of each month.

![Per-user Cortex AI spend panel against individual monthly limits](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/per_user_spend_panel.png?resize=943%2C504&ssl=1)

The critical prerequisite, which the docs call out explicitly, is to **revoke `SNOWFLAKE.CORTEX_USER` from the PUBLIC role** before setting any per-user limits. By default every user in a Snowflake account has access to Cortex AI through PUBLIC. If you don't close that hole first, a user who hits their limit on `AI_FUNCTIONS_USER_ROLE` can switch to any other role that still carries the database role, and the hourly revocation does nothing.

The script below closes the PUBLIC bypass, audits which roles still hold `CORTEX_USER`, creates the gated role and grants access to two example users with their own limits. Swap in your own user names and limits; the full `GRANT_AI_FUNCTIONS_ACCESS` procedure is in the Snowflake docs.

```sql
-- Step 1: Close the PUBLIC role bypass (run as ACCOUNTADMIN)
USE ROLE ACCOUNTADMIN;
REVOKE DATABASE ROLE SNOWFLAKE.CORTEX_USER FROM ROLE PUBLIC;

-- Audit: confirm no other roles carry it unexpectedly
SHOW GRANTS OF DATABASE ROLE SNOWFLAKE.CORTEX_USER;

-- Step 2: Create the gated access role
CREATE ROLE IF NOT EXISTS AI_FUNCTIONS_USER_ROLE;
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE AI_FUNCTIONS_USER_ROLE;

-- Step 3: Grant access to specific users with individual credit limits
-- (See full GRANT_AI_FUNCTIONS_ACCESS procedure in Snowflake docs)
CALL GRANT_AI_FUNCTIONS_ACCESS('alice_analyst', 1000);  -- 1000 AI Credits/month
CALL GRANT_AI_FUNCTIONS_ACCESS('bob_engineer',  2000);  -- 2000 AI Credits/month
```

The access control table (`AI_FUNCTIONS_ACCESS_CONTROL`) tracks each user's monthly limit, active status, revocation timestamp and revocation reason. When the hourly `MONITOR_AI_FUNCTIONS_SPENDING` task runs, it joins that table to `CORTEX_AI_FUNCTIONS_USAGE_HISTORY`, finds users who have exceeded their limit for the current month, and calls `REVOKE ROLE AI_FUNCTIONS_USER_ROLE FROM USER <name>` for each. On the first of the next month, `MONTHLY_AI_FUNCTIONS_ACCESS_REFRESH` restores the role to everyone in the table with no manual step.

If some users legitimately need to run extended Cortex jobs, create a separate `AI_FUNCTIONS_USER_LONG_RUNNING_ROLE` and add a `NOT ARRAY_CONTAINS` check in the procedure's `HAVING` clause to exclude queries run under that role. Users adopt it explicitly when they need it, which keeps the default enforcement tight.

### Pattern 3: runaway query detection and cancellation

Runaway queries (AI function calls on unexpectedly large tables, or agents caught in loops) can accumulate significant credits in a single hour. Detection works because `CORTEX_AI_FUNCTIONS_USAGE_HISTORY` splits usage into one-hour windows and includes an `IS_COMPLETED` flag. A query still running across several hourly windows has `IS_COMPLETED = FALSE` on all its rows. Aggregate credits by `QUERY_ID`, check that no row is completed, and if the sum exceeds your threshold, cancel it.

The CTE below looks back 48 hours and returns running queries over a 50-credit threshold, with the user name attached. Change the 50 to your own threshold.

```sql
-- Core detection CTE — finds running queries that have already exceeded the threshold
WITH query_credits AS (
  SELECT
    h.query_id,
    ANY_VALUE(h.user_id)        AS user_id,
    SUM(h.credits)              AS total_credits,
    MIN(h.start_time)           AS first_seen,
    BOOLOR_AGG(h.is_completed)  AS any_completed
  FROM SNOWFLAKE.ACCOUNT_USAGE.CORTEX_AI_FUNCTIONS_USAGE_HISTORY h
  WHERE h.start_time >= DATEADD('hour', -48, CURRENT_TIMESTAMP())
  GROUP BY h.query_id
  HAVING SUM(h.credits) > 50          -- your credit threshold
     AND BOOLOR_AGG(h.is_completed) = FALSE  -- still running
)
SELECT qc.query_id, u.name AS user_name, qc.total_credits, qc.first_seen
FROM query_credits qc
LEFT JOIN SNOWFLAKE.ACCOUNT_USAGE.USERS u ON qc.user_id = u.user_id;
```

The [full implementation in Snowflake's cost management docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/ai-func-cost-management) wraps this in a stored procedure that calls `SYSTEM$CANCEL_QUERY` for each hit, logs cancellation failures as `CANCEL FAILED`, and sends an email with the query ID, user, functions invoked, credits consumed and warehouse ID. Cancelling a query stops further accumulation but does not refund credits already billed up to that point, so early detection matters.

## The gotchas nobody warns you about

### Resource monitors don't cover AI token spend

Resource monitors watch warehouse compute credits. They have no visibility into AI Credit consumption. A runaway `AI_CLASSIFY` job on a large table will not trigger your existing budget alerts. You need separate alerting on the usage history views, wired to a Snowflake Task or Alert and a notification integration, as shown above.

### The regional routing setting raises every AI bill by 10%

If your account has `CORTEX_ENABLED_CROSS_REGION` set to `DISABLED` or a specific regional setting for data residency, you pay $2.20 per AI Credit instead of $2.00. That is a 10% tax on every token across every Cortex AI feature, and it is an account-level parameter many teams set once during a compliance review and never revisit against their cost model.

### Standalone Cortex Analyst still bills in Platform Credits

If you call Cortex Analyst through the REST API directly rather than through Cortex Agents, it bills per 1,000 messages at Platform Credit rates, which vary by Snowflake edition. The same Analyst call made through a Cortex Agent bills in AI Credits. Same feature, two billing regimes, depending on how you invoke it.

### Materializing AI results is almost always cheaper than recomputing them

Pipelines that call `AI_CLASSIFY` or `AI_SENTIMENT` inside a scheduled task often reprocess unchanged records on every run. The AI functions have no idea which records changed since the last run. Join against your source table's `UPDATED_AT` column, write results to a separate table, and pass only new or modified rows to the AI function. Applied consistently, this can reduce ongoing AI Credit consumption by 50 to 90% for stable datasets.

### Cortex Guard adds its own token cost on top of AI_COMPLETE

If you use Cortex Guard to filter model outputs for safety (sensible for user-facing applications), it bills separately from the underlying `AI_COMPLETE` call. Cortex Guard's input token count is based on the number of tokens in AI_COMPLETE's output. Longer responses therefore cost you twice: once when generated, and again when scanned by the guard.

### Search serving compute is not in the functions view

The continuous GB-per-month charge for Cortex Search lives in `CORTEX_SEARCH_SERVING_USAGE_HISTORY`, not in the AI functions usage view. If your monitoring only touches the functions view, you have a blind spot on one of the most surprising items in the Cortex stack. Add a separate daily roll-up against the search serving view and alert on it separately.

### The 5-minute latency leaves a gap in hourly checks

The usage view has up to 5 minutes of latency, so an hourly Task that fires at :00 won't see credits consumed at :58. For runaway detection that is mostly fine, because you're looking for hours of accumulation. For per-user limits on very tight budgets, factor it in: a user who hits their limit at 11:58 PM may run one more minute before the midnight Task catches them.

### QUERY_TAG is your best attribution tool, if you set it

The AI functions usage view includes a `QUERY_TAG` column. If teams run `ALTER SESSION SET QUERY_TAG = 'project:data-quality team:analytics'` before their Cortex calls, you can group spend by project or team without any schema changes. Without it you're attributing by user alone, which falls apart when service accounts or shared roles invoke the functions.

### The agent view doesn't break out MCP-specific metadata

Agents invoked through the [MCP server](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide) appear in `CORTEX_AGENT_USAGE_HISTORY`, but the `METADATA` column carries interface and role context that varies by invocation path. To separate MCP-sourced agent calls from direct API calls, parse `METADATA` and filter by interface type. `REQUEST_ID` is the correlation key for tying a row to a specific conversation turn, and for joining to traces in `AI_OBSERVABILITY_EVENTS`.

[ADD YOUR OWN: a screenshot of the daily function-and-model query (or a dashboard built on it) from your account, with the top function-model combination highlighted]

## Measure before you scale

Treat Cortex AI cost engineering the same way you treat warehouse sizing: measure before you scale, not after. The token meter doesn't have a circuit breaker unless you build one. The views exist and the alert patterns are documented, so the cost of building that circuit breaker is an afternoon of setup, which is far less than the first surprise bill.

**Related reading:** [Cortex Search RAG guide](https://dataengineerhub.blog/articles/build-rag-snowflake-cortex-search-guide) · [Cortex Code and dbt optimization](https://dataengineerhub.blog/articles/snowflake-cortex-code-dbt-optimization-guide) · [Governing AI Agents in Snowflake](https://dataengineerhub.blog/articles/governing-ai-agents-snowflake-coco-mcp-security) · [Using MCP Servers with Snowflake](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide) · [Snowflake Cortex cost comparison](/articles/snowflake-cortex-cost-comparison) · [AI coding agents and pipeline security](https://dataengineerhub.blog/articles/ai-coding-agents-pipeline-metadata-security) · [What actually works when building AI agents](https://dataengineerhub.blog/articles/what-actually-works-building-ai-agents) · [Snowflake Cortex AI cost docs (official)](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-cost) · [Snowflake AI pricing and AI Credits (official)](https://docs.snowflake.com/en/user-guide/snowflake-cortex/pricing) · [Snowflake Cortex AI cost management (official)](https://docs.snowflake.com/en/user-guide/snowflake-cortex/ai-func-cost-management) · [Snowflake AI Observability docs (official)](https://docs.snowflake.com/en/user-guide/snowflake-cortex/ai-observability)
