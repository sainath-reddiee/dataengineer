// src/pages/ToolsHubPage.jsx
/**
 * Tools Hub Page
 * Lists all free Snowflake/data-engineering calculators and tools
 * Hub-and-spoke model for SEO (like Cheat Sheets and Glossary hubs)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Zap,
  Gauge,
  ChevronRight,
  Sparkles,
  Wrench,
  Code2,
  Clock,
  FileJson,
  FileSpreadsheet,
  FileCode2,
  Cloud,
  Users,
  BookOpen,
} from 'lucide-react';

import { SITE_CONFIG } from '@/lib/seoConfig';

const TOOLS = [
  {
    slug: 'snowflake-cost-calculator',
    title: 'Snowflake Cost Calculator',
    icon: Calculator,
    tagline: 'Full monthly spend estimator',
    description:
      'Model compute, storage, Snowpipe, Cortex AI, and serverless feature costs. Pick warehouse size, edition, region, and hours. Get a complete monthly projection.',
    primaryFor: 'Budget planning, capacity forecasting, vendor negotiations',
  },
  {
    slug: 'snowflake-credit-cost',
    title: 'Credit → USD Converter',
    icon: DollarSign,
    tagline: 'Instant credit price lookup',
    description:
      'Convert any number of Snowflake credits to US dollars instantly across all editions (Standard, Enterprise, Business Critical, VPS) and cloud regions.',
    primaryFor: 'Quick price checks, reviewing Account Usage bills, regional comparisons',
  },
  {
    slug: 'snowflake-query-cost-estimator',
    title: 'Query Cost Estimator',
    icon: Zap,
    tagline: 'Price per query, daily, monthly',
    description:
      'Enter bytes scanned and warehouse size to estimate cost per query, including the 60-second resume minimum. Scales to daily and monthly totals.',
    primaryFor: 'Query optimization ROI, dashboard cost analysis, chargeback',
  },
  {
    slug: 'snowflake-warehouse-sizing',
    title: 'Warehouse Sizing Estimator',
    icon: Gauge,
    tagline: 'Pick XS → 6XL by workload',
    description:
      'Recommends a starting warehouse size (XS to 6XL) from workload type, data volume, and concurrency. Shows one-size-up and one-size-down cost comparison.',
    primaryFor: 'Right-sizing, new workload setup, ETL vs BI tradeoffs',
  },
  {
    slug: 'databricks-cost-calculator',
    title: 'Databricks Cost Calculator',
    icon: Cloud,
    tagline: 'DBU-based lakehouse pricing',
    description:
      'Model Databricks costs by cluster type (All-Purpose, Jobs, SQL Compute, Serverless SQL), DBU rate, instance type, and hours. Compare directly against Snowflake warehouse equivalents.',
    primaryFor: 'Lakehouse vs warehouse decisions, multi-cloud cost benchmarking, platform migrations',
  },
  {
    slug: 'dbt-cloud-cost-calculator',
    title: 'dbt Cloud Cost Calculator',
    icon: Users,
    tagline: 'Seat + run-based pricing',
    description:
      'Estimate dbt Cloud cost across Developer, Team, and Enterprise tiers. Factor in developer seats, successful models built, IDE usage, and run frequency. Compare with dbt Core TCO.',
    primaryFor: 'dbt Cloud vs dbt Core ROI, team budgeting, upgrade planning',
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Formatter',
    icon: Code2,
    tagline: 'Beautify + standardize SQL',
    description:
      'Paste any SQL — Snowflake, PostgreSQL, BigQuery, Redshift, or ANSI — and get consistent formatting with configurable indentation, keyword case, and line length. 100% client-side.',
    primaryFor: 'Code review cleanup, PR hygiene, pre-commit style enforcement',
  },
  {
    slug: 'cron-expression-builder',
    title: 'Cron Expression Builder',
    icon: Clock,
    tagline: 'Visual cron + next-run preview',
    description:
      'Build and validate 5-field and 6-field cron expressions for Airflow, dbt, Snowflake TASK, and standard Unix cron. Shows next 5 run times and human-readable description.',
    primaryFor: 'Airflow DAGs, Snowflake TASKs, dbt Cloud jobs, data pipeline schedules',
  },
  {
    slug: 'json-to-sql-ddl',
    title: 'JSON → SQL DDL Generator',
    icon: FileJson,
    tagline: 'Schema inference from sample',
    description:
      'Paste a JSON sample (or array of samples) and get a CREATE TABLE DDL with inferred types. Supports Snowflake VARIANT, PostgreSQL JSONB, and standard SQL types. Handles nested objects and arrays.',
    primaryFor: 'Ingestion pipeline bootstrapping, schema design, API → warehouse mapping',
  },
  {
    slug: 'csv-to-sql',
    title: 'CSV → SQL Converter',
    icon: FileSpreadsheet,
    tagline: 'INSERT + CREATE TABLE from CSV',
    description:
      'Paste CSV, get both CREATE TABLE DDL and INSERT statements with inferred types. RFC 4180 parser handles quoted fields, embedded commas, and escaped quotes. Snowflake, Postgres, BigQuery, ANSI dialects.',
    primaryFor: 'Test data seeding, fixture generation, quick CSV-to-warehouse loads',
  },
  {
    slug: 'dbt-schema-generator',
    title: 'dbt Schema.yml Generator',
    icon: FileCode2,
    tagline: 'CREATE TABLE → dbt scaffold',
    description:
      'Paste a CREATE TABLE statement, get a complete dbt scaffold: schema.yml with inferred unique/not_null tests, staging SQL model, and sources.yml with freshness checks. Zero warehouse connection required.',
    primaryFor: 'dbt onboarding, staging layer bootstrapping, schema.yml generation without codegen',
  },
];

const FAQS = [
  {
    q: 'Are these tools free?',
    a: 'Yes. Every tool on this page is free, requires no login, and stores nothing on our servers. All calculations run in your browser.',
  },
  {
    q: 'How accurate are the estimates?',
    a: 'Estimates use Snowflake\'s publicly documented list pricing as of 2026. Actual invoiced cost depends on your contract (capacity deals typically discount 20-40% off list), regional pricing, and real usage patterns. Always verify against ACCOUNT_USAGE views for authoritative billing data.',
  },
  {
    q: 'Do these tools support all Snowflake editions?',
    a: 'Yes. All tools let you pick Standard (1.0x), Enterprise (1.5x), Business Critical (2.0x), or VPS (2.5x). The edition multiplier is applied on top of the regional credit price.',
  },
  {
    q: 'Can I share a configured estimate with my team?',
    a: 'Yes. Each tool encodes its inputs in the URL query string, so you can copy the browser URL after setting up an estimate and share the link. Anyone who opens the URL sees the same inputs and results.',
  },
  {
    q: 'Which tool should I use first?',
    a: 'Start with the Warehouse Sizing Estimator if you are planning a new workload, the Query Cost Estimator if you are optimizing an existing query, or the full Cost Calculator if you are modeling a monthly budget. Use the Credit Converter for one-off price lookups.',
  },
];

export default function ToolsHubPage() {
  const pageTitle = 'Free Snowflake Calculators & Cost Tools 2026 | DataEngineer Hub';
  const pageDescription =
    'Free Snowflake cost calculator, query cost estimator, warehouse sizing tool, and credit-to-USD converter. No login, instant results, shareable URLs.';
  const canonicalUrl = `${SITE_CONFIG.url}/tools`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: canonicalUrl },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free Snowflake Tools and Calculators',
    description: pageDescription,
    url: canonicalUrl,
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((tool, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: tool.title,
      url: `${SITE_CONFIG.url}/tools/${tool.slug}`,
      description: tool.description,
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Snowflake Tools & Calculators',
    description: pageDescription,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="snowflake cost calculator, snowflake credit cost, snowflake warehouse sizing, snowflake query cost, free snowflake tools, snowflake pricing calculator"
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Breadcrumb */}
        <div className="bg-slate-800/80 border-b border-slate-700/50">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-blue-400 font-medium">Tools</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-slate-900/0 to-slate-900/50 py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
                <Wrench className="w-4 h-4" />
                <span>{TOOLS.length} Free Tools</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Free Snowflake Calculators &amp; Tools
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Estimate costs, size warehouses, and price individual queries — all in your
                browser, no login required. Shareable URLs preserve every input.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Tool cards grid */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    to={`/tools/${tool.slug}`}
                    className="group block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 h-full transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {tool.title}
                        </h2>
                        <p className="text-sm text-blue-300/80 mt-1">{tool.tagline}</p>
                        <p className="text-gray-300 text-sm mt-3">{tool.description}</p>
                        <p className="text-xs text-gray-400 mt-3">
                          <span className="font-semibold text-gray-300">Best for:</span>{' '}
                          {tool.primaryFor}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                          Open tool <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How to choose */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-3">Which tool should I use?</h2>
            <ul className="text-gray-300 space-y-2 list-disc pl-5">
              <li>
                <strong className="text-white">Planning a new workload?</strong> Start with the{' '}
                <Link to="/tools/snowflake-warehouse-sizing" className="text-blue-400 hover:underline">
                  Warehouse Sizing Estimator
                </Link>{' '}
                to pick an initial size, then use the{' '}
                <Link to="/tools/snowflake-cost-calculator" className="text-blue-400 hover:underline">
                  Cost Calculator
                </Link>{' '}
                to model monthly spend.
              </li>
              <li>
                <strong className="text-white">Optimizing a slow query?</strong> Use the{' '}
                <Link to="/tools/snowflake-query-cost-estimator" className="text-blue-400 hover:underline">
                  Query Cost Estimator
                </Link>{' '}
                to compare cost before and after optimization (clustering, SOS, materialized views).
              </li>
              <li>
                <strong className="text-white">Reviewing an invoice?</strong> Plug credit counts
                from ACCOUNT_USAGE into the{' '}
                <Link to="/tools/snowflake-credit-cost" className="text-blue-400 hover:underline">
                  Credit → USD Converter
                </Link>{' '}
                for quick dollar-value checks.
              </li>
              <li>
                <strong className="text-white">Chargeback / showback?</strong> The Query Cost
                Estimator plus a monthly volume multiplier gives per-team cost attribution for the
                5-10 biggest queries.
              </li>
            </ul>
          </div>
        </div>

        {/* Related Cheat Sheets — cross-link to reference material */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Related cheat sheets</h2>
          </div>
          <p className="text-gray-400 mb-6 max-w-3xl">
            Tools turn concepts into numbers, but you still need the concepts. Pair each calculator
            with the matching reference cheat sheet — all free, all indexed for fast lookup.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                slug: 'snowflake-cost-optimization-interview',
                title: 'Snowflake Cost Optimization',
                pair: 'Cost Calculator + Query Cost Estimator',
              },
              {
                slug: 'snowflake-sql',
                title: 'Snowflake SQL Reference',
                pair: 'SQL Formatter + Query Cost Estimator',
              },
              {
                slug: 'dbt-commands',
                title: 'dbt Commands Reference',
                pair: 'dbt Cloud Cost Calculator',
              },
              {
                slug: 'airflow-essentials',
                title: 'Airflow Essentials',
                pair: 'Cron Expression Builder',
              },
              {
                slug: 'databricks',
                title: 'Databricks Fundamentals',
                pair: 'Databricks Cost Calculator',
              },
              {
                slug: 'snowflake-interview-questions',
                title: 'Snowflake Interview Questions',
                pair: 'Warehouse Sizing + Cost Calculator',
              },
            ].map((sheet) => (
              <Link
                key={sheet.slug}
                to={`/cheatsheets/${sheet.slug}`}
                className="group bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/60 rounded-xl p-5 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold group-hover:text-blue-300">
                    {sheet.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 shrink-0 mt-1" />
                </div>
                <p className="text-xs text-gray-500">
                  Pairs with: <span className="text-gray-400">{sheet.pair}</span>
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/cheatsheets"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Browse all cheat sheets <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5"
              >
                <h3 className="text-white font-semibold mb-2">{f.q}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Want deeper Snowflake guidance?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Read our in-depth articles on cost optimization, warehouse tuning, and query
              performance — built for data engineers shipping to production.
            </p>
            <Link
              to="/category/snowflake"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Snowflake Articles
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
