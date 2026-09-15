import { Link } from 'react-router-dom';
import {
  Calculator,
  GraduationCap,
  Target,
  Workflow,
} from 'lucide-react';

const PATHS = [
  {
    id: 'warehouse',
    title: 'Warehouse & cost',
    blurb: 'Size Snowflake, compare Databricks and BigQuery, then read the production notes.',
    href: '/tools?stack=warehouse',
    cta: 'Open warehouse tools',
    icon: Calculator,
  },
  {
    id: 'transform',
    title: 'Transform & schedule',
    blurb: 'dbt schema.yml, Airflow cron, and the sheets you actually open in a review.',
    href: '/tools?stack=transform',
    cta: 'Open transform tools',
    icon: Workflow,
  },
  {
    id: 'interview',
    title: 'Interview loop',
    blurb: '14-day plan, SQL windows, system design — original questions, not a leaked dump.',
    href: '/interview-prep',
    cta: 'Start the plan',
    icon: GraduationCap,
  },
  {
    id: 'practice',
    title: 'Certification drills',
    blurb: 'SnowPro, Databricks DE, AWS DEA — timed quizzes in this browser, no signup.',
    href: '/practice',
    cta: 'Take a practice test',
    icon: Target,
  },
];

const StartHerePaths = () => (
  <section aria-labelledby="start-here-heading">
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
        Free start-here plan
      </p>
      <h2 id="start-here-heading" className="mt-1 text-lg font-bold text-white sm:text-xl">
        Pick a track. Every path stays in the browser.
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-400">
        Tutorials, calculators, interview tracks, and cert quizzes are free. No account, no
        paywalled pads — open a path and ship the next thing.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PATHS.map((path) => {
        const Icon = path.icon;
        return (
          <Link
            key={path.id}
            to={path.href}
            className="card-3d group rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-blue-400/40"
          >
            <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-400/20">
              <Icon className="h-4 w-4 text-blue-300" />
            </span>
            <h3 className="text-base font-semibold text-white group-hover:text-blue-300">
              {path.title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{path.blurb}</p>
            <span className="mt-3 inline-block text-xs font-semibold text-blue-400">
              {path.cta} →
            </span>
          </Link>
        );
      })}
    </div>
  </section>
);

export default StartHerePaths;
