// src/components/practice/Timer.jsx
import React from 'react';
import { Clock } from 'lucide-react';

function fmt(sec) {
  if (sec == null || sec < 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const Timer = ({ timeLeft, elapsedSec, mode = 'elapsed', warnUnderSec = 60 }) => {
  const isCountdown = mode === 'countdown' && timeLeft != null;
  const display = isCountdown ? fmt(timeLeft) : fmt(elapsedSec);
  const danger = isCountdown && timeLeft <= warnUnderSec;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm ${
        danger
          ? 'border-rose-500 bg-rose-500/10 text-rose-200 animate-pulse'
          : 'border-slate-700 bg-slate-800/60 text-slate-200'
      }`}
      aria-label={isCountdown ? 'Time remaining' : 'Elapsed time'}
    >
      <Clock className="w-4 h-4" />
      {display}
    </div>
  );
};

export default Timer;
