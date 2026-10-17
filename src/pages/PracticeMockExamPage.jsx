// src/pages/PracticeMockExamPage.jsx
// Timed mock exam over a practice bank: pick a length, answer under a real
// exam clock with no feedback, then review every answer with explanations.
import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Flag } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import QuestionCard from '@/components/practice/QuestionCard';
import Timer from '@/components/practice/Timer';
import WeaknessHeatmap from '@/components/practice/WeaknessHeatmap';
import ShareScoreCard from '@/components/practice/ShareScoreCard';
import MockExamNavigator from '@/components/practice/MockExamNavigator';
import MockLengthPicker from '@/components/practice/MockLengthPicker';
import { getQuiz } from '@/data/practice';
import { useMockExam } from '@/hooks/useMockExam';
import { isAnswerCorrect } from '@/lib/practice/mockExam';
import { quizBreadcrumbs } from '@/lib/practiceSeo';
import { getCanonicalUrl } from '@/lib/seoConfig';

const fmtDuration = (sec) => `${Math.floor(sec / 60)}m ${sec % 60}s`;
const noop = () => {};

const PracticeMockExamPage = () => {
  const { slug } = useParams();
  const quiz = getQuiz(slug);
  const m = useMockExam(slug, quiz);
  const [confirming, setConfirming] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('wrong');

  const wrongIds = useMemo(() => {
    if (m.phase !== 'results' || !m.exam) return [];
    return m.exam.questions.filter((q) => !isAnswerCorrect(q, m.answers[q.id])).map((q) => q.id);
  }, [m.phase, m.exam, m.answers]);

  if (!quiz) return <Navigate to="/practice" replace />;

  const meta = quiz.meta;
  const crumbs = [...quizBreadcrumbs(meta), { name: 'Mock exam', url: getCanonicalUrl(`/practice/${slug}/mock-exam`) }];
  const current = m.exam?.questions[m.idx];
  const answeredCount = m.exam ? m.exam.questions.filter((q) => (m.answers[q.id] || []).length > 0).length : 0;

  const reviewList = m.phase === 'results' && m.exam
    ? m.exam.questions.filter((q) => {
      if (reviewFilter === 'wrong') return wrongIds.includes(q.id);
      if (reviewFilter === 'flagged') return m.flags.has(q.id);
      return true;
    })
    : [];

  return (
    <>
      <MetaTags
        title={`${meta.shortTitle} Timed Mock Exam`}
        description={`Timed ${meta.shortTitle} mock exam at the official pace, with domain-weighted questions, a pass mark and a full answer review.`}
        url={`/practice/${slug}/mock-exam`}
        breadcrumbs={crumbs}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={crumbs} />
          </div>

          {m.phase === 'setup' && (
            <>
              <header className={`bg-gradient-to-br ${meta.heroGradient} rounded-xl p-6 md:p-8 mb-8`}>
                <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
                  {meta.provider} · {meta.examCode}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2">
                  {meta.shortTitle} timed mock exam
                </h1>
                <p className="text-white/90 leading-relaxed">
                  Questions are drawn in proportion to the exam domains and timed at the official pace
                  ({meta.durationMinutes} minutes for {meta.totalOfficialQuestions} questions). No answers are shown
                  until you submit.
                </p>
              </header>

              {m.saved && (
                <section className="mb-6 border border-amber-500/50 bg-amber-500/10 rounded-xl p-5" aria-live="polite">
                  <h2 className="text-white font-semibold">
                    {m.saved.expired ? 'Your unfinished exam ran out of time' : 'You have an unfinished exam'}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {m.saved.ids.length} questions, {Object.keys(m.saved.answers || {}).length} answered.
                    {m.saved.expired ? ' Open it to see the score for what you answered.' : ' The clock kept running while you were away.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" onClick={m.resume} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium">
                      {m.saved.expired ? 'See the result' : 'Resume'}
                    </button>
                    <button type="button" onClick={m.discardSaved} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
                      Discard it
                    </button>
                  </div>
                </section>
              )}

              <section className="mb-8">
                <h2 className="text-white font-semibold text-lg mb-3">Choose a length</h2>
                <MockLengthPicker meta={meta} poolSize={quiz.questions.length} onPick={(len) => m.start(len)} />
              </section>

              <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-sm text-slate-300">
                <h2 className="text-white font-semibold mb-3">How it works</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Move freely between questions and flag any you want to revisit.</li>
                  <li>The exam submits itself when the clock reaches zero. Unanswered questions count as wrong.</li>
                  <li>Progress is saved in this browser, so a refresh does not lose your answers.</li>
                  <li>Pass mark shown is {meta.passingScore}%. Real exams use scaled scoring, so treat it as a guide.</li>
                </ul>
                <p className="mt-4">
                  Prefer instant feedback? Use the <Link to={`/practice/${slug}`} className="text-blue-300 underline">practice modes</Link> instead.
                </p>
              </section>
            </>
          )}

          {m.phase === 'exam' && current && (
            <>
              <h1 className="sr-only">{meta.shortTitle} timed mock exam</h1>
              <div className="flex items-center justify-between gap-3 mb-4 min-h-10">
                <div className="text-sm text-slate-300">
                  Question <span className="font-mono text-white">{m.idx + 1}</span> of {m.exam.questions.length}
                  <span className="text-slate-500"> · {answeredCount} answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => m.toggleFlag(current.id)}
                    aria-pressed={m.flags.has(current.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${
                      m.flags.has(current.id) ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-slate-700 bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <Flag className="w-4 h-4" aria-hidden />
                    {m.flags.has(current.id) ? 'Flagged' : 'Flag'}
                  </button>
                  <Timer timeLeft={m.timeLeft} mode="countdown" warnUnderSec={300} />
                </div>
              </div>

              <QuestionCard
                question={current}
                answerState={{ selectedIds: m.answers[current.id] || [], submitted: false }}
                onSelect={m.select}
                onSubmit={noop}
                showFeedback={false}
                hideSubmit
              />

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => m.setIdx(Math.max(0, m.idx - 1))}
                  disabled={m.idx === 0}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium"
                >
                  ← Previous
                </button>
                {m.idx < m.exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => m.setIdx(m.idx + 1)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    Submit exam
                  </button>
                )}
              </div>

              <div className="mt-6">
                <MockExamNavigator
                  questions={m.exam.questions}
                  answers={m.answers}
                  flags={m.flags}
                  current={m.idx}
                  onGo={m.setIdx}
                />
              </div>

              <div className="mt-4">
                {confirming ? (
                  <div className="border border-emerald-500/50 bg-emerald-900/20 rounded-xl p-4" role="group" aria-label="Confirm submit">
                    <p className="text-slate-200 text-sm">
                      Submit now? {m.exam.questions.length - answeredCount} unanswered and {m.flags.size} flagged.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" onClick={() => { setConfirming(false); m.submit(); }} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                        Submit and see results
                      </button>
                      <button type="button" onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
                        Keep going
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirming(true)} className="text-sm text-slate-400 hover:text-slate-200 underline">
                    Submit exam early
                  </button>
                )}
              </div>
            </>
          )}

          {m.phase === 'results' && m.result && (
            <div className="space-y-6">
              <div className="text-center py-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
                <h1 className="text-sm uppercase tracking-wider text-slate-400 mb-2">{meta.shortTitle} mock exam score</h1>
                <div className={`text-6xl md:text-7xl font-bold mb-2 ${m.result.percent >= meta.passingScore ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {m.result.percent}%
                </div>
                <div className="text-slate-300">
                  {m.result.correct} of {m.result.total} correct ·{' '}
                  {m.result.percent >= meta.passingScore ? 'At or above the pass mark' : `Pass mark is ${meta.passingScore}%`}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Time used: {fmtDuration(m.result.durationSec)} of {fmtDuration(m.exam.timeLimitSec)}. Real exams use scaled scoring.
                </div>
              </div>

              <WeaknessHeatmap topics={quiz.topics} breakdown={m.result.byTopic} quizSlug={slug} />

              <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-white font-semibold">Review your answers</h2>
                  <div className="flex gap-1 text-sm" role="group" aria-label="Filter review">
                    {[
                      ['wrong', `Wrong (${wrongIds.length})`],
                      ['flagged', `Flagged (${m.flags.size})`],
                      ['all', `All (${m.exam.questions.length})`],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={reviewFilter === key}
                        onClick={() => setReviewFilter(key)}
                        className={`px-3 py-1.5 rounded-lg border ${reviewFilter === key ? 'border-blue-400 bg-blue-500/20 text-white' : 'border-slate-700 text-slate-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {reviewList.length === 0 && <p className="text-slate-400 text-sm">Nothing to show for this filter.</p>}
                <ol className="space-y-4">
                  {reviewList.map((q) => (
                    <li key={q.id}>
                      <QuestionCard
                        question={q}
                        answerState={{
                          selectedIds: m.answers[q.id] || [],
                          submitted: true,
                          correct: isAnswerCorrect(q, m.answers[q.id]),
                        }}
                        onSelect={noop}
                        onSubmit={noop}
                        showFeedback
                        quizSlug={slug}
                      />
                    </li>
                  ))}
                </ol>
              </section>

              <ShareScoreCard
                quizSlug={slug}
                quizTitle={`${meta.shortTitle} mock exam`}
                score={m.result.percent}
                correct={m.result.correct}
                total={m.result.total}
              />

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                {m.exam.lengthId !== 'retake' && (
                  <button type="button" onClick={() => m.start(m.exam.lengthId)} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
                    Retake, same length
                  </button>
                )}
                {wrongIds.length > 0 && (
                  <button type="button" onClick={() => m.start('retake', { onlyIds: wrongIds })} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium">
                    Retake the {wrongIds.length} wrong
                  </button>
                )}
                <button type="button" onClick={m.backToSetup} className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium">
                  Change length
                </button>
                <Link to={`/practice/${slug}`} className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium">
                  Back to practice modes
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PracticeMockExamPage;
