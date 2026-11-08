/**
 * Dynamic Pipeline Instrument Extractor
 *
 * Inspects an article's slug, title, HTML content, headings, and <pre><code>
 * blocks to produce an authentic, article-specific interactive engineering
 * schematic. Works automatically for existing posts and future WordPress
 * articles without requiring manual configuration.
 *
 * Four engineering instrument archetypes:
 * 1. trace    — Code-to-Architecture Execution Trace (Orchestrator -> Compute boundary)
 * 2. billing  — 60-Second Minimum Warehouse Billing & Idle Tail Analyzer
 * 3. storage  — FDN Micro-Partition Pruning & Copy-on-Write Clone Inspector
 * 4. incident — Production DAG Failure, Contract Break & Retry Recovery Diff
 */

const INVALID_TABLE_NAMES = new Set([
  'table', 'tables', 'lateral', 'flatten', 'unnest', 'values', 'select', 'where', 'set',
  'only', 'exists', 'not', 'null', 'temp', 'temporary', 'external', 'replace',
  'if', 'the', 'a', 'an', 'our', 'your', 'my', 'for', 'with', 'by', 'to', 'in', 'of',
  'source', 'sources', 'target', 'excluded', 'new', 'old', 'src', 'tgt', 'row', 'rows',
  'role', 'user', 'specification', 'renamed', 'final', 'staged', 'cte', 'base',
  'stdin', 'stdout', 'dual', 'json', 'parquet', 'csv',
  'def', 'class', 'import', 'from', 'return', 'create', 'alter', 'drop',
  'update', 'insert', 'into', 'merge', 'using', 'on', 'and', 'or', 'as',
  'datetime', 'airflow', 'pydantic', 'fastmcp', 'os', 'sys', 'logging',
  'spark', 'dataframe', 'stage', 'view', 'database', 'schema', 'warehouse',
]);

export function decodeEntities(value) {
  let out = String(value || '');
  for (let i = 0; i < 2; i += 1) {
    out = out
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&#8217;|&#8216;/g, "'")
      .replace(/&#8220;|&#8221;/g, '"')
      .replace(/&#8211;|&#8212;|&mdash;|&ndash;/g, '-')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = Number(dec);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
      })
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
      });
  }
  return out;
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Condenses a multi-line statement or single-keyword line (e.g. "CREATE\n TABLE foo")
 * into a clean, readable single-line engineering preview.
 */
function buildMeaningfulStatements(lines) {
  const statements = [];
  let i = 0;
  while (i < lines.length && statements.length < 6) {
    let current = lines[i].trim();
    // Join bare single-keyword lines ("CREATE", "SELECT", "FROM", "import", "@task") with the next line
    while (
      i + 1 < lines.length &&
      (current.length < 14 || /^(CREATE|SELECT|FROM|WHERE|ALTER|INSERT|MERGE|COPY|WITH|@[a-zA-Z0-9_.]+|def|class)\b/i.test(current) && current.split(/\s+/).length <= 2)
    ) {
      i += 1;
      current = `${current} ${lines[i].trim()}`.replace(/\s+/g, ' ').trim();
    }
    if (current.length > 3) {
      statements.push(current.slice(0, 76));
    }
    i += 1;
  }
  return statements;
}

/**
 * Extracts clean code snippets from article HTML <pre> blocks (supports both
 * raw WordPress <pre> and SSG-highlighted <pre class="article-code-pre">).
 */
