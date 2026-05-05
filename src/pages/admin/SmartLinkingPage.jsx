// src/pages/admin/SmartLinkingPage.jsx
// AI-powered internal linking suggestions. Uses Gemini to recommend
// which articles to link TO and FROM, with exact anchor text.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertTriangle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import geminiService from '@/services/geminiService';

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

function isApplied(articleSlug, linkKey) {
    const data = getApplied();
    return !!(data[articleSlug] && data[articleSlug][linkKey]);
}

export function SmartLinkingPage() {
    const [articles, setArticles] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [geminiEnabled, setGeminiEnabled] = useState(geminiService.isEnabled);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                setArticles((data.posts || []).map(p => ({
                    slug: p.slug,
                    title: p.title,
                    excerpt: p.excerpt,
                })));
            } catch { /* ignore */ }
            setLoadingArticles(false);
        }
        load();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setGeminiEnabled(geminiService.isEnabled);
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

            // Build compact catalog of other articles (title + slug only — token budget)
            const otherArticles = articles
                .filter(a => a.slug !== selectedSlug)
                .map(a => `- ${a.title} (slug: ${a.slug})`)
                .join('\n');

            const prompt = `You are an SEO expert helping with internal linking for a data engineering blog.

TARGET ARTICLE:
Title: ${selected.title}
Excerpt: ${selected.excerpt || '(no excerpt)'}

CATALOG OF OTHER ARTICLES ON THIS BLOG:
${otherArticles}

Respond in EXACTLY this JSON format (no markdown fences, just raw JSON):
{
  "linkFrom": [
    {"slug": "target-slug", "title": "Target title", "anchorText": "suggested anchor", "reason": "why this link makes sense"}
  ],
  "linkTo": [
    {"slug": "source-slug", "title": "Source title", "anchorText": "suggested anchor", "reason": "why this link makes sense"}
  ]
}

- linkFrom = 3-5 articles the TARGET should link TO (add outbound links in the target article)
- linkTo = 3-5 articles that should link TO the TARGET (add links in those OTHER articles pointing to target)
- Anchor text should be natural, keyword-rich, 2-6 words
- Only suggest if topically related. Quality over quantity.
- Respond ONLY with the JSON object. No prose.`;

            const response = await geminiService.generateSuggestion(prompt, '');

            // Parse JSON from response (strip any markdown fences Gemini adds despite instructions)
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            const parsed = JSON.parse(cleaned);

            setResult(parsed);
        } catch (err) {
            setError(err.message || 'Analysis failed. Gemini may have returned invalid JSON — try again.');
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
                        <strong>Gemini API key required.</strong> Enter it in the left sidebar.
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
                                            onToggleApplied={() => markApplied(selectedSlug, `from-${link.slug}`)}
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
                                            onToggleApplied={() => markApplied(selectedSlug, `to-${link.slug}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-xs text-gray-400">
                        <strong className="text-gray-300">How to apply:</strong> Copy the anchor text, find the relevant paragraph in WordPress, and wrap the phrase in a link. Mark as applied when done to track progress.
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function LinkSuggestion({ link, direction, targetSlug, applied, onToggleApplied }) {
    const [localApplied, setLocalApplied] = useState(applied);
    const articleUrl = direction === 'from'
        ? `https://dataengineerhub.blog/articles/${link.slug}`
        : `https://dataengineerhub.blog/articles/${link.slug}`;

    const linkHtml = direction === 'from'
        ? `<a href="/articles/${link.slug}">${link.anchorText}</a>`
        : `<a href="/articles/${targetSlug}">${link.anchorText}</a>`;

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
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">HTML to paste:</div>
                        <code className="text-blue-300 break-all">{linkHtml}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">{link.reason}</div>
                </div>
                <button
                    onClick={() => { setLocalApplied(!localApplied); if (!localApplied) onToggleApplied(); }}
                    className={`p-1.5 rounded shrink-0 ${
                        localApplied
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600 text-gray-400'
                    }`}
                    title={localApplied ? 'Marked as applied' : 'Mark as applied'}
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default SmartLinkingPage;
