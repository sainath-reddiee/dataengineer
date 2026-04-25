// src/components/practice/QuizModeSelector.jsx
import React from 'react';
import { GraduationCap, Timer as TimerIcon, Target, Bookmark } from 'lucide-react';

const MODES = [
  {
    key: 'practice',
    label: 'Practice Mode',
    icon: GraduationCap,
    description: 'Instant feedback after each question with detailed explanations. No timer. Best for learning.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'exam',
    label: 'Exam Mode',
    icon: TimerIcon,
    description: 'Timed and realistic. No feedback until the end. Best for measuring readiness.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    key: 'topic',
    label: 'Topic Drill',
    icon: Target,
    description: 'Focus on one topic. Great for weak areas identified in previous attempts.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'review',
    label: 'Review Bookmarks',
    icon: Bookmark,
    description: 'Review questions you bookmarked to study later.',
    color: 'from-amber-500 to-orange-600',
  },
];

const QuizModeSelector = ({ onSelect, availableModes = ['practice', 'exam', 'topic', 'review'] }) => {
  const modes = MODES.filter((m) => availableModes.includes(m.key));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {modes.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className="group text-left bg-slate-900/80 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all hover:-translate-y-0.5"
          >
            <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${m.color} text-white mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold mb-1 group-hover:text-blue-300 transition-colors">
              {m.label}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default QuizModeSelector;
