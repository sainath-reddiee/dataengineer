import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import { Lock, CheckCircle, Search, Filter, Play, ArrowRight, Sparkles, Terminal } from 'lucide-react';

// ─── Data: 9 roles ────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'data-analyst',        tags: 'SQL, GRAIN, BI',                name: 'Data Analyst',        desc: 'SQL you can defend, a metric someone will argue with, and a BI-shaped interview loop.' },
  { id: 'bi-analyst',          tags: 'DASHBOARDS, GRAIN, WAREHOUSE',  name: 'BI Analyst',          desc: 'Warehouse SQL at dashboard grain. Windows, ranking, and a refresh that does not lie.' },
  { id: 'analytics-engineer',  tags: 'DBT, TESTS, METRICS',           name: 'Analytics Engineer',  desc: 'Mart SQL, tests that page someone, and a metric finance can trust.' },
  { id: 'data-engineer',       tags: 'PIPELINES, WAREHOUSES, ON-CALL',name: 'Data Engineer',       desc: 'SQL, orchestration, streaming, and the platform sketch they ask at 5pm.' },
  { id: 'data-scientist',      tags: 'SQL, STATS, EXPERIMENTS',       name: 'Data Scientist',      desc: "SQL for features, stats without vibes, and a holdout you would defend." },
  { id: 'ml-engineer',         tags: 'TRAIN, SERVE, ROLLBACK',        name: 'ML Engineer',         desc: 'Features as tables. Latency as an SLA. Metrics you can put in CI.' },
  { id: 'mlops-engineer',      tags: 'GATES, SERVING, INCIDENTS',     name: 'MLOps Engineer',      desc: 'The SQL that proves training and serving agree, then the gate that blocks a bad model.' },
  { id: 'ai-engineer',         tags: 'RAG, EVAL, RETRIEVAL',          name: 'AI Engineer',         desc: 'Retrieval is a pipeline. Eval is a job. The model brand is not the incident.' },
  { id: 'data-architect',      tags: 'GRAIN, COST, PAVED ROADS',      name: 'Data Architect',      desc: 'You still have to query the mart you designed. Quality SQL and a time you said no.' },
];

// ─── Data: Problem tracks ─────────────────────────────────────────────────────

const TRACKS = [
  { id: 'sql-foundations', type: 'SQL', count: '5 PROBLEMS', name: 'Snowflake & Postgres Core', desc: 'Filtered aggregation, product joins, and the org-tree self-join on modern DWs.', solved: 0, total: 5 },
  { id: 'windows-time', type: 'SQL', count: '6 PROBLEMS', name: 'Windows & Time Series', desc: 'Running totals, trailing averages, growth, and share of total in Snowflake.', solved: 0, total: 6 },
  { id: 'dbt-modeling', type: 'PYTHON', count: '5 PROBLEMS', name: 'dbt Data Modeling', desc: 'Writing incremental materializations, Jinja macros, and robust generic tests.', solved: 0, total: 5, pro: true },
  { id: 'data-quality-hard', type: 'SQL', count: '12 PROBLEMS', name: 'Data Quality & Hard SQL', desc: 'Reconciliation, JSON payloads, pivots, and sessionization.', solved: 0, total: 12, pro: true },
  { id: 'pyspark-foundations', type: 'PYTHON', count: '8 PROBLEMS', name: 'PySpark & Databricks', desc: 'DataFrames, Windowing, Broadcast joins, handling Data Skew, and Salting.', solved: 0, total: 8, pro: true },
  { id: 'airflow-orchestration', type: 'PYTHON', count: '6 PROBLEMS', name: 'Airflow & DAGs', desc: 'Custom operators, XComs, dynamic task mapping, and writing reliable sensors.', solved: 0, total: 6, pro: true },
  { id: 'streaming-kafka', type: 'PYTHON', count: '7 PROBLEMS', name: 'Kafka & Streaming', desc: 'Event streams, consumer offsets, exactly-once semantics, and Flink aggregations.', solved: 0, total: 7, pro: true },
  { id: 'vector-llm', type: 'PYTHON', count: '5 PROBLEMS', name: 'Vector DBs & LLMs', desc: 'Pinecone indices, chunking text, semantic search, and building RAG retrieval.', solved: 0, total: 5, pro: true },
];

