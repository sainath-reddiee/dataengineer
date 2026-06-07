// src/pages/admin/ContentDecayPage.jsx
// Detects articles losing traffic by comparing GSC data across two 28-day periods.

import React, { useEffect, useState } from 'react';
import { TrendingDown, Loader2, AlertTriangle, RefreshCw, Sparkles, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';

export function ContentDecayPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);

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

            // Period 1: last 28 days (ending 3 days ago due to GSC lag)
            const recentEnd = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
            const recentStart = new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0];

            // Period 2: previous 28 days (days 31-58 ago)
            const prevEnd = new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0];
            const prevStart = new Date(Date.now() - 59 * 86400000).toISOString().split('T')[0];

            const [recent, previous] = await Promise.all([
                gscService.queryTopPages({ startDate: recentStart, endDate: recentEnd, rowLimit: 200 }),
                gscService.queryTopPages({ startDate: prevStart, endDate: prevEnd, rowLimit: 200 }),
            ]);

            // Build lookup from previous period
            const prevMap = {};
            previous.forEach(row => {
                const match = row.page.match(/\/articles\/([^/?#]+)/);
                if (match) prevMap[match[1]] = row;
            });

            // Compare periods
            const compared = recent
                .map(row => {
                    const match = row.page.match(/\/articles\/([^/?#]+)/);
                    if (!match) return null;
                    const slug = match[1];
                    const prev = prevMap[slug];
                    if (!prev) return null; // No previous data to compare

                    const impChange = prev.impressions > 0
                        ? ((row.impressions - prev.impressions) / prev.impressions) * 100
                        : 0;
                    const clickChange = prev.clicks > 0
                        ? ((row.clicks - prev.clicks) / prev.clicks) * 100
                        : 0;
                    const posChange = prev.position - row.position; // positive = improved

                    return {
                        slug,
                        page: row.page,
                        current: { impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, position: row.position },
                        previous: { impressions: prev.impressions, clicks: prev.clicks, ctr: prev.ctr, position: prev.position },
                        impChange,
                        clickChange,
                        posChange,
                        isDecaying: impChange < -20 || clickChange < -30,
                        isGrowing: impChange > 20 && clickChange > 20,
                    };
                })
                .filter(Boolean)
                .sort((a, b) => a.impChange - b.impChange); // Worst declining first

            setArticles(compared);
        } catch (e) {
            setError(e.message || 'Failed to load');
        }
        setLoading(false);
    }

    const decaying = articles.filter(a => a.isDecaying);
    const growing = articles.filter(a => a.isGrowing);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <TrendingDown className="w-8 h-8 text-red-400" />
                        Content Decay Detector
                    </h1>
                    <p className="text-gray-400">Compares last 28 days vs. previous 28 days — catches articles losing traffic before they fall off page 1.</p>
                </div>
                <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Comparing periods...</span>
                </div>
            )}

            {!loading && !error && articles.length > 0 && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-red-400">{decaying.length}</div>
                            <div className="text-xs text-gray-400">Decaying Articles</div>
                            <div className="text-[10px] text-gray-600">Impressions down &gt;20%</div>
                        </div>
                        <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">{growing.length}</div>
                            <div className="text-xs text-gray-400">Growing Articles</div>
                            <div className="text-[10px] text-gray-600">Both metrics up &gt;20%</div>
                        </div>
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-center">
                            <div className="text-2xl font-bold text-gray-300">{articles.length - decaying.length - growing.length}</div>
                            <div className="text-xs text-gray-400">Stable</div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700">
                            <h3 className="text-sm font-semibold text-white">All Articles (declining first)</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {articles.map(a => (
                                <DecayRow key={a.slug} article={a} expanded={expandedSlug === a.slug} onToggle={() => setExpandedSlug(expandedSlug === a.slug ? null : a.slug)} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function DecayRow({ article, expanded, onToggle }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [aiTips, setAiTips] = useState(null);

    const impIcon = article.impChange < -5 ? ArrowDown : article.impChange > 5 ? ArrowUp : Minus;
    const ImpIcon = impIcon;
    const impColor = article.impChange < -20 ? 'text-red-400' : article.impChange > 20 ? 'text-emerald-400' : 'text-gray-400';

    const handleAI = async () => {
        if (!aiService.isEnabled) { alert('Set AI key in sidebar.'); return; }
        setAiLoading(true);
        try {
            const prompt = `An article's impressions dropped ${Math.abs(article.impChange).toFixed(0)}% and clicks ${article.clickChange > 0 ? 'grew' : 'dropped'} ${Math.abs(article.clickChange).toFixed(0)}% over the last 28 days compared to the previous 28 days.

Article URL slug: /articles/${article.slug}
Current position: #${article.current.position.toFixed(1)} (was #${article.previous.position.toFixed(1)})
Current impressions: ${article.current.impressions} (was ${article.previous.impressions})

Why might this article be declining? Give 3-4 specific possible causes and what to do about each. Consider: algorithm updates, content freshness, new competitors, keyword cannibalization, seasonal changes.`;

            const response = await aiService.generateSuggestion(prompt, '');
            setAiTips(response);
        } catch (e) { console.error(e); setAiTips(`Error: ${e.message || 'Failed to generate AI tips'}`); }
        setAiLoading(false);
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-4 text-sm text-gray-200 truncate">{article.slug.replace(/-/g, ' ')}</div>
                <div className="col-span-2 text-center text-xs text-gray-400">
                    {article.previous.impressions} → {article.current.impressions}
                </div>
                <div className={`col-span-2 text-center text-xs font-bold flex items-center justify-center gap-1 ${impColor}`}>
                    <ImpIcon className="w-3 h-3" /> {article.impChange > 0 ? '+' : ''}{article.impChange.toFixed(0)}%
                </div>
                <div className="col-span-2 text-center text-xs text-gray-400">
                    #{article.previous.position.toFixed(1)} → #{article.current.position.toFixed(1)}
                </div>
                <div className={`col-span-2 text-right text-xs ${article.isDecaying ? 'text-red-400' : article.isGrowing ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {article.isDecaying ? 'âš  Decaying' : article.isGrowing ? 'âœ“ Growing' : 'Stable'}
                </div>
            </div>
            {expanded && (
                <div className="px-6 pb-3 bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                            Clicks: {article.previous.clicks} → {article.current.clicks} ({article.clickChange > 0 ? '+' : ''}{article.clickChange.toFixed(0)}%)
                            · CTR: {(article.previous.ctr * 100).toFixed(1)}% → {(article.current.ctr * 100).toFixed(1)}%
                        </div>
                        <button onClick={handleAI} disabled={aiLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-lg">
                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {aiLoading ? 'Analyzing...' : 'AI: Why is this declining?'}
                        </button>
                    </div>
                    {aiTips && (
                        <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-gray-200 whitespace-pre-wrap">
                            {aiTips}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ContentDecayPage;
