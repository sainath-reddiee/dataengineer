// src/pages/PracticeQuizPage.jsx
// Orchestrates the full quiz flow: mode selection -> question loop -> results.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as LucideIcons from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import QuestionCard from '@/components/practice/QuestionCard';
import QuizModeSelector from '@/components/practice/QuizModeSelector';
import ProgressBar from '@/components/practice/ProgressBar';
import Timer from '@/components/practice/Timer';
import WeaknessHeatmap from '@/components/practice/WeaknessHeatmap';
import ShareScoreCard from '@/components/practice/ShareScoreCard';
import { getQuiz } from '@/data/practice';
import { useQuiz } from '@/hooks/useQuiz';
import { useQuizStore } from '@/hooks/useQuizStore';
import { quizBreadcrumbs, getQuizSchema } from '@/lib/practiceSeo';

const Icon = ({ name, className }) => {
  const Cmp = LucideIcons[name] || LucideIcons.BookOpen;
  return <Cmp className={className} />;
};

const PracticeQuizPage = () => {
  const { slug } = useParams();
  const quiz = getQuiz(slug);
  const [mode, setMode] = useState(null); // 'practice' | 'exam' | 'topic' | 'review'
  const [topicSlug, setTopicSlug] = useState(null);
  const store = useQuizStore();

  const selectedQuestions = useMemo(() => {
    if (!quiz) return [];
    if (mode === 'topic' && topicSlug) {
      return quiz.questions.filter((q) => q.topicSlug === topicSlug);
    }
    if (mode === 'review') {
      const ids = new Set(store.bookmarks[slug] || []);
      return quiz.questions.filter((q) => ids.has(q.id));
    }
    return quiz.questions;
  }, [quiz, mode, topicSlug, slug, store.bookmarks]);

  const timeLimitSec = mode === 'exam' && quiz ? quiz.meta.durationMinutes * 60 : null;

  const q = useQuiz({
    questions: selectedQuestions,
    mode: mode || 'practice',
    timeLimitSec,
    shuffleQuestions: true,
    shuffleOptions: true,
  });

  // Persist attempt when quiz completes
  useEffect(() => {
    if (q.status === 'complete' && q.total > 0) {
      const attempt = q.buildAttempt(slug, topicSlug ? { topicSlug } : {});
      store.addAttempt(attempt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.status]);

  if (!quiz) return <Navigate to="/practice" replace />;

  const meta = quiz.meta;
  const crumbs = quizBreadcrumbs(meta);
  const schema = getQuizSchema(meta, quiz.questions);

  return (
    <>
      <MetaTags
        title={`${meta.title} - Free Online Practice Exam`}
        description={meta.description}
        url={`/practice/${slug}`}
        breadcrumbs={crumbs}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={crumbs} />
          </div>

          {/* MODE SELECTION */}
          {!mode && (
            <>
              <header className={`bg-gradient-to-br ${meta.heroGradient} rounded-xl p-6 md:p-8 mb-8`}>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Icon name={meta.icon} className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
                      {meta.provider} · {meta.examCode}
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2">
                      {meta.title}
                    </h1>
                    <p className="text-white/90 leading-relaxed">{meta.description}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <Stat label="Duration" value={`${meta.durationMinutes} min`} />
                  <Stat label="Passing" value={`${meta.passingScore}%`} />
                  <Stat label="Questions" value={quiz.questions.length} />
                  <Stat label="Level" value={meta.difficulty} />
                </div>
              </header>

              <section className="mb-8">
                <h2 className="text-white font-semibold text-lg mb-3">Choose a mode</h2>
                <QuizModeSelector
                  onSelect={(m) => {
                    setMode(m);
                    if (m !== 'topic') {
                      setTopicSlug(null);
                      setTimeout(() => q.start(), 0);
                    }
                  }}
                />
              </section>

              {mode === 'topic' && null}

              <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h2 className="text-white font-semibold mb-3">Exam Domains</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                  {meta.officialDomains.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                {meta.officialUrl && (
                  <a
                    href={meta.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm text-blue-300 hover:text-blue-200 underline"
                  >
                    Official certification page &rarr;
                  </a>
                )}
              </section>
            </>
          )}

          {/* TOPIC SELECTION (when mode=topic but not started) */}
          {mode === 'topic' && q.status === 'idle' && (
            <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Choose a topic</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quiz.topics.map((t) => {
                  const count = quiz.questions.filter((x) => x.topicSlug === t.slug).length;
                  return (
                    <li key={t.slug}>
                      <button
                        type="button"
                        disabled={count === 0}
                        onClick={() => {
                          setTopicSlug(t.slug);
                          setTimeout(() => q.start(), 0);
                        }}
                        className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 disabled:opacity-50 disabled:hover:bg-slate-800/60 rounded-lg p-4 transition-colors"
                      >
                        <div className="font-medium text-white">{t.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {count} question{count === 1 ? '' : 's'}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="mt-4 text-sm text-slate-400 hover:text-slate-200"
              >
                &larr; Back to mode selection
              </button>
            </section>
          )}

          {/* IN-PROGRESS QUIZ */}
          {q.status === 'inProgress' && q.currentQuestion && (
            <>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <ProgressBar
                    current={q.currentIdx}
                    total={q.total}
                    answers={q.orderedQuestions.reduce((acc, qq, i) => {
                      if (q.answers[qq.id]) acc[i] = q.answers[qq.id];
                      return acc;
                    }, {})}
                  />
                </div>
                <Timer
                  timeLeft={q.timeLeft}
                  elapsedSec={q.elapsedSec}
                  mode={mode === 'exam' ? 'countdown' : 'elapsed'}
                />
              </div>

              <QuestionCard
                question={q.currentQuestion}
                answerState={q.answers[q.currentQuestion.id]}
                onSelect={q.selectAnswer}
                onSubmit={q.submitAnswer}
                showFeedback={mode !== 'exam'}
                quizSlug={slug}
              />

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={q.prev}
                  disabled={q.currentIdx === 0}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium"
                >
                  ← Previous
                </button>
                {q.currentIdx === q.total - 1 ? (
                  <button
                    type="button"
                    onClick={q.finish}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    Finish Quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={q.next}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          )}

          {/* COMPLETE */}
          {q.status === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
                <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">Your Score</div>
                <div
                  className={`text-6xl md:text-7xl font-bold mb-2 ${
                    q.score.percent >= meta.passingScore ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {q.score.percent}%
                </div>
                <div className="text-slate-300">
                  {q.score.correct} of {q.score.total} correct ·{' '}
                  {q.score.percent >= meta.passingScore ? 'Passed 🎯' : `Need ${meta.passingScore}% to pass`}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Time: {Math.floor(q.elapsedSec / 60)}m {q.elapsedSec % 60}s
                </div>
              </div>

              <WeaknessHeatmap topics={quiz.topics} breakdown={q.topicBreakdown} quizSlug={slug} />

              <ShareScoreCard
                quizSlug={slug}
                quizTitle={meta.shortTitle}
                score={q.score.percent}
                correct={q.score.correct}
                total={q.score.total}
              />

              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null);
                    setTopicSlug(null);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  Try another mode
                </button>
                <Link
                  to="/practice"
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  Back to all quizzes
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-white/10 rounded-lg px-3 py-2">
    <div className="text-xs text-white/70">{label}</div>
    <div className="text-white font-semibold">{value}</div>
  </div>
);

export default PracticeQuizPage;
