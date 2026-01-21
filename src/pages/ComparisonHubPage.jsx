// src/pages/ComparisonHubPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Swords, ChevronRight, ArrowRight, Scale } from 'lucide-react';

// Data
import { getAllComparisons } from '@/data/comparisonData';

// SEO Factories
import { generateComparisonHubMeta, generateComparisonCanonical } from '@/lib/pseo/metadataFactory';
import { generateGlossaryHubSchema } from '@/lib/pseo/schemaFactory'; // Reusing collection schema for now, or could create specific one

export function ComparisonHubPage() {
    const comparisons = getAllComparisons();
    const meta = generateComparisonHubMeta();
    const canonical = generateComparisonCanonical();
    // Using glossary hub schema structure as a base for collection
    const schema = {
        ...generateGlossaryHubSchema(),
        name: 'Data Tool Comparisons',
        description: meta.description,
        url: canonical,
        '@id': canonical
    };

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify(schema)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
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
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-6 py-16">
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
                                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                        {comparison.toolA} <span className="text-gray-500 text-lg mx-1">vs</span> {comparison.toolB}
                                    </h3>

                                    <p className="text-gray-400 line-clamp-2 mb-4 group-hover:text-gray-300 transition-colors">
                                        {comparison.shortVerdict}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-slate-900/50 w-fit px-3 py-1 rounded-full border border-slate-700/50">
                                        <span>Winner:</span>
                                        <span className={`font-bold ${comparison.winner === 'It Depends' || comparison.winner === 'Tie'
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
