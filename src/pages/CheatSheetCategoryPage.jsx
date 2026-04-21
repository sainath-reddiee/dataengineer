// src/pages/CheatSheetCategoryPage.jsx
// Category-scoped cheat-sheet listing. One page per category in CHEATSHEET_CATEGORIES.
// Examples: /cheatsheets/category/sql, /cheatsheets/category/interview.
import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, FileText, BookOpen, Clock } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import {
  cheatsheets,
  CHEATSHEET_CATEGORIES,
  getCheatSheetsByCategory,
} from '@/data/cheatsheetData';
import { SITE_CONFIG } from '@/lib/seoConfig';

// Category descriptions — substantive, category-specific copy (no thin boilerplate).
const CATEGORY_INTRO = {
  sql: {
    heading: 'SQL & Database Cheat Sheets',
    lede:
      'Reference cards for Snowflake SQL, window functions, semi-structured data (VARIANT/OBJECT/ARRAY), and interview-grade SQL patterns. Use these as copy-paste starters for real queries.',
    seoDesc:
      'SQL cheat sheets for data engineers: Snowflake SQL, window functions, semi-structured data, interview SQL patterns. Copy-paste query recipes.',
    body: (
      <>
        <p className="mb-4">
          These SQL references are organized by difficulty and dialect. If you are new to Snowflake
          but strong in Postgres, start with the Snowflake SQL cheat sheet and note the differences:
          TIMESTAMP_NTZ as default timestamp type, QUALIFY clause for post-aggregation filtering,
          VARIANT for JSON, and ZERO_IFNULL / NULLIFZERO helpers.
        </p>
        <p className="mb-4">
          For analytics work, the Window Functions cheat sheet is the highest-leverage read — one
          page covers ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD, LAST_VALUE, and frame clauses
          (ROWS BETWEEN ... ). Most SQL interview failures happen on window-function edge cases.
        </p>
      </>
    ),
  },
  orchestration: {
    heading: 'Orchestration & Tools Cheat Sheets',
    lede:
      'dbt, Airflow, Databricks — the core tools in every modern data engineering stack. These cheat sheets skip the marketing copy and focus on what you actually run in production.',
    seoDesc:
      'Orchestration cheat sheets: dbt commands, Airflow essentials, Databricks fundamentals. Production-ready references.',
    body: (
      <>
        <p className="mb-4">
          Orchestration is where pipelines break. The Airflow Essentials cheat sheet covers the
          specific operators, XCom patterns, and SLA/pool configurations that prevent 2 AM pages.
          The dbt Commands sheet is a CLI reference — every command, every flag, selector syntax,
          and the diff between <code>dbt build</code>, <code>dbt run</code>, and <code>dbt test</code>.
        </p>
        <p className="mb-4">
          If you are choosing tooling: dbt + Airflow is the default stack; Databricks is the pick
          when you need Spark (streaming, ML, heavy Python). Snowflake + dbt + Airflow scales to
          most analytics shops. Try the{' '}
          <Link to="/tools/dbt-cloud-cost-calculator" className="text-blue-400 hover:underline">
            dbt Cloud Cost Calculator
          </Link>{' '}
          to estimate whether managed dbt Cloud is cheaper than self-hosted.
        </p>
      </>
    ),
  },
  cloud: {
    heading: 'Cloud Platform Cheat Sheets',
    lede:
      'Snowflake, Databricks, and cloud infrastructure references. Cost levers, feature comparisons, and real-world sizing guidance.',
    seoDesc:
      'Cloud data platform cheat sheets: Snowflake, Databricks. Architecture, cost, performance tuning references.',
    body: (
      <>
        <p className="mb-4">
          Cloud data platforms are priced on consumption, so understanding exactly what consumes
          credits / DBUs is the difference between a $5k and $50k invoice. The Snowflake cost
          optimization reference covers warehouse sizing, auto-suspend, query pruning, result cache,
          clustering, and materialized views — the top 12 levers.
        </p>
        <p className="mb-4">
          For multi-cloud decisions, pair these cheat sheets with the{' '}
          <Link to="/tools/snowflake-cost-calculator" className="text-blue-400 hover:underline">
            Snowflake Cost Calculator
          </Link>
          {' '}and the{' '}
          <Link to="/tools/databricks-cost-calculator" className="text-blue-400 hover:underline">
            Databricks Cost Calculator
          </Link>
          {' '}to run apples-to-apples comparisons for your workload.
        </p>
      </>
    ),
  },
  programming: {
    heading: 'Programming Cheat Sheets',
    lede:
      'Python, PySpark, and language-specific references for data engineers. Syntax is the easy part — these focus on the idioms and gotchas that come up in real pipelines.',
    seoDesc:
      'Programming cheat sheets for data engineers: Python, PySpark. Real-world idioms and gotchas.',
    body: (
      <>
        <p className="mb-4">
          The Python for Data Engineers reference is opinionated: it favors pathlib over os.path,
          type hints over docstring contracts, dataclasses over dict for structured records, and
          pytest over unittest. For PySpark, the cheat sheet covers DataFrame operations, UDFs
          vs built-in functions, partition tuning, and the most common performance antipatterns.
        </p>
        <p className="mb-4">
          Pair with the{' '}
          <Link to="/cheatsheets/sql-window-functions" className="text-blue-400 hover:underline">
            SQL Window Functions
          </Link>
          {' '}sheet — in modern data engineering, you will use both SQL and Python, and the
          decision of where to do a transformation (warehouse SQL vs Python in orchestrator)
          is a recurring design call.
        </p>
      </>
    ),
  },
  architecture: {
    heading: 'Architecture Cheat Sheets',
    lede:
      'Data modeling, warehouse design, and architectural decisions. The patterns here outlast any specific vendor or SDK.',
    seoDesc:
      'Data architecture cheat sheets: modeling, dimensional design, warehouse architecture. Vendor-agnostic fundamentals.',
    body: (
      <>
        <p className="mb-4">
          Architecture decisions compound. A good dimensional model saves you from three years of
          ad-hoc joins; a bad one costs you two rewrites. The Data Modeling cheat sheet covers
          star/snowflake schemas, slowly-changing dimensions (Type 0-6), bridge tables, and
          junk-dimension patterns — with concrete Snowflake DDL.
        </p>
        <p className="mb-4">
          For production reliability, the architectural-grade Snowflake references also belong here:
          streams, tasks, and materialized views. The Cost Optimization reference doubles as an
          architecture guide because most cost issues are really architecture issues in disguise.
        </p>
      </>
    ),
  },
  interview: {
    heading: 'Interview Prep Cheat Sheets',
    lede:
      'Focused, role-specific interview references. Each sheet is structured around the actual question patterns that come up — not trivia.',
    seoDesc:
      'Data engineering interview cheat sheets: Snowflake, SQL, dbt, data modeling. Real interview question patterns.',
    body: (
      <>
        <p className="mb-4">
          Data engineering interviews have become more systems-oriented and less LeetCode. Expect
          to be asked about warehouse sizing trade-offs, partitioning/clustering choices,
          incremental model design, and cost optimization — in addition to SQL fluency. These
          cheat sheets are organized around those question types.
        </p>
        <p className="mb-4">
          The core 4-sheet interview bundle: Snowflake Interview Questions, SQL Interview Questions,
          Data Engineering Interview Questions, and the Snowflake-specific deep dives (Cost,
          Performance, Governance, Semi-Structured). Use the{' '}
          <Link to="/interview-prep" className="text-blue-400 hover:underline">
            Interview Prep Hub
          </Link>
          {' '}for a structured 2-week study plan.
        </p>
      </>
    ),
  },
  bestpractices: {
    heading: 'Best Practices Cheat Sheets',
    lede:
      'Conventions, guidelines, and code-review rubrics. What "good" looks like in a mature data engineering shop.',
    seoDesc:
      'Data engineering best practices: Snowflake, dbt, code review rubrics. What good looks like.',
    body: (
      <>
        <p className="mb-4">
          Best practices are contextual — a pre-Series-A startup and a FAANG-scale org should make
          different trade-offs on the same decision. These cheat sheets surface the underlying
          decision framework so you can apply it to your own scale and team.
        </p>
        <p className="mb-4">
          Two high-leverage reads: dbt Best Practices (layered models, tests at every layer,
          documentation as contracts) and Snowflake Best Practices (security, cost, performance
          defaults). Combined, they form the basis of most modern data-platform style guides.
        </p>
      </>
    ),
  },
};

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
  Intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Advanced: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export default function CheatSheetCategoryPage() {
  const { categoryId } = useParams();

  const category = CHEATSHEET_CATEGORIES.find((c) => c.id === categoryId);
  const intro = CATEGORY_INTRO[categoryId];

  const sheets = useMemo(
    () => (category ? getCheatSheetsByCategory(categoryId) : []),
    [categoryId, category]
  );

  if (!category || !intro) {
    return <Navigate to="/cheatsheets" replace />;
  }

  const canonicalUrl = `${SITE_CONFIG.url}/cheatsheets/category/${categoryId}`;
  const hubUrl = `${SITE_CONFIG.url}/cheatsheets`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: intro.heading,
    itemListElement: sheets.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE_CONFIG.url}/cheatsheets/${s.slug}`,
      name: s.title,
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Cheat Sheets', item: hubUrl },
      { '@type': 'ListItem', position: 3, name: category.name, item: canonicalUrl },
    ],
  };
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: intro.heading,
    description: intro.seoDesc,
    url: canonicalUrl,
    isPartOf: { '@type': 'WebSite', url: SITE_CONFIG.url, name: SITE_CONFIG.name },
  };

  // Cross-links to sibling categories to spread link equity and aid discovery.
  const siblings = CHEATSHEET_CATEGORIES.filter((c) => c.id !== categoryId);

  return (
    <>
      <MetaTags
        title={`${intro.heading} — ${sheets.length} Free References`}
        description={intro.seoDesc}
        keywords={`${category.name} cheat sheet, data engineering ${category.name}, ${category.name} reference, ${category.name} interview`}
        url={`/cheatsheets/category/${categoryId}`}
        type="website"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionPageSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-blue-400">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/cheatsheets" className="hover:text-blue-400">Cheat Sheets</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300">{category.name}</span>
          </nav>

          <Link
            to="/cheatsheets"
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Cheat Sheets
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{category.icon}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{intro.heading}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {sheets.length} cheat sheet{sheets.length === 1 ? '' : 's'} in this category
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-lg max-w-3xl">{intro.lede}</p>
          </motion.div>

          <section className="prose prose-invert max-w-3xl mb-10 text-gray-300">
            {intro.body}
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              All {category.name} cheat sheets
            </h2>
            {sheets.length === 0 ? (
              <p className="text-gray-400">No cheat sheets in this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sheets.map((sheet) => (
                  <Link
                    key={sheet.slug}
                    to={`/cheatsheets/${sheet.slug}`}
                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-semibold group-hover:text-blue-300">
                        {sheet.title}
                      </h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[sheet.difficulty] || ''}`}>
                        {sheet.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                      {sheet.shortDescription}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {sheet.sections?.length || 0} sections
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {sheet.lastUpdated}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mb-12 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Explore other categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {siblings.map((c) => (
                <Link
                  key={c.id}
                  to={`/cheatsheets/category/${c.id}`}
                  className="group flex items-center gap-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-lg p-3 transition-colors"
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-sm text-gray-300 group-hover:text-blue-300">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6 text-center">
            <p className="text-white font-medium mb-2">Need the hands-on side?</p>
            <p className="text-gray-300 text-sm mb-4 max-w-xl mx-auto">
              Our free calculators complement these cheat sheets — plug real numbers in and see
              the answers for your workload.
            </p>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse all tools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
