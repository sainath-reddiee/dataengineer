/**
 * Cheat Sheet Data for PSEO
 * Structured data for data engineering cheat sheets
 * Each cheat sheet contains sections with tables, code blocks, tips, etc.
 */

export const CHEATSHEET_CATEGORIES = [
  { id: 'sql', name: 'SQL & Databases', icon: '🗄️' },
  { id: 'orchestration', name: 'Orchestration & Tools', icon: '⚙️' },
  { id: 'cloud', name: 'Cloud Platforms', icon: '☁️' },
  { id: 'programming', name: 'Programming', icon: '💻' },
  { id: 'architecture', name: 'Architecture', icon: '🏗️' },
  { id: 'interview', name: 'Interview Prep', icon: '🎯' },
  { id: 'bestpractices', name: 'Best Practices', icon: '✅' },
];

export const cheatsheets = [
  // ────────────────────────────────────────────
  // 1. Snowflake SQL Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-sql',
    title: 'Snowflake SQL Cheat Sheet',
    shortDescription: 'Essential Snowflake SQL commands, functions, and syntax for data engineers. Covers DDL, DML, querying, and Snowflake-specific features.',
    category: 'sql',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Database & Schema Operations',
        type: 'table',
        columns: ['Command', 'Syntax', 'Example'],
        items: [
          ['Create Database', 'CREATE DATABASE [IF NOT EXISTS] db_name;', 'CREATE DATABASE analytics_db;'],
          ['Create Schema', 'CREATE SCHEMA [IF NOT EXISTS] schema_name;', 'CREATE SCHEMA raw_data;'],
          ['Use Database', 'USE DATABASE db_name;', 'USE DATABASE analytics_db;'],
          ['Use Schema', 'USE SCHEMA schema_name;', 'USE SCHEMA raw_data;'],
          ['Show Databases', 'SHOW DATABASES;', 'SHOW DATABASES LIKE \'%analytics%\';'],
          ['Drop Database', 'DROP DATABASE [IF EXISTS] db_name;', 'DROP DATABASE old_db;'],
        ],
      },
      {
        title: 'Table Operations',
        type: 'table',
        columns: ['Command', 'Syntax', 'Example'],
        items: [
          ['Create Table', 'CREATE TABLE t (col TYPE, ...);', 'CREATE TABLE users (id INT, name VARCHAR, created_at TIMESTAMP_NTZ);'],
          ['Create Table As', 'CREATE TABLE t AS SELECT ...;', 'CREATE TABLE summary AS SELECT dept, COUNT(*) cnt FROM employees GROUP BY dept;'],
          ['Clone Table', 'CREATE TABLE t CLONE source;', 'CREATE TABLE users_backup CLONE users;'],
          ['Transient Table', 'CREATE TRANSIENT TABLE t (...);', 'CREATE TRANSIENT TABLE temp_staging (id INT, data VARIANT);'],
          ['Alter Table', 'ALTER TABLE t ADD COLUMN col TYPE;', 'ALTER TABLE users ADD COLUMN email VARCHAR;'],
          ['Drop Table', 'DROP TABLE [IF EXISTS] t;', 'DROP TABLE old_staging;'],
        ],
      },
      {
        title: 'Snowflake-Specific Features',
        type: 'table',
        columns: ['Feature', 'Syntax', 'Use Case'],
        items: [
          ['Time Travel', 'SELECT * FROM t AT(OFFSET => -60*5);', 'Query data as it was 5 minutes ago'],
          ['Time Travel (Timestamp)', 'SELECT * FROM t AT(TIMESTAMP => \'2026-01-01\'::TIMESTAMP);', 'Query data at a specific point in time'],
          ['Undrop', 'UNDROP TABLE t;', 'Recover a dropped table within retention period'],
          ['FLATTEN', 'SELECT f.value FROM t, LATERAL FLATTEN(input => t.json_col) f;', 'Expand semi-structured arrays into rows'],
          ['PARSE_JSON', 'SELECT PARSE_JSON(\'{"key":"val"}\');', 'Parse a JSON string into VARIANT'],
          ['OBJECT_CONSTRUCT', 'SELECT OBJECT_CONSTRUCT(\'k1\',v1,\'k2\',v2);', 'Build a JSON object from key-value pairs'],
          ['QUALIFY', 'SELECT * FROM t QUALIFY ROW_NUMBER() OVER(PARTITION BY id ORDER BY ts DESC) = 1;', 'Filter window function results without subquery'],
          ['RESULT_SCAN', 'SELECT * FROM TABLE(RESULT_SCAN(LAST_QUERY_ID()));', 'Query results of the last executed query'],
        ],
      },
      {
        title: 'Warehouse Management',
        type: 'table',
        columns: ['Command', 'Syntax', 'Notes'],
        items: [
          ['Create Warehouse', 'CREATE WAREHOUSE wh WITH WAREHOUSE_SIZE = \'XSMALL\' AUTO_SUSPEND = 60 AUTO_RESUME = TRUE;', 'Always set AUTO_SUSPEND to save credits'],
          ['Resize', 'ALTER WAREHOUSE wh SET WAREHOUSE_SIZE = \'MEDIUM\';', 'Takes effect on next query'],
          ['Suspend', 'ALTER WAREHOUSE wh SUSPEND;', 'Immediately stops credit consumption'],
          ['Resume', 'ALTER WAREHOUSE wh RESUME;', 'Manual resume if AUTO_RESUME is off'],
          ['Multi-cluster', 'ALTER WAREHOUSE wh SET MIN_CLUSTER_COUNT=1 MAX_CLUSTER_COUNT=3;', 'Enterprise edition feature for concurrency'],
          ['Query Tag', 'ALTER SESSION SET QUERY_TAG = \'etl_pipeline_v2\';', 'Tag queries for cost attribution'],
        ],
      },
      {
        title: 'Performance Tips',
        type: 'tips',
        items: [
          'Use CLUSTER BY for large tables (100M+ rows) queried with consistent filters',
          'Prefer QUALIFY over subqueries for window function filtering — it\'s Snowflake-native and faster',
          'Set AUTO_SUSPEND = 60 (seconds) on warehouses to avoid idle credit burn',
          'Use TRANSIENT tables for staging/temp data to skip Fail-safe storage costs',
          'Use COPY INTO with file format options instead of INSERT for bulk loads',
          'Monitor with QUERY_HISTORY and WAREHOUSE_METERING_HISTORY views',
          'Use RESULT_SCAN(LAST_QUERY_ID()) to chain query results without temp tables',
          'Avoid SELECT * in production — specify columns to leverage micro-partition pruning',
        ],
      },
    ],
    faqs: [
      { question: 'What is the QUALIFY clause in Snowflake?', answer: 'QUALIFY is a Snowflake-specific clause that filters the results of window functions directly, eliminating the need for subqueries. For example, QUALIFY ROW_NUMBER() OVER(PARTITION BY id ORDER BY ts DESC) = 1 keeps only the latest row per id.' },
      { question: 'How does Time Travel work in Snowflake?', answer: 'Time Travel lets you query historical data using AT or BEFORE clauses. You can go back up to 90 days (Enterprise edition) or 1 day (Standard). Syntax: SELECT * FROM table AT(OFFSET => -300) queries data from 5 minutes ago.' },
      { question: 'What is the difference between VARIANT and VARCHAR in Snowflake?', answer: 'VARIANT is a semi-structured data type that can store JSON, Avro, ORC, Parquet, or XML data natively. VARCHAR stores plain text strings. Use VARIANT when working with nested/hierarchical data and VARCHAR for flat string values.' },
    ],
    relatedSlugs: ['sql-window-functions', 'snowflake-cost-optimization-interview', 'snowflake-semi-structured-interview', 'data-modeling', 'python-for-data-engineers'],
    relatedArticles: ['/articles/snowflake-query-optimization-guide-2026', '/articles/snowflake-streams-tasks-pipeline-guide'],
  },

  // ────────────────────────────────────────────
  // 2. SQL Window Functions Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'sql-window-functions',
    title: 'SQL Window Functions Cheat Sheet',
    shortDescription: 'Master ROW_NUMBER, RANK, LEAD, LAG, running totals, and moving averages. Works across Snowflake, BigQuery, Postgres, and Redshift.',
    category: 'sql',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Window Function Syntax',
        type: 'code',
        language: 'sql',
        code: `-- General syntax
SELECT
  column,
  FUNCTION() OVER (
    [PARTITION BY col1, col2]
    [ORDER BY col3 [ASC|DESC]]
    [ROWS|RANGE BETWEEN frame_start AND frame_end]
  ) AS alias
FROM table;

-- Frame options:
--   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  (default)
--   ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
--   ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING`,
      },
      {
        title: 'Ranking Functions',
        type: 'table',
        columns: ['Function', 'Description', 'Example', 'Result for ties (1,1,3)'],
        items: [
          ['ROW_NUMBER()', 'Unique sequential number', 'ROW_NUMBER() OVER (ORDER BY salary DESC)', '1, 2, 3 (no ties)'],
          ['RANK()', 'Rank with gaps for ties', 'RANK() OVER (ORDER BY salary DESC)', '1, 1, 3 (skips 2)'],
          ['DENSE_RANK()', 'Rank without gaps', 'DENSE_RANK() OVER (ORDER BY salary DESC)', '1, 1, 2 (no gaps)'],
          ['NTILE(n)', 'Divide into n buckets', 'NTILE(4) OVER (ORDER BY salary)', 'Quartile assignment'],
          ['PERCENT_RANK()', 'Relative rank (0 to 1)', 'PERCENT_RANK() OVER (ORDER BY salary)', '0.0, 0.0, 0.5'],
        ],
      },
      {
        title: 'Value Functions',
        type: 'table',
        columns: ['Function', 'Description', 'Example'],
        items: [
          ['LAG(col, n, default)', 'Value from n rows before', 'LAG(revenue, 1, 0) OVER (ORDER BY month)'],
          ['LEAD(col, n, default)', 'Value from n rows after', 'LEAD(revenue, 1, 0) OVER (ORDER BY month)'],
          ['FIRST_VALUE(col)', 'First value in the window', 'FIRST_VALUE(price) OVER (PARTITION BY product ORDER BY date)'],
          ['LAST_VALUE(col)', 'Last value in the window', 'LAST_VALUE(price) OVER (PARTITION BY product ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)'],
          ['NTH_VALUE(col, n)', 'Nth value in the window', 'NTH_VALUE(score, 2) OVER (ORDER BY score DESC)'],
        ],
      },
      {
        title: 'Aggregate Window Functions',
        type: 'table',
        columns: ['Pattern', 'SQL', 'Use Case'],
        items: [
          ['Running Total', 'SUM(amount) OVER (ORDER BY date)', 'Cumulative revenue over time'],
          ['Running Average', 'AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)', '7-day moving average'],
          ['Running Count', 'COUNT(*) OVER (ORDER BY date)', 'Cumulative event count'],
          ['Partition Total', 'SUM(amount) OVER (PARTITION BY dept)', 'Department-level total on every row'],
          ['Percent of Total', 'amount / SUM(amount) OVER () * 100', 'Each row as percentage of grand total'],
          ['Percent of Group', 'amount / SUM(amount) OVER (PARTITION BY dept) * 100', 'Each row as percentage of group total'],
        ],
      },
      {
        title: 'Common Patterns',
        type: 'code',
        language: 'sql',
        code: `-- Deduplicate: keep latest row per key
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY user_id ORDER BY updated_at DESC
  ) AS rn
  FROM raw_events
) WHERE rn = 1;

-- Snowflake shortcut using QUALIFY
SELECT * FROM raw_events
QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) = 1;

-- Gap detection: find missing dates
SELECT date,
  LAG(date) OVER (ORDER BY date) AS prev_date,
  DATEDIFF('day', LAG(date) OVER (ORDER BY date), date) AS gap_days
FROM daily_metrics
HAVING gap_days > 1;

-- Year-over-Year comparison
SELECT month, revenue,
  LAG(revenue, 12) OVER (ORDER BY month) AS revenue_last_year,
  ROUND((revenue - LAG(revenue, 12) OVER (ORDER BY month))
    / NULLIF(LAG(revenue, 12) OVER (ORDER BY month), 0) * 100, 1) AS yoy_pct
FROM monthly_revenue;`,
      },
      {
        title: 'Performance Tips',
        type: 'tips',
        items: [
          'Window functions run AFTER WHERE, GROUP BY, and HAVING — filter first to reduce work',
          'PARTITION BY creates independent windows — use it to scope calculations to groups',
          'ORDER BY in OVER() is required for ranking and value functions but optional for aggregates',
          'Use QUALIFY (Snowflake/BigQuery) instead of wrapping in a subquery — cleaner and often faster',
          'Be explicit about frame bounds with LAST_VALUE — the default frame may not include all rows',
          'Multiple window functions with the same OVER() clause share a single sort pass',
        ],
      },
    ],
    faqs: [
      { question: 'What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?', answer: 'ROW_NUMBER assigns unique sequential numbers (no ties). RANK assigns the same number to ties but skips subsequent numbers (1,1,3). DENSE_RANK assigns the same number to ties without skipping (1,1,2). Use ROW_NUMBER for deduplication, RANK for competition-style ranking, and DENSE_RANK for dense ranking reports.' },
      { question: 'When should I use LAG vs LEAD?', answer: 'Use LAG to access previous rows (e.g., last month\'s revenue for month-over-month comparison). Use LEAD to access future rows (e.g., next scheduled delivery date). Both accept an offset parameter: LAG(col, 2) looks 2 rows back.' },
      { question: 'What is a window frame in SQL?', answer: 'A window frame defines which rows within the partition are included in the calculation. ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW gives a running total. ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING gives a 7-row moving window. Frame bounds only apply to aggregate window functions.' },
    ],
    relatedSlugs: ['snowflake-sql'],
    relatedArticles: ['/articles/snowflake-query-optimization-guide-2026', '/articles/snowflake-interview-questions-answers-2026'],
  },

  // ────────────────────────────────────────────
  // 3. dbt Commands Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'dbt-commands',
    title: 'dbt Commands Cheat Sheet',
    shortDescription: 'Complete reference for dbt CLI commands, Jinja macros, model selection syntax, and project configuration. Covers dbt Core and dbt Cloud.',
    category: 'orchestration',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Core CLI Commands',
        type: 'table',
        columns: ['Command', 'Description', 'Common Flags'],
        items: [
          ['dbt run', 'Execute all models', '--select model_name, --full-refresh, --target prod'],
          ['dbt test', 'Run all tests', '--select model_name, --store-failures'],
          ['dbt build', 'Run + test + snapshot + seed (recommended)', '--select +model_name+, --full-refresh'],
          ['dbt compile', 'Compile SQL without executing', '--select model_name'],
          ['dbt seed', 'Load CSV files from /seeds into warehouse', '--select seed_name, --full-refresh'],
          ['dbt snapshot', 'Execute snapshot models (SCD)', '--select snapshot_name'],
          ['dbt docs generate', 'Generate documentation site', '(no common flags)'],
          ['dbt docs serve', 'Serve docs on localhost:8080', '--port 8081'],
          ['dbt source freshness', 'Check source data freshness', '--select source:source_name'],
          ['dbt clean', 'Delete target/ and packages/ dirs', '(no flags)'],
          ['dbt deps', 'Install packages from packages.yml', '(no flags)'],
          ['dbt debug', 'Test connection and config', '(no flags)'],
        ],
      },
      {
        title: 'Node Selection Syntax',
        type: 'table',
        columns: ['Selector', 'Meaning', 'Example'],
        items: [
          ['model_name', 'Single model', 'dbt run --select my_model'],
          ['+model_name', 'Model and all upstream deps', 'dbt run --select +stg_orders'],
          ['model_name+', 'Model and all downstream deps', 'dbt run --select stg_orders+'],
          ['+model_name+', 'Model + all upstream + downstream', 'dbt build --select +dim_customers+'],
          ['tag:tag_name', 'All models with tag', 'dbt run --select tag:daily'],
          ['path:models/staging', 'All models in directory', 'dbt run --select path:models/staging'],
          ['source:src_name', 'A source and related models', 'dbt source freshness --select source:raw'],
          ['@model_name', 'Model + parents + children + children\'s parents', 'dbt run --select @fct_orders'],
          ['--exclude', 'Exclude from selection', 'dbt run --select staging --exclude stg_legacy'],
        ],
      },
      {
        title: 'Jinja & Macros',
        type: 'code',
        language: 'sql',
        code: `-- Reference another model
SELECT * FROM {{ ref('stg_customers') }}

-- Reference a source
SELECT * FROM {{ source('raw', 'orders') }}

-- Config block in model
{{ config(
    materialized='incremental',
    unique_key='order_id',
    on_schema_change='sync_all_columns'
) }}

-- Incremental filter
{% if is_incremental() %}
  WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}

-- Conditional logic
{% if target.name == 'prod' %}
  {{ config(materialized='table') }}
{% else %}
  {{ config(materialized='view') }}
{% endif %}

-- Loop / dynamic SQL
{% set payment_methods = ['credit_card', 'bank_transfer', 'gift_card'] %}
{% for method in payment_methods %}
  SUM(CASE WHEN payment_method = '{{ method }}' THEN amount END) AS {{ method }}_amount
  {% if not loop.last %},{% endif %}
{% endfor %}`,
      },
      {
        title: 'Materializations',
        type: 'table',
        columns: ['Type', 'When to Use', 'Rebuild Behavior'],
        items: [
          ['view', 'Lightweight models, low compute, always fresh', 'Recreated as a SQL view on every run'],
          ['table', 'Final/reporting models, heavy joins, need performance', 'Full drop and rebuild on every run'],
          ['incremental', 'Large fact tables, append/merge new data only', 'Only processes new rows (with is_incremental filter)'],
          ['ephemeral', 'DRY helper CTEs, no warehouse object needed', 'Injected as CTE into downstream models'],
          ['snapshot', 'Track slowly changing dimensions (SCD Type 2)', 'Compares and captures changes over time'],
        ],
      },
      {
        title: 'Project Structure Best Practices',
        type: 'tips',
        items: [
          'Organize models in layers: staging/ → intermediate/ → marts/ (facts + dimensions)',
          'Prefix staging models with stg_, intermediate with int_, facts with fct_, dimensions with dim_',
          'One staging model per source table — no joins, only renaming and casting',
          'Use sources (not hardcoded table names) for all raw data references',
          'Add schema.yml tests for every model: unique, not_null on primary keys minimum',
          'Use tags for orchestration grouping: tag:hourly, tag:daily, tag:weekly',
          'Keep incremental models simple — use unique_key for merge logic',
          'Set +materialized: view in dbt_project.yml for staging, table for marts',
        ],
      },
    ],
    faqs: [
      { question: 'What is the difference between dbt run and dbt build?', answer: 'dbt run only executes model SQL. dbt build runs models AND tests AND seeds AND snapshots in dependency order. Use dbt build as your default — it ensures tests run immediately after each model, catching issues early.' },
      { question: 'How do incremental models work in dbt?', answer: 'Incremental models only process new or changed rows instead of rebuilding the entire table. Use the is_incremental() macro to add a WHERE filter that selects only rows newer than the latest data in the target table. Use --full-refresh to force a complete rebuild when schema changes.' },
      { question: 'What does the + symbol mean in dbt select syntax?', answer: 'The + prefix means "include all upstream dependencies" (+model runs the model and everything it depends on). The + suffix means "include all downstream dependents" (model+ runs the model and everything that depends on it). Combine both for the full lineage: +model+.' },
    ],
    relatedSlugs: ['snowflake-sql', 'airflow-essentials', 'data-modeling', 'databricks'],
    relatedArticles: ['/articles/snowflake-cortex-code-dbt-optimization-guide', '/articles/structuring-dbt-projects-in-snowflake'],
  },

  // ────────────────────────────────────────────
  // 4. Apache Airflow Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'airflow-essentials',
    title: 'Apache Airflow Cheat Sheet',
    shortDescription: 'Essential Airflow CLI commands, DAG patterns, operators, and best practices for orchestrating data pipelines.',
    category: 'orchestration',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'CLI Commands',
        type: 'table',
        columns: ['Command', 'Description', 'Example'],
        items: [
          ['airflow dags list', 'List all DAGs', 'airflow dags list -o table'],
          ['airflow dags trigger', 'Manually trigger a DAG', 'airflow dags trigger my_dag --conf \'{"key":"val"}\''],
          ['airflow dags pause', 'Pause a DAG', 'airflow dags pause my_dag'],
          ['airflow dags unpause', 'Unpause a DAG', 'airflow dags unpause my_dag'],
          ['airflow tasks test', 'Test a single task (no state)', 'airflow tasks test my_dag my_task 2026-01-01'],
          ['airflow tasks run', 'Run a task with state tracking', 'airflow tasks run my_dag my_task 2026-01-01'],
          ['airflow tasks list', 'List tasks in a DAG', 'airflow tasks list my_dag --tree'],
          ['airflow db init', 'Initialize Airflow metadata DB', 'airflow db init'],
          ['airflow db upgrade', 'Upgrade metadata DB schema', 'airflow db upgrade'],
          ['airflow connections list', 'List all connections', 'airflow connections list -o table'],
          ['airflow variables get', 'Get a variable value', 'airflow variables get my_variable'],
          ['airflow info', 'Show Airflow config info', 'airflow info'],
        ],
      },
      {
        title: 'DAG Definition Pattern',
        type: 'code',
        language: 'python',
        code: `from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.snowflake.operators.snowflake import SnowflakeOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'email_on_failure': True,
    'email': ['team@company.com'],
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='daily_etl_pipeline',
    default_args=default_args,
    description='Daily ETL from sources to warehouse',
    schedule_interval='0 6 * * *',       # 6 AM daily
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['etl', 'daily', 'production'],
    max_active_runs=1,
) as dag:

    extract = PythonOperator(
        task_id='extract_data',
        python_callable=extract_from_api,
    )

    transform = SnowflakeOperator(
        task_id='transform_data',
        snowflake_conn_id='snowflake_prod',
        sql='sql/transform.sql',
    )

    validate = PythonOperator(
        task_id='validate_output',
        python_callable=run_data_quality_checks,
    )

    extract >> transform >> validate`,
      },
      {
        title: 'Common Operators',
        type: 'table',
        columns: ['Operator', 'Use Case', 'Key Parameters'],
        items: [
          ['PythonOperator', 'Run Python functions', 'python_callable, op_args, op_kwargs'],
          ['BashOperator', 'Run shell commands', 'bash_command, env'],
          ['SnowflakeOperator', 'Execute Snowflake SQL', 'snowflake_conn_id, sql, warehouse'],
          ['S3ToSnowflakeOperator', 'Load S3 files into Snowflake', 's3_keys, table, schema, file_format'],
          ['EmailOperator', 'Send email notifications', 'to, subject, html_content'],
          ['BranchPythonOperator', 'Conditional branching', 'python_callable (must return task_id)'],
          ['TriggerDagRunOperator', 'Trigger another DAG', 'trigger_dag_id, conf, wait_for_completion'],
          ['ShortCircuitOperator', 'Skip downstream if False', 'python_callable (returns True/False)'],
          ['DummyOperator', 'No-op for DAG structure', 'task_id (used for join points)'],
          ['TaskGroup', 'Visual grouping of tasks', 'group_id, tooltip'],
        ],
      },
      {
        title: 'Schedule Interval Quick Reference',
        type: 'table',
        columns: ['Schedule', 'Cron Expression', 'Preset String'],
        items: [
          ['Every minute', '* * * * *', '@once (single run)'],
          ['Hourly', '0 * * * *', '@hourly'],
          ['Daily at midnight', '0 0 * * *', '@daily'],
          ['Weekly (Sunday)', '0 0 * * 0', '@weekly'],
          ['Monthly (1st)', '0 0 1 * *', '@monthly'],
          ['Yearly (Jan 1)', '0 0 1 1 *', '@yearly'],
          ['Weekdays 6 AM', '0 6 * * 1-5', '(custom cron)'],
          ['Every 15 min', '*/15 * * * *', '(custom cron)'],
        ],
      },
      {
        title: 'Best Practices',
        type: 'tips',
        items: [
          'Set catchup=False unless you specifically need historical backfills',
          'Use max_active_runs=1 for ETL DAGs to prevent parallel run conflicts',
          'Store SQL in separate files (sql/ directory) instead of inline strings',
          'Use Airflow Variables and Connections — never hardcode credentials in DAGs',
          'Use TaskGroups to visually organize complex DAGs instead of SubDAGs (deprecated)',
          'Set meaningful retries and retry_delay — most transient failures resolve in 5 minutes',
          'Use depends_on_past=False unless tasks truly depend on their own previous run',
          'Tag DAGs (tags=[\'etl\',\'daily\']) for filtering in the Airflow UI',
        ],
      },
    ],
    faqs: [
      { question: 'What is the difference between schedule_interval and timetable in Airflow?', answer: 'schedule_interval uses cron expressions or preset strings (@daily, @hourly) and runs at fixed intervals. Timetables (Airflow 2.2+) are Python classes that allow complex custom schedules like "business days only" or "last Friday of each month". Use timetables when cron expressions can\'t express your schedule.' },
      { question: 'Should I use catchup=True or catchup=False?', answer: 'Use catchup=False (default recommended) for most DAGs — it only runs for the current interval. Use catchup=True when you need Airflow to backfill historical runs, such as when deploying a new DAG that needs to process past data. Be careful: a start_date months ago with catchup=True will trigger hundreds of runs.' },
      { question: 'How do I pass data between Airflow tasks?', answer: 'Use XComs (cross-communication) to pass small data between tasks. Tasks can push values with xcom_push() or return values (auto-pushed). Downstream tasks pull with xcom_pull(task_ids=\'upstream_task\'). For large data, write to a shared storage (S3, GCS) and pass the file path via XComs.' },
    ],
    relatedSlugs: ['dbt-commands', 'snowflake-sql'],
    relatedArticles: ['/articles/snowflake-dbt-projects-airflow-orchestration', '/articles/automated-etl-with-airflow-and-python'],
  },

  // ────────────────────────────────────────────
  // 5. Snowflake Interview Questions
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-interview-questions',
    title: 'Top 30 Snowflake Interview Questions & Answers',
    shortDescription: 'Prepare for your Snowflake data engineer interview with these commonly asked questions covering architecture, performance tuning, security, and cost optimization.',
    category: 'interview',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Architecture & Core Concepts',
        type: 'qna',
        items: [
          { question: 'Explain Snowflake\'s multi-cluster shared data architecture.', answer: 'Snowflake separates storage, compute, and cloud services into three independent layers. Storage holds data in compressed columnar micro-partitions on cloud object storage. Compute (virtual warehouses) provides independent, elastically scalable MPP clusters. Cloud services handle metadata, authentication, query parsing, and optimization. This separation means compute can scale without affecting storage costs, and multiple warehouses can query the same data concurrently without contention.', tip: 'Interviewers love follow-ups about micro-partitions — mention they are 50-500MB compressed, immutable, and self-describing.' },
          { question: 'What are micro-partitions and how does Snowflake use them?', answer: 'Micro-partitions are immutable, compressed columnar storage units (50-500MB). Snowflake automatically partitions data as it\'s ingested — there\'s no manual sharding. Each micro-partition stores column metadata (min/max values, distinct count, null count) that enables partition pruning. When a query has a WHERE clause, Snowflake skips micro-partitions whose metadata shows they can\'t contain matching rows.', tip: 'Explain how CLUSTER BY helps when natural ordering degrades — it reorganizes micro-partitions by the cluster key.' },
          { question: 'What is the difference between Snowflake Standard and Enterprise editions?', answer: 'Enterprise adds multi-cluster warehouses (auto-scaling for concurrency), 90-day Time Travel (vs 1 day), materialized views, column-level and row-level security, dynamic data masking, and search optimization. Standard edition is sufficient for development and small workloads, but production environments with concurrency or compliance needs typically require Enterprise.', tip: 'Business Critical adds private link, HIPAA/PCI compliance, and tri-secret secure encryption.' },
          { question: 'How does Snowflake handle concurrency?', answer: 'Snowflake uses multi-cluster warehouses (Enterprise edition) that automatically spin up additional clusters when queries queue. Each cluster is a full MPP compute engine. The scaling policy can be Standard (favor performance, scale up quickly) or Economy (favor cost, scale up only when load sustains). Combined with the shared data layer, multiple warehouses can also query the same data simultaneously without locks.', tip: 'Mention resource monitors to prevent runaway costs from aggressive auto-scaling.' },
          { question: 'Explain Snowflake\'s zero-copy cloning.', answer: 'CLONE creates metadata-only copies of databases, schemas, or tables instantly — no data is physically duplicated. The clone shares the underlying micro-partitions with the source. Only when data is modified (INSERT, UPDATE, DELETE) in either the source or clone does Snowflake write new micro-partitions, at which point the objects diverge. This is ideal for creating dev/test environments from production without doubling storage costs.' },
        ],
      },
      {
        title: 'Performance & Optimization',
        type: 'qna',
        items: [
          { question: 'What is partition pruning and how do you optimize for it?', answer: 'Partition pruning is Snowflake\'s primary query optimization: it skips micro-partitions that can\'t match the query\'s WHERE predicates based on stored min/max metadata. To optimize: (1) filter on columns that data is naturally ordered by (e.g., timestamps), (2) use CLUSTER BY on high-cardinality filter columns for large tables, (3) avoid functions on filter columns (WHERE DATE(ts) = ... prevents pruning; use WHERE ts BETWEEN ... instead).', tip: 'Check pruning with SELECT SYSTEM$CLUSTERING_INFORMATION(\'table\') or look at "Partitions scanned" vs "Partitions total" in query profile.' },
          { question: 'When should you use a materialized view vs a regular table?', answer: 'Materialized views auto-refresh when base data changes and are ideal for expensive aggregations queried frequently (e.g., dashboard rollups). Use regular tables (via dbt or ETL) when you need complex multi-table joins, incremental logic, or control over refresh timing. Materialized views have restrictions: single-table source, no UDFs, no HAVING, no nested views. They also incur background maintenance costs.' },
          { question: 'How do you troubleshoot a slow Snowflake query?', answer: 'Use the Query Profile in Snowflake UI: (1) Check if partitions scanned >> partitions total (add CLUSTER BY or fix WHERE clauses), (2) Look for large "Bytes spilled to local/remote storage" (warehouse too small for the data volume — scale up), (3) Check "Queued" time (concurrency issue — scale out with multi-cluster), (4) Look for exploding joins (bad join keys causing Cartesian products). Also check QUERY_HISTORY view for historical patterns.', tip: 'A common gotcha: SELECT * on wide tables with VARIANT columns forces full deserialization — always project only needed columns.' },
          { question: 'Explain the difference between scaling up and scaling out in Snowflake.', answer: 'Scaling up means increasing warehouse size (XSMALL → MEDIUM → XLARGE) which adds more compute nodes to a single cluster — this helps complex queries process faster. Scaling out means adding more clusters via multi-cluster warehouses — this helps when many concurrent queries are queuing. Scale up for slow individual queries, scale out for concurrency bottlenecks.' },
          { question: 'What is the Search Optimization Service?', answer: 'Search Optimization Service (Enterprise edition) creates auxiliary data structures that accelerate point-lookup queries (WHERE id = ?) and substring/regex searches (WHERE col LIKE \'%term%\'). It\'s useful for selective queries on high-cardinality columns where partition pruning alone isn\'t sufficient. It adds storage and compute cost for maintenance, so enable it only on tables with known selective query patterns.' },
        ],
      },
      {
        title: 'Data Loading & Stages',
        type: 'qna',
        items: [
          { question: 'What are the different types of stages in Snowflake?', answer: 'Snowflake has three stage types: (1) User stages (@~) — private to each user, automatic. (2) Table stages (@%table_name) — tied to a specific table, automatic. (3) Named stages (CREATE STAGE) — can be internal (Snowflake-managed storage) or external (S3, GCS, Azure Blob). For production pipelines, use named external stages pointing to your cloud storage with proper IAM roles.', tip: 'Named internal stages are great for one-off loads; external stages are better for automated pipelines with Snowpipe.' },
          { question: 'How does Snowpipe work and when would you use it?', answer: 'Snowpipe is Snowflake\'s continuous, serverless data ingestion service. It monitors a stage (via cloud event notifications like S3 SQS) and automatically loads new files within minutes. It uses a serverless compute model (you pay per-file, no warehouse needed). Use Snowpipe for near-real-time streaming ingestion from cloud storage. For batch loads on a schedule, COPY INTO with a warehouse is more cost-effective.' },
          { question: 'What is the difference between COPY INTO and INSERT INTO?', answer: 'COPY INTO is optimized for bulk loading from files (stages). It\'s parallelized, tracks loaded files to prevent duplicates, supports file formats (CSV, JSON, Parquet), and is the recommended method for any data loading. INSERT INTO is row-level SQL, useful for small data movements between tables. Never use INSERT INTO for bulk loading from files — it\'s orders of magnitude slower and doesn\'t support file tracking.' },
        ],
      },
      {
        title: 'Security & Governance',
        type: 'qna',
        items: [
          { question: 'Explain Snowflake\'s approach to data security.', answer: 'Snowflake provides security at multiple layers: (1) Network — IP allow/block lists, AWS PrivateLink / Azure Private Link. (2) Authentication — MFA, SSO/SAML, key-pair auth, OAuth. (3) Authorization — RBAC with roles (ACCOUNTADMIN, SYSADMIN, SECURITYADMIN, custom roles). (4) Encryption — AES-256 at rest, TLS 1.2+ in transit, tri-secret secure (Business Critical). (5) Data governance — column/row-level security, dynamic data masking, object tagging, access history.' },
          { question: 'What is the difference between role-based and column-level security?', answer: 'Role-based access control (RBAC) grants privileges on objects (databases, tables, views) to roles, which are granted to users. It controls who can access which objects. Column-level security (masking policies) controls what data users see within a table — different roles see different column values (e.g., full SSN vs masked SSN). Use RBAC for coarse access control and masking policies for fine-grained data protection within shared tables.' },
          { question: 'How does Time Travel differ from Fail-safe?', answer: 'Time Travel (configurable, 0-90 days) allows users to query, clone, or restore historical data using AT/BEFORE clauses. It\'s user-accessible and uses storage you control. Fail-safe is a non-configurable 7-day recovery period after Time Travel expires — it\'s only accessible by Snowflake support for disaster recovery. You cannot query Fail-safe data directly. Use TRANSIENT tables to skip Fail-safe and reduce storage costs for non-critical data.' },
        ],
      },
      {
        title: 'Interview Preparation Tips',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Know the Query Profile Inside Out', body: 'Almost every Snowflake interview includes a "how would you debug a slow query" question. Practice reading query profiles: look for partition pruning ratios, spilling indicators, and join explosion signs. Be ready to suggest concrete fixes for each.' },
          { variant: 'tip', title: 'Understand Cost Drivers', body: 'Snowflake billing revolves around compute (warehouse credits) and storage (per-TB/month). Be prepared to discuss cost optimization: AUTO_SUSPEND, right-sizing warehouses, TRANSIENT tables, and resource monitors. Mention Snowflake\'s credit system (1 credit = 1 XSMALL-hour).' },
          { variant: 'warning', title: 'Common Trap Questions', body: 'Interviewers often ask about Snowflake "indexes" — Snowflake does NOT have traditional B-tree indexes. It uses micro-partition pruning, cluster keys, and the Search Optimization Service instead. Another trap: Snowflake does NOT support UPDATE with JOIN syntax directly — use MERGE instead.' },
          { variant: 'info', title: 'Certification Edge', body: 'If you hold a SnowPro certification, mention it early. The SnowPro Core or Data Engineer specialty demonstrates validated knowledge and gives you an edge over candidates who only have hands-on experience.' },
        ],
      },
    ],
    faqs: [
      { question: 'How many questions are typically asked in a Snowflake interview?', answer: 'A typical Snowflake data engineer interview includes 8-12 technical questions over 45-60 minutes. Expect a mix of architecture (2-3), SQL/performance (3-4), data loading (2-3), and situational/design questions (2-3). Senior roles include more system design and cost optimization questions.' },
      { question: 'Do I need to know SQL for a Snowflake interview?', answer: 'Yes. Strong SQL is essential. Expect questions on window functions, CTEs, MERGE statements, and Snowflake-specific syntax like QUALIFY, FLATTEN, and VARIANT querying. Many interviews include a live SQL coding exercise.' },
      { question: 'Should I learn Snowflake for free before the interview?', answer: 'Snowflake offers a free 30-day trial with $400 in credits. Create an account, load sample data (SNOWFLAKE_SAMPLE_DATA database is pre-loaded), and practice queries. Focus on: Time Travel, cloning, warehouse management, and semi-structured data handling.' },
    ],
    relatedSlugs: ['snowflake-streams-tasks-interview', 'snowflake-dynamic-tables-interview', 'snowflake-snowpark-interview', 'snowflake-governance-interview', 'snowflake-performance-deep-dive-interview', 'snowflake-cost-optimization-interview'],
    relatedArticles: ['/articles/snowflake-interview-questions-answers-2026', '/articles/snowflake-query-optimization-guide-2026'],
  },

  // ────────────────────────────────────────────
  // 6. SQL Interview Questions
  // ────────────────────────────────────────────
  {
    slug: 'sql-interview-questions',
    title: 'Top 25 SQL Interview Questions for Data Engineers',
    shortDescription: 'Master the most frequently asked SQL interview questions with detailed answers. Covers joins, window functions, CTEs, query optimization, and real-world data scenarios.',
    category: 'interview',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Joins & Relationships',
        type: 'qna',
        items: [
          { question: 'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.', answer: 'INNER JOIN returns only rows with matches in both tables. LEFT JOIN returns all rows from the left table plus matches from the right (NULLs where no match). RIGHT JOIN is the mirror of LEFT JOIN. FULL OUTER JOIN returns all rows from both tables, with NULLs where no match exists on either side. In practice, LEFT JOIN is used most often — RIGHT JOIN is rarely needed and can always be rewritten as a LEFT JOIN.', tip: 'Interviewers often follow up with: "What happens if the join key has NULLs?" Answer: NULLs never match each other in joins.' },
          { question: 'What is a CROSS JOIN and when would you use it?', answer: 'A CROSS JOIN produces the Cartesian product of two tables — every row paired with every row. It\'s rarely used in production but has valid use cases: generating date spines (CROSS JOIN a dates table with a dimensions table), creating all possible combinations for A/B test matrices, or expanding sparse data into dense grids. Always use with caution — a CROSS JOIN of two 10K-row tables produces 100M rows.' },
          { question: 'How do you find rows in table A that don\'t exist in table B?', answer: 'Three approaches: (1) LEFT JOIN + WHERE b.key IS NULL (most readable). (2) NOT EXISTS (SELECT 1 FROM b WHERE b.key = a.key) — often fastest with proper indexes. (3) NOT IN (SELECT key FROM b) — avoid this: it fails silently if b.key contains NULLs (returns no rows). Use LEFT JOIN or NOT EXISTS for correctness and performance.' },
          { question: 'What is a self-join? Give a practical example.', answer: 'A self-join joins a table to itself using different aliases. Example: finding employees and their managers from an employees table: SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id. Also used for: comparing consecutive events, finding duplicates, and hierarchical data traversal.' },
        ],
      },
      {
        title: 'Window Functions & Aggregations',
        type: 'qna',
        items: [
          { question: 'What is the difference between GROUP BY and window functions?', answer: 'GROUP BY collapses rows into summary rows (one row per group). Window functions compute values across a set of rows but preserve every individual row in the result. Example: GROUP BY department gives one salary-sum row per department. SUM(salary) OVER (PARTITION BY department) adds a department total column to every employee row. Use GROUP BY for aggregated reports, window functions when you need both detail and summary.', tip: 'Common follow-up: "Can you use WHERE to filter window function results?" No — use HAVING for GROUP BY, QUALIFY (Snowflake/BigQuery) or a subquery for window functions.' },
          { question: 'Write a query to find the second-highest salary in each department.', answer: 'SELECT department, employee, salary FROM (SELECT *, DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk FROM employees) ranked WHERE rnk = 2. Use DENSE_RANK (not ROW_NUMBER) to correctly handle ties — if two people share the highest salary, DENSE_RANK still assigns rank 2 to the next salary level. In Snowflake: SELECT * FROM employees QUALIFY DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) = 2.' },
          { question: 'How do you calculate a running total in SQL?', answer: 'SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW). The ORDER BY defines the sequence, and the frame clause defines the window (all rows from start to current). You can also use the shorthand SUM(amount) OVER (ORDER BY date) since the default frame is UNBOUNDED PRECEDING to CURRENT ROW. Add PARTITION BY to reset the running total per group.' },
          { question: 'Explain the difference between RANK, DENSE_RANK, and ROW_NUMBER.', answer: 'All three assign sequential numbers based on ORDER BY. ROW_NUMBER: always unique, arbitrary for ties (1,2,3,4). RANK: same number for ties, skips next (1,1,3,4). DENSE_RANK: same number for ties, no gaps (1,1,2,3). Use ROW_NUMBER for deduplication (pick one row per key). Use DENSE_RANK for "top N values" queries. Use RANK for competition-style ranking (3rd place after two 1st-place ties is 3rd, not 2nd).' },
        ],
      },
      {
        title: 'CTEs, Subqueries & Query Design',
        type: 'qna',
        items: [
          { question: 'What is a CTE and how does it differ from a subquery?', answer: 'A CTE (Common Table Expression) is defined with WITH ... AS and creates a named temporary result set readable like a table. Compared to subqueries: CTEs are more readable (especially when nested), can be referenced multiple times in the same query, and support recursion. Performance is usually identical — most databases inline CTEs like subqueries. Use CTEs for readability; use subqueries for simple one-off filters.', tip: 'Snowflake materializes CTEs referenced more than once in a query, which can improve performance for expensive computations.' },
          { question: 'What is a recursive CTE? Give an example.', answer: 'A recursive CTE references itself to traverse hierarchical data. Structure: WITH RECURSIVE cte AS (base_case UNION ALL recursive_case). Example — organization hierarchy: WITH RECURSIVE org AS (SELECT id, name, manager_id, 1 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.name, e.manager_id, o.level + 1 FROM employees e JOIN org o ON e.manager_id = o.id) SELECT * FROM org. Always include a termination condition to prevent infinite loops.' },
          { question: 'How do you remove duplicate rows from a table?', answer: 'Read-only (SELECT distinct rows): SELECT DISTINCT * FROM table, or use ROW_NUMBER() OVER (PARTITION BY duplicate_key ORDER BY tiebreaker) and keep rn = 1. Delete duplicates in-place: In Snowflake, use CREATE OR REPLACE TABLE t AS SELECT * FROM t QUALIFY ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) = 1. In Postgres/MySQL, use DELETE with a CTE that identifies duplicate row IDs to remove.' },
        ],
      },
      {
        title: 'Must-Know SQL Patterns',
        type: 'checklist',
        items: [
          { label: 'Deduplication with ROW_NUMBER + QUALIFY', detail: 'The #1 most-asked SQL pattern. Know it by heart: QUALIFY ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC) = 1', checked: true },
          { label: 'Running totals with SUM() OVER (ORDER BY ...)', detail: 'Understand frame clauses: ROWS vs RANGE, UNBOUNDED PRECEDING, CURRENT ROW', checked: true },
          { label: 'Gap-and-island detection with LAG/LEAD', detail: 'Find gaps in sequences or group consecutive events using window function differences', checked: true },
          { label: 'MERGE for upserts (INSERT or UPDATE)', detail: 'MERGE INTO target USING source ON key WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT', checked: true },
          { label: 'Pivot / unpivot data', detail: 'Use CASE WHEN + GROUP BY for manual pivoting, or PIVOT/UNPIVOT in Snowflake', checked: true },
          { label: 'Date spine generation', detail: 'Use a dates table or GENERATOR to create continuous date ranges for filling gaps in time-series data', checked: true },
        ],
      },
    ],
    faqs: [
      { question: 'What SQL topics are most important for data engineering interviews?', answer: 'Focus on: (1) Window functions (ROW_NUMBER, RANK, LAG/LEAD, running totals) — asked in nearly every interview. (2) Joins including self-joins and anti-joins. (3) CTEs and subquery optimization. (4) MERGE/upsert patterns. (5) Data deduplication techniques. (6) Date/time manipulation and gap filling.' },
      { question: 'Should I practice SQL on LeetCode or HackerRank?', answer: 'Both are good for practice. LeetCode has more realistic data engineering problems. HackerRank has a better SQL-specific track. Also practice with real Snowflake trial accounts — interviewers value experience with actual data warehouse SQL dialects over generic SQL practice.' },
    ],
    relatedSlugs: ['snowflake-sql', 'sql-window-functions', 'snowflake-interview-questions', 'data-engineering-interview-questions'],
    relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'],
  },

  // ────────────────────────────────────────────
  // 7. Data Engineering Interview Questions
  // ────────────────────────────────────────────
  {
    slug: 'data-engineering-interview-questions',
    title: 'Data Engineering Interview Questions & Answers',
    shortDescription: 'Comprehensive guide to data engineering interview questions covering ETL pipelines, data modeling, orchestration, cloud platforms, and system design.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'ETL & Pipeline Design',
        type: 'qna',
        items: [
          { question: 'What is the difference between ETL and ELT?', answer: 'ETL (Extract, Transform, Load) transforms data before loading into the warehouse — common with on-prem systems where compute was limited. ELT (Extract, Load, Transform) loads raw data first, then transforms using warehouse compute (Snowflake, BigQuery). ELT is the modern standard because cloud warehouses offer cheap, elastic compute. ELT also preserves raw data for reprocessing and simplifies pipeline architecture.', tip: 'Mention that dbt is the de-facto ELT transformation layer — it\'s a major signal that you\'re up to date.' },
          { question: 'How do you handle schema evolution in a data pipeline?', answer: 'Strategies: (1) Schema-on-read with VARIANT/JSON columns (Snowflake handles this well). (2) dbt with on_schema_change=\'sync_all_columns\' for incremental models. (3) Schema registries (Confluent for Kafka) to enforce compatibility. (4) Landing raw data as-is, then applying schema validation in a staging layer. The key principle: never let a schema change break downstream consumers. Use additive changes (add columns) and avoid destructive changes (rename/drop columns).' },
          { question: 'Design a real-time data pipeline for an e-commerce platform.', answer: 'Architecture: (1) Event capture with Kafka/Kinesis from application events (clicks, orders, payments). (2) Stream processing with Flink or Kafka Streams for real-time transformations (dedup, enrichment, sessionization). (3) Dual sink: real-time layer (Redis/DynamoDB for live dashboards) + batch layer (S3/GCS → Snowpipe → Snowflake for analytics). (4) dbt for batch transformations on the warehouse side. (5) Orchestration with Airflow for batch ETL; event-driven for streaming. Key considerations: idempotency, exactly-once semantics, dead-letter queues for failures.' },
          { question: 'How do you ensure data quality in production pipelines?', answer: 'Multi-layered approach: (1) Schema validation at ingestion (reject malformed records). (2) dbt tests on every model: not_null, unique, accepted_values, relationships. (3) Great Expectations or dbt-expectations for statistical tests (row count anomalies, distribution shifts). (4) Freshness checks (dbt source freshness, Airflow sensors). (5) Alerting on failures via Slack/PagerDuty. (6) Data contracts between producers and consumers defining expected schemas and SLAs.' },
        ],
      },
      {
        title: 'Data Modeling',
        type: 'qna',
        items: [
          { question: 'Explain the difference between star schema and snowflake schema.', answer: 'Star schema: a central fact table (transactions, events) surrounded by denormalized dimension tables (customers, products, dates). Simple, fast for queries, easy to understand. Snowflake schema: dimensions are normalized into sub-dimensions (country → region → city). Saves storage but adds join complexity. Modern recommendation: use star schema for analytics warehouses. Storage is cheap; query performance and simplicity matter more.' },
          { question: 'What is a slowly changing dimension (SCD)? Explain Type 1 vs Type 2.', answer: 'SCD tracks how dimension attributes change over time. Type 1: overwrite the old value (no history). Simple but loses historical context. Type 2: insert a new row with effective dates (valid_from, valid_to) and a current flag. Preserves full history for auditing and point-in-time analysis. Type 3: add a "previous value" column — tracks one level of history. In practice, use Type 2 for important dimensions (customers, products) and Type 1 for non-critical attributes.', tip: 'dbt snapshots implement SCD Type 2 automatically — mention this in interviews to show practical knowledge.' },
          { question: 'What are the layers in a modern data warehouse (medallion architecture)?', answer: 'Bronze (raw/staging): raw data as-is from sources, minimal transformations. Silver (intermediate/cleaned): cleaned, deduplicated, typed data with business logic applied. Gold (marts/presentation): aggregated, business-ready models optimized for consumers (BI tools, ML features). This maps to the dbt convention: staging/ → intermediate/ → marts/. Benefits: reprocessable from raw data, clear data lineage, separation of concerns.' },
        ],
      },
      {
        title: 'System Design Essentials',
        type: 'checklist',
        items: [
          { label: 'Understand batch vs streaming tradeoffs', detail: 'Batch: higher throughput, simpler error handling, higher latency. Streaming: low latency, complex state management, exactly-once semantics challenges.', checked: true },
          { label: 'Know your storage formats', detail: 'Parquet (columnar, best for analytics), Avro (row-based, good for streaming/Kafka), ORC (Hive optimized), JSON (flexible but slow). Always prefer Parquet for warehouse loads.', checked: true },
          { label: 'Design for idempotency', detail: 'Every pipeline step should produce the same result when rerun. Use MERGE instead of INSERT, dedup on natural keys, and use deterministic processing timestamps.', checked: true },
          { label: 'Plan for failure recovery', detail: 'Dead-letter queues for bad records, checkpoint/savepoint mechanisms, retry with exponential backoff, alerting on SLA breaches.', checked: true },
          { label: 'Cost awareness in cloud architectures', detail: 'Compute (warehouse sizing, auto-suspend), storage (compression, lifecycle policies), data transfer (cross-region costs), and serverless vs provisioned trade-offs.', checked: true },
        ],
      },
      {
        title: 'Key Insights for Interviews',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Show End-to-End Thinking', body: 'When answering system design questions, cover the full pipeline: source → ingestion → transformation → serving → monitoring. Interviewers want to see you think beyond just the SQL layer.' },
          { variant: 'warning', title: 'Don\'t Over-Engineer', body: 'A common mistake is proposing Kafka + Flink + Spark for a problem that a simple Airflow + dbt + Snowflake stack solves. Start with the simplest architecture that meets requirements, then discuss when to add complexity.' },
          { variant: 'info', title: 'Talk About Trade-offs', body: 'Senior engineers are expected to discuss trade-offs, not just solutions. "We could use X which is simpler but has Y limitation, or Z which handles the edge case but adds operational complexity" shows maturity.' },
        ],
      },
    ],
    faqs: [
      { question: 'What tools should I know for a data engineering interview?', answer: 'Core stack: SQL (Snowflake/BigQuery/Redshift), Python, dbt, Airflow/Dagster, and one cloud platform (AWS/GCP/Azure). Nice to have: Kafka, Spark, Terraform, Docker. Know the "why" behind each tool — interviewers value architectural thinking over tool-name-dropping.' },
      { question: 'How should I prepare for a system design round?', answer: 'Practice designing: (1) a real-time analytics pipeline, (2) a batch ETL for a data warehouse, (3) a CDC pipeline, (4) a data quality monitoring system. Use the framework: Requirements → Data flow → Storage → Compute → Orchestration → Monitoring. Draw diagrams and discuss trade-offs at each decision point.' },
    ],
    relatedSlugs: ['snowflake-interview-questions', 'sql-interview-questions', 'dbt-best-practices', 'python-for-data-engineers', 'pyspark', 'data-modeling'],
    relatedArticles: ['/articles/building-end-to-end-data-pipeline', '/articles/data-engineering-on-snowflake-2026'],
  },

  // ────────────────────────────────────────────
  // 8. Snowflake Best Practices
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-best-practices',
    title: 'Snowflake Best Practices for Data Engineers',
    shortDescription: 'Production-proven best practices for Snowflake covering warehouse management, query optimization, cost control, security, and data modeling.',
    category: 'bestpractices',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Warehouse Management',
        type: 'checklist',
        items: [
          { label: 'Set AUTO_SUSPEND = 60 on all warehouses', detail: 'Default is 600 seconds (10 min). Reducing to 60s saves significant credits. The 1-second resume time means users barely notice.', checked: true },
          { label: 'Use separate warehouses for ETL and BI queries', detail: 'Prevents long-running ETL from blocking dashboard queries. Name them clearly: WH_ETL_PROD, WH_BI_PROD, WH_DEV.', checked: true },
          { label: 'Right-size warehouses based on query profile data', detail: 'Start with XSMALL, check for "Bytes spilled to remote storage" in query profiles. Scale up only when spilling is consistent.', checked: true },
          { label: 'Enable multi-cluster for BI warehouses', detail: 'Use Standard scaling policy and MAX_CLUSTER_COUNT=3 for dashboards. Use Economy for cost-sensitive batch workloads.', checked: true },
          { label: 'Set up resource monitors', detail: 'CREATE RESOURCE MONITOR with credit quotas and NOTIFY + SUSPEND triggers. Prevents runaway costs from bad queries or misconfigured pipelines.', checked: true },
          { label: 'Never leave a warehouse running 24/7', detail: 'AUTO_RESUME = TRUE + AUTO_SUSPEND = 60 means warehouses spin up on demand and shut down when idle. Zero reason for always-on warehouses.', checked: false },
        ],
      },
      {
        title: 'Query Performance',
        type: 'checklist',
        items: [
          { label: 'Avoid SELECT * in production queries', detail: 'Snowflake stores data in columnar micro-partitions. SELECT * forces reading all columns. Specify only needed columns for better pruning and less I/O.', checked: true },
          { label: 'Use CLUSTER BY for large, frequently filtered tables', detail: 'Tables over 1TB with consistent WHERE clause patterns benefit from clustering. Choose 1-3 low-cardinality columns (e.g., date, region).', checked: true },
          { label: 'Filter before joining', detail: 'Apply WHERE clauses to reduce row counts before JOIN operations. CTE or subquery pre-filtering can dramatically reduce join work.', checked: true },
          { label: 'Use QUALIFY instead of subqueries for window filters', detail: 'Snowflake-native, cleaner syntax, and often more efficient: QUALIFY ROW_NUMBER() OVER (...) = 1 instead of a wrapper subquery.', checked: true },
          { label: 'Use MERGE for upserts instead of DELETE + INSERT', detail: 'MERGE is atomic and handles matched/unmatched rows in a single statement. Avoids race conditions and is more efficient.', checked: true },
          { label: 'Don\'t wrap filter columns in functions', detail: 'WHERE YEAR(created_at) = 2026 prevents partition pruning. Use WHERE created_at >= \'2026-01-01\' AND created_at < \'2027-01-01\' instead.', checked: false },
        ],
      },
      {
        title: 'Cost Optimization',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Use TRANSIENT Tables for Staging Data', body: 'Transient tables skip Fail-safe (7-day recovery period), reducing storage costs. Use them for staging, temp, and intermediate tables that can be easily recreated from source data.' },
          { variant: 'tip', title: 'Compress and Use Parquet for File Loads', body: 'Parquet files are columnar and compressed — Snowflake loads them fastest. Compared to CSV, Parquet loads are 3-5x faster and use 60-80% less storage. Always convert source files to Parquet before loading.' },
          { variant: 'warning', title: 'Watch Out for Serverless Feature Costs', body: 'Snowpipe, Search Optimization, and Materialized Views use serverless compute that runs outside your warehouse. These costs are easy to miss. Monitor them in SNOWFLAKE.ORGANIZATION_USAGE.METERING_DAILY_HISTORY.' },
          { variant: 'info', title: 'Use Query Tags for Cost Attribution', body: 'ALTER SESSION SET QUERY_TAG = \'pipeline:orders_etl\'; Tags show up in QUERY_HISTORY and WAREHOUSE_METERING_HISTORY, letting you attribute costs to specific teams, pipelines, or applications.' },
        ],
      },
      {
        title: 'Security Hardening',
        type: 'checklist',
        items: [
          { label: 'Use RBAC with least-privilege roles', detail: 'Never grant ACCOUNTADMIN to service accounts. Create functional roles (ANALYST, ETL_RUNNER, DATA_ADMIN) with minimal required privileges.', checked: true },
          { label: 'Enable MFA for all human users', detail: 'ALTER USER username SET EXT_AUTHN_DUO = TRUE. MFA is the single most effective security control against credential theft.', checked: true },
          { label: 'Use key-pair authentication for service accounts', detail: 'Service accounts should never use passwords. Generate RSA key pairs and assign public keys to the Snowflake user.', checked: true },
          { label: 'Apply dynamic data masking on sensitive columns', detail: 'Create masking policies that show full data to privileged roles and masked data to others. Works transparently without query changes.', checked: true },
          { label: 'Enable network policies to restrict IP access', detail: 'CREATE NETWORK POLICY with ALLOWED_IP_LIST. Restrict access to corporate VPN/office IPs. Use PrivateLink for production workloads.', checked: true },
        ],
      },
      {
        title: 'Data Loading Best Practices',
        type: 'tips',
        items: [
          'Use COPY INTO for batch loads — it tracks loaded files and prevents duplicates',
          'Split large files into 100-250MB compressed chunks for parallel loading',
          'Use Parquet or compressed CSV (GZIP) — never load uncompressed files',
          'Set ON_ERROR = CONTINUE for initial data exploration, ABORT_STATEMENT for production',
          'Use VALIDATION_MODE = RETURN_ERRORS to dry-run before loading into production tables',
          'For real-time ingestion, use Snowpipe with auto-ingest from S3/GCS event notifications',
          'Load into staging tables first, then INSERT INTO or MERGE into production tables',
          'Use FILE_FORMAT objects for reusable parsing configs across multiple COPY statements',
        ],
      },
    ],
    faqs: [
      { question: 'What is the most important Snowflake optimization for cost?', answer: 'AUTO_SUSPEND on warehouses. The default 600-second (10-minute) timeout wastes credits on idle warehouses. Setting AUTO_SUSPEND = 60 (or even 30 for dev warehouses) with AUTO_RESUME = TRUE is the single highest-impact cost optimization for most organizations.' },
      { question: 'How do I monitor Snowflake costs?', answer: 'Use the SNOWFLAKE.ACCOUNT_USAGE schema: WAREHOUSE_METERING_HISTORY for compute costs, STORAGE_USAGE for storage costs, and QUERY_HISTORY for per-query cost analysis. Set up resource monitors with credit quotas and alerts. For organization-level views, use SNOWFLAKE.ORGANIZATION_USAGE.' },
      { question: 'Should I use Snowflake materialized views?', answer: 'Use them sparingly. Materialized views auto-refresh (adding serverless compute cost), only support single-table sources, and have syntax restrictions. They\'re best for expensive aggregations on large tables queried frequently by BI tools. For complex multi-table transformations, use dbt models materialized as tables on a schedule instead.' },
    ],
    relatedSlugs: ['snowflake-sql', 'snowflake-interview-questions', 'dbt-best-practices'],
    relatedArticles: ['/articles/snowflake-query-optimization-guide-2026', '/articles/snowflake-cost-optimization-guide'],
  },

  // ────────────────────────────────────────────
  // 9. dbt Best Practices
  // ────────────────────────────────────────────
  {
    slug: 'dbt-best-practices',
    title: 'dbt Best Practices for Production Projects',
    shortDescription: 'Battle-tested dbt best practices for project structure, model design, testing, performance, and CI/CD. Based on real-world production deployments.',
    category: 'bestpractices',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Project Structure',
        type: 'checklist',
        items: [
          { label: 'Use the staging → intermediate → marts layered architecture', detail: 'staging/ (1:1 source mapping, rename + cast only) → intermediate/ (business logic, joins) → marts/ (consumer-ready facts + dimensions). This is the dbt Labs recommended pattern.', checked: true },
          { label: 'One staging model per source table', detail: 'stg_stripe__payments.sql maps to one source table. No joins in staging — only SELECT, rename, cast, and basic type conversions.', checked: true },
          { label: 'Prefix models consistently', detail: 'stg_ for staging, int_ for intermediate, fct_ for facts, dim_ for dimensions. Makes model purpose instantly clear from the name.', checked: true },
          { label: 'Use sources for all raw table references', detail: 'Never hardcode database.schema.table in models. Define sources in schema.yml and use {{ source(\'name\', \'table\') }}. Enables lineage tracking and freshness checks.', checked: true },
          { label: 'Keep SQL DRY with Jinja macros and packages', detail: 'Extract repeated logic into macros/ directory. Use dbt-utils, dbt-expectations, and codegen packages instead of reinventing common patterns.', checked: true },
          { label: 'Don\'t use ephemeral materialization excessively', detail: 'Ephemeral models compile as CTEs which can\'t be queried directly, making debugging hard. Use views for lightweight models instead.', checked: false },
        ],
      },
      {
        title: 'Testing Strategy',
        type: 'checklist',
        items: [
          { label: 'Add unique + not_null tests on every primary key', detail: 'This is the absolute minimum. Every model\'s schema.yml should have these two tests on the primary key column. No exceptions.', checked: true },
          { label: 'Use accepted_values for enum columns', detail: 'Catch data drift early: if a status column suddenly has an unexpected value, your pipeline should fail, not silently propagate bad data.', checked: true },
          { label: 'Add relationship tests between fact and dimension keys', detail: 'relationships test ensures every foreign key in a fact table has a matching row in the dimension. Catches broken joins before BI users see missing data.', checked: true },
          { label: 'Use dbt-expectations for statistical tests', detail: 'expect_column_values_to_be_between, expect_table_row_count_to_be_between — catch anomalies like a suddenly empty table or extreme values.', checked: true },
          { label: 'Run tests with --store-failures', detail: 'Stores failing rows in a schema for post-mortem analysis. Much easier to debug than "5 rows failed not_null test."', checked: true },
          { label: 'Never skip tests in CI/CD', detail: 'Use dbt build (not dbt run) so tests execute immediately after each model. A model that passes run but fails test is not production-ready.', checked: false },
        ],
      },
      {
        title: 'Incremental Model Patterns',
        type: 'code',
        language: 'sql',
        code: `-- Standard incremental with merge
{{ config(
    materialized='incremental',
    unique_key='order_id',
    on_schema_change='sync_all_columns'
) }}

SELECT
    order_id,
    customer_id,
    order_total,
    updated_at
FROM {{ ref('stg_orders') }}

{% if is_incremental() %}
  WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}

-- Incremental with delete+insert (for partitioned data)
{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='date_day'
) }}

SELECT
    date_day,
    SUM(revenue) AS total_revenue,
    COUNT(DISTINCT user_id) AS unique_users
FROM {{ ref('int_daily_events') }}
{% if is_incremental() %}
  WHERE date_day >= DATEADD('day', -3, CURRENT_DATE)
{% endif %}
GROUP BY date_day`,
      },
      {
        title: 'Performance & Deployment',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Use defer + state for Slim CI', body: 'dbt build --select state:modified+ --defer --state prod-manifest/ — only builds changed models and their downstream dependents, referencing production for unchanged upstream models. Cuts CI time by 80%+.' },
          { variant: 'tip', title: 'Materialize Staging as Views, Marts as Tables', body: 'Set +materialized: view under models/staging/ in dbt_project.yml and +materialized: table under models/marts/. Views for staging are free; tables for marts give BI tools fast access.' },
          { variant: 'warning', title: 'Full Refresh Cautiously', body: '--full-refresh rebuilds the entire incremental table. This can be extremely expensive for large tables (billions of rows). Schedule full refreshes weekly or monthly, not on every deploy. Document which models are safe to full-refresh.' },
          { variant: 'info', title: 'Use Tags for Selective Runs', body: 'Tag models with {{ config(tags=[\'daily\', \'critical\']) }} and run subsets: dbt build --select tag:hourly. This enables tiered SLAs — critical models run every hour, others daily.' },
        ],
      },
    ],
    faqs: [
      { question: 'Should I use dbt Core or dbt Cloud?', answer: 'dbt Core is free, open-source, and gives you full control — ideal if you have engineering resources to manage CI/CD, scheduling, and infrastructure. dbt Cloud adds a managed IDE, job scheduler, documentation hosting, and built-in CI. Use dbt Cloud if you want faster onboarding and less infrastructure management. Many teams use Core in CI/CD pipelines and Cloud for development.' },
      { question: 'How do I handle late-arriving data in incremental models?', answer: 'Use a lookback window: WHERE updated_at > DATEADD(\'day\', -3, (SELECT MAX(updated_at) FROM {{ this }})). This reprocesses the last 3 days of data on every run, catching late arrivals. Combine with unique_key for proper merge behavior. The tradeoff is slightly higher compute cost for better data accuracy.' },
      { question: 'What is the difference between ref() and source()?', answer: 'ref() references another dbt model — dbt handles the database/schema resolution and builds a dependency graph. source() references a raw table defined in sources.yml — it doesn\'t create a dependency on another model, but enables lineage tracking and freshness monitoring. Rule: use source() for the first layer (staging), ref() everywhere else.' },
    ],
    relatedSlugs: ['dbt-commands', 'snowflake-best-practices', 'airflow-best-practices'],
    relatedArticles: ['/articles/structuring-dbt-projects-in-snowflake', '/articles/snowflake-cortex-code-dbt-optimization-guide'],
  },

  // ────────────────────────────────────────────
  // 10. Airflow Best Practices
  // ────────────────────────────────────────────
  {
    slug: 'airflow-best-practices',
    title: 'Apache Airflow Best Practices for Production',
    shortDescription: 'Production-hardened Airflow best practices for DAG design, task management, monitoring, and deployment. Avoid common pitfalls that cause pipeline failures.',
    category: 'bestpractices',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'DAG Design Principles',
        type: 'checklist',
        items: [
          { label: 'Keep DAG files lightweight — no heavy imports at module level', detail: 'Airflow parses all DAG files every 30 seconds. Heavy imports (pandas, sqlalchemy) in the module scope slow down the scheduler. Move imports inside task callables.', checked: true },
          { label: 'Set catchup=False unless you need historical backfills', detail: 'catchup=True with a start_date months ago triggers hundreds of DAG runs. Set False by default and use manual backfills (airflow dags backfill) when needed.', checked: true },
          { label: 'Use max_active_runs=1 for ETL DAGs', detail: 'Prevents overlapping runs that can cause data corruption or duplicate processing. Allow >1 only for independent, idempotent workloads.', checked: true },
          { label: 'Use TaskGroups instead of SubDAGs', detail: 'SubDAGs are deprecated and have known deadlock issues. TaskGroups provide the same visual grouping without the operational problems.', checked: true },
          { label: 'Make every task idempotent', detail: 'Running a task twice with the same input should produce the same output. Use MERGE instead of INSERT, truncate-then-load patterns, and deterministic file naming.', checked: true },
          { label: 'Don\'t use trigger_rule="all_done" carelessly', detail: 'all_done runs the task regardless of upstream success/failure. This can mask failures and propagate bad data. Use it only for cleanup or notification tasks.', checked: false },
        ],
      },
      {
        title: 'Task Management',
        type: 'checklist',
        items: [
          { label: 'Set meaningful retries and retry_delay', detail: 'retries=2, retry_delay=timedelta(minutes=5) handles most transient failures (API timeouts, network blips). Don\'t retry indefinitely — fail fast for persistent errors.', checked: true },
          { label: 'Use Airflow Variables and Connections — never hardcode credentials', detail: 'Store secrets in Airflow Connections (encrypted). Use Variables for config values. Or better: integrate with a secrets backend (AWS Secrets Manager, HashiCorp Vault).', checked: true },
          { label: 'Keep XCom payloads small (<48KB)', detail: 'XComs are stored in the metadata database. Large payloads (dataframes, file contents) bloat the DB and slow the scheduler. Write large data to S3/GCS and pass the path via XCom.', checked: true },
          { label: 'Use execution_date for partitioning, not datetime.now()', detail: 'execution_date is deterministic and enables proper backfills. datetime.now() makes tasks non-idempotent and breaks reruns.', checked: true },
          { label: 'Store SQL in separate files, not inline strings', detail: 'Put SQL in a /sql directory and reference with SnowflakeOperator(sql=\'sql/transform.sql\'). Easier to version, review, and test than inline SQL strings.', checked: true },
        ],
      },
      {
        title: 'Monitoring & Alerting',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Set Up SLA Misses', body: 'Use the sla parameter on tasks to define expected completion times. Airflow sends SLA miss notifications when tasks exceed their deadline. sla=timedelta(hours=2) means "this task should complete within 2 hours of the DAG\'s execution_date."' },
          { variant: 'tip', title: 'Use on_failure_callback for Custom Alerts', body: 'Define a callback function that sends Slack/PagerDuty alerts on task failure. More flexible than email_on_failure and can include context like task logs, execution date, and error messages.' },
          { variant: 'warning', title: 'Monitor the Scheduler Health', body: 'A common production issue: the scheduler falls behind or stops parsing DAGs. Monitor scheduler heartbeat, DAG file processing time, and the task instance queue length. Set up alerts for scheduler lag exceeding 5 minutes.' },
          { variant: 'info', title: 'Use DAG Tags for Organization', body: 'tags=[\'etl\', \'daily\', \'team:data-eng\'] enables filtering in the Airflow UI. With hundreds of DAGs, tags are the primary way teams find and monitor their pipelines. Adopt a consistent tagging convention early.' },
        ],
      },
      {
        title: 'Deployment & CI/CD',
        type: 'tips',
        items: [
          'Use a Git-based deployment workflow: PR → review → merge to main → deploy DAGs to production',
          'Test DAGs locally with airflow dags test before deploying — catches import errors and logic bugs',
          'Pin all Python and provider package versions in requirements.txt to prevent surprise breakage',
          'Use Docker/Kubernetes for consistent environments across dev, staging, and production',
          'Implement DAG integrity tests in CI: parse all DAG files, check for import errors, validate task dependencies',
          'Use Airflow\'s REST API or CLI for programmatic DAG management in CI/CD pipelines',
          'Deploy DAG files separately from Airflow infrastructure — DAGs change frequently, Airflow version changes are infrequent',
        ],
      },
    ],
    faqs: [
      { question: 'Should I use Airflow or Dagster/Prefect?', answer: 'Airflow is the industry standard with the largest ecosystem and community. Choose Airflow if: your team already knows it, you need extensive operator libraries, or you\'re running on managed services (MWAA, Cloud Composer, Astronomer). Consider Dagster/Prefect if: starting fresh, want better local development experience, or prefer software-defined assets over task-based orchestration.' },
      { question: 'How do I handle DAG dependencies (cross-DAG)?', answer: 'Options: (1) TriggerDagRunOperator — triggers another DAG at a specific point. (2) ExternalTaskSensor — waits for a task in another DAG to complete. (3) Datasets (Airflow 2.4+) — data-aware scheduling where DAGs trigger when upstream data is updated. Datasets are the recommended modern approach.' },
    ],
    relatedSlugs: ['airflow-essentials', 'dbt-best-practices'],
    relatedArticles: ['/articles/snowflake-dbt-projects-airflow-orchestration', '/articles/automated-etl-with-airflow-and-python'],
  },

  // ════════════════════════════════════════════
  // EXPERT-LEVEL SNOWFLAKE INTERVIEW QUESTIONS
  // Feature-by-feature deep dives
  // ════════════════════════════════════════════

  // ────────────────────────────────────────────
  // 11. Snowflake Streams & Tasks Interview
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-streams-tasks-interview',
    title: 'Snowflake Streams & Tasks — Expert Interview Questions',
    shortDescription: 'Expert-level interview questions on Snowflake Streams (CDC), Tasks, task graphs, and change data capture patterns. Covers offset tracking, CHANGES clause, and production DAG alternatives.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Streams — Change Data Capture',
        type: 'qna',
        items: [
          { question: 'How does a Snowflake stream track changes internally, and what happens if you query a stream without consuming it?', answer: 'A stream stores a pair of offsets pointing to the transaction log (micro-partition change journal). It records the position at which it was last consumed (DML committed in the same transaction) and the current table version. Querying a stream (SELECT) is non-destructive — it shows pending changes but does NOT advance the offset. Only a DML statement (INSERT INTO … SELECT FROM stream) inside a committed transaction advances the offset. If no DML consumes the stream, changes accumulate until the retention period expires, at which point the stream becomes stale and must be recreated.', tip: 'A stale stream throws an error — monitor stream lag with SYSTEM$STREAM_GET_TABLE_TIMESTAMP and alert before retention expires.' },
          { question: 'Explain the difference between standard, append-only, and insert-only streams. When would you choose each?', answer: 'Standard streams capture INSERTs, UPDATEs, and DELETEs with METADATA$ACTION and METADATA$ISUPDATE columns — use for full CDC on mutable tables. Append-only streams capture only INSERT operations and ignore UPDATEs/DELETEs — ideal for immutable event/log tables where you only care about new rows (more efficient, smaller change set). Insert-only streams are specifically for external tables — they track new files added to the external stage. Choose standard for SCD-2 patterns, append-only for event sourcing, insert-only for external table ingestion pipelines.' },
          { question: 'A stream on a 500M-row table shows 200M changes after a weekend. The downstream MERGE takes 45 minutes. How do you optimize this?', answer: 'Several approaches: (1) Increase task frequency — run every 5 min instead of hourly to keep change sets small. (2) Use a dedicated warehouse for the MERGE — right-size it (MEDIUM or LARGE) to avoid spilling. (3) Partition the MERGE by adding a WHERE clause on a date/region column so each run processes a subset. (4) If most changes are inserts, switch to an append-only stream + INSERT (skip MERGE overhead). (5) Check if the 200M changes include cascading updates from a single bulk operation — if so, consider a full table rebuild (CTAS) instead of MERGE when changes exceed ~30% of table size. (6) For the MERGE itself, ensure the join key is well-clustered on the target table.' },
          { question: 'How do you handle streams on tables with schema evolution (ALTER TABLE ADD COLUMN)?', answer: 'Streams survive ALTER TABLE ADD COLUMN — the stream automatically includes the new column in its output. However, if the downstream consumer (INSERT INTO target SELECT FROM stream) has a fixed column list, it will break. Best practice: use INSERT INTO target SELECT * or dynamically generate the column list. For DROP COLUMN, the stream reflects the removal. Critical gotcha: RECREATING a table (CREATE OR REPLACE TABLE) invalidates all streams on that table — they become stale. Use ALTER TABLE for schema changes, never CREATE OR REPLACE on tables with active streams.' },
          { question: 'Can you create a stream on a view? What about a stream on a shared table?', answer: 'Yes, you can create a stream on a secure view or regular view (called a "stream on view"), which tracks changes to the underlying base tables. This is powerful for multi-table CDC — create a view joining multiple tables and stream on it. For shared tables (via Snowflake Data Sharing): you CANNOT create a stream directly on a shared table in the consumer account. Workaround: create a task that copies new data from the share into a local table, then stream on the local table. Alternatively, use the CHANGES clause on the shared table if change tracking is enabled by the provider.' },
          { question: 'Explain the CHANGES clause and how it differs from streams.', answer: 'The CHANGES clause (SELECT * FROM table CHANGES(INFORMATION => DEFAULT) AT(OFFSET => -3600)) provides ad-hoc CDC without creating a stream object. It uses the same internal change tracking but doesn\'t maintain persistent offsets. Key differences: (1) CHANGES is stateless — you must manage offsets yourself (e.g., store last-processed timestamp). (2) Streams are stateful — they auto-track consumption position. (3) CHANGES requires change tracking enabled (ALTER TABLE SET CHANGE_TRACKING = TRUE). (4) Streams implicitly enable change tracking. Use CHANGES for one-off auditing; use streams for production CDC pipelines.' },
        ],
      },
      {
        title: 'Tasks & Task Graphs',
        type: 'qna',
        items: [
          { question: 'Design a task graph that processes three streams into a single target table with exactly-once guarantees.', answer: 'Create a root task with WHEN SYSTEM$STREAM_HAS_DATA(\'stream_a\') OR SYSTEM$STREAM_HAS_DATA(\'stream_b\') OR SYSTEM$STREAM_HAS_DATA(\'stream_c\'). The root task MERGEs stream_a into the target. Create two child tasks: child_1 AFTER root merges stream_b, child_2 AFTER child_1 merges stream_c. All three MERGEs run in the same task graph execution, which is a single transaction scope. If any child fails, the entire graph retries (configurable). Exactly-once is guaranteed because stream offsets only advance on successful transaction commit — if the graph fails mid-way, streams still show the unconsumed changes on retry.' },
          { question: 'What is the difference between a serverless task and a user-managed warehouse task? When do you choose each?', answer: 'User-managed tasks run on a specified warehouse (WAREHOUSE = wh_name) — you control size and pay per-second of warehouse uptime. Serverless tasks (no WAREHOUSE clause) use Snowflake-managed compute — Snowflake auto-sizes the compute, you pay per-second of actual execution time. Choose serverless for: lightweight/short tasks (< 1 min), variable workloads, simplicity. Choose user-managed for: heavy transformations, consistent workloads where a dedicated warehouse is already running, cost predictability. Serverless tasks have a minimum 1-minute billing increment and can be more expensive for frequent tiny tasks.' },
          { question: 'A task graph has 5 tasks forming a diamond dependency (A → B, A → C, B → D, C → D, D → E). Task C fails. What happens to D and E?', answer: 'When C fails, task D will NOT execute because D depends on both B and C (AFTER B, C). Even though B succeeded, D requires ALL predecessors to succeed. Task E also won\'t run since it depends on D. The task graph execution is marked as failed. On the next scheduled run, the entire graph starts fresh from task A — there\'s no "resume from failure" capability. To handle partial failures: (1) add SUSPEND_TASK_AFTER_NUM_FAILURES to auto-pause after repeated failures, (2) set ERROR_INTEGRATION for SNS/email alerts, (3) make tasks idempotent so restarts are safe.' },
          { question: 'How do you monitor and debug task failures in production?', answer: 'Multiple approaches: (1) TASK_HISTORY() table function — shows execution status, error messages, duration, scheduled vs actual time. Query: SELECT * FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY()) WHERE STATE = \'FAILED\' ORDER BY SCHEDULED_TIME DESC. (2) TASK_DEPENDENTS() — shows the task graph structure. (3) ERROR_INTEGRATION — sends failure notifications to an SNS topic or email. (4) QUERY_HISTORY filtered by QUERY_TAG (tasks auto-tag their queries). (5) Set up a monitoring task that queries TASK_HISTORY every hour and alerts on failures via external function. For debugging, check the error_message column in TASK_HISTORY and correlate with QUERY_HISTORY for the actual SQL error.' },
          { question: 'Can tasks call stored procedures? How do you pass parameters between tasks in a graph?', answer: 'Yes, a task\'s SQL can be CALL my_procedure(args). For passing data between tasks: Snowflake tasks do NOT have a native parameter-passing mechanism like Airflow XComs. Workarounds: (1) Write output to a control/metadata table — downstream tasks read from it. (2) Use session variables (SET/UNSET) within a stored procedure that orchestrates multiple steps. (3) Use stream-based patterns where task A writes to a table, task B reads the stream on that table. (4) For simple status passing, use a RESULT_SCAN pattern within a stored procedure. The lack of native inter-task data passing is a key reason many teams use Airflow/dbt for complex orchestration and reserve tasks for simple CDC patterns.' },
        ],
      },
      {
        title: 'Expert Tips for Streams & Tasks',
        type: 'callout',
        items: [
          { variant: 'warning', title: 'Stream Staleness is Silent Until It\'s Too Late', body: 'A stream becomes stale when the underlying table\'s change tracking retention expires (default 14 days, max equals Time Travel retention). Once stale, the stream is useless — you must DROP and recreate it, losing any unconsumed changes. Set up proactive monitoring: compare SYSTEM$STREAM_GET_TABLE_TIMESTAMP with current time and alert when lag exceeds 50% of retention.' },
          { variant: 'tip', title: 'Use WHEN Clause for Cost Savings', body: 'Always add WHEN SYSTEM$STREAM_HAS_DATA(\'stream_name\') to tasks that consume streams. Without it, the task runs on schedule even when there are no changes — wasting credits. With it, the task only triggers when the stream has pending data. This alone can cut task compute costs by 60-80% for sparse change streams.' },
          { variant: 'info', title: 'Task Graphs vs Airflow/dbt', body: 'Task graphs are ideal for simple CDC pipelines (stream → MERGE → downstream stream → MERGE). For anything with branching logic, complex error handling, cross-system dependencies, or human-in-the-loop steps, use Airflow or dbt. Many production architectures use both: tasks for real-time CDC, Airflow for batch orchestration.' },
        ],
      },
    ],
    faqs: [
      { question: 'What is the maximum number of tasks in a task graph?', answer: 'A task graph (DAG) can have up to 1,000 tasks. However, practical graphs rarely exceed 10-20 tasks. Each task can have multiple predecessors (up to 100 AFTER dependencies). The graph must be a DAG — no cycles allowed. Tip: if your graph exceeds ~15 tasks, consider whether Airflow or dbt would be a better orchestration choice.' },
      { question: 'Can I use streams and tasks for real-time data processing?', answer: 'Near-real-time, not truly real-time. Tasks have a minimum schedule interval of 1 minute. Combined with stream consumption and MERGE execution time, end-to-end latency is typically 2-5 minutes. For sub-second latency, use Snowpipe Streaming or Kafka directly. Streams + tasks are best for "micro-batch" CDC patterns where 1-5 minute latency is acceptable.' },
    ],
    relatedSlugs: ['snowflake-interview-questions', 'snowflake-dynamic-tables-interview', 'snowflake-snowpipe-streaming-interview'],
    relatedArticles: ['/articles/snowflake-streams-tasks-pipeline-guide'],
  },

  // ────────────────────────────────────────────
  // 12. Snowflake Dynamic Tables Interview
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-dynamic-tables-interview',
    title: 'Snowflake Dynamic Tables — Expert Interview Questions',
    shortDescription: 'Expert-level interview questions on Snowflake Dynamic Tables, declarative pipelines, target lag, refresh modes, and how they compare to streams/tasks and dbt.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Core Concepts & Architecture',
        type: 'qna',
        items: [
          { question: 'What are Dynamic Tables and how do they fundamentally differ from materialized views and streams/tasks?', answer: 'Dynamic Tables are declaratively defined transformations: you write a SELECT query, set a TARGET_LAG (e.g., \'5 minutes\'), and Snowflake automatically manages refreshes to keep results within that lag. Unlike materialized views: DTs support complex queries (joins, aggregations, CTEs, multiple source tables), window functions, and chaining (DT reading from another DT). Unlike streams/tasks: you don\'t write imperative MERGE/INSERT logic — Snowflake figures out the incremental refresh strategy automatically. DTs use the same micro-partition-level change tracking as streams but abstract away the complexity. They\'re essentially "dbt models that auto-refresh themselves."' },
          { question: 'Explain TARGET_LAG semantics. What does "5 minutes" actually guarantee?', answer: 'TARGET_LAG = \'5 minutes\' means the data in the dynamic table will be at most 5 minutes behind the source tables. It\'s an upper bound, not a schedule. Snowflake\'s scheduler determines the optimal refresh frequency based on: (1) how fast source data changes, (2) the cost of refreshing, (3) the configured lag. If source data hasn\'t changed, no refresh runs. If source changes frequently, Snowflake may refresh more often than every 5 minutes. DOWNSTREAM means "inherit the lag from the farthest downstream consumer" — useful for chained DTs where only the final table has a business SLA. Important: TARGET_LAG is best-effort — under heavy system load, actual lag may temporarily exceed the target.' },
          { question: 'How does Snowflake determine whether to do a full refresh or incremental refresh on a Dynamic Table?', answer: 'Snowflake automatically analyzes the DT\'s query to determine if incremental refresh is possible. Incremental refresh works when: the query involves simple filters, joins, aggregations, UNION ALL, and projections that can be decomposed into delta operations. Full refresh is required when: the query uses non-deterministic functions (RANDOM(), CURRENT_TIMESTAMP), certain complex window functions, LIMIT/OFFSET, or recursive CTEs. You can check the refresh mode with: SELECT refresh_mode FROM INFORMATION_SCHEMA.DYNAMIC_TABLES. If a DT falls back to full refresh, it recomputes the entire result set — this is critical for cost planning on large tables.' },
          { question: 'You have a 3-layer DT pipeline: bronze_dt → silver_dt → gold_dt. How does lag propagate?', answer: 'If gold_dt has TARGET_LAG = \'10 minutes\', and silver_dt and bronze_dt both have TARGET_LAG = DOWNSTREAM, then Snowflake works backwards: gold needs data within 10 min, so silver must refresh often enough that gold can meet its SLA, and bronze must refresh often enough for silver. The system optimizes the entire chain holistically — it doesn\'t naively set each layer to 10/3 minutes. If you set explicit lags (bronze=2min, silver=5min, gold=10min), the actual end-to-end lag could be up to 17 minutes (sum of worst cases). For predictable end-to-end lag, use DOWNSTREAM on intermediate layers and set the target only on the final consumer-facing table.' },
          { question: 'What happens to a Dynamic Table when you ALTER TABLE ADD COLUMN on one of its source tables?', answer: 'If the DT query uses SELECT * from the source, the new column automatically appears after the next refresh. If the DT uses explicit column names, the new column is ignored (no impact). If you DROP a column that the DT references, the next refresh fails and the DT enters an error state. You can check DT health with SHOW DYNAMIC TABLES or DYNAMIC_TABLE_REFRESH_HISTORY(). To fix: ALTER the DT query to remove the dropped column reference. Critical: unlike regular tables, you cannot ALTER a DT\'s columns directly — you must change the underlying SELECT query using ALTER DYNAMIC TABLE ... SET QUERY = \'...\'.' },
        ],
      },
      {
        title: 'Production Patterns & Trade-offs',
        type: 'qna',
        items: [
          { question: 'When would you choose Dynamic Tables over dbt + Airflow? When would you NOT?', answer: 'Choose DTs when: (1) you need continuous/near-real-time refresh without managing orchestration, (2) the pipeline is a straightforward chain of SQL transformations, (3) your team doesn\'t have Airflow/dbt expertise. Choose dbt + Airflow when: (1) you need complex branching logic, conditional execution, or cross-system dependencies, (2) you need source freshness checks, test-after-build, and documentation, (3) you need precise control over execution order and retry logic, (4) transformations involve non-SQL logic (Python, APIs), (5) you want CI/CD with slim builds and manifest diffs. Many teams use both: DTs for simple real-time aggregations, dbt for complex analytical models.' },
          { question: 'How do you monitor and troubleshoot Dynamic Table refresh failures?', answer: 'Key tools: (1) DYNAMIC_TABLE_REFRESH_HISTORY() — shows each refresh attempt, status, duration, rows inserted/deleted, and error messages. (2) DYNAMIC_TABLE_GRAPH_HISTORY() — shows the entire DT pipeline execution. (3) SHOW DYNAMIC TABLES — shows current state, last refresh, scheduling status. (4) ALERT objects — create alerts on DT refresh failures. For troubleshooting: check if refresh_mode changed from INCREMENTAL to FULL (query complexity issue), check data_timestamp vs current time for lag violations, and correlate refresh failures with QUERY_HISTORY for the underlying SQL error. Common failure: source table recreation (CREATE OR REPLACE) breaks the DT — use ALTER TABLE instead.' },
          { question: 'A Dynamic Table gold_summary with 500M rows is refreshing every 2 minutes via full refresh, costing $X/hour. How do you optimize?', answer: '(1) Investigate why it\'s full refresh — check refresh_mode. Common causes: non-deterministic functions, complex window functions, LIMIT. Rewrite the query to be incremental-compatible. (2) Increase TARGET_LAG if the business allows — 10 minutes instead of 2 reduces refresh frequency by 5x. (3) If the DT aggregates a large table, consider a two-layer approach: a narrow DT that filters first (incremental-friendly), then the aggregation DT on top. (4) Check if a materialized view works for your use case (single-table, simpler query) — MVs are more cost-efficient for simple aggregations. (5) Add CLUSTER BY on the source table to improve pruning during refresh. (6) Use a dedicated warehouse (WAREHOUSE = wh) sized appropriately for the refresh workload.' },
        ],
      },
      {
        title: 'Expert Gotchas',
        type: 'callout',
        items: [
          { variant: 'warning', title: 'CREATE OR REPLACE Breaks Everything Downstream', body: 'If you CREATE OR REPLACE a source table, all Dynamic Tables reading from it will fail on next refresh. The DT loses its change tracking reference. Always use ALTER TABLE for schema changes on tables with downstream DTs. This is the #1 production incident with DT pipelines.' },
          { variant: 'tip', title: 'Cost Attribution for DT Refreshes', body: 'DT refreshes run on serverless compute by default (no warehouse specified) or a dedicated warehouse. Serverless DT costs appear in DYNAMIC_TABLE_REFRESH_HISTORY as credits_used. For cost visibility, assign DTs to a dedicated warehouse and monitor via WAREHOUSE_METERING_HISTORY. Always check: is full refresh silently costing 10x more than incremental?' },
          { variant: 'info', title: 'DTs are Not a Full dbt Replacement', body: 'Dynamic Tables don\'t have: tests, documentation, source freshness checks, CI/CD, dry-run compilation, or manifest-based impact analysis. They\'re a compute primitive, not an analytics engineering platform. Use them where continuous refresh is the primary requirement.' },
        ],
      },
    ],
    faqs: [
      { question: 'Can Dynamic Tables replace streams and tasks entirely?', answer: 'For SQL-only CDC pipelines (source → transform → target), yes — DTs are simpler and less error-prone. However, tasks can execute stored procedures (Python, JavaScript), call external functions, and have complex conditional logic (WHEN clauses). Streams + tasks remain necessary for: non-SQL logic, calling external APIs, complex branching, and pipelines requiring explicit transaction control.' },
      { question: 'What is the minimum TARGET_LAG for a Dynamic Table?', answer: 'The minimum TARGET_LAG is 1 minute (or DOWNSTREAM to inherit from consumers). There\'s no sub-minute option — for lower latency, use Snowpipe Streaming or Kafka. In practice, most production DTs use 5-15 minute lag as the sweet spot between freshness and cost.' },
    ],
    relatedSlugs: ['snowflake-streams-tasks-interview', 'snowflake-interview-questions', 'snowflake-performance-deep-dive-interview'],
    relatedArticles: ['/articles/snowflake-streams-tasks-pipeline-guide'],
  },

  // ────────────────────────────────────────────
  // 13. Snowflake Snowpark Interview
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-snowpark-interview',
    title: 'Snowflake Snowpark — Expert Interview Questions',
    shortDescription: 'Expert interview questions on Snowpark DataFrame API, Python/Java/Scala UDFs, UDTFs, stored procedures, and when to use Snowpark vs pure SQL.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'DataFrame API & Execution Model',
        type: 'qna',
        items: [
          { question: 'How does Snowpark\'s DataFrame API differ from PySpark\'s, and where does code actually execute?', answer: 'Snowpark DataFrames are lazily evaluated, similar to PySpark, but with a critical difference: Snowpark translates DataFrame operations into SQL that executes on Snowflake\'s compute engine — not on a Spark cluster. Your Python code runs client-side (or in a stored procedure\'s sandbox), but the heavy computation happens on the warehouse. PySpark runs on a separate Spark cluster with its own executors. Implications: (1) Snowpark leverages Snowflake\'s optimizer, caching, and pruning. (2) You can\'t use arbitrary Python libraries in DataFrame transformations — only in UDFs/UDTFs. (3) DataFrame operations map to SQL (filter → WHERE, group_by → GROUP BY), so anything SQL can\'t express requires a UDF escape hatch.' },
          { question: 'Explain lazy evaluation in Snowpark. What triggers execution, and how does this affect debugging?', answer: 'Snowpark DataFrames build a logical plan (DAG of operations) without executing anything until an "action" method is called. Actions include: .collect(), .show(), .count(), .to_pandas(), .write.save_as_table(), .create_or_replace_view(). Transform methods (.filter(), .select(), .join(), .group_by()) are lazy. This means chaining 20 transformations is free until you trigger execution. Debugging implication: you can call df.explain() to see the generated SQL plan without executing it. Common mistake: calling .collect() in a loop (triggers N separate queries instead of one). For debugging, use df.queries to inspect the SQL Snowpark will generate.' },
          { question: 'You need to apply a complex Python function (using pandas, scikit-learn) to each group of rows in a Snowflake table. How do you architect this in Snowpark?', answer: 'Use a vectorized UDTF (User-Defined Table Function) with partitioning. Steps: (1) Define a UDTF class with process() and end_partition() methods. (2) Register it with session.udtf.register(). (3) Call it with: df.join_table_function(my_udtf(col(\'feature\')).over(partition_by=col(\'group_key\'))). The OVER(PARTITION BY) clause sends each group to a separate Python sandbox where scikit-learn/pandas run locally on that partition\'s data. Alternative: for simpler transformations, use a vectorized UDF (@udf with max_batch_size) that receives pandas Series and returns pandas Series. Key consideration: the Python sandbox has memory limits (~4-8GB depending on warehouse size) — partition your data small enough to fit in memory.' },
          { question: 'What is the difference between a scalar UDF, a vectorized UDF, a UDTF, and a stored procedure in Snowpark?', answer: 'Scalar UDF: takes single row input, returns single value. Called per-row in SQL (SELECT my_udf(col) FROM table). Vectorized UDF: same interface but receives/returns pandas Series in batches — 10-100x faster than scalar for Python UDFs due to reduced serialization overhead. Always prefer vectorized. UDTF: takes rows in, returns zero or more rows out (table function). Has process() per-row and end_partition() per-partition methods. Used for: exploding data, aggregations returning multiple rows, ML inference per group. Stored Procedure: runs a full program (Python/SQL/JavaScript) that can execute multiple SQL statements, manage transactions, and perform DDL. Called with CALL. Use for: ETL orchestration, admin tasks, multi-step workflows.' },
          { question: 'How do you handle third-party Python packages (e.g., xgboost, requests) in Snowpark UDFs?', answer: 'Three methods: (1) Anaconda channel — Snowflake includes popular packages (numpy, pandas, scikit-learn, xgboost) via the Anaconda partnership. Specify with @udf(packages=[\'xgboost==1.7.6\']). Check availability in INFORMATION_SCHEMA.PACKAGES. (2) Stage upload — for packages not in Anaconda, upload wheel files to a stage and add with imports=[\'@stage/mypackage.zip\']. (3) Conda environment — specify a full conda environment in the UDF definition. Gotchas: (1) packages must be pure Python or have pre-compiled binaries for Linux x86_64 (Snowflake\'s sandbox OS). (2) No network access from UDFs — you can\'t call external APIs (use external functions instead). (3) Package installation happens at UDF creation, not execution — first call is fast.' },
        ],
      },
      {
        title: 'Production Patterns & Performance',
        type: 'qna',
        items: [
          { question: 'When should you use Snowpark Python vs pure SQL? Give specific criteria.', answer: 'Use pure SQL when: (1) the transformation is expressible in SQL (joins, aggregations, window functions — covers 80%+ of data engineering work). (2) Performance is critical — SQL is always faster than Python UDFs due to zero serialization overhead. (3) The logic is simple enough that SQL is readable. Use Snowpark Python when: (1) ML inference/training (scikit-learn, xgboost models). (2) Complex string/regex processing that\'s awkward in SQL. (3) Calling Python libraries with no SQL equivalent (e.g., IP geolocation, custom parsers). (4) Building reusable pipeline frameworks where Python\'s abstraction capabilities are valuable. Anti-pattern: don\'t rewrite simple SQL as Snowpark DataFrames for "modernity" — it adds complexity without benefit.' },
          { question: 'A vectorized UDF processing 100M rows is slow. How do you diagnose and optimize?', answer: '(1) Check warehouse size — Python UDFs run in sandboxes constrained by warehouse resources. Scale up to LARGE or XLARGE for more parallelism and memory. (2) Check batch size — use max_batch_size parameter to control how many rows per pandas batch. Too small = serialization overhead; too large = memory pressure. Start with 10,000 and tune. (3) Profile the Python code — is it CPU-bound (computation) or memory-bound (large objects per row)? (4) Check if the UDF can be replaced with SQL — even complex regex can sometimes be done with REGEXP_REPLACE. (5) Consider a UDTF with partitioning to parallelize across groups. (6) For ML models: serialize the model to a stage and load once in __init__, not in process(). (7) Avoid .collect() or .to_pandas() inside UDFs — everything should stay in Snowflake\'s engine.' },
        ],
      },
      {
        title: 'Expert Snowpark Tips',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Always Use Vectorized UDFs Over Scalar', body: 'Vectorized UDFs (pandas Series in/out) are 10-100x faster than scalar UDFs because they batch rows into columnar format, reducing Python↔Snowflake serialization overhead. The API is almost identical — just change the type hints to PandasSeries and add max_batch_size.' },
          { variant: 'warning', title: 'No Network Access in UDFs', body: 'Snowpark UDFs run in a sandboxed environment with NO network access. You cannot call APIs, query databases, or download files from within a UDF. Use external functions (via API Gateway) for external service calls, or pre-fetch data into a Snowflake table before UDF processing.' },
          { variant: 'info', title: 'Snowpark Container Services for Heavy ML', body: 'For GPU-accelerated ML workloads (LLM fine-tuning, deep learning), Snowpark Container Services lets you run Docker containers with GPU access directly in Snowflake. This is the path for heavy ML that doesn\'t fit in UDF sandboxes.' },
        ],
      },
    ],
    faqs: [
      { question: 'Can Snowpark replace PySpark for data engineering?', answer: 'For Snowflake-centric workloads, largely yes. Snowpark handles 90%+ of what PySpark does for ETL: DataFrames, UDFs, window functions, joins. Advantages over PySpark: no Spark cluster to manage, automatic optimization by Snowflake, direct access to Snowflake data. Limitations: no RDD-level control, no custom partitioners, limited to Snowflake\'s execution engine. If your data lives in Snowflake, Snowpark eliminates the need for a separate Spark cluster.' },
      { question: 'Is Snowpark available in dbt?', answer: 'Yes. dbt-snowflake supports Snowpark Python models (dbt v1.3+). You define a model as a Python file instead of SQL, and dbt executes it as a Snowpark stored procedure. Use for: ML feature engineering, complex transformations requiring Python. Keep in mind: Python models are slower than SQL models and don\'t support incremental materialization as cleanly.' },
    ],
    relatedSlugs: ['snowflake-interview-questions', 'snowflake-cortex-ai-interview', 'snowflake-stored-procedures-interview', 'snowflake-external-integrations-interview'],
    relatedArticles: ['/articles/snowflake-query-optimization-guide-2026'],
  },

  // ────────────────────────────────────────────
  // 14. Snowflake Data Sharing Interview
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-data-sharing-interview',
    title: 'Snowflake Data Sharing & Marketplace — Expert Interview Questions',
    shortDescription: 'Expert interview questions on Snowflake Secure Data Sharing, reader accounts, Marketplace listings, cross-cloud sharing, and data clean rooms.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Secure Data Sharing Architecture',
        type: 'qna',
        items: [
          { question: 'How does Snowflake\'s Secure Data Sharing work without copying data? Walk through the architecture.', answer: 'Snowflake sharing works at the metadata layer. The provider creates a SHARE object, grants access to specific databases/schemas/tables/views, and adds consumer accounts. The consumer creates a database FROM SHARE. Under the hood: consumers read the provider\'s micro-partitions directly from cloud storage — no data is copied, moved, or duplicated. The cloud services layer manages access control, ensuring consumers can only read granted objects. Storage costs remain with the provider. Compute costs are on the consumer (they use their own warehouses to query shared data). This is possible because of Snowflake\'s architecture: storage is decoupled from compute, and micro-partitions are immutable and self-describing.' },
          { question: 'What are the differences between direct sharing, listings, and data exchange?', answer: 'Direct sharing (CREATE SHARE): point-to-point between specific Snowflake accounts. You manage consumer accounts manually. Free, no marketplace involvement. Listings (Snowflake Marketplace): your data appears in the public marketplace for any Snowflake customer to discover and request. Can be free or paid. Includes description, sample queries, and usage documentation. Data Exchange: a private marketplace for a curated group of accounts (e.g., within your enterprise or with select partners). Combines marketplace discoverability with controlled access. Choose direct sharing for known B2B partners, marketplace for public monetization, exchange for enterprise-internal or consortium data sharing.' },
          { question: 'A consumer needs to share data with you, but they\'re on a different cloud provider (your org is AWS, they\'re Azure). How does cross-cloud sharing work?', answer: 'Cross-cloud/cross-region sharing uses Snowflake\'s Global Data Sharing infrastructure (also called Auto-Fulfillment or Listings). For direct shares, both accounts must be in the same region on the same cloud — you cannot directly share AWS us-east-1 → Azure West Europe. For listings (Marketplace/Exchange), Snowflake handles replication automatically: the provider publishes a listing, and Snowflake replicates the data to the consumer\'s region/cloud. The provider pays replication storage and transfer costs. Alternative: use database replication (CREATE REPLICATION GROUP) to replicate to a secondary account in the consumer\'s region, then share from there. This gives more control over replication frequency and costs.' },
          { question: 'How do you implement row-level security on shared data so different consumers see different rows?', answer: 'Use secure views with CURRENT_ACCOUNT() or a mapping table. Pattern: (1) Create a mapping table: CREATE TABLE share_access_control (account_locator VARCHAR, allowed_region VARCHAR). (2) Create a secure view: CREATE SECURE VIEW shared_sales AS SELECT * FROM sales WHERE region IN (SELECT allowed_region FROM share_access_control WHERE account_locator = CURRENT_ACCOUNT()). (3) Share the secure view (not the base table). Each consumer\'s queries automatically filter to their allowed rows based on their account locator. Important: the view MUST be SECURE — regular views expose their definition in GET_DDL(), which would reveal the base table and filtering logic to consumers.' },
          { question: 'What is a reader account and when would you create one?', answer: 'A reader account is a Snowflake account created and managed by the provider, intended for consumers who don\'t have their own Snowflake account. The provider pays for the reader account\'s compute (warehouses), storage (minimal — only metadata), and credits. Use cases: (1) sharing data with non-Snowflake customers (they get a limited Snowflake UI). (2) Providing read-only data access to external analysts or regulators. (3) Paid data products where you want to control the compute environment. Limitations: reader accounts cannot create their own databases, shares, or load data — they\'re strictly read-only consumers of your shared data. For cost control, set resource monitors on reader account warehouses.' },
        ],
      },
      {
        title: 'Data Clean Rooms & Advanced Patterns',
        type: 'qna',
        items: [
          { question: 'What is a Snowflake Data Clean Room and how does it differ from regular data sharing?', answer: 'A Data Clean Room enables two or more parties to run joint analyses on combined data without either party seeing the other\'s raw records. Built on top of secure data sharing + secure UDFs + row access policies. The flow: Party A shares a secure view with aggregation-only policies. Party B runs approved queries (via stored procedures) that join both datasets and return only aggregate results (e.g., "overlap of your customers with mine is 15%"). Neither party can run SELECT * on the other\'s data — the secure UDFs enforce that only approved computations return results. Use cases: advertising measurement (match ad impressions with conversions), healthcare research (combine patient cohorts without sharing PII), financial risk assessment across institutions.' },
          { question: 'How do you monetize data through Snowflake Marketplace? Walk through the process.', answer: 'Steps: (1) Prepare data: create tables/views with clean schemas and documentation. (2) Create a listing: in the Marketplace provider UI, define listing title, description, sample queries, and pricing (free, paid per-query, or paid subscription). (3) Set access: choose public (anyone) or request-based (you approve each consumer). (4) For paid listings: set up a Stripe account for payment processing, define pricing tiers, and configure usage tracking. (5) Auto-fulfillment: enable replication to multiple regions/clouds for global availability. Snowflake handles cross-region data movement. (6) Monitor usage via LISTING_ACCESS_HISTORY and LISTING_TELEMETRY. Revenue split: Snowflake takes a percentage of paid listing revenue. Most providers start with free listings for market visibility, then add paid premium tiers.' },
        ],
      },
      {
        title: 'Expert Sharing Tips',
        type: 'callout',
        items: [
          { variant: 'warning', title: 'Never Share Base Tables Directly', body: 'Always share secure views, never raw tables. Secure views let you: (1) filter rows per consumer (row-level security), (2) mask sensitive columns, (3) limit which columns are visible, (4) change underlying table structure without breaking consumers. If you share a raw table, you lose all control over what consumers see.' },
          { variant: 'tip', title: 'Use CURRENT_ACCOUNT() for Multi-Tenant Shares', body: 'Build one share with a secure view that uses CURRENT_ACCOUNT() to filter data per consumer. This scales to hundreds of consumers without creating separate shares for each. Store the account→data mapping in a control table you manage.' },
          { variant: 'info', title: 'Share Costs Are Asymmetric', body: 'The provider pays for storage and replication. The consumer pays for compute (queries). For cross-region listings, the provider also pays data transfer costs. Factor this into pricing for paid listings — cross-region consumers cost you more to serve.' },
        ],
      },
    ],
    faqs: [
      { question: 'Can I share data between Snowflake and non-Snowflake systems?', answer: 'Not directly via Secure Data Sharing — that\'s Snowflake-to-Snowflake only. For non-Snowflake consumers: (1) Create a reader account (gives them Snowflake access). (2) Use Snowflake\'s external functions to push data to external APIs. (3) Use COPY INTO to export data to a stage (S3/GCS/Azure) that the consumer can access. (4) Use Iceberg tables for open format sharing readable by Spark, Trino, etc.' },
      { question: 'Is shared data visible in the consumer\'s query history?', answer: 'Yes — the consumer sees queries on shared objects in their QUERY_HISTORY. The provider can see that data was accessed via LISTING_TELEMETRY (for marketplace) or ACCESS_HISTORY (for direct shares, Enterprise edition). The provider cannot see the consumer\'s full query text — only that their shared objects were accessed, with row counts and timestamps.' },
    ],
    relatedSlugs: ['snowflake-interview-questions', 'snowflake-governance-interview', 'snowflake-iceberg-tables-interview'],
    relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'],
  },

  // ────────────────────────────────────────────
  // 15. Snowflake Iceberg Tables Interview
  // ────────────────────────────────────────────
  {
    slug: 'snowflake-iceberg-tables-interview',
    title: 'Snowflake Iceberg Tables — Expert Interview Questions',
    shortDescription: 'Expert interview questions on Apache Iceberg tables in Snowflake, external volumes, catalog integration, open table formats, and interoperability with Spark/Trino.',
    category: 'interview',
    difficulty: 'Advanced',
    lastUpdated: '2026-04-09',
    sections: [
      {
        title: 'Iceberg Fundamentals in Snowflake',
        type: 'qna',
        items: [
          { question: 'What are Snowflake-managed Iceberg tables and how do they differ from externally managed Iceberg tables?', answer: 'Snowflake-managed Iceberg tables: Snowflake controls the Iceberg catalog, writes Parquet data files and Iceberg metadata to your external volume (S3/GCS/Azure). You get full DML (INSERT, UPDATE, DELETE, MERGE) and Snowflake-native features (Time Travel, cloning, streams). External engines (Spark, Trino) can read the data via the Iceberg REST catalog. Externally managed Iceberg tables: an external engine (Spark, AWS Glue) manages the catalog and data. Snowflake registers the table as read-only and queries it via the external catalog. You get read access but no DML, no Time Travel, no clustering. Choose Snowflake-managed when Snowflake is the primary compute; externally managed when Spark/Glue owns the pipeline.' },
          { question: 'Explain the external volume concept. Why is it required for Iceberg tables?', answer: 'An external volume is a Snowflake object that references a cloud storage location (S3 bucket, GCS bucket, ADLS container) with appropriate IAM trust relationships. Iceberg tables store data as open-format Parquet files + Iceberg metadata JSON on this external storage — unlike native Snowflake tables which store data in Snowflake\'s managed internal storage. The external volume is required because the entire point of Iceberg is open format interoperability: the data files must be accessible to non-Snowflake engines. Setup: CREATE EXTERNAL VOLUME my_vol STORAGE_LOCATIONS = (STORAGE_BASE_URL = \'s3://my-bucket/iceberg/\', STORAGE_PROVIDER = \'S3\', STORAGE_AWS_ROLE_ARN = \'arn:aws:iam::...:role/...\').' },
          { question: 'What Snowflake features work with Iceberg tables and which don\'t?', answer: 'Works: INSERT/UPDATE/DELETE/MERGE, COPY INTO, Snowpipe, Time Travel (Snowflake-managed only), cloning, streams, tasks, Dynamic Tables reading from Iceberg, RBAC, masking policies, row access policies. Does NOT work: clustering (CLUSTER BY — Iceberg uses its own sort order), Search Optimization, materialized views on Iceberg, Snowflake-to-Snowflake sharing of Iceberg tables (must share via external catalog). Performance note: Iceberg tables are typically 10-20% slower than native Snowflake tables for queries due to Parquet scan overhead vs Snowflake\'s proprietary format. The tradeoff is interoperability.' },
          { question: 'How does schema evolution work with Iceberg tables in Snowflake?', answer: 'Iceberg supports rich schema evolution: ADD COLUMN, DROP COLUMN, RENAME COLUMN, and type widening (int → long, float → double) without rewriting data files. In Snowflake: ALTER ICEBERG TABLE ADD COLUMN works and is metadata-only (instant). For externally managed tables, schema changes made by Spark/Glue are automatically detected on the next catalog refresh in Snowflake. Critical: Iceberg handles schema evolution at the metadata level — old data files retain their original schema, and the engine maps columns by field IDs (not names). This means RENAME COLUMN is safe (unlike Parquet without Iceberg, where renames break column mapping).' },
          { question: 'You\'re migrating a 10TB native Snowflake table to Iceberg format. Walk through the process and considerations.', answer: 'Process: (1) Create external volume pointing to S3/GCS. (2) CREATE ICEBERG TABLE new_table ... CATALOG = \'SNOWFLAKE\' EXTERNAL_VOLUME = \'my_vol\' BASE_LOCATION = \'db/table/\' AS SELECT * FROM native_table. (3) Validate row counts and checksums. (4) Update downstream consumers to reference the new table. (5) Set up streams/tasks or Dynamic Tables on the Iceberg table. Considerations: (1) 10TB CTAS will consume significant warehouse credits — use a LARGE+ warehouse. (2) Iceberg tables use more storage than native tables (Parquet is less compressed than Snowflake\'s format — expect ~30-50% more). (3) Time Travel retention starts fresh on the Iceberg table. (4) Test query performance — expect 10-20% slower queries. (5) If the table has CLUSTER BY, plan an Iceberg sort order to replace it. (6) If other engines need to read it, set up the Iceberg REST catalog endpoint.' },
        ],
      },
      {
        title: 'Interoperability & Catalog Integration',
        type: 'qna',
        items: [
          { question: 'How does the Snowflake Open Catalog (Polaris) fit into the Iceberg ecosystem?', answer: 'Polaris (now Apache project — previously Snowflake Open Catalog) is an open-source REST catalog implementation for Apache Iceberg. It provides a centralized catalog that multiple engines (Snowflake, Spark, Trino, Flink) can use to discover and manage Iceberg tables. With Polaris: (1) Snowflake registers as a catalog consumer/manager. (2) Spark jobs can read/write Iceberg tables that Snowflake also accesses. (3) Schema, partitioning, and snapshot metadata are shared across engines. Without Polaris: you need a Glue catalog, Hive Metastore, or Nessie catalog — each with different levels of Snowflake integration. Polaris simplifies multi-engine architectures by providing a single source of truth for table metadata.' },
          { question: 'Can you use Iceberg tables with Snowflake streams and Dynamic Tables?', answer: 'Streams: Yes, you can create streams on Snowflake-managed Iceberg tables. They work identically to streams on native tables — tracking changes via Snowflake\'s internal change tracking, not Iceberg\'s snapshot log. For externally managed Iceberg tables: streams are NOT supported (Snowflake can\'t track external changes). Dynamic Tables: Yes, a Dynamic Table can read FROM an Iceberg table as a source. The DT itself is a native Snowflake object (not Iceberg). You can also create a Dynamic Table AS an Iceberg table by specifying ICEBERG in the DDL — giving you both automatic refresh and open format output.' },
        ],
      },
      {
        title: 'Expert Iceberg Tips',
        type: 'callout',
        items: [
          { variant: 'tip', title: 'Use Iceberg Only When You Need Interoperability', body: 'If all your compute is on Snowflake, native tables are faster, cheaper, and have more features. Use Iceberg when: (1) Spark/Trino/Flink also reads the data, (2) you need to avoid vendor lock-in, (3) data governance requires open-format storage. Don\'t migrate to Iceberg "just because" — the 10-20% performance hit is real.' },
          { variant: 'warning', title: 'Storage Costs Are Higher', body: 'Iceberg tables store data as Parquet files on your cloud storage (you pay directly) plus Iceberg metadata files. This is typically 30-50% more storage than native Snowflake tables (Snowflake\'s proprietary format is more compressed). Factor this into cost comparisons.' },
          { variant: 'info', title: 'Iceberg + Data Sharing', body: 'You cannot share Iceberg tables via Snowflake Secure Data Sharing. For cross-organization sharing of Iceberg tables, share the external volume (S3 bucket) and catalog access directly. Or: materialize a native Snowflake view of the Iceberg table and share that.' },
        ],
      },
    ],
    faqs: [
      { question: 'Should I use Iceberg tables or native Snowflake tables for a new project?', answer: 'Default to native Snowflake tables unless you have a specific interoperability requirement. Native tables are faster, cheaper, and have full feature support. Use Iceberg if: multiple engines (Spark, Trino) need to access the same data, you\'re building a lakehouse architecture, or organizational policy requires open formats.' },
      { question: 'What is the Iceberg REST catalog and do I need it?', answer: 'The Iceberg REST catalog is an API specification for discovering and managing Iceberg tables across engines. Snowflake can serve as a REST catalog endpoint, allowing Spark to discover tables that Snowflake manages. You need it when: non-Snowflake engines need to read your Snowflake-managed Iceberg tables. If only Snowflake accesses the data, you don\'t need it.' },
    ],
    relatedSlugs: ['snowflake-interview-questions', 'snowflake-data-sharing-interview', 'snowflake-performance-deep-dive-interview'],
    relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'],
  },
  { slug: 'snowflake-cortex-ai-interview', title: 'Snowflake Cortex AI & ML — Expert Interview Questions', shortDescription: 'Expert questions on Cortex LLM functions, ML functions, embeddings, fine-tuning, and AI apps in Snowflake.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Cortex LLM Functions', type: 'qna', items: [ { question: 'What are Cortex LLM functions and how do they differ from external APIs?', answer: 'Cortex functions (COMPLETE, SUMMARIZE, TRANSLATE, SENTIMENT) run Llama/Mistral inside Snowflake. Data never leaves, called via SQL, billed per-token as credits, governed by RBAC, GPU scaling managed by Snowflake. Trade-off: no GPT-4. Governance outweighs model variety for enterprises.' }, { question: 'How do you control temperature, tokens, system prompts?', answer: 'Simple: COMPLETE(model, prompt). Advanced: pass options with messages array, temperature (0=deterministic), max_tokens, top_p. Batch: SELECT COMPLETE(model, text_col) FROM table processes every row. Caution with large tables.' }, { question: 'How to build RAG entirely in Snowflake?', answer: 'Embed docs with EMBED_TEXT_768, store in VECTOR column, retrieve top-K via VECTOR_COSINE_SIMILARITY, generate with COMPLETE. No external vector DB. For production, use Cortex Search Service which handles chunking, embedding, indexing automatically.' }, { question: 'What embedding models are available?', answer: 'e5-base-v2 (general), multilingual-e5-large (100+ languages), snowflake-arctic-embed (best retrieval). Choose by language, quality/cost, storage. Store in VECTOR(FLOAT, 768).' }, { question: 'How is Cortex AI billed?', answer: 'Per-token, varies by model. Controls: smallest model, limit max_tokens, pre-filter data, cache results, resource monitors, test on LIMIT 100 first. Monitor via METERING_DAILY_HISTORY.' } ] }, { title: 'ML and Fine-Tuning', type: 'qna', items: [ { question: 'ML-powered functions vs LLMs?', answer: 'FORECAST, ANOMALY_DETECTION, CLASSIFICATION, TOP_INSIGHTS trained on your data. Structured prediction, much cheaper (classical ML), auto feature engineering. Use ML for forecasting/fraud; LLMs for text.' }, { question: 'When fine-tune vs prompt engineer?', answer: 'Fine-tune: consistent format (JSON schema), domain terms, inconsistent prompts. Need 100+ examples. Skip for general QA (use RAG instead) or simple classification.' } ] }, { title: 'AI Tips', type: 'callout', items: [ { variant: 'tip', title: 'Start Small', body: 'Prototype on LIMIT 100-1000. A COMPLETE call on 10M rows with a large model costs thousands in credits.' }, { variant: 'warning', title: 'Non-Deterministic Output', body: 'Even temperature=0 can vary slightly. Never use COMPLETE output as a join key. Always post-process and validate.' }, { variant: 'info', title: 'Cortex Search', body: 'For production RAG, use Cortex Search Service instead of manual embed-search-generate pipelines.' } ] } ], faqs: [ { question: 'GPT-4 or Claude via Cortex?', answer: 'Not available. Cortex hosts Llama, Mistral, Arctic. For GPT-4/Claude, use external functions but data leaves Snowflake.' }, { question: 'Edition requirements?', answer: 'Enterprise+ required. Availability varies by region. Check SHOW CORTEX MODELS in your account.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-snowpark-interview', 'snowflake-governance-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-snowpipe-streaming-interview', title: 'Snowpipe Streaming & Kafka — Expert Interview Questions', shortDescription: 'Expert questions on Snowpipe Streaming, Kafka connector, classic Snowpipe, and real-time ingestion patterns.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Streaming Architecture', type: 'qna', items: [ { question: 'Streaming vs classic Snowpipe?', answer: 'Classic: file-based, SQS notification, COPY INTO, 30-120s latency. Streaming: row-based Ingest SDK (Java), insertRows(), 1-10s latency, no files or stages. Cheaper for high-volume small payloads due to no per-file overhead.' }, { question: 'Kafka connector and Streaming mode?', answer: 'snowflake-kafka-connector has two modes: Snowpipe (buffers to files, 1-3 min) or Streaming (set ingestion.method=SNOWPIPE_STREAMING, sub-10s). Each Kafka partition maps to one channel for ordered exactly-once ingestion.' }, { question: 'How does exactly-once delivery work?', answer: 'Channel-based offset tracking: insertRows(batch, offsetToken) stores rows and offset atomically. On recovery: getLatestCommittedOffsetToken() returns last committed. Resume from offset+1. Crash before recording = at-least-once (handle with idempotent processing).' }, { question: 'Design ingestion for 50K events/sec from Kafka?', answer: '50K eps at 1KB = 50MB/s. Kafka Connect Streaming mode, tasks.max=6 (about 10K eps/task). CLUSTER BY ingestion timestamp. Buffer: flush.time=10s, count.records=10000. Monitor CLIENT_HISTORY. Downstream: Dynamic Tables or streams+tasks.' }, { question: 'When choose Streaming vs Snowpipe vs COPY INTO?', answer: 'Streaming: sub-30s latency, continuous rows, small payloads. Snowpipe: file-based arrival, large batches, 1-3 min acceptable. COPY INTO: one-time bulk loads and backfills. Streaming avoids small-file performance penalty.' } ] }, { title: 'Advanced Patterns', type: 'qna', items: [ { question: 'Schema evolution with Kafka?', answer: 'Schemaless (JsonConverter): land in VARIANT column, parse downstream with Dynamic Tables. Schema-aware (Avro+Registry): schema.evolution=TRUE auto-adds columns. Incompatible type changes fail. Best: VARIANT for maximum flexibility, schema-on-read.' }, { question: 'Production monitoring?', answer: 'Snowpipe: PIPE_USAGE_HISTORY, COPY_HISTORY, SYSTEM$PIPE_STATUS. Streaming: CLIENT_HISTORY, FILE_MIGRATION_HISTORY. Both: alert on failures, monitor MAX(ingestion_timestamp) freshness with scheduled task.' } ] }, { title: 'Ingestion Tips', type: 'callout', items: [ { variant: 'tip', title: 'VARIANT for Flexibility', body: 'Land Kafka data in VARIANT column. Parse downstream. Ingestion never breaks on schema changes.' }, { variant: 'warning', title: 'Small Files Kill Snowpipe', body: '100K tiny files under 100KB is much slower and costlier than 100 files at 100MB. Aggregate upstream or switch to Streaming.' }, { variant: 'info', title: 'Migration Costs', body: 'Streaming writes non-optimized data initially. Background file migration to micro-partitions consumes serverless credits.' } ] } ], faqs: [ { question: 'Streaming without Kafka?', answer: 'Yes. Ingest SDK (Java) lets any app call insertRows() directly. IoT gateways, Debezium CDC. Java-only; Python uses PUT+COPY INTO.' }, { question: 'Cost model?', answer: 'Per-second client compute (small) + file migration serverless compute. No per-row charges. Cheaper than Snowpipe for high-frequency small records.' } ], relatedSlugs: ['snowflake-streams-tasks-interview', 'snowflake-interview-questions', 'snowflake-cost-optimization-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-governance-interview', title: 'Snowflake Governance & Masking — Expert Interview Questions', shortDescription: 'Expert questions on dynamic data masking, row access policies, tag-based governance, ACCESS_HISTORY, and data protection at scale.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Masking Policies', type: 'qna', items: [ { question: 'How do masking policies work vs encryption?', answer: 'Masking: per-query role-based SQL transform on columns. CASE WHEN CURRENT_ROLE() IN (PII_ADMIN) THEN val ELSE masked END. Encryption: at-rest, same encrypted value for all users. Masking supports partial masking, hashing, tokenization. Snowflake encrypts all data by default anyway.' }, { question: 'Tag-based masking and scaling?', answer: 'Assign masking policy to a TAG instead of individual columns. 500 tables, 2000 PII columns = 3-4 tag-level policies vs 2000 column-level assignments. New PII column? Just tag it. Query TAG_REFERENCES for full PII inventory across account.' }, { question: 'Engineer needs unmasked for ETL, masked for ad-hoc?', answer: 'Options: (1) Role-based: ETL_ROLE unmasked, AD_HOC_ROLE masked via CURRENT_ROLE(). (2) Warehouse-based: ETL_WH unmasked, ADHOC_WH masked. (3) IS_ROLE_IN_SESSION() for full hierarchy check. Never use CURRENT_USER() for access control.' }, { question: 'Masking limitations and bypass risks?', answer: 'One policy per column, no joins in policy body, 10-20% query overhead, no external tables. ACCOUNTADMIN sees unmasked by design. Cannot bypass via EXPLAIN, CTAS, or views. Risk: GROUP BY on masked column reveals uniqueness. Combine masking with row access policies.' } ] }, { title: 'Row Access and Tagging', type: 'qna', items: [ { question: 'How do row access policies compose with masking?', answer: 'Row access filters ROWS, masking transforms COLUMNS. Independent composition: filter first, then mask. Both can coexist on same table. Row access policies CAN reference other tables (mapping tables) for data-driven access control.' }, { question: 'Design multi-tenant access for 50 business units?', answer: 'Mapping table: bu_access(role_name, business_unit_id). Policy: EXISTS(SELECT 1 FROM bu_access WHERE role_name=CURRENT_ROLE() AND bu_id=val) OR IS_ROLE_IN_SESSION(GLOBAL_ADMIN). Apply to all tables. Adding new BU = insert rows in mapping table, no DDL changes needed.' }, { question: 'What is ACCESS_HISTORY and why does it matter?', answer: 'Records every read/write: user, role, query, columns accessed, objects modified (including base objects through views). Critical for GDPR right-to-access, SOX compliance, security investigations. 2-3 hour latency. Enterprise edition required.' }, { question: 'Object tagging for governance at scale?', answer: 'Key-value metadata on any Snowflake object. Use cases: data classification (PII/PHI/PUBLIC), cost attribution (department on warehouses), compliance (retention/regulation). Tags propagate to views. Tag-based policies bind masking and row access to tags.' } ] }, { title: 'Governance Tips', type: 'callout', items: [ { variant: 'tip', title: 'IS_ROLE_IN_SESSION over CURRENT_ROLE', body: 'Checks full role hierarchy including inherited roles. CURRENT_ROLE only returns the active role, missing inherited access.' }, { variant: 'warning', title: 'Row Access Policy Joins', body: 'Mapping table joins execute on every query against protected table. Keep mapping tables small, add SEARCH OPTIMIZATION on join keys.' }, { variant: 'info', title: 'Enterprise Edition Required', body: 'Masking policies, row access policies, tag-based governance, and ACCESS_HISTORY all require Enterprise edition or higher.' } ] } ], faqs: [ { question: 'Can masking policies restrict ACCOUNTADMIN?', answer: 'ACCOUNTADMIN sees unmasked data by default (admin override by design). Can add explicit CURRENT_ROLE() checks but risks locking out last-resort admin. Best practice: dedicated security admin role.' }, { question: 'RBAC vs DAC in Snowflake?', answer: 'RBAC (Role-Based Access Control) is primary: permissions granted to roles, roles to users. DAC via ownership. Newer features move toward ABAC (Attribute-Based) where access depends on data attributes.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-data-sharing-interview', 'snowflake-cortex-ai-interview', 'snowflake-replication-failover-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-cost-optimization-interview', title: 'Snowflake Cost Optimization — Expert Interview Questions', shortDescription: 'Expert questions on credit consumption, warehouse sizing, auto-suspend, resource monitors, serverless costs, and strategies to reduce spend 30-60%.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Credit Model', type: 'qna', items: [ { question: 'What consumes credits and what is free?', answer: 'Credits: warehouses (per-second, XS=1/hr to 6XL=512), cloud services (charged if over 10% daily WH compute), serverless (Snowpipe, auto-clustering, MV refresh, SOS, DT refresh, Streaming), Cortex AI (per-token). Storage: $/TB/month. Free: metadata queries, suspended warehouses, result cache hits, data sharing (consumer pays compute).' }, { question: 'Walk through a $50K/month cost reduction audit.', answer: 'Framework: (1) WAREHOUSE_METERING_HISTORY: top-5 warehouses, oversized, auto-suspend configured? (2) QUERY_HISTORY: top-50 most expensive, full table scans, missing clustering? (3) Serverless histories: clustering on rarely-changed tables? (4) Storage: high Time Travel retention, fail-safe on transient tables? (5) Cloud services over 10% threshold? Typical savings: warehouse sizing 20%, auto-suspend 15%, query optimization 10-20%, storage cleanup 5-10%.' }, { question: 'Optimal auto-suspend settings for different workloads?', answer: 'ETL: 60s (clear start/end). BI dashboards: 300s (cache warm). Ad-hoc: 300-600s. Data science: 900-1800s. Never set 0 (wastes credits while idle). Always enable auto-resume.' }, { question: 'How do multi-cluster warehouses affect costs?', answer: 'Auto-scale 1-N clusters on concurrency. STANDARD adds after 20s queue, ECONOMY waits 6 min. Can save: MEDIUM dynamic (4-12 cr/hr) vs always-on XL (16 cr/hr). Can waste: aggressive scaling for brief bursts (60s min billing per cluster). Best: MIN=1, MAX=2-3.' }, { question: 'Resource monitors for cost governance?', answer: 'CREDIT_QUOTA + TRIGGERS: 75% NOTIFY, 90% SUSPEND, 100% SUSPEND_IMMEDIATE. Framework: account-level hard cap, per-team quotas, per-warehouse limits. Tag warehouses by department for chargeback reporting. SUSPEND_IMMEDIATE kills running queries, use only for hard caps.' } ] }, { title: 'Advanced Strategies', type: 'qna', items: [ { question: 'How to optimize serverless feature costs?', answer: 'Snowpipe: batch files to 100-250MB. Auto-clustering: only on tables with heavy scan workloads, check AUTOMATIC_CLUSTERING_HISTORY for constant reclustering. Dynamic Tables: use DOWNSTREAM lag, ensure incremental refresh mode. Serverless has no auto-suspend concept, only controls: disable, reduce frequency, resource monitors.' }, { question: 'Transient vs permanent tables for cost savings?', answer: 'Permanent: 7-day Time Travel + 7-day Fail-safe = 14 days historical retention. Transient: 0-1 day TT, NO Fail-safe. 1TB permanent table stores ~14TB historical. Transient with 0-day = ~1TB. Saves ~$300/month per 1TB table at $23/TB. Use transient for staging, ETL intermediates, reproducible data.' } ] }, { title: 'Cost Tips', type: 'callout', items: [ { variant: 'tip', title: 'Warehouse Sizing is the Biggest Lever', body: 'Many queries run identically on XS and XL. Profile top-10 most expensive queries across warehouse sizes. This alone can cut 20-40% of compute spend.' }, { variant: 'warning', title: 'Cloud Services Overage', body: 'If cloud services exceed 10% of daily warehouse compute, you pay extra. Causes: too many tiny queries, excessive SHOW/DESCRIBE, complex role hierarchies. Fix: batch queries.' }, { variant: 'info', title: 'Result Caching is Free', body: 'Identical query + unchanged data + within 24hrs = zero credits. Design dashboards with deterministic queries, no CURRENT_TIMESTAMP.' } ] } ], faqs: [ { question: 'How to estimate monthly costs?', answer: 'Pricing calculator with compute, storage, serverless estimates + 20% buffer. For existing workloads: 1-month POC on pay-as-you-go, then negotiate capacity pricing (25-40% discount).' }, { question: 'Is capacity pricing always cheaper?', answer: '25-40% per-credit discount but requires annual commitment. Strategy: commit 70-80% of expected usage on capacity, flex remaining 20-30% on-demand.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-performance-deep-dive-interview', 'snowflake-snowpipe-streaming-interview'], relatedArticles: ['/articles/snowflake-query-optimization-guide-2026'] },
  { slug: 'snowflake-performance-deep-dive-interview', title: 'Snowflake Query Tuning — Expert Interview Questions', shortDescription: 'Expert questions on micro-partition pruning, clustering keys, search optimization, query profiling, spilling to disk, and caching layers.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Pruning and Clustering', type: 'qna', items: [ { question: 'Explain micro-partition architecture and performance impact.', answer: 'Immutable columnar files 50-500MB uncompressed. Metadata per column: min/max, distinct count, null count. Performance depends on partition pruning: WHERE clause checks metadata to skip non-matching partitions. Chronologically loaded tables prune well on date. Random-order tables prune poorly, needs clustering.' }, { question: 'How does CLUSTER BY work and how to choose keys?', answer: 'Co-locates rows with similar values in same partitions via background reclustering. Choose: most frequent WHERE/JOIN columns, low-to-medium cardinality first, max 3-4 columns. When: tables over 1TB with over 50% partition scans, CLUSTERING_INFORMATION depth over 5-10. Skip: under 100GB, varied query patterns, high write churn.' }, { question: 'Query scans 500GB, returns 100 rows, 0% pruning. How to fix?', answer: 'Add CLUSTER BY on filter column. High-cardinality filter (user_id)? Use Search Optimization Service for point lookups. For joins: cluster both tables on join key. Quick fix: materialize filtered subset.' }, { question: 'Explain spilling to local disk vs remote storage.', answer: 'When intermediate results exceed warehouse memory: local SSD (2-5x slower), then remote cloud storage (10-50x slower). Query Profile shows Bytes Spilled. Fix: scale up warehouse (doubles memory per size), reduce result set, cluster join keys, add LIMIT for sorts. Remote spill over 0 means severely memory-constrained.' }, { question: 'When does Search Optimization outperform clustering?', answer: 'SOS builds bloom-filter-like indexes. Better for: high-cardinality point lookups (user_id, email), LIKE/ILIKE substring searches, geospatial queries, secondary columns on already-clustered tables. Serverless background cost, only worthwhile for frequent selective lookups.' } ] }, { title: 'Profiling and Caching', type: 'qna', items: [ { question: 'How to diagnose a slow query with Query Profile?', answer: 'Systematic: (1) Time breakdown: compilation vs queuing vs execution. Queuing = warehouse overloaded. (2) Most expensive operator (thickest arrow): TableScan (poor pruning), JoinFilter (large intermediates), Sort (spill), Aggregate (high cardinality). (3) Per operator: partitions scanned vs total, bytes spilled, rows produced vs input. (4) Anti-patterns: cartesian joins, UNION instead of UNION ALL.' }, { question: 'Explain the three cache layers.', answer: 'Result cache: full query results 24hrs, zero credits, invalidated on data change. Metadata cache: min/max/count per partition, COUNT(*) and MIN/MAX instant, always active. Warehouse cache: warm SSD of recently read partitions, cleared on suspend. Strategy: result cache for repeated dashboards, warehouse cache for interactive analysis sessions.' } ] }, { title: 'Performance Tips', type: 'callout', items: [ { variant: 'tip', title: 'Check Pruning Before Anything Else', body: 'The number one cause of slow queries is poor micro-partition pruning. Check Partitions Scanned vs Total in Query Profile. Fix clustering or SOS before scaling warehouse.' }, { variant: 'warning', title: 'ORDER BY Without LIMIT is Expensive', body: 'Sorts ALL data in memory, top cause of spilling. Always add LIMIT for top-N results. Scale up warehouse if full sorted output is needed.' }, { variant: 'info', title: 'EXPLAIN is Free', body: 'EXPLAIN shows the query plan without executing. Verify partition pruning estimates, join strategies, and row counts. Zero credits consumed.' } ] } ], faqs: [ { question: 'Should I always use the largest warehouse?', answer: 'No. Simple queries (point lookups, small aggregations) run identically on XS and 4XL. Scaling helps for: large scans, spilling queries, high concurrency. Profile across sizes to find diminishing returns.' }, { question: 'How to check if queries use result cache?', answer: 'QUERY_HISTORY: bytes_scanned=0 with results returned = cache hit. Bypassed when: data changed, USE_CACHED_RESULT=FALSE, non-deterministic functions, or over 24 hours elapsed.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-cost-optimization-interview', 'snowflake-dynamic-tables-interview'], relatedArticles: ['/articles/snowflake-query-optimization-guide-2026'] },
  { slug: 'snowflake-replication-failover-interview', title: 'Snowflake Replication & Failover — Expert Interview Questions', shortDescription: 'Expert questions on database replication, replication groups, failover, disaster recovery, cross-region and cross-cloud patterns.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Replication Architecture', type: 'qna', items: [ { question: 'How does Snowflake database replication work?', answer: 'Replication copies databases (or replication groups of databases, shares, users, roles) from a primary account to one or more secondary accounts. Uses change-based replication: only modified micro-partitions are transferred. Cross-region and cross-cloud supported. Secondary databases are read-only until failover. Replication runs on a schedule (minimum 1 minute) or on-demand via ALTER DATABASE REFRESH.' }, { question: 'What are replication groups vs database replication?', answer: 'Database replication: replicates a single database. Replication groups: replicate multiple databases, shares, users, roles, and warehouses as a unit with consistent point-in-time snapshots. Groups ensure referential integrity across objects. Use groups for DR (replicate everything needed to run the application). Use single DB replication for data sharing or analytics replication.' }, { question: 'Design a disaster recovery architecture with RPO < 5 min and RTO < 30 min.', answer: 'Architecture: (1) Primary account in us-east-1, secondary in us-west-2. (2) Replication group containing all databases, roles, warehouses. (3) Replication schedule: every 1-2 minutes for RPO < 5 min. (4) Monitor replication lag via REPLICATION_GROUP_REFRESH_HISTORY. (5) Failover procedure: ALTER FAILOVER GROUP fg PRIMARY (promotes secondary). RTO depends on: DNS switching time, application reconnection, cache warming. (6) Test failover quarterly. (7) After failover: the old primary becomes secondary. Costs: replication transfer + storage in secondary region.' }, { question: 'What is the difference between failover and failback?', answer: 'Failover: promoting a secondary account/database to primary when the original primary is unavailable. Failback: returning to the original primary after it recovers. In Snowflake: failover is ALTER FAILOVER GROUP ... PRIMARY on the secondary. Failback is the same command on the recovered original. Both are metadata operations (fast) but applications need to reconnect to the new primary. Critical: ensure DNS/connection strings are abstracted so switching is seamless to applications.' }, { question: 'How is replication billed?', answer: 'Three cost components: (1) Data transfer: cross-region/cross-cloud egress charges per GB transferred. (2) Compute: serverless compute for the replication process. (3) Storage: full storage cost in the secondary region (data is duplicated). For a 10TB database replicated cross-region: expect significant monthly transfer and storage costs. Optimize: replicate only critical databases, use replication groups to avoid duplicating shared objects.' } ] }, { title: 'DR Tips', type: 'callout', items: [ { variant: 'tip', title: 'Test Failover Regularly', body: 'Quarterly DR drills catch issues before a real outage. Test the full flow: failover, application reconnection, validation queries, failback.' }, { variant: 'warning', title: 'Replication Lag Monitoring', body: 'Set up alerts on REPLICATION_GROUP_REFRESH_HISTORY. If lag exceeds your RPO, investigate: large data changes, network issues, or insufficient replication compute.' }, { variant: 'info', title: 'Client Redirect', body: 'Use Snowflake client redirect (connection.redirect_allowed=true) to automatically redirect client connections to the active primary after failover.' } ] } ], faqs: [ { question: 'Can I replicate to a different cloud provider?', answer: 'Yes. Snowflake supports cross-cloud replication (AWS to Azure, Azure to GCP, etc.). Data is transferred over Snowflake managed secure links. Cross-cloud transfer costs are higher than same-cloud cross-region.' }, { question: 'Does replication support Time Travel?', answer: 'Time Travel settings are replicated. The secondary database has its own Time Travel data (independent from primary). After failover, you can use Time Travel on the new primary normally.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-governance-interview', 'snowflake-cost-optimization-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-semi-structured-interview', title: 'Snowflake Semi-Structured Data — Expert Interview Questions', shortDescription: 'Expert questions on VARIANT, OBJECT, ARRAY data types, FLATTEN, LATERAL, JSON/XML/Parquet handling, and schema-on-read patterns.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'VARIANT and Data Types', type: 'qna', items: [ { question: 'How does Snowflake store semi-structured data internally?', answer: 'Snowflake stores VARIANT data in an optimized columnar format. When JSON/Avro/Parquet is loaded into a VARIANT column, Snowflake automatically analyzes the structure and stores commonly-occurring paths as individual columns internally (columnar optimization). This means JSON queries like v:user:name can prune and scan efficiently, similar to native columns. VARIANT columns support up to 16MB per value. Performance: well-structured JSON with consistent schemas performs nearly as fast as native columns due to this optimization.' }, { question: 'VARIANT vs OBJECT vs ARRAY: when to use each?', answer: 'VARIANT: the universal semi-structured type. Holds any JSON value (object, array, string, number, null). Use for: raw ingestion, flexible schemas. OBJECT: specifically a key-value map (JSON object). Use for: structured metadata, configuration. ARRAY: ordered list of values. Use for: tags, multi-value attributes. In practice, most teams use VARIANT for everything because it handles all three. OBJECT and ARRAY are useful for: explicit typing in UDFs, clearer schema intent in table definitions, and type checking (IS_OBJECT, IS_ARRAY).' }, { question: 'How do you query nested JSON efficiently?', answer: 'Path notation: SELECT v:user:address:city FROM table. Bracket notation for special chars: v["user-name"]. For arrays: v:items[0]:name (first element). For deep nesting: chain paths v:a:b:c:d. Performance tips: (1) Create views that extract common paths as typed columns for downstream consumers. (2) Use :: for casting: v:price::NUMBER. (3) Filter on extracted paths: WHERE v:status::STRING = "active" leverages micro-partition pruning on the internal columnar representation. (4) For repeated queries on the same paths, materialize into native columns.' }, { question: 'What happens when you load Parquet vs JSON vs Avro into Snowflake?', answer: 'JSON: loaded into VARIANT column (or specific columns via COPY INTO with column mapping). Nested structures preserved. Avro: schema is used to map to Snowflake columns automatically if column names match; otherwise lands in VARIANT ($1). Schemas from Confluent Schema Registry can auto-map. Parquet: columnar format, Snowflake reads column metadata and can map directly to table columns. Most efficient for large datasets. All three: support schema-on-read (load into VARIANT first, extract later) or schema-on-write (map during COPY INTO).' } ] }, { title: 'FLATTEN and Advanced Patterns', type: 'qna', items: [ { question: 'Explain FLATTEN and when you need LATERAL.', answer: 'FLATTEN converts a VARIANT array or object into rows (one row per element). Usage: SELECT f.value:name FROM table, LATERAL FLATTEN(input => v:items) f. LATERAL is required because FLATTEN references a column from the left table (the VARIANT column). Without LATERAL, the subquery cannot reference the outer table. Key parameters: input (the array/object), path (sub-path within), outer (TRUE = include rows even when array is empty/null, like LEFT JOIN), recursive (TRUE = flatten nested structures), mode (OBJECT/ARRAY/BOTH).' }, { question: 'How to handle deeply nested JSON with arrays of objects containing arrays?', answer: 'Chain FLATTEN calls: SELECT t.id, f1.value:name::STRING AS item_name, f2.value::STRING AS tag FROM table t, LATERAL FLATTEN(input => t.v:orders) f1, LATERAL FLATTEN(input => f1.value:tags) f2. Each FLATTEN produces rows that multiply with the next. For complex structures, use CTEs to flatten one level at a time for readability. Performance consideration: chained FLATTEN on large arrays can produce massive row explosions. Add WHERE filters early to reduce intermediate rows.' }, { question: 'Schema-on-read vs materializing into native columns: when each?', answer: 'Schema-on-read (query VARIANT directly): when schema changes frequently, during exploration/prototyping, for ad-hoc analytics on raw data. Materialize (extract into typed columns via Dynamic Table or view): when schema is stable, for production dashboards (faster queries), for downstream tools that need typed columns (BI tools), when you need clustering on extracted values. Hybrid pattern: land raw in VARIANT, materialize hot-path columns into a typed Dynamic Table, keep VARIANT for ad-hoc exploration.' } ] }, { title: 'Semi-Structured Tips', type: 'callout', items: [ { variant: 'tip', title: 'Cast Early and Often', body: 'VARIANT path expressions return VARIANT type. Always cast to native types (::STRING, ::NUMBER, ::TIMESTAMP) for correct comparisons, aggregations, and join behavior. Without casting, string comparison rules apply.' }, { variant: 'warning', title: 'Array Explosion', body: 'FLATTEN on arrays multiplies rows. An array with 100 elements on 1M rows produces 100M rows. Filter before flattening or add LIMIT to avoid resource exhaustion.' }, { variant: 'info', title: 'Columnar Optimization', body: 'Snowflake automatically optimizes frequently-accessed JSON paths into columnar format. Queries on consistent JSON structures can be nearly as fast as native columns without manual materialization.' } ] } ], faqs: [ { question: 'Maximum VARIANT size?', answer: '16MB per VARIANT value. For larger documents, split into chunks before loading. Most JSON records are well under this limit.' }, { question: 'Can you index VARIANT columns?', answer: 'No traditional indexes, but: (1) Search Optimization Service supports VARIANT path expressions. (2) Snowflake auto-optimizes internal columnar storage for common paths. (3) Clustering on extracted expressions (CLUSTER BY (v:date::DATE)) works for pruning.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-performance-deep-dive-interview', 'snowflake-snowpipe-streaming-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-stored-procedures-interview', title: 'Snowflake Stored Procedures & UDFs — Expert Interview Questions', shortDescription: 'Expert questions on stored procedures, JavaScript/Python/SQL UDFs, caller vs owner rights, transaction management, and security considerations.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'Procedures vs UDFs', type: 'qna', items: [ { question: 'Stored procedure vs UDF vs UDTF: when to use each?', answer: 'Stored Procedure: executes a program with multiple SQL statements, DDL, DML, transaction control. Called with CALL. Use for: ETL orchestration, admin automation, multi-step workflows. Can modify data. UDF (User-Defined Function): takes input, returns single value per row. Called in SELECT. Use for: row-level transformations, calculations. Cannot modify data. UDTF (User-Defined Table Function): takes input, returns multiple rows. Called with TABLE(). Use for: exploding data, ML inference per group, custom aggregations returning rows. Key: procedures are imperative (do things), functions are declarative (compute things).' }, { question: 'Caller rights vs owner rights: what is the security difference?', answer: 'Owner rights (default): procedure runs with the privileges of the role that OWNS the procedure, regardless of who calls it. Use for: controlled data access (grant procedure execution without granting table access). Caller rights (EXECUTE AS CALLER): procedure runs with the privileges of the calling role. Use for: utility procedures that should respect the caller permissions, admin scripts that need the caller context. Security implication: owner rights procedures can be security risks if they access sensitive data and the owner role is highly privileged. Always audit owner-rights procedures that access PII. Specify during creation: CREATE PROCEDURE ... EXECUTE AS OWNER|CALLER.' }, { question: 'How do you handle transactions in stored procedures?', answer: 'Snowflake stored procedures support explicit transaction control: BEGIN, COMMIT, ROLLBACK. Key rules: (1) If a procedure is called within an existing transaction, it joins that transaction (no nested transactions). (2) If called outside a transaction, each SQL statement is auto-committed unless you explicitly BEGIN. (3) On unhandled exception: if autocommit is off, changes are rolled back. (4) CALL inside a task graph: all tasks share the graph transaction. Best practice: always wrap multi-statement DML in BEGIN/COMMIT with TRY/CATCH for ROLLBACK on error. Use SQLSTATE for error handling.' }, { question: 'JavaScript vs Python vs SQL for stored procedures?', answer: 'SQL: simplest, best for pure SQL orchestration (MERGE, INSERT, DDL sequences). No external libraries. Python: best for ML, complex logic, pandas/sklearn. Runs in Snowpark sandbox. Access to Anaconda packages. JavaScript: legacy, still supported. Best for JSON manipulation. No package ecosystem compared to Python. Scala/Java: available via Snowpark. Best for teams with JVM expertise. Choose based on: team skills, library needs, and complexity. For pure SQL workflows, SQL procedures are fastest. For anything requiring non-SQL logic, Python is the modern choice.' } ] }, { title: 'Advanced Patterns', type: 'qna', items: [ { question: 'How do you dynamically generate and execute SQL in a stored procedure?', answer: 'In SQL procedures: use EXECUTE IMMEDIATE with string concatenation. Example: LET stmt := \'SELECT * FROM \' || :table_name; EXECUTE IMMEDIATE :stmt. In Python: session.sql(f"SELECT * FROM {table_name}").collect(). Security warning: dynamic SQL is vulnerable to SQL injection. Always validate inputs, use IDENTIFIER() for object names (SELECT * FROM IDENTIFIER(:table_name)), and never concatenate user input directly into SQL strings.' }, { question: 'How do you return results from a stored procedure?', answer: 'SQL procedures: RETURN value (single scalar). For tabular results: use RESULTSET and TABLE(RESULT_SCAN(LAST_QUERY_ID())). Python procedures: return a string, or write results to a table and return the table name. JavaScript: return JSON string or scalar. Limitation: procedures cannot directly return a result set to the caller like a function. Workaround: write to a temporary table, return the table name, caller queries the temp table. Or use a UDTF instead if you need tabular output in SELECT.' } ] }, { title: 'Procedure Tips', type: 'callout', items: [ { variant: 'tip', title: 'Use IDENTIFIER() for Dynamic SQL', body: 'Never concatenate table/column names into SQL strings. Use IDENTIFIER(:var_name) to safely reference dynamic object names and prevent SQL injection.' }, { variant: 'warning', title: 'Owner Rights Security', body: 'Owner-rights procedures execute with the owner role privileges. A procedure owned by SYSADMIN accessing PII tables is a security risk. Audit and restrict ownership of procedures that access sensitive data.' }, { variant: 'info', title: 'Python is the Modern Choice', body: 'For new stored procedures requiring non-SQL logic, use Python (Snowpark). It has the best library ecosystem, debugging support, and is actively developed by Snowflake.' } ] } ], faqs: [ { question: 'Can stored procedures be called from tasks?', answer: 'Yes. A task SQL can be CALL my_procedure(args). Common pattern: task triggers on stream, calls procedure that implements complex ETL logic. The procedure runs within the task execution context.' }, { question: 'Maximum execution time?', answer: 'Stored procedures have the same timeout as regular queries: dependent on warehouse. For long-running procedures, use a larger warehouse and consider breaking into multiple procedures called sequentially.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-snowpark-interview', 'snowflake-streams-tasks-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },
  { slug: 'snowflake-external-integrations-interview', title: 'Snowflake External Functions & Integrations — Expert Interview Questions', shortDescription: 'Expert questions on external functions, API integrations, external tables, external stages, and connecting Snowflake to external systems.', category: 'interview', difficulty: 'Advanced', lastUpdated: '2026-04-09', sections: [ { title: 'External Functions', type: 'qna', items: [ { question: 'What are external functions and when do you use them?', answer: 'External functions let Snowflake call external HTTP endpoints (REST APIs) during query execution. SQL calls the function, Snowflake sends rows to an API Gateway (AWS API Gateway, Azure API Management), which routes to your backend (Lambda, Azure Functions, etc.). Use cases: (1) ML model inference on an external service. (2) Geocoding, IP lookup, or enrichment APIs. (3) Sending notifications from SQL (email, Slack). (4) Calling proprietary services that cannot run inside Snowflake. Key: data LEAVES Snowflake during the call, so governance and latency are concerns.' }, { question: 'Walk through setting up an external function end to end.', answer: 'Steps: (1) Create API integration: CREATE API INTEGRATION ext_api API_PROVIDER=aws_api_gateway API_AWS_ROLE_ARN=... API_ALLOWED_PREFIXES=(url). This establishes trust between Snowflake and your API Gateway. (2) Create the function: CREATE EXTERNAL FUNCTION classify(text VARCHAR) RETURNS VARIANT API_INTEGRATION=ext_api AS url. (3) Call it: SELECT classify(description) FROM products. Under the hood: Snowflake batches rows (up to 1000 per request), sends JSON payload to the endpoint, receives JSON response, maps back to rows. The API must handle the Snowflake batch format (rows array in, rows array out).' }, { question: 'Performance and cost considerations for external functions?', answer: 'Performance: (1) Network latency per batch (100-500ms per API call). (2) Snowflake sends rows in batches of up to 1000, processes concurrently based on warehouse size. (3) Large tables (millions of rows) = thousands of API calls. Throughput depends on your backend capacity. Cost: (1) Snowflake warehouse credits while waiting for API responses. (2) API Gateway / Lambda / function costs. (3) Data transfer (egress from Snowflake). Optimization: (1) Pre-filter data to minimize rows sent. (2) Cache results in a table for repeated lookups. (3) Use larger warehouse for more parallel batches. (4) Ensure your backend can handle the load (auto-scaling Lambda).' } ] }, { title: 'External Tables and Stages', type: 'qna', items: [ { question: 'External tables vs regular tables: when to use external tables?', answer: 'External tables reference data in cloud storage (S3/GCS/ADLS) without copying it into Snowflake. Data stays in original format (Parquet, CSV, JSON). Use when: (1) Data is managed by another system (Spark, data lake). (2) You want to query without ingestion delay/cost. (3) Data governance requires storage in your own bucket. (4) Exploratory queries on large datasets before deciding to ingest. Trade-offs: external tables are slower (no Snowflake optimizations like clustering, micro-partition pruning is limited), no DML (read-only), and limited metadata. For production workloads, ingest into native or Iceberg tables.' }, { question: 'How do you manage external stages and file formats?', answer: 'External stage: CREATE STAGE my_stage URL=s3://bucket/path/ STORAGE_INTEGRATION=my_int FILE_FORMAT=(TYPE=PARQUET). Storage integration: abstraction over cloud credentials (avoids embedding keys in stage definition). File format: reusable format spec (TYPE, COMPRESSION, FIELD_DELIMITER, etc.). Pattern: (1) Create storage integration (once, by admin). (2) Create stage referencing integration. (3) Create file format. (4) COPY INTO table FROM @stage or create external table on stage. Best practice: use storage integrations, never embed credentials in stage URLs.' } ] }, { title: 'Integration Tips', type: 'callout', items: [ { variant: 'tip', title: 'Cache External Function Results', body: 'If your external function performs lookups (geocoding, IP enrichment), cache results in a Snowflake table. Check cache before calling the API. This can reduce API calls by 90%+ for repeated values.' }, { variant: 'warning', title: 'Data Leaves Snowflake', body: 'External functions send data to external endpoints. Ensure: (1) endpoint is in the same cloud region to minimize latency and egress. (2) data is encrypted in transit (HTTPS required). (3) governance policies allow the data to leave. (4) PII is masked before sending if needed.' }, { variant: 'info', title: 'Iceberg as Alternative to External Tables', body: 'For new projects, consider Iceberg tables over external tables. Iceberg provides better query performance (Snowflake can optimize), DML support, Time Travel, and is still open-format readable by other engines.' } ] } ], faqs: [ { question: 'Can external functions call any API?', answer: 'The API must be exposed through a supported API Gateway (AWS API Gateway, Azure API Management, Google Cloud API Gateway). The endpoint must handle Snowflake batch format. Any backend behind the gateway works: Lambda, containers, VMs, third-party APIs (with a proxy).' }, { question: 'Maximum timeout for external functions?', answer: 'External function calls have a default timeout of 180 seconds per batch. For long-running inference, consider async patterns: the function returns immediately with a job ID, a separate task polls for results.' } ], relatedSlugs: ['snowflake-interview-questions', 'snowflake-snowpark-interview', 'snowflake-data-sharing-interview'], relatedArticles: ['/articles/snowflake-interview-questions-answers-2026'] },

  // ────────────────────────────────────────────
  // 25. Python for Data Engineers Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'python-for-data-engineers',
    title: 'Python for Data Engineers Cheat Sheet',
    shortDescription: 'Essential Python patterns for data engineering: pandas, itertools, generators, connecting to Snowflake, writing production-safe ETL scripts, and testing data pipelines.',
    category: 'programming',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'Core Libraries Every Data Engineer Needs',
        type: 'table',
        columns: ['Library', 'Use Case', 'Install'],
        items: [
          ['pandas', 'In-memory tabular transforms under ~5GB', 'pip install pandas'],
          ['polars', 'Faster pandas alternative, lazy eval, Arrow-native', 'pip install polars'],
          ['pyarrow', 'Columnar memory format, Parquet read/write', 'pip install pyarrow'],
          ['snowflake-connector-python', 'Connect to Snowflake, fetch_pandas_all()', 'pip install snowflake-connector-python[pandas]'],
          ['snowflake-snowpark-python', 'Push computation to Snowflake warehouse', 'pip install snowflake-snowpark-python'],
          ['sqlalchemy', 'Generic DB abstraction (Postgres, MySQL, Snowflake)', 'pip install sqlalchemy'],
          ['boto3', 'AWS S3 / Secrets Manager / Glue', 'pip install boto3'],
          ['pydantic', 'Runtime data validation, schema contracts', 'pip install pydantic'],
          ['great-expectations', 'Data quality testing framework', 'pip install great-expectations'],
          ['pytest', 'Unit + integration tests for pipelines', 'pip install pytest'],
        ],
      },
      {
        title: 'Production-Safe Snowflake Connection Pattern',
        type: 'code',
        language: 'python',
        code: `import os
import snowflake.connector
from contextlib import contextmanager

@contextmanager
def snowflake_conn():
    """Always close connection, even on error."""
    conn = snowflake.connector.connect(
        account=os.environ['SF_ACCOUNT'],
        user=os.environ['SF_USER'],
        password=os.environ['SF_PASSWORD'],
        warehouse=os.environ['SF_WAREHOUSE'],
        database=os.environ['SF_DATABASE'],
        schema=os.environ['SF_SCHEMA'],
        role=os.environ['SF_ROLE'],
        client_session_keep_alive=False,
    )
    try:
        yield conn
    finally:
        conn.close()

def run_query(sql: str, params: dict | None = None):
    with snowflake_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
            return cur.fetchall()

# Parameterized query (SQL-injection safe)
rows = run_query(
    "SELECT * FROM orders WHERE customer_id = %(cid)s AND order_date >= %(d)s",
    {"cid": 12345, "d": "2026-01-01"},
)`,
      },
      {
        title: 'Efficient Pandas Patterns',
        type: 'code',
        language: 'python',
        code: `import pandas as pd

# Read Parquet (10-100x faster than CSV)
df = pd.read_parquet('s3://bucket/orders.parquet')

# Specify dtypes to cut memory 50%+
df = pd.read_csv('data.csv', dtype={
    'order_id': 'int32',
    'amount': 'float32',
    'status': 'category',
})

# Vectorize — NEVER iterate row-by-row
# BAD:   for idx, row in df.iterrows(): ...
# GOOD:  df['total'] = df['qty'] * df['price']

# Use assign() for readable chained transforms
clean = (
    df
    .query('amount > 0')
    .assign(
        order_month=lambda d: d['order_date'].dt.to_period('M'),
        is_big=lambda d: d['amount'] > 1000,
    )
    .groupby('order_month', as_index=False)
    .agg(revenue=('amount', 'sum'), orders=('order_id', 'count'))
)

# Process giant files in chunks
for chunk in pd.read_csv('huge.csv', chunksize=100_000):
    processed = chunk.pipe(transform).pipe(validate)
    processed.to_parquet(f'out/{chunk.index[0]}.parquet')`,
      },
      {
        title: 'Generators & Memory-Efficient Iteration',
        type: 'code',
        language: 'python',
        code: `# Stream rows from Snowflake without loading all into memory
def stream_query(sql: str, batch_size: int = 10_000):
    with snowflake_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            while True:
                rows = cur.fetchmany(batch_size)
                if not rows:
                    break
                yield from rows

# Consumer uses constant memory no matter the table size
for row in stream_query("SELECT * FROM huge_table"):
    process(row)

# Batch generator for bulk inserts
from itertools import islice
def batched(iterable, n):
    it = iter(iterable)
    while (batch := list(islice(it, n))):
        yield batch

# Bulk write 1000 rows at a time
for batch in batched(records, 1000):
    cursor.executemany(INSERT_SQL, batch)`,
      },
      {
        title: 'Testing Data Pipelines',
        type: 'code',
        language: 'python',
        code: `# test_transforms.py
import pandas as pd
import pytest
from my_pipeline import clean_orders

def test_clean_orders_removes_negative_amounts():
    raw = pd.DataFrame({
        'order_id': [1, 2, 3],
        'amount': [100.0, -5.0, 250.0],
    })
    result = clean_orders(raw)
    assert len(result) == 2
    assert (result['amount'] > 0).all()

def test_clean_orders_preserves_schema():
    raw = pd.DataFrame({'order_id': [1], 'amount': [100.0]})
    result = clean_orders(raw)
    assert set(result.columns) == {'order_id', 'amount', 'order_month'}

@pytest.mark.parametrize("amount,expected", [
    (0.01, True), (999.99, True), (1000.01, False), (-1, False),
])
def test_valid_amount(amount, expected):
    assert is_valid_amount(amount) is expected

# Run: pytest -v --cov=my_pipeline --cov-report=term-missing`,
      },
      {
        title: 'Production Pipeline Best Practices',
        type: 'tips',
        items: [
          'Never hardcode credentials — use environment variables, AWS Secrets Manager, or Snowflake key-pair auth',
          'Always use parameterized queries (%(name)s or %s) — never f-string SQL (SQL injection risk)',
          'Wrap connections in context managers (with statement) so they close even on exception',
          'Use logging, not print() — configure root logger with JSON formatter for production',
          'Validate input schemas with pydantic BaseModel — fail fast on bad data',
          'Prefer Parquet over CSV for intermediate files: 10-100x faster I/O, preserves dtypes',
          'Use Snowpark DataFrames when possible — pushes compute to Snowflake, avoids data egress',
          'Pin dependencies in requirements.txt or pyproject.toml — unpinned versions break builds silently',
          'Add retries with exponential backoff for network calls (tenacity library)',
          'Write tests before productionizing — pytest + moto (mock AWS) + testcontainers (real Postgres)',
        ],
      },
    ],
    faqs: [
      { question: 'Should I use pandas or Snowpark for data engineering?', answer: 'Use Snowpark when your data lives in Snowflake and transformations are SQL-expressible — compute runs on the Snowflake warehouse, no data egress, scales to billions of rows. Use pandas for local transforms under ~5GB, or when you need libraries like scikit-learn that require Python objects. Rule: if you find yourself pulling a large table out of Snowflake only to transform and push it back, switch to Snowpark.' },
      { question: 'Why is my pandas script slow on a 2GB CSV?', answer: 'Common fixes: (1) Read Parquet instead of CSV — 10-100x faster. (2) Specify dtypes on read to avoid object columns. (3) Use category dtype for low-cardinality strings. (4) Vectorize operations — iterrows() is 100x slower than column arithmetic. (5) If still slow, switch to polars (lazy evaluation, multi-core). (6) For over 10GB, push compute to Snowflake via Snowpark.' },
      { question: 'How do I handle secrets in Python data pipelines?', answer: 'Use environment variables loaded from a secret manager at runtime: AWS Secrets Manager, Azure Key Vault, or Snowflake key-pair authentication. Never commit credentials to git. In CI/CD use GitHub Actions secrets or Vault. For local dev use a .env file with python-dotenv (gitignored). For Snowflake specifically, prefer key-pair auth over passwords — it is more secure and does not expire.' },
      { question: 'What is the best way to unit-test a data pipeline?', answer: 'Separate pure transform logic (deterministic functions taking a DataFrame, returning a DataFrame) from I/O (read/write). Unit-test the transforms with small fixture DataFrames using pytest. Mock external services with moto (AWS) or responses (HTTP). Use testcontainers or a real Snowflake test account for integration tests. Target about 80% coverage on transform logic and 100% on critical financial/compliance calculations.' },
      { question: 'When should I use generators instead of lists?', answer: 'Use generators when processing data larger than memory (streaming from Snowflake, reading large files line by line), when you only need the result once (no re-iteration needed), or when you want lazy evaluation. Use lists when you need len(), indexing, or multiple iterations. Generators use O(1) memory regardless of data size — critical for pipelines processing millions of rows.' },
      { question: 'How do I structure a production ETL Python project?', answer: 'Standard layout: src/pipeline/{extract,transform,load}.py for stages, src/pipeline/config.py for settings (pydantic-settings), src/pipeline/io/ for external connectors, tests/ mirroring src, pyproject.toml pinning deps, Dockerfile for deployment. Keep main.py thin — just wiring. Use dependency injection for connections so tests can inject mocks.' },
      { question: 'Polars vs pandas — which should I pick in 2026?', answer: 'Polars is faster (Rust + multi-core), uses less memory, and has a cleaner API, but the ecosystem (scikit-learn, plotting libraries, tutorials) is smaller. Pick polars for new ETL work especially over 1GB where speed matters. Stay with pandas when integrating with an existing pandas codebase, using scikit-learn heavily, or onboarding junior engineers — pandas has more Stack Overflow answers.' },
      { question: 'How do I retry failed API calls gracefully?', answer: 'Use the tenacity library: @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, max=60)) decorator retries on exception with exponential backoff. Only retry idempotent operations. Set a circuit breaker for chronic failures. Log each retry attempt so you can alert when retries exceed normal baseline.' },
    ],
    relatedSlugs: ['pyspark', 'dbt-commands', 'snowflake-sql', 'data-engineering-interview-questions'],
    relatedArticles: ['/articles/snowflake-cortex-code-dbt-optimization-guide', '/articles/data-engineer-roadmap-2025'],
  },

  // ────────────────────────────────────────────
  // 26. PySpark / Spark SQL Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'pyspark',
    title: 'PySpark & Spark SQL Cheat Sheet',
    shortDescription: 'PySpark DataFrame API, Spark SQL, window functions, partitioning, caching, and performance tuning for production data pipelines.',
    category: 'programming',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'DataFrame API Essentials',
        type: 'code',
        language: 'python',
        code: `from pyspark.sql import SparkSession, functions as F, Window

spark = (
    SparkSession.builder
    .appName("orders-etl")
    .config("spark.sql.adaptive.enabled", "true")
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
    .getOrCreate()
)

# Read sources
orders = spark.read.parquet("s3://bucket/orders/")
customers = spark.read.format("delta").load("s3://bucket/customers/")

# Transform
clean = (
    orders
    .filter(F.col("amount") > 0)
    .withColumn("order_month", F.date_trunc("month", F.col("order_date")))
    .withColumn("is_big", F.col("amount") > 1000)
    .join(customers, "customer_id", "left")
    .select("order_id", "customer_id", "amount", "order_month", "country")
)

# Aggregate
monthly = (
    clean.groupBy("order_month", "country")
    .agg(
        F.sum("amount").alias("revenue"),
        F.count("order_id").alias("orders"),
        F.countDistinct("customer_id").alias("unique_customers"),
    )
)

# Write (partitioned)
(monthly.write
    .mode("overwrite")
    .partitionBy("order_month")
    .format("delta")
    .save("s3://bucket/monthly_summary/"))`,
      },
      {
        title: 'Window Functions',
        type: 'code',
        language: 'python',
        code: `from pyspark.sql import Window, functions as F

# Running total per customer, ordered by date
w_running = Window.partitionBy("customer_id").orderBy("order_date") \\
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df = orders.withColumn("lifetime_spend", F.sum("amount").over(w_running))

# Rank orders within customer (1 = largest)
w_rank = Window.partitionBy("customer_id").orderBy(F.desc("amount"))
df = df.withColumn("order_rank", F.row_number().over(w_rank))

# 7-day rolling average (requires ordered time window)
w_rolling = Window.partitionBy("customer_id") \\
    .orderBy(F.col("order_date").cast("long")) \\
    .rangeBetween(-6 * 86400, 0)  # 6 days before to current

df = df.withColumn("avg_7d", F.avg("amount").over(w_rolling))

# Lag / Lead for change detection
w_seq = Window.partitionBy("customer_id").orderBy("order_date")
df = df.withColumn("prev_amount", F.lag("amount").over(w_seq))
df = df.withColumn("amount_change", F.col("amount") - F.col("prev_amount"))`,
      },
      {
        title: 'Join Strategies & When Spark Picks Each',
        type: 'table',
        columns: ['Strategy', 'When Used', 'How to Force'],
        items: [
          ['Broadcast Hash Join', 'Small side under spark.sql.autoBroadcastJoinThreshold (default 10MB)', 'F.broadcast(small_df) hint'],
          ['Sort-Merge Join', 'Both sides large, sortable by join key', 'Default for large joins'],
          ['Shuffle Hash Join', 'One side fits in memory per partition', 'Rare, AQE chooses'],
          ['Broadcast Nested Loop', 'Non-equi joins with a small side', 'F.broadcast() + non-equal condition'],
          ['Cartesian Product', 'No join condition (danger)', 'crossJoin() — use with extreme care'],
        ],
      },
      {
        title: 'Spark SQL — Common Patterns',
        type: 'code',
        language: 'sql',
        code: `-- Register DataFrame as a temp view
-- orders.createOrReplaceTempView("orders")

-- Rank top-5 customers per country by revenue
SELECT *
FROM (
  SELECT
    country,
    customer_id,
    SUM(amount) AS revenue,
    RANK() OVER (PARTITION BY country ORDER BY SUM(amount) DESC) AS rnk
  FROM orders
  GROUP BY country, customer_id
)
WHERE rnk <= 5;

-- Pivot monthly revenue by country
SELECT * FROM orders
PIVOT (
  SUM(amount) FOR country IN ('US', 'UK', 'DE', 'IN')
);

-- Explode array column into rows
SELECT order_id, item
FROM orders
LATERAL VIEW EXPLODE(items) t AS item;

-- Broadcast a small lookup
SELECT /*+ BROADCAST(c) */ o.*, c.country
FROM orders o JOIN customers c ON o.customer_id = c.customer_id;`,
      },
      {
        title: 'Performance Tuning Checklist',
        type: 'tips',
        items: [
          'Enable Adaptive Query Execution (AQE): spark.sql.adaptive.enabled=true — auto-coalesces partitions and handles skew',
          'Partition by low-cardinality columns (country, month) — NOT by user_id (too granular, creates millions of files)',
          'Use broadcast joins for dimension tables under 100MB: F.broadcast(dim_df)',
          'Cache DataFrames reused 3+ times: df.cache() then df.count() to materialize',
          'Prefer DataFrame API over RDD API — Catalyst optimizer only works on DataFrames',
          'Avoid collect() on big data — brings all rows to driver and OOMs. Use write() instead',
          'Set spark.sql.shuffle.partitions based on data size: target ~128MB per partition',
          'Handle skew with salting: add random_key, aggregate, then aggregate again',
          'Use columnar formats (Parquet, Delta, Iceberg) — predicate pushdown + column pruning',
          'Monitor Spark UI Stages tab — look for skewed tasks (one task 10x slower than others)',
        ],
      },
      {
        title: 'Common Interview Q&A',
        type: 'qna',
        items: [
          { question: 'What is the difference between narrow and wide transformations?', answer: 'Narrow transformations (map, filter, union) produce child partitions that depend on exactly one parent partition — no shuffle. Wide transformations (groupBy, join, distinct) require data from multiple partitions — triggers a shuffle which writes intermediate data to disk and reads it over the network. Wide transforms are expensive; minimize them by filtering/projecting before grouping.' },
          { question: 'How do you handle data skew?', answer: 'Symptoms: one task runs 10-100x slower than peers in the same stage. Fixes: (1) Enable AQE skew join: spark.sql.adaptive.skewJoin.enabled=true — automatically splits skewed partitions. (2) Salting: add a random prefix to the skewed key, group, then group again without salt. (3) Broadcast the smaller side if possible. (4) Isolate hot keys and process separately. (5) Increase spark.sql.shuffle.partitions so skewed data spreads further.' },
          { question: 'cache() vs persist() — what is the difference?', answer: 'cache() is shorthand for persist(StorageLevel.MEMORY_AND_DISK). persist() accepts any StorageLevel: MEMORY_ONLY (fastest, risk OOM), MEMORY_AND_DISK (default), DISK_ONLY (slowest but safe), MEMORY_ONLY_SER (serialized, saves memory), OFF_HEAP (avoids GC). Always call an action after cache() (e.g., df.count()) to materialize it. Unpersist when no longer needed to free memory.' },
          { question: 'When should you use PySpark vs pandas vs Snowpark?', answer: 'PySpark: data over 100GB, distributed compute needed, Delta/Iceberg workloads on Databricks/EMR. Pandas: under 5GB in-memory, rich Python ecosystem, single-node. Snowpark: data already in Snowflake — pushes compute to Snowflake warehouse, no egress, uses Snowflake governance. For Snowflake-centric stacks, Snowpark usually beats PySpark on ops simplicity and cost.' },
        ],
      },
    ],
    faqs: [
      { question: 'What Spark cluster configuration should I start with?', answer: 'Rule of thumb: executor memory 4-8GB, executor cores 4-5 (higher values hurt parallelism due to JVM GC), driver memory 2x the largest broadcast. Set spark.sql.shuffle.partitions to ~2-3x the total cores. Enable AQE so Spark auto-tunes partition counts. Start with 4 executors, scale based on stage duration. For Databricks, use job clusters (terminate after run) not all-purpose clusters.' },
      { question: 'Why is my Spark job OOMing on the driver?', answer: 'Common causes: (1) collect() or toPandas() on a large DataFrame brings all rows to driver — replace with write(). (2) Broadcasting a DataFrame too large (>100MB). (3) Accumulators collecting too much data. (4) Large number of files in a partitioned read (driver builds file list in memory). Fix: increase spark.driver.memory, avoid collect(), use checkpoint() to truncate lineage on iterative jobs.' },
      { question: 'Parquet vs Delta vs Iceberg for Spark — which?', answer: 'Parquet: open columnar format, read/write only — no ACID, no time travel. Delta Lake: Parquet + transaction log + ACID + schema evolution, best on Databricks. Iceberg: open table format with ACID + time travel + hidden partitioning, broad engine support (Spark, Trino, Snowflake, Flink). Pick Delta if on Databricks, Iceberg if you want multi-engine portability (Snowflake + Spark + Trino reading same data).' },
      { question: 'How do you pass configs to spark-submit in production?', answer: 'Three ways: (1) CLI flags: spark-submit --conf spark.executor.memory=8g app.py. (2) spark-defaults.conf file — baseline cluster settings. (3) In code: SparkSession.builder.config(...). Precedence (highest to lowest): code > CLI > config file. For sensitive values use spark.kubernetes.driver.secrets or environment variables, never commit to git.' },
      { question: 'repartition() vs coalesce() — when to use each?', answer: 'repartition(N) does a full shuffle to produce exactly N partitions — use when increasing partition count or rebalancing skewed data. coalesce(N) merges existing partitions without shuffle — use only when reducing partition count (e.g., before writing out). coalesce is cheaper but can create uneven partitions. For output: coalesce(1) only for tiny result sets; for large output, repartition on the partition column.' },
      { question: 'How do I debug a slow PySpark job?', answer: 'Workflow: (1) Open Spark UI — Stages tab, find the slowest stage. (2) Check Summary Metrics — is one task much slower? (skew). (3) Check Input Size / Shuffle Read — is data being re-read? (cache missing). (4) Check SQL tab — look at the physical plan for BroadcastExchange, SortMergeJoin, filters pushed down. (5) Check DAG visualization — excessive stages = unnecessary shuffles. Common wins: add broadcast hint, enable AQE, pre-filter before join.' },
      { question: 'How are Spark UDFs different from built-in functions?', answer: 'Built-in functions (F.col, F.sum, F.date_trunc) run in the JVM and are optimized by Catalyst — fastest. Python UDFs serialize each row to Python and back — 10-100x slower due to serialization. Pandas UDFs (vectorized, F.pandas_udf) send Arrow batches to Python — much faster than regular UDFs. Rule: always prefer built-ins. If you must write custom logic, use pandas UDFs over Python UDFs.' },
    ],
    relatedSlugs: ['python-for-data-engineers', 'databricks', 'sql-window-functions', 'data-engineering-interview-questions'],
    relatedArticles: ['/articles/data-engineer-roadmap-2025', '/articles/structuring-dbt-projects-in-snowflake'],
  },

  // ────────────────────────────────────────────
  // 27. AWS for Data Engineers Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'aws-for-data-engineers',
    title: 'AWS for Data Engineers Cheat Sheet',
    shortDescription: 'Essential AWS services for data engineering: S3, Glue, Lambda, Step Functions, Athena, IAM, and common architecture patterns with cost tips.',
    category: 'cloud',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'Core Services Map',
        type: 'table',
        columns: ['Service', 'Purpose', 'When to Use'],
        items: [
          ['S3', 'Object storage (the data lake)', 'All raw data, Parquet/Iceberg tables, intermediate files'],
          ['Glue Data Catalog', 'Hive-compatible metastore', 'Central schema store for Athena, EMR, Redshift Spectrum'],
          ['Glue ETL', 'Serverless Spark jobs', 'PySpark ETL when you want managed clusters'],
          ['Glue Crawlers', 'Auto-discover schemas', 'New sources where schema is unknown / evolving'],
          ['Lambda', 'Short-lived (<15 min) serverless functions', 'S3 triggers, API handlers, lightweight ETL'],
          ['Step Functions', 'Serverless workflow orchestration', 'ETL DAGs without managing Airflow'],
          ['Athena', 'Serverless SQL on S3', 'Ad-hoc queries, $5/TB scanned'],
          ['Redshift / Redshift Serverless', 'Cloud data warehouse', 'BI, large analytics workloads'],
          ['EMR / EMR Serverless', 'Managed Hadoop/Spark', 'Heavy Spark jobs, full cluster control'],
          ['MSK / Kinesis', 'Streaming (Kafka / proprietary)', 'Real-time ingestion pipelines'],
          ['IAM', 'Identity & access control', 'Everything — least-privilege roles, service roles'],
          ['Secrets Manager', 'Credential storage with rotation', 'DB passwords, API keys'],
        ],
      },
      {
        title: 'S3 Cost & Performance Patterns',
        type: 'tips',
        items: [
          'Use Parquet + Snappy compression — 10x smaller than CSV, 10x faster query',
          'Partition keys: date first (year=/month=/day=) then low-cardinality filters — enables partition pruning in Athena/Spark',
          'Avoid thousands of tiny files (< 64MB each) — compaction is mandatory; target 128MB-1GB per file',
          'Enable S3 Intelligent-Tiering for unknown access patterns — auto-moves cold data to cheaper tiers',
          'S3 lifecycle rules: move to Glacier after 90 days, delete raw logs after 365 days',
          'Enable S3 Access Logging + GuardDuty for exfiltration detection',
          'Use S3 Select / Athena for predicate pushdown instead of scanning full files',
          'Multi-part upload for files > 100MB; single PUT limit is 5GB',
          'Cross-region replication for DR; S3 Batch Operations for mass reprocessing',
          'Request rate: 3500 PUT and 5500 GET per prefix per second — shard prefixes for higher throughput',
        ],
      },
      {
        title: 'Glue ETL Job Skeleton (PySpark)',
        type: 'code',
        language: 'python',
        code: `import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql import functions as F

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'run_date'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from Data Catalog (pushdown predicate for partition pruning)
src = glueContext.create_dynamic_frame.from_catalog(
    database="raw", table_name="orders",
    push_down_predicate=f"dt = '{args['run_date']}'"
)

df = src.toDF()
clean = (
    df.filter(F.col("amount") > 0)
      .withColumn("dt", F.lit(args['run_date']))
)

# Write to curated zone as Parquet
clean.write.mode("append").partitionBy("dt").parquet(
    "s3://analytics-curated/orders/"
)

job.commit()`,
      },
      {
        title: 'Step Functions ETL Pattern',
        type: 'code',
        language: 'json',
        code: `{
  "Comment": "Daily orders ETL",
  "StartAt": "Extract",
  "States": {
    "Extract": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": { "JobName": "extract-orders", "Arguments": { "--run_date.$": "$.run_date" } },
      "Retry": [{ "ErrorEquals": ["States.ALL"], "IntervalSeconds": 30, "MaxAttempts": 3, "BackoffRate": 2.0 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "NotifyFailure" }],
      "Next": "Transform"
    },
    "Transform": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": { "JobName": "transform-orders" },
      "Next": "Load"
    },
    "Load": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": { "FunctionName": "load-to-snowflake", "Payload.$": "$" },
      "End": true
    },
    "NotifyFailure": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": { "TopicArn": "arn:aws:sns:us-east-1:123:etl-alerts", "Message.$": "$" },
      "End": true
    }
  }
}`,
      },
      {
        title: 'IAM Least-Privilege Example',
        type: 'code',
        language: 'json',
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadRawOrdersOnly",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::raw-zone/orders/*",
        "arn:aws:s3:::raw-zone"
      ],
      "Condition": { "StringLike": { "s3:prefix": "orders/*" } }
    },
    {
      "Sid": "WriteCuratedOrdersOnly",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::curated-zone/orders/*"
    },
    {
      "Sid": "GlueCatalogRead",
      "Effect": "Allow",
      "Action": ["glue:GetTable", "glue:GetPartitions", "glue:GetDatabase"],
      "Resource": "*"
    }
  ]
}`,
      },
      {
        title: 'Cost Traps to Avoid',
        type: 'qna',
        items: [
          { question: 'Why is my Athena bill huge?', answer: 'Athena charges $5 per TB scanned. Huge bills almost always mean scanning unpartitioned data or SELECT * on Parquet without column pruning. Fix: (1) Partition by date and filter on partition columns. (2) SELECT only needed columns. (3) Convert CSV to Parquet. (4) Use CTAS to create partitioned summary tables. (5) Set data_scanned_cutoff_per_query workgroup limit. Typical reduction: 10-100x.' },
          { question: 'S3 costs exploding on a data lake?', answer: 'Usually three causes: (1) Too many small files — S3 charges per request, and Parquet metadata overhead blows up. Compact to 128MB+ files. (2) Storage class not tuned — use Intelligent-Tiering for ambiguous access. (3) Old raw data never deleted — add lifecycle rules: raw → Glacier at 90d, delete at 365d. (4) Cross-region reads charge $0.02/GB — keep compute in same region as data.' },
          { question: 'Lambda + S3 event storm?', answer: 'S3 events can fan out to Lambda at huge volume when uploading many files. Mitigate: (1) Use SQS between S3 and Lambda for batching and backpressure. (2) Set Lambda reserved concurrency to cap parallelism. (3) Use S3 event batching (batch size, window). (4) For ETL, prefer EventBridge Scheduler + Glue job over per-file Lambda.' },
        ],
      },
    ],
    faqs: [
      { question: 'When should I use Glue vs EMR vs Lambda for ETL?', answer: 'Lambda: < 15 min runtime, < 10GB memory, event-driven (S3 trigger, API). Glue ETL: serverless Spark, no cluster management, best for scheduled ETL with moderate data. EMR Serverless: larger/longer Spark jobs, more tuning control, needs custom libraries or specific Spark versions. EMR on EC2: full control, long-running clusters, best for continuous streaming or Hadoop ecosystem (HBase, Presto).' },
      { question: 'Athena vs Redshift Spectrum vs Snowflake on AWS?', answer: 'Athena: serverless, $5/TB scanned, best for ad-hoc queries on S3. Redshift Spectrum: query S3 from Redshift, same pricing, integrates with Redshift tables. Snowflake on AWS: separate compute/storage, auto-clustering, result cache, best performance and governance but higher per-query cost. Pick Athena for infrequent ad-hoc, Snowflake for production analytics with BI tools, Spectrum if already on Redshift.' },
      { question: 'How do I secure data in an S3 data lake?', answer: 'Layer defenses: (1) Bucket policies + IAM least-privilege roles. (2) Block all public access at account level. (3) Default encryption SSE-KMS with customer-managed keys. (4) Enable CloudTrail + S3 Access Logs + GuardDuty S3 protection. (5) Use Lake Formation for column/row-level access control on Glue Catalog. (6) VPC endpoints so traffic never leaves AWS network. (7) Rotate IAM keys, prefer IAM Roles over keys.' },
      { question: 'How should I orchestrate AWS ETL — Step Functions, Airflow, or Glue Workflows?', answer: 'Step Functions: best for pure AWS-service orchestration (Glue + Lambda + SNS), cheapest, no infra to manage. MWAA (managed Airflow): best for complex DAGs, cross-cloud, rich operator ecosystem, but costs $300-1000/mo baseline. Glue Workflows: tight integration with Glue jobs but limited outside Glue. Use Step Functions for simple-to-medium pipelines, MWAA when you need cross-cloud or dbt Cloud integration.' },
      { question: 'Kinesis Data Streams vs MSK vs SQS?', answer: 'Kinesis Data Streams: AWS-native, shard-based, auto-scaling variant available, simpler ops. MSK: managed Kafka, open protocol, best if you have existing Kafka ecosystem (Kafka Connect, ksqlDB, Schema Registry). SQS: queue not stream, no ordering across partitions, no replay, best for task queues not analytics. Pick Kinesis for new AWS-native streaming, MSK for Kafka compatibility, SQS only for work queues.' },
      { question: 'What is the minimum IAM setup for an AWS data engineer?', answer: 'Use IAM Identity Center (SSO), no long-lived access keys. Federate via your IdP (Okta, Azure AD). Create permission sets per role: DataEngineer (read all raw, write curated, Glue/Athena), DataScientist (read curated only), Admin (separate MFA-required role). Attach service-linked roles to Glue/Lambda/Step Functions. Use AWS Config + IAM Access Analyzer to flag overly-permissive policies.' },
      { question: 'How do I move data from AWS to Snowflake efficiently?', answer: 'Best pattern: land data in S3 as Parquet → Snowflake external stage → Snowpipe auto-ingest on S3 event. For streaming: use Snowflake Kafka Connector in Snowpipe Streaming mode (sub-10s latency). Avoid pushing via Python loops on a single machine — slow and expensive. For migrations of over 1TB, use Snowflake COPY INTO with MAX_FILE_SIZE tuned and a well-sized warehouse.' },
    ],
    relatedSlugs: ['azure-for-data-engineers', 'databricks', 'python-for-data-engineers', 'airflow-essentials'],
    relatedArticles: ['/articles/data-engineer-roadmap-2025', '/articles/snowflake-cortex-code-dbt-optimization-guide'],
  },

  // ────────────────────────────────────────────
  // 28. Azure for Data Engineers Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'azure-for-data-engineers',
    title: 'Azure for Data Engineers Cheat Sheet',
    shortDescription: 'Key Azure services for data engineering: ADLS Gen2, Data Factory, Synapse, Databricks, Functions, Purview, and common architecture patterns.',
    category: 'cloud',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'Core Azure Services for Data',
        type: 'table',
        columns: ['Service', 'Purpose', 'Closest AWS Equivalent'],
        items: [
          ['ADLS Gen2', 'Data lake storage with hierarchical namespace', 'S3'],
          ['Azure Data Factory (ADF)', 'Managed ETL/ELT orchestration', 'Glue + Step Functions'],
          ['Synapse Analytics', 'MPP data warehouse + Spark pools + serverless SQL', 'Redshift + EMR + Athena'],
          ['Azure Databricks', 'Managed Spark / Delta Lake', 'EMR / Databricks on AWS'],
          ['Microsoft Fabric', 'Unified SaaS data platform (OneLake + Spark + Warehouse)', 'no direct equivalent'],
          ['Event Hubs', 'Managed Kafka-compatible streaming', 'Kinesis / MSK'],
          ['Functions', 'Serverless code triggers', 'Lambda'],
          ['Cosmos DB', 'Multi-model NoSQL with global distribution', 'DynamoDB'],
          ['Purview', 'Data governance, lineage, catalog', 'Lake Formation + Glue Catalog'],
          ['Key Vault', 'Secrets / keys / certs', 'Secrets Manager + KMS'],
          ['Entra ID (AAD)', 'Identity provider', 'IAM Identity Center'],
        ],
      },
      {
        title: 'ADLS Gen2 Zones & Partitioning',
        type: 'tips',
        items: [
          'Enable hierarchical namespace at storage-account creation — cannot be added later; required for ACLs and Spark perf',
          'Zone layout: landing/ → raw/ → curated/ → consumption/ — immutable promotion between zones',
          'Partition Parquet by date (year=/month=/day=) first; low-cardinality filters (country) second',
          'Use ABFS driver (abfss://container@account.dfs.core.windows.net/path) in Spark — not WASB (legacy)',
          'Set lifecycle policies: move to Cool at 30 days, Archive at 180 days, delete raw at 365 days',
          'Use ADLS ACLs (POSIX-style) for fine-grained access; RBAC for container-level access',
          'Enable soft delete + versioning on critical containers for accidental-delete protection',
          'Enable diagnostic logs to Log Analytics for access auditing; integrate with Defender for Storage',
          'Use private endpoints + firewall rules — never leave storage accounts publicly accessible',
          'For cross-region DR, use RA-GZRS replication + geo-redundant backup jobs',
        ],
      },
      {
        title: 'ADF Pipeline — Copy + Transform Pattern',
        type: 'code',
        language: 'json',
        code: `{
  "name": "pl_orders_daily",
  "properties": {
    "parameters": { "runDate": { "type": "String" } },
    "activities": [
      {
        "name": "Copy_OnPrem_to_Raw",
        "type": "Copy",
        "inputs": [{ "referenceName": "ds_onprem_orders", "type": "DatasetReference" }],
        "outputs": [{ "referenceName": "ds_raw_orders", "type": "DatasetReference",
          "parameters": { "dt": "@pipeline().parameters.runDate" } }],
        "typeProperties": {
          "source": { "type": "SqlServerSource",
            "sqlReaderQuery": "SELECT * FROM dbo.orders WHERE updated_at >= '@{pipeline().parameters.runDate}'" },
          "sink": { "type": "ParquetSink" },
          "enableStaging": true
        },
        "policy": { "retry": 3, "retryIntervalInSeconds": 30, "timeout": "02:00:00" }
      },
      {
        "name": "Transform_with_Databricks",
        "type": "DatabricksNotebook",
        "dependsOn": [{ "activity": "Copy_OnPrem_to_Raw", "dependencyConditions": ["Succeeded"] }],
        "typeProperties": {
          "notebookPath": "/etl/transform_orders",
          "baseParameters": { "run_date": "@pipeline().parameters.runDate" }
        },
        "linkedServiceName": { "referenceName": "ls_databricks", "type": "LinkedServiceReference" }
      }
    ]
  }
}`,
      },
      {
        title: 'Synapse Serverless SQL Patterns',
        type: 'code',
        language: 'sql',
        code: `-- Query Parquet directly from ADLS (no ingestion)
SELECT
    country,
    SUM(amount) AS revenue,
    COUNT(*) AS orders
FROM OPENROWSET(
    BULK 'https://acct.dfs.core.windows.net/curated/orders/year=2026/**',
    FORMAT = 'PARQUET'
) AS rows
GROUP BY country;

-- Create an external table on the Data Catalog
CREATE EXTERNAL TABLE dbo.orders (
    order_id BIGINT,
    customer_id BIGINT,
    amount DECIMAL(12,2),
    order_date DATE
)
WITH (
    LOCATION = 'curated/orders/',
    DATA_SOURCE = ds_curated,
    FILE_FORMAT = ff_parquet
);

-- Use CETAS to materialize aggregates (fast future reads)
CREATE EXTERNAL TABLE dbo.orders_monthly
WITH (LOCATION='curated/summary/orders_monthly/', FILE_FORMAT=ff_parquet, DATA_SOURCE=ds_curated)
AS
SELECT order_month, country, SUM(amount) AS revenue
FROM dbo.orders
GROUP BY order_month, country;`,
      },
      {
        title: 'Azure vs Snowflake on Azure',
        type: 'qna',
        items: [
          { question: 'Should I use Synapse dedicated pools or Snowflake on Azure?', answer: 'Snowflake on Azure typically wins on: (1) Per-second billing and auto-suspend (Synapse dedicated pools bill 24x7 while paused, and pause takes 30+ min). (2) Instant warehouse resize, zero-copy clones, time travel. (3) Broader BI ecosystem. Synapse wins on: (1) Tight integration with ADF, Power BI Premium, Purview out of the box. (2) Reserved capacity discounts when fully utilized. (3) No cross-cloud egress if your estate is 100% Azure. In 2026, most teams pick Snowflake on Azure for analytics and use Synapse Pipelines/Serverless for orchestration + ad-hoc.' },
          { question: 'Fabric OneLake vs Databricks Unity Catalog vs Snowflake Horizon?', answer: 'OneLake: SaaS data lake tied to Fabric, auto-creates shortcut views across workspaces, good for Microsoft-centric orgs. Unity Catalog: Databricks governance across clouds, strong on Delta tables, lineage, fine-grained access. Snowflake Horizon: built into Snowflake, unifies governance + quality + discovery, plus data sharing marketplace. Pick by where your primary workloads run: Fabric if all-Microsoft, UC if Databricks-primary, Horizon if Snowflake-primary.' },
          { question: 'When use Data Factory vs Synapse Pipelines vs Fabric Data Pipelines?', answer: 'They are the same engine under different brandings. ADF: standalone, most mature, wider connector set. Synapse Pipelines: ADF embedded in Synapse workspace. Fabric Data Pipelines: ADF embedded in Fabric. Pick by where the rest of your stack lives — avoid mixing. For pure pipeline features (triggers, copy, data flows, orchestration) they are equivalent.' },
        ],
      },
      {
        title: 'Security & Governance Baseline',
        type: 'tips',
        items: [
          'Use Managed Identity everywhere — never store connection strings or keys in pipelines',
          'Enable private endpoints for ADLS, Synapse, Databricks — no public internet traffic',
          'Store secrets in Key Vault, reference via Linked Services in ADF/Synapse',
          'Enable Defender for Cloud (Storage + SQL + Open-source databases)',
          'Configure Purview scans on ADLS + Synapse + Databricks for lineage and classification',
          'Enforce RBAC via Entra ID groups, not individual users',
          'Enable diagnostic logs to Log Analytics + Sentinel for security monitoring',
          'For cross-region DR use geo-redundant storage + paired regions + tested runbooks',
        ],
      },
    ],
    faqs: [
      { question: 'How is Microsoft Fabric different from Synapse and ADF?', answer: 'Fabric is the unified SaaS successor: OneLake (data lake) + Data Factory (pipelines) + Synapse (warehouse + Spark + real-time) + Power BI, all on a shared capacity-based SKU. Synapse and ADF continue to exist for customers who need PaaS control (VNet injection, specific SKUs). Rule of thumb: Fabric for greenfield Microsoft-centric analytics, Synapse/ADF when you need fine-grained networking/compute control or integration with non-Microsoft tools.' },
      { question: 'ADLS Gen2 vs Gen1 vs Blob Storage?', answer: 'Gen1 is deprecated (migrate by Feb 2024 deadline passed). Blob Storage is the underlying object store — cheap, flat namespace, no ACLs. ADLS Gen2 is Blob Storage with hierarchical namespace enabled — adds directories, ACLs, much better Spark/Hadoop performance. Always use Gen2 for data lakes. Hierarchical namespace must be enabled at account creation (cannot be added later).' },
      { question: 'Databricks on Azure vs Azure Synapse Spark Pools?', answer: 'Databricks wins on: Delta Lake, MLflow, Unity Catalog, auto-scaling, broader Spark feature set, Photon engine. Synapse Spark wins on: integration with Synapse SQL (single workspace), no separate billing, included in Synapse capacity. Most serious Spark teams pick Databricks; Synapse Spark is fine for light integration scenarios already in Synapse.' },
      { question: 'How do I ingest streaming data into Azure?', answer: 'Options: (1) Event Hubs + Stream Analytics for SQL-like stream processing with ADLS sink. (2) Event Hubs + Databricks Structured Streaming for complex streams into Delta Lake. (3) Event Hubs Kafka surface + Snowflake Kafka connector (Snowpipe Streaming) for sub-10s ingestion into Snowflake. (4) IoT Hub for device telemetry, routes to Event Hubs. Pick based on destination and processing complexity.' },
      { question: 'What is the right orchestration tool on Azure?', answer: 'ADF / Synapse Pipelines for most data ETL — cheap, no infra, rich connectors. Azure Data Factory managed Airflow for teams needing Airflow DAGs (dbt Cloud, cross-cloud, complex Python). Logic Apps for business process flows (approvals, emails, SaaS connectors). Azure Functions Durable for lightweight workflows. Use ADF as the default and only move to Airflow when you have existing DAGs or need Python-heavy orchestration.' },
      { question: 'How do I set up least-privilege for an Azure data lake?', answer: 'Layer: (1) RBAC at the storage account / container: Storage Blob Data Reader / Contributor. (2) ACLs on specific paths for finer control. (3) Entra ID groups (never individual users). (4) Managed Identity for services (ADF, Databricks, Synapse) — never shared keys. (5) Azure Policy to prevent creation of public containers. (6) Defender for Storage to detect anomalies. Purview for auto-classification.' },
      { question: 'Can I use Snowflake with Azure efficiently?', answer: 'Yes — Snowflake runs natively on Azure regions. Pattern: ADLS as landing zone → Snowflake external stage (Azure SAS or managed identity) → Snowpipe for auto-ingest → dbt or Streams/Tasks for transformation. Use Entra ID federation so Snowflake logins use the same identities as Azure. Private Link between ADF and Snowflake avoids public egress charges.' },
    ],
    relatedSlugs: ['aws-for-data-engineers', 'databricks', 'python-for-data-engineers', 'airflow-essentials'],
    relatedArticles: ['/articles/data-engineer-roadmap-2025', '/articles/snowflake-cortex-code-dbt-optimization-guide'],
  },

  // ────────────────────────────────────────────
  // 29. Databricks SQL & Workflows Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'databricks',
    title: 'Databricks SQL & Workflows Cheat Sheet',
    shortDescription: 'Databricks essentials: Delta Lake, Unity Catalog, SQL warehouses, workflows, Auto Loader, and performance tuning. Includes comparisons to Snowflake.',
    category: 'cloud',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'Delta Lake Essentials',
        type: 'code',
        language: 'sql',
        code: `-- Create managed Delta table (Unity Catalog)
CREATE TABLE main.sales.orders (
  order_id BIGINT,
  customer_id BIGINT,
  amount DECIMAL(12,2),
  order_date DATE
)
USING DELTA
PARTITIONED BY (order_date);

-- MERGE (upsert)
MERGE INTO main.sales.orders t
USING staging.orders_new s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- Time travel — query data as of a timestamp or version
SELECT * FROM main.sales.orders TIMESTAMP AS OF '2026-04-01T00:00:00';
SELECT * FROM main.sales.orders VERSION AS OF 42;

-- Compact small files
OPTIMIZE main.sales.orders;

-- Z-ORDER for multi-column filter pruning
OPTIMIZE main.sales.orders ZORDER BY (customer_id, product_id);

-- Vacuum old files (default 7-day retention)
VACUUM main.sales.orders RETAIN 168 HOURS;

-- Change Data Feed (CDC output)
ALTER TABLE main.sales.orders SET TBLPROPERTIES (delta.enableChangeDataFeed = true);
SELECT * FROM table_changes('main.sales.orders', 42);`,
      },
      {
        title: 'Unity Catalog Access Model',
        type: 'table',
        columns: ['Level', 'Grant Example', 'Use Case'],
        items: [
          ['Metastore', 'GRANT CREATE CATALOG ON METASTORE TO `admins`', 'Account-level admin'],
          ['Catalog', 'GRANT USE CATALOG ON CATALOG main TO `analysts`', 'Business domain isolation'],
          ['Schema', 'GRANT USE SCHEMA ON SCHEMA main.sales TO `sales_team`', 'Team boundary'],
          ['Table', 'GRANT SELECT ON TABLE main.sales.orders TO `analysts`', 'Standard table access'],
          ['Column', 'Dynamic views or column masks', 'Column-level PII protection'],
          ['Row', 'Row filter function (similar to RLS)', 'Multi-tenant data isolation'],
          ['Volume', 'GRANT READ VOLUME ON VOLUME main.raw.landing TO `etl_role`', 'Access to files in ADLS/S3'],
        ],
      },
      {
        title: 'Auto Loader — Incremental File Ingestion',
        type: 'code',
        language: 'python',
        code: `from pyspark.sql.functions import col

stream = (
    spark.readStream.format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", "/_schemas/orders")
    .option("cloudFiles.inferColumnTypes", "true")
    .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
    .load("abfss://raw@acct.dfs.core.windows.net/orders/")
)

clean = (
    stream
    .filter(col("amount") > 0)
    .withColumn("ingest_ts", F.current_timestamp())
)

query = (
    clean.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "/_checkpoints/orders")
    .option("mergeSchema", "true")
    .trigger(availableNow=True)  # process all new files, then stop
    .toTable("main.sales.orders")
)
query.awaitTermination()`,
      },
      {
        title: 'SQL Warehouse Sizing & Tuning',
        type: 'tips',
        items: [
          'Use Serverless SQL Warehouses for BI dashboards — sub-10s startup, auto-scale, no cluster management',
          'Size by concurrent query count: 2XS handles ~10 concurrent light queries; M handles ~25; L handles ~50+',
          'Enable Photon — vectorized query engine, 2-8x faster on SQL workloads',
          'Enable multi-cluster load balancing: min=1, max=3 so spikes scale without over-provisioning',
          'Auto-stop after 10-15 min idle for BI; 5 min for ad-hoc warehouses',
          'Use Query History tab to find slow queries; Query Profile shows which stage is the bottleneck',
          'Result cache is per-warehouse; disk cache (SSD) speeds repeated scans of the same Delta files',
          'For ETL, prefer Jobs compute (Spark clusters) over SQL Warehouses — cheaper for long batch work',
          'OPTIMIZE + ZORDER weekly on large tables improves pruning 5-20x',
          'Monitor Lakeview dashboards or system.query.history table for cost attribution',
        ],
      },
      {
        title: 'Databricks Workflows (Jobs)',
        type: 'code',
        language: 'json',
        code: `{
  "name": "orders_daily_etl",
  "tasks": [
    {
      "task_key": "bronze_ingest",
      "notebook_task": { "notebook_path": "/etl/bronze_orders" },
      "job_cluster_key": "main_cluster"
    },
    {
      "task_key": "silver_clean",
      "depends_on": [{ "task_key": "bronze_ingest" }],
      "notebook_task": { "notebook_path": "/etl/silver_orders" },
      "job_cluster_key": "main_cluster"
    },
    {
      "task_key": "gold_aggregate",
      "depends_on": [{ "task_key": "silver_clean" }],
      "sql_task": {
        "query": { "query_id": "abc-123" },
        "warehouse_id": "xyz-456"
      }
    }
  ],
  "job_clusters": [{
    "job_cluster_key": "main_cluster",
    "new_cluster": {
      "spark_version": "15.4.x-scala2.12",
      "node_type_id": "Standard_DS3_v2",
      "num_workers": 4,
      "runtime_engine": "PHOTON"
    }
  }],
  "schedule": { "quartz_cron_expression": "0 0 6 * * ?", "timezone_id": "UTC" },
  "email_notifications": { "on_failure": ["oncall@example.com"] }
}`,
      },
      {
        title: 'Databricks vs Snowflake — When to Pick Each',
        type: 'qna',
        items: [
          { question: 'Databricks vs Snowflake for a new analytics platform?', answer: 'Snowflake wins when: workload is SQL-heavy (BI, dashboards, ELT), team is SQL-first, governance/security is top priority, data sharing is important, you want zero infrastructure to manage. Databricks wins when: workload is Spark/ML-heavy, you need open table formats across engines (Delta + Iceberg), you have large unstructured data (images, logs), data science and ML are core. Many teams use both: Databricks for ML + ingestion, Snowflake for analytics + BI, sharing Iceberg tables between them.' },
          { question: 'Delta Lake vs Iceberg vs Snowflake native tables?', answer: 'Delta Lake: best on Databricks, strong Spark integration, CDF, Liquid Clustering. Iceberg: open standard, multi-engine (Snowflake, Spark, Trino, Flink), best for cross-tool portability. Snowflake native: auto-clustering, time travel, fastest in Snowflake. Databricks now also reads/writes Iceberg via UniForm. Pick Iceberg for maximum portability, Delta for Databricks-first, native Snowflake for Snowflake-first.' },
          { question: 'Photon vs classic Databricks runtime?', answer: 'Photon is a C++ vectorized query engine that replaces parts of Spark SQL execution. 2-8x faster on SQL/DataFrame workloads, same API. Costs 2x DBU (not 2x dollars — typically ~20% net cheaper due to speedup). Enable on SQL warehouses (default) and job clusters running heavy SQL. Skip on pure ML/UDF workloads where Photon does not apply.' },
          { question: 'Serverless SQL warehouse vs classic SQL warehouse vs Jobs cluster?', answer: 'Serverless SQL: sub-10s startup, fully managed by Databricks, best for BI. Classic SQL: runs in your cloud account VPC, longer startup, needed for VNet injection or private workloads. Jobs cluster: general Spark cluster for ETL notebooks/jars — cheapest for long batch runs. Use Serverless SQL for dashboards, Jobs for ETL, Classic only when compliance requires your VPC.' },
        ],
      },
    ],
    faqs: [
      { question: 'How do I compact small files in Delta Lake?', answer: 'Run OPTIMIZE table_name to combine files into ~1GB targets. Add ZORDER BY (col1, col2) to co-locate by frequent filter columns. Enable auto-compaction at write time: ALTER TABLE t SET TBLPROPERTIES (delta.autoOptimize.autoCompact = true, delta.autoOptimize.optimizeWrite = true). In 2026 most teams use Liquid Clustering (CLUSTER BY) which removes the need for manual OPTIMIZE/ZORDER.' },
      { question: 'What is the difference between managed and external tables in Unity Catalog?', answer: 'Managed tables: Databricks owns the storage location, DROP TABLE deletes data. External tables: point to a user-provided path (abfss://, s3://), DROP TABLE keeps data. Managed is simpler and recommended unless you share the same files with other engines (Synapse, Snowflake, Trino) — then use external. External tables require a EXTERNAL LOCATION + storage credential in Unity Catalog.' },
      { question: 'Databricks Delta Live Tables (DLT) — when should I use it?', answer: 'DLT is declarative pipeline framework: you define transformations, DLT manages dependency order, retries, expectations (data quality), and incremental refresh. Use DLT when: you have Spark streaming or incremental pipelines, you want built-in data quality tests (EXPECT clauses), you value less boilerplate. Skip DLT when: your pipelines are pure SQL on Delta (plain workflows are cheaper), your team already uses dbt (DLT and dbt overlap).' },
      { question: 'How does Databricks cost work — DBUs vs compute?', answer: 'You pay two things: (1) DBUs (Databricks Units) — billed per second based on cluster type + size + features (Photon doubles DBU rate). (2) Cloud compute — underlying VM cost from AWS/Azure/GCP. Serverless flips this: Databricks bundles DBUs + compute into one rate. Typical: a DS3_v2 worker with Photon on Jobs compute runs ~$1-1.50/hour all-in. Rule: use Jobs compute for ETL (cheapest), Serverless SQL for BI (most productive), avoid all-purpose clusters for production (most expensive).' },
      { question: 'How do I connect Databricks to Snowflake?', answer: 'Use the snowflake-spark connector: spark.read.format("snowflake").option(...).load("SELECT * FROM t"). Authenticate via OAuth or key-pair (never plain passwords). For bulk reads, use COPY UNLOAD to S3/ADLS and read Parquet — faster than JDBC. For bidirectional sharing, use Iceberg catalog-linked databases so both engines see the same tables.' },
      { question: 'Should I use Databricks Workflows or Airflow?', answer: 'Workflows: built-in, native integration, cheaper for Databricks-only pipelines, supports task values, retries, conditional logic. Airflow: best when orchestrating across systems (dbt Cloud + Databricks + Snowflake + external APIs), mature alerting, rich operators. Rule: start with Workflows for Databricks-native pipelines; move to Airflow (or MWAA/Astronomer) once you orchestrate 3+ systems.' },
      { question: 'How do I optimize slow Databricks SQL queries?', answer: 'Checklist: (1) Query Profile — find the slowest stage, check for full file scans. (2) OPTIMIZE + ZORDER on the largest filtered columns. (3) Enable Photon if not already. (4) Check predicate pushdown — column stats may be stale; run ANALYZE TABLE t COMPUTE STATISTICS. (5) Use broadcast hints for small dims. (6) Enable result cache. (7) For repeated scans, use Disk Cache (delta.enable.disk-cache=true).' },
    ],
    relatedSlugs: ['pyspark', 'aws-for-data-engineers', 'azure-for-data-engineers', 'snowflake-best-practices'],
    relatedArticles: ['/articles/snowflake-cortex-code-dbt-optimization-guide', '/articles/data-engineer-roadmap-2025'],
  },

  // ────────────────────────────────────────────
  // 30. Data Modeling / Dimensional Modeling Cheat Sheet
  // ────────────────────────────────────────────
  {
    slug: 'data-modeling',
    title: 'Data Modeling Cheat Sheet — Dimensional, SCD, Data Vault',
    shortDescription: 'Dimensional modeling, star vs snowflake schema, SCD Types 1/2/3/4, Data Vault 2.0, One Big Table, and choosing the right model for your warehouse.',
    category: 'architecture',
    difficulty: 'Intermediate',
    lastUpdated: '2026-04-16',
    sections: [
      {
        title: 'Modeling Approaches Compared',
        type: 'table',
        columns: ['Approach', 'Best For', 'Key Downside'],
        items: [
          ['Star Schema (Kimball)', 'BI / reporting, dashboards', 'Slower to evolve when sources change'],
          ['Snowflake Schema', 'Normalized dims save storage', 'More joins, slower queries'],
          ['Data Vault 2.0', 'Enterprise DW with many sources, auditability', 'Verbose, hard for BI without a mart on top'],
          ['3NF / Inmon', 'Atomic enterprise DW, then build marts', 'Heavy upfront design, slow to deliver'],
          ['One Big Table (OBT)', 'Columnar warehouses (Snowflake, BigQuery), simple dashboards', 'Wide tables, duplicated dim data'],
          ['Activity Schema', 'Product analytics, event-driven orgs', 'Few BI tools natively support it'],
          ['Medallion (Bronze/Silver/Gold)', 'Databricks lakehouse layering', 'Orthogonal to modeling — not a replacement'],
        ],
      },
      {
        title: 'Star Schema Example (Kimball)',
        type: 'code',
        language: 'sql',
        code: `-- Fact table: grain = one row per order line item
CREATE TABLE fct_order_lines (
  order_line_id   BIGINT PRIMARY KEY,
  order_id        BIGINT,
  order_date_key  INT        REFERENCES dim_date(date_key),
  customer_key    BIGINT     REFERENCES dim_customer(customer_key),
  product_key     BIGINT     REFERENCES dim_product(product_key),
  store_key       BIGINT     REFERENCES dim_store(store_key),
  quantity        INT,
  unit_price      DECIMAL(10,2),
  line_amount     DECIMAL(12,2),
  discount_amount DECIMAL(12,2)
);

-- Conformed dimension (SCD Type 2)
CREATE TABLE dim_customer (
  customer_key    BIGINT PRIMARY KEY,        -- surrogate
  customer_id     BIGINT,                    -- natural / business
  full_name       VARCHAR,
  email           VARCHAR,
  country         VARCHAR,
  tier            VARCHAR,
  effective_from  DATE,
  effective_to    DATE,                      -- NULL or 9999-12-31 for current
  is_current      BOOLEAN
);

-- Date dimension (build once, reuse across all facts)
CREATE TABLE dim_date (
  date_key    INT PRIMARY KEY,  -- YYYYMMDD
  full_date   DATE,
  day_of_week INT,
  month_num   INT,
  month_name  VARCHAR,
  quarter     INT,
  year        INT,
  is_weekend  BOOLEAN,
  is_holiday  BOOLEAN
);`,
      },
      {
        title: 'Slowly Changing Dimensions (SCD) Types',
        type: 'table',
        columns: ['Type', 'Behavior', 'When to Use'],
        items: [
          ['Type 0', 'Never change (insert-only or frozen)', 'Birth date, original signup source'],
          ['Type 1', 'Overwrite — lose history', 'Typos, corrections, non-analytical attributes'],
          ['Type 2', 'New row per change with effective dates + is_current flag', 'History matters (customer tier changes, address changes)'],
          ['Type 3', 'Previous value stored in extra column', 'Track exactly 1 prior value (rare)'],
          ['Type 4', 'Current row in main table, history in separate table', 'Hot/cold split when history is huge'],
          ['Type 6 (1+2+3)', 'Hybrid: overwrite for corrections + versioning for real changes', 'Complex CRM data'],
        ],
      },
      {
        title: 'SCD Type 2 MERGE (Snowflake / dbt-style)',
        type: 'code',
        language: 'sql',
        code: `-- Close current row when any tracked attribute changes
MERGE INTO dim_customer d
USING (
  SELECT
    s.customer_id, s.full_name, s.email, s.country, s.tier,
    CURRENT_DATE() AS load_date
  FROM staging.customers s
) s
ON d.customer_id = s.customer_id AND d.is_current = TRUE
WHEN MATCHED AND (
    d.full_name <> s.full_name OR
    d.email    <> s.email    OR
    d.country  <> s.country  OR
    d.tier     <> s.tier
) THEN UPDATE SET
    d.effective_to = s.load_date - 1,
    d.is_current  = FALSE;

-- Insert new current version (and brand-new customers)
INSERT INTO dim_customer (
  customer_key, customer_id, full_name, email, country, tier,
  effective_from, effective_to, is_current
)
SELECT
  dim_customer_seq.NEXTVAL,
  s.customer_id, s.full_name, s.email, s.country, s.tier,
  CURRENT_DATE(), DATE '9999-12-31', TRUE
FROM staging.customers s
LEFT JOIN dim_customer d
  ON d.customer_id = s.customer_id AND d.is_current = TRUE
WHERE d.customer_id IS NULL
   OR (d.full_name <> s.full_name OR d.email <> s.email
       OR d.country <> s.country  OR d.tier  <> s.tier);`,
      },
      {
        title: 'Modeling Rules That Save You Later',
        type: 'tips',
        items: [
          'Always define the grain of a fact in one sentence before writing DDL — "one row per order line per day"',
          'Use surrogate keys (BIGINT sequences) on dimensions — never foreign-key to a natural key that can change',
          'Conform dimensions across facts — dim_customer used by fct_orders AND fct_support should be the same table',
          'Never join fact to fact — always go through a dimension (or create a bridge table)',
          'Degenerate dimensions (order_id on fct_order_lines) are fine — not every attribute needs a dim table',
          'Store additive measures in facts (quantity, amount); derive ratios in the BI layer',
          'Use dim_date and dim_time_of_day — never compute date parts in ad-hoc queries',
          'Junk dimensions group unrelated flags (is_return, payment_type) — keeps fact table narrow',
          'For Data Vault, Hubs hold business keys, Links capture relationships, Satellites store attributes with load_date',
          'On columnar warehouses (Snowflake/BigQuery), consider OBT (denormalized wide table) for simple dashboards — joins are cheap but wide scans are cheaper',
        ],
      },
      {
        title: 'Common Interview Q&A',
        type: 'qna',
        items: [
          { question: 'When would you pick star schema over One Big Table on Snowflake?', answer: 'Star schema wins when: (1) Dimensions have rich attributes used across many facts — reuse saves storage and ensures consistency. (2) Dimensions change (SCD Type 2) — updating one row in a dim is cheaper than updating millions of fact rows. (3) BI tool expects star (many dashboards auto-join on dims). OBT wins when: (1) Single fact, shallow analytics. (2) Aggressive denormalization for fastest dashboard scans. (3) Team is small and schema evolution is infrequent. Many teams use star for core and OBT for specific high-volume dashboards.' },
          { question: 'How do you design for late-arriving facts?', answer: 'Late-arriving fact scenario: order row arrives after the customer dim has been updated to a newer version. Options: (1) Use is_current + effective dates on dim: look up the dim row whose effective_from/to range covers the fact event_date. (2) Store the snapshot date on the fact and always join on business key + date range (slower but accurate). (3) Accept "as-is at load time" if business is OK with that. In dbt, a macro like scd_join(fact.event_date, dim, business_key) encapsulates the range lookup.' },
          { question: 'How is Data Vault different from Kimball and when do you use it?', answer: 'Data Vault 2.0 separates keys (Hubs), relationships (Links), and descriptive data (Satellites). Advantages: append-only (easy audit), agile (add sources without redesign), parallel loading. Disadvantages: 3-5x more tables than Kimball, not query-friendly — you always build a Kimball star on top for BI. Use Data Vault for: enterprise warehouses with 50+ sources, regulated industries needing full auditability, teams with dedicated modelers. Skip for small-to-mid analytics where Kimball ships faster.' },
          { question: 'Explain additive, semi-additive, and non-additive facts.', answer: 'Additive: can be summed across all dimensions (revenue, quantity). Semi-additive: summable across some dimensions, not time (account balance — sum across customers at a point in time, but not across days). Non-additive: never summable (unit price, ratios, percentages). Implication: semi-additive needs period-ending snapshots (fct_balance_daily), non-additive should be derived at query time, not stored pre-aggregated.' },
        ],
      },
    ],
    faqs: [
      { question: 'Is dimensional modeling still relevant in 2026?', answer: 'Yes — even with columnar warehouses (Snowflake, BigQuery, Databricks SQL) where joins are cheap, dimensional modeling remains the clearest way to structure analytics. What has changed: you can denormalize more aggressively (OBT for simple cases), skip snowflake schemas (storage is cheap), and use column-level lineage tools. The core idea — facts at a clear grain + conformed dimensions — still prevents the BI chaos that plagues ad-hoc schemas.' },
      { question: 'What is the Medallion architecture and how does it relate to Kimball?', answer: 'Medallion (Bronze → Silver → Gold) is a lakehouse LAYERING pattern, not a modeling approach. Bronze = raw, Silver = cleaned/joined, Gold = business-ready. You still need a modeling approach inside Gold — typically Kimball star schema or OBT. Think of Medallion as the zones (promotion stages) and Kimball as what you model within the Gold zone.' },
      { question: 'SCD Type 2 vs snapshots — which should I use?', answer: 'SCD Type 2: one row per version with effective_from/to. Efficient storage (only writes on change), needs careful joins on date ranges. Snapshots: one row per entity per day (or week). Simpler joins (dim_customer_20260415), but 365x storage for a daily snapshot. Use SCD Type 2 for large dims (millions of rows) and snapshots for small, high-change-rate dims where simplicity matters. dbt snapshots generate SCD Type 2 automatically.' },
      { question: 'How do surrogate keys help and when can I skip them?', answer: 'Surrogate keys (auto-increment integers) insulate dims from source-system changes. Benefits: (1) Stable across source re-keyings. (2) Smaller joins than long natural keys (UUID strings). (3) Allow SCD Type 2 (multiple rows per natural key need a unique surrogate). Skip when: dim is static (dim_date uses YYYYMMDD), performance is fine on natural key, no SCD Type 2 needed. On Snowflake, sequences or IDENTITY columns generate surrogates cheaply.' },
      { question: 'Should I build a data mart per team or one centralized warehouse?', answer: 'Modern answer: one centralized conformed warehouse (shared facts + dims) + team-specific marts on top (team views or small mart schemas). This avoids the silo-per-team anti-pattern where every team rebuilds customer dim differently. dbt project structure supports this: models/core/ (shared) and models/marts/<team>/ (team-specific). Access control via schema-level grants.' },
      { question: 'How do I handle many-to-many relationships in a star schema?', answer: 'Use a bridge table between the fact and the dim. Example: an order can have multiple promotions. Create bridge_order_promotion(order_id, promotion_key, weighting_factor) so aggregations can allocate revenue correctly. Bridges can explode row counts, so always document allocation semantics and test against ungrouped totals.' },
      { question: 'What is a junk dimension and why use one?', answer: 'A junk dimension combines several low-cardinality flags (is_return, payment_type, shipping_method) into one dim with all valid combinations. Keeps fact table narrow (one key vs 3 columns), centralizes flag definitions, and allows adding new attributes without altering the fact. Especially useful when facts are billions of rows.' },
    ],
    relatedSlugs: ['snowflake-sql', 'dbt-commands', 'snowflake-best-practices', 'data-engineering-interview-questions'],
    relatedArticles: ['/articles/structuring-dbt-projects-in-snowflake', '/articles/snowflake-cortex-code-dbt-optimization-guide'],
  },
];

export const getCheatSheetBySlug = (slug) => {
  return cheatsheets.find((cs) => cs.slug === slug);
};

export const getCheatSheetsByCategory = (category) => {
  return cheatsheets.filter((cs) => cs.category === category);
};

export const getRelatedCheatSheets = (slug, limit = 3) => {
  const current = getCheatSheetBySlug(slug);
  if (!current) return [];
  return cheatsheets.filter(
    (cs) => cs.slug !== slug && (current.relatedSlugs?.includes(cs.slug) || cs.category === current.category)
  ).slice(0, limit);
};

export default cheatsheets;
