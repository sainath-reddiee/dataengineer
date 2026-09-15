import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { CERT_TRACKS } from '@/data/certsCatalog';

export default function CertsHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Data engineering certifications — Hub map"
        description="SnowPro Core and Advanced, Databricks DE Associate, AWS DEA, dbt, and Airflow as diagnostics. Timed quizzes and sheets on DataEngineer Hub. A badge is not a senior loop."
        url="/certs"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Certifications
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Sit the exam as a diagnostic, not a personality
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Snowflake-deep study still lives at{' '}
          <Link to="/certification" className="text-blue-400 hover:underline">/certification</Link>
          — domains, fees, and the embedded practice tool. This page is the menu across vendors:
          what the exam actually tests, what we would study on this site instead of a dump, and
          which quiz to fail first.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {CERT_TRACKS.map((track) => (
            <article
              key={track.slug}
              className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/80">
                {track.vendor}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">{track.title}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {track.examFee} · {track.length}
              </p>
              <p className="mt-3 text-sm text-slate-400">{track.blurb}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{track.hubTake}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to={track.href} className="inline-flex items-center text-blue-400 hover:text-blue-300">
                  Hub path <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link to={track.practiceHref} className="text-slate-300 hover:text-white">
                  Practice
                </Link>
                <Link to={track.sheetHref} className="text-slate-300 hover:text-white">
                  Sheet
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-400">
          Timed quizzes:{' '}
          <Link to="/practice" className="text-blue-400 hover:underline">/practice</Link>
          . Interview SQL is not a cert:{' '}
          <Link to="/interview-questions" className="text-blue-400 hover:underline">interview bank</Link>.
        </p>
      </div>
    </div>
  );
}
