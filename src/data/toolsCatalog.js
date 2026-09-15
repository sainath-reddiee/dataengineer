// Shared catalog for every surface that should surface tools on a phone:
// header, home rail, tools hub filters, search, footer, and article widgets.

export const TOOL_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'cost', label: 'Cost' },
  { id: 'sql', label: 'SQL' },
  { id: 'convert', label: 'Convert' },
  { id: 'generate', label: 'Generate' },
  { id: 'practice', label: 'Practice' },
];

export const TOOL_STAGES = [
  { id: 'ingest', label: 'Ingest', hint: 'Python · Kafka' },
  { id: 'transform', label: 'Transform', hint: 'dbt · Airflow' },
  { id: 'warehouse', label: 'Warehouse', hint: 'Snowflake · Databricks' },
  { id: 'serve', label: 'Serve', hint: 'SQL · BI' },
];

export const TOOLS = [
  {
    slug: 'snowflake-cost-calculator',
    title: 'Snowflake Cost Calculator',
    icon: 'Calculator',
    tagline: 'Full monthly spend estimator',
    description:
      'Model compute, storage, Snowpipe, Cortex AI, and serverless feature costs. Pick warehouse size, edition, region, and hours. Get a complete monthly projection.',
    primaryFor: 'Budget planning, capacity forecasting, vendor negotiations',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse'],
    keywords: ['snowflake', 'credit', 'bill', 'warehouse', 'cortex'],
    featured: true,
  },
  {
    slug: 'snowflake-credit-cost',
    title: 'Credit → USD Converter',
    icon: 'DollarSign',
    tagline: 'Instant credit price lookup',
    description:
      'Convert any number of Snowflake credits to US dollars instantly across all editions (Standard, Enterprise, Business Critical, VPS) and cloud regions.',
    primaryFor: 'Quick price checks, reviewing Account Usage bills, regional comparisons',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse'],
    keywords: ['snowflake', 'credits', 'usd', 'invoice'],
  },
  {
    slug: 'snowflake-query-cost-estimator',
    title: 'Query Cost Estimator',
    icon: 'Zap',
    tagline: 'Price per query, daily, monthly',
    description:
      'Enter bytes scanned and warehouse size to estimate cost per query, including the 60-second resume minimum. Scales to daily and monthly totals.',
    primaryFor: 'Query optimization ROI, dashboard cost analysis, chargeback',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse', 'serve'],
    keywords: ['snowflake', 'query', 'scan', 'bytes'],
  },
  {
    slug: 'snowflake-warehouse-sizing',
    title: 'Warehouse Sizing Estimator',
    icon: 'Gauge',
    tagline: 'Pick XS → 6XL by workload',
    description:
      'Recommends a starting warehouse size (XS to 6XL) from workload type, data volume, and concurrency. Shows one-size-up and one-size-down cost comparison.',
    primaryFor: 'Right-sizing, new workload setup, ETL vs BI tradeoffs',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse'],
    keywords: ['snowflake', 'sizing', 'xs', 'xl', 'concurrency'],
  },
  {
    slug: 'databricks-cost-calculator',
    title: 'Databricks Cost Calculator',
    icon: 'Cloud',
    tagline: 'DBU-based lakehouse pricing',
    description:
      'Model Databricks costs by cluster type (All-Purpose, Jobs, SQL Compute, Serverless SQL), DBU rate, instance type, and hours. Compare directly against Snowflake warehouse equivalents.',
    primaryFor: 'Lakehouse vs warehouse decisions, multi-cloud cost benchmarking, platform migrations',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse', 'transform'],
    keywords: ['databricks', 'dbu', 'cluster', 'photon'],
  },
  {
    slug: 'dbt-cloud-cost-calculator',
    title: 'dbt Cloud Cost Calculator',
    icon: 'Users',
    tagline: 'Seat + run-based pricing',
    description:
      'Estimate dbt Cloud cost across Developer, Team, and Enterprise tiers. Factor in developer seats, successful models built, IDE usage, and run frequency. Compare with dbt Core TCO.',
    primaryFor: 'dbt Cloud vs dbt Core ROI, team budgeting, upgrade planning',
    category: 'cost',
    primaryStage: 'transform',
    stages: ['transform'],
    keywords: ['dbt', 'cloud', 'seats', 'models'],
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Formatter',
    icon: 'Code2',
    tagline: 'Beautify + standardize SQL',
    description:
      'Paste any SQL — Snowflake, PostgreSQL, BigQuery, Redshift, or ANSI — and get consistent formatting with configurable indentation, keyword case, and line length. 100% client-side.',
    primaryFor: 'Code review cleanup, PR hygiene, pre-commit style enforcement',
    category: 'sql',
    primaryStage: 'serve',
    stages: ['serve'],
    keywords: ['sql', 'format', 'pretty', 'indent'],
    featured: true,
  },
  {
    slug: 'cron-expression-builder',
    title: 'Cron Expression Builder',
    icon: 'Clock',
    tagline: 'Visual cron + next-run preview',
    description:
      'Build and validate 5-field and 6-field cron expressions for Airflow, dbt, Snowflake TASK, and standard Unix cron. Shows next 5 run times and human-readable description.',
    primaryFor: 'Airflow DAGs, Snowflake TASKs, dbt Cloud jobs, data pipeline schedules',
    category: 'generate',
    primaryStage: 'transform',
    stages: ['transform'],
    keywords: ['cron', 'airflow', 'schedule', 'task'],
    featured: true,
  },
  {
    slug: 'json-to-sql-ddl',
    title: 'JSON → SQL DDL Generator',
    icon: 'FileJson',
    tagline: 'Schema inference from sample',
    description:
      'Paste a JSON sample (or array of samples) and get a CREATE TABLE DDL with inferred types. Supports Snowflake VARIANT, PostgreSQL JSONB, and standard SQL types. Handles nested objects and arrays.',
    primaryFor: 'Ingestion pipeline bootstrapping, schema design, API → warehouse mapping',
    category: 'generate',
    primaryStage: 'ingest',
    stages: ['ingest'],
    keywords: ['json', 'ddl', 'create table', 'schema'],
  },
  {
    slug: 'csv-to-sql',
    title: 'CSV → SQL Converter',
    icon: 'FileSpreadsheet',
    tagline: 'INSERT + CREATE TABLE from CSV',
    description:
      'Paste CSV, get both CREATE TABLE DDL and INSERT statements with inferred types. RFC 4180 parser handles quoted fields, embedded commas, and escaped quotes. Snowflake, Postgres, BigQuery, ANSI dialects.',
    primaryFor: 'Test data seeding, fixture generation, quick CSV-to-warehouse loads',
    category: 'convert',
    primaryStage: 'ingest',
    stages: ['ingest'],
    keywords: ['csv', 'insert', 'seed', 'fixture'],
  },
  {
    slug: 'dbt-schema-generator',
    title: 'dbt Schema.yml Generator',
    icon: 'FileCode2',
    tagline: 'CREATE TABLE → dbt scaffold',
    description:
      'Paste a CREATE TABLE statement, get a complete dbt scaffold: schema.yml with inferred unique/not_null tests, staging SQL model, and sources.yml with freshness checks. Zero warehouse connection required.',
    primaryFor: 'dbt onboarding, staging layer bootstrapping, schema.yml generation without codegen',
    category: 'generate',
    primaryStage: 'transform',
    stages: ['transform'],
    keywords: ['dbt', 'schema.yml', 'sources', 'staging'],
  },
  {
    slug: 'unix-timestamp-converter',
    title: 'Unix Timestamp Converter',
    icon: 'Clock',
    tagline: 'Epoch ↔ date (sec/ms/μs/ns)',
    description:
      'Convert Unix epoch time to human-readable UTC, ISO 8601, and local datetime. Auto-detects seconds, milliseconds, microseconds, and nanoseconds. Includes SQL cheat sheet for Snowflake, Postgres, BigQuery, MySQL, Redshift, Databricks.',
    primaryFor: 'Debugging time-series data, SQL timestamp conversions, API integration',
    category: 'convert',
    primaryStage: 'serve',
    stages: ['serve', 'ingest'],
    keywords: ['epoch', 'unix', 'timestamp', 'iso'],
  },
  {
    slug: 'bigquery-cost-calculator',
    title: 'BigQuery Cost Calculator',
    icon: 'Cloud',
    tagline: 'On-demand + Editions pricing',
    description:
      'Model Google BigQuery spend across on-demand ($6.25/TB scanned) and capacity Editions (Standard/Enterprise/Enterprise Plus slot-hours). Includes storage tiers, streaming ingest, and on-demand vs Editions break-even analysis.',
    primaryFor: 'BigQuery cost planning, on-demand vs Editions decisions, multi-cloud comparison',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse', 'serve'],
    keywords: ['bigquery', 'slots', 'tb', 'editions'],
  },
  {
    slug: 'sql-playground',
    title: 'SQL Playground',
    icon: 'Database',
    tagline: 'Run SQL in your browser',
    description:
      'In-browser SQL engine powered by DuckDB-WASM. Practice window functions, CTEs, QUALIFY, aggregations, and joins on preloaded sample datasets. No server, no signup, 100% client-side.',
    primaryFor: 'SQL practice, interview prep, learning window functions, quick prototyping',
    category: 'sql',
    primaryStage: 'serve',
    stages: ['serve'],
    keywords: ['sql', 'duckdb', 'playground', 'qualify', 'window'],
    featured: true,
  },
  {
    slug: 'json-parquet-avro-converter',
    title: 'JSON / Parquet / Avro Converter',
    icon: 'ArrowLeftRight',
    tagline: 'Convert between data formats',
    description:
      'Convert JSON, Apache Parquet, and Apache Avro files directly in your browser. Powered by DuckDB-WASM for Parquet and avsc for Avro. No upload, no server — 100% client-side.',
    primaryFor: 'Data lake format conversion, Kafka/Avro inspection, Parquet previewing, format migration',
    category: 'convert',
    primaryStage: 'ingest',
    stages: ['ingest'],
    keywords: ['parquet', 'avro', 'json', 'kafka'],
  },
  {
    slug: 'cloud-data-warehouse-cost-comparison',
    title: 'Cloud Warehouse Cost Comparison',
    icon: 'Scale',
    tagline: 'Snowflake vs BigQuery vs Databricks',
    description:
      'Enter one workload profile — TB scanned, compute hours, storage — and get an apples-to-apples monthly cost estimate across Snowflake, BigQuery, and Databricks. Uses published list pricing (April 2026). Great for pre-RFP sizing and migration budget framing.',
    primaryFor: 'Platform selection, migration cost modeling, vendor negotiations, multi-cloud strategy',
    category: 'cost',
    primaryStage: 'warehouse',
    stages: ['warehouse'],
    keywords: ['compare', 'snowflake', 'bigquery', 'databricks', 'rfp'],
    featured: true,
  },
  {
    slug: 'snowflake-certification-practice',
    title: 'Snowflake Certification Practice',
    icon: 'Award',
    tagline: 'Interactive SnowPro exam prep',
    description:
      'Practice for SnowPro Core, SnowPro Advanced: Data Engineer, and SnowPro Specialty (Gen AI, Architect) exams. Interactive question bank with real-world scenarios, instant feedback, and topic-wise readiness tracking to help you pass on the first attempt.',
    primaryFor: 'SnowPro Core prep, Advanced Data Engineer certification, Specialty exam revision',
    category: 'practice',
    primaryStage: 'serve',
    stages: ['serve'],
    keywords: ['snowpro', 'certification', 'exam'],
    external: true,
    url: 'https://dataengineerhub.blog/certification',
  },
];

