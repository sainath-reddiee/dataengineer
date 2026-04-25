// src/components/practice/DomainHeatmap.jsx
// Renders a per-topic accuracy grid with color coding and optional
// remediation links (topic.relatedArticles). Drop into the result screen
// or the hub to surface weaknesses at a glance.

import React from 'react';
import { ArrowRight } from 'lucide-react';

function tone(acc) {
  if (acc == null) return { bar: 'bg-slate-700', label: 'text-slate-400', ring: 'ring-slate-600/40' };
  if (acc >= 0.85) return { bar: 'bg-emerald-500', label: 'text-emerald-300', ring: 'ring-emerald-500/40' };
  if (acc >= 0.7) return { bar: 'bg-lime-500', label: 'text-lime-300', ring: 'ring-lime-500/40' };
  if (acc >= 0.5) return { bar: 'bg-amber-500', label: 'text-amber-300', ring: 'ring-amber-500/40' };
  return { bar: 'bg-rose-500', label: 'text-rose-300', ring: 'ring-rose-500/40' };
}

/**
 * @param {Object} props
 * @param {Array} props.topics            topics.json entries.
 * @param {Object} props.topicAccuracy    { [topicSlug]: number|null } - fraction correct.
 * @param {Object} [props.topicCounts]    { [topicSlug]: { correct, total } } - optional raw counts.
 * @param {string} [props.title]          Heading.
 */
const DomainHeatmap = ({ topics = [], topicAccuracy = {}, topicCounts = {}, title = 'Domain performance' }) => {
  if (!topics.length) return null;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">darker = weaker</span>
      </div>
      <div className="space-y-3">
        {topics.map((t) => {
          const acc = topicAccuracy[t.slug];
          const c = tone(acc);
          const counts = topicCounts[t.slug];
          const pct = acc == null ? 0 : Math.round(acc * 100);
          const label = acc == null ? '— not practiced' : `${pct}%${counts ? ` (${counts.correct}/${counts.total})` : ''}`;
          const articles = t.relatedArticles || [];
          return (
            <div
              key={t.slug}
              className={`rounded-lg bg-slate-950/40 ring-1 ${c.ring} px-3 py-2.5`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="text-sm font-medium text-slate-100 truncate">{t.name}</div>
                <div className={`text-xs font-semibold ${c.label}`}>{label}</div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full ${c.bar}`} style={{ width: `${acc == null ? 0 : pct}%` }} />
              </div>
              {articles.length > 0 && acc != null && acc < 0.7 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {articles.slice(0, 3).map((slug) => (
                    <a
                      key={slug}
                      href={`/articles/${slug}`}
                      className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Remediation: {slug}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DomainHeatmap;
