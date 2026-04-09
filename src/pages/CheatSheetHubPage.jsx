// src/pages/CheatSheetHubPage.jsx
/**
 * Cheat Sheet Hub Page
 * Lists all cheat sheets organized by category
 * Hub-and-spoke model for SEO (like Glossary and Comparisons)
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  ChevronRight,
  Sparkles,
  X,
  BookOpen,
  Download,
} from 'lucide-react';

import { cheatsheets, CHEATSHEET_CATEGORIES } from '@/data/cheatsheetData';
import { SITE_CONFIG } from '@/lib/seoConfig';

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-500/20 text-green-300',
  Intermediate: 'bg-blue-500/20 text-blue-300',
  Advanced: 'bg-orange-500/20 text-orange-300',
};

export default function CheatSheetHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter cheat sheets based on search and category
  const filteredSheets = useMemo(() => {
    let sheets = cheatsheets;

    if (selectedCategory) {
      sheets = sheets.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sheets = sheets.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.shortDescription.toLowerCase().includes(query)
      );
    }

    return sheets;
  }, [searchQuery, selectedCategory]);

  // Group by category for display
  const sheetsByCategory = useMemo(() => {
    if (selectedCategory) {
      return { [selectedCategory]: filteredSheets };
    }
    const grouped = {};
    filteredSheets.forEach((sheet) => {
      if (!grouped[sheet.category]) {
        grouped[sheet.category] = [];
      }
      grouped[sheet.category].push(sheet);
    });
    return grouped;
  }, [filteredSheets, selectedCategory]);

  // SEO
  const pageTitle = 'Data Engineering Cheat Sheets — Free Quick Reference Guides | DataEngineer Hub';
  const pageDescription = 'Free cheat sheets for Snowflake SQL, dbt, Airflow, window functions, and more. Quick-reference guides built for data engineers.';
  const canonicalUrl = `${SITE_CONFIG.url}/cheatsheets`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Cheat Sheets', item: canonicalUrl },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Data Engineering Cheat Sheets',
    description: pageDescription,
    url: canonicalUrl,
    numberOfItems: cheatsheets.length,
    itemListElement: cheatsheets.map((sheet, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: sheet.title,
      url: `${SITE_CONFIG.url}/cheatsheets/${sheet.slug}`,
      description: sheet.shortDescription,
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Data Engineering Cheat Sheets',
    description: pageDescription,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="data engineering cheat sheet, snowflake sql cheat sheet, dbt cheat sheet, airflow cheat sheet, sql window functions, data engineering reference" />
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
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Breadcrumb */}
        <div className="bg-slate-800/80 border-b border-slate-700/50">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-blue-400 font-medium">Cheat Sheets</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-900/0 to-slate-900/50 py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
                <FileText className="w-4 h-4" />
                <span>{cheatsheets.length} Cheat Sheets</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Data Engineering Cheat Sheets
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Quick-reference guides for Snowflake, dbt, Airflow, SQL, and more.
                Bookmark them, use them daily, and never forget a command again.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto px-4 -mt-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cheat sheets (e.g., Snowflake, dbt, window functions...)"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedCategory
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {CHEATSHEET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cheat Sheets Grid */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {filteredSheets.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No cheat sheets found matching &ldquo;{searchQuery}&rdquo;</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                className="mt-4 text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {CHEATSHEET_CATEGORIES.filter((cat) => sheetsByCategory[cat.id]?.length > 0).map(
                (category) => (
                  <motion.section
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      {category.name}
                      <span className="text-sm font-normal text-gray-400">
                        ({sheetsByCategory[category.id]?.length || 0})
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sheetsByCategory[category.id]?.map((sheet) => (
                        <Link
                          key={sheet.slug}
                          to={`/cheatsheets/${sheet.slug}`}
                          className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                                {sheet.title}
                              </h3>
                              <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                {sheet.shortDescription}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[sheet.difficulty] || DIFFICULTY_COLORS.Intermediate}`}>
                                  {sheet.difficulty}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-gray-300 rounded">
                                  {sheet.sections.length} sections
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.section>
                )
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Want deeper tutorials?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Our cheat sheets give you the quick reference. Our articles give you the full picture with real-world examples and production patterns.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Articles
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
