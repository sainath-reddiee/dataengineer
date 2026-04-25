// src/pages/PracticeTopicPage.jsx
// SEO page: lists all questions in a topic with explanations (read-only study guide).

import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { getQuiz, getTopicBySlug, getQuestionsForTopic } from '@/data/practice';
import { topicBreadcrumbs, getFaqSchema } from '@/lib/practiceSeo';

const PracticeTopicPage = () => {
  const { slug, topicSlug } = useParams();
  const quiz = getQuiz(slug);
  const topic = getTopicBySlug(slug, topicSlug);

  if (!quiz || !topic) return <Navigate to="/practice" replace />;

  const questions = getQuestionsForTopic(slug, topicSlug);
  const crumbs = topicBreadcrumbs(quiz.meta, topic);
  const faqSchema = getFaqSchema(
    questions.slice(0, 10).map((q) => ({
      q: q.stem,
      a: q.explanation,
    })),
  );

  return (
    <>
      <MetaTags
        title={`${topic.name} - ${quiz.meta.shortTitle} Study Guide`}
        description={`${topic.description || topic.name} — ${questions.length} practice questions with detailed explanations for the ${quiz.meta.title}.`}
        url={`/practice/${slug}/topics/${topicSlug}`}
        breadcrumbs={crumbs}
        faqSchema={faqSchema}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={crumbs} />
          </div>

          <header className="mb-8">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
              {quiz.meta.shortTitle} · Topic
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{topic.name}</h1>
            {topic.description && (
              <p className="text-lg text-slate-300">{topic.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link
                to={`/practice/${slug}`}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Start quiz on {quiz.meta.shortTitle}
              </Link>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
                {questions.length} question{questions.length === 1 ? '' : 's'}
              </span>
            </div>
          </header>

          <ol className="space-y-6">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-6"
              >
                <div className="text-xs text-slate-500 mb-2">Q{i + 1} · {q.difficulty}</div>
                <h2 className="text-lg font-semibold text-white mb-3 leading-snug">{q.stem}</h2>
                <ul className="space-y-1.5 mb-4">
                  {q.options.map((o) => {
                    const correct = q.correctIds.includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={`text-sm px-3 py-2 rounded border ${
                          correct
                            ? 'border-emerald-600/50 bg-emerald-500/10 text-emerald-100'
                            : 'border-slate-700 bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <span className="font-mono mr-2 text-xs opacity-60">{o.id.toUpperCase()}.</span>
                        {o.text}
                        {correct && <span className="ml-2 text-xs">✓ correct</span>}
                      </li>
                    );
                  })}
                </ul>
                <div className="bg-slate-800/40 border-l-2 border-blue-500 pl-4 py-2 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {q.explanation}
                </div>
                <div className="mt-3 text-xs">
                  <Link
                    to={`/practice/${slug}/q/${q.slug}`}
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    Permalink to this question →
                  </Link>
                </div>
              </li>
            ))}
          </ol>

          {questions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No questions yet for this topic. Check back soon.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PracticeTopicPage;
