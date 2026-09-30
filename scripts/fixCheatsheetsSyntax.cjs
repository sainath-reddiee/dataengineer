const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/cheatsheetData.js');
let content = fs.readFileSync(filePath, 'utf8');

function insertSectionsBeforeRelatedSlugs(content, cheatsheetSlug, newSections) {
  // Find the cheatsheet slug
  const slugIdx = content.indexOf(`slug: '${cheatsheetSlug}'`);
  if (slugIdx === -1) {
    console.log(`❌ Could not find ${cheatsheetSlug}`);
    return content;
  }
  
  // Find the "relatedSlugs:" that comes after this cheatsheet
  const relatedSlugsIdx = content.indexOf('relatedSlugs:', slugIdx);
  if (relatedSlugsIdx === -1) {
    console.log(`❌ Could not find relatedSlugs for ${cheatsheetSlug}`);
    return content;
  }
  
  // Find the end of the sections array - it's right before relatedSlugs
  // Look backwards from relatedSlugs for the closing ] of sections
  let searchPos = relatedSlugsIdx;
  let bracketCount = 0;
  let foundSectionsEnd = false;
  let sectionsEndIdx = -1;
  
  // Search backwards from relatedSlugs
  for (let i = relatedSlugsIdx - 1; i >= 0; i--) {
    const ch = content[i];
    
    if (ch === ']') {
      if (bracketCount === 0) {
        sectionsEndIdx = i + 1;
        foundSectionsEnd = true;
        break;
      }
      bracketCount++;
    } else if (ch === '[') {
      bracketCount--;
      if (bracketCount < 0) {
        // This might be the start of sections
      }
    }
  }
  
  if (!foundSectionsEnd || sectionsEndIdx === -1) {
    console.log(`❌ Could not find sections end for ${cheatsheetSlug}`);
    return content;
  }
  
  // The sections array ends at sectionsEndIdx (inclusive)
  // We need to insert before this closing bracket
  // First, check what's right before the closing bracket
  let insertPos = sectionsEndIdx;
  
  // Check if there's a trailing comma before the ]
  let checkPos = sectionsEndIdx - 1;
  while (checkPos >= 0 && /\s/.test(content[checkPos])) {
    checkPos--;
  }
  
  // If there's already a comma, we need to insert before it
  // If not, we need to add a comma to the last element
  if (content[checkPos] === ',') {
    // Good, there's already a comma on the last element
    insertPos = sectionsEndIdx;
  } else {
    // Need to add comma to the last element before inserting
    // Find the last non-whitespace character before ]
    let lastContentPos = checkPos;
    while (lastContentPos >= 0 && /\s/.test(content[lastContentPos])) {
      lastContentPos--;
    }
    // Insert comma at lastContentPos + 1
    content = content.slice(0, lastContentPos + 1) + ',' + content.slice(lastContentPos + 1);
    // Adjust relatedSlugsIdx and sectionsEndIdx
    const shift = 1;
    insertPos = sectionsEndIdx + shift;
  }
  
  // Format new sections
  const indent = '      ';
  const sectionsStr = newSections.map(s => 
    indent + JSON.stringify(s, null, 2).split('\n').join('\n' + indent)
  ).join(',\n');
  
  // Insert before the closing ]
  content = content.slice(0, insertPos) + ',\n' + sectionsStr + '\n' + content.slice(insertPos);
  
  console.log(`✅ Expanded ${cheatsheetSlug}`);
  return content;
}

