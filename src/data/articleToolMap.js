/**
 * Article Tool Map (PSEO cross-linking)
 * ------------------------------------------------------------
 * Maps article categories / tags to curated related PSEO resources:
 *   - cheatsheets  (/cheatsheets/<slug>)
 *   - comparisons  (/compare/<slug>)
 *   - glossary     (/glossary/<slug>)
 *   - calculators  (/tools/<slug>)
 *
 * Used by <RelatedTools/> on ArticlePage.jsx to improve internal
 * linking, crawl depth, and PSEO discovery from editorial content.
 *
 * Matching strategy (consumer side):
 *   1. Normalize the article's category + tags to lowercase slugs.
 *   2. Look up matching keys in TOOL_MAP (first match wins by category,
 *      then fall back to any tag that hits a key).
 *   3. De-duplicate results across types and cap rendering.
 */

// Canonical resource definitions (single source of truth).
const CHEATS = {
  snowflakeSql:       { slug: 'snowflake-sql',                       title: 'Snowflake SQL Cheat Sheet' },
  sqlWindow:          { slug: 'sql-window-functions',                title: 'SQL Window Functions Cheat Sheet' },
  dbtCommands:        { slug: 'dbt-commands',                        title: 'dbt Commands Cheat Sheet' },
  airflow:            { slug: 'airflow-essentials',                  title: 'Airflow Essentials Cheat Sheet' },
  snowflakeInterview: { slug: 'snowflake-interview-questions',       title: 'Snowflake Interview Questions' },
  sqlInterview:       { slug: 'sql-interview-questions',             title: 'SQL Interview Questions' },
  deInterview:        { slug: 'data-engineering-interview-questions',title: 'Data Engineering Interview Questions' },
  snowflakeBest:      { slug: 'snowflake-best-practices',            title: 'Snowflake Best Practices' },
  dbtBest:            { slug: 'dbt-best-practices',                  title: 'dbt Best Practices' },
  airflowBest:        { slug: 'airflow-best-practices',              title: 'Airflow Best Practices' },
  streamsTasks:       { slug: 'snowflake-streams-tasks-interview',   title: 'Snowflake Streams & Tasks Q&A' },
  dynamicTables:      { slug: 'snowflake-dynamic-tables-interview',  title: 'Snowflake Dynamic Tables Q&A' },
  snowpark:           { slug: 'snowflake-snowpark-interview',        title: 'Snowflake Snowpark Q&A' },
  dataSharing:        { slug: 'snowflake-data-sharing-interview',    title: 'Snowflake Data Sharing Q&A' },
  iceberg:            { slug: 'snowflake-iceberg-tables-interview',  title: 'Snowflake Iceberg Tables Q&A' },
  python:             { slug: 'python-for-data-engineers',           title: 'Python for Data Engineers' },
  pyspark:            { slug: 'pyspark',                             title: 'PySpark Cheat Sheet' },
  aws:                { slug: 'aws-for-data-engineers',              title: 'AWS for Data Engineers' },
  azure:              { slug: 'azure-for-data-engineers',            title: 'Azure for Data Engineers' },
  databricks:         { slug: 'databricks',                          title: 'Databricks Cheat Sheet' },
  dataModeling:       { slug: 'data-modeling',                       title: 'Data Modeling Cheat Sheet' },
};

