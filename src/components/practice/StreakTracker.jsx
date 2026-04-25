// src/components/practice/StreakTracker.jsx
// Richer streak + weekly-activity panel. Complements StreakBadge (compact
// header chip) with a grid that shows the last 7 days of practice.

import React, { useMemo } from 'react';
import { Flame, Calendar, TrendingUp } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * @param {Object} props
 * @param {Array} props.attempts        Attempt[] from useQuizStore.
 * @param {number} [props.current]      Pre-computed current streak (from useStreak).
 * @param {number} [props.longest]      Pre-computed longest streak.
 */
const StreakTracker = ({ attempts = [], current = 0, longest = 0 }) => {
  const { days, weekAttempts } = useMemo(() => {
    const today = startOfDay(new Date());
    const byDay = new Map(); // ms -> count
    for (const a of attempts) {
      if (!a.startedAt) continue;
      const dayMs = startOfDay(new Date(a.startedAt)).getTime();
      byDay.set(dayMs, (byDay.get(dayMs) || 0) + 1);
    }
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const t = today.getTime() - i * DAY_MS;
      days.push({
        ts: t,
        label: new Date(t).toLocaleDateString(undefined, { weekday: 'short' }),
        count: byDay.get(t) || 0,
      });
    }
    const weekAttempts = days.reduce((s, d) => s + d.count, 0);
    return { days, weekAttempts };
  }, [attempts]);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Practice streak</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="font-bold">{current}</span>
            <span className="text-xs text-amber-400/80">current</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-bold">{longest}</span>
            <span className="text-xs text-slate-400">longest</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const tone =
            d.count === 0
              ? 'bg-slate-800 text-slate-500'
              : d.count < 3
              ? 'bg-amber-500/30 text-amber-200'
              : d.count < 6
              ? 'bg-amber-500/60 text-amber-50'
              : 'bg-amber-500 text-amber-950';
          return (
            <div key={d.ts} className={`rounded-md px-2 py-2 text-center ${tone}`} title={`${d.count} attempts`}>
              <div className="text-[10px] uppercase tracking-wide opacity-80">{d.label}</div>
              <div className="text-sm font-bold">{d.count}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Calendar className="w-3.5 h-3.5" />
        <span>{weekAttempts} attempts this week</span>
      </div>
    </div>
  );
};

export default StreakTracker;
