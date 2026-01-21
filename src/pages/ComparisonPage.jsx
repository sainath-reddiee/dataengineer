// src/pages/ComparisonPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Swords,
    Trophy,
    Scale,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    ChevronRight
} from 'lucide-react';

// Data
import { getComparisonBySlug, getAllComparisons } from '@/data/comparisonData';

// SEO Factories
import { generateComparisonMeta, generateComparisonCanonical } from '@/lib/pseo/metadataFactory';
import { generateComparisonSchema } from '@/lib/pseo/schemaFactory';

// Linking Engine
import { getRelatedComparisons, getGlossaryTermsForTool } from '@/lib/pseo/linkingEngine';

const renderMarkdown = (content) => {
    if (!content) return null;
    const html = marked.parse(content, { breaks: true, gfm: true });
    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
};

export function ComparisonPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const comparison = getComparisonBySlug(slug);

    useEffect(() => {
        if (!comparison && slug) {
            navigate('/glossary', { replace: true }); // Fallback to glossary for now
        }
    }, [comparison, slug, navigate]);

    if (!comparison) return null;

    // SEO Data
    const meta = generateComparisonMeta(comparison);
    const canonical = generateComparisonCanonical(slug);
    const schema = generateComparisonSchema(comparison);

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:type" content="article" />
                <script type="application/ld+json">{JSON.stringify(schema)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                {/* Breadcrumb */}
                <div className="bg-slate-900/50 border-b border-slate-800">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <Link to="/glossary" className="text-gray-400 hover:text-white transition-colors">Comparisons</Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <span className="text-white font-medium">{comparison.toolA} vs {comparison.toolB}</span>
                        </nav>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12">
                    <Link to="/glossary" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Hub
                    </Link>

                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20">
                            <Swords className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                            {comparison.toolA} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">vs</span> {comparison.toolB}
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            {comparison.shortVerdict}
                        </p>
                    </div>

                    {/* The Verdict Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-3xl p-8 mb-16 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            The Verdict: {comparison.winner === 'Tie' || comparison.winner === 'It Depends' ? comparison.winner : `${comparison.winner} Wins`}
                        </h2>
                        <div className="prose prose-invert prose-lg max-w-none prose-p:text-gray-200">
                            {renderMarkdown(comparison.finalVerdict)}
                        </div>
                    </motion.div>

                    {/* Comparisons Grid */}
                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Tool A Column */}
                        <div>
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-full">
                                <h3 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4 text-center">
                                    {comparison.toolA}
                                </h3>

                                <div className="mb-8">
                                    <h4 className="flex items-center gap-2 text-green-400 font-semibold mb-4">
                                        <ThumbsUp className="w-5 h-5" /> Pros
                                    </h4>
                                    <ul className="space-y-3">
                                        {comparison.pros.toolA.map((pro, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                                <CheckCircle className="w-5 h-5 text-green-500/50 flex-shrink-0" />
                                                {pro}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-2 text-red-400 font-semibold mb-4">
                                        <ThumbsDown className="w-5 h-5" /> Cons
                                    </h4>
                                    <ul className="space-y-3">
                                        {comparison.cons.toolA.map((con, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                                <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" />
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Tool B Column */}
                        <div>
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-full">
                                <h3 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4 text-center">
                                    {comparison.toolB}
                                </h3>

                                <div className="mb-8">
                                    <h4 className="flex items-center gap-2 text-green-400 font-semibold mb-4">
                                        <ThumbsUp className="w-5 h-5" /> Pros
                                    </h4>
                                    <ul className="space-y-3">
                                        {comparison.pros.toolB.map((pro, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                                <CheckCircle className="w-5 h-5 text-green-500/50 flex-shrink-0" />
                                                {pro}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-2 text-red-400 font-semibold mb-4">
                                        <ThumbsDown className="w-5 h-5" /> Cons
                                    </h4>
                                    <ul className="space-y-3">
                                        {comparison.cons.toolB.map((con, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                                <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" />
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Matrix */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                            <Scale className="w-8 h-8 text-purple-400" />
                            Feature Comparison
                        </h2>
                        <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-800/50">
                                        <th className="px-6 py-4 text-left text-gray-400 font-medium">Feature</th>
                                        <th className="px-6 py-4 text-left text-white font-bold w-1/3">{comparison.toolA}</th>
                                        <th className="px-6 py-4 text-left text-white font-bold w-1/3">{comparison.toolB}</th>
                                        <th className="px-6 py-4 text-left text-purple-400 font-bold">Winner</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {comparison.features.map((feature, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-6 text-gray-300 font-medium">{feature.name}</td>
                                            <td className="px-6 py-6 text-gray-400">{feature.toolAValue}</td>
                                            <td className="px-6 py-6 text-gray-400">{feature.toolBValue}</td>
                                            <td className="px-6 py-6">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${feature.winner === comparison.toolA
                                                    ? 'bg-blue-500/20 text-blue-300'
                                                    : feature.winner === comparison.toolB
                                                        ? 'bg-purple-500/20 text-purple-300'
                                                        : 'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {feature.winner}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Analysis / Intro */}
                    <article className="prose prose-invert prose-lg max-w-none mb-16">
                        <h3>Detailed Analysis</h3>
                        {renderMarkdown(comparison.intro)}
                    </article>

                    {/* Related Comparisons - Internal Linking */}
                    {(() => {
                        const related = getRelatedComparisons(slug, 3);
                        if (related.length === 0) return null;
                        return (
                            <div className="mb-16">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Swords className="w-6 h-6 text-purple-400" />
                                    Related Comparisons
                                </h2>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {related.map((comp) => (
                                        <Link
                                            key={comp.slug}
                                            to={`/compare/${comp.slug}`}
                                            className="bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all hover:scale-105"
                                        >
                                            <span className="text-purple-400 text-xs font-medium">{comp.category}</span>
                                            <h3 className="text-white font-semibold mt-1">
                                                {comp.toolA} vs {comp.toolB}
                                            </h3>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Related Glossary Terms - Cross Linking */}
                    {(() => {
                        const toolATerms = getGlossaryTermsForTool(comparison.toolA, 2);
                        const toolBTerms = getGlossaryTermsForTool(comparison.toolB, 2);
                        const allTerms = [...toolATerms, ...toolBTerms].filter((t, i, arr) => arr.findIndex(x => x.slug === t.slug) === i);
                        if (allTerms.length === 0) return null;
                        return (
                            <div className="mb-16">
                                <h2 className="text-2xl font-bold text-white mb-6">📚 Learn More in the Glossary</h2>
                                <div className="flex flex-wrap gap-3">
                                    {allTerms.map((t) => (
                                        <Link
                                            key={t.slug}
                                            to={`/glossary/${t.slug}`}
                                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-sm hover:bg-blue-500/20 transition-colors"
                                        >
                                            {t.term}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Disclaimer */}
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-500/80">
                            <strong>Note:</strong> Comparison data is based on features available as of {comparison.lastUpdated}.
                            Both tools evolve rapidly. We recommend trying both for your specific use case.
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}

export default ComparisonPage;