// ============================================================================
// NEW SECTIONS FOR SNOWFLAKE BEST PRACTICES
// ============================================================================
const snowflakeSections = [
  {
    title: 'Data Modeling & Governance',
    type: 'checklist',
    items: [
      { label: 'Adopt a consistent naming convention', detail: 'Use snake_case for tables/columns. Prefix: dim_ for dimensions, fct_ for facts, stg_ for staging. Include business domain: fct_sales_orders, dim_customer.', checked: true },
      { label: 'Define primary keys on every table', detail: 'Snowflake does not enforce PK constraints but they enable optimizer hints, referential integrity checks, and BI tool integration. Use CREATE TABLE ... PRIMARY KEY (id) NOT ENFORCED.', checked: true },
      { label: 'Use clustering keys for large fact tables', detail: 'For tables > 100GB queried by date ranges, add CLUSTER BY (event_date, tenant_id). Verify pruning with EXPLAIN and QUERY_PROFILE before committing.', checked: true },
      { label: 'Document column-level descriptions', detail: 'Use COMMENT ON COLUMN for business definitions. This feeds data catalogs (Snowflake Data Governance, Atlan, DataHub) and enables self-service discovery.', checked: true },
      { label: 'Partition by time for event tables', detail: 'Use partitioned tables (CREATE TABLE ... PARTITION BY RANGE (event_date)) for immutable event streams. Enables partition pruning and fast DROP PARTITION for retention policies.', checked: false },
    ]
  },
  {
    title: 'Advanced Security Patterns',
    type: 'callout',
    items: [
      { variant: 'tip', title: 'Row Access Policies for Multi-Tenancy', body: 'Create a mapping table tenant_id to role, then a row access policy that filters rows WHERE tenant_id IN (SELECT tenant_id FROM tenant_role_map WHERE role = CURRENT_ROLE()). This scales to thousands of tenants without schema changes.' },
      { variant: 'tip', title: 'Dynamic Masking for PII', body: 'CREATE MASKING POLICY email_mask AS (val STRING) RETURNS STRING -> CASE WHEN IS_ROLE_IN_SESSION(\'ANALYST\') THEN val ELSE REGEXP_REPLACE(val, \'.(?=.*@)\', \'*\') END. Apply to columns with ALTER TABLE ... MODIFY COLUMN email SET MASKING POLICY email_mask.' },
      { variant: 'warning', title: 'Avoid Over-Granting ACCOUNTADMIN', body: 'ACCOUNTADMIN bypasses all masking and row access policies. Create a SECURITYADMIN role for day-to-day security management and use ACCOUNTADMIN only for initial setup and emergency recovery.' },
      { variant: 'info', title: 'Object Tagging for Classification', body: 'CREATE TAG pii_level ALLOWED_VALUES \'high\', \'medium\', \'low\', \'none\'. Tag tables/columns: ALTER TABLE customers SET TAG pii_level = \'high\'. Query tags for compliance reporting: SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES WHERE TAG_NAME = \'PII_LEVEL\'.' },
    ]
  },
  {
    title: 'Developer Experience',
    type: 'tips',
    items: [
      'Use Snowflake CLI (snow) for local development - deploy SQL, test queries, and manage objects from VS Code',
      'Enable Snowflake Extension for VS Code: syntax highlighting, autocomplete, and one-click query execution',
      'Use dbt Cloud or dbt Core with Snowflake adapter for transformation layer - keeps business logic version-controlled',
      'Set up CI/CD with GitHub Actions + Snowflake Action: deploy schema changes, run dbt tests, validate with SQLFluff',
      'Use Database Roles for application access: CREATE DATABASE ROLE app_reader; GRANT USAGE ON SCHEMA analytics TO DATABASE ROLE app_reader; GRANT DATABASE ROLE app_reader TO ROLE airflow_service;',
      'Leverage Snowflake Scripting for procedural logic - stored procedures with loops, conditionals, and transactions',
      'Use Snowsight worksheets for ad-hoc analysis and share via links - replaces BI tool for quick exploratory queries',
      'Set QUERY_TAG at session start: ALTER SESSION SET QUERY_TAG = \'app:payment_service,user:jdoe\'. Enables full cost attribution per API call.',
    ]
  },
  {
    title: 'Monitoring & Observability',
    type: 'checklist',
    items: [
      { label: 'Set up Query Acceleration Service (QAS) for eligible workloads', detail: 'QAS offloads large scans to shared compute. Enable for warehouses running ad-hoc analytics. Monitor with WAREHOUSE_METERING_HISTORY where IS_QAS = TRUE.', checked: true },
      { label: 'Alert on warehouse credit burn rate', detail: 'Create a task that queries WAREHOUSE_METERING_HISTORY hourly and alerts if credits > threshold. Use Snowflake Alerts (GA 2024) or external monitoring.', checked: true },
      { label: 'Track slow queries with QUERY_HISTORY', detail: 'Schedule a daily task to aggregate EXECUTION_TIME > 60000ms queries. Feed into dashboard for query optimization prioritization.', checked: true },
      { label: 'Monitor storage growth by schema', detail: 'Query STORAGE_USAGE daily. Set alerts on schemas growing > 10% week-over-week. Often reveals forgotten temp tables or unpartitioned event tables.', checked: true },
      { label: 'Enable Search Optimization Service selectively', detail: 'Only on large tables with high-cardinality equality filters (e.g., user_id lookups). Monitor with SEARCH_OPTIMIZATION_HISTORY - it can add significant storage cost.', checked: false },
    ]
  }
];

