// src/pages/GlossaryPage.jsx
/**
 * Individual Glossary Term Page
 * Renders a single term with:
 * - Full definition content
 * - FAQ section with schema
 * - Related terms (internal linking)
 * - Related tools
 * - SEO optimized metadata
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Tag,
    ExternalLink,
    ArrowLeft,
    Calendar,
    Lightbulb,
    HelpCircle,
    Link2,
    Wrench,
} from 'lucide-react';

// Data
import { getGlossaryTerm, getCategoryById } from '@/lib/pseo/glossaryLoader';

// PSEO utilities
import {
    generateGlossaryMeta,
    generateGlossaryBreadcrumbs,
    generateGlossaryCanonical,
} from '@/lib/pseo/metadataFactory';
import { generateAllGlossarySchemas } from '@/lib/pseo/schemaFactory';
import { getRelatedGlossaryTerms } from '@/lib/pseo/linkingEngine';

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked with custom renderer
const renderer = new marked.Renderer();

// Custom Heading Renderer to match existing design
renderer.heading = ({ text, depth }) => {
    // marked v12+ passes an object with properties for the token
    // However, older versions or some configurations pass (text, level).
    // Let's handle both for robustness, though v17 likely uses the object or (text, level) depending on call.
    // Actually, in v5+, it's purely (text, level). 
    // BUT! In v12, they introduced a change where context is bound. 
    // Let's just use the arguments as they come.

    // In v17, the signature is heading({ tokens, depth }) if using the token directly, 
    // BUT the Renderer.prototype.heading still expects (text, level).
    // Let's try the standard (text, level) and if it fails (receiving object), we adapt.

    // Safely handle if the first arg is an object (new token-based renderer) or string (old style)
    const secureLevel = typeof text === 'object' ? text.depth : depth;
    const secureText = typeof text === 'object' ? text.text : text;

    if (secureLevel === 2) {
        return `
            <div class="mt-8">
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span class="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></span>
                    ${secureText}
                </h2>
            </div>
        `;
    }
    return `<h${secureLevel} class="text-white font-bold mb-4">${secureText}</h${secureLevel}>`;
};

const renderMarkdown = (content) => {
    if (!content) return null;

    // Use async parse? marked.parse is synchronous by default unless async: true is passed.
    const html = marked.parse(content, {
        renderer,
        gfm: true,
        breaks: true
    });

    const sanitizedHtml = DOMPurify.sanitize(html);

    return (
        <div
            className="prose prose-invert prose-lg max-w-none 
                prose-headings:text-white 
                prose-p:text-gray-300 prose-p:leading-relaxed 
                prose-li:text-gray-300 
                prose-strong:text-white prose-strong:font-semibold
                prose-code:text-green-400 prose-code:bg-slate-900/80 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl
                prose-table:border-collapse prose-table:w-full prose-table:my-4
                prose-th:bg-slate-800/50 prose-th:text-white prose-th:px-4 prose-th:py-3 prose-th:border prose-th:border-slate-700 prose-th:text-left
                prose-td:px-4 prose-td:py-3 prose-td:text-gray-300 prose-td:border prose-td:border-slate-700
                [&_h2]:mt-8 [&_h2]:mb-4"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};


export function GlossaryPage() {
    const { term: termSlug } = useParams();
    const navigate = useNavigate();
    const [term, setTerm] = useState(null);
    const [derivedData, setDerivedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getGlossaryTerm(termSlug);

                if (!data) {
                    navigate('/glossary', { replace: true });
                    return;
                }

                // Calculate derived data SAFELY inside try-catch
                const meta = generateGlossaryMeta(data);
                const breadcrumbs = generateGlossaryBreadcrumbs(data);
                const canonical = generateGlossaryCanonical(data.slug);
                const schemas = generateAllGlossarySchemas(data, breadcrumbs);
                const category = getCategoryById(data.category);
                const relatedTerms = getRelatedGlossaryTerms(data.slug, 5);

                setTerm(data);
                setDerivedData({
                    meta,
                    breadcrumbs,
                    canonical,
                    schemas,
                    category,
                    relatedTerms
                });

            } catch (err) {
                console.error("Failed to load glossary term:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (termSlug) loadData();
    }, [termSlug, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Page</h2>
                    <p className="text-gray-300">Something went wrong while loading the content.</p>
                    <p className="text-xs text-gray-500 mt-4 font-mono">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading || !term || !derivedData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const { meta, breadcrumbs, canonical, schemas, category, relatedTerms } = derivedData;

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={canonical} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />

                {/* Structured Data */}
                {schemas.map((schema, idx) => (
                    <script key={idx} type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                ))}
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                {/* Breadcrumb */}
                <div className="bg-slate-900/50 border-b border-slate-800">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <Link to="/glossary" className="text-gray-400 hover:text-white transition-colors">
                                Glossary
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            <span className="text-white font-medium">{term.term}</span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-5xl mx-auto px-4 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Back Link */}
                        <Link
                            to="/glossary"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Glossary
                        </Link>

                        {/* Header */}
                        <header className="mb-10">
                            {/* Category Badge */}
                            {category && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-4">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </div>
                            )}

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                What is {term.term}?
                            </h1>

                            <p className="text-xl text-gray-300 leading-relaxed">
                                {term.shortDefinition}
                            </p>

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Updated {term.lastUpdated}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>5 min read</span>
                                </div>
                            </div>
                        </header>

                        {/* Key Points */}
                        {term.keyPoints?.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 mb-10">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                                    Key Takeaways
                                </h2>
                                <ul className="space-y-3">
                                    {term.keyPoints.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">
                                                {idx + 1}
                                            </span>
                                            <span className="text-gray-300">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Full Definition */}
                        <article className="prose-container">
                            {renderMarkdown(term.fullDefinition)}
                        </article>

                        {/* FAQs */}
                        {term.faqs?.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <HelpCircle className="w-6 h-6 text-green-400" />
                                    Frequently Asked Questions
                                </h2>
                                <div className="space-y-4">
                                    {term.faqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                                        >
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {faq.question}
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Terms */}
                        {relatedTerms.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Link2 className="w-6 h-6 text-purple-400" />
                                    Related Terms
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {relatedTerms.map((relatedTerm) => (
                                        <Link
                                            key={relatedTerm.slug}
                                            to={`/glossary/${relatedTerm.slug}`}
                                            className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all"
                                        >
                                            <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                                                {relatedTerm.term}
                                            </h3>
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                {relatedTerm.shortDefinition}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Tools */}
                        {term.relatedTools?.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Wrench className="w-6 h-6 text-blue-400" />
                                    Related Tools
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {term.relatedTools.map((tool, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-sm"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* External Links */}
                        {term.externalLinks?.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <ExternalLink className="w-6 h-6 text-gray-400" />
                                    Learn More
                                </h2>
                                <div className="space-y-3">
                                    {term.externalLinks.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                                        >
                                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                                            <span className="group-hover:underline">{link.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Keywords */}
                        {term.keywords?.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-slate-700">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag className="w-4 h-4 text-gray-500" />
                                    {term.keywords.map((keyword, idx) => (
                                        <span key={idx} className="text-sm text-gray-500">
                                            {keyword}
                                            {idx < term.keywords.length - 1 && ','}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </main>
            </div>
        </>
    );
}

export default GlossaryPage;
