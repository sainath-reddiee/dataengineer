// src/pages/PracticeHubPage.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as LucideIcons from 'lucide-react';
import { Search, Link2, Check, ChevronDown } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import StreakBadge from '@/components/practice/StreakBadge';
import { getAllQuizMeta, QUIZZES } from '@/data/practice';
import { useQuizStore } from '@/hooks/useQuizStore';
import { useStreak } from '@/hooks/useStreak';
import { hubBreadcrumbs, getHubSchema, getFaqSchema } from '@/lib/practiceSeo';

// Categorized, anchored FAQ. `id` values are the URL fragment anchors.
const FAQ_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'scoring', label: 'Scoring & analysis' },
  { id: 'tracks', label: 'Tracks & content' },
  { id: 'account', label: 'Account & data' },
];

const FAQS = [
  // --- General ---
  {
    id: 'free',
    category: 'general',
    q: 'Are these practice tests free?',
    a: 'Yes — every practice test on Data Engineer Hub is completely free, with no signup required. Your progress is stored locally in your browser.',
  },
  {
    id: 'signup',
    category: 'general',
    q: 'Do I need to create an account?',
    a: 'No account is needed. Nothing is stored on our servers. Attempts, streaks, and best scores are kept in your browser\'s localStorage only.',
  },
  {
    id: 'mobile',
    category: 'general',
    q: 'Do practice tests work on mobile?',
    a: 'Yes. The quiz UI is responsive and works on phones and tablets. For long-form exam simulations, a larger screen (tablet or laptop) gives a more exam-realistic experience.',
  },
  {
    id: 'offline',
    category: 'general',
    q: 'Can I practice offline?',
    a: 'Once a quiz page has loaded, you can continue answering questions even if your network drops — the questions are included with the page. Your attempt will save to localStorage when you finish.',
  },

  // --- Scoring & analysis ---
  {
    id: 'scoring',
    category: 'scoring',
    q: 'How is my score calculated?',
    a: 'Each question contributes equally. Your score is the percentage of questions answered correctly in that attempt. Multi-select questions require all correct options selected (and no incorrect ones) to count as correct.',
  },
  {
    id: 'exam-match',
    category: 'scoring',
    q: 'How closely do these match the real certification exam?',
    a: 'Our questions are written to mirror the style, difficulty, and domain weighting of the official exam blueprint. Each question includes a detailed explanation and links to authoritative documentation. Expect the real exam to feel familiar in format but have its own question bank.',
  },
  {
    id: 'review',
    category: 'scoring',
    q: 'Can I review my past attempts?',
    a: 'Yes. All attempts are saved in your browser (localStorage). You can see your best score, most recent attempt date, and per-topic performance on each quiz page.',
  },
  {
    id: 'topic-breakdown',
    category: 'scoring',
    q: 'Do I see per-topic performance?',
    a: 'Yes. After finishing an attempt, the results screen breaks down your accuracy by topic/domain so you can see which areas to re-study. This is the fastest way to find your weak spots.',
  },
  {
    id: 'explanations',
    category: 'scoring',
    q: 'Do questions include explanations?',
    a: 'Yes. Every question has a detailed explanation of why the correct answer is correct — and usually why the common wrong answers are tempting. Links to official docs are provided where relevant.',
  },

  // --- Tracks & content ---
  {
    id: 'daily-challenge',
    category: 'tracks',
    q: 'Is there a daily challenge?',
    a: 'Practice every day to build a streak. Even one question per day keeps your streak alive. Your current streak and longest streak are shown at the top of the Practice hub.',
  },
  {
    id: 'which-exam',
    category: 'tracks',
    q: 'Which exams are covered?',
    a: 'Currently: SnowPro Core (COF-C02), SnowPro Specialty Gen AI (GES-C01), and Databricks Data Engineer Associate. New tracks are added when question banks reach production quality — we do not ship partial tracks.',
  },
  {
    id: 'cheatsheets',
    category: 'tracks',
    q: 'Should I pair practice tests with the cheat sheets?',
    a: 'Yes. The Cheat Sheets section has reference material for every track. A typical flow: read the relevant cheat sheet → attempt a quiz → review explanations for missed questions → re-read the cheat sheet sections that came up.',
  },
  {
    id: 'interview-prep',
    category: 'tracks',
    q: 'What about interview prep (not certifications)?',
    a: 'For job-interview prep (not certification exams), use the Interview Prep Hub. It covers SQL, Snowflake, Databricks, AWS, Azure, dbt, Airflow, Python/PySpark, modeling, and system design with a 2-week study plan.',
  },

  // --- Account & data ---
  {
    id: 'reset',
    category: 'account',
    q: 'How do I reset my progress?',
    a: 'Clear your browser\'s site data for this domain (Settings → Privacy → Clear site data), or use your browser\'s devtools to remove the practice-related keys from localStorage. There is no server-side account to reset.',
  },
  {
    id: 'sync',
    category: 'account',
    q: 'Will my progress sync across devices?',
    a: 'No — because there is no account, your streak and history stay on the device you practice on. If you practice on a phone and a laptop, each device has its own progress.',
  },
  {
    id: 'share',
    category: 'account',
    q: 'Can I share my results?',
    a: 'Yes. The results page includes a share action that produces a link or shareable summary of your score. Shared results are static snapshots — they do not expose your local history.',
  },
  {
    id: 'privacy',
    category: 'account',
    q: 'Is any of my practice data sent to a server?',
    a: 'No practice content (attempts, scores, answers) is sent to our servers. The site uses standard analytics for page-level traffic, but your quiz interactions stay in your browser.',
  },
];

