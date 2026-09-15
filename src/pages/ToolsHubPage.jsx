// src/pages/ToolsHubPage.jsx
/**
 * Tools Hub Page
 * Lists all free data-engineering calculators and tools
 * Covers Snowflake, Databricks, BigQuery, dbt Cloud, SQL, and general utilities
 * Hub-and-spoke model for SEO (like Cheat Sheets and Glossary hubs)
 */

import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Sparkles,
  Wrench,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

import { SITE_CONFIG } from '@/lib/seoConfig';
import SponsorPlacement from '@/components/SponsorPlacement';
import { TOOLS, TOOL_CATEGORIES, TOOL_STAGES, filterTools } from '@/data/toolsCatalog';
import { TOOL_ICONS } from '@/data/toolIcons';

const FAQS = [
  {
    q: 'Are these tools free?',
    a: 'Yes. Every tool on this page is free, requires no login, and stores nothing on our servers. All calculations run in your browser.',
  },
  {
    q: 'How accurate are the cost estimates?',
    a: 'Each calculator uses publicly documented list pricing (as of 2026) for the relevant platform — Snowflake credit rates, BigQuery on-demand/slot pricing, Databricks DBU rates, and dbt Cloud seat pricing. Actual invoiced cost depends on your contract, region, and real usage. Always cross-check with your platform\'s billing dashboard for authoritative numbers.',
  },
  {
    q: 'Which platforms do these tools cover?',
    a: 'The collection spans Snowflake (cost calculator, query estimator, warehouse sizing, credit converter), Databricks (DBU cost calculator), BigQuery (on-demand & editions cost calculator), dbt Cloud (seat + consumption estimator), plus cross-platform tools like the Cloud Warehouse Cost Comparison, SQL Playground, JSON/Parquet/Avro converter, and Cron Builder.',
  },
  {
    q: 'Can I share a configured estimate with my team?',
    a: 'Yes. Each tool encodes its inputs in the URL query string, so you can copy the browser URL after setting up an estimate and share the link. Anyone who opens the URL sees the same inputs and results.',
  },
  {
    q: 'Which tool should I use first?',
    a: 'It depends on your goal. For Snowflake cost planning, start with the Warehouse Sizing Estimator. Comparing cloud warehouses? Use the Cloud Warehouse Cost Comparison for side-by-side Snowflake vs BigQuery vs Databricks pricing. For dbt projects, try the dbt Cloud Cost Calculator. For general data engineering, the SQL Playground, Cron Builder, and Format Converter are great everyday utilities.',
  },
];

