/**
 * Original Hub courses — outlines that use live tools and sheets on this site.
 * Not a scrape of another academy. Each course is a guided path, not a video LMS.
 */
export const COURSES = [
  {
    slug: 'snowflake-cost-literacy',
    title: 'Snowflake cost literacy',
    hours: '4–6 hours',
    level: 'Practitioner',
    blurb:
      'Credits, suspend, bytes scanned, and the queries that quietly keep an XL awake. You will leave with a number you can defend to finance.',
    youBuild: 'A one-page cost model for one warehouse using the Hub calculator and QUERY_HISTORY-style assumptions.',
    modules: [
      {
        title: 'What a credit actually buys',
        body: 'A credit is not “a query.” It is warehouse-seconds × size. Idle XL with a 10-minute suspend is a subscription to nothing. Start with the Snowflake credit cost tool, then the warehouse sizing tool with your concurrency and target runtime. Write the monthly number before you touch SQL.',
        href: '/tools/snowflake-credit-cost',
        cta: 'Open credit cost',
      },
      {
        title: 'Bytes scanned vs warehouse size',
        body: 'If QUERY_HISTORY shows terabytes for a KPI, resizing to 2XL makes the same scan faster and more expensive. Pruning, clustering that matches filters, and stopping SELECT * on VARIANT are the first three moves. The query cost estimator exists so you can put a dollar on a bad explore.',
        href: '/tools/snowflake-query-cost-estimator',
        cta: 'Estimate a query',
      },
      {
        title: 'Compare without a vendor slide',
        body: 'Same workload, three warehouses. Use the cloud warehouse comparison calculator with honest hours/day. Then read production notes in the article library — not a “Snowflake vs Databricks” listicle. The interview bank has the one-sentence version of this comparison.',
        href: '/tools/cloud-data-warehouse-cost-comparison',
        cta: 'Compare warehouses',
      },
    ],
  },
  {
    slug: 'dbt-grain-and-tests',
    title: 'dbt tests that catch a bad grain',
    hours: '3–5 hours',
    level: 'Analytics engineer',
    blurb:
      'unique and not_null are not a model. You will write tests that fail when a join explodes revenue, then generate schema.yml instead of hand-editing YAML.',
    youBuild: 'A staging + mart pair with unique_combination_of_columns and a sum-reconciliation test described in schema.yml.',
    modules: [
      {
        title: 'Name the grain out loud',
        body: 'Every model has one sentence: “one row per order line as of load time.” If two people disagree, the test suite is fiction. The data modeling cheat sheet on this site is the vocabulary; the interview question on lying tests is the exam.',
        href: '/cheatsheets/data-modeling',
        cta: 'Modeling sheet',
      },
      {
        title: 'schema.yml without the toil',
        body: 'Generate column tests from a staging SELECT, then add the combination key by hand. The dbt schema generator is the Hub version of “I will not skip tests because YAML was annoying.”',
        href: '/tools/dbt-schema-generator',
        cta: 'Generate schema.yml',
      },
      {
        title: 'Commands you actually run in review',
        body: 'build --select +mart, test --select source:*, and freshness on the extractor you on-call for. The dbt commands sheet is short on purpose. Pair it with the interview bank grain question before a take-home.',
        href: '/cheatsheets/dbt-commands',
        cta: 'dbt commands',
      },
    ],
  },
  {
    slug: 'airflow-that-pages',
    title: 'Airflow schedules that page someone',
    hours: '3–4 hours',
    level: 'Platform / DE',
    blurb:
      'Cron is not an SLA. You will write a schedule, a retry story, and a freshness check that fails before Tableau runs.',
    youBuild: 'A cron expression plus a written on-call contract: what retries, what pages, what is warn-only.',
    modules: [
      {
        title: 'Write the cron once',
        body: 'Use the cron builder for Airflow and Snowflake TASK so the string is not a guess. Say the timezone. “0 2 * * *” in UTC is not 2am for the finance team in IST.',
        href: '/tools/cron-expression-builder',
        cta: 'Build cron',
      },
      {
        title: 'Sensors, pools, idempotency',
        body: 'The Airflow essentials sheet is the checklist: deferrable sensors, pools so COPY jobs do not all XL, MERGE not INSERT. The interview bank has the “DAG that is a cron with extra steps” prompt — answer it out loud after this module.',
        href: '/cheatsheets/airflow-essentials',
        cta: 'Airflow sheet',
      },
      {
        title: 'Freshness is a pager, not a log line',
        body: 'dbt source freshness as an error on SLA sources. Dashboard extract time is the user SLA. This course ends when you can explain that split to a PM without a slide.',
        href: '/interview-questions',
        cta: 'Practice the freshness question',
      },
    ],
  },
  {
    slug: 'databricks-dbu-math',
    title: 'Databricks DBU math',
    hours: '3–5 hours',
    level: 'Lakehouse',
    blurb:
      'Jobs compute vs interactive clusters, Photon, and why “the cluster is up” is a bill. You will model a DBU number, then read Delta habits on the sheet.',
    youBuild: 'A jobs-vs-all-purpose cost sketch for one nightly ELT and one ad-hoc SQL warehouse.',
    modules: [
      {
        title: 'Put a dollar on the cluster',
        body: 'The Databricks cost calculator is the lab. Interactive clusters idle; jobs compute should die with the run. Photon changes runtime, not the need for a filter pushdown.',
        href: '/tools/databricks-cost-calculator',
        cta: 'Model DBUs',
      },
      {
        title: 'Delta habits that survive review',
        body: 'Z-ORDER is not a join strategy. OPTIMIZE is not a substitute for partition design. The Databricks cheat sheet is the Hub version of “what we actually run.”',
        href: '/cheatsheets/databricks',
        cta: 'Databricks sheet',
      },
      {
        title: 'Associate exam as a diagnostic',
        body: 'The practice test is a check on Spark ELT vocabulary, not a dump to memorize. Fail a domain, then come back to the sheet. Do not collect badges instead of bytes scanned.',
        href: '/practice/databricks-de',
        cta: 'DE Associate quiz',
      },
    ],
  },
  {
    slug: 'interview-sql-loop',
    title: 'Interview SQL you can defend',
    hours: '1–2 weeks part-time',
    level: 'Interview',
    blurb:
      'Windows, anti-joins, sessionization, and the frame-clause trap. Pads run in DuckDB in this tab. Progress stays on the device.',
    youBuild: 'Eight starter pads marked solved, plus spoken answers for the free interview-bank SQL set.',
    modules: [
      {
        title: 'Pads, not puzzles',
        body: 'Open /coding. Easy pads are free. Hard pads are Hub Pro — same sample tables, nastier grain. Mark solved when columns match. This is not LeetCode in a warehouse costume; it is the SQL we use in reviews.',
        href: '/coding',
        cta: 'SQL coding hub',
      },
      {
        title: 'Speak the answer',
        body: 'The interview bank SQL track is written to be said out loud in 90 seconds. If you cannot explain RANGE vs ROWS, you are not done with windows.',
        href: '/interview-questions',
        cta: 'Interview bank',
      },
      {
        title: '14-day plan',
        body: 'The interview prep hub is the calendar. Cheat sheets by stack, then a mock on Sunday. Practice tests are a different URL on purpose — cert quizzes are not interview SQL.',
        href: '/interview-prep',
        cta: '14-day plan',
      },
    ],
  },
  {
    slug: 'cert-loop-without-dumps',
    title: 'Cert loop without memorizing dumps',
    hours: '3–6 weeks',
    level: 'Certification',
    blurb:
      'SnowPro, Databricks DE, AWS DEA as diagnostics. Timed quizzes in the browser. The Snowflake certification page is the deep SnowPro track.',
    youBuild: 'One practice exam above 75% with notes on every miss — concept, not letter.',
    modules: [
      {
        title: 'Pick the exam that matches the job',
        body: 'The certs hub compares vendor exams without pretending a badge is a senior loop. SnowPro Core first if the team is Snowflake. Databricks if the lakehouse is the job. AWS DEA if the posting says glue and redshift in the same sentence.',
        href: '/certs',
        cta: 'Certs hub',
      },
      {
        title: 'Timed quiz, then the sheet',
        body: 'Practice tests live at /practice. After a miss, open the matching cheat sheet. Do not screenshot answer keys. The certification page embeds the Snowflake-specific study map.',
        href: '/practice',
        cta: 'Practice tests',
      },
      {
        title: 'Track it on this device',
        body: 'Progress and saved items are localStorage. No login. If you buy Hub Pro, membership is also this browser until we match Dodo webhooks to an email.',
        href: '/progress',
        cta: 'Progress',
      },
    ],
  },
];

export function courseBySlug(slug) {
  return COURSES.find((item) => item.slug === slug) || null;
}