const Icon = ({ name, className }) => {
  const Cmp = LucideIcons[name] || LucideIcons.BookOpen;
  return <Cmp className={className} />;
};

// FAQ item with accordion + anchor copy button
const FaqItem = ({ item, defaultOpen }) => {
  const [open, setOpen] = useState(!!defaultOpen);
  const [copied, setCopied] = useState(false);
  const detailsRef = useRef(null);

  useEffect(() => {
    if (defaultOpen && detailsRef.current) {
      detailsRef.current.open = true;
      setOpen(true);
    }
  }, [defaultOpen]);

  const copyAnchor = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = `${window.location.origin}${window.location.pathname}#faq-${item.id}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      }
      window.history.replaceState(null, '', `#faq-${item.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <details
      ref={detailsRef}
      id={`faq-${item.id}`}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 open:bg-slate-800/70 scroll-mt-20"
    >
      <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between gap-3">
        <span className="flex-1">{item.q}</span>
        <span className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyAnchor}
            title="Copy link to this answer"
            aria-label="Copy link to this answer"
            className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-amber-300 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          </button>
          <ChevronDown className="w-4 h-4 text-amber-400 group-open:rotate-180 transition-transform" />
        </span>
      </summary>
      <p className="mt-3 text-gray-300 text-sm leading-relaxed">{item.a}</p>
    </details>
  );
};

const PracticeHubPage = () => {
  const quizzes = getAllQuizMeta();
  const { attempts, getBestScore, getLastAttempt } = useQuizStore();
  const streak = useStreak(attempts);
  const crumbs = hubBreadcrumbs();
  const hubSchema = getHubSchema(quizzes);

  // FAQ schema uses the same FAQS array (backwards compatible — q/a keys).
  const faqSchema = getFaqSchema(FAQS);

  // --- FAQ state: category filter + search + deep-link support ---
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  // On mount: read URL hash, auto-scroll to matching FAQ and open it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#faq-')) return;
    const id = hash.replace('#faq-', '');
    const match = FAQS.find((f) => f.id === id);
    if (!match) return;
    setActiveCat('all');
    setOpenId(id);
    // give layout a tick
    const t = setTimeout(() => {
      const el = document.getElementById(`faq-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (activeCat !== 'all' && f.category !== activeCat) return false;
      if (!q) return true;
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    });
  }, [activeCat, query]);

  return (
    <>
      <MetaTags
        title="Free Certification Practice Tests - Snowflake, Databricks"
        description="Free interactive practice exams for SnowPro Core, SnowPro Gen AI, and Databricks Data Engineer Associate. Instant feedback, topic-level scoring, shareable results. No signup."
        url="/practice"
        breadcrumbs={crumbs}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(hubSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={crumbs} />
          </div>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <StreakBadge current={streak.current} longest={streak.longest} />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Free Certification Practice Tests
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl">
              Interactive, instantly-scored practice exams for data engineering certifications.
              Built with detailed explanations, topic-level analysis, and shareable results.
              No signup required.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {quizzes.map((q) => {
              const best = getBestScore(q.slug);
              const last = getLastAttempt(q.slug);
              const totalQuestions = QUIZZES[q.slug]?.questions?.length || 0;
              return (
                <Link
                  key={q.slug}
                  to={`/practice/${q.slug}`}
                  className="group relative bg-slate-900/80 border border-slate-800 hover:border-slate-600 rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                >
                  <div className={`bg-gradient-to-br ${q.heroGradient} p-5`}>
                    <Icon name={q.icon} className="w-8 h-8 text-white mb-2" />
                    <div className="text-xs uppercase tracking-wider text-white/80">
                      {q.provider} · {q.examCode}
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1 leading-tight">
                      {q.shortTitle}
                    </h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-300 leading-relaxed mb-4 line-clamp-3">
                      {q.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-800/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Difficulty</div>
                        <div className="text-slate-200 font-medium">{q.difficulty}</div>
                      </div>
                      <div className="bg-slate-800/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Questions</div>
                        <div className="text-slate-200 font-medium">{totalQuestions} practice</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-sm text-slate-400">
                        {best != null ? `Best: ${best}%` : 'Not attempted yet'}
                      </span>
                      <span className="text-sm font-medium text-blue-300 group-hover:text-blue-200">
                        Start &rarr;
                      </span>
                    </div>
                    {last && (
                      <div className="mt-2 text-xs text-slate-500">
                        Last attempt: {last.score}% on {new Date(last.finishedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>

          {/* FAQ section — collapsible, searchable, categorized, deep-linkable */}
          <section
            id="faq"
            aria-labelledby="faq-heading"
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 md:p-8 scroll-mt-20"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
              <div>
                <h2 id="faq-heading" className="text-2xl font-bold text-white mb-1">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-slate-400">
                  {FAQS.length} answers · expand, search, or copy a direct link to any answer.
                </p>
              </div>
              <label className="relative w-full md:w-72" aria-label="Search FAQ">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/70 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </label>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="FAQ categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeCat === 'all'}
                onClick={() => setActiveCat('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeCat === 'all'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                All ({FAQS.length})
              </button>
              {FAQ_CATEGORIES.map((c) => {
                const count = FAQS.filter((f) => f.category === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCat === c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      activeCat === c.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Accordion list */}
            {visibleFaqs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4">
                No questions match &quot;{query}&quot;. Try a different term or clear the filter.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleFaqs.map((f) => (
                  <FaqItem key={f.id} item={f} defaultOpen={openId === f.id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default PracticeHubPage;
