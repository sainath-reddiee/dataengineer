// src/pages/InterviewPrepHubPage.jsx
// Interview Prep Hub — curated landing page for all interview-prep content.
// Surfaces interview cheat sheets + interview articles + a structured study plan,
// organized by track (SQL, Snowflake, Databricks/Spark, AWS, Azure, dbt, Airflow,
// Python/PySpark, Modeling, System Design).
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Target,
  BookOpen,
  ChevronRight,
  Zap,
  Calendar,
  Award,
  Briefcase,
  DollarSign,
  Calculator,
  FileText,
  CheckCircle2,
  Database,
  Cloud,
  Wrench,
  Layers,
  Code2,
  Sigma,
  Workflow,
  Boxes,
  GitBranch,
  Cpu,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { cheatsheets } from '@/data/cheatsheetData';
import { SITE_CONFIG } from '@/lib/seoConfig';
import { generateBreadcrumbs } from '@/lib/seoConfig';

const INTERVIEW_ARTICLES = [
  {
    slug: 'top-50-data-engineer-interview-questions-2026',
    title: 'Top 50 Data Engineer Interview Questions (2026)',
    description:
      'The most common behavioral + technical questions across L3–L6 data engineering roles. Each with model answers.',
  },
  {
    slug: 'snowflake-interview-questions-advanced',
    title: 'Advanced Snowflake Interview Questions — Expert Level',
    description:
      'Deep-dive expert Snowflake interview prep for staff/senior/principal DE roles. Architecture-grade answers.',
  },
  {
    slug: 'data-engineer-system-design-interview',
    title: 'Data Engineer System Design Interview — The Complete Guide',
    description:
      'How to approach and solve end-to-end system design questions: data ingestion, storage, serving, cost, SLAs.',
  },
];

// TRACKS — each track links ONLY to cheat sheets / articles that already exist in the repo.
// Track names are navigation labels, not new prose. Descriptions reuse label-level phrasing only.
const TRACKS = [
  {
    id: 'sql',
    label: 'SQL & Window Functions',
    icon: Sigma,
    accent: 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
    dot: 'text-sky-300',
    items: [
      { slug: 'sql-interview-questions', type: 'cheatsheet' },
      { slug: 'sql-window-functions', type: 'cheatsheet' },
      { slug: 'snowflake-sql', type: 'cheatsheet' },
    ],
  },
  {
    id: 'modeling',
    label: 'Data Modeling & Architecture',
    icon: Boxes,
    accent: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
    dot: 'text-indigo-300',
    items: [
      { slug: 'data-modeling', type: 'cheatsheet' },
      { slug: 'data-engineering-interview-questions', type: 'cheatsheet' },
    ],
  },
  {
    id: 'system-design',
    label: 'System Design',
    icon: Workflow,
    accent: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30',
    dot: 'text-fuchsia-300',
    items: [
      { slug: 'data-engineer-system-design-interview', type: 'article' },
      { slug: 'data-engineering-interview-questions', type: 'cheatsheet' },
    ],
  },
  {
    id: 'snowflake',
    label: 'Snowflake',
    icon: Database,
    accent: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30',
    dot: 'text-cyan-300',
    items: [
      { slug: 'snowflake-interview-questions', type: 'cheatsheet' },
      { slug: 'snowflake-interview-questions-advanced', type: 'article' },
      { slug: 'snowflake-cost-optimization-interview', type: 'cheatsheet' },
      { slug: 'snowflake-performance-deep-dive-interview', type: 'cheatsheet' },
      { slug: 'snowflake-semi-structured-interview', type: 'cheatsheet' },
      { slug: 'snowflake-governance-interview', type: 'cheatsheet' },
      { slug: 'snowflake-snowpipe-streaming-interview', type: 'cheatsheet' },
      { slug: 'snowflake-streams-tasks-interview', type: 'cheatsheet' },
      { slug: 'snowflake-dynamic-tables-interview', type: 'cheatsheet' },
      { slug: 'snowflake-data-sharing-interview', type: 'cheatsheet' },
      { slug: 'snowflake-iceberg-tables-interview', type: 'cheatsheet' },
      { slug: 'snowflake-cortex-ai-interview', type: 'cheatsheet' },
      { slug: 'snowflake-snowpark-interview', type: 'cheatsheet' },
      { slug: 'snowflake-stored-procedures-interview', type: 'cheatsheet' },
      { slug: 'snowflake-external-integrations-interview', type: 'cheatsheet' },
      { slug: 'snowflake-replication-failover-interview', type: 'cheatsheet' },
      { slug: 'snowflake-best-practices', type: 'cheatsheet' },
      { slug: 'snowflake-sql', type: 'cheatsheet' },
    ],
  },
  {
    id: 'databricks',
    label: 'Databricks & Spark',
    icon: Layers,
    accent: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    dot: 'text-orange-300',
    items: [
      { slug: 'databricks', type: 'cheatsheet' },
      { slug: 'pyspark', type: 'cheatsheet' },
    ],
  },
  {
    id: 'aws',
    label: 'AWS for Data Engineers',
    icon: Cloud,
    accent: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    dot: 'text-amber-300',
    items: [
      { slug: 'aws-for-data-engineers', type: 'cheatsheet' },
    ],
  },
  {
    id: 'azure',
    label: 'Azure for Data Engineers',
    icon: Cloud,
    accent: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    dot: 'text-blue-300',
    items: [
      { slug: 'azure-for-data-engineers', type: 'cheatsheet' },
    ],
  },
  {
    id: 'dbt',
    label: 'dbt',
    icon: GitBranch,
    accent: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    dot: 'text-rose-300',
    items: [
      { slug: 'dbt-commands', type: 'cheatsheet' },
      { slug: 'dbt-best-practices', type: 'cheatsheet' },
    ],
  },
  {
    id: 'airflow',
    label: 'Airflow & Orchestration',
    icon: Wrench,
    accent: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30',
    dot: 'text-teal-300',
    items: [
      { slug: 'airflow-essentials', type: 'cheatsheet' },
      { slug: 'airflow-best-practices', type: 'cheatsheet' },
    ],
  },
  {
    id: 'python',
    label: 'Python & PySpark',
    icon: Code2,
    accent: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    dot: 'text-emerald-300',
    items: [
      { slug: 'python-for-data-engineers', type: 'cheatsheet' },
      { slug: 'pyspark', type: 'cheatsheet' },
    ],
  },
  {
    id: 'behavioral',
    label: 'Behavioral & Top-50',
    icon: Briefcase,
    accent: 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
    dot: 'text-slate-300',
    items: [
      { slug: 'top-50-data-engineer-interview-questions-2026', type: 'article' },
    ],
  },
];