const COMPARES = {
  sfVsBq:       { slug: 'snowflake-vs-bigquery',    title: 'Snowflake vs BigQuery' },
  sfVsDbx:      { slug: 'snowflake-vs-databricks',  title: 'Snowflake vs Databricks' },
  sfVsRs:       { slug: 'redshift-vs-snowflake',    title: 'Redshift vs Snowflake' },
  sfVsSynapse:  { slug: 'snowflake-vs-synapse',     title: 'Snowflake vs Synapse' },
  sfVsMotherduck:{slug: 'snowflake-vs-motherduck',  title: 'Snowflake vs MotherDuck' },
  bqVsRs:       { slug: 'bigquery-vs-redshift',     title: 'BigQuery vs Redshift' },
  deltaVsIce:   { slug: 'delta-lake-vs-iceberg',    title: 'Delta Lake vs Iceberg' },
  iceVsHudi:    { slug: 'iceberg-vs-hudi',          title: 'Iceberg vs Hudi' },
  afVsDagster:  { slug: 'airflow-vs-dagster',       title: 'Airflow vs Dagster' },
  afVsPrefect:  { slug: 'airflow-vs-prefect',       title: 'Airflow vs Prefect' },
  dagVsPrefect: { slug: 'dagster-vs-prefect',       title: 'Dagster vs Prefect' },
  mwaaVsComposer:{slug: 'mwaa-vs-cloud-composer',   title: 'MWAA vs Cloud Composer' },
  afVsLuigi:    { slug: 'airflow-vs-luigi',         title: 'Airflow vs Luigi' },
  dbtVsDataform:{ slug: 'dbt-vs-dataform',          title: 'dbt vs Dataform' },
  dbtVsSqlmesh: { slug: 'dbt-vs-sqlmesh',           title: 'dbt vs SQLMesh' },
  dbtCoreVsCloud:{slug: 'dbt-core-vs-dbt-cloud',    title: 'dbt Core vs dbt Cloud' },
};

const CALCS = {
  sfCost:     { slug: 'snowflake-cost-calculator', title: 'Snowflake Cost Calculator' },
  sfQuery:    { slug: 'snowflake-query-cost-estimator', title: 'Query Cost Estimator' },
  sfSize:     { slug: 'snowflake-warehouse-sizing', title: 'Warehouse Sizing Estimator' },
  compareWh:  { slug: 'cloud-data-warehouse-cost-comparison', title: 'Warehouse Cost Comparison' },
  playground: { slug: 'sql-playground', title: 'SQL Playground' },
  formatter:  { slug: 'sql-formatter', title: 'SQL Formatter' },
  cron:       { slug: 'cron-expression-builder', title: 'Cron Expression Builder' },
  dbtYml:     { slug: 'dbt-schema-generator', title: 'dbt Schema.yml Generator' },
  dbtCost:    { slug: 'dbt-cloud-cost-calculator', title: 'dbt Cloud Cost Calculator' },
  dbx:        { slug: 'databricks-cost-calculator', title: 'Databricks Cost Calculator' },
  bq:         { slug: 'bigquery-cost-calculator', title: 'BigQuery Cost Calculator' },
};

const GLOSS = {
  snowflake:    { slug: 'snowflake',             title: 'Snowflake' },
  warehouse:    { slug: 'data-warehouse',        title: 'Data Warehouse' },
  lake:         { slug: 'data-lake',             title: 'Data Lake' },
  lakehouse:    { slug: 'lakehouse',             title: 'Lakehouse' },
  scd:          { slug: 'scd',                   title: 'Slowly Changing Dimensions' },
  columnar:     { slug: 'columnar-storage',      title: 'Columnar Storage' },
  tableFormat:  { slug: 'table-format',          title: 'Open Table Formats' },
  medallion:    { slug: 'medallion-architecture',title: 'Medallion Architecture' },
  icebergTerm:  { slug: 'apache-iceberg',        title: 'Apache Iceberg' },
  hudiTerm:     { slug: 'apache-hudi',           title: 'Apache Hudi' },
  dbtTerm:      { slug: 'dbt',                   title: 'dbt (data build tool)' },
  etl:          { slug: 'etl',                   title: 'ETL' },
};

/**
 * Category / tag key -> curated resources.
 * Keys are normalized lowercase slugs (spaces -> hyphens).
 */
