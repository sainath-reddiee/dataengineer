// src/components/practice/StreakBadge.jsx
import React from 'react';
import { Flame } from 'lucide-react';

const StreakBadge = ({ current = 0, longest = 0, compact = false }) => {
  if (current === 0 && longest === 0) return null;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-amber-600/50 bg-amber-500/10 text-amber-300 ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
      title={`Longest streak: ${longest} day${longest === 1 ? '' : 's'}`}
    >
      <Flame className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span className="font-semibold">
        {current}-day streak
      </span>
    </div>
  );
};

export default StreakBadge;
