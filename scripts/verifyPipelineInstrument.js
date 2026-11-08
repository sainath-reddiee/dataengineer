import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractPipelineInstrument,
  extractArticleCodeSnippets,
  extractArticleSections,
} from '../src/utils/extractPipelineInstrument.js';
import { isReviewAllowlistedTool } from '../src/data/adsenseQualityGate.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

// 1. Flagship curated articles map to their exact engineering archetypes
const airflowDbt = extractPipelineInstrument(
  { title: 'Orchestrating Snowflake dbt Projects with Airflow' },
  'snowflake-dbt-projects-airflow-orchestration'
);
assert(airflowDbt && airflowDbt.primaryMode === 'trace', 'Airflow+dbt post must default to trace mode');
assert(airflowDbt.trace.steps.length === 4, 'Airflow+dbt trace must include 4 pipeline steps');
assert(
  airflowDbt.trace.steps.some((s) => s.payload.includes('EXECUTE DBT PROJECT')),
  'Airflow+dbt trace must include EXECUTE DBT PROJECT wire payload'
);
assert(isReviewAllowlistedTool(airflowDbt.toolSlug), 'Airflow+dbt companion tool must be AdSense allowlisted');

const duckdbCost = extractPipelineInstrument(
  { title: 'How to Query Snowflake in DuckDB (and Cut Your Bill)' },
  'query-snowflake-in-duckdb-cut-costs'
);
assert(duckdbCost && duckdbCost.primaryMode === 'billing', 'DuckDB cost post must default to 60s billing mode');
assert(duckdbCost.billing.minimumSeconds === 60, 'Billing mode must model the 60s minimum');
assert(isReviewAllowlistedTool(duckdbCost.toolSlug), 'DuckDB companion tool must be AdSense allowlisted');

const storagePost = extractPipelineInstrument(
  { title: 'How Snowflake Stores Data Internally: Micro-Partitions, FDN Pruning' },
  'how-snowflake-stores-data-internally'
);
assert(storagePost && storagePost.primaryMode === 'storage', 'Internals post must default to FDN storage mode');
assert(storagePost.storage.prunedQuery.includes('fact_orders'), 'Storage mode must include fact_orders pruning query');

const tasksPost = extractPipelineInstrument(
  { title: 'Why I Stopped Using Snowflake Tasks for Orchestration' },
  'why-i-stopped-using-snowflake-tasks-orchestration'
);
assert(tasksPost && tasksPost.primaryMode === 'incident', 'Tasks post must default to incident recovery diff');
assert(tasksPost.incident.failIndex === 3, 'Tasks incident must highlight mid-chain failure at step 4');

// 2. Dynamic extraction for future WordPress posts (no slug in curated map)
const futureHtml = `
  <h2>Step 1: Ingest Kafka events into S3 Iceberg</h2>
  <p>Land raw events into the lakehouse table.</p>
  <pre><code class="language-sql">COPY INTO lakehouse.events_raw FROM @kafka_stage FILE_FORMAT = (TYPE = PARQUET);</code></pre>
  <h2>Step 2: Filter active partitions on ANALYTICS_WH</h2>
  <p>Prune partitions by event_timestamp.</p>
  <pre><code class="language-sql">SELECT event_id, user_id FROM lakehouse.events_raw WHERE event_timestamp >= '2026-06-01';</code></pre>
  <h2>Step 3: Merge into customer session mart</h2>
  <pre><code class="language-sql">MERGE INTO lakehouse.fct_sessions USING lakehouse.events_raw ON session_id;</code></pre>
`;

const snippets = extractArticleCodeSnippets(futureHtml);
const sections = extractArticleSections(futureHtml);
assert(snippets.length === 3, `expected 3 extracted code snippets, got ${snippets.length}`);
assert(sections.length === 3, `expected 3 extracted sections, got ${sections.length}`);

