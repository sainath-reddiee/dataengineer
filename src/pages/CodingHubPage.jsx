import { Link } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { CODING_PROBLEMS, codingProblemHref } from '@/data/codingProblems';
import { useLearnProgress } from '@/hooks/useLearnProgress';

export default function CodingHubPage() {
  const { solvedCount, isSolved } = useLearnProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="SQL coding practice — DuckDB in the browser"
        description="Eight original SQL pads on employees, orders, and web_events. Run them in the DuckDB playground. Progress stays on this device. No signup."
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
          {solvedCount}/{CODING_PROBLEMS.length} pads marked solved in this browser. These use the
          playground sample tables — not a scraped exam dump, and not another site&apos;s warehouse.
          Open a pad, run the query, then mark it solved.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {CODING_PROBLEMS.map((problem) => {
            const done = isSolved(problem.slug);
            return (
              <article
                key={problem.slug}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{problem.title}</h2>
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                      <Check className="h-3 w-3" /> Solved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {problem.difficulty} · {problem.topic} · {problem.table}
                </p>
                <p className="mt-3 text-sm text-slate-400">{problem.prompt}</p>
                <Link
                  to={codingProblemHref(problem)}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300"
                >
                  <Play className="h-3.5 w-3.5" />
                  Open in playground
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-slate-400">
          Want timed cert quizzes instead?{' '}
          <Link to="/practice" className="text-blue-400 hover:underline">Practice tests</Link>
          {' '}are a different track.
        </p>
      </div>
    </div>
  );
}
