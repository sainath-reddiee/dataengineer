// src/components/practice/MockLengthPicker.jsx
// Quick / Standard / Full cards showing question count and time.
import React from 'react';
import { getMockPlan, MOCK_LENGTHS } from '@/lib/practice/mockExam';

const minutes = (sec) => `${Math.round(sec / 60)} min`;

const MockLengthPicker = ({ meta, poolSize, onPick }) => (
  <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {MOCK_LENGTHS.map((len) => {
      const plan = getMockPlan(meta, poolSize, len.id);
      return (
        <li key={len.id}>
          <button
            type="button"
            onClick={() => onPick(len.id)}
            className="w-full h-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-blue-400 rounded-lg p-4 transition-colors"
          >
            <div className="text-white font-semibold">{len.label}</div>
            <div className="text-sm text-slate-400 mt-1">{len.blurb}</div>
            <div className="mt-3 font-mono text-sm text-blue-200">
              {plan.count} questions · {minutes(plan.timeLimitSec)}
            </div>
          </button>
        </li>
      );
    })}
  </ul>
);

export default MockLengthPicker;
