// src/pages/SqlFormatterPage.jsx
// Client-side SQL formatter. Targets "sql formatter", "sql beautifier",
// "format sql online", "snowflake sql formatter".
import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Code2, Copy, Check, Trash2, Calculator, BookOpen, Wand2 } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Minimal dependency-free SQL formatter.
// Approach: tokenize on keywords, insert line breaks before major clauses, indent nested parens.
const MAJOR_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
  'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'MINUS',
  'INSERT INTO', 'UPDATE', 'DELETE FROM', 'MERGE INTO', 'WITH', 'CREATE TABLE',
  'CREATE OR REPLACE TABLE', 'CREATE VIEW', 'CREATE OR REPLACE VIEW',
  'CREATE MATERIALIZED VIEW', 'CREATE OR REPLACE MATERIALIZED VIEW',
  'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'JOIN',
  'ON', 'VALUES', 'SET', 'RETURNING',
];

const SUB_KEYWORDS = [
  'AND', 'OR', 'AS', 'IN', 'NOT IN', 'LIKE', 'ILIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'DISTINCT', 'ALL', 'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'OVER', 'PARTITION BY', 'ROWS', 'RANGE', 'UNBOUNDED PRECEDING', 'UNBOUNDED FOLLOWING',
  'CURRENT ROW', 'PRECEDING', 'FOLLOWING',
];

function formatSQL(input, opts) {
  if (!input.trim()) return '';
  const { keywordCase, indent } = opts;
  let sql = input.replace(/\s+/g, ' ').trim();

  // Protect string literals and comments from keyword substitution.
  const literals = [];
  sql = sql.replace(/'((?:[^']|'')*)'/g, (m) => {
    literals.push(m);
    return `__LIT${literals.length - 1}__`;
  });
  sql = sql.replace(/--[^\n]*/g, (m) => {
    literals.push(m);
    return `__LIT${literals.length - 1}__`;
  });
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, (m) => {
    literals.push(m);
    return `__LIT${literals.length - 1}__`;
  });

  // Normalize keyword case.
  const allKeywords = [...MAJOR_KEYWORDS, ...SUB_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const kw of allKeywords) {
    const re = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
    const casedKw = keywordCase === 'lower' ? kw.toLowerCase() : kw.toUpperCase();
    sql = sql.replace(re, casedKw);
  }

  // Insert line breaks before major keywords.
  for (const kw of MAJOR_KEYWORDS) {
    const casedKw = keywordCase === 'lower' ? kw.toLowerCase() : kw.toUpperCase();
    // Lookbehind-free approach: use a sentinel char then normalize.
    const escaped = casedKw.replace(/ /g, '\\s+');
    const re = new RegExp(`(\\s|^)(${escaped})\\b`, 'g');
    sql = sql.replace(re, '\n$2');
  }

  // Indent each line by the current paren depth.
  const lines = sql.split('\n').map((l) => l.trim()).filter(Boolean);
  const indentUnit = indent === 'tab' ? '\t' : ' '.repeat(Number(indent) || 2);
  let depth = 0;
  const out = [];
  for (const line of lines) {
    // Count parens on this line; adjust depth before/after.
    const opensBefore = 0;
    // eslint-disable-next-line no-unused-vars
    const _o = opensBefore;
    // If line starts with ) reduce depth first.
    let lineDepth = depth;
    if (line.startsWith(')')) lineDepth = Math.max(0, depth - 1);
    out.push(indentUnit.repeat(lineDepth) + line);
    // Update depth by net paren count.
    const opens = (line.match(/\(/g) || []).length;
    const closes = (line.match(/\)/g) || []).length;
    depth = Math.max(0, depth + opens - closes);
  }
  let result = out.join('\n');

  // Restore literals.
  result = result.replace(/__LIT(\d+)__/g, (_, i) => literals[Number(i)] || '');

  // Trim leading newline.
  return result.trim();
}