export default function ToolsHubPage() {
  const [params, setParams] = useSearchParams();
  const category = TOOL_CATEGORIES.some((item) => item.id === params.get('cat'))
    ? params.get('cat')
    : 'all';
  const stage = TOOL_STAGES.some((item) => item.id === params.get('stack'))
    ? params.get('stack')
    : '';
  const visibleTools = useMemo(() => filterTools({ category, stage }), [category, stage]);
  const activeStage = TOOL_STAGES.find((item) => item.id === stage);

  const setCategory = (id) => {
    const next = new URLSearchParams(params);
    if (!id || id === 'all') next.delete('cat');
    else next.set('cat', id);
    setParams(next, { replace: true });
  };

  const setStage = (id) => {
    const next = new URLSearchParams(params);
    if (!id || next.get('stack') === id) next.delete('stack');
    else next.set('stack', id);
    setParams(next, { replace: true });
  };

  const pageTitle = 'Free Data Engineering Calculators & Tools 2026';
  const pageDescription =
    'Free cost calculators for Snowflake, Databricks, BigQuery, and dbt Cloud — plus a SQL playground, cron builder, and format converter. No login, instant results, shareable URLs.';
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
    name: 'Free Data Engineering Tools and Calculators',
    description: pageDescription,
    url: canonicalUrl,
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((tool, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: tool.title,
      url: tool.external ? tool.url : `${SITE_CONFIG.url}/tools/${tool.slug}`,
      description: tool.description,
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Data Engineering Tools & Calculators',
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
          content="snowflake cost calculator, databricks cost calculator, bigquery pricing calculator, dbt cloud cost estimator, snowflake credit cost, snowflake warehouse sizing, cloud data warehouse comparison, sql playground, cron expression builder, free data engineering tools, json parquet avro converter"
        />
        <link rel="canonical" href={canonicalUrl} />
        {/* PSEO/AI-assisted section — held out of the index until further editorial work. */}
        

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />

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
        <div className="bg-gradient-to-b from-slate-900/0 to-slate-900/50 py-8 sm:py-12">
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

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Free Data Engineering Calculators &amp; Tools
              </h1>

              <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Estimate costs for Snowflake, Databricks, BigQuery, and dbt Cloud — format data,
                build cron expressions, and run SQL — all in your browser, no login required.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <SponsorPlacement
            placementFilter="directory"
            relaxTargeting
            category="tools"
            slug="tools"
            className="mt-0 mb-6"
          />
        </div>

        {/* Tool cards grid */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-300">
                {visibleTools.length} {visibleTools.length === 1 ? 'tool' : 'tools'}
                {activeStage ? ` in ${activeStage.label}` : ''}
                {category !== 'all' ? ` · ${TOOL_CATEGORIES.find((item) => item.id === category)?.label}` : ''}
              </p>
              {(stage || category !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setCategory('all'); setStage(''); }}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TOOL_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`compact-control shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    category === item.id
                      ? 'border-blue-400/50 bg-blue-500/20 text-blue-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {TOOL_STAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStage(item.id)}
                  className={`compact-control shrink-0 rounded-full border px-3 py-1.5 text-left ${
                    stage === item.id
                      ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs font-semibold">{item.label}</span>
                  <span className="block text-[10px] opacity-70">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {visibleTools.map((tool, idx) => {
              const Icon = TOOL_ICONS[tool.icon] || Wrench;
              const cardInner = (
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-300" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {tool.title}
                      {tool.external && (
                        <ExternalLink
                          className="w-4 h-4 text-blue-300/70"
                          aria-label="Opens in a new tab"
                        />
                      )}
                    </h2>
                    <p className="text-sm text-blue-300/80 mt-1">{tool.tagline}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                      {TOOL_CATEGORIES.find((item) => item.id === tool.category)?.label || tool.category}
                      {tool.primaryStage ? ` · ${tool.primaryStage}` : ''}
                    </p>
                    <p className="hidden text-gray-300 text-sm mt-3 sm:block">{tool.description}</p>
                    <p className="text-xs text-gray-400 mt-2 sm:mt-3">
                      <span className="font-semibold text-gray-300">Best for:</span>{' '}
                      {tool.primaryFor}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                      {tool.external ? 'Launch tool' : 'Open tool'}{' '}
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              );

              const cardClass =
                'group block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-4 sm:p-6 h-full transition-all duration-200';

              return (
                <motion.div
                  key={tool.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  {tool.external ? (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {cardInner}
                    </a>
                  ) : (
                    <Link to={`/tools/${tool.slug}`} className={cardClass}>
                      {cardInner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
          {visibleTools.length === 0 && (
            <p className="mt-6 text-center text-sm text-slate-400">
              No tools in this filter.{' '}
              <button type="button" onClick={() => { setCategory('all'); setStage(''); }} className="text-blue-400 hover:underline">
                Show all
              </button>
            </p>
          )}
        </div>

        {/* How to choose */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-3">Which tool should I use?</h2>
            <ul className="text-gray-300 space-y-2 list-disc pl-5">
              <li>
                <strong className="text-white">Planning a new Snowflake workload?</strong> Start with the{' '}
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
                <strong className="text-white">Comparing cloud data warehouses?</strong> Use the{' '}
                <Link to="/tools/cloud-data-warehouse-cost-comparison" className="text-blue-400 hover:underline">
                  Cloud Warehouse Cost Comparison
                </Link>{' '}
                for side-by-side Snowflake vs BigQuery vs Databricks pricing on the same workload profile.
              </li>
              <li>
                <strong className="text-white">Optimizing a slow Snowflake query?</strong> Use the{' '}
                <Link to="/tools/snowflake-query-cost-estimator" className="text-blue-400 hover:underline">
                  Query Cost Estimator
                </Link>{' '}
                to compare cost before and after optimization (clustering, SOS, materialized views).
              </li>
              <li>
                <strong className="text-white">Budgeting for Databricks or BigQuery?</strong> The{' '}
                <Link to="/tools/databricks-cost-calculator" className="text-blue-400 hover:underline">
                  Databricks Cost Calculator
                </Link>{' '}
                and{' '}
                <Link to="/tools/bigquery-cost-calculator" className="text-blue-400 hover:underline">
                  BigQuery Cost Calculator
                </Link>{' '}
                estimate monthly spend with platform-specific pricing models.
              </li>
              <li>
                <strong className="text-white">Estimating dbt Cloud costs?</strong> The{' '}
                <Link to="/tools/dbt-cloud-cost-calculator" className="text-blue-400 hover:underline">
                  dbt Cloud Cost Calculator
                </Link>{' '}
                covers seat licensing, model runs, and consumption-based pricing.
              </li>
              <li>
                <strong className="text-white">Need a quick SQL or data utility?</strong> The{' '}
                <Link to="/tools/sql-playground" className="text-blue-400 hover:underline">
                  SQL Playground
                </Link>,{' '}
                <Link to="/tools/cron-expression-builder" className="text-blue-400 hover:underline">
                  Cron Builder
                </Link>, and{' '}
                <Link to="/tools/json-parquet-avro-converter" className="text-blue-400 hover:underline">
                  Format Converter
                </Link>{' '}
                are everyday utilities that work entirely in your browser.
              </li>
              <li>
                <strong className="text-white">Reviewing an invoice?</strong> Plug credit counts
                from ACCOUNT_USAGE into the{' '}
                <Link to="/tools/snowflake-credit-cost" className="text-blue-400 hover:underline">
                  Credit → USD Converter
                </Link>{' '}
                for quick dollar-value checks.
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
              Want deeper data engineering guidance?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Read our in-depth articles on Snowflake, Databricks, BigQuery, dbt, and data
              engineering best practices — built for engineers shipping to production.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse All Articles
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
