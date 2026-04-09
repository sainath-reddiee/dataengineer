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
