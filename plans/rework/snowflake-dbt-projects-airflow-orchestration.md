# Orchestrating Snowflake dbt Projects with Airflow: An End-to-End Pipeline

> **Editor notes**
>
> - **Merge:** `airflow-dbt-snowflake-orchestration-guide` (to be 301'd here) had one thing this post lacked: the job-level vs model-level orchestration discussion (Cosmos, when to use each, the hybrid, the 400-model benchmark and the "one principle"). I folded a tightened version in as a new section, "Job-level vs model-level orchestration", right after Step 5, because Step 5's split-by-layer DAG sits between the two approaches. I also took its dbt-artifacts gotcha (now gotcha 5), its two diagrams and its related-reading links. I did not bring over its DAG code (it imports `SnowflakePythonOperator`, which I could not find in the Snowflake provider, uses `timedelta` without importing it, and calls functions that are never defined), its setup SQL (duplicates Step 1 here), its "missing schema-level grant" gotcha (already in Step 1), its incremental-model gotcha (about dbt State, not this setup), or its TL;DR claims ("debugging time drops 40 to 60%", "infrastructure feels 40% lighter", "orchestrate via REST API"), which had no support in the body.
> - Changed: removed the bold subtitle line and opened with a short intro; promoted the `###` steps to `##` with `###` subsections; paraphrased several paragraphs that were near-verbatim Snowflake documentation (what dbt Projects are, the DBT PROJECT object, `dbt deps`, cross-project references) and kept the docs link; removed em-dashes from prose; added explanations after the long code blocks; trimmed some repetition in the closing sections.
> - Code: all blocks kept as written, with language tags. One exception: `models/staging/sources.yml` was not in a code block on the live page; WordPress had turned it into a bulleted list and lost the indentation. I rebuilt it as a YAML block from the same keys and values. Please check it against your repo.
> - Accuracy fixes in prose (please confirm): the Step 4 list said the DAG "sends a Slack notification on success or failure", but the DAG has no Slack task; it sends email on failure via `default_args`. Step 3 said the project has "source freshness checks", but `sources.yml` has no `freshness` block, so I changed it to "source tests".
> - **Check (syntax, high priority):** I could not verify `GRANT EXECUTE DBT PROJECT ON SCHEMA ...`, `CREATE DBT PROJECT ... FROM GIT REPOSITORY ... REF ... TARGET_PATH ... WAREHOUSE ...`, `VERSION = 'VERSION$3'`, or `snow dbt deploy --project-name ... --from-git --ref main` against current Snowflake and Snowflake CLI docs. The CLI package is now `snowflake-cli` (not `snowflake-cli-labs`). Please run each once.
> - Check (Airflow): `SQLExecuteQueryOperator` is normally imported from `airflow.providers.common.sql.operators.sql`; `days_ago` and `schedule_interval` are removed in Airflow 3 (use `schedule=` and a fixed `start_date`). Fine for Airflow 2.x, but say which version you ran.
> - Check: the row-count guard and the drift query return a 'FAIL'/'ALERT' string but don't fail the task, so `email_on_failure` won't fire as Step 7 says. Either add a check that raises, or reword.
> - Check: the service user is created with a password. Snowflake has been phasing out password-only sign-in for service users; key-pair auth may be required on newer accounts.
> - Check: "GA in November 2025" for dbt Projects on Snowflake; the 6 to 6.5 minutes vs 40 to 45 seconds upload figures (these read like Snowflake release notes, so add the link); the closing quote ("one fewer system to run...") needs its source.
> - Check (merged section): the 400-model benchmark is written about "a data team", not you. Keep it only if it is your own run or you can link the source; otherwise cut it. Also confirm that Cosmos can actually drive a Snowflake-native DBT PROJECT object per model (Cosmos normally runs dbt itself); if not, the "Cosmos + native dbt" pairing needs rewording. The artifacts gotcha named `GET_STAGE_LOCATION(...)`, which I could not find; I left the function out and you should add the correct one.
> - Check: `INFORMATION_SCHEMA.QUERY_HISTORY` applies `RESULT_LIMIT => 50` before the `ILIKE` filter, so on a busy account the monitoring query may miss dbt runs.

This post is for teams that already run Airflow and want their dbt transformations to run inside Snowflake instead of on a separate server. It shows how I wired Snowflake's native dbt Projects into Airflow: the permissions, deploying the project, the DAG, versioning, monitoring, and the gotchas I hit along the way.

I'll be honest with you: for a long time I ran dbt the way most people run it. dbt Core installed on a server, a profiles.yml file I kept updating by hand, a cron job (yes, a cron job) doing the scheduling, and [Airflow](/articles/automated-etl-airflow-python) somewhere nearby doing the "real" orchestration while dbt lived in its own separate corner of the infrastructure.

It worked. It was fine. It was also quietly annoying in ways I'd stopped noticing. Managing the dbt server separately. Keeping the Snowflake credentials synced in two places. Debugging failures by jumping between the Airflow UI, SSH logs on the dbt server and Snowsight, all at once.

Then Snowflake went GA with dbt Projects in November 2025, and I spent a weekend rebuilding the whole thing. This article is what I learned.

What we're building is a genuine end-to-end pipeline: raw data lands in Snowflake, Airflow orchestrates the entire flow, and the dbt transformations run as a native **DBT PROJECT object inside Snowflake**. Not on an external box, not in a container, but inside Snowflake itself. The monitoring, the scheduling trigger and the execution logs are all in one place.

## What a dbt Project on Snowflake actually is

The terminology can trip you up, and I don't want you 45 minutes into setup before the confusion hits.

dbt Projects on [Snowflake](/articles/snowflake-cortex-code-guide-real-examples) let you create, edit, test, run and manage dbt Core projects with Snowflake's own tools. You work on the project files in Snowsight Workspaces, then deploy the project as a schema-level [dbt](/articles/snowflake-cortex-code-dbt-optimization-guide) PROJECT object.

The key word is **object**. `DBT PROJECT` is a first-class, schema-level object: a file container that holds one or more dbt Core projects. It is versioned, so every change made through `ALTER` adds a new version.

That means your dbt project (the models, the sources YAML, `dbt_project.yml`) lives inside Snowflake as a versioned, native object. Not on a VM. Not in an S3 bucket somewhere.

Out of the box you get a file-based IDE in Workspaces that integrates with Git, a DAG view for inspecting lineage and dependencies in the UI, deployment and scheduling with native Snowflake Tasks, and the ability to run dbt commands such as `compile`, `test` and `run` from Workspaces.

So yes, you can schedule and run it purely with Snowflake Tasks and never touch Airflow. But if your organization already runs Airflow, or your dbt pipeline is one piece of a larger flow that includes ingestion, validation, downstream alerts and reporting, you want Airflow in charge, calling into Snowflake to execute the DBT PROJECT object. That hybrid approach is what this article covers.

## The architecture we're building

Before I show you any code, here is the full picture, because I think this is where most blog posts let you down: they show you a piece without the whole.

```text
[Source System / S3 / API]
        ↓
[Airflow DAG starts]
        ↓
  Task 1: Load raw data → Snowflake staging table (via COPY INTO or S3 stage)
        ↓
  Task 2: Run data quality checks on raw data (SQLExecuteQueryOperator)
        ↓
  Task 3: EXECUTE DBT PROJECT → runs dbt build on your native Snowflake dbt project
        ↓
  Task 4: Post-run row count validation (SQLExecuteQueryOperator)
        ↓
  Task 5: Trigger downstream alert / Slack notification / refresh BI layer
        ↓
[Pipeline complete]
```

![Architecture diagram: dbt runs inside Snowflake as a native dbt Project while Airflow orchestrates the pipeline from outside](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/07/airflow_dbt_snowflake_architecture-1024x574.png?resize=1024%2C574&ssl=1)

Airflow owns the orchestration. Snowflake owns the execution of the dbt transformations. The DBT PROJECT object bridges them, because you can trigger it with a SQL command, and Airflow's `SQLExecuteQueryOperator` can fire that SQL command.

That SQL command is simple:

```sql
EXECUTE DBT PROJECT my_database.my_schema.my_dbt_project
  ARGS = 'dbt build'
  VERSION = 'LAST';
```

`EXECUTE DBT PROJECT` runs a dbt project object (or a project in a workspace) with the dbt command and options you pass in `ARGS` ([Snowflake documentation](https://docs.snowflake.com/en/sql-reference/sql/execute-dbt-project)).

One SQL statement is all Airflow needs to fire. Here is the full setup to make that work.

## Step 1: Snowflake setup (roles, warehouse and permissions)

I always start here, because bad permissions cause the most confusing failures, and they surface late in the process when you're tired and frustrated.

```sql
USE ROLE ACCOUNTADMIN;

-- Create a dedicated role for dbt execution
CREATE OR REPLACE ROLE dbt_executor_role;
GRANT ROLE dbt_executor_role TO ROLE SYSADMIN;

-- Create the service user Airflow will use
CREATE OR REPLACE USER airflow_svc_user
  PASSWORD = 'YourStrongPassword123!'
  DEFAULT_ROLE = dbt_executor_role
  DEFAULT_WAREHOUSE = dbt_transform_wh
  COMMENT = 'Airflow service user for dbt orchestration';

GRANT ROLE dbt_executor_role TO USER airflow_svc_user;

-- Create a dedicated warehouse for dbt runs
USE ROLE SYSADMIN;
CREATE OR REPLACE WAREHOUSE dbt_transform_wh
  WITH WAREHOUSE_SIZE = 'SMALL'
  AUTO_SUSPEND = 120
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE;

GRANT ALL ON WAREHOUSE dbt_transform_wh TO ROLE dbt_executor_role;

-- Grant database and schema privileges
GRANT USAGE ON DATABASE analytics_db TO ROLE dbt_executor_role;
GRANT USAGE, CREATE TABLE, CREATE VIEW ON SCHEMA analytics_db.staging TO ROLE dbt_executor_role;
GRANT USAGE, CREATE TABLE, CREATE VIEW ON SCHEMA analytics_db.marts TO ROLE dbt_executor_role;

-- Grant the ability to execute dbt project objects
GRANT EXECUTE DBT PROJECT ON SCHEMA analytics_db.transforms TO ROLE dbt_executor_role;
```

This creates a dedicated role, a service user for Airflow, a Small warehouse that suspends after two minutes, and the grants dbt needs to build into the `staging` and `marts` schemas. The dbt project object itself lives in a third schema, `transforms`. Replace the password and the database and schema names with your own.

I made a mistake my first time through: I granted object-level access but forgot the schema-level `EXECUTE DBT PROJECT` privilege, which is separate. The error message wasn't obvious. Save yourself that 20-minute debugging session.

[ADD YOUR OWN: the exact error message Snowflake returned when the schema-level privilege was missing, so people searching for it land here]

## Step 2: Deploy your dbt project as a native Snowflake object

This is the step that feels most different from a traditional dbt Core setup. You're not installing dbt on a server; you're registering your project inside Snowflake.

### Option A: Snowsight Workspaces (recommended the first time)

Log into Snowsight, go to Workspaces and connect it to your Git repository:

```sql
-- First, create an API integration for GitHub
CREATE OR REPLACE API INTEGRATION github_integration
  API_PROVIDER = git_https_api
  API_ALLOWED_PREFIXES = ('https://github.com/yourorg/')
  ENABLED = TRUE;

-- Create the Git repository object in Snowflake
CREATE OR REPLACE GIT REPOSITORY dbt_project_repo
  API_INTEGRATION = github_integration
  GIT_CREDENTIALS = my_github_secret
  ORIGIN = 'https://github.com/yourorg/your-dbt-project.git';
```

The API integration allows Snowflake to reach your GitHub organization, and the Git repository object points at the repo itself. `my_github_secret` is a Snowflake secret holding your Git credentials, which you need to create first.

### Option B: Deploy with SQL (good for CI/CD)

```sql
-- Create the DBT PROJECT object from your connected Git repo
CREATE OR REPLACE DBT PROJECT analytics_db.transforms.sales_dbt_project
  FROM GIT REPOSITORY dbt_project_repo
  REF = 'main'
  TARGET_PATH = 'models/'
  WAREHOUSE = dbt_transform_wh;
```

### Install dbt dependencies

You populate the `dbt_packages` folder by running `dbt deps`, either in a Snowflake workspace, on your local machine or in your Git-based CI:

```sql
-- Run this once after creating the project, or include in CI/CD
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt deps'
  VERSION = 'LAST';
```

A heads-up: running `dbt deps` inside Snowflake Workspaces needs an external access integration, because the runtime has to reach external package repositories. The alternative is to run `dbt deps` locally or in CI and ship the populated `dbt_packages` folder with your deployment.

I found it cleaner to run `dbt deps` in my GitHub Actions pipeline and commit the `dbt_packages` folder, rather than configuring external access integrations for every environment. Your call; both approaches work.

### Verify the deployment

```sql
-- Check your dbt project versions
SHOW DBT PROJECTS IN SCHEMA analytics_db.transforms;

-- Test execute manually before wiring Airflow
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt compile'
  VERSION = 'LAST';
```

If `dbt compile` completes without error, your project is live and ready for Airflow to call.

## Step 3: Set up a real dbt project structure

Here is what the project actually looks like. I'm using a sales pipeline as the example: raw orders come in, we stage them, and we build a daily summary fact table.

### dbt_project.yml

```yaml
name: 'sales_pipeline'
version: '1.0.0'
config-version: 2

profile: 'snowflake_prod'

model-paths: ["models"]
test-paths: ["tests"]
seed-paths: ["seeds"]

models:
  sales_pipeline:
    staging:
      +schema: staging
      +materialized: view
    marts:
      +schema: marts
      +materialized: table
```

Staging models build as views in the `staging` schema and marts build as tables in the `marts` schema, which matches the grants from Step 1.

### models/staging/stg_orders.sql

```sql
-- Staging model: clean and type-cast raw orders
WITH raw AS (
    SELECT * FROM {{ source('raw', 'orders_raw') }}
),

cleaned AS (
    SELECT
        order_id::VARCHAR           AS order_id,
        customer_id::VARCHAR        AS customer_id,
        order_date::DATE            AS order_date,
        UPPER(TRIM(status))         AS order_status,
        amount::DECIMAL(18, 2)      AS order_amount,
        region::VARCHAR             AS region,
        CURRENT_TIMESTAMP()         AS _loaded_at
    FROM raw
    WHERE order_id IS NOT NULL
      AND order_date >= '2023-01-01'
)

SELECT * FROM cleaned
```

The staging model casts each column to its proper type, normalizes the status text, drops rows without an order ID and keeps orders from 2023 onwards.

### models/marts/fct_daily_orders.sql

```sql
-- Fact table: daily order summary by region
WITH staged AS (
    SELECT * FROM {{ ref('stg_orders') }}
)

SELECT
    order_date,
    region,
    order_status,
    COUNT(DISTINCT order_id)                    AS total_orders,
    COUNT(DISTINCT customer_id)                 AS unique_customers,
    SUM(order_amount)                           AS total_revenue,
    AVG(order_amount)                           AS avg_order_value,
    SUM(CASE WHEN order_status = 'RETURNED' 
             THEN order_amount ELSE 0 END)      AS returned_amount,
    CURRENT_TIMESTAMP()                         AS _refreshed_at
FROM staged
GROUP BY order_date, region, order_status
ORDER BY order_date DESC, region
```

The fact table aggregates staged orders by day, region and status, including the value of returned orders.

### models/staging/sources.yml

```yaml
version: 2

sources:
  - name: raw
    database: analytics_db
    schema: raw_landing
    tables:
      - name: orders_raw
        description: "Raw orders from the source system"
        columns:
          - name: order_id
            tests:
              - not_null
              - unique
          - name: customer_id
            tests:
              - not_null
          - name: order_date
            tests:
              - not_null
          - name: amount
            tests:
              - not_null
```

### models/marts/schema.yml

```yaml
version: 2

models:
  - name: fct_daily_orders
    description: "Daily order summary by region and status"
    columns:
      - name: order_date
        tests:
          - not_null
      - name: total_orders
        tests:
          - not_null
      - name: total_revenue
        tests:
          - not_null
```

This gives us a clean, testable project with source tests and column-level tests. When Airflow executes `dbt build`, all of it runs (models and tests) in dependency order.

## Step 4: Wire it together in Airflow

Now the fun part: a complete Airflow DAG that:

1. Validates that raw data arrived in Snowflake
2. Fires the native dbt project execution
3. Validates row counts on the output marts
4. Marks the pipeline complete, with email alerts on failure

First, install the Snowflake provider if you haven't:

```bash
pip install apache-airflow-providers-snowflake
```

Set up your Snowflake connection in the Airflow UI (`Admin → Connections`):

```text
Connection ID : snowflake_analytics
Connection Type : Snowflake
Account  : yourorg.us-east-1
Login    : airflow_svc_user
Password : YourStrongPassword123!
Schema   : transforms
Database : analytics_db
Warehouse: dbt_transform_wh
Role     : dbt_executor_role
```

Now the DAG, `dags/sales_pipeline_dag.py`:

```python
from airflow import DAG
from airflow.providers.snowflake.operators.snowflake import SQLExecuteQueryOperator
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.utils.dates import days_ago
from datetime import datetime, timedelta
import logging

# ── Default args ────────────────────────────────────────────────
default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    'email_on_failure': True,
    'email': ['data-alerts@yourcompany.com'],
}

SNOWFLAKE_CONN = 'snowflake_analytics'

# ── SQL snippets ─────────────────────────────────────────────────
RAW_DATA_CHECK_SQL = """
SELECT COUNT(*) AS raw_row_count
FROM analytics_db.raw_landing.orders_raw
WHERE order_date = CURRENT_DATE() - 1;
"""

EXECUTE_DBT_SQL = """
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt build --select staging.stg_orders+ --vars "{\\"run_date\\": \\"{{ ds }}\\"}"'
  VERSION = 'LAST';
"""

MART_VALIDATION_SQL = """
SELECT
    COUNT(*) AS mart_row_count,
    MAX(order_date) AS latest_date,
    SUM(total_revenue) AS total_revenue
FROM analytics_db.marts.fct_daily_orders
WHERE order_date = CURRENT_DATE() - 1;
"""

ROW_COUNT_GUARD_SQL = """
SELECT
    CASE
        WHEN COUNT(*) = 0
        THEN 'FAIL: No rows found in mart for yesterday'
        ELSE 'PASS: ' || COUNT(*) || ' rows present'
    END AS validation_result
FROM analytics_db.marts.fct_daily_orders
WHERE order_date = CURRENT_DATE() - 1;
"""

# ── DAG definition ───────────────────────────────────────────────
with DAG(
    dag_id='sales_pipeline_end_to_end',
    default_args=default_args,
    description='End-to-end sales pipeline: raw → dbt native project → marts',
    schedule_interval='0 6 * * *',     # 6 AM UTC daily
    start_date=days_ago(1),
    catchup=False,
    tags=['snowflake', 'dbt', 'sales'],
) as dag:

    # Task 1: Check raw data arrived
    check_raw_data = SQLExecuteQueryOperator(
        task_id='check_raw_data_arrived',
        conn_id=SNOWFLAKE_CONN,
        sql=RAW_DATA_CHECK_SQL,
        handler=lambda cursor: logging.info(
            f"Raw row count: {cursor.fetchone()[0]}"
        ),
    )

    # Task 2: Execute the native dbt project on Snowflake
    run_dbt_project = SQLExecuteQueryOperator(
        task_id='execute_dbt_project_snowflake',
        conn_id=SNOWFLAKE_CONN,
        sql=EXECUTE_DBT_SQL,
        # Give dbt build enough time for large projects
        execution_timeout=timedelta(hours=2),
    )

    # Task 3: Post-run mart validation
    validate_mart_output = SQLExecuteQueryOperator(
        task_id='validate_mart_output',
        conn_id=SNOWFLAKE_CONN,
        sql=ROW_COUNT_GUARD_SQL,
        handler=lambda cursor: logging.info(
            f"Validation result: {cursor.fetchone()[0]}"
        ),
    )

    # Task 4: Run broader stats query (logged for observability)
    log_mart_stats = SQLExecuteQueryOperator(
        task_id='log_mart_statistics',
        conn_id=SNOWFLAKE_CONN,
        sql=MART_VALIDATION_SQL,
    )

    # Task 5: Success marker
    pipeline_complete = EmptyOperator(task_id='pipeline_complete')

    # ── Dependencies ─────────────────────────────────────────────
    (
        check_raw_data
        >> run_dbt_project
        >> validate_mart_output
        >> log_mart_stats
        >> pipeline_complete
    )
```

The DAG runs every day at 6 AM UTC. It logs how many raw orders arrived for yesterday, runs `dbt build` on `stg_orders` and everything downstream of it (passing Airflow's run date `{{ ds }}` as a dbt variable), checks that the mart has rows for yesterday, logs summary statistics and finishes on an empty marker task. It starts at the raw-data check, so loading the raw data (Task 1 in the diagram) and the Slack step happen outside this DAG. Note that the raw-data check and the row-count guard only log their results; they won't stop the run on their own.

[ADD YOUR OWN: a screenshot of this DAG's grid or graph view in Airflow after a successful run, and one of a failed run showing where the failure surfaced]

## Step 5: Run specific dbt selectors from Airflow

One of the things I really like about this approach is that dbt's full selector syntax passes straight through the `ARGS` parameter. You don't have to run the entire project every time.

Run only staging models:

```python
EXECUTE_STAGING_ONLY = """
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt run --select staging.*'
  VERSION = 'LAST';
"""
```

Run a specific model and everything downstream of it:

```python
EXECUTE_ORDERS_DOWNSTREAM = """
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt build --select stg_orders+'
  VERSION = 'LAST';
"""
```

Run tests only, separately from the model run:

```python
RUN_DBT_TESTS = """
EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
  ARGS = 'dbt test --select staging.*'
  VERSION = 'LAST';
"""
```

This means you can split a single DAG into multiple tasks (one for staging, one for marts, one for tests) and get granular retry behavior in Airflow. If something fails mid-pipeline, Airflow retries only the failed task instead of rerunning everything.

Here's that pattern as a DAG:

```python
run_staging = SQLExecuteQueryOperator(
    task_id='run_dbt_staging',
    conn_id=SNOWFLAKE_CONN,
    sql="""
        EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
          ARGS = 'dbt run --select staging.*'
          VERSION = 'LAST';
    """,
)

test_staging = SQLExecuteQueryOperator(
    task_id='test_dbt_staging',
    conn_id=SNOWFLAKE_CONN,
    sql="""
        EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
          ARGS = 'dbt test --select staging.*'
          VERSION = 'LAST';
    """,
)

run_marts = SQLExecuteQueryOperator(
    task_id='run_dbt_marts',
    conn_id=SNOWFLAKE_CONN,
    sql="""
        EXECUTE DBT PROJECT analytics_db.transforms.sales_dbt_project
          ARGS = 'dbt run --select marts.*'
          VERSION = 'LAST';
    """,
)

run_staging >> test_staging >> run_marts
```

This is how I actually run it in practice. If staging tests fail, marts never execute. If marts fail, I retry marts without re-running staging. Clean dependency management with very little code.

## Job-level vs model-level orchestration

Splitting the project by layer, as above, sits between the two approaches the Airflow and dbt community has argued about for years: run all of dbt as one Airflow task (job-level), or give every model its own task (model-level).

![Comparison of job-level and model-level dbt orchestration in Airflow](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/07/airflow_dbt_orchestration_comparison-1024x642.png?resize=1024%2C642&ssl=1)

### Job-level: one task for the whole run

One Airflow task runs something like `dbt run --select tag:daily`. It's simple: one task, one line of configuration, fast deploys. Most teams picked it for that reason. The downside is that if one model fails in the middle of a 400-model run, the whole job fails, and you have to dig through dbt logs to find which model actually broke.

### Model-level: one task per model

Model-level orchestration gives every model its own Airflow task, so failures are scoped to a model and Airflow's UI shows exactly where the pipeline broke. It used to carry a penalty: rendering 400 models as 400 tasks loaded the Airflow scheduler, DAG parsing time doubled, and the dynamic task generation you had to write was brittle.

Astronomer's open-source [Cosmos](https://astronomer.io/docs/cosmos/introduction) library changed that. You point Cosmos at your dbt project directory and it generates the Airflow DAG, one task per model, without hand-written task definitions. Parsing 400 models still costs something, roughly 1 to 2 seconds added to DAG parsing, but that's now acceptable. A failed model shows up as a red task in the Airflow UI with its compile error, instead of "dbt run exited with code 1" in an SSH log.

### A 400-model example

One team running Airflow on AWS (3x m5.2xlarge), dbt Core on a separate EC2 box and a MEDIUM Snowflake warehouse compared the two:

- **Job-level with external dbt:** `dbt run --select tag:daily` as a single daily task took 18 minutes wall-clock. A failed model was buried in the dbt log, and debugging took 45+ minutes of correlating dbt logs, Snowflake QUERY_HISTORY and Airflow task logs.
- **Model-level with Cosmos and Snowflake-native dbt:** the same 400 models as 400 Cosmos-generated tasks, up to 8 running in parallel on the MEDIUM warehouse, took 12 minutes (33% faster). The failed model, its compile error and the exact line were visible from the red task. Debugging took 8 minutes.

The speed gain comes from running independent models in parallel; the debugging gain comes from per-model visibility.

### Which one to use

**Job-level still makes sense if** your project is small (under 50 models), it fits in a single logical unit, you don't need per-model visibility, or you're on dbt Cloud's own scheduler rather than Airflow.

**Model-level makes sense if** you have 100+ models, need per-model failure isolation, care about debugging speed, or want Airflow to be the single source of truth for the whole pipeline.

**The hybrid:** some teams run both in the same DAG: one job-level task for hourly incremental loads (`dbt run --select tag:hourly`) and a Cosmos task group for the daily mart builds where visibility matters.

The principle I'd use to decide: **observability at execution time beats simplicity at configuration time.** Job-level is simpler to configure; model-level is simpler to debug. In production you spend more time debugging than configuring, so pick the granularity that lets you see failures where they happen.

## Step 6: Handle new versions of your dbt project

I didn't think about this until I pushed a breaking change to `main` and my 6 AM pipeline executed the wrong version.

The DBT PROJECT object is versioned: each change made through `ALTER` adds a new version, named `VERSION$<num>`.

In practice, your CI/CD pipeline (GitHub Actions or similar) should update the DBT PROJECT object after every merge to `main`:

```yaml
# .github/workflows/deploy_dbt.yml
name: Deploy dbt Project to Snowflake

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Snowflake CLI
        run: pip install snowflake-cli-labs

      - name: Deploy new dbt project version
        env:
          SNOWFLAKE_ACCOUNT: ${{ secrets.SNOWFLAKE_ACCOUNT }}
          SNOWFLAKE_USER: ${{ secrets.SNOWFLAKE_USER }}
          SNOWFLAKE_PASSWORD: ${{ secrets.SNOWFLAKE_PASSWORD }}
        run: |
          snow dbt deploy \
            --project-name analytics_db.transforms.sales_dbt_project \
            --from-git \
            --ref main
```

On every push to `main`, the workflow installs the Snowflake CLI and deploys a new version of the project, reading the account, user and password from GitHub secrets.

In your Airflow SQL, `VERSION = 'LAST'` always picks up the most recently deployed version. Once CI/CD deploys a new version, the next DAG run uses it with no Airflow changes.

## Step 7: Monitoring (what to watch and where)

Before this setup, I was watching three screens at once when something went wrong. Now it's mostly one.

In Snowsight:

```sql
-- Check recent dbt project execution history
SELECT
    query_id,
    query_text,
    execution_status,
    start_time,
    end_time,
    DATEDIFF('second', start_time, end_time) AS duration_seconds,
    error_message
FROM TABLE(
    INFORMATION_SCHEMA.QUERY_HISTORY(
        END_TIME_RANGE_START => DATEADD('day', -1, CURRENT_TIMESTAMP()),
        RESULT_LIMIT => 50
    )
)
WHERE query_text ILIKE '%EXECUTE DBT PROJECT%'
ORDER BY start_time DESC;
```

This lists the last day's `EXECUTE DBT PROJECT` statements with their status, duration in seconds and any error message, newest first.

Row count drift detection, added as an Airflow task:

```sql
-- Compare today's mart row count to yesterday's
-- Flag if it drops more than 20%
WITH today AS (
    SELECT COUNT(*) AS cnt
    FROM analytics_db.marts.fct_daily_orders
    WHERE order_date = CURRENT_DATE() - 1
),
yesterday AS (
    SELECT COUNT(*) AS cnt
    FROM analytics_db.marts.fct_daily_orders
    WHERE order_date = CURRENT_DATE() - 2
)
SELECT
    today.cnt                                               AS today_rows,
    yesterday.cnt                                           AS yesterday_rows,
    ROUND((today.cnt - yesterday.cnt) / NULLIF(yesterday.cnt, 0) * 100, 2) AS pct_change,
    CASE
        WHEN today.cnt < yesterday.cnt * 0.80
        THEN 'ALERT: Row count dropped over 20%'
        ELSE 'OK'
    END AS status
FROM today, yesterday;
```

I added this query as a `SQLExecuteQueryOperator` task right after the mart validation step. If the row count drops by more than 20% compared with the previous day, the task raises a warning in the Airflow logs and the email alert fires.

Not every data quality problem shows up as a dbt test failure. Sometimes the data just quietly shrinks because an upstream feed stopped delivering. This catches that.

## Gotchas I hit along the way

**1. `EXECUTE DBT PROJECT` is synchronous by default.** Airflow waits for it to complete before marking the task done. For large projects that's the behavior you want; just make sure the task's `execution_timeout` is generous enough.

**2. Cross-project references don't work the way you might expect.** The DBT PROJECT object can't reference external file paths, so cross-project dependencies have to be copied into the root of the main project. If you have multiple dbt projects, plan your consolidation before deploying.

**3. `VERSION = 'LAST'` always runs the most recently deployed version.** To pin a specific version in production, use `VERSION = 'VERSION$3'` (or whichever number). I run `LAST` in dev and a pinned version in prod, deployed via CI/CD.

**4. Warehouse auto-resume and the first task.** The first `EXECUTE DBT PROJECT` of the day can have a few seconds of latency while `dbt_transform_wh` resumes. I added a lightweight warm-up query as the very first task in my DAG, so the warehouse is already running when `dbt build` starts:

```python
warm_up_warehouse = SQLExecuteQueryOperator(
    task_id='warm_up_warehouse',
    conn_id=SNOWFLAKE_CONN,
    sql="SELECT CURRENT_TIMESTAMP();",
)

warm_up_warehouse >> check_raw_data >> run_dbt_project >> ...
```

It costs almost nothing and removes 5 to 10 seconds of variability at the start of every run.

**5. dbt artifacts stay in Snowflake.** When dbt runs inside Snowflake, `manifest.json` and the other run artifacts stay there too. If anything downstream uses them (dbt Cloud webhooks, dbt Mesh coordination, lineage tools), add a post-run task that exports them explicitly after each run.

## What this setup actually changed for me

I want to be concrete here, because the "benefits" sections in most blog posts are too abstract.

**Before:** my pipeline had six moving parts. An Airflow DAG on one server. dbt installed on a separate instance. A `profiles.yml` with credentials that needed updating every time we rotated passwords. Separate monitoring in CloudWatch for the dbt server. Debugging a failure meant SSH to the dbt server, find the log file, then cross-reference it with the Airflow logs.

**After:** the pipeline has three moving parts: Airflow, Snowflake and GitHub. The dbt credentials are managed by Airflow's Snowflake connection, which I was already maintaining. Debugging a failure means clicking into the Airflow task logs (which capture the SQL response from Snowflake) and, if I need more detail, running the QUERY_HISTORY query above in Snowsight.

Performance has also improved since preview: result upload, which took roughly 6 to 6.5 minutes during preview, now completes in around 40 to 45 seconds, about 8 to 10x faster.

The startup time improvement alone was worth it for me. My morning pipeline used to take 28 to 32 minutes. It now consistently runs in 18 to 22 minutes. That's not from faster models; it's from removing environment spin-up overhead.

[ADD YOUR OWN: a Snowsight or Airflow screenshot showing run durations before and after the switch, to back up the 28 to 32 vs 18 to 22 minute figures]

## Why I think this is the right direction

I started exploring this because nobody told me to. My team's existing setup worked, and a reasonable person would have left it alone.

But the more I looked at it, the more I thought about the overhead we carry when tools don't talk to each other natively. Every boundary between systems is a place where credentials leak, latency is added and debugging gets harder. The native dbt project in Snowflake closes one of those boundaries. Airflow still owns orchestration, which is where it belongs, but the transformation runs where the data lives.

One line I read about this stuck with me:

> For the growing number of organizations that have standardized on Snowflake, the native integration offers something genuinely compelling: one fewer system to run, one fewer vendor to manage, and one fewer boundary between your data and the logic that transforms it.

That's exactly what this is.

If you've been running dbt Core on a server with Airflow alongside it, and you've tolerated the overhead for so long that you've stopped noticing it, try this weekend rebuild. You might be surprised how much lighter the pipeline feels on the other side.

And if you try it and hit something weird, drop it in the comments. I'm still learning this myself.

**Related reading:** [dbt State on Snowflake: skip unchanged models, cut runtime 60%](https://dataengineerhub.blog/articles/dbt-state-snowflake-setup-guide) · [dbt Fusion: 30x faster parsing with the Rust engine](https://dataengineerhub.blog/articles/dbt-fusion-engine-migration-guide) · [Data contracts: stop schema breakage before it happens](https://dataengineerhub.blog/articles/data-contracts-schema-breakage-guide) · [Official dbt and Airflow integration guide](https://docs.getdbt.com/guides/airflow-and-dbt-cloud)
