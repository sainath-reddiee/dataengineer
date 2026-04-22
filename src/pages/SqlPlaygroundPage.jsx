// src/pages/SqlPlaygroundPage.jsx
// In-browser SQL playground powered by DuckDB-WASM.
// Zero backend — the entire database engine runs client-side via WebAssembly.
import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Play,
  Copy,
  Check,
  Trash2,
  Database,
  Table2,
  ChevronRight,
  Loader2,
  AlertTriangle,
  BookOpen,
  Download,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// ---------------------------------------------------------------------------
// Sample datasets — small enough to inline, big enough to be useful
// ---------------------------------------------------------------------------
const SAMPLE_DATASETS = {
  employees: {
    label: 'Employees (HR)',
    csv: `id,name,department,salary,hire_date
1,Alice,Engineering,125000,2021-03-15
2,Bob,Marketing,95000,2020-07-01
3,Carol,Engineering,135000,2019-11-20
4,Dave,Sales,88000,2022-01-10
5,Eve,Engineering,142000,2018-06-05
6,Frank,Marketing,92000,2021-09-14
7,Grace,Sales,97000,2020-03-22
8,Heidi,Engineering,128000,2022-08-30
9,Ivan,Marketing,105000,2019-04-17
10,Judy,Sales,91000,2023-02-01
11,Karl,Engineering,118000,2023-06-12
12,Liam,Sales,84000,2021-12-05
13,Mona,Marketing,99000,2020-10-28
14,Nate,Engineering,145000,2017-09-01
15,Olive,Sales,93000,2022-04-18`,
    schema: 'id INTEGER, name VARCHAR, department VARCHAR, salary INTEGER, hire_date DATE',
  },
  orders: {
    label: 'Orders (E-Commerce)',
    csv: `order_id,customer_id,product,quantity,unit_price,order_date,region
1001,C1,Widget A,3,29.99,2024-01-05,North
1002,C2,Widget B,1,49.99,2024-01-06,South
1003,C1,Widget C,2,19.99,2024-01-07,North
1004,C3,Widget A,5,29.99,2024-01-08,East
1005,C4,Widget B,2,49.99,2024-01-09,West
1006,C2,Widget A,1,29.99,2024-01-10,South
1007,C5,Widget C,4,19.99,2024-01-11,North
1008,C3,Widget B,3,49.99,2024-01-12,East
1009,C1,Widget A,2,29.99,2024-01-13,North
1010,C6,Widget C,1,19.99,2024-01-14,West
1011,C4,Widget A,3,29.99,2024-01-15,West
1012,C2,Widget B,2,49.99,2024-01-16,South
1013,C5,Widget C,5,19.99,2024-01-17,North
1014,C3,Widget A,1,29.99,2024-01-18,East
1015,C7,Widget B,4,49.99,2024-01-19,North`,
    schema: 'order_id INTEGER, customer_id VARCHAR, product VARCHAR, quantity INTEGER, unit_price DECIMAL(10,2), order_date DATE, region VARCHAR',
  },
  web_events: {
    label: 'Web Events (Analytics)',
    csv: `event_id,user_id,event_type,page,ts,device
1,U1,page_view,/home,2024-01-15 08:12:00,mobile
2,U1,click,/products,2024-01-15 08:12:45,mobile
3,U2,page_view,/home,2024-01-15 09:01:00,desktop
4,U2,page_view,/pricing,2024-01-15 09:03:22,desktop
5,U3,page_view,/home,2024-01-15 10:15:00,tablet
6,U1,purchase,/checkout,2024-01-15 08:15:30,mobile
7,U4,page_view,/home,2024-01-15 11:00:00,desktop
8,U4,click,/products,2024-01-15 11:02:10,desktop
9,U4,click,/products,2024-01-15 11:04:55,desktop
10,U2,purchase,/checkout,2024-01-15 09:10:00,desktop
11,U5,page_view,/home,2024-01-15 12:30:00,mobile
12,U5,page_view,/pricing,2024-01-15 12:32:00,mobile
13,U3,click,/products,2024-01-15 10:18:00,tablet
14,U6,page_view,/home,2024-01-15 14:00:00,desktop
15,U6,page_view,/products,2024-01-15 14:01:30,desktop`,
    schema: 'event_id INTEGER, user_id VARCHAR, event_type VARCHAR, page VARCHAR, ts TIMESTAMP, device VARCHAR',
  },
};

