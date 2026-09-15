import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { ROADMAPS } from '@/data/startHerePaths';

export default function RoadmapsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Data engineering roadmaps — Snowflake, dbt, Databricks"
        description="Four practical roadmaps for warehouse, analytics engineering, lakehouse, and interview loops. Each step links a tool, cheat sheet, or quiz already on DataEngineer Hub."
        url="/roadmaps"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Roadmaps
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Four maps. Same Hub, different next job.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          These are not nine cloned role flowcharts. They are the stacks this site actually
          writes about: Snowflake cost, dbt + Airflow, Databricks, and the interview/cert loop.
          Every step is a live page on dataengineerhub.blog.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ROADMAPS.map((map) => (
            <article
              key={map.slug}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <h2 className="text-lg font-semibold text-white">{map.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{map.blurb}</p>
              <ol className="mt-4 space-y-2">
                {map.steps.map((step, index) => (
                  <li key={step.href}>
                    <Link
                      to={step.href}
                      className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
                    >
                      <span className="text-slate-500">{index + 1}.</span>
                      {step.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
