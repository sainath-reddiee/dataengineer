// src/pages/GlossaryHubPage.jsx
/**
 * Glossary Hub Page
 * Lists all glossary terms organized by category
 * Acts as the "hub" in hub-and-spoke internal linking model
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Search,
    ChevronRight,
    Sparkles,
    Filter,
    X,
} from 'lucide-react';

// Data - Use searchIndex for efficient search
import searchIndex from '@/data/searchIndex.json';
import { GLOSSARY_CATEGORIES } from '@/data/glossaryData';

// PSEO utilities
import { generateGlossaryHubMeta, generateGlossaryCanonical } from '@/lib/pseo/metadataFactory';
import { generateGlossaryHubSchema, generateBreadcrumbSchema } from '@/lib/pseo/schemaFactory';
import { SITE_CONFIG } from '@/lib/seoConfig';


export function GlossaryHubPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Use lightweight searchIndex instead of full glossaryData
    const allTerms = searchIndex.glossary;

    // Filter terms based on search and category
    const filteredTerms = useMemo(() => {
        let terms = allTerms;

        if (selectedCategory) {
            terms = terms.filter((term) => term.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            terms = terms.filter(
                (term) =>
                    term.term.toLowerCase().includes(query) ||
                    term.shortDefinition.toLowerCase().includes(query)
            );
        }

        return terms;
    }, [allTerms, searchQuery, selectedCategory]);


    // Group terms by category for display
    const termsByCategory = useMemo(() => {
        if (selectedCategory) {
            return { [selectedCategory]: filteredTerms };
        }

        const grouped = {};
        filteredTerms.forEach((term) => {
            if (!grouped[term.category]) {
                grouped[term.category] = [];
            }
            grouped[term.category].push(term);
        });
        return grouped;
    }, [filteredTerms, selectedCategory]);

    // Generate SEO data
    const meta = generateGlossaryHubMeta();
    const canonical = generateGlossaryCanonical();
    const hubSchema = generateGlossaryHubSchema();
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: SITE_CONFIG.url },
        { name: 'Glossary', url: `${SITE_CONFIG.url}/glossary` },
    ]);

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={canonical} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />

                {/* Structured Data */}
                <script type="application/ld+json">{JSON.stringify(hubSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                {/* Breadcrumb */}
                <div className="bg-slate-900/50 border-b border-slate-800">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <span className="text-white font-medium">Glossary</span>
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-6">
                                <BookOpen className="w-4 h-4" />
                                <span>{allTerms.length}+ Terms</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Data Engineering Glossary
                            </h1>

                            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                                Master data engineering terminology with our comprehensive glossary.
                                From Snowflake to Kafka, learn the concepts that power modern data stacks.
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
                                placeholder="Search terms (e.g., Snowflake, dbt, ETL...)"
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
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
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!selectedCategory
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                                    }`}
                            >
                                All Categories
                            </button>
                            {GLOSSARY_CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() =>
                                        setSelectedCategory(selectedCategory === category.id ? null : category.id)
                                    }
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === category.id
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                                        }`}
                                >
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Terms by Category */}
                <div className="max-w-6xl mx-auto px-4 py-12">
                    {Object.keys(termsByCategory).length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No terms found matching "{searchQuery}"</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory(null);
                                }}
                                className="mt-4 text-purple-400 hover:text-purple-300"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {GLOSSARY_CATEGORIES.filter((cat) => termsByCategory[cat.id]?.length > 0).map(
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
                                            <span className="text-sm font-normal text-gray-500">
                                                ({termsByCategory[category.id]?.length || 0} terms)
                                            </span>
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {termsByCategory[category.id]?.map((term) => (
                                                <Link
                                                    key={term.slug}
                                                    to={`/glossary/${term.slug}`}
                                                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-5 transition-all duration-200"
                                                >
                                                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors flex items-center justify-between">
                                                        {term.term}
                                                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                                    </h3>
                                                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                                        {term.shortDefinition}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                                            {GLOSSARY_CATEGORIES.find(c => c.id === term.category)?.name || term.category}
                                                        </span>
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
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-8 text-center">
                        <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Want to learn more?
                        </h2>
                        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                            Explore our in-depth tutorials and articles on data engineering topics.
                        </p>
                        <Link
                            to="/articles"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors"
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

export default GlossaryHubPage;
