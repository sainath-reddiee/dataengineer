// src/pages/JsonToSqlPage.jsx
// JSON sample -> SQL CREATE TABLE DDL generator. Type inference over nested JSON.
// Targets "json to sql", "json to create table", "json schema to sql", "snowflake variant ddl".
import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileJson, Copy, Check, Calculator, BookOpen, Wand2 } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Infer SQL type from a JS value. nested=true when the value is inside an object
// (for non-Snowflake dialects, nested objects become JSON/JSONB; for Snowflake they can be flattened).
function inferType(value, dialect) {
  if (value === null || value === undefined) return dialect === 'snowflake' ? 'VARIANT' : 'TEXT';
  if (Array.isArray(value)) {
    if (dialect === 'snowflake') return 'ARRAY';
    if (dialect === 'postgres') return 'JSONB';
    if (dialect === 'bigquery') return 'JSON';
    return 'TEXT';
  }
  if (typeof value === 'object') {
    if (dialect === 'snowflake') return 'OBJECT';
    if (dialect === 'postgres') return 'JSONB';
    if (dialect === 'bigquery') return 'JSON';
    return 'TEXT';
  }
  if (typeof value === 'boolean') {
    return dialect === 'bigquery' ? 'BOOL' : 'BOOLEAN';
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (dialect === 'snowflake') return 'NUMBER(38,0)';
      if (dialect === 'postgres') return 'BIGINT';
      if (dialect === 'bigquery') return 'INT64';
      return 'BIGINT';
    }
    if (dialect === 'snowflake') return 'NUMBER(38,10)';
    if (dialect === 'postgres') return 'NUMERIC';
    if (dialect === 'bigquery') return 'NUMERIC';
    return 'DECIMAL(38,10)';
  }
  if (typeof value === 'string') {
    // Detect common date/timestamp strings.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      if (dialect === 'snowflake') return 'TIMESTAMP_NTZ';
      if (dialect === 'bigquery') return 'TIMESTAMP';
      return 'TIMESTAMP';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'DATE';
    // Guess VARCHAR length class.
    const len = value.length;
    if (dialect === 'snowflake') return 'VARCHAR(16777216)'; // Snowflake has a single max length
    if (dialect === 'bigquery') return 'STRING';
    if (len <= 50) return dialect === 'postgres' ? 'VARCHAR(100)' : 'VARCHAR(100)';
    if (len <= 500) return 'VARCHAR(1000)';
    return 'TEXT';
  }
  return dialect === 'snowflake' ? 'VARIANT' : 'TEXT';
}

// Merge types: if a column appears across multiple samples, pick the most permissive.
function mergeType(a, b) {
  if (a === b) return a;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  // Promotion: integer -> decimal -> text
  const rank = (t) => {
    if (/NUMBER\(38,0\)|BIGINT|INT64/.test(t)) return 1;
    if (/NUMERIC|NUMBER\(38,10\)|DECIMAL/.test(t)) return 2;
    if (/BOOLEAN|BOOL/.test(t)) return 1;
    if (/DATE/.test(t)) return 3;
    if (/TIMESTAMP/.test(t)) return 4;
    if (/VARCHAR|STRING|TEXT/.test(t)) return 5;
    if (/VARIANT|JSONB|JSON|OBJECT|ARRAY/.test(t)) return 6;
    return 7;
  };
  return rank(a) >= rank(b) ? a : b;
}

function inferSchema(samples, dialect) {
  const colTypes = {};
  const colNullable = {};
  for (const sample of samples) {
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)) continue;
    for (const [k, v] of Object.entries(sample)) {
      const t = inferType(v, dialect);
      colTypes[k] = colTypes[k] ? mergeType(colTypes[k], t) : t;
      if (v === null || v === undefined) colNullable[k] = true;
    }
    // Any field missing from this sample -> nullable.
    const keys = new Set(Object.keys(sample));
    for (const col of Object.keys(colTypes)) {
      if (!keys.has(col)) colNullable[col] = true;
    }
  }
  return { colTypes, colNullable };
}

function generateDDL(samples, tableName, dialect) {
  if (!samples.length) return '-- Paste a JSON object or array of objects above.';
  const { colTypes, colNullable } = inferSchema(samples, dialect);
  if (!Object.keys(colTypes).length) return '-- No top-level keys detected. Ensure input is a JSON object or array of objects.';

  const quote = dialect === 'bigquery' ? '`' : '"';
  const lines = Object.entries(colTypes).map(([col, type]) => {
    const nullable = colNullable[col] ? '' : ' NOT NULL';
    return `  ${quote}${col}${quote} ${type}${nullable}`;
  });

  const prefix = dialect === 'snowflake' ? 'CREATE OR REPLACE TABLE' : 'CREATE TABLE IF NOT EXISTS';
  return `${prefix} ${tableName} (\n${lines.join(',\n')}\n);`;
}

