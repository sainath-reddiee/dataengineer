// src/components/practice/WeaknessHeatmap.jsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shows per-topic score with color-coded bars.
 * @param {Object} props
 * @param {Array<{slug: string, name: string}>} props.topics
 * @param {Record<string, {correct: number, total: number}>} props.breakdown
 * @param {string} props.quizSlug
 */
const WeaknessHeatmap = ({ topics, breakdown, quizSlug }) => {
  if (!topics || topics.length === 0) return null;
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Performance by Topic</h3>
      <ul className="space-y-3">
        {topics.map((t) => {
          const b = breakdown[t.slug];
          if (!b || b.total === 0) {
            return (
              <li key={t.slug} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{t.name}</span>
                <span className="text-slate-600">No questions answered</span>
              </li>
            );
          }
          const pct = Math.round((b.correct / b.total) * 100);
          const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
          const textColor = pct >= 80 ? 'text-emerald-300' : pct >= 60 ? 'text-amber-300' : 'text-rose-300';
          return (
            <li key={t.slug}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <Link
                  to={`/practice/${quizSlug}/topics/${t.slug}`}
                  className="text-slate-200 hover:text-blue-300 font-medium"
                >
                  {t.name}
                </Link>
                <span className={`font-mono ${textColor}`}>
                  {b.correct}/{b.total} · {pct}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
        Click any topic to drill into questions for that area.
      </div>
    </div>
  );
};

export default WeaknessHeatmap;
