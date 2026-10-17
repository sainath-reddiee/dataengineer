# Why I Stopped Using Snowflake Tasks for Orchestration

> **Editor notes**
>
> - Changed: promoted the H3-only structure to `##` sections with `###` subsections for the "still the right choice" cases; removed almost all em-dashes; turned the bare source tags (Flexera, Sonra, Monte Carlo) into inline attributions so they no longer read as pasted citations; added short prose before the two code blocks. All claims, numbers (6-task tree, 40 minutes vs 3 minutes, 1,000-task limit, weekend plus a week of migration) and code are unchanged.
> - Broken links to fix: two internal links point to `#`: "How I Wired Snowflake's Native dbt Projects to Airflow" and "Snowflake Streams and Tasks for SCD2: How I Actually Use Them". Replace with the real URLs (possibly `/articles/snowflake-dbt-projects-airflow-orchestration` and `/articles/snowflake-streams-tasks-pipeline-guide`, which are already used elsewhere in the post). The two relative `/articles/...` links also need checking against the live permalink structure.
> - Possibly outdated, please check before republishing:
>   - Retry: Snowflake docs now describe `EXECUTE TASK <root> RETRY LAST`, which restarts a failed task graph from the FAILED or CANCELED task runs (conditions: graph not modified since the run, first attempt within the last 14 days). That weakens the "you can't resume from the failed task" claim. Consider an update paragraph that says what RETRY LAST still does not give you compared with Airflow's Clear.
>   - Branching: Snowflake task graphs now support conditional execution (`WHEN` clauses, predecessor return values via `SYSTEM$GET_PREDECESSOR_RETURN_VALUE`) and finalizer tasks. Also, `SYSTEM$TASK_DEPENDENTS_ENABLE` resumes a task's dependents; it is not a branching mechanism, so that sentence may need rewording.
>   - Observability: Snowsight has a task graph run view. The claim "no single screen" may be outdated; worth comparing honestly.
>   - Code: `schedule_interval` is deprecated in Airflow 2.4+ and removed in Airflow 3 (`schedule` replaces it). The canonical import for `SQLExecuteQueryOperator` is `airflow.providers.common.sql.operators.sql`; the snowflake-provider import path may not work in newer provider versions. `BranchPythonOperator` is imported but not used. I left the code untouched.
>   - The 1,000-tasks-per-graph limit matches what I could find, but confirm current docs.
> - Nothing cut. The original intro already said who the post is for, so I added one short orienting paragraph above it rather than replacing it.

This post is for data engineers who run pipelines on Snowflake Tasks and are starting to feel the strain. It covers where Tasks worked well for me, the specific limits that pushed me to Airflow (observability, retries, branching and scale), the pattern I use now, and the cases where I still pick Tasks.

Snowflake Tasks are genuinely good. I used them for months, recommended them to people, and wrote internal documentation on how to set them up. Then, slowly, I stopped reaching for them and started reaching for Airflow instead.

This isn't a hit piece. It's an honest look at where Tasks work well, where they start to crack, and the moment I realised I was fighting the tool instead of using it. If your Tasks run fine on paper but are getting more painful in practice, this is for you.

## Why I started with Tasks

The pitch is compelling: schedule and orchestrate your pipelines without leaving Snowflake. No extra infrastructure, no Airflow server to maintain, no Docker containers, no YAML config files. Just SQL.

For a solo data engineer or a small team running straightforward ELT that lives entirely inside Snowflake, this is a great deal. You write a Task, chain a few together, set a cron schedule on the root, and the whole thing runs on serverless compute that Snowflake manages. Simple, with zero ops overhead.

I built my first Task tree on a customer dimension pipeline: about 6 tasks chained together for raw landing, staging, an SCD2 merge and a downstream mart refresh. It worked perfectly, and I was impressed. So I built more of them, and that's where things got interesting.

## Where Tasks started to crack

Tasks look fine at small scale. Five tasks, eight tasks, even fifteen chained together work reasonably well. The cracks show when pipelines grow, when requirements get more complex, and when something breaks at 7am and you need to work out what happened.

### Observability

My first real frustration was observability. When a Task fails, Snowflake logs it, but finding that log, understanding the full execution context and connecting it to what ran before and after means digging through `TASK_HISTORY` in `ACCOUNT_USAGE` or calling `INFORMATION_SCHEMA.TASK_HISTORY()`. There's no single screen that shows you what ran, what passed, what failed and what the downstream impact was.