const TOOL_MAP = {
  snowflake: {
    cheatsheets: [CHEATS.snowflakeSql, CHEATS.snowflakeBest, CHEATS.snowflakeInterview, CHEATS.streamsTasks, CHEATS.dynamicTables, CHEATS.snowpark, CHEATS.iceberg],
    comparisons: [COMPARES.sfVsBq, COMPARES.sfVsDbx, COMPARES.sfVsRs, COMPARES.sfVsSynapse],
    glossary:    [GLOSS.snowflake, GLOSS.warehouse, GLOSS.icebergTerm, GLOSS.scd],
    calculators: [CALCS.sfCost, CALCS.sfQuery, CALCS.sfSize, CALCS.compareWh],
  },
  dbt: {
    cheatsheets: [CHEATS.dbtCommands, CHEATS.dbtBest],
    comparisons: [COMPARES.dbtVsDataform, COMPARES.dbtVsSqlmesh, COMPARES.dbtCoreVsCloud],
    glossary:    [GLOSS.dbtTerm, GLOSS.etl, GLOSS.medallion],
    calculators: [CALCS.dbtYml, CALCS.dbtCost, CALCS.cron],
  },
  airflow: {
    cheatsheets: [CHEATS.airflow, CHEATS.airflowBest],
    comparisons: [COMPARES.afVsDagster, COMPARES.afVsPrefect, COMPARES.mwaaVsComposer, COMPARES.afVsLuigi],
    glossary:    [GLOSS.etl, GLOSS.medallion],
    calculators: [CALCS.cron],
  },
  python: {
    cheatsheets: [CHEATS.python, CHEATS.pyspark],
    comparisons: [COMPARES.sfVsDbx],
    glossary:    [GLOSS.etl],
    calculators: [CALCS.playground],
  },
  pyspark: {
    cheatsheets: [CHEATS.pyspark, CHEATS.python, CHEATS.databricks],
    comparisons: [COMPARES.sfVsDbx, COMPARES.deltaVsIce],
    glossary:    [GLOSS.lakehouse, GLOSS.tableFormat],
    calculators: [CALCS.dbx, CALCS.playground],
  },
  aws: {
    cheatsheets: [CHEATS.aws, CHEATS.airflow],
    comparisons: [COMPARES.bqVsRs, COMPARES.sfVsRs, COMPARES.mwaaVsComposer],
    glossary:    [GLOSS.warehouse, GLOSS.lake],
    calculators: [CALCS.compareWh],
  },
  azure: {
    cheatsheets: [CHEATS.azure],
    comparisons: [COMPARES.sfVsSynapse],
    glossary:    [GLOSS.warehouse, GLOSS.lake],
    calculators: [CALCS.compareWh],
  },
  databricks: {
    cheatsheets: [CHEATS.databricks, CHEATS.pyspark],
    comparisons: [COMPARES.sfVsDbx, COMPARES.deltaVsIce],
    glossary:    [GLOSS.lakehouse, GLOSS.tableFormat, GLOSS.medallion],
    calculators: [CALCS.dbx, CALCS.compareWh],
  },
  sql: {
    cheatsheets: [CHEATS.snowflakeSql, CHEATS.sqlWindow, CHEATS.sqlInterview],
    comparisons: [COMPARES.sfVsBq, COMPARES.bqVsRs],
    glossary:    [GLOSS.warehouse, GLOSS.scd],
    calculators: [CALCS.playground, CALCS.formatter, CALCS.sfQuery],
  },
  'data-engineering': {
    cheatsheets: [CHEATS.deInterview, CHEATS.dataModeling, CHEATS.python],
    comparisons: [COMPARES.afVsDagster, COMPARES.dbtVsSqlmesh],
    glossary:    [GLOSS.warehouse, GLOSS.lake, GLOSS.lakehouse, GLOSS.medallion],
    calculators: [CALCS.playground, CALCS.compareWh],
  },
  'data-modeling': {
    cheatsheets: [CHEATS.dataModeling, CHEATS.snowflakeSql],
    comparisons: [COMPARES.sfVsBq],
    glossary:    [GLOSS.scd, GLOSS.warehouse, GLOSS.medallion],
    calculators: [CALCS.playground],
  },
  iceberg: {
    cheatsheets: [CHEATS.iceberg, CHEATS.snowflakeBest],
    comparisons: [COMPARES.deltaVsIce, COMPARES.iceVsHudi],
    glossary:    [GLOSS.icebergTerm, GLOSS.tableFormat, GLOSS.lakehouse],
    calculators: [CALCS.sfCost],
  },
  'data-warehousing': {
    cheatsheets: [CHEATS.snowflakeSql, CHEATS.snowflakeBest, CHEATS.dataModeling],
    comparisons: [COMPARES.sfVsBq, COMPARES.sfVsRs, COMPARES.sfVsDbx],
    glossary:    [GLOSS.warehouse, GLOSS.columnar, GLOSS.scd],
    calculators: [CALCS.compareWh, CALCS.sfCost, CALCS.bq],
  },
  etl: {
    cheatsheets: [CHEATS.dbtCommands, CHEATS.airflow, CHEATS.python],
    comparisons: [COMPARES.dbtVsDataform, COMPARES.afVsPrefect],
    glossary:    [GLOSS.etl, GLOSS.medallion],
    calculators: [CALCS.cron, CALCS.dbtYml],
  },
  orchestration: {
    cheatsheets: [CHEATS.airflow, CHEATS.airflowBest],
    comparisons: [COMPARES.afVsDagster, COMPARES.afVsPrefect, COMPARES.dagVsPrefect],
    glossary:    [GLOSS.etl],
    calculators: [CALCS.cron],
  },
};