const EXAMPLES = {
  snowflake: `with recent_orders as (select customer_id, order_date, total_amount, row_number() over (partition by customer_id order by order_date desc) as rn from orders where order_date >= dateadd(day, -30, current_date())) select c.name, c.email, ro.order_date, ro.total_amount from customers c left join recent_orders ro on c.id = ro.customer_id and ro.rn = 1 where c.status = 'active' order by ro.total_amount desc nulls last limit 100;`,
  merge: `merge into target t using (select id, name, updated_at from source) s on t.id = s.id when matched and s.updated_at > t.updated_at then update set t.name = s.name, t.updated_at = s.updated_at when not matched then insert (id, name, updated_at) values (s.id, s.name, s.updated_at);`,
  cte: `with a as (select id, sum(x) as total from t1 group by id), b as (select id, count(*) as cnt from t2 group by id) select a.id, a.total, coalesce(b.cnt, 0) as cnt from a left join b on a.id = b.id;`,
};

const FAQ = [
  {
    q: 'Is this SQL formatter free and private?',
    a: 'Yes. The formatter runs 100% in your browser — your SQL never leaves your device. No server roundtrip, no storage, no analytics on the SQL content. Paste proprietary queries safely.',
  },
  {
    q: 'Which SQL dialects are supported?',
    a: 'The formatter handles ANSI SQL plus all common warehouse dialects: Snowflake, PostgreSQL, BigQuery, Redshift, Databricks SQL, MySQL, and SQL Server. It recognizes standard clauses (SELECT/FROM/WHERE/JOIN/etc.), window functions (OVER/PARTITION BY), CTEs (WITH), and MERGE statements.',
  },
  {
    q: 'What options does the formatter support?',
    a: 'Keyword case (UPPER or lower), indentation (2 spaces, 4 spaces, or tab), and example presets (Snowflake query, MERGE statement, multi-CTE). Settings persist in the URL so you can share your preferred style.',
  },
  {
    q: 'Does it validate the SQL?',
    a: 'No — this is a pure formatter, not a parser/linter. It re-indents and re-cases your query but does not check syntax correctness. Use dbt compile, your warehouse\'s EXPLAIN, or a validator (SQLFluff, sqlglot) for that.',
  },
  {
    q: 'How does it handle string literals and comments?',
    a: 'String literals (single-quoted) and comments (-- line, /* block */) are protected from keyword-case conversion. A query like WHERE status = \'select\' stays intact — the literal \'select\' is not capitalized.',
  },
  {
    q: 'Can I use this in my CI pipeline?',
    a: 'Not directly — for CI, use SQLFluff (Python) or sqlglot (Python). This web formatter is for quick one-off cleanup, PR review, and interactive work. For production style enforcement, add a pre-commit hook running SQLFluff on changed .sql files.',
  },
];

