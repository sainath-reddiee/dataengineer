// src/pages/admin/CannibalizationPage.jsx
// Keyword Cannibalization Detector — finds keywords ranking on multiple pages
// and recommends consolidation strategies via AI.

import React, { useEffect, useState, useMemo } from 'react';
import {
    Loader2, AlertTriangle, RefreshCw, Sparkles, Copy, Check,
    Split, ChevronDown, ChevronRight, TrendingUp, FileText,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import gscService from '@/services/gscService';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';

function CannibalizationRow({ item, onRecommend }) {
    const [expanded, setExpanded] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRecommend = async () => {
        setLoading(true);
        try {
            const result = await onRecommend(item);
            setRecommendation(result);
            setExpanded(true);
        } catch (e) {
            setRecommendation(`Error: ${e?.message || 'Failed to generate recommendation'}`);
            setExpanded(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (recommendation) {
            navigator.clipboard.writeText(recommendation).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Split className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-white font-medium text-sm">"{item.keyword}"</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300">
                            {item.pages.length} PAGES
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                        {item.totalImpressions.toLocaleString()} total impressions being split
                    </div>
                    <div className="space-y-1.5">
                        {item.pages.map((page, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-300 truncate flex-1">{page.title}</span>
                                <span className="text-gray-500">pos {page.position.toFixed(1)}</span>
                                <span className="text-gray-500">{page.impressions} imp</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={recommendation ? () => setExpanded(!expanded) : handleRecommend}
                    disabled={loading}
                    className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white flex items-center gap-1.5"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     recommendation ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) :
                     <Sparkles className="w-3 h-3" />}
                    {loading ? 'Analyzing...' : recommendation ? (expanded ? 'Hide' : 'Show') : 'AI Recommend'}
                </button>
            </div>

            {expanded && recommendation && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">AI Recommendation:</span>
                        <button
                            onClick={handleCopy}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                        {recommendation}
                    </div>
                </div>
            )}
        </div>
    );
}

export function CannibalizationPage() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState('');
    const [cannibalized, setCannibalized] = useState([]);
    const [error, setError] = useState('');

    const slugFilter = searchParams.get('slug') || '';

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        setCannibalized([]);
        try {
            if (!gscService.isConnected()) {
                setError('Connect Google Search Console first (use the button in Rank Intelligence).');
                setLoading(false);
                return;
            }

            setProgress('Fetching articles...');
            const wpData = await wordpressApi.getAllPosts(1, 100);
            const posts = (wpData.posts || []).slice(0, 20);

            if (posts.length === 0) {
                setError('No articles found in WordPress.');
                setLoading(false);
                return;
            }

            // For each post, fetch its top keywords from GSC
            const keywordMap = {}; // keyword → [{ slug, title, position, impressions }]

            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                setProgress(`Analyzing post ${i + 1}/${posts.length}: ${post.title.substring(0, 40)}...`);

                try {
                    const keywords = await gscService.queryTopKeywords({
                        url: `https://dataengineerhub.blog/articles/${post.slug}`,
                        rowLimit: 30,
                    });

                    keywords.forEach(kw => {
                        const q = kw.query.toLowerCase();
                        if (!keywordMap[q]) keywordMap[q] = [];
                        keywordMap[q].push({
                            slug: post.slug,
                            title: post.title,
                            position: kw.position,
                            impressions: kw.impressions,
                        });
                    });
                } catch (e) {
                    // Skip individual post errors
                    console.warn(`Skipped GSC fetch for ${post.slug}:`, e.message);
                }
            }

            // Filter for keywords with 2+ different pages
            const results = Object.entries(keywordMap)
                .filter(([, pages]) => {
                    const uniqueSlugs = new Set(pages.map(p => p.slug));
                    return uniqueSlugs.size >= 2;
                })
                .map(([keyword, pages]) => {
                    // Deduplicate by slug (keep the one with highest impressions)
                    const bySlug = {};
                    pages.forEach(p => {
                        if (!bySlug[p.slug] || p.impressions > bySlug[p.slug].impressions) {
                            bySlug[p.slug] = p;
                        }
                    });
                    const uniquePages = Object.values(bySlug);
                    const totalImpressions = uniquePages.reduce((sum, p) => sum + p.impressions, 0);
                    return { keyword, pages: uniquePages, totalImpressions };
                })
                .sort((a, b) => b.totalImpressions - a.totalImpressions);

            setCannibalized(results);
        } catch (e) {
            setError(e.message || 'Failed to analyze cannibalization');
        }
        setLoading(false);
        setProgress('');
    }

    const visible = useMemo(() => {
        if (!slugFilter) return cannibalized;
        return cannibalized.filter(item =>
            item.pages.some(p => p.slug === slugFilter)
        );
    }, [cannibalized, slugFilter]);

    const stats = useMemo(() => ({
        totalKeywords: visible.length,
        totalImpressions: visible.reduce((sum, item) => sum + item.totalImpressions, 0),
    }), [visible]);

    const handleRecommend = async (item) => {
        if (!aiService.isEnabled) {
            return 'AI API key not configured. Set it in the admin sidebar to get recommendations.';
        }

        const pagesDesc = item.pages.map(p =>
            `- "${p.title}" (slug: ${p.slug}) — position ${p.position.toFixed(1)}, ${p.impressions} impressions`
        ).join('\n');

        const prompt = `You are an SEO expert specializing in keyword cannibalization resolution.

PROBLEM: The keyword "${item.keyword}" is ranking on ${item.pages.length} different pages, splitting ${item.totalImpressions} total impressions:

${pagesDesc}

ANALYZE AND RECOMMEND:
1. Which page should be the PRIMARY target for this keyword? (the one best positioned or most relevant)
2. What should happen to the other page(s)? Choose from:
   - MERGE: Combine content into the primary page (if topics overlap heavily)
   - 301 REDIRECT: Redirect the weaker page to the primary (if content is redundant)
   - DIFFERENTIATE: Adjust the secondary page to target a different keyword variant

Format your response as:
---
PRIMARY PAGE: [slug]
REASON: [1-2 sentences why this should be primary]

ACTION FOR EACH OTHER PAGE:
- [slug]: [MERGE/301/DIFFERENTIATE] — [brief explanation of what to do]

IMPLEMENTATION STEPS:
1. [specific first step]
2. [specific second step]
3. [specific third step]
---`;

        try {
            return await aiService.generateSuggestion(prompt, '');
        } catch (e) {
            return `Error: ${e.message}`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Split className="w-8 h-8 text-red-400" />
                        Keyword Cannibalization
                    </h1>
                    <p className="text-gray-400">
                        Detect keywords ranking on multiple pages — consolidate to stop splitting impressions.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {slugFilter && (
                <div className="px-3 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                    Filtering for article: <span className="font-mono font-bold">{slugFilter}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Stats */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                        <div className="text-xs uppercase tracking-wider text-red-300">Cannibalized Keywords</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.totalKeywords}</div>
                        <div className="text-xs text-gray-400 mt-1">ranking on 2+ pages</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                        <div className="text-xs uppercase tracking-wider text-amber-300">Impressions Split</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.totalImpressions.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 mt-1">total being diluted</div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-gray-400 text-sm">{progress || 'Loading...'}</span>
                </div>
            )}

            {/* Results */}
            {!loading && !error && visible.length > 0 && (
                <div className="space-y-3">
                    {visible.map((item, i) => (
                        <CannibalizationRow
                            key={`${item.keyword}-${i}`}
                            item={item}
                            onRecommend={handleRecommend}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && cannibalized.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Split className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-lg">No keyword cannibalization detected</p>
                    <p className="text-sm mt-1">Your pages appear to have distinct keyword targeting. Nice work!</p>
                </div>
            )}

            {!loading && !error && cannibalized.length > 0 && visible.length === 0 && slugFilter && (
                <div className="text-center py-12 text-gray-500">
                    <Split className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-lg">No cannibalization found for "{slugFilter}"</p>
                    <p className="text-sm mt-1">This article's keywords are not competing with other pages.</p>
                </div>
            )}

            {/* Info footer */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong>{' '}
                Fetches your top 20 articles and their GSC keywords, then cross-references to find
                keywords that appear on multiple pages. When the same keyword ranks on 2+ URLs, Google
                splits the ranking signal — consolidating fixes this "cannibalization" and can boost
                the surviving page significantly.
            </div>
        </div>
    );
}

export default CannibalizationPage;