// ============================================================================
// NEW SECTIONS FOR DBT BEST PRACTICES
// ============================================================================
const dbtSections = [
  {
    title: 'Advanced Testing Patterns',
    type: 'checklist',
    items: [
      { label: 'Contract tests for interface stability', detail: 'Use dbt contracts (dbt_project.yml + model config) to enforce column types and non-nullability. Breaking a contract fails CI before bad data hits prod. Enable with contract.enforced: true.', checked: true },
      { label: 'Data freshness tests on all sources', detail: 'sources.yml: freshness: { warn_after: { count: 6, period: hour }, error_after: { count: 12, period: hour } }. Run dbt source freshness in CI. Alert on stale sources before models build.', checked: true },
      { label: 'Unit tests for complex transformations', detail: 'dbt unit testing (v1.7+): write test cases with mock inputs and expected outputs for macros and models. dbt test --select unit_test_* runs fast, isolated tests without a warehouse.', checked: true },
      { label: 'Anomaly detection with elementary', detail: 'Install elementary (dbt package) for automated anomaly detection: volume drops, schema changes, null spikes. Generates Slack alerts and a monitoring dashboard. Zero-config for common patterns.', checked: true },
      { label: 'Mutation testing for critical models', detail: 'Intentionally break a model (e.g., change join type) and verify tests catch it. If tests pass, they are not testing the right thing. Do this quarterly for fct_ and dim_ models.', checked: false },
    ]
  },
  {
    title: 'Performance Tuning',
    type: 'callout',
    items: [
      { variant: 'tip', title: 'Partition Incremental Models by Date', body: 'For large fact tables, use partition_by: [\'date_day\'] in model config. Snowflake will partition the table, enabling partition pruning and fast merges. Combine with cluster_by for compound optimization.' },
      { variant: 'tip', title: 'Use ephemeral Models for Staging Logic', body: 'When a staging model is only referenced once downstream, set materialized: ephemeral. It compiles as a CTE in the downstream model, avoiding a view creation and reducing object count.' },
      { variant: 'warning', title: 'Avoid Cross-Join Explosions', body: 'A single missing join condition in an intermediate model can explode row counts 1000x. Add row count assertions: expect_table_row_count_to_be_between with realistic bounds. Run in CI with --store-failures.' },
      { variant: 'info', title: 'Leverage dbt Semantic Layer (Metrics)', body: 'Define metrics in metrics.yml: metric(name, type, sql, dimensions). Query via dbt Semantic Layer API (JDBC/ODBC) or MetricFlow. Ensures consistent metric definitions across BI tools and reverse ETL.' },
    ]
  },
  {
    title: 'Team Workflows & Governance',
    type: 'checklist',
    items: [
      { label: 'Code owners for model directories', detail: 'Create .github/CODEOWNERS: models/marts/finance/ @finance-team. PRs modifying finance marts require finance-team review. Prevents accidental breaking changes to critical models.', checked: true },
      { label: 'Standardize dbt project template', detail: 'Create a cookiecutter template with: project structure, dbt_project.yml defaults, CI workflow, dbt-packages.yml, and docs. New repos inherit best practices automatically.', checked: true },
      { label: 'Document column-level lineage for critical models', detail: 'Use dbt docs generate + dbt docs serve. Add column-level descriptions in schema.yml. For PII columns, add tags: {pii: true, regulation: gdpr}. Enables automated compliance reporting.', checked: true },
      { label: 'Use dbt Mesh for multi-project architectures', detail: 'When models exceed ~2000 or teams need autonomy, split into upstream (core) and downstream (domain) projects. dbt Mesh (dbt Cloud) enables cross-project ref() with version pinning.', checked: false },
      { label: 'Run dbt check on every PR', detail: 'dbt check validates SQL syntax, references, and tests without a warehouse. Fast feedback (< 2 min) in CI. Catches typos, missing refs, and config errors before build.', checked: true },
    ]
  },
  {
    title: 'Migration & Upgrade Strategies',
    type: 'tips',
    items: [
      'Migrate from views to incremental incrementally: add materialized=incremental + unique_key, deploy, verify, then add on_schema_change',
      'When upgrading dbt versions, read the migration guide for breaking changes (e.g., v1.5: source() rendering, v1.7: unit tests, v1.8: Python models)',
      'Use dbt-deprecation package to find deprecated features in your project before upgrading',
      'For Snowflake: set query_tag in on-run-start/on-run-end hooks for full query attribution',
      'Use dbt-osmosis to auto-generate column-level descriptions from model SQL (experimental but promising)',
      'If using dbt Cloud, enable "Run generate docs on every job" for always-up-to-date documentation',
      'Store manifest.json from prod in versioned S3 bucket - enables point-in-time state:modified and rollback capability',
    ]
  }
];

