// src/components/practice/MockExamNavigator.jsx
// Grid of question numbers: answered, flagged and current at a glance.
import React from 'react';

const MockExamNavigator = ({ questions, answers, flags, current, onGo }) => (
  <nav aria-label="Questions" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
      <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600 mr-1 align-middle" />Answered</span>
      <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1 align-middle" />Flagged</span>
      <span><span className="inline-block w-2.5 h-2.5 rounded-sm border border-slate-600 mr-1 align-middle" />Not answered</span>
    </div>
    <ol className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
      {questions.map((q, i) => {
        const answered = (answers[q.id] || []).length > 0;
        const flagged = flags.has(q.id);
        const tone = flagged
          ? 'bg-amber-500 text-slate-950 border-amber-400'
          : answered
            ? 'bg-blue-600 text-white border-blue-500'
            : 'bg-slate-800/60 text-slate-300 border-slate-600';
        return (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={i === current ? 'step' : undefined}
              aria-label={`Question ${i + 1}${answered ? ', answered' : ''}${flagged ? ', flagged' : ''}`}
              className={`w-full h-9 rounded border text-xs font-mono ${tone} ${i === current ? 'ring-2 ring-white' : ''}`}
            >
              {i + 1}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default MockExamNavigator;
