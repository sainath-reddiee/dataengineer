/**
 * Multi-vendor cert map for DataEngineer Hub.
 * Snowflake-deep study still lives at /certification. This hub is the menu.
 */
export const CERT_TRACKS = [
  {
    slug: 'snowpro-core',
    vendor: 'Snowflake',
    title: 'SnowPro Core (COF-C02)',
    examFee: '$175 USD',
    length: '115 minutes · 100 questions',
    blurb:
      'Micro-partitions, caching, RBAC, COPY, Time Travel. The exam rewards people who have loaded data, not people who memorized a PDF domain list.',
    hubTake:
      'Use the cost calculator and Snowflake SQL sheet as labs. Timed quiz on this site is a diagnostic: every miss should become a one-line note in your words.',
    href: '/certification',
    practiceHref: '/practice/snowpro-core',
    sheetHref: '/cheatsheets/snowflake-sql',
  },
  {
    slug: 'snowpro-advanced-de',
    vendor: 'Snowflake',
    title: 'SnowPro Advanced: Data Engineer',
    examFee: '$375 USD',
    length: 'Advanced · performance, pipelines, semi-structured',
    blurb:
      'Streams, tasks, performance, VARIANT. Core is assumed. If you cannot explain clustering credits vs query credits, wait.',
    hubTake:
      'Pair the performance interview sheet with QUERY_HISTORY thinking from the cost literacy course. Do not treat Advanced as more Core trivia.',
    href: '/certification',
    practiceHref: '/practice',
    sheetHref: '/cheatsheets/snowflake-best-practices',
  },
  {
    slug: 'databricks-de',
    vendor: 'Databricks',
    title: 'Databricks Data Engineer Associate',
    examFee: 'See Databricks exam guide',
    length: 'Associate · Spark ELT, Delta, jobs',
    blurb:
      'Delta Lake, jobs vs all-purpose, basic Spark. A badge without DBU math is a sticker.',
    hubTake:
      'Model one nightly job in the Databricks calculator, then sit the Hub quiz. Photon is not a personality.',
    href: '/practice/databricks-de',
    practiceHref: '/practice/databricks-de',
    sheetHref: '/cheatsheets/databricks',
  },
  {
    slug: 'aws-dea',
    vendor: 'AWS',
    title: 'AWS Data Engineer Associate',
    examFee: 'See AWS certification',
    length: 'Associate · Glue, Redshift, pipelines on AWS',
    blurb:
      'The posting that lists Glue, Redshift, and Lake Formation in one breath. Breadth exam; Hub coverage is the AWS-for-DE sheet plus the practice quiz.',
    hubTake:
      'Do not study AWS in the abstract. Map each service to a failure mode: Glue job bookmark vs a full reload, Redshift WLM vs a runaway explore.',
    href: '/practice/aws-de-associate',
    practiceHref: '/practice/aws-de-associate',
    sheetHref: '/cheatsheets/aws-for-data-engineers',
  },
  {
    slug: 'dbt',
    vendor: 'dbt Labs',
    title: 'dbt Analytics Engineer (and the job)',
    examFee: 'Varies by dbt Labs offering',
    length: 'Project grain, tests, docs, exposures',
    blurb:
      'The credential matters less than whether you can name a grain and write a test that fails on fanout. That is the Hub course.',
    hubTake:
      'schema.yml generator + dbt commands sheet + grain interview question. If you pass those, the exam is vocabulary.',
    href: '/courses',
    practiceHref: '/cheatsheets/dbt-commands',
    sheetHref: '/cheatsheets/dbt-commands',
  },
  {
    slug: 'airflow',
    vendor: 'Apache Airflow',
    title: 'Airflow in production (no mascot exam)',
    examFee: 'Free on this site',
    length: 'Schedules, sensors, pools, idempotency',
    blurb:
      'There is no Hub-sponsored “Airflow certificate.” There is an on-call contract. The cron builder and essentials sheet are the curriculum.',
    hubTake:
      'Write one DAG contract: SLA, retry, who pages. Then the interview prompt about 24 sensors at 02:00.',
    href: '/courses',
    practiceHref: '/tools/cron-expression-builder',
    sheetHref: '/cheatsheets/airflow-essentials',
  },
];
