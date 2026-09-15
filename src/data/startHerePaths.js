export const START_HERE_PATHS = [
  {
    id: 'warehouse',
    title: 'Warehouse & cost',
    blurb: 'Size Snowflake, compare Databricks and BigQuery, then read the production notes.',
    href: '/tools?stack=warehouse',
    cta: 'Open warehouse tools',
    icon: 'Calculator',
  },
  {
    id: 'transform',
    title: 'Transform & schedule',
    blurb: 'dbt schema.yml, Airflow cron, and the sheets you actually open in a review.',
    href: '/tools?stack=transform',
    cta: 'Open transform tools',
    icon: 'Workflow',
  },
  {
    id: 'interview',
    title: 'Interview loop',
    blurb: '14-day plan, SQL windows, system design — original questions, not a leaked dump.',
    href: '/interview-prep',
    cta: 'Start the plan',
    icon: 'GraduationCap',
  },
  {
    id: 'practice',
    title: 'Certification drills',
    blurb: 'SnowPro, Databricks DE, AWS DEA — timed quizzes in this browser, no signup.',
    href: '/practice',
    cta: 'Take a practice test',
    icon: 'Target',
  },
];

export const ROADMAPS = [
  {
    slug: 'snowflake-data-engineer',
    title: 'Snowflake data engineer',
    blurb: 'Credits, micropartitions, SQL you can defend, then SnowPro as a diagnostic — not the job.',
    steps: [
      { label: 'Cost calculator', href: '/tools/snowflake-cost-calculator' },
      { label: 'Snowflake SQL sheet', href: '/cheatsheets/snowflake-sql' },
      { label: 'Production tutorials', href: '/articles' },
      { label: 'SnowPro practice', href: '/practice/snowpro-core' },
    ],
  },
  {
    slug: 'analytics-engineer',
    title: 'Analytics engineer (dbt + Airflow)',
    blurb: 'Staging tests, freshness, and a schedule that pages someone. Warehouse SQL still matters.',
    steps: [
      { label: 'dbt commands', href: '/cheatsheets/dbt-commands' },
      { label: 'schema.yml generator', href: '/tools/dbt-schema-generator' },
      { label: 'Airflow cron', href: '/tools/cron-expression-builder' },
      { label: 'Airflow essentials', href: '/cheatsheets/airflow-essentials' },
    ],
  },
  {
    slug: 'databricks-lakehouse',
    title: 'Databricks lakehouse',
    blurb: 'DBU math, Delta habits, and the associate exam as a check on Spark ELT — not a Spark trivia dump.',
    steps: [
      { label: 'Databricks cost', href: '/tools/databricks-cost-calculator' },
      { label: 'Databricks sheet', href: '/cheatsheets/databricks' },
      { label: 'Warehouse comparison', href: '/tools/cloud-data-warehouse-cost-comparison' },
      { label: 'DE Associate quiz', href: '/practice/databricks-de' },
    ],
  },
  {
    slug: 'interview-loop',
    title: 'Interview + cert loop',
    blurb: 'SQL in the browser, the 14-day plan, then one timed quiz. Progress stays on this device.',
    steps: [
      { label: 'SQL coding pads', href: '/coding' },
      { label: 'Interview hub', href: '/interview-prep' },
      { label: 'Practice tests', href: '/practice' },
      { label: 'Track progress', href: '/progress' },
    ],
  },
];