const EXAMPLE_QUERIES = [
  {
    label: 'Avg salary by department',
    sql: `SELECT department,
       COUNT(*) AS headcount,
       ROUND(AVG(salary)) AS avg_salary,
       MIN(salary) AS min_salary,
       MAX(salary) AS max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
  },
  {
    label: 'Revenue by region',
    sql: `SELECT region,
       COUNT(*) AS order_count,
       SUM(quantity * unit_price) AS revenue,
       ROUND(AVG(quantity * unit_price), 2) AS avg_order_value
FROM orders
GROUP BY region
ORDER BY revenue DESC;`,
  },
  {
    label: 'Window: running total',
    sql: `SELECT order_id,
       order_date,
       quantity * unit_price AS order_value,
       SUM(quantity * unit_price) OVER (
         ORDER BY order_date
         ROWS UNBOUNDED PRECEDING
       ) AS running_total
FROM orders
ORDER BY order_date;`,
  },
  {
    label: 'Funnel analysis',
    sql: `WITH user_events AS (
  SELECT user_id,
         MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS viewed,
         MAX(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicked,
         MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased
  FROM web_events
  GROUP BY user_id
)
SELECT
  COUNT(*) AS total_users,
  SUM(viewed) AS viewers,
  SUM(clicked) AS clickers,
  SUM(purchased) AS purchasers,
  ROUND(100.0 * SUM(clicked) / NULLIF(SUM(viewed), 0), 1) AS click_rate_pct,
  ROUND(100.0 * SUM(purchased) / NULLIF(SUM(clicked), 0), 1) AS purchase_rate_pct
FROM user_events;`,
  },
  {
    label: 'Top earners (QUALIFY)',
    sql: `SELECT name, department, salary,
       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees
QUALIFY dept_rank <= 2
ORDER BY department, dept_rank;`,
  },
];

const FAQ = [
  {
    q: 'Is this SQL playground free and private?',
    a: 'Yes. DuckDB runs entirely in your browser via WebAssembly. Your SQL and data never leave your device — there is no server, no database connection, no logging of queries. Paste proprietary data safely.',
  },
  {
    q: 'What SQL dialect does DuckDB support?',
    a: 'DuckDB supports a PostgreSQL-compatible dialect with modern extensions: window functions, CTEs, QUALIFY, PIVOT/UNPIVOT, LATERAL joins, LIST/STRUCT/MAP types, regex, lambda functions, and more. Most Snowflake and BigQuery SQL patterns work with minor syntax adjustments.',
  },
  {
    q: 'Can I load my own data?',
    a: 'The playground ships with three sample tables (employees, orders, web_events). You can also paste a CSV into the editor and use DuckDB\'s read_csv() function, e.g. SELECT * FROM read_csv(\'data.csv\') — though for this playground the built-in tables are preloaded for convenience.',
  },
  {
    q: 'How large a dataset can it handle?',
    a: 'DuckDB-WASM runs inside your browser\'s memory budget — typically 1-4 GB depending on device and browser. For the sample datasets in this playground (15 rows each), performance is instant. For real analytical workloads up to ~100 MB of data, DuckDB-WASM performs well.',
  },
  {
    q: 'Does it support Snowflake-specific syntax?',
    a: 'DuckDB supports many Snowflake SQL patterns natively: QUALIFY, FLATTEN (as UNNEST), window functions, CTEs, MERGE, and most date/string functions. Snowflake-only functions (GET_DDL, SYSTEM$) are not available. Use this playground to practice SQL logic, then run on Snowflake for production.',
  },
  {
    q: 'What happens to my query history?',
    a: 'Query history lives in browser memory for the current session only. Refreshing the page resets everything. We do not store, transmit, or log any queries or results.',
  },
];

// ---------------------------------------------------------------------------
// DuckDB initialization (lazy, singleton)
// ---------------------------------------------------------------------------
let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    // Use jsdelivr CDN bundles — avoids Vite needing to serve .wasm files
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    // Load sample datasets
    const conn = await db.connect();
    for (const [name, ds] of Object.entries(SAMPLE_DATASETS)) {
      // Create table and insert CSV data using DuckDB's read_csv_auto
      await conn.query(`CREATE TABLE ${name} AS SELECT * FROM read_csv_auto('${name}.csv')`).catch(async () => {
        // Fallback: create table manually and insert
        await conn.query(`CREATE TABLE IF NOT EXISTS ${name} (${ds.schema})`);
        const rows = ds.csv.trim().split('\n').slice(1);
        for (const row of rows) {
          const vals = row.split(',').map(v => {
            const trimmed = v.trim();
            // If it looks like a number, don't quote it
            if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
            return `'${trimmed}'`;
          });
          await conn.query(`INSERT INTO ${name} VALUES (${vals.join(',')})`);
        }
      });
    }
    // Also register the CSV content so read_csv_auto works if people try it
    // (DuckDB WASM has an in-memory filesystem)
    for (const [name, ds] of Object.entries(SAMPLE_DATASETS)) {
      await db.registerFileText(`${name}.csv`, ds.csv);
    }
    await conn.close();
    return db;
  })();
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SqlPlaygroundPage() {
  const [sql, setSql] = useState(EXAMPLE_QUERIES[0].sql);
  const [results, setResults] = useState(null);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [execTime, setExecTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const textareaRef = useRef(null);
  const dbRef = useRef(null);

  // Initialize DuckDB on mount
  useEffect(() => {
    let cancelled = false;
    getDb()
      .then((db) => {
        if (!cancelled) {
          dbRef.current = db;
          setDbReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) setDbError(err.message || 'Failed to initialize DuckDB');
      });
    return () => { cancelled = true; };
  }, []);

  const runQuery = useCallback(async () => {
    if (!dbRef.current || !sql.trim()) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setColumns([]);
    setExecTime(null);
    const t0 = performance.now();
    try {
      const conn = await dbRef.current.connect();
      const result = await conn.query(sql);
      const elapsed = performance.now() - t0;
      setExecTime(elapsed);
      // Convert Arrow table to plain JS
      const schema = result.schema.fields.map(f => f.name);
      setColumns(schema);
      const rows = [];
      for (let i = 0; i < result.numRows; i++) {
        const row = {};
        for (const col of schema) {
          const val = result.getChild(col).get(i);
          row[col] = val !== null && val !== undefined ? String(val) : null;
        }
        rows.push(row);
      }
      setResults(rows);
      setHistory(prev => [{ sql: sql.trim(), rowCount: rows.length, time: elapsed, ts: Date.now() }, ...prev].slice(0, 20));
      await conn.close();
    } catch (err) {
      setExecTime(performance.now() - t0);
      setError(err.message || 'Query execution failed');
    } finally {
      setRunning(false);
    }
  }, [sql]);

  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
    // Tab to insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      setSql(value.substring(0, start) + '  ' + value.substring(end));
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      });
    }
  }, [runQuery]);

  const handleCopyResults = useCallback(async () => {
    if (!results || !columns.length) return;
    const header = columns.join('\t');
    const rows = results.map(r => columns.map(c => r[c] ?? 'NULL').join('\t'));
    const text = [header, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [results, columns]);

  const handleDownloadCsv = useCallback(() => {
    if (!results || !columns.length) return;
    const header = columns.join(',');
    const rows = results.map(r => columns.map(c => {
      const v = r[c] ?? '';
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [results, columns]);

  // SEO schemas
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SQL Playground',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Free in-browser SQL playground powered by DuckDB-WASM. Practice SQL with sample datasets — no signup, no server, 100% client-side.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/sql-playground',
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
        title="Free SQL Playground 2026 — Run SQL in Your Browser | DuckDB-WASM"
        description="Practice SQL instantly in your browser with DuckDB-WASM. Sample datasets, window functions, CTEs, QUALIFY — no signup, no server. 100% private and free."
        keywords="sql playground, sql practice online, duckdb wasm, run sql in browser, free sql editor, sql sandbox, practice sql online, data engineer sql practice"
        url="/tools/sql-playground"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'SQL Playground', url: '/tools/sql-playground' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/tools" className="hover:text-white transition-colors">Tools</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-400">SQL Playground</span>
          </nav>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-emerald-300 bg-emerald-900/30 border border-emerald-700/50 rounded-full">
            DuckDB-WASM · 100% in-browser · No data leaves your device
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-400" />
            SQL Playground
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Write and run SQL instantly — powered by{' '}
            <span className="text-emerald-400 font-medium">DuckDB-WASM</span>.
            Three sample tables preloaded. Practice window functions, CTEs, QUALIFY,
            aggregations, and joins. No server, no signup, no tracking.
          </p>
        </div>

        {/* DB status */}
        {!dbReady && !dbError && (
          <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-gray-300">Loading DuckDB engine (~2 MB)...</span>
          </div>
        )}
        {dbError && (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300">Failed to load DuckDB: {dbError}. Try refreshing the page.</span>
          </div>
        )}

        {/* Available tables */}
        <div className="flex flex-wrap gap-3">
          <span className="text-xs text-gray-500 self-center">Tables:</span>
          {Object.entries(SAMPLE_DATASETS).map(([name, ds]) => (
            <button
              key={name}
              onClick={() => setSql(`SELECT * FROM ${name} LIMIT 10;`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-gray-300 hover:text-white transition-all"
            >
              <Table2 className="w-3 h-3 text-emerald-400" />
              {name}
              <span className="text-gray-500">({ds.label})</span>
            </button>
          ))}
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Examples:</span>
          {EXAMPLE_QUERIES.map((eq, i) => (
            <button
              key={i}
              onClick={() => setSql(eq.sql)}
              className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-gray-300 hover:text-white transition-all"
            >
              {eq.label}
            </button>
          ))}
        </div>

        {/* Editor + Results */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* SQL Editor */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">SQL Editor</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSql('')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-400 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
                <button
                  onClick={runQuery}
                  disabled={!dbReady || running}
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-gray-400 text-white rounded-lg transition-colors"
                >
                  {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  {running ? 'Running...' : 'Run'}
                  <span className="text-emerald-200/60 text-[10px] ml-1">Ctrl+Enter</span>
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[320px] bg-slate-900 border border-slate-700 rounded-lg text-emerald-100 px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Write your SQL here..."
              spellCheck={false}
              disabled={!dbReady}
            />
          </div>

          {/* Results */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Table2 className="w-4 h-4 text-emerald-400" />
                Results
                {results && (
                  <span className="text-xs font-normal text-gray-400">
                    {results.length} row{results.length !== 1 ? 's' : ''}
                    {execTime != null && ` · ${execTime < 1 ? '<1' : Math.round(execTime)}ms`}
                  </span>
                )}
              </h2>
              {results && results.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyResults}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-400 hover:text-white"
                  >
                    {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-400 hover:text-white"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-[320px] bg-slate-900 border border-slate-700 rounded-lg overflow-auto">
              {error && (
                <div className="p-4 text-red-300 text-sm font-mono whitespace-pre-wrap">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {results && results.length === 0 && !error && (
                <div className="p-4 text-gray-400 text-sm">Query executed successfully. 0 rows returned.</div>
              )}
              {results && results.length > 0 && (
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                    <tr>
                      {columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        {columns.map((col) => (
                          <td key={col} className="px-3 py-2 text-gray-200 font-mono text-xs whitespace-nowrap">
                            {row[col] === null ? <span className="text-gray-500 italic">NULL</span> : row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!results && !error && (
                <div className="p-4 text-gray-500 text-sm flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {dbReady ? 'Press Run or Ctrl+Enter to execute your query.' : 'Waiting for DuckDB to load...'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Query history */}
        {history.length > 0 && (
          <details className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white select-none">
              Query History ({history.length})
            </summary>
            <div className="mt-3 space-y-2 max-h-48 overflow-auto">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setSql(h.sql)}
                  className="block w-full text-left p-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg text-xs"
                >
                  <div className="text-gray-200 font-mono truncate">{h.sql}</div>
                  <div className="text-gray-500 mt-1">{h.rowCount} rows · {Math.round(h.time)}ms</div>
                </button>
              ))}
            </div>
          </details>
        )}

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        {/* Schema reference */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Sample table schemas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(SAMPLE_DATASETS).map(([name, ds]) => (
              <div key={name} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-emerald-300 font-semibold mb-2 flex items-center gap-2">
                  <Table2 className="w-4 h-4" /> {name}
                </h3>
                <p className="text-gray-400 text-xs mb-2">{ds.label}</p>
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {ds.schema.split(', ').join(',\n')}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Educational content */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">What can you practice here?</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-2">Fundamentals</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>SELECT, WHERE, GROUP BY, HAVING, ORDER BY</li>
                <li>JOINs (INNER, LEFT, RIGHT, FULL, CROSS)</li>
                <li>Subqueries and correlated subqueries</li>
                <li>UNION, INTERSECT, EXCEPT</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Advanced</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Window functions (ROW_NUMBER, RANK, LAG, LEAD, SUM OVER)</li>
                <li>CTEs (WITH ... AS) and recursive CTEs</li>
                <li>QUALIFY clause (DuckDB + Snowflake)</li>
                <li>CASE expressions, COALESCE, NULLIF</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Data Engineering Patterns</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Running totals and moving averages</li>
                <li>Funnel analysis with conditional aggregation</li>
                <li>Sessionization with LAG + date math</li>
                <li>Deduplication with ROW_NUMBER</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Interview Prep</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Top-N per group (a classic interview question)</li>
                <li>Year-over-year comparisons</li>
                <li>Percentile and median calculations</li>
                <li>Self-joins for sequential event analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related tools */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/sql-formatter" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> SQL Formatter</div>
              <div className="text-gray-400 text-sm">Clean up your SQL before running it here.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake SQL Cheat Sheet</div>
              <div className="text-gray-400 text-sm">Full Snowflake SQL reference — copy examples into the playground.</div>
            </Link>
            <Link to="/interview-prep" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Interview Prep Hub</div>
              <div className="text-gray-400 text-sm">Practice SQL interview questions with real data.</div>
            </Link>
            <Link to="/cheatsheets/sql-window-functions" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1">Window Functions Reference</div>
              <div className="text-gray-400 text-sm">ROW_NUMBER, RANK, LAG — all examples, runnable here.</div>
            </Link>
          </div>
        </div>

        {/* FAQ */}
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
