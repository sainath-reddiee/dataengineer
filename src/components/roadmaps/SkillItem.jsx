// src/components/roadmaps/SkillItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { resourceHref, resourceTypeLabel } from '@/lib/roadmaps/resourceHref';

const SkillItem = ({ skill, done, onToggle }) => (
  <li id={`skill-${skill.id}`} className="scroll-mt-24 border border-slate-800 bg-slate-900/60 rounded-lg p-4">
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(skill.id)}
        className="mt-1 h-5 w-5 shrink-0 accent-emerald-500"
      />
      <span className={`font-medium ${done ? 'text-slate-400 line-through decoration-slate-500' : 'text-white'}`}>{skill.title}</span>
    </label>
    {skill.note && <p className="mt-2 ml-8 text-sm text-slate-300">{skill.note}</p>}
    <ul className="mt-3 ml-8 space-y-1.5">
      {skill.resources.map((res) => (
        <li key={`${res.type}:${res.ref}`} className="text-sm">
          <span className="inline-block min-w-24 text-xs uppercase tracking-wider text-slate-500">{resourceTypeLabel(res)}</span>
          <Link to={resourceHref(res)} className="text-blue-300 hover:text-blue-200 underline decoration-blue-300/40">
            {res.label}
          </Link>
        </li>
      ))}
    </ul>
  </li>
);

export default SkillItem;
