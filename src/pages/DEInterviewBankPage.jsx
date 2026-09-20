import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import { Lock, Search, Sparkles, Filter, CheckCircle, ArrowRight, HelpCircle, Loader2 } from 'lucide-react';

const DIFFICULTIES = ['All', 'EASY', 'MEDIUM', 'HARD'];
const TYPES = ['All', 'SQL', 'Python', 'Behavioral', 'System design'];
const ROLES_FILTER = ['All roles', 'Data Analyst', 'BI Analyst', 'Analytics Engineer', 'Data Engineer', 'Data Scientist', 'ML Engineer', 'MLOps Engineer', 'AI Engineer', 'Data Architect'];

const DIFF_STYLES = {
  EASY:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HARD:   'bg-red-500/20 text-red-300 border-red-500/30',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DEInterviewBankPage = () => {
  const [difficulty, setDifficulty] = useState('All');
  const [type, setType] = useState('All');
  const [role, setRole] = useState('All roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [drillMode, setDrillMode] = useState(false);
  const [drillIndex, setDrillIndex] = useState(0);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3002/api/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch questions:', err);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (difficulty !== 'All' && q.difficulty !== difficulty) return false;
      if (type !== 'All' && q.type !== type) return false;
      if (role !== 'All roles' && q.role !== role) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query) ||
          (q.company && q.company.toLowerCase().includes(query)) ||
          (q.platform && q.platform.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [difficulty, type, role, searchQuery, questions]);

  const currentQuestion = drillMode ? filtered[drillIndex % filtered.length] : null;

  return (
    <>
      <MetaTags
        title="Interview Bank — DataEngineer Hub"
        description="Comprehensive real-world interview questions for SQL, PySpark, Python, System Design, and Behavioral across all data roles."
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-12">

          {/* ── Page Header / Hero Section ── */}
          <div className="mb-10 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                INTERVIEW QUESTION BANK
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Real-World Data Interview Questions
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Curated questions extracted from actual technical screens at Meta, Stripe, Netflix, Amazon, Databricks, Snowflake, and OpenAI. Filter by role, platform, or topic.
              </p>
            </div>
          </div>

          {/* ── Stats counters ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { v: `${questions.length}`, l: 'Interview Questions' },
              { v: '9',    l: 'Data Roles Covered' },
              { v: '15+',  l: 'Tech Platforms' },
              { v: '100%', l: 'Production Tested' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-2xl font-extrabold text-emerald-400">{s.v}</p>
                <p className="text-xs text-slate-400 font-medium">{s.l}</p>
              </div>
            ))}
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6" id="bank">
            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty */}
              <div className="flex gap-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      difficulty === d
                        ? 'bg-emerald-600 text-white font-semibold shadow-md'
                        : 'border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Type */}
              <div className="flex flex-wrap gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      type === t
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Role filter */}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {ROLES_FILTER.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topic or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Drill mode toggle */}
              <button
                onClick={() => { setDrillMode(!drillMode); setDrillIndex(0); }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                  drillMode
                    ? 'bg-amber-500 text-slate-900 shadow-md font-bold'
                    : 'border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {drillMode ? '✓ Drill ON' : 'Drill Mode'}
              </button>
            </div>
          </div>

          {/* ── Drill mode ── */}
          {drillMode && filtered.length > 0 && (
            <div className="mb-10 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/80 p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                  DRILL MODE — {drillIndex + 1} / {filtered.length}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDrillIndex((i) => Math.max(0, i - 1))}
                    disabled={drillIndex === 0}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 disabled:opacity-40 hover:bg-white/10 transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setDrillIndex((i) => (i + 1) % filtered.length)}
                    className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
              {currentQuestion && (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className={`rounded-md border px-3 py-1 text-xs font-bold ${DIFF_STYLES[currentQuestion.difficulty]}`}>
                      {currentQuestion.difficulty}
                    </span>
                    <span className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                      {currentQuestion.type}
                    </span>
                    {currentQuestion.company && (
                      <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 font-bold">
                        {currentQuestion.company}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white leading-tight mb-5">{currentQuestion.question}</p>
                  <p className="text-sm font-medium text-gray-400">{currentQuestion.role} · {currentQuestion.topic} {currentQuestion.platform && `· ${currentQuestion.platform}`}</p>
                </>
              )}
            </div>
          )}

          {/* ── Question List ── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-400 mb-4 px-2">
              <span>Showing {filtered.length} questions</span>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : filtered.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl border p-6 sm:p-8 transition-all shadow-lg hover:shadow-xl group ${
                  q.proOnly
                    ? 'border-white/5 bg-slate-900/30'
                    : 'border-white/5 bg-slate-900/40 hover:border-white/15 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${DIFF_STYLES[q.difficulty] || ''}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 font-semibold">{q.type}</span>
                      {q.company && (
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          {q.company}
                        </span>
                      )}
                      {q.platform && <span className="text-xs text-slate-400 font-medium">· {q.platform}</span>}
                    </div>

                    <p className={`text-lg leading-relaxed ${q.proOnly ? 'text-slate-300' : 'text-white group-hover:text-emerald-300 transition-colors'}`}>
                      {q.question}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-5 text-sm text-slate-400">
                      <span className="text-emerald-400 font-medium">{q.role}</span>
                      <span>·</span>
                      <span>{q.topic}</span>
                    </div>
                  </div>

                  {q.proOnly && (
                    <span className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 shrink-0">
                      <Lock className="h-3.5 w-3.5" />
                      Pro
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Pro Upgrade Banner ── */}
          <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Ready to master medium and hard questions?</h2>
            <p className="text-sm text-slate-300 mb-5 max-w-md mx-auto">
              Easy questions stay free forever. Upgrade Pro to unlock all 200+ medium and hard questions, architectural breakdowns, and reference solutions.
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

export default DEInterviewBankPage;
