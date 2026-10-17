// src/components/interview/ShortcutHelp.jsx
import React from 'react';

const ROWS = [
  ['Space or Enter', 'Show the answer'],
  ['1 / 2 / 3', 'Knew it / Partly / Missed it'],
  ['J or →', 'Next question'],
  ['K or ←', 'Previous question'],
  ['?', 'Show or hide this help'],
];

const ShortcutHelp = () => (
  <div className="border border-slate-700 bg-slate-900/80 rounded-lg p-4" role="note" aria-label="Keyboard shortcuts">
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {ROWS.map(([keys, action]) => (
        <React.Fragment key={keys}>
          <dt className="font-mono text-slate-200">{keys}</dt>
          <dd className="text-slate-400">{action}</dd>
        </React.Fragment>
      ))}
    </dl>
  </div>
);

export default ShortcutHelp;