export function extractArticleCodeSnippets(html) {
  const source = String(html || '');
  if (!source) return [];
  const snippets = [];
  const preRegex = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  while ((match = preRegex.exec(source)) !== null) {
    const raw = match[1]
      .replace(/<span class="article-code-gutter"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<span class="article-code-line"[^>]*>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    const decodedBlock = decodeEntities(raw).replace(/\r\n/g, '\n').trim();
    const rawLines = decodedBlock
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(
        (line) =>
          line.length > 1 &&
          !line.startsWith('//') &&
          !line.startsWith('#') &&
          !line.startsWith('--') &&
          !/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝▼▲◄►]/.test(line) &&
          !/^[\s↓↑←→|v^+-]+$/.test(line)
      );

    const meaningfulLines = buildMeaningfulStatements(rawLines);
    const isSqlBlock = /\b(SELECT|FROM|WHERE|CREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|VIEW|DATABASE|SCHEMA|WAREHOUSE|TASK|STREAM|RESOURCE\s+MONITOR)|COPY\s+INTO|MERGE\s+INTO|INSERT\s+INTO|ALTER\s+(?:TABLE|WAREHOUSE|DATABASE)|EXECUTE\s+DBT\s+PROJECT|iceberg_scan)\b/i.test(
      decodedBlock
    ) && !/\b(def\s+\w+|from\s+[\w.]+\s+import|import\s+\w+)\b/.test(decodedBlock);

    if (decodedBlock.length > 8 && meaningfulLines.length > 0) {
      snippets.push({
        fullText: decodedBlock,
        cleanText: rawLines.join('\n'),
        firstLine: meaningfulLines[0],
        meaningfulLines,
        isSqlBlock,
        index: match.index,
      });
    }
  }
  return snippets;
}

/**
 * Extracts H2/H3 section headings with their position in HTML.
 */
export function extractArticleSections(html) {
  const source = String(html || '');
  if (!source) return [];
  const sections = [];
  const hRegex = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = hRegex.exec(source)) !== null) {
    const title = stripTags(match[2]);
    if (
      title &&
      title.length > 3 &&
      !/^(tl;?dr|key takeaways|frequently asked|faq|related|further reading|conclusion|final thoughts|summary)/i.test(title)
    ) {
      sections.push({
        level: Number(match[1]),
        title,
        index: match.index,
      });
    }
  }
  return sections;
}

function isValidSqlTableCandidate(candidate) {
  if (!candidate || candidate.length < 3 || candidate.length > 44) return false;
  if (/^[^a-zA-Z]/.test(candidate)) return false;
  if (/[./\\]$/.test(candidate)) return false;
  const lower = candidate.toLowerCase();
  if (INVALID_TABLE_NAMES.has(lower)) return false;
  // Reject file extensions, version strings, or Python module paths
  if (/\.(py|js|ts|tsx|jsx|json|ya?ml|sh|md|txt|env|sql|parquet|csv|avro|jar|whl)$/i.test(candidate)) return false;
  if (/^v?\d+\.\d+/i.test(candidate)) return false;
  if (/^(airflow|awsglue|pyspark|snowflake\.connector|urllib|requests|logging|os|sys| t)\./i.test(candidate)) return false;
  const parts = candidate.split('.');
  if (parts.some((p) => p.length < 2 || INVALID_TABLE_NAMES.has(p.toLowerCase()))) return false;
  return true;
}

/**
 * Detects concrete SQL identifiers (table names, WHERE predicates, warehouse names)
 * strictly from SQL blocks so Python imports or file names never pollute SQL views.
 */
function detectSqlEntities(snippets, title) {
  const sqlOnly = snippets
    .filter((s) => s.isSqlBlock)
    .map((s) => s.cleanText || s.fullText)
    .join('\n');
  const allCode = snippets.map((s) => s.cleanText || s.fullText).join('\n');

  let foundTable = '';
  const tableRegex = /\b(?:FROM|INTO|TABLE|CLONE|JOIN|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_$.]{2,42})/gi;
  let match;
  while ((match = tableRegex.exec(sqlOnly)) !== null) {
    const cleaned = match[1].replace(/[();,]/g, '');
    if (isValidSqlTableCandidate(cleaned)) {
      foundTable = cleaned;
      break;
    }
  }

  const shortTable = foundTable
    ? foundTable.split('.').slice(-2).join('.')
    : 'analytics.fact_orders';

  const whereMatch = sqlOnly.match(/\bWHERE\s+([^\n;]{5,48})/i);
  const rawWhere = whereMatch ? whereMatch[1].replace(/\s+/g, ' ').trim() : '';
  const whereClause =
    rawWhere && !/\b(SELECT|FROM|JOIN)\b/i.test(rawWhere)
      ? rawWhere
      : "order_date >= '2026-01-01'";

  const whMatch = allCode.match(/\b([A-Za-z0-9_]+_WH|COMPUTE_WH|TRANSFORM_WH|ETL_HEAVY_WH)\b/i);
  const warehouse = whMatch ? whMatch[1].toUpperCase() : 'TRANSFORM_XS_WH';

  const cloneMatch = sqlOnly.match(/\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:DATABASE|SCHEMA|TABLE)\s+([a-zA-Z0-9_]+)\s+CLONE\s+([a-zA-Z0-9_]+)/i);

  const combinedText = `${allCode} ${title}`;
  const hasDbt = /\bdbt\b|EXECUTE\s+DBT\s+PROJECT/i.test(combinedText);
  const hasAirflow = /\bairflow\b|DAG|SQLExecuteQueryOperator|PythonOperator|@task/i.test(combinedText);
  const hasDuckDb = /\bduckdb\b|iceberg_scan/i.test(combinedText);
  const hasIceberg = /\biceberg\b|parquet|unity catalog|delta lake/i.test(combinedText);

  return {
    table: shortTable,
    whereClause,
    warehouse,
    cloneTarget: cloneMatch ? cloneMatch[1] : `${shortTable.split('.').pop()}_clone`,
    cloneSource: cloneMatch ? cloneMatch[2] : shortTable.split('.').pop(),
    hasDbt,
    hasAirflow,
    hasDuckDb,
    hasIceberg,
  };
}