// ============================================================================
// NEW SECTIONS FOR AIRFLOW BEST PRACTICES
// ============================================================================
const airflowSections = [
  {
    title: 'Advanced DAG Patterns',
    type: 'checklist',
    items: [
      { label: 'Use dynamic task mapping for parallel workloads', detail: 'Airflow 2.3+: @task.map() creates parallel tasks from a list. Example: @task.map def process_partition(partition): ... then process_partition.expand(partition=partitions_list). Replaces manual task generation loops.', checked: true },
      { label: 'Implement DAG-level SLAs and SLA miss callbacks', detail: 'dag = DAG(..., sla=timedelta(hours=2), sla_miss_callback=alert_on_sla_miss). SLA misses trigger alert_on_sla_miss(dag, task_list, blocking_task_list, ...). Essential for production SLAs.', checked: true },
      { label: 'Use Dataset-driven scheduling (Airflow 2.4+)', detail: 'Define outlets=[Dataset("s3://bucket/table")] on producer tasks. Consumer DAGs use schedule=[Dataset("s3://bucket/table")]. Removes time-based coupling - consumers run when data lands.', checked: true },
      { label: 'Version DAGs with semantic versioning', detail: 'Add __version__ = "1.2.0" to DAG file. Include in task_id: task_id="extract_v{__version__}". Enables running multiple DAG versions simultaneously during migration.', checked: true },
      { label: 'Use deferrable operators for long-running async tasks', detail: 'Airflow 2.2+: operators with deferrable=True (e.g., SnowflakeOperator, BigQueryExecuteQueryOperator) release the worker slot while polling. Reduces worker count by 50-80% for sensor-heavy DAGs.', checked: true },
    ]
  },
  {
    title: 'Observability & Debugging',
    type: 'callout',
    items: [
      { variant: 'tip', title: 'Structured Logging with OpenLineage', body: 'Install openlineage-airflow. Emits lineage events (input/output datasets, job/run facets) to OpenLineage backend (Marquez, DataHub, Atlan). Automatic column-level lineage for SQL operators.' },
      { variant: 'tip', title: 'Custom XCom Backend for Large Payloads', body: 'Default XCom stores in metadata DB (1GB limit). For large data, set xcom_backend = airflow.providers.amazon.aws.xcom.s3.S3XComBackend. Serializes XCom to S3, stores reference in DB.' },
      { variant: 'warning', title: 'Do Not Use XCom for Data Transfer', body: 'XCom is for metadata (file paths, row counts, status). Never pass DataFrames or large JSON between tasks. Write to S3/GCS, pass the path via XCom. Airflow 2.4+ warns on large XCom.' },
      { variant: 'info', title: 'Use Airflow UI REST API for Custom Dashboards', body: 'GET /api/v1/dags/{dag_id}/dagRuns?state=failed&order_by=-execution_date. Build custom incident dashboards. Requires RBAC user with DagRunReader role.' },
    ]
  },
  {
    title: 'Production Operations',
    type: 'checklist',
    items: [
      { label: 'Set up PagerDuty/Opsgenie integration for critical DAGs', detail: 'Use airflow.providers.pagerduty.operators.pagerduty.PagerDutyEventOperator in on_failure_callback. Include dag_id, task_id, execution_date, and error message in alert.', checked: true },
      { label: 'Implement DAG lifecycle: dev to staging to prod', detail: 'Separate Airflow environments. Promote DAGs via CI/CD: lint to test to deploy to staging to integration test to promote to prod. Use variables/connections per environment.', checked: true },
      { label: 'Regular metadata DB maintenance', detail: 'Purge old dag runs: airflow db clean --dag-ids dag1,dag2 --before-date 2024-01-01. Vacuum/analyze metadata DB weekly. Monitor dag_run table size - it grows unbounded.', checked: true },
      { label: 'Use provider packages, not custom operators', detail: 'Prefer airflow.providers.* operators (Snowflake, DBT, Great Expectations, Slack). They handle auth, retries, and serialization. Custom operators are technical debt.', checked: true },
      { label: 'Capacity planning: worker concurrency vs parallelism', detail: 'parallelism (scheduler) controls total concurrent tasks. dag_concurrency (DAG) limits per-DAG tasks. worker_concurrency (worker) limits per-worker. Tune together: parallelism = workers * worker_concurrency.', checked: true },
    ]
  },
  {
    title: 'Security Hardening',
    type: 'tips',
    items: [
      'Enable RBAC UI: create roles (DAG Author, DAG Runner, Admin) with granular permissions. Restrict DAG editing to authors, execution to runners.',
      'Use Kerberos/OIDC for webserver auth. Disable Flask default auth. Set auth_backend = airflow.api_fastapi.lib.auth.fab_auth_manager in airflow.cfg.',
      'Rotate Fernet key annually: airflow rotate-fernet-key. Old encrypted connections/variables become unreadable - plan migration window.',
      'Store secrets in HashiCorp Vault / AWS Secrets Manager / GCP Secret Manager. Use airflow.providers.hashicorp.secrets.vault.VaultBackend.',
      'Enable SSL/TLS for all Airflow components: webserver, scheduler, worker, triggerer, flower. Use cert-manager for automatic cert renewal.',
      'Audit log all DAG changes: enable audit log in Airflow 2.8+ or use post-write hooks to send to SIEM.',
    ]
  }
];

