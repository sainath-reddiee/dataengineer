import React from 'react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

import { BarChart3, LayoutDashboard, Database, Server, TestTube, Cpu, ShieldCheck, Brain, Network, Map, FileCode, CheckCircle, Terminal, Lightbulb } from 'lucide-react';

// ─── Data roles for DataEngineer Hub ────────────────────────────────────

const DATA_ROLES = [
  {
    id: 'data-analyst',
    tags: 'SQL, GRAIN, BI',
    name: 'Data Analyst',
    icon: BarChart3,
    desc: 'SQL you can defend, a metric someone will argue with, and a BI-shaped interview loop.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'bi-analyst',
    tags: 'DASHBOARDS, GRAIN, WAREHOUSE',
    name: 'BI Analyst',
    icon: LayoutDashboard,
    desc: 'Warehouse SQL at dashboard grain. Windows, ranking, and a refresh that does not lie.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'analytics-engineer',
    tags: 'DBT, TESTS, METRICS',
    name: 'Analytics Engineer',
    icon: Database,
    desc: 'Mart SQL, tests that page someone, and a metric finance can trust.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'data-engineer',
    tags: 'PIPELINES, WAREHOUSES, ON-CALL',
    name: 'Data Engineer',
    icon: Server,
    desc: 'SQL, orchestration, streaming, and the platform sketch they ask at 5pm.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'data-scientist',
    tags: 'SQL, STATS, EXPERIMENTS',
    name: 'Data Scientist',
    icon: TestTube,
    desc: "SQL for features, stats without vibes, and a holdout you would defend.",
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'ml-engineer',
    tags: 'TRAIN, SERVE, ROLLBACK',
    name: 'ML Engineer',
    icon: Cpu,
    desc: 'Features as tables. Latency as an SLA. Metrics you can put in CI.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'mlops-engineer',
    tags: 'GATES, SERVING, INCIDENTS',
    name: 'MLOps Engineer',
    icon: ShieldCheck,
    desc: 'The SQL that proves training and serving agree, then the gate that blocks a bad model.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'ai-engineer',
    tags: 'RAG, EVAL, RETRIEVAL',
    name: 'AI Engineer',
    icon: Brain,
    desc: 'Retrieval is a pipeline. Eval is a job. The model brand is not the incident.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
  {
    id: 'data-architect',
    tags: 'GRAIN, COST, PAVED ROADS',
    name: 'Data Architect',
    icon: Network,
    desc: 'You still have to query the mart you designed. Quality SQL and a time you said no.',
    roadmap: '/roadmaps',
    coding: '/coding',
    interview: '/interview',
    questionBank: '/interview#bank',
  },
];

// ─── Five steps for career preparation ────────────────────────────────────────────

const STEPS = [
  {
    num: 1,
    title: 'Pick the role you want next',
    desc: 'Analyst, BI, analytics engineer, data engineer, scientist, ML, MLOps, AI engineer, or architect. Open that flowchart, then the coding pads and interview track for the same role.',
    links: [
      { label: 'All role roadmaps', href: '/roadmaps' },
      { label: 'Coding by role', href: '/coding' },
      { label: 'Interview tracks', href: '/interview' },
    ],
  },
  {
    num: 2,
    title: 'SQL you can defend',
    desc: 'Windows, grain, and anti-joins. Analysts, engineers, and scientists all sit this pad. Filter the problem list by your role, then read the window guide.',
    links: [
      { label: 'SQL problems', href: '/coding#sql' },
      { label: 'All problems', href: '/coding' },
      { label: 'Window functions', href: '/coding#windows' },
    ],
  },
  {
    num: 3,
    title: 'Python when the screen asks for it',
    desc: 'NumPy, plain Python, or PyTorch on the same problem. Scientists and ML engineers live here; analysts and DEs still get asked means, joins-in-code, and metrics.',
    links: [
      { label: 'Python problems', href: '/coding#python' },
      { label: 'Start with Mean', href: '/coding' },
    ],
  },
  {
    num: 4,
    title: 'One warehouse, cost first',
    desc: 'Snowflake credits and Query Profile before Cortex. If you live on Databricks, start with Delta instead. BI roles: still learn who pays for the extract.',
    links: [
      { label: 'Snowflake cost', href: '/tools/snowflake-cost-calculator' },
      { label: 'Warehouse compare', href: '/tools/cloud-data-warehouse-cost-comparison' },
      { label: 'Compare tools', href: '/compare' },
    ],
  },
  {
    num: 5,
    title: 'Interview and certs',
    desc: 'Open the track for your role, run the coding labs, then sit a practice exam if your loop uses one.',
    links: [
      { label: 'Interview prep', href: '/interview' },
      { label: 'Question bank', href: '/interview#bank' },
      { label: 'Practice tests', href: '/certs' },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const GettingStartedPage = () => {
  return (
    <>
      <MetaTags
        title="Start Here — DataEngineer Hub"
        description="Pick a data role, then five steps. SQL, Python, warehouses, interview prep, and certifications — all mapped to your job title."
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-14">

          {/* ── Page Header ── */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              NEW HERE
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Start here — pick a role, then five steps
            </h1>
            <p className="text-gray-400 leading-relaxed max-w-2xl">
              The same warehouse shows up in analyst, engineer, scientist, and ML interviews.
              Pick your role on DataEngineerHub first. Then follow the five steps.
            </p>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {DATA_ROLES.map((role) => {
                const IconComponent = role.icon;
                return (
                  <div key={role.id} className="bg-slate-900/60 p-5 rounded-xl border border-white/5 hover:bg-slate-900/80 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 mb-0.5">
                          {role.tags}
                        </p>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">{role.name}</h3>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-3">{role.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      <RoleLink href={role.roadmap}>Roadmap</RoleLink>
                      <RoleLink href={role.coding}>Coding</RoleLink>
                      <RoleLink href={role.interview}>Interview</RoleLink>
                    </div>
                  </div>
                );
              })}
            </div>

          {/* ── Five steps grid ── */}
          <div className="space-y-4">
            {STEPS.map((step) => {
              const StepIcon = [Map, FileCode, Terminal, Database, CheckCircle][step.num - 1];
              return (
                <div
                  key={step.num}
                  className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 items-center justify-center text-emerald-400">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                      <span className="md:hidden"><StepIcon className="w-4 h-4 inline" /></span> STEP {step.num}
                    </p>
                    <h2 className="text-lg font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed max-w-2xl">{step.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.links.map((link) => (
                        <Link
                          key={link.href + link.label}
                          to={link.href}
                          className="rounded-full border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 px-4 py-1.5 text-sm font-medium text-gray-200 transition-all"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
};

// Small helper for role quick-links
const RoleLink = ({ href, children }) => (
  <Link
    to={href}
    className="rounded border border-white/8 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors"
  >
    {children}
  </Link>
);

export default GettingStartedPage;
