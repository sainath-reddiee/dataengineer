import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RotateCcw,
  BookOpen,
  Layers,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { SITE_CONFIG } from '@/lib/seoConfig';
import SponsorPlacement from '@/components/SponsorPlacement';
import { TOOLS, TOOL_CATEGORIES, TOOL_STAGES } from '@/data/toolsCatalog';
import { TOOL_ICONS } from '@/data/toolIcons';

// ─── Filter Options Data ──────────────────────────────────────────────────────

const TECHNOLOGIES = [
  'All',
  'Snowflake',
  'Databricks',
  'BigQuery',
  'dbt',
  'Python',
  'SQL',
  'AWS',
  'Airflow',
  'Kafka',
];

const SKILL_LEVELS = ['All', 'Basic', 'Intermediate', 'Advanced'];

const FAQS = [
  {
    q: 'Are these tools free?',
    a: 'Yes. Every tool on this page is free, requires no login, and stores nothing on our servers. All calculations run in your browser.',
  },
  {
    q: 'How accurate are the cost estimates?',
    a: 'Each calculator uses publicly documented list pricing (as of 2026) for the relevant platform — Snowflake credit rates, BigQuery on-demand/slot pricing, Databricks DBU rates, and dbt Cloud seat pricing.',
  },
  {
    q: 'Which platforms do these tools cover?',
    a: 'The collection spans Snowflake, Databricks, BigQuery, dbt Cloud, plus cross-platform tools like the Cloud Warehouse Cost Comparison, SQL Playground, JSON/Parquet/Avro converter, and Cron Builder.',
  },
  {
    q: 'Can I share a configured estimate with my team?',
    a: 'Yes. Each tool encodes its inputs in the URL query string, so you can copy the browser URL after setting up an estimate and share the link.',
  },
];

export default function ToolsHubPage() {
  const [params, setParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(params.get('cat') || 'all');

  // Filter tools matching selected technology, level, category, and search query
  const visibleTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      // Technology Filter
      if (selectedTech !== 'All') {
        const t = selectedTech.toLowerCase();
        const matchesTech =
          tool.title.toLowerCase().includes(t) ||
          tool.tagline.toLowerCase().includes(t) ||
          tool.description.toLowerCase().includes(t) ||
          (tool.primaryFor && tool.primaryFor.toLowerCase().includes(t));
        if (!matchesTech) return false;
      }

      // Skill Level Filter
      if (selectedLevel !== 'All') {
        const l = selectedLevel.toLowerCase();
        const levelTag = tool.level ? tool.level.toLowerCase() : 'intermediate';
        if (!levelTag.includes(l)) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        if (tool.category !== selectedCategory) return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          tool.title.toLowerCase().includes(q) ||
          tool.tagline.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.primaryFor.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [selectedTech, selectedLevel, selectedCategory, searchQuery]);

  const clearAllFilters = () => {
    setSelectedTech('All');
    setSelectedLevel('All');
    setSelectedCategory('all');
    setSearchQuery('');
    setParams({}, { replace: true });
  };

  const hasActiveFilters =
    selectedTech !== 'All' || selectedLevel !== 'All' || selectedCategory !== 'all' || searchQuery !== '';

  const pageTitle = 'Free Data Engineering Calculators & Tools 2026';
  const pageDescription =
    'Comprehensive catalog of free calculators and interactive tools for Snowflake, Databricks, BigQuery, dbt Cloud, SQL, and Python.';
  const canonicalUrl = `${SITE_CONFIG.url}/tools`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">

        {/* ── Top Hero Header ── */}
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 py-12 px-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-300 mb-3">
                <Wrench className="h-3.5 w-3.5" />
                FREE TOOLS & CALCULATORS CATALOG
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Data Engineering Catalog
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Cost estimators, format converters, SQL sandboxes, and cron builders. Interactive, browser-based, no login required.
              </p>
            </div>

            {/* Quick Stats pill */}
            <div className="flex gap-4 shrink-0">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-5 py-3 text-center">
                <p className="text-2xl font-black text-emerald-400">{TOOLS.length}</p>
                <p className="text-xs text-slate-400 font-medium">Free Tools</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-5 py-3 text-center">
                <p className="text-2xl font-black text-blue-400">100%</p>
                <p className="text-xs text-slate-400 font-medium">Browser Run</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Catalog Workspace (Two-column layout) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* ── Left Sidebar Filter Panel ── */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sticky top-20 shadow-xl backdrop-blur-md">

                {/* Filter Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catalog Filters</h2>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear All
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Search Catalog
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Technology Filter */}
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
                    Technology
                  </label>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {TECHNOLOGIES.map((tech) => {
                      const selected = selectedTech === tech;
                      return (
                        <button
                          key={tech}
                          onClick={() => setSelectedTech(tech)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selected
                              ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{tech}</span>
                          {selected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skill Level Filter */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
                    Skill Level
                  </label>
                  <div className="space-y-1">
                    {SKILL_LEVELS.map((lvl) => {
                      const selected = selectedLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setSelectedLevel(lvl)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selected
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{lvl}</span>
                          {selected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOOL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* ── Main Catalog Grid (Course & Tool Cards) ── */}
            <main className="lg:col-span-3 space-y-6">

              {/* Status & Results Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Showing <span className="text-blue-400 font-bold">{visibleTools.length}</span> of {TOOLS.length} tools
                  </p>
                  {hasActiveFilters && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtered by:{' '}
                      {selectedTech !== 'All' && <span className="text-blue-300 font-medium mr-2">Tech: {selectedTech}</span>}
                      {selectedLevel !== 'All' && <span className="text-emerald-300 font-medium mr-2">Level: {selectedLevel}</span>}
                      {selectedCategory !== 'all' && <span className="text-indigo-300 font-medium mr-2">Category: {selectedCategory}</span>}
                      {searchQuery && <span className="text-amber-300 font-medium">Search: "{searchQuery}"</span>}
                    </p>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline shrink-0"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Tool Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visibleTools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.icon] || Wrench;
                  return (
                    <motion.div
                      key={tool.slug}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-5 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all shadow-xl"
                    >
                      <div>
                        {/* Top Card Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                {tool.category || 'UTIL'}
                              </span>
                              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                                {tool.title}
                              </h3>
                            </div>
                          </div>

                          {tool.external ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 shrink-0">
                              External <ExternalLink className="h-2.5 w-2.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0">
                              Instant Tool
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-blue-300/90 mb-2">{tool.tagline}</p>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">{tool.description}</p>
                      </div>

                      {/* Card Footer Action */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          <strong className="text-slate-300">Best for:</strong> {tool.primaryFor}
                        </span>

                        {tool.external ? (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Launch <ChevronRight className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link
                            to={`/tools/${tool.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            Open Tool <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* No results fallback */}
              {visibleTools.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
                  <Wrench className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">No tools match your criteria</h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Try resetting your technology or search filter to see all free calculators.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Catalog Filters
                  </button>
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
