// src/pages/RoadmapsHubPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import ProgressMeter from '@/components/roadmaps/ProgressMeter';
import { ROADMAPS } from '@/data/roadmaps';
import { useAllRoadmapProgress } from '@/hooks/useRoadmapProgress';

const HUB_INTRO =
  'Step-by-step learning paths for data roles. Each skill links to a tutorial, cheat sheet, tool or practice test on this site. Tick skills off as you go; progress stays in your browser.';

const RoadmapsHubPage = () => {
  const progress = useAllRoadmapProgress(ROADMAPS);
  return (
    <>
      <MetaTags
        title="Data Engineering Role Roadmaps"
        description="Learning roadmaps for data engineers, analytics engineers and data platform engineers, built from tutorials, cheat sheets, tools and practice tests."
        url="/roadmaps"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Role roadmaps</h1>
            <p className="text-lg text-slate-300 max-w-3xl">{HUB_INTRO}</p>
          </header>
          <ul className="grid gap-5">
            {ROADMAPS.map((r) => {
              const p = progress[r.slug];
              return (
                <li key={r.slug} className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white">
                    <Link to={`/roadmaps/${r.slug}`} className="hover:text-blue-200">{r.title}</Link>
                  </h2>
                  <p className="text-slate-300 mt-1 mb-4">{r.tagline}</p>
                  <ProgressMeter done={p.done} total={p.total} percent={p.percent} label={r.title} />
                  <Link
                    to={`/roadmaps/${r.slug}`}
                    className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
                  >
                    {p.done === 0 ? 'Start' : p.done === p.total ? 'Review' : 'Resume'} &rarr;
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default RoadmapsHubPage;