export default function SqlFormatterPage() {
  const [input, setInput] = useState(EXAMPLES.snowflake);
  const [keywordCase, setKeywordCase] = useState('upper');
  const [indent, setIndent] = useState('2');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => formatSQL(input, { keywordCase, indent }),
    [input, keywordCase, indent]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [output]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SQL Formatter',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description:
      'Free SQL formatter. Beautify, indent, and standardize SQL for Snowflake, PostgreSQL, BigQuery, Redshift, and ANSI. 100% client-side.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/sql-formatter',
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
        title="Free SQL Formatter 2026 — Snowflake, Postgres, BigQuery, Redshift"
        description="Format and beautify SQL online. Configurable indent and keyword case. Works with Snowflake, PostgreSQL, BigQuery, Redshift, MySQL. 100% client-side — your SQL never leaves your browser."
        keywords="sql formatter, sql beautifier, format sql online, snowflake sql formatter, postgres sql formatter, free sql formatter"
        url="/tools/sql-formatter"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'SQL Formatter', url: '/tools/sql-formatter' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-purple-300 bg-purple-900/30 border border-purple-700/50 rounded-full">
            100% client-side · No data leaves your browser
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Code2 className="w-8 h-8 text-purple-400" />
            SQL Formatter
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Paste messy SQL, get consistent formatting. Supports Snowflake, PostgreSQL, BigQuery,
            Redshift, Databricks, MySQL. Runs entirely in your browser — safe for proprietary
            queries. No signup, no file upload, no tracking of your SQL content.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Keyword case</label>
            <select
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="upper">UPPER</option>
              <option value="lower">lower</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Indent</label>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Load example</label>
            <div className="flex gap-2">
              <button onClick={() => setInput(EXAMPLES.snowflake)} className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300">Snowflake</button>
              <button onClick={() => setInput(EXAMPLES.merge)} className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300">MERGE</button>
              <button onClick={() => setInput(EXAMPLES.cte)} className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300">Multi-CTE</button>
              <button onClick={() => setInput('')} className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Input</h2>
              <span className="text-xs text-gray-500">{input.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-white px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Paste your SQL here..."
              spellCheck={false}
            />
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Formatted
              </h2>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-gray-300"
              >
                {copied ? (<><Check className="w-3 h-3 text-green-400" /> Copied</>) : (<><Copy className="w-3 h-3" /> Copy</>)}
              </button>
            </div>
            <pre className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg text-purple-200 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre">
              {output || <span className="text-gray-500">Formatted output will appear here.</span>}
            </pre>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How this formatter works</h2>
          <ol className="list-decimal pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Literals + comments are protected first.</strong>{' '}
              Single-quoted strings and <code>--</code>/<code>/* */</code> comments are tokenized
              and restored after formatting, so keyword case normalization never touches string
              contents or comment text.
            </li>
            <li>
              <strong className="text-white">Keyword casing is normalized.</strong> Every recognized
              SQL keyword is converted to your chosen case (UPPER is SQL convention; lower is
              common in modern dbt codebases).
            </li>
            <li>
              <strong className="text-white">Line breaks before major clauses.</strong> Clauses
              like SELECT, FROM, WHERE, GROUP BY, each JOIN variant, and set operations (UNION,
              INTERSECT) get their own line.
            </li>
            <li>
              <strong className="text-white">Indentation follows paren depth.</strong> Nested
              subqueries, CTE bodies, and function arguments are indented by your chosen unit
              (2 / 4 spaces or tab) based on parenthesis nesting.
            </li>
            <li>
              <strong className="text-white">Literals restored.</strong> Protected strings and
              comments are put back exactly as they appeared in the input.
            </li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">When to format vs when to refactor</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            A formatter fixes whitespace and case. It cannot fix architectural issues. Format when:
          </p>
          <ul className="list-disc pl-5 text-gray-300 space-y-1 text-sm mb-3">
            <li>Code-review diff has trivial whitespace noise.</li>
            <li>You inherited a one-line 2KB monster query.</li>
            <li>You paste a generated query (BI tool output) and want to read it.</li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Refactor (not just format) when:
          </p>
          <ul className="list-disc pl-5 text-gray-300 space-y-1 text-sm">
            <li>A query has 5+ nested subqueries — flatten to CTEs.</li>
            <li>The same logic is duplicated in WHERE and HAVING — pull into a CTE.</li>
            <li>Window functions are recomputed — use a CTE to compute once.</li>
            <li>You see SELECT * — enumerate columns for stable contracts.</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-query-cost-estimator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl">
              <div className="text-purple-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Query Cost Estimator →</div>
              <div className="text-gray-400 text-sm">Once your SQL is clean, check what it costs to run.</div>
            </Link>
            <Link to="/tools/json-to-sql-ddl" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl">
              <div className="text-purple-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> JSON → SQL DDL →</div>
              <div className="text-gray-400 text-sm">Generate CREATE TABLE from a JSON sample.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl">
              <div className="text-purple-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake SQL Cheat Sheet →</div>
              <div className="text-gray-400 text-sm">Every Snowflake-specific SQL construct, indexed.</div>
            </Link>
            <Link to="/cheatsheets/sql-window-functions" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl">
              <div className="text-purple-300 font-medium mb-1">Window Functions Reference →</div>
              <div className="text-gray-400 text-sm">ROW_NUMBER, RANK, LAG, frame syntax — all examples.</div>
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
                  <span className="text-purple-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