// ─── Coding Problems List ─────────────────────────────────────────────────────

const PROBLEMS = [
  { id: 'sql-1', title: 'Snowflake: Top 5 Customers by Revenue', difficulty: 'EASY', type: 'SQL', role: 'Data Analyst', company: 'Stripe', desc: 'Aggregate total order amounts per customer and return the top 5 highest spending customers.' },
  { id: 'sql-2', title: 'Postgres: Order Line Aggregations', difficulty: 'EASY', type: 'SQL', role: 'BI Analyst', company: 'Amazon', desc: 'Join order headers and order lines to find orders containing multiple distinct item SKUs.' },
  { id: 'py-1',  title: 'Python: Read and Clean CSV to JSON', difficulty: 'EASY', type: 'PYTHON', role: 'Data Engineer', company: 'Uber', desc: 'Read a malformed CSV with Python and normalize data types before dumping to JSON lines.' },
  { id: 'sql-4', title: 'Snowflake: Deduplicate to Latest Row (Qualify)', difficulty: 'MEDIUM', type: 'SQL', role: 'Data Engineer', company: 'Netflix', desc: 'Filter duplicate event records using QUALIFY ROW_NUMBER() OVER(PARTITION BY key ORDER BY ts DESC) = 1.', pro: true },
  { id: 'sql-5', title: 'BigQuery: Sessionize Clickstream Events', difficulty: 'HARD', type: 'SQL', role: 'Data Engineer', company: 'Airbnb', desc: 'Group clickstream events into sessions defined by 30-minute inactivity gaps using CONDITIONAL_TRUE.', pro: true },
  { id: 'dbt-1', title: 'dbt: Write an Incremental Model', difficulty: 'MEDIUM', type: 'PYTHON', role: 'Analytics Engineer', company: 'Spotify', desc: 'Write a dbt model in Jinja/SQL using the is_incremental() macro to only process recent events.', pro: true },
  { id: 'spark-1', title: 'PySpark: Salting for Data Skew', difficulty: 'HARD', type: 'PYTHON', role: 'Data Engineer', company: 'Meta', desc: 'Join a massive skewed event table with a small dimension table by applying salting to the join keys.', pro: true },
  { id: 'spark-2', title: 'PySpark: Window Functions & Lag', difficulty: 'MEDIUM', type: 'PYTHON', role: 'Data Engineer', company: 'LinkedIn', desc: 'Use PySpark Window.partitionBy to calculate the time difference between consecutive user logins.', pro: true },
  { id: 'airflow-1', title: 'Airflow: Custom API Sensor', difficulty: 'MEDIUM', type: 'PYTHON', role: 'Data Engineer', company: 'DoorDash', desc: 'Implement a custom Airflow Sensor class that polls a REST API with exponential backoff.', pro: true },
  { id: 'kafka-1', title: 'Kafka: Consumer Offset Management', difficulty: 'HARD', type: 'PYTHON', role: 'Data Engineer', company: 'Uber', desc: 'Write a Python Kafka consumer that manually commits offsets to guarantee exactly-once processing.', pro: true },
  { id: 'llm-1', title: 'Pinecone: Generate and Upsert Embeddings', difficulty: 'MEDIUM', type: 'PYTHON', role: 'AI Engineer', company: 'Anthropic', desc: 'Chunk a document, generate embeddings via OpenAI API, and upsert the vectors into a Pinecone Index.', pro: true },
  { id: 'llm-2', title: 'RAG: Semantic Search with LangChain', difficulty: 'HARD', type: 'PYTHON', role: 'AI Engineer', company: 'OpenAI', desc: 'Build a retrieval pipeline querying a vector store and passing top-K chunks to an LLM context window.', pro: true },
];

// ─── SQL topics ───────────────────────────────────────────────────────────────

