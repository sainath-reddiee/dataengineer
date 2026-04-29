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
    ChevronDown,
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
import { getGlossaryTerm, getCategoryById, getAllGlossaryTerms } from '@/lib/pseo/glossaryLoader';

// PSEO utilities
import {
    generateGlossaryMeta,
    generateGlossaryBreadcrumbs,
    generateGlossaryCanonical,
} from '@/lib/pseo/metadataFactory';

import { getRelatedGlossaryTerms } from '@/lib/pseo/linkingEngine';
import { SITE_CONFIG } from '@/lib/seoConfig';

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
    // IMPORTANT: must be declared before any early return so hook order is stable across renders (React error #310).
    const [openFaqs, setOpenFaqs] = useState({});
    const toggleFaq = (idx) => setOpenFaqs(prev => ({ ...prev, [idx]: !prev[idx] }));

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);

                // Phase A — blocking: load the term + synchronous metadata.
                // Paint the article as soon as this resolves.
                const data = await getGlossaryTerm(termSlug);

                if (cancelled) return;

                if (!data) {
                    navigate('/glossary', { replace: true });
                    return;
                }

                const meta = generateGlossaryMeta(data);
                const breadcrumbs = generateGlossaryBreadcrumbs(data);
                const canonical = generateGlossaryCanonical(data.slug);
                const category = getCategoryById(data.category);

                setTerm(data);
                setDerivedData({ meta, breadcrumbs, canonical, category, relatedTerms: null });
                setLoading(false);

                // Phase B — non-blocking: fetch corpus + compute related terms.
                // Memoized + parallel after the first visit, so subsequent pages
                // get this instantly.
                const allTerms = await getAllGlossaryTerms();
                if (cancelled) return;
                const relatedTerms = getRelatedGlossaryTerms(data.slug, 5, { terms: allTerms });
                if (cancelled) return;
                setDerivedData(prev => prev ? { ...prev, relatedTerms } : prev);

            } catch (err) {
                if (cancelled) return;
                console.error("Failed to load glossary term:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (termSlug) loadData();

        return () => { cancelled = true; };
    }, [termSlug, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <Helmet>
                    <meta name="robots" content="noindex, follow" />
                </Helmet>
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Page</h2>
                    <p className="text-gray-300">Something went wrong while loading the content.</p>
                    <p className="text-xs text-gray-400 mt-4 font-mono">{error}</p>
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

    const { meta, breadcrumbs, canonical, category, relatedTerms } = derivedData;

    // Calculate word count for read time and thin content detection
    const wordCount = term.fullDefinition ? term.fullDefinition.split(/\s+/).length : 0;
    const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
    const isThinContent = wordCount < 250;

    // Build BreadcrumbList + FAQPage JSON-LD (previously missing — now emits rich snippets)
    const breadcrumbSchema = Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            item: b.url,
        })),
    } : null;

    const faqSchema = Array.isArray(term.faqs) && term.faqs.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: term.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    } : null;

    // DefinedTerm schema — direct signal for glossary rich results
    const definedTermSchema = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: term.term,
        description: term.shortDefinition,
        url: canonical,
        inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: 'Data Engineering Glossary',
            url: `${SITE_CONFIG.url}/glossary`,
        },
    };

    const ogImage = SITE_CONFIG.ogImage.url;

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
                <link rel="canonical" href={canonical} />
                {isThinContent && <meta name="robots" content="noindex, follow" />}

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={canonical} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content={String(SITE_CONFIG.ogImage.width)} />
                <meta property="og:image:height" content={String(SITE_CONFIG.ogImage.height)} />
                <meta property="og:image:alt" content={`What is ${term.term}?`} />
                <meta property="og:site_name" content={SITE_CONFIG.name} />
                <meta property="og:locale" content="en_US" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content={ogImage} />
                <meta name="twitter:image:alt" content={`What is ${term.term}?`} />
                <meta name="twitter:site" content={SITE_CONFIG.social.twitter} />
                <meta name="twitter:creator" content={SITE_CONFIG.social.twitter} />

                {/* Structured data */}
                {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
                {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
                <script type="application/ld+json">{JSON.stringify(definedTermSchema)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                {/* Breadcrumb */}
                <div className="bg-slate-800/80 border-b border-slate-700/50">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                                Home
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <Link to="/glossary" className="text-gray-300 hover:text-white transition-colors">
                                Glossary
                            </Link>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <span className="text-blue-400 font-medium">{term.term}</span>
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
                            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Updated {term.lastUpdated}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{readTimeMin} min read</span>
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

                        {/* Practitioner Intro — field-story framing */}
                        {term.practitionerIntro && (
                            <div className="mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-400" />
                                    From the field
                                </h2>
                                <article className="prose-container">
                                    {renderMarkdown(term.practitionerIntro)}
                                </article>
                            </div>
                        )}

                        {/* Full Definition */}
                        <article className="prose-container">
                            {renderMarkdown(term.fullDefinition)}
                        </article>

                        {/* Gotchas / Practical Notes */}
                        {term.gotchas && (
                            <div className="mt-8 bg-amber-900/10 border border-amber-500/30 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-amber-400 text-2xl">⚠</span>
                                    Gotchas &amp; what I'd actually do
                                </h2>
                                <article className="prose-container">
                                    {renderMarkdown(term.gotchas)}
                                </article>
                            </div>
                        )}

                        {/* FAQs — Collapsible Accordion */}
                        {term.faqs?.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <HelpCircle className="w-6 h-6 text-green-400" />
                                    Frequently Asked Questions
                                </h2>
                                <div className="space-y-3">
                                    {term.faqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/80 transition-colors"
                                            >
                                                <h3 className="text-lg font-semibold text-white pr-4">
                                                    {faq.question}
                                                </h3>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaqs[idx] ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openFaqs[idx] && (
                                                <div className="px-5 pb-5 -mt-1">
                                                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Terms */}
                        {relatedTerms && relatedTerms.length > 0 && (
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
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
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
                                    <Tag className="w-4 h-4 text-gray-400" />
                                    {term.keywords.map((keyword, idx) => (
                                        <span key={idx} className="text-sm text-gray-400">
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
