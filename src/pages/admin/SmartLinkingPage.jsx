// src/pages/admin/SmartLinkingPage.jsx
// AI-powered internal linking suggestions. Uses Gemini to recommend
// which articles to link TO and FROM, with exact anchor text.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertTriangle, ArrowRight, ArrowLeft, Check, ExternalLink, Globe } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';

const APPLIED_STORAGE_KEY = 'smart_linking_applied_v1';

function getApplied() {
    if (typeof localStorage === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY) || '{}'); }
    catch { return {}; }
}

function saveApplied(data) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function markApplied(articleSlug, linkKey) {
    const data = getApplied();
    data[articleSlug] = data[articleSlug] || {};
    data[articleSlug][linkKey] = true;
    saveApplied(data);
}

function unmarkApplied(articleSlug, linkKey) {
    const data = getApplied();
    if (data[articleSlug]) {
        delete data[articleSlug][linkKey];
        // Clean up empty slug entries
        if (Object.keys(data[articleSlug]).length === 0) {
            delete data[articleSlug];
        }
        saveApplied(data);
    }
}

function isApplied(articleSlug, linkKey) {
    const data = getApplied();
    return !!(data[articleSlug] && data[articleSlug][linkKey]);
}

export function SmartLinkingPage() {
    const [searchParams] = useSearchParams();
    const [articles, setArticles] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [geminiEnabled, setGeminiEnabled] = useState(aiService.isEnabled);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                const posts = (data.posts || []).map(p => ({
                    slug: p.slug,
                    title: p.title,
                    excerpt: p.excerpt,
                    content: p.content || '',
                }));
                setArticles(posts);

                // Auto-select article from URL params (when navigated from another tool)
                const paramSlug = searchParams.get('slug');
                if (paramSlug && posts.some(p => p.slug === paramSlug)) {
                    setSelectedSlug(paramSlug);
                }
            } catch { /* ignore */ }
            setLoadingArticles(false);
        }
        load();
    }, [searchParams]);

    useEffect(() => {
        const interval = setInterval(() => {
            setGeminiEnabled(aiService.isEnabled);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyze = async () => {
        if (!selectedSlug) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const selected = articles.find(a => a.slug === selectedSlug);
            if (!selected) throw new Error('Article not found');

            // Strip HTML tags helper
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            // Get full content of selected article (up to 6000 chars for better context)
            const articleContent = stripHtml(selected.content || '').substring(0, 6000);

            // Build a richer catalog with excerpts so AI can understand what each article covers
            const otherArticles = articles
                .filter(a => a.slug !== selectedSlug)
                .map(a => {
                    const excerpt = stripHtml(a.excerpt || a.content || '').substring(0, 150);
                    return `- "${a.title}" [/articles/${a.slug}] — ${excerpt}`;
                })
                .join('\n');

            const prompt = `You are a senior SEO strategist specializing in internal linking for topical authority. You need to provide HIGHLY SPECIFIC link recommendations based on actual content overlap and user journey logic.

TARGET ARTICLE TO OPTIMIZE:
Title: "${selected.title}"
URL: /articles/${selected.slug}
Full content (first ~6000 chars):
---
${articleContent || '(content not available)'}
---

ALL OTHER ARTICLES ON THIS BLOG (title + URL + short summary):
${otherArticles}

YOUR TASK: Recommend internal links AND external authority links.

INTERNAL LINKING RULES:
1. Only suggest links where there is GENUINE topical overlap — the linked article must ADD VALUE to the reader
2. Anchor text must be NATURAL phrases that already exist (or could naturally fit) in the target article's content
3. For "linkFrom" — find specific sentences/paragraphs in the target article where another article would be a perfect "learn more" or "deep dive" follow-up
4. For "linkTo" — identify articles on the blog that discuss related topics and would benefit from linking to this target
5. Placement must be SPECIFIC — reference an actual sentence, paragraph topic, or section from the content above (not vague like "in the introduction")
6. Each link should serve a clear reader journey purpose: prerequisite knowledge, deeper dive, related technique, or alternative approach

EXTERNAL LINKING RULES:
1. Suggest 3-5 authoritative external resources that would add credibility and value
2. Only recommend well-known, stable URLs: official documentation (Snowflake docs, AWS docs, dbt docs), research papers, official blog posts from major companies, or widely-cited industry references
3. External links should support specific claims or concepts mentioned in the article
4. Prefer official documentation URLs that are unlikely to change

Respond in EXACTLY this JSON format (no markdown fences, just raw JSON):
{
  "linkFrom": [
    {"slug": "article-slug", "title": "Article Title", "anchorText": "natural 2-6 word phrase from the target article", "placement": "In the paragraph where you discuss [specific topic from content]. After the sentence about [quote or paraphrase specific line].", "reason": "This article explains [concept] in detail, which the reader needs to understand [related concept mentioned in target]"}
  ],
  "linkTo": [
    {"slug": "source-article-slug", "title": "Source Article Title", "anchorText": "suggested anchor text for the link pointing to target", "placement": "In that article's section about [topic], where it mentions [concept] — add link to target as a practical example/deep dive", "reason": "Readers of that article would benefit from this target because [specific connection]"}
  ],
  "externalLinks": [
    {"url": "https://docs.example.com/page", "title": "Resource Title", "anchorText": "natural anchor text", "placement": "After the paragraph discussing [specific topic] where you mention [concept]", "reason": "Official documentation that supports the claim about [specific point made in article]", "authority": "Official Snowflake/AWS/dbt documentation"}
  ]
}

QUALITY CHECKS:
- linkFrom: 4-6 high-quality internal outbound links
- linkTo: 3-5 inbound link opportunities from other articles
- externalLinks: 3-5 authoritative external resources
- Every suggestion must reference SPECIFIC content from the article above
- Anchor text must sound natural in a sentence, not like a keyword stuff
- Reject any link that's only tangentially related`;

            const response = await aiService.generateSuggestion(prompt, '');

            // Robust JSON extraction
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                throw new Error('AI returned no valid JSON. Try again or rephrase.');
            }
            const jsonText = response.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonText);

            setResult(parsed);
        } catch (err) {
            setError(err.message || 'Analysis failed. AI may have returned invalid JSON — try again.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-pink-400" />
                    Smart Internal Linking
                </h1>
                <p className="text-gray-400">AI-powered link recommendations with exact anchor text and context.</p>
            </div>

            {!geminiEnabled && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-300 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>AI API key required.</strong> Select a provider and enter the key in the sidebar.
                    </div>
                </div>
            )}

            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Target Article</label>
                <select
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                >
                    <option value="">
                        {loadingArticles ? 'Loading articles...' : 'Select an article to analyze'}
                    </option>
                    {articles.map(a => (
                        <option key={a.slug} value={a.slug}>{a.title}</option>
                    ))}
                </select>
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedSlug || loading || !geminiEnabled}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Get AI Link Suggestions'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Link FROM target */}
                    {result.linkFrom?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                                <ArrowRight className="w-4 h-4" />
                                Add these outbound links (in your target article)
                            </h3>
                            <div className="space-y-2">
                                {result.linkFrom.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `from-${link.slug}`);
                                    return (
                                        <LinkSuggestion
                                            key={i}
                                            link={link}
                                            direction="from"
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `from-${link.slug}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `from-${link.slug}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Link TO target */}
                    {result.linkTo?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                                <ArrowLeft className="w-4 h-4" />
                                Add these inbound links (edit those other articles)
                            </h3>
                            <div className="space-y-2">
                                {result.linkTo.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `to-${link.slug}`);
                                    return (
                                        <LinkSuggestion
                                            key={i}
                                            link={link}
                                            direction="to"
                                            targetSlug={selectedSlug}
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `to-${link.slug}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `to-${link.slug}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    {result.externalLinks?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4" />
                                External authority links to add (boost E-E-A-T)
                            </h3>
                            <div className="space-y-2">
                                {result.externalLinks.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `ext-${link.url}`);
                                    return (
                                        <ExternalLinkSuggestion
                                            key={i}
                                            link={link}
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `ext-${link.url}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `ext-${link.url}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-xs text-gray-400">
                        <strong className="text-gray-300">How to apply:</strong> Use the "Where to add" hint to locate the right paragraph in WordPress, wrap the anchor text phrase in the HTML link, and mark as applied.
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function LinkSuggestion({ link, direction, targetSlug, applied, onMarkApplied, onUnmarkApplied }) {
    const [localApplied, setLocalApplied] = useState(applied);
    const linkHtml = direction === 'from'
        ? `<a href="/articles/${link.slug}">${link.anchorText}</a>`
        : `<a href="/articles/${targetSlug}">${link.anchorText}</a>`;

    const handleToggle = () => {
        if (localApplied) {
            onUnmarkApplied?.();
        } else {
            onMarkApplied?.();
        }
        setLocalApplied(!localApplied);
    };

    return (
        <div className={`p-3 rounded-lg border transition ${
            localApplied
                ? 'bg-emerald-900/10 border-emerald-800/30 opacity-60'
                : 'bg-slate-900/50 border-slate-700'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{link.title}</div>
                    <div className="text-xs text-blue-300 mt-0.5">→ /articles/{link.slug}</div>
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">Anchor text:</div>
                        <div className="text-emerald-300 font-mono">"{link.anchorText}"</div>
                    </div>
                    {link.placement && (
                        <div className="mt-2 p-2 bg-indigo-900/30 border border-indigo-700/30 rounded text-xs">
                            <div className="text-indigo-400 uppercase text-[10px] mb-1">Where to add:</div>
                            <div className="text-indigo-200">{link.placement}</div>
                        </div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">HTML to paste:</div>
                        <code className="text-blue-300 break-all">{linkHtml}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">{link.reason}</div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`p-1.5 rounded shrink-0 ${
                        localApplied
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600 text-gray-400'
                    }`}
                    title={localApplied ? 'Click to unmark' : 'Mark as applied'}
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ExternalLinkSuggestion({ link, applied, onMarkApplied, onUnmarkApplied }) {
    const [localApplied, setLocalApplied] = useState(applied);
    const linkHtml = `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.anchorText}</a>`;

    const handleToggle = () => {
        if (localApplied) {
            onUnmarkApplied?.();
        } else {
            onMarkApplied?.();
        }
        setLocalApplied(!localApplied);
    };

    return (
        <div className={`p-3 rounded-lg border transition ${
            localApplied
                ? 'bg-emerald-900/10 border-emerald-800/30 opacity-60'
                : 'bg-slate-900/50 border-slate-700'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        {link.title}
                    </div>
                    <div className="text-xs text-purple-300 mt-0.5 truncate">→ {link.url}</div>
                    {link.authority && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{link.authority}</div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">Anchor text:</div>
                        <div className="text-emerald-300 font-mono">"{link.anchorText}"</div>
                    </div>
                    {link.placement && (
                        <div className="mt-2 p-2 bg-indigo-900/30 border border-indigo-700/30 rounded text-xs">
                            <div className="text-indigo-400 uppercase text-[10px] mb-1">Where to add:</div>
                            <div className="text-indigo-200">{link.placement}</div>
                        </div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">HTML to paste:</div>
                        <code className="text-blue-300 break-all">{linkHtml}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">{link.reason}</div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`p-1.5 rounded shrink-0 ${
                        localApplied
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600 text-gray-400'
                    }`}
                    title={localApplied ? 'Click to unmark' : 'Mark as applied'}
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default SmartLinkingPage;