Compare that with opening the Airflow UI, clicking into a DAG run, and seeing every task coloured green or red with full logs one click away. The difference in time to diagnosis is not small. I once spent 40 minutes reconstructing a failed task tree execution from [`TASK_HISTORY`](/articles/snowflake-streams-tasks-pipeline-guide) queries that would have taken me 3 minutes in [Airflow](/articles/snowflake-dbt-projects-airflow-orchestration).

This is the query I ended up running. It pulls the last six hours of runs for any task whose name contains `customer_dim`; change the `ILIKE` filter and the time window to match your own task tree.

```sql
-- How you debug a failed Snowflake Task
SELECT
    name,
    state,
    scheduled_time,
    completed_time,
    error_code,
    error_message
FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY(
    SCHEDULED_TIME_RANGE_START => DATEADD('hour', -6, CURRENT_TIMESTAMP()),
    RESULT_LIMIT => 100
))
WHERE name ILIKE '%customer_dim%'
ORDER BY scheduled_time DESC;
```

That query works. But it's not a dashboard. It's archaeology.

[ADD YOUR OWN: a screenshot of the TASK_HISTORY result from that 40-minute investigation (task names can be blurred) next to an Airflow grid view of a failed run, so readers can see the difference you describe]

### Retries

This one hurt me in production.

Tasks have basic failure handling: you can set `SUSPEND_TASK_AFTER_NUM_FAILURES` to pause a task after repeated failures, which is useful. What you can't do natively is retry a specific failed task in the middle of a tree and resume from that point.

If Task 6 in a 10-task chain fails and you want to re-run from Task 6 onwards after fixing the problem, you're doing it by hand. You can resume the root task, but it re-runs everything from the beginning on the next scheduled tick. Or you run Task 6's SQL manually, then kick off Task 7, then Task 8, and so on.

In Airflow, you right-click the failed task node, click "Clear", and it re-runs that task and everything downstream. One click, with no risk of accidentally re-running something upstream that already completed and shouldn't run twice.

For pipelines with expensive upstream steps, such as large MERGE operations or heavy aggregations, re-running from the start when only a downstream step failed is both wasteful and risky. Wasteful because you burn credits on work already done. Risky because some operations are not safely idempotent, and running them twice produces wrong results.

[ADD YOUR OWN: the production incident behind "this one hurt me": which step failed, what you had to re-run by hand, and roughly what the duplicate run cost in credits or time]

### Conditional logic

This is the limitation that finally pushed me to switch.

My pipelines started needing branching. For example: run the full pipeline on weekdays and a lighter version at weekends. Or: if the previous step returned zero rows, skip the downstream merge and send an alert instead of running an empty MERGE that silently succeeds.

In Airflow, this is a `BranchPythonOperator`. Three lines of Python, explicit and version-controlled.

In Snowflake Tasks, it needs workarounds. You can use a stored procedure with `SYSTEM$TASK_DEPENDENTS_ENABLE` logic, or simulate branching with conditional stored procedures that check a flag before executing. It works, technically, but it's brittle, hard to read, and the logic is buried in a stored procedure instead of being visible in the orchestration layer where it belongs.

