import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import { CODING_PROBLEMS } from '@/data/codingProblems';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import { useQuizStore } from '@/hooks/useQuizStore';
import { useStreak } from '@/hooks/useStreak';
import { useReadingList } from '@/hooks/useReadingList';

export default function ProgressPage() {
  const { solvedCount, solved, lastRunAt, clearProgress, isSolved } = useLearnProgress();
  const { attempts, getBestScore } = useQuizStore();
  const streak = useStreak(attempts);
  const { items, count } = useReadingList();

  const quizSlugs = [...new Set(attempts.map((a) => a.quizSlug).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Your progress on this device"
        description="SQL pads, certification attempts, and reading list stored in this browser only."
        url="/progress"
        noindex
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          This browser
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Track coding, quizzes, and reading
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          No account. Solved pads, quiz attempts, streaks, and the reading list live in
          localStorage on this device — the same model as an on-device membership, without a
          Stripe login.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="SQL pads" value={`${solvedCount}/${CODING_PROBLEMS.length}`} />
          <Stat label="Quiz attempts" value={String(attempts.length)} />
          <Stat label="Day streak" value={String(streak.current)} />
          <Stat label="Reading list" value={String(count)} />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">SQL coding</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CODING_PROBLEMS.map((problem) => (
              <li key={problem.slug} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                <span className={isSolved(problem.slug) ? 'text-blue-200' : 'text-slate-400'}>
                  {problem.title}
                </span>
                <Link to={`/coding`} className="text-xs font-semibold text-blue-400">
                  {isSolved(problem.slug) ? 'Solved' : 'Open'}
                </Link>
              </li>
            ))}
          </ul>
          {lastRunAt && (
            <p className="mt-2 text-xs text-slate-500">Last playground run {lastRunAt.slice(0, 10)}</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Certification quizzes</h2>
          {quizSlugs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              No attempts yet.{' '}
              <Link to="/practice" className="text-blue-400 hover:underline">Open practice tests</Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {quizSlugs.map((slug) => (
                <li key={slug} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-200">{slug}</span>
                  <span className="text-slate-400">best {getBestScore(slug) ?? 0}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Reading list</h2>
          {count === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Save articles from the library. They appear here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {items.slice(0, 12).map((item) => (
                <li key={item.slug}>
                  <Link to={`/articles/${item.slug}`} className="text-blue-400 hover:underline">
                    {item.title || item.slug}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={clearProgress}
          className="mt-10 text-xs text-slate-500 hover:text-slate-300"
        >
          Clear SQL pad progress on this device
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