/**
 * Curated high-precision specifications for flagship pipeline articles.
 */
const CURATED_BLUEPRINTS = {
  'snowflake-dbt-projects-airflow-orchestration': {
    primaryMode: 'trace',
    modes: ['trace', 'incident'],
    kicker: 'Airflow -> Snowflake Native dbt Project',
    subtitle: 'Step through the DAG operators to inspect what crosses the wire into Snowflake.',
    verificationNote:
      "Verify in production: query TABLE(INFORMATION_SCHEMA.QUERY_HISTORY()) filtering QUERY_TEXT ILIKE '%EXECUTE DBT PROJECT%' to confirm runtime duration and warehouse credit attribution per run.",
    toolSlug: 'sql-playground',
    toolLabel: 'Test the verification SQL in the SQL Playground',
    trace: {
      fileLabel: 'dags/snowflake_dbt_native.py',
      leftZone: 'Airflow Worker',
      rightZone: 'Snowflake Warehouse',
      steps: [
        {
          id: 'load_raw',
          line: 18,
          code: 'load_raw = CopyFromExternalStageToSnowflake(table="raw.orders")',
          target: 'COPY INTO raw.orders',
          status: 'External stage ingest',
          payload: "COPY INTO raw.orders FROM @s3_stage FILE_FORMAT = (TYPE = 'PARQUET');",
          duration: '11.4s',
          warehouse: 'INGEST_XS_WH',
          credits: '0.003',
        },
        {
          id: 'chk_raw',
          line: 27,
          code: 'chk_raw = SQLExecuteQueryOperator(sql="SELECT COUNT(*) FROM raw.orders")',
          target: 'Pre-build row guard',
          status: 'Row-count gate passed',
          payload: "SELECT IFF(COUNT(*) > 0, 'PASS', 'FAIL') FROM raw.orders WHERE loaded_at >= CURRENT_DATE();",
          duration: '1.6s',
          warehouse: 'INGEST_XS_WH',
          credits: '0.001',
        },
        {
          id: 'run_dbt',
          line: 36,
          code: 'run_dbt = SQLExecuteQueryOperator(sql="EXECUTE DBT PROJECT ... dbt build")',
          target: 'DBT PROJECT (VERSION$LAST)',
          status: 'Native Snowflake dbt build',
          payload: "EXECUTE DBT PROJECT my_db.my_schema.my_dbt_project ARGS = 'dbt build' VERSION = 'LAST';",
          duration: '38.4s',
          warehouse: 'TRANSFORM_WH',
          credits: '0.011',
        },
        {
          id: 'chk_drift',
          line: 48,
          code: 'chk_drift = SQLExecuteQueryOperator(sql="SELECT ... QUERY_HISTORY()")',
          target: 'Post-run telemetry audit',
          status: 'Audit logged in Snowflake',
          payload: "SELECT query_id, execution_status, total_elapsed_time/1000 AS sec FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY(RESULT_LIMIT => 50));",
          duration: '2.1s',
          warehouse: 'TRANSFORM_WH',
          credits: '0.001',
        },
      ],
    },
  },

  'query-snowflake-in-duckdb-cut-costs': {
    primaryMode: 'billing',
    modes: ['billing', 'trace'],
    kicker: 'Warehouse Billing Minimum vs Local Engine',
    subtitle: 'Compare a 3-second query waking a suspended Snowflake warehouse against a direct DuckDB Iceberg scan.',
    verificationNote:
      'Verify in production: compare SUM(EXECUTION_TIME)/1000 against billed credits in SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY to measure your real idle-resume ratio.',
    toolSlug: 'snowflake-cost-calculator',
    toolLabel: 'Model your warehouse auto-suspend window in the Snowflake Cost Calculator',
    billing: {
      querySeconds: 3,
      minimumSeconds: 60,
      burstCount: 20,
      warehouseLabel: 'Snowflake X-Small (cold resume)',
      altLabel: 'DuckDB iceberg_scan() on S3',
      altNote: '0s warehouse bill (reads Parquet metadata directly)',
    },
  },

  'snowflake-cost-optimization-techniques-2026': {
    primaryMode: 'billing',
    modes: ['billing', 'storage'],
    kicker: 'Auto-Suspend & Pruning Telemetry',
    subtitle: 'Inspect how the 60-second resume floor and micro-partition pruning shape monthly credit burn.',
    verificationNote:
      'Verify in production: set AUTO_SUSPEND = 60 and inspect PARTITIONS_SCANNED / PARTITIONS_TOTAL in SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY.',
    toolSlug: 'snowflake-cost-calculator',
    toolLabel: 'Calculate monthly credit savings in the Snowflake Cost Calculator',
    billing: {
      querySeconds: 4,
      minimumSeconds: 60,
      burstCount: 20,
      warehouseLabel: 'Oversized Warehouse (cold resume)',
      altLabel: 'Right-sized X-Small + 60s suspend',
      altNote: 'Cuts per-resume credit burn by 4x–8x vs Medium/Large',
    },
  },

  'dbt-unit-testing-snowflake-credit-cost': {
    primaryMode: 'billing',
    modes: ['billing', 'trace'],
    kicker: 'CI Warehouse Credit Burn Analyzer',
    subtitle: 'See how sequential short dbt unit tests compound when each CI run wakes a cold warehouse.',
    verificationNote:
      'Verify in production: run dbt test --select tag:unit locally on DuckDB or batch unit tests in a single session so the warehouse only resumes once.',
    toolSlug: 'snowflake-cost-calculator',
    toolLabel: 'Estimate CI test suite credits in the Snowflake Cost Calculator',
    billing: {
      querySeconds: 5,
      minimumSeconds: 60,
      burstCount: 15,
      warehouseLabel: 'Per-PR cold warehouse wakeups',
      altLabel: 'Batched CI session + ephemeral CTEs',
      altNote: 'Shares a single 60s billing window across the suite',
    },
  },

  'how-snowflake-stores-data-internally': {
    primaryMode: 'storage',
    modes: ['storage', 'trace'],
    kicker: 'FDN Micro-Partition & Header Pruning Inspector',
    subtitle: 'Test how Cloud Services prunes FDN min/max metadata headers before warehouse I/O begins.',
    verificationNote:
      "Verify in production: run SELECT SYSTEM$CLUSTERING_INFORMATION('fact_orders', '(order_date)') to inspect overlap depth across micro-partitions.",
    toolSlug: 'sql-playground',
    toolLabel: 'Practice partition-friendly window and filter queries in the SQL Playground',
    storage: {
      table: 'analytics.fact_orders',
      prunedQuery: "SELECT * FROM fact_orders WHERE order_date >= '2026-01-01'",
      unclusteredQuery: "SELECT * FROM fact_orders WHERE status = 'REFUNDED' -- high overlap",
      cowQuery: "UPDATE fact_orders_clone SET status = 'CLOSED' WHERE order_date = '2026-02-14'",
    },
  },

  'snowflake-zero-copy-cloning-problems': {
    primaryMode: 'storage',
    modes: ['storage', 'billing'],
    kicker: 'Zero-Copy Pointer Sharing & Copy-on-Write Divergence',
    subtitle: 'Simulate how a free clone shares micro-partitions at creation and forks independent storage on DML.',
    verificationNote:
      'Verify in production: compare ACTIVE_BYTES and TIME_TRAVEL_BYTES in SNOWFLAKE.ACCOUNT_USAGE.TABLE_STORAGE_METRICS where ID != CLONE_GROUP_ID.',
    toolSlug: 'snowflake-cost-calculator',
    toolLabel: 'Model storage growth and warehouse spend in the Snowflake Cost Calculator',
    storage: {
      table: 'prod_db.public.orders',
      prunedQuery: 'CREATE TABLE orders_clone CLONE orders; -- 0 MB added at creation',
      unclusteredQuery: 'SELECT email FROM orders_clone; -- verify masking policy inheritance',
      cowQuery: "UPDATE orders_clone SET discount = 0 WHERE order_date >= '2026-01-01'; -- forks partition",
    },
  },

  'why-i-stopped-using-snowflake-tasks-orchestration': {
    primaryMode: 'incident',
    modes: ['incident', 'trace'],
    kicker: 'Task Tree Failure & Recovery Comparison',
    subtitle: 'Replay a mid-pipeline failure at step 4 and compare root task re-execution against Airflow Clear Downstream.',
    verificationNote:
      'Verify in production: check SCHEDULED_TIME, STATE, and ERROR_MESSAGE in TABLE(INFORMATION_SCHEMA.TASK_HISTORY()) across child tasks after a failure.',
    toolSlug: 'snowflake-cost-calculator',
    toolLabel: 'Compare duplicate re-run credit costs in the Snowflake Cost Calculator',
    incident: {
      scenarioTitle: '07:02 AM failure at Step 4 (customer_dim): Root resume vs Clear Downstream',
      topLabel: 'Snowflake Task Tree',
      topSub: 'Root re-run repeats steps 1–3',
      bottomLabel: 'Airflow DAG',
      bottomSub: 'Clear from node 4 only',
      steps: ['1. raw_land', '2. stg_clean', '3. scd2_merge', '4. customer_dim', '5. mart_refresh'],
      failIndex: 3,
      topCost: '+4.2 credits (dup MERGE)',
      bottomCost: '0.8 credits (steps 4–5)',
    },
  },

  'dbt-tests-pass-bad-data': {
    primaryMode: 'incident',
    modes: ['incident', 'trace'],
    kicker: 'False-Green Test Gate Inspector',
    subtitle: 'Replay how schema tests (unique, not_null) pass while logic drift and negative revenue rows still ship to marts.',
    verificationNote:
      'Verify in production: pair structural not_null/unique tests with row-level invariant assertions (e.g. net_revenue >= 0 and reconciliation row-count bounds).',
    toolSlug: 'sql-playground',
    toolLabel: 'Write SQL assertion checks in the SQL Playground',
    incident: {
      scenarioTitle: 'dbt test passes not_null(order_id), but negative refund distortion reaches fct_revenue',
      topLabel: 'Structural tests only',
      topSub: 'not_null + unique pass',
      bottomLabel: 'Contract + invariant gate',
      bottomSub: 'Halts before mart publish',
      steps: ['1. stg_orders', '2. not_null(id)', '3. calc_revenue', '4. assert_bounds', '5. fct_revenue'],
      failIndex: 3,
      topCost: 'Silent bad data in BI',
      bottomCost: 'Quarantined at step 4',
    },
  },

  'data-contracts-schema-brekage-guide': {
    primaryMode: 'incident',
    modes: ['incident', 'trace'],
    kicker: 'Upstream Schema Rename & Contract Gate',
    subtitle: 'See where an unannounced column rename breaks downstream transforms vs catching it at the ingestion contract.',
    verificationNote:
      'Verify in production: enforce explicit column contracts and types at the staging boundary before running warehouse MERGE models.',
    toolSlug: 'sql-playground',
    toolLabel: 'Test schema validation queries in the SQL Playground',
    incident: {
      scenarioTitle: 'Upstream renames customer_name -> cust_name before the 06:00 batch run',
      topLabel: 'Uncovered pipeline',
      topSub: 'Fails inside downstream mart',
      bottomLabel: 'Contract-enforced DAG',
      bottomSub: 'Fails fast at schema check',
      steps: ['1. api_extract', '2. schema_contract', '3. stg_customers', '4. dim_customer', '5. exec_report'],
      failIndex: 1,
      topCost: 'Broken mart + 35m debug',
      bottomCost: 'Halted at step 2 (0s waste)',
    },
  },
};