export const FEATURED_TOOLS = TOOLS.filter((tool) => tool.featured);

export function toolHref(tool) {
  return tool.external ? tool.url : `/tools/${tool.slug}`;
}

export function filterTools({ category = 'all', stage = '' } = {}) {
  return TOOLS.filter((tool) => {
    if (category && category !== 'all' && tool.category !== category) return false;
    if (stage && (tool.primaryStage || (tool.stages || [])[0]) !== stage) return false;
    return true;
  });
}

export function searchTools(query) {
  const needle = String(query || '').trim().toLowerCase();
  if (needle.length < 2) return [];
  return TOOLS
    .map((tool) => {
      const hay = [tool.title, tool.tagline, tool.description, tool.primaryFor, ...(tool.keywords || [])]
        .join(' ')
        .toLowerCase();
      let score = 0;
      if (tool.title.toLowerCase() === needle) score = 100;
      else if (tool.title.toLowerCase().startsWith(needle)) score = 80;
      else if (tool.title.toLowerCase().includes(needle)) score = 70;
      else if ((tool.keywords || []).some((word) => word.includes(needle) || needle.includes(word))) score = 60;
      else if (hay.includes(needle)) score = 40;
      return { tool, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.tool);
}

export function toolsForSearchIndex() {
  return TOOLS.filter((tool) => !tool.external).map((tool) => ({
    type: 'tool',
    id: `tool-${tool.slug}`,
    title: tool.title,
    slug: tool.slug,
    href: toolHref(tool),
    category: tool.category,
    excerpt: tool.tagline,
  }));
}