const SQL_TOPICS = [
  { name: 'Aggregation',     desc: 'GROUP BY, HAVING, conditional sums.' },
  { name: 'Window functions',desc: 'Running totals, LAG, frames.' },
  { name: 'Time series',     desc: 'Daily growth, moving averages.' },
  { name: 'Semi-structured', desc: 'JSON payloads inside event tables.' },
  { name: 'Statistics',      desc: 'Median, percentiles, distribution.' },
  { name: 'Joins',           desc: 'Fan-out, fan-in, and self-joins.' },
  { name: 'Ranking',         desc: 'ROW_NUMBER, top-N per group.' },
  { name: 'Sessionization',  desc: 'Inactivity gaps into session IDs.' },
  { name: 'Data quality',    desc: 'Reconciliation and duplicate detection.' },
  { name: 'Anti-joins',      desc: 'Missing rows without the NOT IN trap.' },
  { name: 'Deduplication',   desc: 'Latest row per key.' },
  { name: 'Pivot',           desc: 'Rows to columns with conditional aggregation.' },
];

// ─── Sample warehouse tables ──────────────────────────────────────────────────

const WAREHOUSE_TABLES = [
  { name: 'orders',     size: '~200 rows',  desc: 'Order headers. One row per order, amount is the order total.' },
  { name: 'customers',  size: '~12 rows',   desc: 'Customer dimension. Every customer has at least one order in seed.' },
  { name: 'order_items',size: '~250 rows',  desc: 'Order lines. Some orders carry multiple items.' },
  { name: 'products',   size: '~5 rows',    desc: 'Product dimension across three categories.' },
  { name: 'payments',   size: '~180 rows',  desc: 'Settlements. Cancelled orders have no payment row.' },
  { name: 'events',     size: '~400 rows',  desc: 'Clickstream, payload is raw JSON — use json_extract.' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const DEPracticePadsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const progress = { solved: 0, total: 60 };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'problems', name: 'Problems' },
    { id: 'tracks', name: 'Tracks' },
    { id: 'sandbox', name: 'Sandbox' },
    { id: 'interview-prep', name: 'Interview prep' },
  ];

  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter((p) => {
      if (selectedRole !== 'All' && p.role.toLowerCase().replace(' ', '-') !== selectedRole.toLowerCase().replace(' ', '-')) return false;
      if (selectedType !== 'All' && p.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedRole, selectedType, searchQuery]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'sandbox') {
      navigate('/tools/sql-playground');
    } else if (tabId === 'interview-prep') {
      navigate('/interview');
    } else {
      const el = document.getElementById(tabId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <MetaTags
        title="Coding Practice — DataEngineer Hub"
        description="SQL and Python coding practice for data analysts, BI analysts, analytics engineers, data engineers, scientists, and ML engineers."
      />

      <div className="min-h-screen bg-slate-950 text-white">

        {/* ── Sticky Sub-nav Tabs ── */}
        <div className="border-b border-white/10 bg-slate-950/90 sticky top-14 z-40 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      active
                        ? 'border-emerald-500 text-emerald-400 font-semibold'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* ── Hero section ── */}
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              PRACTICE PADS
            </span>
            <h1 className="text-3xl font-bold text-white mt-1 mb-2">Coding practice</h1>
            <p className="text-gray-400 leading-relaxed max-w-2xl text-sm">
              One problem list for Python and SQL, split into paths for analysts, BI, analytics engineers,
              data engineers, scientists, ML, MLOps, AI engineers, and architects. Tests run directly in browser.
            </p>
          </div>

          {/* ── Progress bar ── */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">YOUR PROGRESS</p>
                <p className="text-2xl font-bold text-white">{progress.solved}/{progress.total}</p>
              </div>
              <div className="text-right text-xs text-gray-400 space-y-0.5">
                <p>33 Python · 27 SQL · 1 easy SQL · 13 medium SQL · 13 hard SQL</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(progress.solved / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Progress and editor state stay on this browser.</p>
          </div>

          {/* ── Quick-start buttons ── */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              to="/tools/sql-playground?problem=mean"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all shadow-md"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start Python · Mean
            </Link>
            <Link
              to="/tools/sql-playground?problem=orders"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition-all"
            >
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              Start SQL · Order Items
            </Link>
            <button
              onClick={() => handleTabClick('problems')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition-all"
            >
              Browse all problems ({PROBLEMS.length})
            </button>
          </div>

          {/* ── Filter by Data Role ── */}
          <section className="mb-12" id="overview">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Filter by data role</h2>
                <p className="text-xs text-gray-400 mt-0.5">Click a role to filter problems and roadmaps.</p>
              </div>
              {selectedRole !== 'All' && (
                <button
                  onClick={() => setSelectedRole('All')}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Reset role filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(isSelected ? 'All' : role.id);
                      setActiveTab('problems');
                    }}
                    className={`cursor-pointer rounded-2xl border p-6 transition-all shadow-md hover:shadow-xl ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/5 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-slate-900/70'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/80 mb-2">
                      {role.tags}
                    </p>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {role.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-5 leading-relaxed">{role.desc}</p>
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link to="/roadmaps" className="text-xs px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">Roadmap</Link>
                      <button onClick={() => { setSelectedRole(role.id); setActiveTab('problems'); }} className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors">Coding</button>
                      <Link to="/interview" className="text-xs px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">Interview</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Problems Section ── */}
          <section className="mb-12" id="problems">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Coding Problems</h2>
                <p className="text-xs text-gray-400 mt-0.5">Filter by type, difficulty, or search term.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900 py-1.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="SQL">SQL Only</option>
                  <option value="PYTHON">Python Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {filteredProblems.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-white/5 bg-slate-900/40 p-6 sm:p-8 hover:bg-slate-900/60 hover:border-white/15 transition-all shadow-lg hover:shadow-xl group"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${p.type === 'SQL' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-purple-500/10 border border-purple-500/20 text-purple-300'}`}>
                        {p.type}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        p.difficulty === 'EASY' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : p.difficulty === 'MEDIUM' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'
                      }`}>
                        {p.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {p.company}
                      </span>
                      {p.pro && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                          <Lock className="h-3 w-3" /> Pro
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{p.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{p.desc}</p>
                  </div>

                  <Link
                    to="/tools/sql-playground"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors shrink-0"
                  >
                    <span>Solve in Sandbox</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tracks Section ── */}
          <section className="mb-12" id="tracks">
            <h2 className="text-xl font-bold text-white mb-1">Problem tracks</h2>
            <p className="text-sm text-gray-400 mb-6">
              Sequenced learning paths built for technical screens and warehouse loops.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TRACKS.map((track) => (
                <div
                  key={track.id}
                  className={`rounded-2xl border p-6 sm:p-8 relative flex flex-col justify-between shadow-lg hover:shadow-xl ${
                    track.pro
                      ? 'border-white/5 bg-slate-900/30'
                      : 'border-white/10 bg-slate-900/50 hover:border-emerald-500/40 transition-all'
                  }`}
                >
                  {track.pro && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                        <Lock className="h-3 w-3" />
                        Pro
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${track.type === 'SQL' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-purple-500/10 border-purple-500/20 text-purple-300'}`}>
                        {track.type}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">{track.count}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{track.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">{track.desc}</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm font-medium text-gray-400">
                    <span>{track.solved}/{track.total} solved</span>
                    <Link to="/tools/sql-playground" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">Start track <ArrowRight className="w-4 h-4" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SQL Topics ── */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-1">SQL Topics</h2>
            <p className="text-sm text-gray-400 mb-6">Direct access to essential warehouse patterns.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SQL_TOPICS.map((topic) => (
                <Link
                  key={topic.name}
                  to="/tools/sql-playground"
                  className="rounded-lg border border-white/10 bg-slate-900/40 p-3 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all group"
                >
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors mb-0.5">
                    {topic.name}
                  </p>
                  <p className="text-xs text-gray-400">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Sample Warehouse ── */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-1">Sample Warehouse Schema</h2>
            <p className="text-sm text-gray-400 mb-6">Pre-populated tables available inside the SQL sandbox.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {WAREHOUSE_TABLES.map((table) => (
                <div key={table.name} className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-emerald-400 font-mono">{table.name}</p>
                    <span className="text-[10px] text-gray-400 font-mono">{table.size}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{table.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Pro Upgrade CTA ── */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Ready to unlock medium and hard pads?</h2>
            <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
              Easy pads stay free. Upgrade to unlock all 57 medium & hard warehouse problems and solutions.
            </p>
            <Link
              to="/upgrade"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Upgrade to Pro — $12/mo
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default DEPracticePadsPage;
