// src/pages/RoadmapPage.jsx
// One role roadmap: ordered stages of skills, each linking to content on this
// site, with tick-off progress stored in the browser.
import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import ProgressMeter from '@/components/roadmaps/ProgressMeter';
import RoadmapStage from '@/components/roadmaps/RoadmapStage';
import { getRoadmap } from '@/data/roadmaps';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { getCanonicalUrl } from '@/lib/seoConfig';

const RoadmapPage = () => {
  const { slug } = useParams();
  const roadmap = getRoadmap(slug);
  const progress = useRoadmapProgress(roadmap || { slug, stages: [] });
  const [confirmReset, setConfirmReset] = useState(false);

  if (!roadmap) return <Navigate to="/roadmaps" replace />;

  const crumbs = [
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Roadmaps', url: getCanonicalUrl('/roadmaps') },
    { name: roadmap.title, url: getCanonicalUrl(`/roadmaps/${slug}`) },
  ];
  const resume = () => {
    const el = document.getElementById(`skill-${progress.resumeSkillId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <MetaTags title={roadmap.title} description={roadmap.tagline} url={`/roadmaps/${slug}`} breadcrumbs={crumbs} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6"><Breadcrumbs breadcrumbs={crumbs} /></div>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{roadmap.title}</h1>
            <p className="text-lg text-slate-300">{roadmap.tagline}</p>
            {roadmap.intro && <p className="mt-4 text-slate-200 leading-relaxed">{roadmap.intro}</p>}
          </header>

          <div className="sticky top-16 z-10 -mx-4 px-4 py-3 mb-8 bg-slate-950/90 backdrop-blur border-y border-slate-800">
            <ProgressMeter done={progress.done} total={progress.total} percent={progress.percent} label={roadmap.title} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm min-h-8">
              {progress.resumeSkillId && (
                <button type="button" onClick={resume} className="text-blue-300 hover:text-blue-200 underline">
                  {progress.done === 0 ? 'Start at the first skill' : 'Resume where you left off'}
                </button>
              )}
              {progress.done > 0 && !confirmReset && (
                <button type="button" onClick={() => setConfirmReset(true)} className="text-slate-400 hover:text-slate-200 underline">
                  Reset progress
                </button>
              )}
              {confirmReset && (
                <span className="flex items-center gap-3">
                  <span className="text-slate-300">Clear all ticks?</span>
                  <button type="button" onClick={() => { progress.reset(); setConfirmReset(false); }} className="text-rose-300 underline">Yes, reset</button>
                  <button type="button" onClick={() => setConfirmReset(false)} className="text-slate-400 underline">Cancel</button>
                </span>
              )}
            </div>
          </div>

          {roadmap.stages.map((stage, i) => (
            <RoadmapStage key={stage.id} stage={stage} index={i} isDone={progress.isDone} onToggle={progress.toggle} />
          ))}

          <p className="mt-10 text-sm text-slate-400">
            Progress is saved in this browser only. See all <Link to="/roadmaps" className="text-blue-300 underline">role roadmaps</Link>.
          </p>
        </div>
      </div>
    </>
  );
};

export default RoadmapPage;
