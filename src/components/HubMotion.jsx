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
import { TOOL_STAGES } from '@/data/toolsCatalog';

const ACTIONS = [
  { to: '/articles', title: 'Tutorials', blurb: 'Production notes, not vendor docs', icon: BookOpen },
  { to: '/tools/sql-playground', title: 'SQL Playground', blurb: 'Run SQL in the browser', icon: Terminal },
  { to: '/interview-prep', title: 'Interview prep', blurb: '14-day plan by stack', icon: GraduationCap },
  { to: '/practice', title: 'Practice tests', blurb: 'SnowPro, Databricks, AWS', icon: Target },
  { to: '/coding', title: 'SQL coding', blurb: 'Original DuckDB pads', icon: FileText },
  { to: '/courses', title: 'Courses', blurb: 'Cost, dbt, Airflow paths', icon: Wrench },
];

const TiltCard = ({ children, className = '', disabled = false, intensity = 12 }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 240, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 240, damping: 20 });
  const glareX = useTransform(x, [-0.5, 0.5], ['12%', '88%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['12%', '88%']);

  const onMove = (event) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    x.set((event.clientX - rect.left) / width - 0.5);
    y.set((event.clientY - rect.top) / height - 0.5);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`hub-3d-card relative ${className}`}
      style={disabled ? undefined : {
        rotateX,
        rotateY,
        transformPerspective: 1100,
      }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
      {!disabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/25 blur-2xl"
          style={{ left: glareX, top: glareY }}
        />
      )}
    </motion.div>
  );
};

const HubMotion = ({ reduceMotion = false }) => {
  return (
    <div className="hub-3d-scene w-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
        What you can do here
      </p>
      <p className="mb-3 text-sm text-slate-400">
        Tutorials, tools, interview prep, and practice — the stack explained so you can ship it.
      </p>

      <div className="relative">
        {!reduceMotion && (
          <div className="pointer-events-none absolute -inset-8 rounded-full bg-blue-500/15 blur-3xl" />
        )}

        <TiltCard
          disabled={reduceMotion}
          className="relative mb-3 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 p-3 shadow-2xl shadow-blue-950/40 backdrop-blur-md"
        >
          <div className="flex items-stretch gap-1.5">
            {TOOL_STAGES.map((stage, index) => (
              <div key={stage.id} className="flex min-w-0 flex-1 items-center gap-1.5">
                <div className="min-w-0 flex-1 rounded-lg bg-white/5 px-1.5 py-2 text-center ring-1 ring-white/5 sm:px-2">
                  <Link to={`/tools?stack=${stage.id}`} className="block">
                    <p className="text-[11px] font-semibold text-white">{stage.label}</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-slate-400 sm:text-[10px]">{stage.hint}</p>
                  </Link>
                </div>
                {index < TOOL_STAGES.length - 1 && (
                  <span aria-hidden="true" className="hidden text-blue-300 sm:inline">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <TiltCard
              key={action.to}
              disabled={reduceMotion}
              intensity={6}
              className="overflow-hidden rounded-xl"
            >
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * index }}
              >
                <Link
                  to={action.to}
                  className="block rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 shadow-lg shadow-slate-950/30 transition-colors hover:border-blue-400/40 hover:bg-slate-900/80"
                >
                  <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                    <Icon className="h-3.5 w-3.5 text-blue-300" />
                    {action.title}
                  </span>
                  <span className="block text-xs text-slate-400">{action.blurb}</span>
                </Link>
              </motion.div>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
};

export default HubMotion;
