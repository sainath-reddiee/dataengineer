// src/components/interview/DrillCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { RATINGS } from '@/lib/interview/bank';

const RATING_STYLE = {
  knew: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  partial: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  missed: 'bg-rose-600 hover:bg-rose-500 text-white',
};

const DrillCard = ({ item, revealed, onReveal, onRate }) => (
  <article className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 md:p-8" aria-live="polite">
    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider text-slate-400 mb-4">
      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{item.difficulty}</span>
      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{item.section}</span>
    </div>
    <h2 className="text-lg md:text-xl font-semibold text-white leading-snug">{item.question}</h2>

    {!revealed ? (
      <button type="button" onClick={onReveal} className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
        Show answer <span className="text-blue-200 text-sm">(Space)</span>
      </button>
    ) : (
      <>
        <div className="mt-6 border-t border-slate-800 pt-5 text-slate-200 leading-relaxed whitespace-pre-wrap">{item.answer}</div>
        {item.tip && <p className="mt-3 text-sm text-amber-200">Tip: {item.tip}</p>}
        {item.source && (
          <p className="mt-3 text-sm text-slate-400">
            From <Link to={item.source} className="text-blue-300 underline">{item.sheetTitle}</Link>
          </p>
        )}
        <div className="mt-6">
          <p className="text-sm text-slate-400 mb-2">How well did you know it?</p>
          <div className="flex flex-wrap gap-2">
            {RATINGS.map((r) => (
              <button key={r.id} type="button" onClick={() => onRate(r.id)} className={`px-4 py-2 rounded-lg font-medium ${RATING_STYLE[r.id]}`}>
                {r.label} <span className="opacity-70 text-sm">({r.key})</span>
              </button>
            ))}
          </div>
        </div>
      </>
    )}
  </article>
);

export default DrillCard;
