/**
 * Open editorial slots for guest authors.
 * Keep these specific. Generic “write about Snowflake” pitches
 * produce generic articles.
 */
export const EDITORIAL_BRIEFS = [
  {
    id: 'snowflake-query-profile',
    title: 'A Query Profile that lied about spilling',
    stack: 'Snowflake',
    ask: 'Walk through a real warehouse where Query Profile said one thing and the bill said another. Include warehouse size, bytes spilled, and what you changed.',
    length: '1,800+ words',
  },
  {
    id: 'dbt-ci-failure',
    title: 'The dbt CI check that passed locally and failed in prod',
    stack: 'dbt',
    ask: 'Name the adapter, the test, and the env var that drifted. Show the failing log and the fix you would keep.',
    length: '1,600+ words',
  },
  {
    id: 'airflow-sensor-cost',
    title: 'An Airflow sensor that burned a weekend of compute',
    stack: 'Airflow',
    ask: 'Poke interval, timeout, and the downstream warehouse cost. What would you use instead of a sensor now?',
    length: '1,600+ words',
  },
  {
    id: 'iceberg-compaction',
    title: 'Iceberg compaction that made reads slower',
    stack: 'Snowflake / Spark',
    ask: 'File counts before and after, the compaction setting, and when you rolled it back.',
    length: '1,800+ words',
  },
  {
    id: 'bigquery-slot',
    title: 'A BigQuery slot reservation you should not have bought',
    stack: 'BigQuery',
    ask: 'On-demand vs editions vs reservation. Include a month of spend and the query pattern that broke the model.',
    length: '1,600+ words',
  },
  {
    id: 'interview-story',
    title: 'An interview question you now ask because it showed up on the job',
    stack: 'SQL / system design',
    ask: 'The question, a weak answer, a strong answer, and the production incident that made it worth asking.',
    length: '1,400+ words',
  },
];
