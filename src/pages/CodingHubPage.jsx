import { Link } from 'react-router-dom';
import { Check, Lock, Play, Bookmark } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import DodoCheckoutButton from '@/components/DodoCheckoutButton';
import { CODING_PROBLEMS, CODING_TRACKS, codingProblemHref, isCodingProblemFree } from '@/data/codingProblems';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import { useMembership } from '@/hooks/useMembership';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useMemo, useState } from 'react';

export default function CodingHubPage() {
  const { solvedCount, isSolved } = useLearnProgress();
  const { isPro } = useMembership();
  const { toggleCoding, isCodingSaved } = useSavedItems();
  const [topic, setTopic] = useState('all');

  const visible = useMemo(
    () => CODING_PROBLEMS.filter((problem) => topic === 'all' || problem.topic === topic),
    [topic]
  );
  const freeCount = CODING_PROBLEMS.filter(isCodingProblemFree).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="SQL coding practice — DuckDB pads on this site"
        description="Original SQL pads on employees, orders, and web_events. Easy pads are free. Hard pads unlock with Hub Pro via Dodo Payments. Progress stays on this device."
        url="/coding"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          SQL coding
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Write SQL. Run it here. Track it on this device.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          {solvedCount}/{CODING_PROBLEMS.length} pads marked solved in this browser.{' '}
          {freeCount} are free. The rest are Hub Pro — same sample tables, interview-shaped
          anti-joins and sessionization, not a scraped exam dump. Open a pad, run DuckDB in this
          tab, then mark it solved when the columns match.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTopic('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              topic === 'all' ? 'bg-blue-500 text-white' : 'border border-white/15 text-slate-300'
            }`}
          >
            All tracks
          </button>
          {CODING_TRACKS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTopic(name)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                topic === name ? 'bg-blue-500 text-white' : 'border border-white/15 text-slate-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {!isPro && (
          <div className="mt-6 rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-slate-200">
              Hub Pro unlocks the hard pads and the rest of the interview bank. Checkout is Dodo
              Payments live mode — overlay when the Hostinger API is configured, otherwise the
              dashboard payment link.
            </p>
            <div className="mt-3 sm:mt-0 shrink-0">
              <DodoCheckoutButton
                sku="pro_monthly"
                source="coding_hub"
                className="inline-flex min-h-10 items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white"
              >
                Unlock Pro
              </DodoCheckoutButton>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((problem) => {
            const done = isSolved(problem.slug);
            const locked = problem.pro && !isPro;
            return (
              <article
                key={problem.slug}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{problem.title}</h2>
                  <div className="flex items-center gap-2">
                    {problem.pro && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-200">
                        Pro
                      </span>
                    )}
                    {done && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                        <Check className="h-3 w-3" /> Solved
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {problem.difficulty} · {problem.topic} · {problem.table}
                </p>
                <p className="mt-3 text-sm text-slate-400">{problem.prompt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {locked ? (
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Unlock on Pricing
                    </Link>
                  ) : (
                    <Link
                      to={codingProblemHref(problem)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Open in playground
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleCoding(problem.slug)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${isCodingSaved(problem.slug) ? 'fill-amber-400 text-amber-300' : ''}`} />
                    {isCodingSaved(problem.slug) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-slate-400">
          Want timed cert quizzes instead?{' '}
          <Link to="/practice" className="text-blue-400 hover:underline">Practice tests</Link>
          {' '}are a different track. Spoken SQL answers live on{' '}
          <Link to="/interview-questions" className="text-blue-400 hover:underline">the interview bank</Link>.
        </p>
      </div>
    </div>
  );
}