function safeParse(input) {
  if (!input.trim()) return { samples: [], error: null };
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return { samples: parsed, error: null };
    if (typeof parsed === 'object' && parsed !== null) return { samples: [parsed], error: null };
    return { samples: [], error: 'Input must be a JSON object or array of objects.' };
  } catch (e) {
    return { samples: [], error: 'Invalid JSON: ' + e.message };
  }
}

const EXAMPLE = `[
  {
    "id": 12345,
    "email": "alice@example.com",
    "created_at": "2026-04-21T09:30:00Z",
    "active": true,
    "login_count": 47,
    "score": 89.5,
    "metadata": { "plan": "pro", "referrer": "google" },
    "tags": ["engineering", "beta"]
  },
  {
    "id": 12346,
    "email": "bob@example.com",
    "created_at": "2026-04-21T10:15:00Z",
    "active": false,
    "login_count": 12,
    "score": 73.2,
    "metadata": { "plan": "free" },
    "tags": []
  }
]`;

const FAQ = [
  {
    q: 'What dialects does this generator support?',
    a: 'Snowflake, PostgreSQL (with JSONB for nested objects), BigQuery (with JSON/STRING), and ANSI SQL (fallback with TEXT for complex types). Pick the dialect that matches your warehouse. Column naming uses double quotes (Snowflake/Postgres/ANSI) or backticks (BigQuery).',
  },
  {
    q: 'How is type inference done?',
    a: 'The generator scans every sample in the input array. For each field: integers → NUMBER(38,0)/BIGINT/INT64, floats → NUMBER(38,10)/NUMERIC, booleans → BOOLEAN, ISO timestamps → TIMESTAMP, dates → DATE, strings → VARCHAR/STRING/TEXT by length, nested objects/arrays → VARIANT/JSONB/JSON. When types conflict across samples, the generator promotes to the most permissive type.',
  },
  {
    q: 'How does it handle nested objects and arrays?',
    a: 'On Snowflake, nested objects become OBJECT and arrays become ARRAY (use FLATTEN to unpack). On Postgres, both become JSONB. On BigQuery, both become JSON. On ANSI, they fall back to TEXT (you will need to store serialized JSON). The DDL does not attempt to flatten nested structures automatically — that is an ETL decision.',
  },
  {
    q: 'Does it infer nullability?',
    a: 'Yes. A column is marked NULL if any sample has that field as null/undefined or omits the field entirely. Otherwise NOT NULL is added. Review before deploying — if your sample is not representative, nullability may be wrong.',
  },
  {
    q: 'What about PK, FK, and indexes?',
    a: 'Not inferred. Schema relationships are design decisions, not data properties. Add PRIMARY KEY, FOREIGN KEY, and CLUSTER BY / ORDER BY clauses manually after generation. For Snowflake, consider a CLUSTER BY on timestamp or tenant fields for large tables.',
  },
  {
    q: 'Can I generate DDL from a JSON Schema document?',
    a: 'This tool takes sample JSON data, not JSON Schema. For a proper JSON-Schema-to-SQL converter, try sqlc-gen-from-json-schema or write a small script using Ajv + pg-types. Sample-based inference is usually more practical because it reflects what the data actually looks like.',
  },
];

