// src/pages/admin/KeywordInjectorPage.jsx
// Surfaces rising keywords from GSC and suggests content patches to inject them
// into existing articles for increased relevance and rankings.

import React, { useEffect, useState, useMemo } from 'react';
import {
    TrendingUp, Loader2, AlertTriangle, RefreshCw, Sparkles, ArrowUpRight,
    FileText, Zap, ChevronDown, ChevronRight, Copy, Check,
} from 'lucide-react';
import gscService from '@/services/gscService';
import keywordTrendService from '@/services/keywordTrendService';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';

function TrendBadge({ trend }) {
    if (trend === 'new') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">NEW</span>;
    if (trend === 'rising') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">RISING</span>;
    return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">STABLE</span>;
}

function OpportunityCard({ opp, onGeneratePatch }) {
    const [expanded, setExpanded] = useState(false);
    const [patch, setPatch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await onGeneratePatch(opp);
            setPatch(result);
            setExpanded(true);
        } catch (e) {
            setPatch(`Error: ${e?.message || 'Failed to generate patch'}`);
            setExpanded(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (patch) {
            navigator.clipboard.writeText(patch).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const growthLabel = opp.keyword.isNew
        ? 'NEW keyword'
        : `+${Math.round(opp.keyword.growthRate * 100)}% growth`;

    const actionColors = {
        inject: 'border-red-500/30 bg-red-500/5',
        promote: 'border-amber-500/30 bg-amber-500/5',
        boost: 'border-emerald-500/30 bg-emerald-500/5',
    };

    const actionLabels = {
        inject: 'Missing â€” inject into content',
        promote: 'In content but not title â€” promote',
        boost: 'Present â€” reinforce prominence',
    };

    return (
        <div className={`rounded-xl border p-4 ${actionColors[opp.action] || 'border-slate-700'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm truncate">"{opp.keyword.query}"</span>
                        <TrendBadge trend={opp.keyword.isNew ? 'new' : 'rising'} />
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                        {opp.keyword.recentImpressions} impressions/week Â· pos {opp.keyword.position} Â· {growthLabel}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <FileText className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-300 truncate">{opp.article.title}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                        Action: <span className="text-gray-300">{actionLabels[opp.action]}</span>
                    </div>
                </div>
                <button
                    onClick={patch ? () => setExpanded(!expanded) : handleGenerate}
                    disabled={loading}
                    className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white flex items-center gap-1.5"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     patch ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) :
                     <Sparkles className="w-3 h-3" />}
                    {loading ? 'Generating...' : patch ? (expanded ? 'Hide' : 'Show') : 'Generate Patch'}
                </button>
            </div>

            {expanded && patch && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Suggested content patch:</span>
                        <button
                            onClick={handleCopy}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                        {patch}
                    </div>
                </div>
            )}
        </div>
    );
}

export function KeywordInjectorPage() {
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState([]);
    const [risingKeywords, setRisingKeywords] = useState([]);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all | inject | promote | boost

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            if (!gscService.isConnected()) {
                setError('Connect Google Search Console first (use the button in Rank Intelligence).');
                setLoading(false);
                return;
            }

            // Fetch rising keywords and articles in parallel
            const [rising, wpData] = await Promise.all([
                keywordTrendService.detectRisingKeywords({
                    recentDays: 7,
                    baselineDays: 28,
                    minImpressions: 15,
                    minGrowthRate: 0.25,
                }),
                wordpressApi.getAllPosts(1, 100),
            ]);

            const articles = (wpData.posts || []).map(p => ({
                slug: p.slug,
                title: p.title,
                content: p.content || '',
                excerpt: p.excerpt || '',
            }));

            setRisingKeywords(rising);

            // Match rising keywords to articles
            const matched = keywordTrendService.matchKeywordsToArticles(rising, articles);
            setOpportunities(matched.slice(0, 50)); // Cap at 50 for UI performance
        } catch (e) {
            setError(e.message || 'Failed to load trend data');
        }
        setLoading(false);
    }

    const visible = useMemo(() => {
        if (filter === 'all') return opportunities;
        return opportunities.filter(o => o.action === filter);
    }, [opportunities, filter]);

    const generatePatch = async (opp) => {
        if (!aiService.isEnabled) {
            return 'AI API key not configured. Set it in the admin sidebar to generate content patches.';
        }

        const prompt = `You are an SEO content specialist. A keyword is trending/rising in search volume and is relevant to an existing article, but needs to be better integrated.

ARTICLE:
Title: ${opp.article.title}
Slug: ${opp.article.slug}

RISING KEYWORD: "${opp.keyword.query}"
- ${opp.keyword.recentImpressions} impressions in the last 7 days
- Currently ranking at position ${opp.keyword.position}
- Growth rate: ${opp.keyword.isNew ? 'NEW keyword (not seen in previous 28 days)' : `+${Math.round(opp.keyword.growthRate * 100)}% vs previous month`}

ACTION NEEDED: ${opp.action === 'inject' ? 'This keyword does NOT appear in the article content. Generate a paragraph or FAQ Q&A that naturally integrates this keyword.' : opp.action === 'promote' ? 'This keyword appears in the body but NOT in the title/description. Suggest an updated title and H2 heading that incorporates it.' : 'This keyword is present but could be more prominent. Suggest ways to reinforce it (add to an H2, add a FAQ, or expand the section).'}

Generate a READY-TO-PASTE content patch. If it's a paragraph, write it in the author's voice (conversational, data-engineering focused, first person). If it's a title update, provide the exact new title.

Format your response as:
---
TYPE: [paragraph|faq|title_update|h2_section]
WHERE TO ADD: [specific location in the article, e.g., "after the Architecture section" or "in the FAQ section"]
CONTENT:
[The actual content to paste]
---

Keep it concise (150-300 words max for paragraphs, shorter for titles/FAQs).`;

        try {
            const result = await aiService.generateSuggestion(prompt, '');
            return result;
        } catch (e) {
            return `Error generating patch: ${e.message}`;
        }
    };

    const stats = useMemo(() => ({
        totalRising: risingKeywords.length,
        totalOpportunities: opportunities.length,
        injectCount: opportunities.filter(o => o.action === 'inject').length,
        promoteCount: opportunities.filter(o => o.action === 'promote').length,
    }), [risingKeywords, opportunities]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-emerald-400" />
                        Keyword Injector
                    </h1>
                    <p className="text-gray-400">
                        Rising keywords detected from GSC trends â€” inject them into existing articles to capture growing search demand.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Stats */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <div className="text-xs uppercase tracking-wider text-emerald-300">Rising Keywords</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.totalRising}</div>
                        <div className="text-xs text-gray-400 mt-1">detected this week</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                        <div className="text-xs uppercase tracking-wider text-blue-300">Opportunities</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.totalOpportunities}</div>
                        <div className="text-xs text-gray-400 mt-1">keyword-article matches</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                        <div className="text-xs uppercase tracking-wider text-red-300 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Inject
                        </div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.injectCount}</div>
                        <div className="text-xs text-gray-400 mt-1">keywords missing from articles</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                        <div className="text-xs uppercase tracking-wider text-amber-300">Promote</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.promoteCount}</div>
                        <div className="text-xs text-gray-400 mt-1">in body but not title</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {!loading && !error && opportunities.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { k: 'all', label: `All (${opportunities.length})` },
                        { k: 'inject', label: `Inject (${opportunities.filter(o => o.action === 'inject').length})` },
                        { k: 'promote', label: `Promote (${opportunities.filter(o => o.action === 'promote').length})` },
                        { k: 'boost', label: `Boost (${opportunities.filter(o => o.action === 'boost').length})` },
                    ].map(f => (
                        <button
                            key={f.k}
                            onClick={() => setFilter(f.k)}
                            className={`px-3 py-1.5 rounded-lg text-xs ${filter === f.k
                                ? 'bg-blue-600/40 text-white border border-blue-500/50'
                                : 'bg-slate-700/40 text-gray-400 hover:text-white border border-transparent'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Analyzing keyword trends...</span>
                </div>
            )}

            {/* Opportunities list */}
            {!loading && !error && visible.length > 0 && (
                <div className="space-y-3">
                    {visible.map((opp, i) => (
                        <OpportunityCard key={`${opp.article.slug}-${opp.keyword.query}-${i}`} opp={opp} onGeneratePatch={generatePatch} />
                    ))}
                </div>
            )}

            {!loading && !error && opportunities.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-lg">No rising keyword opportunities detected</p>
                    <p className="text-sm mt-1">Check back in a few days â€” trends are computed weekly from GSC data.</p>
                </div>
            )}

            {/* Info footer */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong>{' '}
                Compares GSC keyword impressions from the last 7 days against the previous 28-day baseline.
                Keywords with 25%+ impression growth are flagged as "rising". These are matched against your
                existing articles to find injection opportunities. Click "Generate Patch" to get AI-written
                content that naturally incorporates the trending keyword.
            </div>
        </div>
    );
}

export default KeywordInjectorPage;
