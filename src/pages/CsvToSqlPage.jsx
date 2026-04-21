// src/pages/CsvToSqlPage.jsx
// CSV -> SQL INSERT / CREATE TABLE generator. Client-side, no upload.
// Targets "csv to sql", "csv to insert statement", "csv to create table".
import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileSpreadsheet, Copy, Check, Calculator, BookOpen, Wand2 } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Simple CSV parser (RFC 4180: quoted fields, escaped quotes, commas inside quotes).
function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === delimiter) { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

function inferColumnType(values, dialect) {
  let hasText = false;
  let hasFloat = false;
  let hasInt = false;
  let hasBool = false;
  let hasDate = false;
  let hasTimestamp = false;
  let maxLen = 0;
  for (const v of values) {
    if (v === '' || v == null) continue;
    maxLen = Math.max(maxLen, v.length);
    if (/^-?\d+$/.test(v)) { hasInt = true; continue; }
    if (/^-?\d+\.\d+$/.test(v)) { hasFloat = true; continue; }
    if (/^(true|false)$/i.test(v)) { hasBool = true; continue; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { hasDate = true; continue; }
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(v)) { hasTimestamp = true; continue; }
    hasText = true;
  }
  if (hasText) {
    if (dialect === 'snowflake') return 'VARCHAR(16777216)';
    if (dialect === 'bigquery') return 'STRING';
    if (maxLen <= 100) return 'VARCHAR(100)';
    if (maxLen <= 1000) return 'VARCHAR(1000)';
    return 'TEXT';
  }
  if (hasTimestamp) return dialect === 'snowflake' ? 'TIMESTAMP_NTZ' : 'TIMESTAMP';
  if (hasDate) return 'DATE';
  if (hasFloat) {
    if (dialect === 'snowflake') return 'NUMBER(38,10)';
    if (dialect === 'bigquery') return 'NUMERIC';
    return 'DECIMAL(18,6)';
  }
  if (hasInt) {
    if (dialect === 'snowflake') return 'NUMBER(38,0)';
    if (dialect === 'bigquery') return 'INT64';
    return 'BIGINT';
  }
  if (hasBool) return dialect === 'bigquery' ? 'BOOL' : 'BOOLEAN';
  return dialect === 'snowflake' ? 'VARCHAR(16777216)' : 'VARCHAR(100)';
}

function quoteIdent(name, dialect) {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1') || 'col';
  if (dialect === 'bigquery') return '`' + clean + '`';
  return '"' + clean + '"';
}

function formatValue(v, type) {
  if (v === '' || v == null) return 'NULL';
  if (/NUMBER|BIGINT|INT|DECIMAL|NUMERIC/.test(type)) return v;
  if (/BOOLEAN|BOOL/.test(type)) return v.toLowerCase();
  // Strings / dates / timestamps -> quoted with single-quote escape
  return "'" + v.replace(/'/g, "''") + "'";
}

function generateSQL(rows, tableName, dialect, hasHeader, mode) {
  if (!rows.length) return '-- Paste CSV above to generate SQL.';
  const headers = hasHeader
    ? rows[0].map((h, i) => h || `col_${i + 1}`)
    : rows[0].map((_, i) => `col_${i + 1}`);
  const dataRows = hasHeader ? rows.slice(1) : rows;
  if (!headers.length) return '-- No columns detected.';

  const types = headers.map((_, idx) => {
    const colValues = dataRows.map((r) => r[idx] ?? '');
    return inferColumnType(colValues, dialect);
  });

  const out = [];
  if (mode === 'ddl' || mode === 'both') {
    const prefix = dialect === 'snowflake' ? 'CREATE OR REPLACE TABLE' : 'CREATE TABLE IF NOT EXISTS';
    const lines = headers.map((h, i) => `  ${quoteIdent(h, dialect)} ${types[i]}`);
    out.push(`${prefix} ${tableName} (\n${lines.join(',\n')}\n);`);
  }
  if (mode === 'insert' || mode === 'both') {
    if (out.length) out.push('');
    const colList = headers.map((h) => quoteIdent(h, dialect)).join(', ');
    const valueRows = dataRows.map((r) => {
      const vals = headers.map((_, i) => formatValue(r[i] ?? '', types[i])).join(', ');
      return `  (${vals})`;
    });
    if (valueRows.length === 0) {
      out.push(`-- No data rows to insert.`);
    } else {
      out.push(`INSERT INTO ${tableName} (${colList}) VALUES\n${valueRows.join(',\n')};`);
    }
  }
  return out.join('\n');
}

const EXAMPLE = `id,email,signup_date,active,credit_balance
1,alice@example.com,2026-01-15,true,249.50
2,bob@example.com,2026-02-03,true,0.00
3,carol@example.com,2026-02-28,false,1420.75
4,dave@example.com,2026-03-10,true,88.20`;

const FAQ = [
  {
    q: 'Is my CSV data uploaded anywhere?',
    a: 'No. Parsing and SQL generation run 100% in your browser. Nothing is sent to our servers, nothing is stored, and the page works offline after first load. Paste sensitive data with confidence.',
  },
  {
    q: 'What SQL dialects are supported?',
    a: 'Snowflake (NUMBER, VARCHAR(16777216), TIMESTAMP_NTZ), PostgreSQL (BIGINT, NUMERIC, TEXT), BigQuery (INT64, NUMERIC, STRING with backtick identifiers), and ANSI SQL (BIGINT, DECIMAL, VARCHAR). The generator picks identifiers and types that will compile on your target warehouse.',
  },
  {
    q: 'How is column type inferred?',
    a: 'Every row is scanned per column. If all non-empty values match an integer pattern, the column is typed as BIGINT / INT64 / NUMBER(38,0). Floats get NUMERIC / DECIMAL. ISO dates (YYYY-MM-DD) become DATE, ISO timestamps become TIMESTAMP. Any value that breaks a numeric pattern downgrades the column to VARCHAR / STRING / TEXT.',
  },
  {
    q: 'How are quotes and commas inside cells handled?',
    a: 'The parser follows RFC 4180. A field wrapped in double-quotes can contain commas, newlines, and escaped double-quotes (written as "").  In the generated SQL, single quotes inside values are escaped by doubling them, which is safe across all four supported dialects.',
  },
  {
    q: 'Can I load 10,000 rows?',
    a: 'Yes, but generated INSERT statements get large fast. For large CSVs prefer the COPY INTO / bulk-load path: generate only the DDL with this tool, then use Snowflake COPY INTO, Postgres COPY, or BigQuery bq load to ingest the CSV file itself. INSERT-per-row scales poorly past a few thousand rows.',
  },
  {
    q: 'Does this tool infer PRIMARY KEY or indexes?',
    a: 'No. Constraints and indexes are design decisions, not data properties. Add PRIMARY KEY, UNIQUE, FOREIGN KEY, and CLUSTER BY (Snowflake) / SORT (Redshift) clauses by hand after generation. For Snowflake, consider CLUSTER BY on timestamp or tenant columns for large tables.',
  },
];

export default function CsvToSqlPage() {
  const [input, setInput] = useState(EXAMPLE);
  const [tableName, setTableName] = useState('my_table');
  const [dialect, setDialect] = useState('snowflake');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [mode, setMode] = useState('both');
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => parseCSV(input, delimiter), [input, delimiter]);
  const sql = useMemo(
    () => generateSQL(rows, tableName, dialect, hasHeader, mode),
    [rows, tableName, dialect, hasHeader, mode]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [sql]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CSV to SQL INSERT Generator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Free CSV to SQL converter. Generate CREATE TABLE DDL and INSERT statements from CSV for Snowflake, Postgres, BigQuery, ANSI SQL. Client-side, no upload.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/csv-to-sql',
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
        title="CSV to SQL Converter 2026 - INSERT + CREATE TABLE Generator"
        description="Paste CSV, get CREATE TABLE DDL and INSERT statements with inferred types. Supports Snowflake, PostgreSQL, BigQuery, ANSI SQL. No upload, client-side."
        keywords="csv to sql, csv to insert statement, csv to create table, csv to sql converter, csv to snowflake, csv to postgres"
        url="/tools/csv-to-sql"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'CSV to SQL', url: '/tools/csv-to-sql' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-emerald-300 bg-emerald-900/30 border border-emerald-700/50 rounded-full">
            Client-side parsing - CSV never leaves your browser
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            CSV to SQL Converter
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Paste CSV data and get both the <strong>CREATE TABLE</strong> DDL and an
            <strong> INSERT statement</strong> with inferred column types. Supports Snowflake,
            PostgreSQL, BigQuery, and ANSI SQL. RFC 4180 compliant parser handles quoted fields,
            embedded commas, and escaped quotes.
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
          <div>
            <label className="block text-xs text-gray-400 mb-1">Delimiter</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value=",">, (comma)</option>
              <option value={'\t'}>TAB</option>
              <option value=";">; (semicolon)</option>
              <option value="|">| (pipe)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Output</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="both">DDL + INSERT</option>
              <option value="ddl">DDL only</option>
              <option value="insert">INSERT only</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 px-3 py-2">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            First row is header
          </label>
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
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">CSV input</h2>
              <span className="text-xs text-gray-500">{rows.length} row(s)</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-white px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={'id,name\n1,Alice\n2,Bob'}
              spellCheck={false}
            />
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                SQL output
              </h2>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
              >
                {copied ? (<><Check className="w-3 h-3 text-green-400" /> Copied</>) : (<><Copy className="w-3 h-3" /> Copy</>)}
              </button>
            </div>
            <pre className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-emerald-200 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre">
              {sql}
            </pre>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How the conversion works</h2>
          <ol className="list-decimal pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
            <li><strong className="text-white">Parse CSV (RFC 4180):</strong> Fields wrapped in double quotes can contain the delimiter, newlines, and escaped double-quotes (doubled).</li>
            <li><strong className="text-white">Detect types:</strong> Every non-empty value in a column is tested against integer, float, boolean, date, and timestamp patterns. If any value breaks the pattern, the column is downgraded to VARCHAR.</li>
            <li><strong className="text-white">Emit CREATE TABLE:</strong> Identifiers are quoted with double-quotes (or backticks for BigQuery). Types match the dialect (NUMBER(38,0) for Snowflake, BIGINT for Postgres, INT64 for BigQuery).</li>
            <li><strong className="text-white">Emit INSERT:</strong> Values are properly quoted - strings get single quotes with doubled-single-quote escape, numerics stay unquoted, empty values become NULL.</li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">When to use INSERT vs COPY</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Generated INSERT statements are great for seeding test data, fixtures, and small lookup tables (&lt; 1,000 rows). For production ingest of any significant CSV, bulk-load commands are dramatically faster and cheaper:
          </p>
          <ul className="list-disc pl-5 text-gray-300 space-y-2 text-sm">
            <li><strong className="text-white">Snowflake:</strong> <code>COPY INTO my_table FROM @stage/file.csv FILE_FORMAT = (TYPE = CSV SKIP_HEADER = 1)</code> - scales to TB of data.</li>
            <li><strong className="text-white">PostgreSQL:</strong> <code>\\COPY my_table FROM 'file.csv' CSV HEADER</code> from psql, or <code>COPY my_table FROM STDIN</code> for server-side.</li>
            <li><strong className="text-white">BigQuery:</strong> <code>bq load --source_format=CSV --skip_leading_rows=1 dataset.table gs://bucket/file.csv</code>.</li>
            <li><strong className="text-white">Redshift:</strong> <code>COPY my_table FROM 's3://bucket/file.csv' IAM_ROLE '...' CSV IGNOREHEADER 1</code>.</li>
          </ul>
          <p className="text-gray-400 text-xs mt-3">Use this tool to generate only the CREATE TABLE DDL, then use the bulk-load command for the data. A 1M-row INSERT takes hours; <code>COPY</code> takes seconds.</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools &amp; guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/json-to-sql-ddl" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> JSON to SQL DDL -&gt;</div>
              <div className="text-gray-400 text-sm">Same inference, but from JSON samples instead of CSV.</div>
            </Link>
            <Link to="/tools/sql-formatter" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> SQL Formatter -&gt;</div>
              <div className="text-gray-400 text-sm">Pretty-print the generated INSERT before committing.</div>
            </Link>
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Snowflake Cost Calculator -&gt;</div>
              <div className="text-gray-400 text-sm">Estimate the storage + compute for the new table.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake SQL Reference -&gt;</div>
              <div className="text-gray-400 text-sm">DDL, DML, and COPY INTO reference.</div>
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
                  <span className="text-emerald-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
