import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  BookOpen,
  FileText,
  GraduationCap,
  Target,
  Terminal,
  Wrench,
} from 'lucide-react';

const ACTIONS = [
  { to: '/articles', title: 'Tutorials', blurb: 'Production notes, not vendor docs', icon: BookOpen },
  { to: '/tools/sql-playground', title: 'SQL Playground', blurb: 'Run SQL in the browser', icon: Terminal },
  { to: '/interview-prep', title: 'Interview prep', blurb: 'Questions from real stacks', icon: GraduationCap },
  { to: '/practice', title: 'Practice tests', blurb: 'SnowPro, Databricks, more', icon: Target },
  { to: '/cheatsheets', title: 'Cheat sheets', blurb: 'Quick refs you can ship', icon: FileText },
  { to: '/tools', title: 'Free tools', blurb: 'Cost, cron, DDL, sizing', icon: Wrench },
];

const STAGES = [
  { label: 'Ingest', hint: 'Python · Kafka' },
  { label: 'Transform', hint: 'dbt · Airflow' },
  { label: 'Warehouse', hint: 'Snowflake · Databricks' },
  { label: 'Serve', hint: 'SQL · BI' },
];

const TiltCard = ({ children, className = '', disabled = false }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 220, damping: 22 });

  const onMove = (event) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={disabled ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
};

const HubMotion = ({ reduceMotion = false }) => {
  return (
    <div className="w-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
        What you can do here
      </p>
      <p className="mb-3 text-sm text-slate-400">
        Tutorials, tools, interview prep, and practice — the stack explained so you can ship it.
      </p>

      <TiltCard
        disabled={reduceMotion}
        className="mb-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 backdrop-blur-sm"
      >
        <div className="grid grid-cols-4 gap-2">
          {STAGES.map((stage, index) => (
            <motion.div
              key={stage.label}
              className="rounded-lg bg-white/5 px-2 py-2 text-center"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={reduceMotion ? undefined : {
                duration: 3.2,
                repeat: Infinity,
                delay: index * 0.25,
                ease: 'easeInOut',
              }}
            >
              <p className="text-[11px] font-semibold text-white">{stage.label}</p>
              <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">{stage.hint}</p>
            </motion.div>
          ))}
        </div>
      </TiltCard>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.to}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * index }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
            >
              <Link
                to={action.to}
                className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition-colors hover:border-blue-400/40 hover:bg-white/10"
              >
                <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                  <Icon className="h-3.5 w-3.5 text-blue-300" />
                  {action.title}
                </span>
                <span className="block text-xs text-slate-400">{action.blurb}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HubMotion;
