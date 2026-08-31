import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Layers, PenLine, Wrench, GraduationCap } from 'lucide-react';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';

const defaultLinks = [
  { to: '/glossary', icon: BookOpen, title: 'Data Engineering Glossary', desc: 'Look up key terms and concepts' },
  { to: '/compare', icon: Layers, title: 'Tool Comparisons', desc: 'Side-by-side technology breakdowns' },
  {
    to: '/articles',
    icon: ArrowRight,
    title: 'All Tutorials',
    desc: 'Browse the full article archive',
  },
  {
    to: '/contribute',
    icon: PenLine,
    title: 'Write for Us',
    desc: 'Submit a guest post',
  },
];

const reviewLinks = [
  {
    to: '/articles',
    icon: ArrowRight,
    title: 'All Tutorials',
    desc: 'Browse the full article archive',
  },
  {
    to: '/cheatsheets',
    icon: BookOpen,
    title: 'Cheat Sheets',
    desc: 'SQL, dbt, Snowflake, and interview notes',
  },
  {
    to: '/interview-prep',
    icon: GraduationCap,
    title: 'Interview Prep',
    desc: 'Practice questions with worked answers',
  },
  {
    to: '/tools',
    icon: Wrench,
    title: 'Free Tools',
    desc: 'Cost calculators and SQL helpers',
  },
];

const InArticleCTA = () => {
  const links = ADSENSE_REVIEW_MODE ? reviewLinks : defaultLinks;

  return (
    <nav aria-label="Explore more content" className="my-10 rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-white">Keep Exploring</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3 transition hover:border-blue-500/30 hover:bg-white/10"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div>
              <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                {title}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default InArticleCTA;
