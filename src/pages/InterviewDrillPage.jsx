// src/pages/InterviewDrillPage.jsx
// Drill mode: one question at a time, reveal, rate yourself, and the rating
// schedules the next review (SM-2). Keyboard-first.
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import DrillCard from '@/components/interview/DrillCard';
import ShortcutHelp from '@/components/interview/ShortcutHelp';
import { cheatsheets } from '@/data/cheatsheetData';
import ownerQuestions from '@/data/interview/questions.json';
import { buildBank, filterBank } from '@/lib/interview/bank';
import { useInterviewDrill } from '@/hooks/useInterviewDrill';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const FILTER_KEYS = ['stack', 'sheet', 'level', 'q'];

const Drill = ({ items, includeLearning, bankQuery }) => {
  const d = useInterviewDrill(items, { includeLearning });
  const [help, setHelp] = useState(false);

  useKeyboardShortcuts({
    Space: () => d.current && !d.revealed && d.reveal(),
    Enter: () => d.current && !d.revealed && d.reveal(),
    1: () => d.revealed && d.rate('knew'),
    2: () => d.revealed && d.rate('partial'),
    3: () => d.revealed && d.rate('missed'),
    j: () => d.next(),
    ArrowRight: () => d.next(),
    k: () => d.prev(),
    ArrowLeft: () => d.prev(),
    '?': () => setHelp((h) => !h),
  });

  if (d.queue.length === 0) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg">Nothing due right now</h2>
        <p className="text-slate-300 mt-2">Every question in this set is scheduled for later. Come back when reviews are due, or go through all of them again.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/interview-prep/drill?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(bankQuery)), all: '1' })}`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
            Drill all of them
          </Link>
          <Link to={`/interview-prep/questions${bankQuery ? `?${bankQuery}` : ''}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
            Back to the question bank
          </Link>
        </div>
      </div>
    );
  }

  if (d.finished) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg">Session done</h2>
        <p className="text-slate-300 mt-2">
          Knew {d.summary.knew}, partly {d.summary.partial}, missed {d.summary.missed}. Missed questions come back tomorrow;
          the ones you knew come back later and later.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/interview-prep/questions${bankQuery ? `?${bankQuery}` : ''}`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
            Back to the question bank
          </Link>
          <Link to="/roadmaps" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">Role roadmaps</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 min-h-10 text-sm text-slate-300">
        <span>Question <span className="font-mono text-white">{d.idx + 1}</span> of {d.queue.length}</span>
        <button type="button" onClick={() => setHelp((h) => !h)} aria-expanded={help} className="text-slate-400 hover:text-slate-200 underline">
          Keyboard shortcuts (?)
        </button>
      </div>
      {help && <div className="mb-4"><ShortcutHelp /></div>}
      <DrillCard item={d.current} revealed={d.revealed} onReveal={d.reveal} onRate={d.rate} />
      <div className="mt-4 flex justify-between text-sm">
        <button type="button" onClick={d.prev} disabled={d.idx === 0} className="text-slate-400 hover:text-slate-200 disabled:opacity-40">&larr; Previous</button>
        <button type="button" onClick={d.next} className="text-slate-400 hover:text-slate-200">Skip &rarr;</button>
      </div>
    </>
  );
};

const InterviewDrillPage = () => {
  const [params] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || undefined]));
  const bankQuery = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const includeLearning = params.get('all') === '1';
  const items = useMemo(() => filterBank(buildBank(cheatsheets, ownerQuestions), filters), [bankQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <MetaTags
        title="Interview Drill"
        description="Drill data engineering interview questions one at a time with self-rating and spaced repetition."
        url="/interview-prep/drill"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <header className="mb-6">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              <Link to={`/interview-prep/questions${bankQuery ? `?${bankQuery}` : ''}`} className="hover:text-slate-200">&larr; Question bank</Link>
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Interview drill</h1>
            <p className="text-slate-300 mt-2 text-sm">
              Answer in your head (or out loud), reveal, then rate yourself honestly. Due reviews come first, then new questions.
            </p>
          </header>
          <Drill key={`${bankQuery}|${includeLearning}`} items={items} includeLearning={includeLearning} bankQuery={bankQuery} />
        </div>
      </div>
    </>
  );
};

export default InterviewDrillPage;
