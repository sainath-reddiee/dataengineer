// src/pages/PracticeQuestionPage.jsx
// Deep-linkable single question page - optimized for SEO and LinkedIn shares.

import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import BookmarkButton from '@/components/practice/BookmarkButton';
import { getQuiz, getQuestionBySlug } from '@/data/practice';
import { questionBreadcrumbs, getQuestionSchema, getFaqSchema } from '@/lib/practiceSeo';

const PracticeQuestionPage = () => {
  const { slug, questionSlug } = useParams();
  const quiz = getQuiz(slug);
  const question = getQuestionBySlug(slug, questionSlug);

  if (!quiz || !question) return <Navigate to={`/practice/${slug || ''}`} replace />;

  const crumbs = questionBreadcrumbs(quiz.meta, question);
  const qSchema = getQuestionSchema(question, quiz.meta);
  const faqSchema = getFaqSchema([{ q: question.stem, a: question.explanation }]);

  return (
    <>
      <MetaTags
        title={`${question.stem.slice(0, 60)} - ${quiz.meta.shortTitle}`}
        description={question.explanation.slice(0, 160)}
        url={`/practice/${slug}/q/${questionSlug}`}
        breadcrumbs={crumbs}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(qSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={crumbs} />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wider text-slate-400 mb-3">
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {quiz.meta.shortTitle}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {question.difficulty}
              </span>
            </div>
            <BookmarkButton quizSlug={slug} questionId={question.id} />
          </div>

          <article className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 md:p-8">
            <h1 className="text-xl md:text-2xl font-bold text-white leading-snug mb-6">
              {question.stem}
            </h1>

            <ul className="space-y-2 mb-8">
              {question.options.map((o) => {
                const correct = question.correctIds.includes(o.id);
                return (
                  <li
                    key={o.id}
                    className={`px-4 py-3 rounded-lg border ${
                      correct
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <span className="font-mono text-xs opacity-60 mr-2">{o.id.toUpperCase()}.</span>
                    {o.text}
                    {correct && <span className="ml-2 text-xs font-semibold">✓ Correct answer</span>}
                  </li>
                );
              })}
            </ul>

            <section>
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-2">Explanation</h2>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </div>
            </section>

            {question.references?.length > 0 && (
              <section className="mt-6 pt-6 border-t border-slate-800">
                <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-2">References</h2>
                <ul className="space-y-1 text-sm">
                  {question.references.map((r) => (
                    <li key={r}>
                      <a
                        href={r}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline break-all"
                      >
                        {r}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/practice/${slug}`}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              Take the full {quiz.meta.shortTitle} quiz →
            </Link>
            <Link
              to={`/practice/${slug}/topics/${question.topicSlug}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              More {question.topicSlug.replace(/-/g, ' ')} questions
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeQuestionPage;
