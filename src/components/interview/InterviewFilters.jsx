// src/components/interview/InterviewFilters.jsx
import React from 'react';
import { STACKS } from '@/lib/interview/bank';

const selectClass = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100';

const InterviewFilters = ({ filters, sheets, onChange }) => {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value || undefined, ...(key === 'stack' ? { sheet: undefined } : {}) });
  const visibleSheets = sheets.filter((s) => !filters.stack || s.stack === filters.stack);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="search" aria-label="Filter interview questions">
      <label className="text-xs text-slate-400">
        Stack
        <select value={filters.stack || ''} onChange={set('stack')} className={selectClass}>
          <option value="">All stacks</option>
          {STACKS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Topic
        <select value={filters.sheet || ''} onChange={set('sheet')} className={selectClass}>
          <option value="">All topics</option>
          {visibleSheets.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Level
        <select value={filters.level || ''} onChange={set('level')} className={selectClass}>
          <option value="">All levels</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Search
        <input type="search" value={filters.q || ''} onChange={set('q')} placeholder="e.g. clustering" className={selectClass} />
      </label>
    </div>
  );
};

export default InterviewFilters;
