// src/pages/admin/RankDashboardPage.jsx
// Rank Intelligence Dashboard — the flagship admin view.
// Combines SEO, AEO, CTR, AI visibility, engagement, and freshness signals
// into a single health score per article, with prioritized actions.

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Target, AlertTriangle, Zap, ChevronDown, ChevronRight,
    ExternalLink, RefreshCw, Award, Loader2, Link2 as LinkIcon,
    Activity, BookOpen, DollarSign, BarChart3, LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import { scoreArticlesBatch } from '@/utils/rankIntelligence';
import { getAllRanks, logRank, setTargetKeyword, getAggregateStats } from '@/utils/rankTracker';
import { getLocalReferralStats } from '@/utils/aiReferralTracker';
import { getEngagementStats } from '@/utils/engagementTracker';
import gscService from '@/services/gscService';

const HEALTH_COLORS = {
    high:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
    medium: 'text-amber-400   bg-amber-500/10   border-amber-500/40',
    low:    'text-red-400     bg-red-500/10     border-red-500/40',
};

function healthBucket(score) {
    if (score >= 75) return 'high';
    if (score >= 55) return 'medium';
    return 'low';
}

const PILLAR_LABELS = {
    seo: 'SEO', aeo: 'AEO', ctr: 'CTR', ai: 'AI Visibility',
    engagement: 'Engagement', freshness: 'Freshness',
};

