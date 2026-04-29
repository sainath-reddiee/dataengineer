// src/pages/ComparisonHubPage.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Swords, ChevronRight, ArrowRight, Scale, Search, X } from 'lucide-react';

// Data - Use searchIndex for all comparisons (includes pSEO additions)
import searchIndex from '@/data/searchIndex.json';

// SEO Factories
import { generateComparisonHubMeta, generateComparisonCanonical } from '@/lib/pseo/metadataFactory';
import { SITE_CONFIG } from '@/lib/seoConfig';

export function ComparisonHubPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Use searchIndex comparisons (has all 7 including pSEO additions)
    const allComparisons = searchIndex.comparisons.map(comp => ({
        id: comp.slug,
        slug: comp.slug,
        toolA: comp.toolA,
        toolB: comp.toolB,
        category: comp.category || 'Data Engineering',
        shortVerdict: comp.shortVerdict,
        winner: comp.winner || 'It Depends'
    }));

    // Extract unique categories for filter pills
    const categories = useMemo(() => {
        const cats = [...new Set(allComparisons.map(c => c.category))];
        return cats.sort();
    }, [allComparisons]);

    // Filter comparisons based on search and category
    const comparisons = useMemo(() => {
        let filtered = allComparisons;

        if (selectedCategory) {
            filtered = filtered.filter(c => c.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.toolA.toLowerCase().includes(query) ||
                c.toolB.toLowerCase().includes(query) ||
                (c.shortVerdict && c.shortVerdict.toLowerCase().includes(query)) ||
                c.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [allComparisons, searchQuery, selectedCategory]);

    const meta = generateComparisonHubMeta();
    const canonical = generateComparisonCanonical();

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
            { '@type': 'ListItem', position: 2, name: 'Comparisons', item: canonical },
        ],
    };

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />

                <meta property="og:type" content="website" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={canonical} />
                <meta property="og:image" content={SITE_CONFIG.ogImage.url} />
                <meta property="og:image:width" content={String(SITE_CONFIG.ogImage.width)} />
                <meta property="og:image:height" content={String(SITE_CONFIG.ogImage.height)} />
                <meta property="og:image:alt" content={meta.title} />
                <meta property="og:site_name" content={SITE_CONFIG.name} />
                <meta property="og:locale" content="en_US" />

                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                {/* Breadcrumb */}
                <div className="bg-slate-800/80 border-b border-slate-700/50">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <span className="text-blue-400 font-medium">Comparisons</span>
                        </nav>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="bg-slate-900/50 border-b border-white/10 pt-24 pb-16">
                    <div className="container mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 border border-purple-500/20"
                        >
                            <Scale className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight"
                        >
                            Tool <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Battleground</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            Unbiased, in-depth comparisons of the top data engineering tools.
                            We break down features, pricing, and use cases so you don't have to.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="text-sm text-gray-400 max-w-3xl mx-auto mt-6 leading-relaxed"
                        >
                            Each head-to-head covers architecture, pricing models, ecosystem maturity,
                            and the workloads each platform is built for — so you can pick the right
                            warehouse, lakehouse, or orchestrator for your team without wading through
                            vendor marketing. Pair these side-by-sides with our{' '}
                            <Link to="/cheatsheets" className="text-blue-300 hover:text-blue-200 underline decoration-dotted">
                                cheat sheets
                            </Link>{' '}
                            for syntax reference, our{' '}
                            <Link to="/glossary" className="text-blue-300 hover:text-blue-200 underline decoration-dotted">
                                glossary
                            </Link>{' '}
                            for concept lookups, or dive into deep dives in the{' '}
                            <Link to="/articles" className="text-blue-300 hover:text-blue-200 underline decoration-dotted">
                                articles library
                            </Link>.
                        </motion.div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="max-w-5xl mx-auto px-6 -mt-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search comparisons (e.g., Snowflake, dbt, Kafka...)"
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
                                All ({allComparisons.length})
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-6 py-16">
                    {comparisons.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No comparisons found matching "{searchQuery}"</p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                                className="mt-4 text-purple-400 hover:text-purple-300"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {comparisons.map((comparison, idx) => (
                            <motion.div
                                key={comparison.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                            >
                                <Link
                                    to={`/compare/${comparison.slug}`}
                                    className="block group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                                            <Swords className="w-4 h-4" />
                                            {comparison.category}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                        {comparison.toolA} <span className="text-gray-400 text-lg mx-1">vs</span> {comparison.toolB}
                                    </h3>

                                    <p className="text-gray-400 line-clamp-2 mb-4 group-hover:text-gray-300 transition-colors">
                                        {comparison.shortVerdict}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-slate-900/50 w-fit px-3 py-1 rounded-full border border-slate-700/50">
                                        <span>Winner:</span>
                                        <span className={`font-bold ${/^(It Depends|Depends|Tie)$/i.test(comparison.winner)
                                            ? 'text-yellow-400'
                                            : 'text-green-400'
                                            }`}>
                                            {comparison.winner}
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    )}

                    {/* Empty State / Coming Soon */}
                    <div className="max-w-3xl mx-auto mt-16 text-center border-t border-white/10 pt-12">
                        <p className="text-gray-400">
                            Looking for a specific comparison? <Link to="/contact" className="text-blue-400 hover:underline">Request it here</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ComparisonHubPage;
