// src/pages/CheatSheetPage.jsx
/**
 * Individual Cheat Sheet Detail Page
 * Renders sections (tables, code, tips) with SEO schema
 * Spoke page in the hub-and-spoke PSEO pattern
 */

import React, { useState, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  BookOpen,
  Clock,
  ArrowLeft,
  Lightbulb,
  Table2,
  Code2,
  Share2,
  FileText,
  HelpCircle,
  CheckSquare,
  AlertTriangle,
  Info,
  Zap,
  ChevronDown,
  Calculator,
  Wrench,
} from 'lucide-react';

import {
  getCheatSheetBySlug,
  getRelatedCheatSheets,
  CHEATSHEET_CATEGORIES,
} from '@/data/cheatsheetData';
import { SITE_CONFIG } from '@/lib/seoConfig';

// Map cheatsheet category -> relevant interactive tools for the sidebar widget.
// Each entry: { slug, title, tagline }. Keep lists small (3 max) to preserve focus.
const CATEGORY_TOOLS = {
  sql: [
    { slug: 'sql-formatter', title: 'SQL Formatter', tagline: 'Clean up messy queries' },
    { slug: 'snowflake-query-cost-estimator', title: 'Query Cost Estimator', tagline: 'Forecast spend per query' },
    { slug: 'json-to-sql-ddl', title: 'JSON → SQL DDL', tagline: 'Generate CREATE TABLE from JSON' },
  ],
  orchestration: [
    { slug: 'cron-expression-builder', title: 'Cron Expression Builder', tagline: 'Build & test schedules' },
    { slug: 'dbt-cloud-cost-calculator', title: 'dbt Cloud Cost Calculator', tagline: 'Estimate seat + run costs' },
  ],
  cloud: [
    { slug: 'snowflake-cost-calculator', title: 'Snowflake Cost Calculator', tagline: 'Monthly warehouse spend' },
    { slug: 'databricks-cost-calculator', title: 'Databricks Cost Calculator', tagline: 'DBU-based pricing' },
    { slug: 'snowflake-warehouse-sizing', title: 'Warehouse Sizing Tool', tagline: 'Right-size your workload' },
  ],
  programming: [
    { slug: 'json-to-sql-ddl', title: 'JSON → SQL DDL', tagline: 'Schema inference from JSON' },
    { slug: 'sql-formatter', title: 'SQL Formatter', tagline: 'Standardize SQL style' },
  ],
  architecture: [
    { slug: 'snowflake-warehouse-sizing', title: 'Warehouse Sizing Tool', tagline: 'Capacity planning' },
    { slug: 'snowflake-cost-calculator', title: 'Snowflake Cost Calculator', tagline: 'TCO modeling' },
    { slug: 'databricks-cost-calculator', title: 'Databricks Cost Calculator', tagline: 'Compare lakehouse costs' },
  ],
  interview: [
    { slug: 'snowflake-query-cost-estimator', title: 'Query Cost Estimator', tagline: 'Practice cost questions' },
    { slug: 'snowflake-warehouse-sizing', title: 'Warehouse Sizing Tool', tagline: 'Sizing scenarios' },
  ],
  bestpractices: [
    { slug: 'snowflake-cost-calculator', title: 'Snowflake Cost Calculator', tagline: 'Model optimizations' },
    { slug: 'sql-formatter', title: 'SQL Formatter', tagline: 'Enforce SQL standards' },
  ],
};

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
  Intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Advanced: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

// ─── Section Renderers ──────────────────────────────────────