// Apply the function
function applyExpansion(content, slug, sections) {
  const slugIdx = content.indexOf(`slug: '${slug}'`);
  if (slugIdx === -1) {
    console.log(`❌ Could not find ${slug}`);
    return content;
  }
  
  // Find relatedSlugs for this cheatsheet
  const relatedSlugsIdx = content.indexOf('relatedSlugs:', slugIdx);
  if (relatedSlugsIdx === -1) {
    console.log(`❌ Could not find relatedSlugs for ${slug}`);
    return content;
  }
  
  // Find the closing ] of sections array by searching backwards from relatedSlugs
  let bracketCount = 0;
  let found = false;
  let sectionsEndIdx = -1;
  
  for (let i = relatedSlugsIdx - 1; i >= 0; i--) {
    const ch = content[i];
    if (ch === ']') {
      if (bracketCount === 0) {
        // Found the end of sections array
        sectionsEndIdx = i;
        found = true;
        break;
      }
      bracketCount++;
    } else if (ch === '[') {
      bracketCount--;
    }
  }
  
  if (!found || sectionsEndIdx === -1) {
    console.log(`❌ Could not find sections end for ${slug}`);
    return content;
  }
  
  // Check if there's already a comma before the ]
  let checkPos = sectionsEndIdx - 1;
  while (checkPos >= 0 && /\s/.test(content[checkPos])) {
    checkPos--;
  }
  
  let needsComma = false;
  if (content[checkPos] !== ',') {
    needsComma = true;
  }
  
  let insertPos = sectionsEndIdx;
  if (needsComma) {
    // Add comma to the last element
    content = content.slice(0, checkPos + 1) + ',' + content.slice(checkPos + 1);
    insertPos = sectionsEndIdx + 1;
  }
  
  // This will be set by caller
  return { content, insertPos, needsComma };
}

