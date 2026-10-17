// src/components/roadmaps/ProgressMeter.jsx
// Fixed-height progress row: the same size before and after progress loads,
// so the page never shifts.
import React from 'react';

const ProgressMeter = ({ done, total, percent, label = 'Progress' }) => (
  <div className="h-12" aria-label={`${label}: ${done} of ${total} skills done`}>
    <div className="flex items-baseline justify-between text-sm text-slate-300 mb-1.5">
      <span>{done === 0 ? 'Not started' : `${done} of ${total} skills done`}</span>
      <span className="font-mono text-white">{percent}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="h-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  </div>
);

export default ProgressMeter;
