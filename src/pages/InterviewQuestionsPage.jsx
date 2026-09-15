import { Link } from 'react-router-dom';
import { Bookmark, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import MetaTags from '@/components/SEO/MetaTags';
import DodoCheckoutButton from '@/components/DodoCheckoutButton';
import {
  FREE_QUESTION_LIMIT,
  INTERVIEW_QUESTIONS,
  INTERVIEW_TRACKS,
  isInterviewQuestionFree,
} from '@/data/interviewQuestionBank';
import { useMembership } from '@/hooks/useMembership';
import { useSavedItems } from '@/hooks/useSavedItems';

export default function InterviewQuestionsPage() {
  const { isPro } = useMembership();
  const { toggleQuestion, isQuestionSaved } = useSavedItems();
  const [track, setTrack] = useState('all');
  const [openId, setOpenId] = useState(null);

  const list = useMemo(
    () => INTERVIEW_QUESTIONS.filter((q) => track === 'all' || q.track === track),
    [track]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Data engineering interview questions — original Hub answers"
        description="Thirty original DE interview prompts with production answers: SQL windows, Snowflake cost, dbt grain, Airflow SLAs, and on-call stories. First 12 are free. Not a scraped dump."
        url="/interview-questions"
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Interview bank
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Answers you can say in a live round
        </h1>
        <p className="mt-4 text-base text-slate-300">
          {INTERVIEW_QUESTIONS.length} prompts written for DataEngineer Hub — warehouse cost,
          grain, and on-call, not trivia from another product. The first {FREE_QUESTION_LIMIT}{' '}
          are free. Hub Pro unlocks the rest on this device after Dodo checkout. Pair with the{' '}
          <Link to="/interview-prep" className="text-blue-400 hover:underline">14-day plan</Link>
          {' '}and{' '}
          <Link to="/coding" className="text-blue-400 hover:underline">SQL pads</Link>.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTrack('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              track === 'all' ? 'bg-blue-500 text-white' : 'border border-white/15 text-slate-300'
            }`}
          >
            All
          </button>
          {INTERVIEW_TRACKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTrack(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                track === item.id ? 'bg-blue-500 text-white' : 'border border-white/15 text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ol className="mt-8 space-y-4">
          {list.map((question, index) => {
            const globalIndex = INTERVIEW_QUESTIONS.indexOf(question);
            const locked = !isInterviewQuestionFree(globalIndex) && !isPro;
            const open = openId === question.id;
            return (
              <li
                key={question.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-white">
                    {globalIndex + 1}. {question.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => toggleQuestion(question.id)}
                    className="shrink-0 text-slate-400 hover:text-white"
                    aria-label="Save question"
                  >
                    <Bookmark className={`h-4 w-4 ${isQuestionSaved(question.id) ? 'fill-amber-400 text-amber-300' : ''}`} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-400">{question.prompt}</p>
                {locked ? (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-slate-200">
                    <p className="inline-flex items-center gap-1 font-semibold text-amber-200">
                      <Lock className="h-3.5 w-3.5" /> Hub Pro model answer
                    </p>
                    <p className="mt-1 text-slate-400">
                      The free set covers windows, repeats, and warehouse credits. This one is in
                      the paid bank.
                    </p>
                    <div className="mt-3">
                      <DodoCheckoutButton
                        sku="pro_monthly"
                        source="interview_bank"
                        className="inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
                      >
                        Unlock Hub Pro
                      </DodoCheckoutButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : question.id)}
                      className="mt-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      {open ? 'Hide model answer' : 'Show model answer'}
                    </button>
                    {open && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{question.answer}</p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