/**
 * Builds a dynamic 4-step execution trace from the article's actual headings and code blocks.
 */
function buildDynamicTrace(sections, snippets, entities, category) {
  const leftZone = entities.hasAirflow
    ? 'Airflow / Scheduler'
    : entities.hasDuckDb
    ? 'Local DuckDB Runtime'
    : 'Pipeline Driver';
  const rightZone = entities.hasIceberg
    ? 'Iceberg / Lakehouse'
    : category.toLowerCase().includes('databricks')
    ? 'Databricks SQL / Spark'
    : 'Snowflake Warehouse';

  // Collect distinct, meaningful lines across all code blocks in the article
  const allStatements = [];
  for (const snip of snippets) {
    for (const stmt of snip.meaningfulLines) {
      if (stmt.length >= 10 && !allStatements.includes(stmt)) {
        allStatements.push(stmt);
      }
    }
  }

  const fallbackStatements = [
    `COPY INTO ${entities.table} FROM @ext_stage FILE_FORMAT = (TYPE = PARQUET)`,
    `SELECT COUNT(*) FROM ${entities.table} WHERE ${entities.whereClause}`,
    entities.hasDbt
      ? "EXECUTE DBT PROJECT ARGS = 'dbt build' VERSION = 'LAST'"
      : `MERGE INTO ${entities.table} tgt USING stg_batch src ON tgt.id = src.id`,
    'SELECT query_id, bytes_scanned FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY())',
  ];

  const steps = [];
  const count = 4;

  for (let i = 0; i < count; i += 1) {
    const sec = sections[i] || null;
    const stepNum = i + 1;

    const rawTitle = sec
      ? sec.title.replace(/^step\s+\d+\s*[:\-–—.]?\s*/i, '').trim()
      : ['Ingest source batch', 'Validate schema & counts', `Transform ${entities.table}`, 'Verify query telemetry'][i];

    const shortLabel = rawTitle.length > 22 ? `${rawTitle.slice(0, 20).trim()}…` : rawTitle;
    const codeLine = allStatements[i] || fallbackStatements[i];

    steps.push({
      id: `step_${stepNum}`,
      line: 10 + i * 11,
      code: codeLine.slice(0, 72),
      target: shortLabel,
      status: `Stage ${stepNum}: ${shortLabel}`,
      payload: codeLine,
      duration: ['8.2s', '1.9s', '24.6s', '1.4s'][i],
      warehouse: entities.warehouse,
      credits: ['0.002', '0.001', '0.007', '0.001'][i],
    });
  }

  return {
    fileLabel: entities.hasAirflow
      ? 'pipeline_dag.py'
      : entities.hasDbt
      ? 'models/pipeline_build.sql'
      : 'warehouse_pipeline.sql',
    leftZone,
    rightZone,
    steps,
  };
}