const WEEK1_PLAN = [
  {
    day: 'Mon',
    title: 'SQL fundamentals + window functions',
    tasks: [
      { label: 'SQL Interview Questions', slug: 'sql-interview-questions', type: 'cheatsheet' },
      { label: 'Window Functions Reference', slug: 'sql-window-functions', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Tue',
    title: 'Data modeling + DE breadth',
    tasks: [
      { label: 'Data Modeling Cheat Sheet', slug: 'data-modeling', type: 'cheatsheet' },
      { label: 'Data Engineering Interview Questions', slug: 'data-engineering-interview-questions', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Wed',
    title: 'Pick your warehouse (Snowflake or Databricks)',
    tasks: [
      { label: 'Snowflake Interview Questions', slug: 'snowflake-interview-questions', type: 'cheatsheet' },
      { label: 'Databricks Fundamentals', slug: 'databricks', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Thu',
    title: 'Cloud platform of your target role',
    tasks: [
      { label: 'AWS for Data Engineers', slug: 'aws-for-data-engineers', type: 'cheatsheet' },
      { label: 'Azure for Data Engineers', slug: 'azure-for-data-engineers', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Fri',
    title: 'Python for data engineering',
    tasks: [
      { label: 'Python for DE Cheat Sheet', slug: 'python-for-data-engineers', type: 'cheatsheet' },
      { label: 'PySpark Cheat Sheet', slug: 'pyspark', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Sat',
    title: 'Transformation + orchestration',
    tasks: [
      { label: 'dbt Commands Reference', slug: 'dbt-commands', type: 'cheatsheet' },
      { label: 'Airflow Essentials', slug: 'airflow-essentials', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Sun',
    title: 'Mock interview',
    tasks: [
      { label: 'Run 3 timed questions from the sheets above, out loud', slug: null, type: 'activity' },
      { label: 'Re-review the two areas where you were slowest', slug: null, type: 'activity' },
    ],
  },
];

const WEEK2_PLAN = [
  {
    day: 'Mon',
    title: 'Snowflake depth — cost + performance',
    tasks: [
      { label: 'Snowflake Cost Optimization — Interview', slug: 'snowflake-cost-optimization-interview', type: 'cheatsheet' },
      { label: 'Snowflake Query Tuning — Interview', slug: 'snowflake-performance-deep-dive-interview', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Tue',
    title: 'Semi-structured + governance',
    tasks: [
      { label: 'Snowflake Semi-Structured — Interview', slug: 'snowflake-semi-structured-interview', type: 'cheatsheet' },
      { label: 'Snowflake Governance & Masking — Interview', slug: 'snowflake-governance-interview', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Wed',
    title: 'Streaming + pipelines',
    tasks: [
      { label: 'Snowpipe Streaming & Kafka — Interview', slug: 'snowflake-snowpipe-streaming-interview', type: 'cheatsheet' },
      { label: 'Snowflake Streams & Tasks — Interview', slug: 'snowflake-streams-tasks-interview', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Thu',
    title: 'dbt + best practices',
    tasks: [
      { label: 'dbt Best Practices', slug: 'dbt-best-practices', type: 'cheatsheet' },
      { label: 'Airflow Best Practices', slug: 'airflow-best-practices', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Fri',
    title: 'Expert Snowflake — procs, integrations, Cortex',
    tasks: [
      { label: 'Stored Procedures & UDFs — Interview', slug: 'snowflake-stored-procedures-interview', type: 'cheatsheet' },
      { label: 'Cortex AI & ML — Interview', slug: 'snowflake-cortex-ai-interview', type: 'cheatsheet' },
    ],
  },
  {
    day: 'Sat',
    title: 'System design practice',
    tasks: [
      { label: 'Read: Data Engineer System Design article', slug: 'data-engineer-system-design-interview', type: 'article' },
      { label: 'Design a real-time ingestion pipeline, out loud, in 45 min', slug: null, type: 'activity' },
    ],
  },
  {
    day: 'Sun',
    title: 'Final mock + review',
    tasks: [
      { label: 'Full 60-min mock: 15m SQL + 15m system design + 15m warehouse + 15m behavioral', slug: null, type: 'activity' },
      { label: 'Review weakest 3 sheets', slug: null, type: 'activity' },
    ],
  },
];

const FAQ = [
  {
    q: 'How do I use this interview prep hub?',
    a: 'Follow the 2-week plan if you have that much lead time. If you have 3-5 days, focus on: Snowflake Interview Questions + SQL Interview Questions + Window Functions + Cost Optimization + one mock interview per day. The other cheat sheets are best for depth and follow-up questions.',
  },
  {
    q: 'What is the difference between the cheat sheets and the articles?',
    a: 'Cheat sheets are structured Q&A and reference tables — scan-friendly, easy to re-review. Articles are long-form essays with context, narrative, and full code examples — better for first-time learning. Strategy: read articles first for concepts, use cheat sheets for revision + the night before.',
  },
  {
    q: 'Are these aligned with specific company interviews?',
    a: 'The content covers the common denominator of data engineering interviews at modern tech-forward companies (Snowflake-centric with dbt + orchestration). FAANG-scale system design is covered separately. For role-specific prep, look at the company\'s recent JD and map to sections here.',
  },
  {
    q: 'How much SQL do I need?',
    a: 'For most DE interviews, you need: joins (all types), aggregation, GROUP BY / HAVING, subqueries and CTEs, window functions (must be fluent — ROW_NUMBER, RANK, LAG/LEAD, frame clauses), date arithmetic, self-joins, recursion, and at least one set-based pattern (EXISTS vs IN, anti-join). Hacker-rank-style algorithmic SQL is less common at senior levels.',
  },
  {
    q: 'What about behavioral interviews?',
    a: 'Prepare 4-6 STAR-format stories: a difficult cost optimization, a production incident you resolved, a migration you led, a conflict with a stakeholder, a time you were wrong. Have specific numbers ready (latency %, cost $, data volume). The system design article has a behavioral appendix.',
  },
  {
    q: 'Do I need to know multiple cloud warehouses?',
    a: 'For Snowflake-focused roles: deep Snowflake is enough. For senior/staff roles, a comparative view (Snowflake vs Databricks vs BigQuery) is a common probing question. Use the Databricks cheat sheet + the Databricks Cost Calculator to get enough comparative fluency in one afternoon.',
  },
];

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
  Intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Advanced: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export default function InterviewPrepHubPage() {
  // Lookup tables for cheat-sheet + article metadata referenced by TRACKS.
  const sheetBySlug = useMemo(() => {
    const map = {};
    cheatsheets.forEach((c) => { map[c.slug] = c; });
    return map;
  }, []);

  const articleBySlug = useMemo(() => {
    const map = {};
    INTERVIEW_ARTICLES.forEach((a) => { map[a.slug] = a; });
    return map;
  }, []);

  const resolveItem = (item) => {
    if (item.type === 'article') {
      const a = articleBySlug[item.slug];
      return a
        ? { href: `/articles/${item.slug}`, title: a.title, description: a.description, meta: 'Long-form article' }
        : null;
    }
    const s = sheetBySlug[item.slug];
    return s
      ? {
          href: `/cheatsheets/${item.slug}`,
          title: s.title,
          description: s.shortDescription,
          meta: `${s.difficulty || ''} · ${s.sections?.length || 0} sections`.replace(/^\s*·\s*/, ''),
        }
      : null;
  };

  // Deduplicated set of all referenced cheat sheet slugs across TRACKS (for itemList schema).
  const allTrackSlugs = useMemo(() => {
    const set = new Set();
    TRACKS.forEach((t) => t.items.forEach((it) => {
      if (it.type === 'cheatsheet') set.add(it.slug);
    }));
    return Array.from(set);
  }, []);

  const sheetCount = allTrackSlugs.length;
  const trackCount = TRACKS.length;
  const pageUrl = `${SITE_CONFIG.url}/interview-prep`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Data Engineering Interview Prep Hub',
    itemListElement: allTrackSlugs
      .map((slug, idx) => {
        const s = sheetBySlug[slug];
        if (!s) return null;
        return {
          '@type': 'ListItem',
          position: idx + 1,
          url: `${SITE_CONFIG.url}/cheatsheets/${slug}`,
          name: s.title,
        };
      })
      .filter(Boolean),
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const renderTaskLink = (task, weekIdx, dayIdx, taskIdx) => {
    if (!task.slug) {
      return (
        <li key={`${weekIdx}-${dayIdx}-${taskIdx}`} className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <span>{task.label}</span>
        </li>
      );
    }
    const href = task.type === 'article'
      ? `/articles/${task.slug}`
      : `/cheatsheets/${task.slug}`;
    return (
      <li key={`${weekIdx}-${dayIdx}-${taskIdx}`} className="flex items-start gap-2 text-sm">
        <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <Link to={href} className="text-blue-300 hover:text-blue-200 hover:underline">
          {task.label}
        </Link>
      </li>
    );
  };

  return (
    <>
      <MetaTags
        title="Data Engineering Interview Prep Hub — Multi-Track Cheat Sheets + 2-Week Plan"
        description="Free structured interview prep for data engineering roles across Snowflake, Databricks, AWS, Azure, dbt, Airflow, Python, PySpark, SQL, data modeling, and system design. Concrete 2-week study plan."
        keywords="data engineer interview prep, snowflake interview, databricks interview, aws data engineer interview, azure data engineer interview, dbt interview, airflow interview, pyspark interview, system design interview, data modeling interview, SQL interview prep, DE study plan"
        url="/interview-prep"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Interview Prep', url: '/interview-prep' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs
            breadcrumbs={generateBreadcrumbs('/interview-prep', 'Interview Prep')}
            className="mb-6 text-gray-400"
          />

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-amber-300 bg-amber-900/30 border border-amber-700/50 rounded-full">
              Free · {trackCount} tracks · {sheetCount} cheat sheets · 2-week structured plan
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <Target className="w-9 h-9 text-amber-400" />
              Data Engineering Interview Prep
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl">
              A curated interview-prep library for data engineers. {sheetCount} cheat sheets across
              SQL, Snowflake, Databricks, AWS, Azure, dbt, Airflow, Python/PySpark, data modeling,
              and system design — plus a concrete 2-week study plan you can follow day-by-day.
              Everything is free and indexed for rapid review.
            </p>
          </motion.div>

          {/* Track nav */}
          <nav aria-label="Interview tracks" className="mb-10">
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => {
                const Ic = t.icon;
                return (
                  <a
                    key={t.id}
                    href={`#track-${t.id}`}
                    className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 text-xs font-medium rounded-full bg-slate-800/80 border border-slate-700 text-gray-100 hover:bg-slate-800 hover:border-amber-500/60 hover:text-amber-200 transition-colors"
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/80 ring-1 ring-slate-700 ${t.dot}`}>
                      <Ic className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                    {t.label}
                  </a>
                );
              })}
            </div>
          </nav>

          {/* Overview prose */}
          <section className="prose prose-invert max-w-3xl mb-12 text-gray-300">
            <h2 className="text-2xl font-semibold text-white mb-3">What this hub is for</h2>
            <p className="mb-4">
              Data engineering interviews have shifted in the past few years. Fewer rote algorithm
              questions, more systems-oriented thinking. You will be asked about warehouse cost
              levers, partitioning trade-offs, incremental model design, the pros and cons of
              CDC vs full-refresh loads, and how to reason about 10TB-scale query performance.
              The bar for senior-level SQL is simultaneously lower in algorithmic depth but much
              higher in dialect-specific fluency — window functions, QUALIFY, MERGE, and
              semi-structured access patterns are all assumed.
            </p>
            <p className="mb-4">
              This hub is organized by track — SQL, Snowflake, Databricks, AWS, Azure, dbt,
              Airflow, Python/PySpark, modeling, system design — so you can jump straight to the
              stack your target role uses. Each track links only to cheat sheets and articles
              already in this library; the companion long-form articles provide narrative context
              for concepts that need more than a scan-ready reference.
            </p>
            <p className="mb-4">
              If you have two weeks, follow the study plan below. If you have fewer days, use the
              &quot;core 5&quot; shortlist in the FAQ. If you have weeks, do both — then run
              timed mock interviews against yourself using the Q&amp;A blocks inside each cheat sheet.
            </p>
          </section>

          {/* The core 5 */}
          <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              The core 5: start here if time is short
            </h2>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">1</span>
                <div>
                  <Link to="/cheatsheets/sql-interview-questions" className="text-white font-medium hover:text-amber-300">SQL Interview Questions</Link>
                  <span className="block text-gray-400">Joins, grouping, set ops, subqueries, recursion. Dialect-agnostic — applies to every role.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">2</span>
                <div>
                  <Link to="/cheatsheets/sql-window-functions" className="text-white font-medium hover:text-amber-300">SQL Window Functions</Link>
                  <span className="block text-gray-400">Must-know. Most interview failures cluster here.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">3</span>
                <div>
                  <Link to="/cheatsheets/data-engineering-interview-questions" className="text-white font-medium hover:text-amber-300">Data Engineering Interview Questions</Link>
                  <span className="block text-gray-400">Systems + pipelines + orchestration breadth — warehouse-agnostic.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">4</span>
                <div>
                  <Link to="/cheatsheets/data-modeling" className="text-white font-medium hover:text-amber-300">Data Modeling</Link>
                  <span className="block text-gray-400">Dimensional, normalization, SCDs, fact/dim trade-offs. Asked at every level.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">5</span>
                <div>
                  <Link to="/articles/data-engineer-system-design-interview" className="text-white font-medium hover:text-amber-300">Data Engineer System Design Guide</Link>
                  <span className="block text-gray-400">End-to-end pipelines, ingestion/storage/serving, cost + SLA trade-offs.</span>
                </div>
              </li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              Then add the warehouse that matches your target role: <Link to="/cheatsheets/snowflake-interview-questions" className="text-amber-300 hover:text-amber-200 underline">Snowflake</Link>
              {' '}· <Link to="/cheatsheets/databricks" className="text-amber-300 hover:text-amber-200 underline">Databricks</Link>
              {' '}· <Link to="/cheatsheets/aws-for-data-engineers" className="text-amber-300 hover:text-amber-200 underline">AWS</Link>
              {' '}· <Link to="/cheatsheets/azure-for-data-engineers" className="text-amber-300 hover:text-amber-200 underline">Azure</Link>.
            </p>
          </section>

          {/* 2-week plan */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">2-week structured study plan</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-3xl">
              Roughly 1-1.5 hours per day. Each link opens an indexed cheat sheet — you do NOT need
              to read it linearly. Scan, absorb, close, explain out loud, move on.
            </p>

            <h3 className="text-xl text-amber-300 font-semibold mb-3">Week 1 — Breadth across the stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {WEEK1_PLAN.map((day, idx) => (
                <div key={`w1-${idx}`} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{day.day}</h4>
                    <span className="text-xs text-gray-500">{day.title}</span>
                  </div>
                  <ul className="space-y-2">
                    {day.tasks.map((t, ti) => renderTaskLink(t, 1, idx, ti))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="text-xl text-amber-300 font-semibold mb-3">Week 2 — Depth + Practice</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WEEK2_PLAN.map((day, idx) => (
                <div key={`w2-${idx}`} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{day.day}</h4>
                    <span className="text-xs text-gray-500">{day.title}</span>
                  </div>
                  <ul className="space-y-2">
                    {day.tasks.map((t, ti) => renderTaskLink(t, 2, idx, ti))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Browse by track */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">Browse by track</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-3xl">
              Jump to the track that matches your target role. Every link is to a cheat sheet or
              article already in this library — no external redirects.
            </p>

            <div className="space-y-6">
              {TRACKS.map((t) => {
                const Ic = t.icon;
                const resolved = t.items.map((it) => ({ ...it, resolved: resolveItem(it) })).filter((x) => x.resolved);
                if (resolved.length === 0) return null;
                return (
                  <div
                    key={t.id}
                    id={`track-${t.id}`}
                    className={`bg-gradient-to-br ${t.accent} border rounded-2xl p-5 scroll-mt-20`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Ic className={`w-5 h-5 ${t.dot}`} />
                      <h3 className="text-lg font-semibold text-white">{t.label}</h3>
                      <span className="text-xs text-gray-400 ml-auto">{resolved.length} resources</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resolved.map((item, i) => {
                        const r = item.resolved;
                        const isArticle = item.type === 'article';
                        return (
                          <Link
                            key={`${t.id}-${i}`}
                            to={r.href}
                            className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 hover:border-amber-500/50 rounded-xl p-4 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-white text-sm font-semibold group-hover:text-amber-300 leading-snug">
                                {r.title}
                              </h4>
                              {isArticle ? (
                                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                              {r.description}
                            </p>
                            <div className="text-[11px] text-gray-500">{r.meta}</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interview articles */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">Long-form interview articles</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-3xl">
              For topics that benefit from narrative context — system design, behavioral framing,
              end-to-end walkthroughs.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {INTERVIEW_ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  to={`/articles/${article.slug}`}
                  className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl p-5 transition-all flex items-start gap-4"
                >
                  <Award className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold group-hover:text-amber-300 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-400">{article.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </section>

          {/* Pair with tools */}
          <section className="mb-12 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              Pair prep with hands-on tools
            </h2>
            <p className="text-gray-300 text-sm mb-4 max-w-3xl">
              Interviewers often ask &quot;roughly how much would this cost?&quot; or &quot;what
              warehouse size would you pick for this workload?&quot; Practice with numbers, not
              hand-waving. (Calculators are currently Snowflake-focused — the unit economics
              concepts transfer to Databricks DBUs and BigQuery slots.)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link to="/tools/snowflake-cost-calculator" className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-amber-500 rounded-lg p-3 text-sm">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-gray-300">Snowflake Cost Calculator</span>
              </Link>
              <Link to="/tools/snowflake-query-cost-estimator" className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-amber-500 rounded-lg p-3 text-sm">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span className="text-gray-300">Query Cost Estimator</span>
              </Link>
              <Link to="/tools/snowflake-warehouse-sizing" className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-amber-500 rounded-lg p-3 text-sm">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-gray-300">Warehouse Sizing Estimator</span>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Frequently asked questions</h2>
            <div className="space-y-3">
              {FAQ.map((f, i) => (
                <details key={i} className="group bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 open:bg-slate-800/70">
                  <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                    {f.q}
                    <span className="text-amber-400 group-open:rotate-45 transition-transform text-xl">+</span>
                  </summary>
                  <p className="mt-3 text-gray-300 text-sm leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
            <p className="text-white font-medium mb-2">Ready to go broad?</p>
            <p className="text-gray-300 text-sm mb-4 max-w-xl mx-auto">
              Browse all cheat sheets across all categories — not just interview.
            </p>
            <Link
              to="/cheatsheets"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              All Cheat Sheets <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