// Aliases — WordPress categories / tags that should behave as another key.
const ALIASES = {
  'apache-airflow': 'airflow',
  'apache-iceberg': 'iceberg',
  'apache-spark':   'pyspark',
  spark:            'pyspark',
  snow:             'snowflake',
  'amazon-web-services': 'aws',
  'microsoft-azure': 'azure',
  'data-build-tool': 'dbt',
  'data warehouse':  'data-warehousing',
  warehousing:       'data-warehousing',
  'data-warehouse':  'data-warehousing',
  dataengineering:   'data-engineering',
  'data-engineer':   'data-engineering',
};

/**
 * Normalize a label (WP category name or tag) into a map key.
 */
export function normalizeKey(raw) {
  if (!raw) return '';
  const k = String(raw).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return ALIASES[k] || k;
}

/**
 * Resolve related tools for a given article.
 *
 * @param {object} post           Article object.
 * @param {string} post.category  WordPress category name or slug.
 * @param {string[]} [post.tags]  Optional tag list (names or slugs).
 * @param {number} [limitPerType] Cap per bucket (default 4).
 * @returns {{cheatsheets:Array,comparisons:Array,glossary:Array}}
 */
export function getRelatedTools(post = {}, limitPerType = 4) {
  const empty = { cheatsheets: [], comparisons: [], glossary: [], calculators: [] };
  if (!post) return empty;

  const keys = new Set();
  const primary = normalizeKey(post.category);
  if (primary) keys.add(primary);
  (post.tags || []).forEach((t) => {
    const k = normalizeKey(typeof t === 'string' ? t : t?.name || t?.slug);
    if (k) keys.add(k);
  });

  const bucket = { cheatsheets: [], comparisons: [], glossary: [], calculators: [] };
  const seen = { cheatsheets: new Set(), comparisons: new Set(), glossary: new Set(), calculators: new Set() };

  // Iterate keys in order: primary first, then tag-derived.
  for (const key of keys) {
    const hit = TOOL_MAP[key];
    if (!hit) continue;
    for (const type of ['cheatsheets', 'comparisons', 'glossary', 'calculators']) {
      for (const item of hit[type] || []) {
        if (seen[type].has(item.slug)) continue;
        seen[type].add(item.slug);
        bucket[type].push(item);
        if (bucket[type].length >= limitPerType) break;
      }
    }
  }

  return bucket;
}

export default getRelatedTools;
