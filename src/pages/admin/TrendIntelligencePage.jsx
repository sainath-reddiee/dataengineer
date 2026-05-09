// src/pages/admin/TrendIntelligencePage.jsx
// Trend Intelligence â€” discover what to write, what to update, and what competitors are doing.
// Uses TinyFish FREE Search + GSC + AI for comprehensive content strategy.

import React, { useState } from 'react';
import {
    TrendingUp, Loader2, RefreshCw, Sparkles, Copy, Check,
    Search, Users, Target, ExternalLink, ArrowUpRight,
} from 'lucide-react';
import trendIntelligenceService from '@/services/trendIntelligenceService';
import tinyfishService from '@/services/tinyfishService';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';

const TABS = [
    { id: 'trending', label: 'Trending Now', icon: TrendingUp, desc: 'New article ideas from web trends + community buzz' },
    { id: 'update', label: 'Update Existing', icon: RefreshCw, desc: 'Rising keywords â€” update your articles to capture demand' },
    { id: 'competitors', label: 'Competitor Watch', icon: Users, desc: 'What competitors are publishing â€” find your angle' },
    { id: 'gaps', label: 'Content Gaps', icon: Target, desc: 'Topics they rank for that you don\'t cover yet' },
];

// â”€â”€â”€ Tab 1: Trending Now â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TrendingTab() {
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState([]);
    const [ideas, setIdeas] = useState('');
    const [ideasLoading, setIdeasLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleDiscover = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await trendIntelligenceService.discoverTrendingTopics();
            setTrends(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleGenerateIdeas = async () => {
        if (!aiService.isEnabled) { setError('Set AI API key in sidebar first.'); return; }
        setIdeasLoading(true);
        try {
            const result = await trendIntelligenceService.generateArticleIdeas(trends);
            setIdeas(result);
        } catch (e) {
            setError(e.message);
        }
        setIdeasLoading(false);
    };

    const sourceBadge = (source) => {
        if (source === 'community') return <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30">COMMUNITY</span>;
        return <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">WEB</span>;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-400">Search the web for trending data engineering topics, community discussions, and new article opportunities.</p>
                <button onClick={handleDiscover} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Searching...' : 'Discover Trends'}
                </button>
            </div>

            {error && <div className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg text-red-300 text-xs">{error}</div>}

            {trends.length > 0 && (
                <>
                    <div className="text-xs text-gray-500 mb-2">{trends.length} trending signals found</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                        {trends.map((t, i) => (
                            <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-500/30 transition">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-white font-medium truncate">{t.title}</div>
                                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{t.domain}</div>
                                        {t.snippet && <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{t.snippet}</div>}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {sourceBadge(t.source)}
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <a
                                                href={`/admin/article-writer?topic=${encodeURIComponent(t.title)}`}
                                                className="px-2 py-0.5 text-[9px] bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 rounded border border-pink-500/30"
                                            >
                                                Write →
                                            </a>
                                            <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400">
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Generate Ideas */}
                    <div className="pt-4 border-t border-slate-700">
                        <button onClick={handleGenerateIdeas} disabled={ideasLoading} className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                            {ideasLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {ideasLoading ? 'Generating...' : 'Generate 15 Article Ideas from Trends'}
                        </button>
                    </div>

                    {ideas && (
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-emerald-400">AI-Generated Article Ideas</span>
                                <button onClick={() => { navigator.clipboard.writeText(ideas).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                                {ideas}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// â”€â”€â”€ Tab 2: Update Existing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function UpdateTab() {
    const [loading, setLoading] = useState(false);
    const [rising, setRising] = useState([]);
    const [error, setError] = useState('');

    const handleLoad = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await trendIntelligenceService.getGSCRisingOpportunities();
            setRising(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-400">Keywords growing in impressions â€” update your articles to capture this rising demand.</p>
                <button onClick={handleLoad} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Find Rising Keywords'}
                </button>
            </div>

            {error && <div className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg text-red-300 text-xs">{error}</div>}

            {rising.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">{rising.length} keywords with rising impressions</div>
                    {rising.slice(0, 20).map((kw, i) => (
                        <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm text-white font-medium">{kw.query}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                    Impressions: {kw.recentImpressions?.toLocaleString()} (was {kw.baselineImpressions?.toLocaleString()})
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    +{Math.round((kw.growthRate || 0) * 100)}%
                                </span>
                                <a href={`/admin/keyword-target?slug=${kw.matchedSlug || ''}`} className="text-xs text-blue-400 hover:text-blue-300">
                                    Optimize â†’
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && rising.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">Click "Find Rising Keywords" to detect growing search demand from your GSC data.</div>
            )}
        </div>
    );
}

// â”€â”€â”€ Tab 3: Competitor Watch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CompetitorTab() {
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [outlineLoading, setOutlineLoading] = useState(null);
    const [outline, setOutline] = useState(null);

    const handleMonitor = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await trendIntelligenceService.monitorCompetitors('data engineering');
            setArticles(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleWriteBetter = async (article) => {
        if (!aiService.isEnabled) { setError('Set AI API key in sidebar.'); return; }
        setOutlineLoading(article.url);
        try {
            const keyword = article.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 5).join(' ').toLowerCase();
            const result = await trendIntelligenceService.generateArticleOutline(article.title, keyword);
            setOutline({ for: article.title, content: result });
        } catch (e) {
            setError(e.message);
        }
        setOutlineLoading(null);
    };

    // Group by domain
    const grouped = articles.reduce((acc, a) => {
        if (!acc[a.domain]) acc[a.domain] = [];
        acc[a.domain].push(a);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-400">See what competitors are publishing â€” find your differentiated angle.</p>
                <button onClick={handleMonitor} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {loading ? 'Scanning...' : 'Scan Competitors'}
                </button>
            </div>

            {error && <div className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg text-red-300 text-xs">{error}</div>}

            {Object.keys(grouped).length > 0 && (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([domain, domainArticles]) => (
                        <div key={domain} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/60">
                                <span className="text-xs font-semibold text-gray-300">{domain}</span>
                                <span className="text-[10px] text-gray-500 ml-2">{domainArticles.length} articles</span>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {domainArticles.map((a, i) => (
                                    <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs text-white truncate">{a.title}</div>
                                            {a.snippet && <div className="text-[10px] text-gray-500 truncate mt-0.5">{a.snippet}</div>}
                                        </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 mt-2 sm:mt-0">
                                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400">
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button
                                                onClick={() => handleWriteBetter(a)}
                                                disabled={outlineLoading === a.url}
                                                className="px-2 py-1 text-[10px] bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 rounded border border-pink-500/30"
                                            >
                                                {outlineLoading === a.url ? '...' : 'Write Better'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Generated outline */}
            {outline && (
                <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <span className="text-xs font-semibold text-pink-300">Your Better Version</span>
                            <div className="text-[10px] text-gray-500 mt-0.5">Based on: {outline.for}</div>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(outline.content).catch(() => {})} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                        </button>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                        {outline.content}
                    </div>
                </div>
            )}
        </div>
    );
}

// â”€â”€â”€ Tab 4: Content Gaps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function GapsTab() {
    const [loading, setLoading] = useState(false);
    const [gaps, setGaps] = useState([]);
    const [error, setError] = useState('');
    const [outlineLoading, setOutlineLoading] = useState(null);
    const [outline, setOutline] = useState(null);

    const handleFindGaps = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await trendIntelligenceService.findContentGaps();
            setGaps(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handlePlanArticle = async (gap) => {
        if (!aiService.isEnabled) { setError('Set AI API key in sidebar.'); return; }
        setOutlineLoading(gap.keyword);
        try {
            const result = await trendIntelligenceService.generateArticleOutline(
                `Complete guide on: ${gap.keyword}`,
                gap.keyword
            );
            setOutline({ keyword: gap.keyword, content: result });
        } catch (e) {
            setError(e.message);
        }
        setOutlineLoading(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-400">Topics competitors rank for that you haven't covered yet â€” your biggest growth opportunities.</p>
                <button onClick={handleFindGaps} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    {loading ? 'Scanning...' : 'Find Content Gaps'}
                </button>
            </div>

            {error && <div className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg text-red-300 text-xs">{error}</div>}

            {gaps.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">{gaps.length} content gaps found</div>
                    {gaps.map((gap, i) => (
                        <div key={i} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white font-medium">{gap.keyword}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${gap.opportunity === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                            {gap.opportunity === 'high' ? 'NOT COVERED' : `You: #${gap.yourRanking}`}
                                        </span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {gap.competitors.map((c, j) => (
                                            <div key={j} className="text-[10px] text-gray-400 flex items-center gap-2">
                                                <span className="text-gray-600">{c.domain}</span>
                                                <span className="truncate">{c.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0 mt-2 sm:mt-0">
                                    <a
                                        href={`/admin/article-writer?topic=${encodeURIComponent(gap.keyword)}`}
                                        className="px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 text-xs rounded-lg border border-pink-500/30"
                                    >
                                        Write â†’
                                    </a>
                                    <button
                                        onClick={() => handlePlanArticle(gap)}
                                        disabled={outlineLoading === gap.keyword}
                                        className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs rounded-lg border border-purple-500/30"
                                    >
                                        {outlineLoading === gap.keyword ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Plan Article'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Generated outline */}
            {outline && (
                <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <span className="text-xs font-semibold text-purple-300">Article Plan</span>
                            <div className="text-[10px] text-gray-500 mt-0.5">Target: "{outline.keyword}"</div>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(outline.content).catch(() => {})} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                        </button>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                        {outline.content}
                    </div>
                </div>
            )}

            {!loading && !error && gaps.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">Click "Find Content Gaps" to discover topics competitors rank for that you haven't covered.</div>
            )}
        </div>
    );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function TrendIntelligencePage() {
    const [activeTab, setActiveTab] = useState('trending');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                    Trend Intelligence
                </h1>
                <p className="text-gray-400">Discover what to write, what to update, and where competitors are winning â€” powered by live web search + GSC data.</p>
            </div>

            {/* Service status */}
            <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${tinyfishService.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                    TinyFish: {tinyfishService.isEnabled ? 'Active' : 'Not Set'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${gscService.isConnected() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    GSC: {gscService.isConnected() ? 'Connected' : 'Not Connected'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${aiService.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    AI: {aiService.isEnabled ? 'Active' : 'Not Set'}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-slate-800/50 p-1.5 rounded-xl overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-white border border-blue-500/40'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                {activeTab === 'trending' && <TrendingTab />}
                {activeTab === 'update' && <UpdateTab />}
                {activeTab === 'competitors' && <CompetitorTab />}
                {activeTab === 'gaps' && <GapsTab />}
            </div>
        </div>
    );
}

export default TrendIntelligencePage;
