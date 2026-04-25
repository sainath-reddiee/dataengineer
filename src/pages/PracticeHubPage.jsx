// src/pages/PracticeHubPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as LucideIcons from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import StreakBadge from '@/components/practice/StreakBadge';
import { getAllQuizMeta, QUIZZES } from '@/data/practice';
import { useQuizStore } from '@/hooks/useQuizStore';
import { useStreak } from '@/hooks/useStreak';
import { hubBreadcrumbs, getHubSchema, getFaqSchema } from '@/lib/practiceSeo';

const FAQS = [
  {
    q: 'Are these practice tests free?',
    a: 'Yes — every practice test on Data Engineer Hub is completely free, with no signup required. Your progress is stored locally in your browser.',
  },
  {
    q: 'How closely do these match the real certification exam?',
    a: 'Our questions are written to mirror the style, difficulty, and domain weighting of the official exam blueprint. Each question includes a detailed explanation and links to authoritative documentation.',
  },
  {
    q: 'Can I review my past attempts?',
    a: 'Yes. All attempts are saved in your browser (localStorage). You can see your best score, current streak, and per-topic performance on each quiz page.',
  },
  {
    q: 'Is there a daily challenge?',
    a: 'Practice every day to build a streak. Even one question per day keeps your streak alive.',
  },
];

const Icon = ({ name, className }) => {
  const Cmp = LucideIcons[name] || LucideIcons.BookOpen;
  return <Cmp className={className} />;
};

const PracticeHubPage = () => {
  const quizzes = getAllQuizMeta();
  const { attempts, getBestScore, getLastAttempt } = useQuizStore();
  const streak = useStreak(attempts);
  const crumbs = hubBreadcrumbs();
  const hubSchema = getHubSchema(quizzes);
  const faqSchema = getFaqSchema(FAQS);

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

          <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <ul className="space-y-4">
              {FAQS.map((f) => (
                <li key={f.q}>
                  <div className="font-medium text-slate-100 mb-1">{f.q}</div>
                  <div className="text-slate-400 leading-relaxed">{f.a}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};

export default PracticeHubPage;