export function RankDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [scored, setScored] = useState([]);
    const [expandedSlug, setExpandedSlug] = useState(null);
    const [rankData, setRankData] = useState({});
    const [rankStats, setRankStats] = useState({});
    const [sortBy, setSortBy] = useState('opportunity'); // 'opportunity' | 'health' | 'rank'
    const [gscConnected, setGscConnected] = useState(false);
    const [gscData, setGscData] = useState(null);
    const [gscError, setGscError] = useState('');

    useEffect(() => {
        // Handle GSC OAuth callback if present
        gscService.handleOAuthCallback();
        setGscConnected(gscService.isConnected());

        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await wordpressApi.getAllPosts(1, 100);
            const posts = data.posts || [];
            const ranks = getAllRanks();

            // Load engagement data from localStorage
            let engagement = null;
            try {
                engagement = getEngagementStats();
            } catch { /* no data yet */ }

            const articleResults = scoreArticlesBatch(posts, {
                engagement,
                rankData: ranks,
            });

            setScored(articleResults);
            setRankData(ranks);
            setRankStats(getAggregateStats());

            // Fetch GSC data if connected
            if (gscService.isConnected()) {
                try {
                    const pages = await gscService.queryTopPages({ rowLimit: 100 });
                    setGscData(pages);
                } catch (err) {
                    setGscError(err.message);
                    if (err.message.includes('expired')) setGscConnected(false);
                }
            }
        } catch (err) {
            console.error('Dashboard load failed:', err);
        }
        setLoading(false);
    }

    const sortedArticles = useMemo(() => {
        const arr = [...scored];
        if (sortBy === 'opportunity') {
            // Biggest opportunities = lowest health with highest potential
            arr.sort((a, b) => (b.rankPotential - b.articleHealth) - (a.rankPotential - a.articleHealth));
        } else if (sortBy === 'health') {
            arr.sort((a, b) => b.articleHealth - a.articleHealth);
        } else if (sortBy === 'rank') {
            arr.sort((a, b) => (a.currentPosition || 999) - (b.currentPosition || 999));
        }
        return arr;
    }, [scored, sortBy]);

    // Aggregate metrics
    const avgHealth = scored.length
        ? Math.round(scored.reduce((s, a) => s + a.articleHealth, 0) / scored.length)
        : 0;
    const highHealth = scored.filter(a => a.articleHealth >= 75).length;
    const needsWork  = scored.filter(a => a.articleHealth < 55).length;
    const totalUplift = scored.reduce(
        (s, a) => s + (a.revenueProjection.potentialMonthly - a.revenueProjection.currentMonthly),
        0
    );
    const aiRefs = getLocalReferralStats();

    // Weekly action plan: top 10 actions across all articles
    const weeklyActions = useMemo(() => {
        const all = [];
        scored.slice(0, 15).forEach(article => {
            article.topActions.forEach(action => {
                all.push({ ...action, articleTitle: article.title, articleSlug: article.slug, articleHealth: article.articleHealth });
            });
        });
        return all
            .sort((a, b) => {
                const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return priority[a.priority] - priority[b.priority];
            })
            .slice(0, 10);
    }, [scored]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Computing rank intelligence across all articles...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Target className="w-8 h-8 text-blue-400" />
                        Rank Intelligence
                    </h1>
                    <p className="text-gray-400">Where each article stands on SEO, AEO, CTR, AI & how to push it to page 1.</p>
                </div>
                <div className="flex gap-2">
                    {!gscConnected ? (
                        <button
                            onClick={() => gscService.startOAuth()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2"
                            disabled={!gscService.isConfigured()}
                            title={!gscService.isConfigured() ? 'Set VITE_GSC_CLIENT_ID in .env to enable' : 'Connect Google Search Console'}
                        >
                            <LinkIcon className="w-4 h-4" /> Connect GSC
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-2 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg border border-emerald-500/40 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> GSC Connected
                            </span>
                            <button
                                onClick={() => { gscService.clearToken(); setGscConnected(false); setGscData(null); }}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs rounded-lg flex items-center gap-1.5"
                                title="Disconnect Google Search Console"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Disconnect
                            </button>
                        </div>
                    )}
                    <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* Site-Wide Health Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HealthCard icon={Award}    value={avgHealth}            label="Avg Article Health" accent="blue"    suffix="/100" />
                <HealthCard icon={TrendingUp} value={highHealth}         label="High-Health Articles" accent="emerald" subtext={`${Math.round(highHealth/scored.length*100)}% of library`} />
                <HealthCard icon={AlertTriangle} value={needsWork}       label="Needs Work" accent="amber" subtext="< 55 health score" />
                <HealthCard icon={DollarSign} value={`$${totalUplift.toFixed(0)}`} label="Monthly Revenue Uplift" accent="purple" subtext="if all hit page 1" />
            </div>

            {/* Rank Tracker Stats */}
            {rankStats.tracked > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-center">
                        <div className="text-xl font-bold text-white">{rankStats.tracked}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Tracked</div>
                    </div>
                    <div className="p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                        <div className="text-xl font-bold text-emerald-400">{rankStats.onPage1}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">On Page 1</div>
                    </div>
                    <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                        <div className="text-xl font-bold text-amber-400">{rankStats.onPage2}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Page 2</div>
                    </div>
                    <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-xl text-center">
                        <div className="text-xl font-bold text-blue-400">{rankStats.improving}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Improving</div>
                    </div>
                    <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                        <div className="text-xl font-bold text-red-400">{rankStats.declining}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Declining</div>
                    </div>
                </div>
            )}

            {/* GSC Real Data Preview */}
            {gscConnected && gscData && gscData.length > 0 && (
                <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4" /> Google Search Console — Last 28 Days
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-2">
                            <div className="text-xs text-gray-400">Total Impressions</div>
                            <div className="text-lg font-bold text-white">{gscData.reduce((s, p) => s + p.impressions, 0).toLocaleString()}</div>
                        </div>
                        <div className="p-2">
                            <div className="text-xs text-gray-400">Total Clicks</div>
                            <div className="text-lg font-bold text-white">{gscData.reduce((s, p) => s + p.clicks, 0).toLocaleString()}</div>
                        </div>
                        <div className="p-2">
                            <div className="text-xs text-gray-400">Avg Position</div>
                            <div className="text-lg font-bold text-white">{(gscData.reduce((s, p) => s + p.position, 0) / gscData.length).toFixed(1)}</div>
                        </div>
                        <div className="p-2">
                            <div className="text-xs text-gray-400">Avg CTR</div>
                            <div className="text-lg font-bold text-white">{((gscData.reduce((s, p) => s + p.ctr, 0) / gscData.length) * 100).toFixed(2)}%</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Action Plan */}
            {weeklyActions.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4" /> This Week's Priority Actions
                    </h3>
                    <div className="space-y-2">
                        {weeklyActions.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    a.priority === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                                    a.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-blue-500/20 text-blue-300'
                                }`}>{a.priority}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200">{a.action}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">For: <span className="text-blue-300">{a.articleTitle}</span> · {a.projectedLift}</div>
                                </div>
                                {a.link && (
                                    a.link.startsWith('http') ? (
                                        <a href={a.link} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300 shrink-0">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ) : (
                                        <Link to={a.link} className="text-blue-400 hover:text-blue-300 shrink-0">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Articles Table */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-white">All Articles ({scored.length})</h3>
                    <div className="flex gap-2">
                        <SortButton active={sortBy === 'opportunity'} onClick={() => setSortBy('opportunity')}>Biggest Opportunity</SortButton>
                        <SortButton active={sortBy === 'health'}      onClick={() => setSortBy('health')}>Health Score</SortButton>
                        <SortButton active={sortBy === 'rank'}        onClick={() => setSortBy('rank')}>Rank Position</SortButton>
                    </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                    {sortedArticles.map(article => (
                        <ArticleRow
                            key={article.slug}
                            article={article}
                            rankData={rankData[article.slug]}
                            expanded={expandedSlug === article.slug}
                            onToggle={() => setExpandedSlug(expandedSlug === article.slug ? null : article.slug)}
                            onRankSaved={() => { setRankData(getAllRanks()); setRankStats(getAggregateStats()); }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function HealthCard({ icon: Icon, value, label, accent = 'blue', suffix = '', subtext = '' }) {
    const colors = {
        blue:    'bg-blue-500/10    border-blue-500/30    text-blue-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        amber:   'bg-amber-500/10   border-amber-500/30   text-amber-400',
        purple:  'bg-purple-500/10  border-purple-500/30  text-purple-400',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[accent]}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-wider opacity-75">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">
                {value}<span className="text-sm opacity-60">{suffix}</span>
            </div>
            {subtext && <div className="text-[11px] text-gray-500 mt-1">{subtext}</div>}
        </div>
    );
}

function SortButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-xs rounded-lg border transition ${
                active
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-900/50 text-gray-400 border-slate-700 hover:text-gray-200'
            }`}
        >
            {children}
        </button>
    );
}