/**
 * Determines which pipeline instruments apply to an article and returns the
 * complete configuration object, or null if the article is not a data pipeline,
 * warehouse internals, orchestration, or query/cost engineering tutorial.
 */
export function extractPipelineInstrument(post = {}, slug = '') {
  const cleanSlug = String(slug || post?.slug || '')
    .trim()
    .replace(/^\/articles\//, '')
    .replace(/\/+$/, '');

  const title = stripTags(post?.title || '');
  const content = String(post?.content || '');
  const category = String(post?.category || '');
  const tagList = Array.isArray(post?.tags)
    ? post.tags.map((t) => (typeof t === 'string' ? t : t?.name || t?.slug || '')).join(' ')
    : '';

  const sections = extractArticleSections(content);
  const snippets = extractArticleCodeSnippets(content);
  const entities = detectSqlEntities(snippets, title);

  // 1. Check curated blueprint first
  if (CURATED_BLUEPRINTS[cleanSlug]) {
    const preset = CURATED_BLUEPRINTS[cleanSlug];
    return {
      slug: cleanSlug,
      isCurated: true,
      primaryMode: preset.primaryMode,
      modes: preset.modes,
      kicker: preset.kicker,
      subtitle: preset.subtitle,
      verificationNote: preset.verificationNote,
      toolSlug: preset.toolSlug,
      toolLabel: preset.toolLabel,
      trace: preset.trace || buildDynamicTrace(sections, snippets, entities, category),
      billing: preset.billing || {
        querySeconds: 3,
        minimumSeconds: 60,
        burstCount: 20,
        warehouseLabel: `${entities.warehouse} (cold resume)`,
        altLabel: 'Batched or local execution',
        altNote: 'Avoids repeated 60-second minimum idle tails',
      },
      storage: preset.storage || {
        table: entities.table,
        prunedQuery: `SELECT * FROM ${entities.table} WHERE ${entities.whereClause}`,
        unclusteredQuery: `SELECT * FROM ${entities.table} -- unclustered full scan`,
        cowQuery: `UPDATE ${entities.cloneTarget} SET updated_at = CURRENT_TIMESTAMP()`,
      },
      incident: preset.incident || {
        scenarioTitle: `Mid-pipeline failure recovery on ${entities.table}`,
        topLabel: 'Root Re-execution',
        topSub: 'Repeats upstream steps 1–3',
        bottomLabel: 'Targeted Task Clear',
        bottomSub: 'Resumes from failed step 4',
        steps: ['1. raw_ingest', '2. stg_validate', '3. core_merge', '4. mart_publish', '5. audit_check'],
        failIndex: 3,
        topCost: '+3.8 credits (duplicate I/O)',
        bottomCost: '0.7 credits (targeted)',
      },
    };
  }

  // 2. Check for explicit WordPress shortcode / data-attribute hook in future posts
  const hookMatch = content.match(/data-pipeline-instrument=["'](trace|billing|storage|incident)["']/i);

  // 3. Guardrail: never attach warehouse/pipeline schematics to interview question
  // lists, certification prep, career opinion pieces, or general AI coding/CLI tutorials.
  const excludedTitlePattern =
    /\b(interview|certification|certifications|snowpro|passed\s+the|resume|salary|claude\s+code|copilot|cursor|prompt\s+engineering|ai\s+concepts|autonomous\s+agent|agent\s+loops|loop\s+engineering|tools\s+vs\s+subagents|real\s+memory|fastmcp|2extract|agentforce|portfolio\s+projects)\b/i;
  if (excludedTitlePattern.test(`${cleanSlug} ${title}`) && !hookMatch) {
    return null;
  }

  // Require clear Data Engineering / Warehouse / Lakehouse / Orchestration context in title or category
  const hasDeTitleOrCategory =
    /\b(snowflake|dbt|airflow|prefect|dagster|databricks|spark|pyspark|duckdb|iceberg|delta\s+lake|synapse|fabric|bigquery|redshift|dataflow|kafka|etl|elt|pipeline|pipelines|warehouse|medallion|star\s+schema|scd2|data\s+contract|data\s+quality|micro-partition|time\s+travel|zero-copy|clone|cloning|dynamic\s+table|openflow|cortex\s+search|cortex\s+code|cortex\s+cost)\b/i.test(
      `${title} ${category}`
    );

  if (!hasDeTitleOrCategory && !hookMatch) {
    return null;
  }

  // Require at least 1 real code block (unless explicitly hooked) so prose essays stay pure prose
  if (snippets.length === 0 && !hookMatch) {
    return null;
  }

  const corpus = `${title} ${category} ${tagList} ${sections.map((s) => s.title).join(' ')} ${snippets
    .map((s) => s.fullText)
    .join(' ')}`.toLowerCase();

  const hasBillingSignal =
    /\b(auto_suspend|credit|credits|cost|costs|billing|warehouse size|x-small|resource monitor|duckdb|cut your bill|pricing|token cost|token costs|finops)\b/.test(
      corpus
    );
  const hasStorageSignal =
    /\b(micro-partition|partition|fdn|prun|cluster by|zero-copy|clone|time travel|fail-safe|iceberg|delta lake|parquet|dynamic table|masking|row access)\b/.test(
      corpus
    );
  const hasIncidentSignal =
    /\b(airflow|dag|task_history|snowflake task|prefect|dbt test|unit test|contract|schema break|retry|scd2|stream|audit|orchestrat)\b/.test(
      corpus
    );

  const modes = [];
  if (hookMatch) {
    modes.push(hookMatch[1].toLowerCase());
  }
  if (snippets.length >= 1 && !modes.includes('trace')) modes.push('trace');
  if (hasBillingSignal && !modes.includes('billing')) modes.push('billing');
  if (hasStorageSignal && !modes.includes('storage')) modes.push('storage');
  if (hasIncidentSignal && !modes.includes('incident')) modes.push('incident');

  if (modes.length === 0) return null;

  if (modes.length === 1) {
    if (modes[0] !== 'trace') modes.push('trace');
    else if (hasStorageSignal) modes.push('storage');
    else if (hasBillingSignal) modes.push('billing');
    else modes.push('incident');
  }

  let primaryMode = modes[0];
  if (!hookMatch) {
    if (/\b(cost|costs|bill|bills|credit|credits|duckdb|pricing)\b/i.test(title) && modes.includes('billing')) {
      primaryMode = 'billing';
    } else if (/\b(partition|internally|clone|cloning|time travel|iceberg|delta|dynamic table|schema)\b/i.test(title) && modes.includes('storage')) {
      primaryMode = 'storage';
    } else if (/\b(task|airflow|prefect|test|contract|retry|stopped using|scd2|stream|etl|orchestrat)\b/i.test(title) && modes.includes('incident')) {
      primaryMode = 'incident';
    }
  }

  const orderedModes = [primaryMode, ...modes.filter((m) => m !== primaryMode)].slice(0, 3);

  const toolSlug = hasBillingSignal
    ? 'snowflake-cost-calculator'
    : category.toLowerCase().includes('databricks')
    ? 'databricks-cost-calculator'
    : 'sql-playground';

  const toolLabel =
    toolSlug === 'snowflake-cost-calculator'
      ? 'Model warehouse credits for this pattern in the Snowflake Cost Calculator'
      : toolSlug === 'databricks-cost-calculator'
      ? 'Estimate cluster DBU spend in the Databricks Cost Calculator'
      : 'Run and modify these SQL patterns in the browser SQL Playground';

  return {
    slug: cleanSlug,
    isCurated: false,
    primaryMode,
    modes: orderedModes,
    kicker: `Interactive Pipeline Schematic · ${category || 'Data Engineering'}`,
    subtitle: `Derived from the SQL, operators, and table boundaries (${entities.table}) in this guide.`,
    verificationNote: `Verify in production: inspect execution metrics and bytes scanned for ${entities.table} in INFORMATION_SCHEMA.QUERY_HISTORY() before promoting to production schedules.`,
    toolSlug,
    toolLabel,
    trace: buildDynamicTrace(sections, snippets, entities, category),
    billing: {
      querySeconds: 3,
      minimumSeconds: 60,
      burstCount: 20,
      warehouseLabel: `${entities.warehouse} (cold resume)`,
      altLabel: entities.hasDuckDb ? 'DuckDB direct scan' : 'Right-sized / batched session',
      altNote: 'Eliminates repeated 60-second minimum idle billing windows',
    },
    storage: {
      table: entities.table,
      prunedQuery: `SELECT * FROM ${entities.table} WHERE ${entities.whereClause}`,
      unclusteredQuery: `SELECT * FROM ${entities.table} -- unclustered scan across partitions`,
      cowQuery: `UPDATE ${entities.cloneTarget} SET processed_at = CURRENT_TIMESTAMP()`,
    },
    incident: {
      scenarioTitle: `Pipeline failure & recovery boundary on ${entities.table}`,
      topLabel: 'Full Root Re-run',
      topSub: 'Re-executes upstream steps 1–3',
      bottomLabel: 'Targeted Downstream Clear',
      bottomSub: 'Preserves upstream state, runs 4–5',
      steps: ['1. ingest_raw', '2. schema_guard', `3. merge_${entities.table.split('.').pop().slice(0, 8)}`, '4. publish_mart', '5. audit_log'],
      failIndex: 3,
      topCost: '+3.6 credits (duplicate work)',
      bottomCost: '0.6 credits (targeted)',
    },
  };
}

export default extractPipelineInstrument;