// Let's do a simpler approach - just use regex to find and replace
function expandCheatsheet(content, slug, newSections) {
  // Find the pattern: slug + everything up to relatedSlugs
  const slugPattern = new RegExp(`(slug: '${slug}'[\\s\\S]*?relatedSlugs:)`);
  const match = content.match(slugPattern);
  
  if (!match) {
    console.log(`❌ Pattern not found for ${slug}`);
    return content;
  }
  
  const beforeRelatedSlugs = match[1];
  const startIdx = content.indexOf(beforeRelatedSlugs);
  const relatedSlugsIdx = startIdx + beforeRelatedSlugs.length;
  
  // Find the sections array end by searching backwards from relatedSlugsIdx
  let bracketCount = 0;
  let found = false;
  let sectionsEndIdx = -1;
  
  for (let i = relatedSlugsIdx - 1; i >= startIdx; i--) {
    const ch = content[i];
    if (ch === ']') {
      if (bracketCount === 0) {
        sectionsEndIdx = i;
        found = true;
        break;
      }
      bracketCount++;
    } else if (ch === '[') {
      bracketCount--;
    }
  }
  
  if (!found || sectionsEndIdx === -1) {
    console.log(`❌ Could not find sections end for ${slug}`);
    return content;
  }
  
  // Check for comma before ]
  let checkPos = sectionsEndIdx - 1;
  while (checkPos >= 0 && /\s/.test(content[checkPos])) {
    checkPos--;
  }
  
  let insertPos = sectionsEndIdx;
  if (content[checkPos] !== ',') {
    content = content.slice(0, checkPos + 1) + ',' + content.slice(checkPos + 1);
    insertPos = sectionsEndIdx + 1;
  } else {
    insertPos = sectionsEndIdx;
  }
  
  const indent = '      ';
  const sectionsStr = newSections.map(s => 
    indent + JSON.stringify(s, null, 2).split('\n').join('\n' + indent)
  ).join(',\n');
  
  content = content.slice(0, insertPos) + ',\n' + sectionsStr + '\n' + content.slice(insertPos);
  console.log(`✅ Expanded ${slug}`);
  return content;
}

let fileContent = fs.readFileSync(filePath, 'utf8');

fileContent = expandCheatsheet(fileContent, 'snowflake-best-practices', snowflakeSections);
fileContent = expandCheatsheet(fileContent, 'dbt-best-practices', dbtSections);
fileContent = expandCheatsheet(fileContent, 'airflow-best-practices', airflowSections);

fs.writeFileSync(filePath, fileContent);
console.log('\n✅ All 3 cheatsheets expanded!');