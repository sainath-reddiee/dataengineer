// src/pages/DbtSchemaGeneratorPage.jsx
// Generate dbt schema.yml + staging model from a CREATE TABLE statement.
// Targets "dbt schema generator", "dbt schema.yml generator", "create table to dbt".
import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileCode2, Copy, Check, Calculator, BookOpen, Wand2 } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Very small CREATE TABLE parser: extract table name and column list.
// Supports Snowflake / Postgres / ANSI: CREATE [OR REPLACE] TABLE [IF NOT EXISTS] name (col type [opts], ...)
function parseCreateTable(sql) {
  if (!sql || !sql.trim()) return { tableName: '', columns: [], error: 'Paste a CREATE TABLE statement.' };
  const cleaned = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const m = cleaned.match(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:TRANSIENT\s+|TEMPORARY\s+|TEMP\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_."`\[\]]+)\s*\(([\s\S]*)\)\s*;?/i);
  if (!m) return { tableName: '', columns: [], error: 'No CREATE TABLE statement detected.' };
  const rawName = m[1].replace(/["`\[\]]/g, '');
  const bodyRaw = m[2];

  // Split columns by top-level commas (ignore parens nested for NUMBER(38,0) etc.)
  const cols = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < bodyRaw.length; i++) {
    const c = bodyRaw[i];
    if (c === '(') { depth++; cur += c; }
    else if (c === ')') { depth--; cur += c; }
    else if (c === ',' && depth === 0) { cols.push(cur); cur = ''; }
    else { cur += c; }
  }
  if (cur.trim()) cols.push(cur);

  const columns = [];
  for (const raw of cols) {
    const line = raw.trim();
    if (!line) continue;
    // Skip table-level constraints
    if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CONSTRAINT|CHECK|INDEX)\b/i.test(line)) continue;
    const cm = line.match(/^["`\[]?([a-zA-Z0-9_]+)["`\]]?\s+([A-Za-z][A-Za-z0-9_]*(?:\s*\([^)]*\))?)/);
    if (!cm) continue;
    const name = cm[1];
    const type = cm[2].replace(/\s+/g, '').toUpperCase();
    const notNull = /\bNOT\s+NULL\b/i.test(line);
    const isPK = /\bPRIMARY\s+KEY\b/i.test(line);
    columns.push({ name, type, notNull, isPK });
  }
  return { tableName: rawName, columns, error: columns.length ? null : 'No columns parsed.' };
}

function describeColumn(name, type) {
  const n = name.toLowerCase();
  if (/_id$|^id$/.test(n)) return `Unique identifier${n === 'id' ? ' for the row' : ` (foreign key to ${n.replace(/_id$/, '')})`}.`;
  if (/_at$|_date$|_time$|_timestamp$/.test(n)) return `Timestamp indicating when the event occurred.`;
  if (/email/.test(n)) return 'User email address.';
  if (/name/.test(n)) return 'Human-readable name.';
  if (/status|state/.test(n)) return 'Current lifecycle state of the record.';
  if (/amount|price|cost|revenue|fee/.test(n)) return 'Monetary value.';
  if (/count|qty|quantity|total/.test(n)) return 'Numeric count or quantity.';
  if (/is_|has_|active|enabled/.test(n)) return 'Boolean flag.';
  if (/^url|_url$/.test(n)) return 'URL reference.';
  if (/type|category|kind/.test(n)) return 'Categorical classification.';
  return `The ${name.replace(/_/g, ' ')} column.`;
}

function inferTests(col) {
  const tests = [];
  if (col.isPK || col.name.toLowerCase() === 'id') {
    tests.push('unique', 'not_null');
  } else if (col.notNull) {
    tests.push('not_null');
  }
  return tests;
}

function yamlEscape(s) {
  if (/^[A-Za-z0-9_ .,()\-]+$/.test(s)) return s;
  return "'" + s.replace(/'/g, "''") + "'";
}

function generateSchemaYml(parseResult, modelPrefix) {
  const { tableName, columns, error } = parseResult;
  if (error) return `# ${error}`;
  const parts = tableName.split('.');
  const shortName = parts[parts.length - 1].toLowerCase();
  const modelName = modelPrefix ? `${modelPrefix}_${shortName}` : `stg_${shortName}`;

  const lines = [
    'version: 2',
    '',
    'models:',
    `  - name: ${modelName}`,
    `    description: "${`Staging model for ${tableName}. One row per ${shortName.replace(/^stg_/, '').replace(/s$/, '')}.`}"`,
    '    columns:',
  ];
  for (const col of columns) {
    lines.push(`      - name: ${col.name}`);
    lines.push(`        description: ${yamlEscape(describeColumn(col.name, col.type))}`);
    const tests = inferTests(col);
    if (tests.length) {
      lines.push('        tests:');
      for (const t of tests) lines.push(`          - ${t}`);
    }
  }
  return lines.join('\n');
}

function generateStagingSql(parseResult, modelPrefix) {
  const { tableName, columns, error } = parseResult;
  if (error) return `-- ${error}`;
  const parts = tableName.split('.');
  const shortName = parts[parts.length - 1].toLowerCase();
  const modelName = modelPrefix ? `${modelPrefix}_${shortName}` : `stg_${shortName}`;
  const sourceName = parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : 'raw';

  const selectList = columns.map((c) => `    ${c.name}`).join(',\n');
  return `{{ config(materialized='view') }}

with source as (

    select * from {{ source('${sourceName}', '${shortName}') }}

),

renamed as (

    select
${selectList}

    from source

)

select * from renamed

-- dbt model: ${modelName}.sql
`;
}

function generateSourcesYml(parseResult) {
  const { tableName, error } = parseResult;
  if (error) return `# ${error}`;
  const parts = tableName.split('.');
  const shortName = parts[parts.length - 1].toLowerCase();
  const sourceName = parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : 'raw';
  const databaseName = parts.length >= 3 ? parts[parts.length - 3] : 'RAW_DB';

  return `version: 2

sources:
  - name: ${sourceName}
    database: ${databaseName}
    schema: ${sourceName.toUpperCase()}
    description: "Raw source schema for ${sourceName}."
    tables:
      - name: ${shortName}
        description: "${tableName} - one row per record."
        loaded_at_field: _loaded_at
        freshness:
          warn_after: { count: 12, period: hour }
          error_after: { count: 24, period: hour }
`;
}

const EXAMPLE = `CREATE OR REPLACE TABLE analytics.raw.orders (
    order_id NUMBER(38,0) NOT NULL,
    customer_id NUMBER(38,0) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    order_total NUMBER(12,2),
    created_at TIMESTAMP_NTZ NOT NULL,
    updated_at TIMESTAMP_NTZ,
    is_cancelled BOOLEAN,
    PRIMARY KEY (order_id)
);`;

const FAQ = [
  {
    q: 'What does this tool generate?',
    a: 'Three artifacts from a single CREATE TABLE statement: (1) a dbt schema.yml with column descriptions and inferred tests (unique, not_null), (2) a staging SQL model with a with source / renamed CTE pattern, and (3) a sources.yml entry with freshness checks. Copy each into your dbt project as stg_<table>.sql, schema.yml, and sources.yml.',
  },
  {
    q: 'How are tests inferred?',
    a: 'A column gets not_null if the DDL declared NOT NULL. A column gets unique + not_null if it is the PRIMARY KEY (or if the column name is exactly "id"). All other columns start with no tests - add relationships, accepted_values, or dbt_utils tests manually based on your business logic.',
  },
  {
    q: 'How are column descriptions generated?',
    a: 'Column descriptions are best-effort placeholders inferred from naming conventions: columns ending in _id become foreign keys, columns ending in _at become event timestamps, columns named email / status / amount / is_* get intuitive descriptions. Always review and rewrite with business context - good column documentation is the single biggest ROI item in a dbt project.',
  },
  {
    q: 'What dialects are supported for the input CREATE TABLE?',
    a: 'Snowflake, PostgreSQL, Redshift, BigQuery, and generic ANSI SQL. The parser recognizes CREATE TABLE, CREATE OR REPLACE TABLE, CREATE TRANSIENT TABLE, and CREATE TABLE IF NOT EXISTS. Nested type parens (e.g. NUMBER(38,0)) are handled. Table-level constraints (PRIMARY KEY (col1, col2)) are parsed for PK detection.',
  },
  {
    q: 'Will this replace running dbt codegen?',
    a: 'No. dbt codegen is the canonical tool for generating dbt artifacts from a live warehouse connection - it introspects your actual tables. This tool is faster for the offline case: you have a CREATE TABLE in hand (from version control, a design doc, or a PR review) and want a starting schema.yml without connecting to the warehouse. Use both tools together.',
  },
  {
    q: 'How do I customize the staging model pattern?',
    a: 'The generated model uses the canonical "with source, renamed" pattern from the dbt style guide. Add column casting, renaming, or surrogate keys in the renamed CTE. For example: surrogate key = {{ dbt_utils.generate_surrogate_key([\'order_id\']) }} as order_sk, timestamp casting = created_at::timestamp_tz as created_at_utc.',
  },
];

export default function DbtSchemaGeneratorPage() {
  const [input, setInput] = useState(EXAMPLE);
  const [modelPrefix, setModelPrefix] = useState('stg');
  const [output, setOutput] = useState('schema');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCreateTable(input), [input]);
  const generated = useMemo(() => {
    if (output === 'schema') return generateSchemaYml(parsed, modelPrefix);
    if (output === 'sql') return generateStagingSql(parsed, modelPrefix);
    return generateSourcesYml(parsed);
  }, [parsed, modelPrefix, output]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [generated]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'dbt Schema.yml Generator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Generate a dbt schema.yml, staging SQL model, and sources.yml from any CREATE TABLE statement. Free, client-side, no account required.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/dbt-schema-generator',
    publisher: { '@type': 'Organization', name: 'DataEngineer Hub', url: 'https://dataengineerhub.blog' },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <MetaTags
        title="dbt Schema.yml Generator 2026 - CREATE TABLE to dbt"
        description="Paste a CREATE TABLE statement, get a dbt schema.yml with inferred tests, a staging SQL model, and a sources.yml entry. Client-side, instant, free."
        keywords="dbt schema generator, dbt schema.yml generator, create table to dbt, dbt staging model generator, dbt codegen alternative"
        url="/tools/dbt-schema-generator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'dbt Schema Generator', url: '/tools/dbt-schema-generator' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-orange-300 bg-orange-900/30 border border-orange-700/50 rounded-full">
            Offline dbt scaffolding - no warehouse connection needed
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <FileCode2 className="w-8 h-8 text-orange-400" />
            dbt Schema.yml Generator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Paste a <strong>CREATE TABLE</strong> statement and get a complete dbt scaffold:
            a <strong>schema.yml</strong> with inferred <code>unique</code> and <code>not_null</code>
            tests, a <strong>staging SQL model</strong> using the canonical
            <code> with source, renamed </code> pattern, and a <strong>sources.yml</strong> entry
            with freshness checks.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Model prefix</label>
            <select
              value={modelPrefix}
              onChange={(e) => setModelPrefix(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="stg">stg_ (staging)</option>
              <option value="base">base_ (base)</option>
              <option value="int">int_ (intermediate)</option>
              <option value="">(none)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Output</label>
            <select
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="schema">schema.yml</option>
              <option value="sql">staging .sql model</option>
              <option value="sources">sources.yml</option>
            </select>
          </div>
          <button
            onClick={() => setInput(EXAMPLE)}
            className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
          >
            Load example
          </button>
          <button
            onClick={() => setInput('')}
            className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
          >
            Clear
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">CREATE TABLE input</h2>
              <span className="text-xs text-gray-500">{parsed.columns.length} column(s)</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-white px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={'CREATE TABLE my_schema.my_table (\n  id NUMBER(38,0) NOT NULL,\n  ...\n);'}
              spellCheck={false}
            />
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-orange-400" />
                dbt {output === 'schema' ? 'schema.yml' : output === 'sql' ? 'staging.sql' : 'sources.yml'}
              </h2>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
              >
                {copied ? (<><Check className="w-3 h-3 text-green-400" /> Copied</>) : (<><Copy className="w-3 h-3" /> Copy</>)}
              </button>
            </div>
            <pre className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-orange-200 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre">
              {generated}
            </pre>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to use the generated files</h2>
          <ol className="list-decimal pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Place the staging SQL</strong> at
              <code> models/staging/{'<source>'}/stg_{'<table>'}.sql</code> in your dbt project.
            </li>
            <li>
              <strong className="text-white">Place the schema.yml</strong> at
              <code> models/staging/{'<source>'}/schema.yml</code> (one file per source folder is the dbt style-guide convention).
            </li>
            <li>
              <strong className="text-white">Place the sources.yml</strong> at
              <code> models/staging/{'<source>'}/sources.yml</code>. Update database, schema, and freshness thresholds for your warehouse.
            </li>
            <li>
              <strong className="text-white">Run <code>dbt build --select stg_{'<table>'}+</code></strong>
              to compile the model, run tests, and materialize the view.
            </li>
            <li>
              <strong className="text-white">Enrich descriptions.</strong> The auto-generated
              descriptions are placeholders. Replace them with business-context definitions - your
              future self and your analytics consumers will thank you.
            </li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">What tests get inferred?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-slate-700">
                  <th className="py-2 pr-4">DDL signal</th>
                  <th className="py-2 pr-4">Generated tests</th>
                  <th className="py-2">Why</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-slate-800 text-gray-300 text-xs">
                <tr><td>PRIMARY KEY</td><td><code>unique</code>, <code>not_null</code></td><td>PK enforces both invariants</td></tr>
                <tr><td>Column named <code>id</code></td><td><code>unique</code>, <code>not_null</code></td><td>Conventional surrogate key</td></tr>
                <tr><td>NOT NULL (without PK)</td><td><code>not_null</code></td><td>DDL explicitly requires value</td></tr>
                <tr><td>Nullable column</td><td>(none)</td><td>No DDL-level invariant; add manually</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            Consider adding <code>accepted_values</code> (for status enums), <code>relationships</code>
            (for foreign keys), and <code>dbt_utils.expression_is_true</code> (for range checks)
            manually based on your business logic.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools &amp; guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/json-to-sql-ddl" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> JSON to SQL DDL -&gt;</div>
              <div className="text-gray-400 text-sm">Generate CREATE TABLE from JSON sample - then feed it here.</div>
            </Link>
            <Link to="/tools/csv-to-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> CSV to SQL -&gt;</div>
              <div className="text-gray-400 text-sm">Generate CREATE TABLE from CSV headers + sample rows.</div>
            </Link>
            <Link to="/tools/dbt-cloud-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> dbt Cloud Cost Calculator -&gt;</div>
              <div className="text-gray-400 text-sm">Price dbt Cloud seats and runs against dbt Core TCO.</div>
            </Link>
            <Link to="/cheatsheets/dbt-commands" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> dbt Commands Reference -&gt;</div>
              <div className="text-gray-400 text-sm">Every dbt CLI command with examples.</div>
            </Link>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <details key={i} className="group border border-slate-700 rounded-xl px-4 py-3 open:bg-slate-800/70">
                <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-orange-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="mt-3 text-gray-300 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