function ArticleRow({ article, rankData, expanded, onToggle, onRankSaved }) {
    const bucket = healthBucket(article.articleHealth);
    const [rankInput, setRankInput] = useState(rankData?.currentPosition || '');
    const [keywordInput, setKeywordInput] = useState(rankData?.targetKeyword || '');

    const saveRank = () => {
        if (keywordInput && keywordInput !== rankData?.targetKeyword) {
            setTargetKeyword(article.slug, keywordInput);
        }
        if (rankInput) {
            logRank(article.slug, parseInt(rankInput, 10));
        }
        onRankSaved?.();
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            <div
                onClick={onToggle}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 cursor-pointer transition"
            >
                <div className="col-span-5 text-sm text-gray-200 truncate flex items-center gap-2">
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
                    {article.title}
                </div>
                <div className="col-span-1 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${HEALTH_COLORS[bucket]}`}>
                        {article.articleHealth}
                    </span>
                </div>
                <div className="col-span-2 text-xs text-gray-400 text-center capitalize">
                    {PILLAR_LABELS[article.bottleneck] || article.bottleneck}
                </div>
                <div className="col-span-2 text-xs text-center">
                    <span className={
                        article.rankEstimate.includes('Page 1') ? 'text-emerald-400' :
                        article.rankEstimate.includes('Page 2') ? 'text-amber-400' :
                        'text-gray-500'
                    }>
                        {article.currentPosition ? `#${article.currentPosition}` : article.rankEstimate}
                    </span>
                </div>
                <div className="col-span-2 text-xs text-emerald-400 text-right font-mono">
                    +${(article.revenueProjection.potentialMonthly - article.revenueProjection.currentMonthly).toFixed(0)}/mo
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-4 bg-slate-900/40 space-y-4">
                    {/* Pillar Scores */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pt-3">
                        {Object.entries(article.pillarScores).map(([pillar, score]) => (
                            <div key={pillar} className="p-2 bg-slate-800/60 rounded-lg text-center">
                                <div className="text-[10px] text-gray-500 uppercase">{PILLAR_LABELS[pillar]}</div>
                                <div className={`text-lg font-bold ${
                                    score >= 75 ? 'text-emerald-400' :
                                    score >= 55 ? 'text-amber-400' :
                                    'text-red-400'
                                }`}>{score}</div>
                            </div>
                        ))}
                    </div>

                    {/* Top Actions */}
                    {article.topActions.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Top Actions</div>
                            {article.topActions.map((a, i) => (
                                <div key={i} className="flex items-start gap-2 py-1.5 text-sm">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                                        a.priority === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                                        a.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                                        'bg-blue-500/20 text-blue-300'
                                    }`}>{a.priority}</span>
                                    <div className="flex-1">
                                        <span className="text-gray-200">{a.action}</span>
                                        <span className="text-xs text-emerald-400 ml-2">{a.projectedLift}</span>
                                    </div>
                                    {a.link && (
                                        a.link.startsWith('http') ? (
                                            <a href={a.link} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300 text-xs">Open ↗</a>
                                        ) : (
                                            <Link to={a.link} className="text-blue-400 hover:text-blue-300 text-xs">Open →</Link>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rank Tracker Input */}
                    <div className="pt-2 border-t border-slate-700/50">
                        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Rank Tracking</div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Target keyword"
                                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                            />
                            <input
                                type="number"
                                value={rankInput}
                                onChange={(e) => setRankInput(e.target.value)}
                                placeholder="Position"
                                className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                            />
                            <button
                                onClick={saveRank}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                            >
                                Log
                            </button>
                        </div>
                        {rankData?.history?.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                                History: {rankData.history.slice(-5).map(h => `#${h.position} (${h.date.split('-').slice(1).join('/')})`).join(' → ')}
                                {rankData.bestPosition && <span className="ml-3 text-emerald-400">Best: #{rankData.bestPosition}</span>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RankDashboardPage;