export default function JsonToSqlPage() {
  const [input, setInput] = useState(EXAMPLE);
  const [tableName, setTableName] = useState('my_table');
  const [dialect, setDialect] = useState('snowflake');
  const [copied, setCopied] = useState(false);

  const { samples, error } = useMemo(() => safeParse(input), [input]);
  const ddl = useMemo(
    () => (error ? `-- ${error}` : generateDDL(samples, tableName, dialect)),
    [samples, tableName, dialect, error]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ddl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [ddl]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JSON to SQL DDL Generator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description:
      'Free JSON to SQL DDL generator. Infer CREATE TABLE schemas from sample JSON for Snowflake, Postgres, BigQuery, ANSI.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/json-to-sql-ddl',
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
        title="JSON to SQL DDL Generator 2026 — Snowflake, Postgres, BigQuery"
        description="Paste JSON, get CREATE TABLE DDL with inferred types. Supports Snowflake VARIANT, PostgreSQL JSONB, BigQuery JSON. Handles nested objects and arrays. Free, client-side."
        keywords="json to sql, json to create table, json schema to sql, snowflake variant ddl, postgres jsonb from json, bigquery json ddl"
        url="/tools/json-to-sql-ddl"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'JSON to SQL DDL', url: '/tools/json-to-sql-ddl' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-pink-300 bg-pink-900/30 border border-pink-700/50 rounded-full">
            Client-side type inference · No data leaves your browser
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <FileJson className="w-8 h-8 text-pink-400" />
            JSON → SQL DDL Generator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Paste a JSON sample — a single object or an array of objects — and get a CREATE TABLE
            statement with inferred types. Supports Snowflake (VARIANT/OBJECT/ARRAY), PostgreSQL
            (JSONB), BigQuery (JSON), and ANSI SQL. Handles nested structures, nullability, and
            timestamp detection.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Table name</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '_') || 'my_table')}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Dialect</label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="snowflake">Snowflake</option>
              <option value="postgres">PostgreSQL</option>
              <option value="bigquery">BigQuery</option>
              <option value="ansi">ANSI SQL</option>
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
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">JSON input</h2>
              <span className="text-xs text-gray-500">{samples.length} sample(s)</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-white px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder={'{ "id": 1, "name": "Alice" }'}
              spellCheck={false}
            />
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-pink-400" />
                SQL DDL
              </h2>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
              >
                {copied ? (<><Check className="w-3 h-3 text-green-400" /> Copied</>) : (<><Copy className="w-3 h-3" /> Copy</>)}
              </button>
            </div>
            <pre className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-pink-200 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre">
              {error ? <span className="text-red-400">-- {error}</span> : ddl}
            </pre>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Type inference reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-slate-700">
                  <th className="py-2 pr-4">JSON value</th>
                  <th className="py-2 pr-4">Snowflake</th>
                  <th className="py-2 pr-4">PostgreSQL</th>
                  <th className="py-2 pr-4">BigQuery</th>
                  <th className="py-2">ANSI</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-slate-800 text-gray-300 font-mono text-xs">
                <tr><td>integer</td><td>NUMBER(38,0)</td><td>BIGINT</td><td>INT64</td><td>BIGINT</td></tr>
                <tr><td>float</td><td>NUMBER(38,10)</td><td>NUMERIC</td><td>NUMERIC</td><td>DECIMAL</td></tr>
                <tr><td>boolean</td><td>BOOLEAN</td><td>BOOLEAN</td><td>BOOL</td><td>BOOLEAN</td></tr>
                <tr><td>ISO timestamp</td><td>TIMESTAMP_NTZ</td><td>TIMESTAMP</td><td>TIMESTAMP</td><td>TIMESTAMP</td></tr>
                <tr><td>date (YYYY-MM-DD)</td><td>DATE</td><td>DATE</td><td>DATE</td><td>DATE</td></tr>
                <tr><td>short string</td><td>VARCHAR(16777216)</td><td>VARCHAR(100)</td><td>STRING</td><td>VARCHAR(100)</td></tr>
                <tr><td>object</td><td>OBJECT</td><td>JSONB</td><td>JSON</td><td>TEXT</td></tr>
                <tr><td>array</td><td>ARRAY</td><td>JSONB</td><td>JSON</td><td>TEXT</td></tr>
                <tr><td>null</td><td>VARIANT (nullable)</td><td>TEXT (nullable)</td><td>STRING (nullable)</td><td>TEXT (nullable)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to use the generated DDL</h2>
          <ol className="list-decimal pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Review the types.</strong> Type inference is as good
              as your sample. Bring at least 5-10 representative rows — especially ones with nulls
              and edge-case values.
            </li>
            <li>
              <strong className="text-white">Add primary/foreign keys.</strong> The generator does
              not infer relationships. Add <code>PRIMARY KEY (id)</code> and any FKs manually.
            </li>
            <li>
              <strong className="text-white">Consider clustering.</strong> On Snowflake, add
              <code> CLUSTER BY (created_at)</code> or <code>CLUSTER BY (tenant_id, created_at)</code>
              for large tables with a natural sort key.
            </li>
            <li>
              <strong className="text-white">Flatten nested structures if queried often.</strong>
              If <code>metadata.plan</code> is queried in 80% of workloads, extract it to a
              top-level column during ingest rather than using <code>metadata:plan</code> on every
              query.
            </li>
            <li>
              <strong className="text-white">Load with COPY or COPY INTO.</strong> For Snowflake:
              <code> COPY INTO my_table FROM @stage FILE_FORMAT = (TYPE = JSON)</code> with a
              SELECT mapping or FLATTEN. For Postgres: <code>\\COPY</code> from CSV after a
              JSON-to-CSV transform.
            </li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/sql-formatter" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-pink-500 rounded-xl">
              <div className="text-pink-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> SQL Formatter →</div>
              <div className="text-gray-400 text-sm">Clean up the generated DDL to match your style.</div>
            </Link>
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-pink-500 rounded-xl">
              <div className="text-pink-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Storage and compute for ingesting this new table.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-semi-structured-interview" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-pink-500 rounded-xl">
              <div className="text-pink-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake Semi-Structured Data →</div>
              <div className="text-gray-400 text-sm">VARIANT, OBJECT, ARRAY, FLATTEN in depth.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-pink-500 rounded-xl">
              <div className="text-pink-300 font-medium mb-1">Snowflake SQL Reference →</div>
              <div className="text-gray-400 text-sm">DDL, DML, semi-structured access patterns.</div>
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
                  <span className="text-pink-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