As [Flexera points out](https://www.flexera.com/blog/finops/automate-sql-snowflake-tasks/), Tasks can only execute SQL statements and stored procedures, so anything more complex in Python, Java or other languages needs an external scheduler. When your pipeline logic is entirely SQL, Tasks are fine. The moment you need to make an orchestration decision based on runtime data (not just "did this succeed" but "what did this return, and what should I do about it"), you're working against the grain.

### Scale

[Sonra notes](https://sonra.io/data-orchestration-deep-dive-snowflake-tasks-an-airflow-replacement/) that there is a hard limit of 1,000 Tasks per pipeline, so very large implementations have to be split into several separate pipelines.

Most teams won't hit 1,000 tasks. But if you're building a platform for several teams, with separate pipelines per business domain and their own task trees, you will run into governance and management complexity that the limit doesn't help with.

More practically, managing dozens of separate task trees, each owned by a different role with different schedules and failure behaviour, and with no unified view across them, is hard. There's no Snowflake-native equivalent of Airflow's DAG list, where you can see every pipeline, its last run status and its next scheduled run in one place.

## What I use instead

I switched to Airflow with the `SQLExecuteQueryOperator` for Snowflake. I've written about the full setup in [How I Wired Snowflake's Native dbt Projects to Airflow](#). The short version of why it works better for me:

**Airflow owns orchestration. Snowflake owns execution.** Airflow is built for DAG management, dependencies, retries, branching, alerting and observability. Snowflake is built for data processing at scale. Letting each tool do what it's best at, instead of asking Tasks to be a general-purpose orchestrator, is the cleaner architecture.

Here's the pattern I use for a typical pipeline. Each step calls a stored procedure through the same Snowflake connection, the validation step deliberately fails when today's load is empty, and the last line sets the dependency chain. Swap in your own connection ID, procedure names and schedule.

```python
from airflow import DAG
from airflow.providers.snowflake.operators.snowflake import SQLExecuteQueryOperator
from airflow.operators.python import BranchPythonOperator
from datetime import datetime, timedelta

with DAG(
    dag_id='customer_dimension_pipeline',
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
) as dag:

    load_raw = SQLExecuteQueryOperator(
        task_id='load_raw_customers',
        conn_id='snowflake_analytics',
        sql="CALL raw.sp_load_customers();",
    )

    validate_raw = SQLExecuteQueryOperator(
        task_id='validate_raw_row_count',
        conn_id='snowflake_analytics',
        sql="""
            SELECT CASE
                WHEN COUNT(*) = 0 THEN 1/0  -- Forces task failure if no rows
                ELSE COUNT(*)
            END FROM raw.customers_staging
            WHERE load_date = CURRENT_DATE();
        """,
    )

    run_scd2_merge = SQLExecuteQueryOperator(
        task_id='run_scd2_merge',
        conn_id='snowflake_analytics',
        sql="CALL transforms.sp_customer_scd2_merge();",
    )

    refresh_mart = SQLExecuteQueryOperator(
        task_id='refresh_customer_mart',
        conn_id='snowflake_analytics',
        sql="CALL marts.sp_refresh_customer_summary();",
    )

    load_raw >> validate_raw >> run_scd2_merge >> refresh_mart
```

If `validate_raw` fails because there are zero rows, the pipeline stops and `run_scd2_merge` never runs. I get an Airflow alert. Once the issue is fixed, I can clear and rerun `validate_raw` and everything downstream without touching `load_raw` again.

That validation step alone, stopping a pipeline when upstream data is missing, was nearly impossible to implement cleanly with Tasks. In Airflow it's a forced division by zero in the validation SQL. Ugly, but effective. `ShortCircuitOperator` is a cleaner way to do the same thing.

[ADD YOUR OWN: a screenshot of the Airflow graph view for customer_dimension_pipeline with validate_raw_row_count marked failed and the downstream tasks skipped, plus the alert you received]

## When Snowflake Tasks are still the right choice

I don't want this to read as "never use Tasks". They are still my first choice in these cases.

### Micro-refresh patterns

A Task plus Stream combination for near-real-time SCD2 updates, triggering only when the stream has data, is elegant and hard to replicate cleanly in Airflow. I covered this pattern in [Snowflake Streams and Tasks for SCD2: How I Actually Use Them](#).

### Simple scheduled SQL

A single SQL statement that needs to run every 30 minutes with no dependencies? Use a Task. Zero ops overhead for maximum simplicity.

### Snowflake-only pipelines

If a pipeline never needs to know anything about the outside world (no API calls, no file system checks, no cross-system dependencies), Tasks keep everything in one place.

### Small teams with no orchestrator

If you're a team of two and setting up Airflow feels like overkill, Tasks get you 80% of the way there for 10% of the setup cost.

### A simple decision table

| Scenario | Use |
|---|---|
| Simple scheduled SQL, no branching | Snowflake Tasks |
| Stream-triggered incremental loads | Snowflake Tasks + Streams |
| Multi-step pipeline with retry requirements | Airflow |
| Conditional branching based on row counts | Airflow |
| Pipelines touching external systems | Airflow |
| Cross-team pipelines needing unified observability | Airflow |
| Large task trees (50+ steps) | Airflow |

## The honest summary

I didn't stop using Snowflake Tasks because they're bad. I stopped using them as my main orchestration layer because that's not what they're optimised for, and I was asking them to do a job they weren't built to do well.

[Monte Carlo's review of Snowflake orchestration tools](https://www.montecarlodata.com/blog-snowflake-orchestration-tools/) makes a similar point: Tasks cover most orchestration patterns, and the real question is which tools work well with Snowflake as more than a place to send SQL. Tasks are Snowflake's answer to simple scheduling. Airflow is the answer to complex orchestration. Knowing which problem you actually have is the whole game.

If your pipelines are growing, failure debugging is getting slower, and you've caught yourself writing stored procedures to simulate branching, that's the sign. It was the moment I had. The switch to Airflow took a weekend of setup and a week of migration, and I haven't looked back.

[ADD YOUR OWN: what the week of migration involved, for example how many task trees you moved, the order you moved them in, and anything you had to change in the stored procedures]
