// src/pages/InterviewQuestionBankPage.jsx
// Filterable interview question bank with hidden answers and spaced-
// repetition status, built from the Q&A in the cheat sheets.
import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import InterviewFilters from '@/components/interview/InterviewFilters';
import { cheatsheets } from '@/data/cheatsheetData';
import ownerQuestions from '@/data/interview/questions.json';
import { buildBank, filterBank, srsStatus, stackForSheet } from '@/lib/interview/bank';
import { SRS_NAMESPACE } from '@/hooks/useInterviewDrill';
import { useQuizStore } from '@/hooks/useQuizStore';
import { getCanonicalUrl } from '@/lib/seoConfig';

const FILTER_KEYS = ['stack', 'sheet', 'level', 'q'];
const CHIP = {
  new: 'border-slate-600 text-slate-300',
  due: 'border-amber-400 text-amber-200',
  learning: 'border-emerald-500 text-emerald-200',
};
const CHIP_LABEL = { new: 'New', due: 'Due for review', learning: 'Learning' };

const InterviewQuestionBankPage = () => {
  const [params, setParams] = useSearchParams();
  const { getSRS, storeVersion } = useQuizStore();
  const bank = useMemo(() => buildBank(cheatsheets, ownerQuestions), []);
  const sheets = useMemo(() => cheatsheets
    .filter((s) => stackForSheet(s.slug) && (s.sections || []).some((x) => x.type === 'qna'))
    .map((s) => ({ slug: s.slug, title: s.title, stack: stackForSheet(s.slug) })), []);
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || undefined]));
  const items = filterBank(bank, filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const srs = useMemo(() => getSRS(SRS_NAMESPACE), [getSRS, storeVersion]);
  const dueCount = items.filter((i) => srsStatus(srs[i.id]) === 'due').length;
  const query = params.toString();

  const setFilters = (next) => {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) if (next[k]) p.set(k, next[k]);
    setParams(p, { replace: true });
  };

  const crumbs = [
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Interview Prep', url: getCanonicalUrl('/interview-prep') },
    { name: 'Question bank', url: getCanonicalUrl('/interview-prep/questions') },
  ];

  return (
    <>
      <MetaTags
        title="Data Engineering Interview Question Bank"
        description="Filter data engineering interview questions by stack, topic and level, reveal answers when you are ready, and drill the ones you miss with spaced repetition."
        url="/interview-prep/questions"
        breadcrumbs={crumbs}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6"><Breadcrumbs breadcrumbs={crumbs} /></div>
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Interview question bank</h1>
            <p className="text-slate-300">
              {bank.length} questions from the interview cheat sheets. Answers stay hidden until you open them. Drill mode
              shows one at a time and schedules the ones you miss for review.
            </p>
          </header>

          <InterviewFilters filters={filters} sheets={sheets} onChange={setFilters} />

          <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 min-h-11">
            <p className="text-sm text-slate-300">
              {items.length} question{items.length === 1 ? '' : 's'}{dueCount ? `, ${dueCount} due for review` : ''}
            </p>
            {items.length > 0 && (
              <Link
                to={`/interview-prep/drill${query ? `?${query}` : ''}`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
              >
                Drill these &rarr;
              </Link>
            )}
          </div>

          <ol className="space-y-2">
            {items.map((item) => {
              const status = srsStatus(srs[item.id]);
              return (
                <li key={item.id}>
                  <details className="group bg-slate-900/70 border border-slate-800 rounded-lg">
                    <summary className="cursor-pointer list-none p-4 flex items-start justify-between gap-3">
                      <span className="text-white font-medium">{item.question}</span>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${CHIP[status]}`}>{CHIP_LABEL[status]}</span>
                    </summary>
                    <div className="px-4 pb-4 text-slate-200 leading-relaxed whitespace-pre-wrap border-t border-slate-800 pt-3">
                      {item.answer}
                      {item.tip && <p className="mt-3 text-sm text-amber-200 whitespace-normal">Tip: {item.tip}</p>}
                      {item.source && (
                        <p className="mt-3 text-sm text-slate-400 whitespace-normal">
                          {item.difficulty} · From <Link to={item.source} className="text-blue-300 underline">{item.sheetTitle}</Link>
                        </p>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
          {items.length === 0 && <p className="text-slate-400">No questions match these filters.</p>}
        </div>
      </div>
    </>
  );
};

export default InterviewQuestionBankPage;