const futureSpec = extractPipelineInstrument(
  {
    title: 'Streaming Iceberg Partition Pruning on Snowflake',
    content: futureHtml,
    category: 'Snowflake',
    tags: ['Iceberg', 'SQL'],
  },
  'future-streaming-iceberg-post-2027'
);
assert(futureSpec !== null, 'Future technical post with SQL and steps must generate a dynamic instrument');
assert(futureSpec.primaryMode === 'storage', `Expected storage primary mode from title, got ${futureSpec.primaryMode}`);
assert(futureSpec.modes.includes('trace'), 'Future post with steps and code must also offer trace view');
assert(
  futureSpec.storage.prunedQuery.includes('lakehouse.events_raw'),
  `Dynamic storage query should extract real table name lakehouse.events_raw, got: ${futureSpec.storage.prunedQuery}`
);
assert(
  futureSpec.storage.prunedQuery.includes("event_timestamp >= '2026-06-01'"),
  `Dynamic storage query should extract real WHERE clause, got: ${futureSpec.storage.prunedQuery}`
);
assert(
  isReviewAllowlistedTool(futureSpec.toolSlug),
  `Dynamic companion tool (${futureSpec.toolSlug}) must be AdSense allowlisted`
);

// 3. Explicit WordPress HTML data-attribute hook override
const hookedSpec = extractPipelineInstrument(
  {
    title: 'Custom Pipeline Notes',
    content: '<div data-pipeline-instrument="billing"></div><p>Short note on credits.</p>',
    category: 'Snowflake',
  },
  'custom-hooked-post'
);
assert(hookedSpec && hookedSpec.primaryMode === 'billing', 'Explicit data-pipeline-instrument hook must select billing');

// 4. Non-technical certification/career/AI-coding posts return null (no thin boilerplate)
const opinionSpec = extractPipelineInstrument(
  {
    title: 'The Problem with Data Engineering Certifications That Nobody Talks About',
    content: '<h2>Why certs miss the mark</h2><p>Purely career commentary with no SQL or pipeline code.</p>',
    category: 'Career',
    tags: ['Certifications'],
  },
  'the-problem-with-data-engineering-certifications-that-nobody-talks-about'
);
assert(opinionSpec === null, 'Non-technical career/certification posts without code must return null');

const cliSpec = extractPipelineInstrument(
  {
    title: 'Claude Code Power User Guide: Stop Using It Like Autocomplete',
    content: '<h2>Hooks</h2><pre><code>paths: &amp;#91;"**/*.test.tsx"]</code></pre>',
    category: 'Developer Productivity',
  },
  'claude-code-power-user-guide'
);
assert(cliSpec === null, 'CLI productivity posts must not get a warehouse pipeline schematic');

const interviewSpec = extractPipelineInstrument(
  {
    title: '10 Snowflake Interview Questions and Answers 2026',
    content: '<h2>Q1</h2><pre><code>SELECT * FROM orders;</code></pre>',
    category: 'Snowflake',
  },
  'snowflake-interview-questions-answers-2026'
);
assert(interviewSpec === null, 'Interview Q&A posts must not get a pipeline schematic');

// 5. SSG-highlighted <pre class="article-code-pre"> must keep full lines (not break on tok-kw spans)
const ssgWrappedHtml = `
  <h2>Step 1: Create table</h2>
  <figure class="article-code" data-lang="SQL" data-lines="2">
    <pre class="article-code-pre"><code class="language-sql"><span class="article-code-line"><span class="article-code-gutter">1</span><span class="article-code-src"><span class="tok-kw">CREATE</span> <span class="tok-kw">TABLE</span> ops.pipeline_audit_log (id INT);</span></span></code></pre>
  </figure>
`;
const ssgSnippets = extractArticleCodeSnippets(ssgWrappedHtml);
assert(
  ssgSnippets.length === 1 && ssgSnippets[0].firstLine.includes('CREATE TABLE ops.pipeline_audit_log'),
  `SSG-highlighted code lines must stay intact, got: ${ssgSnippets[0]?.firstLine}`
);

const instrumentUi = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src/components/editorial/PipelineInstrument.jsx'),
  'utf8'
);
assert(instrumentUi.includes('<details'), 'Pipeline schematic must collapse into a details disclosure');
assert(instrumentUi.includes("useState(false)"), 'Pipeline schematic must start collapsed');

console.log('✅ Curated flagship pipeline blueprints verified (trace, billing, storage, incident)');
console.log('✅ Dynamic SQL/code/heading extraction works for future WordPress posts');
console.log('✅ AdSense review allowlist and non-technical post guardrails hold');
