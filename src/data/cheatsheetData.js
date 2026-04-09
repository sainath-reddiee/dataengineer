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
    relatedSlugs: ['sql-window-functions', 'snowflake-cost-optimization'],
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
    relatedSlugs: ['snowflake-sql', 'airflow-essentials'],
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
    relatedSlugs: ['snowflake-sql', 'snowflake-best-practices', 'sql-interview-questions'],
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
    relatedSlugs: ['snowflake-sql', 'sql-window-functions', 'snowflake-interview-questions'],
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
    relatedSlugs: ['snowflake-interview-questions', 'sql-interview-questions', 'dbt-best-practices'],
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
];

/**
 * Get a cheat sheet by slug
 */
export const getCheatSheetBySlug = (slug) => {
  return cheatsheets.find((cs) => cs.slug === slug) || null;
};

/**
 * Get all cheat sheets for a category
 */
export const getCheatSheetsByCategory = (categoryId) => {
  return cheatsheets.filter((cs) => cs.category === categoryId);
};

/**
 * Get related cheat sheets
 */
export const getRelatedCheatSheets = (slug) => {
  const current = getCheatSheetBySlug(slug);
  if (!current) return [];
  return cheatsheets.filter(
    (cs) => cs.slug !== slug && (current.relatedSlugs?.includes(cs.slug) || cs.category === current.category)
  );
};

export default cheatsheets;
