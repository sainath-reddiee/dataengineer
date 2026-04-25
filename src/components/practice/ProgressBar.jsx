// src/components/practice/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ current, total, answers = {} }) => {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>Question {Math.min(current + 1, total)} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {Object.keys(answers).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === current;
            // We don't have per-index question id here; caller can pass answers keyed by index too.
            const ans = answers[i];
            const status = ans?.submitted ? (ans.correct ? 'correct' : 'incorrect') : ans ? 'selected' : 'idle';
            const base = 'h-1.5 flex-1 min-w-[8px] rounded-full';
            const cls = {
              correct: 'bg-emerald-500',
              incorrect: 'bg-rose-500',
              selected: 'bg-blue-500',
              idle: 'bg-slate-700',
            }[status];
            return (
              <span
                key={i}
                className={`${base} ${cls} ${isCurrent ? 'ring-2 ring-white/60' : ''}`}
                aria-label={`Question ${i + 1}: ${status}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