function TableSection({ section }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-600">
            {section.columns.map((col) => (
              <th key={col} className="py-3 px-4 text-left text-blue-300 font-semibold whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.items.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={`py-3 px-4 ${j === 0 ? 'text-white font-medium' : 'text-gray-300'}`}>
                  <code className={j === 1 || j === 2 ? 'text-xs bg-slate-900/50 px-1.5 py-0.5 rounded break-all' : ''}>
                    {cell}
                  </code>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeSection({ section }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{section.language}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(section.code)}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
        >
          Copy
        </button>
      </div>
      <pre className="bg-slate-900/80 rounded-b-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 leading-relaxed">{section.code}</code>
      </pre>
    </div>
  );
}

function TipsSection({ section }) {
  return (
    <div className="grid gap-3">
      {section.items.map((tip, i) => (
        <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <span className="flex items-center justify-center w-7 h-7 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full shrink-0 mt-0.5">
            {i + 1}
          </span>
          <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
        </div>
      ))}
    </div>
  );
}

function QnASection({ section }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="space-y-3">
      {section.items.map((item, i) => (
        <div key={i} className="border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-full shrink-0">
                Q{i + 1}
              </span>
              <span className="text-white font-medium text-sm">{item.question}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 pt-0">
              <div className="pl-10 border-l-2 border-purple-500/30 ml-[2px]">
                <p className="text-gray-300 text-sm leading-relaxed">{item.answer}</p>
                {item.tip && (
                  <p className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {item.tip}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChecklistSection({ section }) {
  return (
    <div className="space-y-3">
      {section.items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <span className={`flex items-center justify-center w-6 h-6 rounded shrink-0 mt-0.5 ${item.checked === false ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {item.checked === false ? '✗' : '✓'}
          </span>
          <div>
            <p className={`text-sm font-medium ${item.checked === false ? 'text-red-300' : 'text-white'}`}>
              {item.label}
            </p>
            {item.detail && (
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const CALLOUT_STYLES = {
  warning: { bg: 'bg-amber-500/10 border-amber-500/30', icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, label: 'Warning' },
  info: { bg: 'bg-blue-500/10 border-blue-500/30', icon: <Info className="w-5 h-5 text-blue-400" />, label: 'Info' },
  tip: { bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <Zap className="w-5 h-5 text-emerald-400" />, label: 'Pro Tip' },
};

function CalloutSection({ section }) {
  return (
    <div className="space-y-4">
      {section.items.map((item, i) => {
        const style = CALLOUT_STYLES[item.variant] || CALLOUT_STYLES.info;
        return (
          <div key={i} className={`border rounded-lg p-5 ${style.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              {style.icon}
              <span className="text-sm font-semibold text-white">{item.title || style.label}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

const SECTION_ICONS = {
  table: <Table2 className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  tips: <Lightbulb className="w-5 h-5" />,
  qna: <HelpCircle className="w-5 h-5" />,
  checklist: <CheckSquare className="w-5 h-5" />,
  callout: <AlertTriangle className="w-5 h-5" />,
};

function SectionRenderer({ section }) {
  const icon = SECTION_ICONS[section.type] || <Lightbulb className="w-5 h-5" />;
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700">
        <span className="text-blue-400">{icon}</span>
        <h2 className="text-lg font-semibold text-white">{section.title}</h2>
      </div>
      <div className="p-6">
        {section.type === 'table' && <TableSection section={section} />}
        {section.type === 'code'  && <CodeSection section={section} />}
        {section.type === 'tips'  && <TipsSection section={section} />}
        {section.type === 'qna'   && <QnASection section={section} />}
        {section.type === 'checklist' && <ChecklistSection section={section} />}
        {section.type === 'callout'   && <CalloutSection section={section} />}
      </div>
    </motion.section>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function CheatSheetPage() {
  const { slug } = useParams();
  const sheet = getCheatSheetBySlug(slug);

  const relatedSheets = useMemo(
    () => (sheet ? getRelatedCheatSheets(slug) : []),
    [slug, sheet]
  );

  // Calculate word count for thin content detection (must be before early return — hooks rules)
  const wordCount = useMemo(() => {
    if (!sheet) return 0;
    const text = (sheet.sections || [])
      .flatMap((s) => (s.items || []).flat())
      .join(' ');
    return text.split(/\s+/).filter(Boolean).length;
  }, [sheet]);
  const isThin = wordCount <= 400;

  if (!sheet) {
    return <Navigate to="/cheatsheets" replace />;
  }

  const category = CHEATSHEET_CATEGORIES.find((c) => c.id === sheet.category);
  const relatedTools = CATEGORY_TOOLS[sheet.category] || [];
  const canonicalUrl = `${SITE_CONFIG.url}/cheatsheets/${sheet.slug}`;
  const hubUrl = `${SITE_CONFIG.url}/cheatsheets`;

  // SEO Schemas
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Cheat Sheets', item: hubUrl },
      { '@type': 'ListItem', position: 3, name: sheet.title, item: canonicalUrl },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: sheet.title,
    description: sheet.shortDescription,
    url: canonicalUrl,
    dateModified: sheet.lastUpdated,
    datePublished: sheet.lastUpdated,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  const faqSchema = sheet.faqs?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sheet.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sheet.title,
          text: sheet.shortDescription,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${sheet.title} — Free Reference Guide | DataEngineer Hub`}</title>
        <meta name="description" content={sheet.shortDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {isThin && <meta name="robots" content="noindex, follow" />}

        <meta property="og:type" content="article" />
        <meta property="og:title" content={sheet.title} />
        <meta property="og:description" content={sheet.shortDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={sheet.title} />
        <meta name="twitter:description" content={sheet.shortDescription} />

        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Breadcrumb */}
        <div className="bg-slate-800/80 border-b border-slate-700/50">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm flex-wrap" aria-label="Breadcrumb">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <Link to="/cheatsheets" className="text-gray-300 hover:text-white transition-colors">Cheat Sheets</Link>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-blue-400 font-medium">{sheet.title}</span>
            </nav>
          </div>
        </div>

        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/cheatsheets"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              All Cheat Sheets
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {sheet.title}
            </h1>

            <p className="text-lg text-gray-300 max-w-3xl mb-6">
              {sheet.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {category && (
                <span className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-slate-700/50 text-gray-300 rounded-lg">
                  <span>{category.icon}</span>
                  {category.name}
                </span>
              )}
              <span className={`text-sm px-3 py-1 rounded-lg border ${DIFFICULTY_COLORS[sheet.difficulty] || ''}`}>
                {sheet.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                Updated {sheet.lastUpdated}
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors ml-auto"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Main Sections */}
            <div className="space-y-6">
              {sheet.sections.map((section, i) => (
                <SectionRenderer key={i} section={section} />
              ))}

              {/* Prose cross-link block — contextual internal linking for SEO + UX */}
              {(relatedSheets.length > 0 || relatedTools.length > 0) && (
                <motion.section
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-800/40 border border-slate-700 rounded-xl p-6"
                >
                  <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Keep going
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    This cheat sheet pairs well with{' '}
                    {relatedSheets.slice(0, 3).map((rs, idx, arr) => (
                      <React.Fragment key={rs.slug}>
                        <Link
                          to={`/cheatsheets/${rs.slug}`}
                          className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                          {rs.title}
                        </Link>
                        {idx < arr.length - 2 ? ', ' : idx === arr.length - 2 ? ', and ' : ''}
                      </React.Fragment>
                    ))}
                    {relatedSheets.length > 0 && '.'}
                    {relatedTools.length > 0 && (
                      <>
                        {' '}If you prefer hands-on exploration, try our{' '}
                        {relatedTools.slice(0, 2).map((t, idx, arr) => (
                          <React.Fragment key={t.slug}>
                            <Link
                              to={`/tools/${t.slug}`}
                              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                            >
                              {t.title}
                            </Link>
                            {idx < arr.length - 2 ? ', ' : idx === arr.length - 2 ? ' or ' : ''}
                          </React.Fragment>
                        ))}
                        {' '}to turn the concepts above into concrete numbers.
                      </>
                    )}
                  </p>
                </motion.section>
              )}

              {/* FAQ */}
              {sheet.faqs?.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700">
                    <span className="text-blue-400"><BookOpen className="w-5 h-5" /></span>
                    <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {sheet.faqs.map((faq, i) => (
                      <div key={i} className="p-6">
                        <h3 className="text-white font-medium mb-2">{faq.question}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Table of Contents */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                  On this page
                </h3>
                <nav className="space-y-2">
                  {sheet.sections.map((section, i) => (
                    <a
                      key={i}
                      href={`#section-${i}`}
                      className="block text-sm text-gray-400 hover:text-blue-400 transition-colors truncate"
                    >
                      {section.title}
                    </a>
                  ))}
                  {sheet.faqs?.length > 0 && (
                    <a href="#faqs" className="block text-sm text-gray-400 hover:text-blue-400 transition-colors">
                      FAQs
                    </a>
                  )}
                </nav>
              </div>

              {/* Related Cheat Sheets */}
              {relatedSheets.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                    Related Cheat Sheets
                  </h3>
                  <div className="space-y-2">
                    {relatedSheets.slice(0, 4).map((related) => (
                      <Link
                        key={related.slug}
                        to={`/cheatsheets/${related.slug}`}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors group"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">{related.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tools — hands-on calculators/utilities mapped from category */}
              {relatedTools.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    Related Tools
                  </h3>
                  <div className="space-y-3">
                    {relatedTools.map((tool) => (
                      <Link
                        key={tool.slug}
                        to={`/tools/${tool.slug}`}
                        className="block group"
                      >
                        <div className="flex items-start gap-2">
                          <Calculator className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-300 group-hover:text-emerald-300 transition-colors truncate">
                              {tool.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{tool.tagline}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-5 text-center">
                <p className="text-sm text-white font-medium mb-2">Want the full deep-dive?</p>
                <p className="text-xs text-gray-400 mb-3">
                  Check out our in-depth articles for production-ready patterns.
                </p>
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  Browse Articles <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
