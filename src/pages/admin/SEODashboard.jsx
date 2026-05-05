// src/pages/admin/SEODashboard.jsx
/**
 * SEO Dashboard - Main Admin Page
 * Overview of all SEO metrics with quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Layers, GitCompare, Code2, Eye, Sparkles,
    TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, Bot, Zap, Activity
} from 'lucide-react';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';
import wordpressApi from '@/services/wordpressApi';
import { getLastNDays, getLocalReferralStats } from '@/utils/aiReferralTracker';
import { scoreCtrBatch } from '@/utils/ctrScorer';
import { getEngagementStats } from '@/utils/engagementTracker';

// Tailwind can't detect dynamic classes at build time, so we map them explicitly
const COLOR_CLASSES = {
    blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    green:  { bg: 'bg-green-500/20',  text: 'text-green-400' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    pink:   { bg: 'bg-pink-500/20',   text: 'text-pink-400' },
    cyan:   { bg: 'bg-cyan-500/20',   text: 'text-cyan-400' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
};

const quickActions = [
    { path: '/admin/scanner', icon: Search, label: 'Scan URL', desc: 'Analyze any page', color: 'blue' },
    { path: '/admin/bulk', icon: Layers, label: 'Bulk Scan', desc: 'Scan all articles', color: 'purple' },
    { path: '/admin/compare', icon: GitCompare, label: 'Compare', desc: 'Side-by-side', color: 'green' },
    { path: '/admin/schema', icon: Code2, label: 'Schema', desc: 'Generate markup', color: 'orange' },
    { path: '/admin/serp', icon: Eye, label: 'SERP Preview', desc: 'Search preview', color: 'pink' },
    { path: '/admin/ai-suite', icon: Sparkles, label: 'AI Suite', desc: 'PSEO/AEO/GEO', color: 'cyan' },
    { path: '/admin/ctr-lab', icon: Zap, label: 'CTR Lab', desc: 'Title & meta scorer', color: 'yellow' },
];

export function SEODashboard() {
    const [stats, setStats] = useState({ articles: 0, loading: true });
    const [recentArticles, setRecentArticles] = useState([]);
    const [aiReferrals, setAiReferrals] = useState({ last30: 0, total: 0 });
    const [ctrQuickWin, setCtrQuickWin] = useState({ lift: 0, atRisk: 0, loading: true });
    const [engagement, setEngagement] = useState({ landings: 0, clickRate: 0 });

    useEffect(() => {
        async function loadStats() {
            try {
                const posts = await wordpressApi.getAllPosts(1, 100);
                setRecentArticles((posts.posts || []).slice(0, 5));
                setStats({
                    articles: posts.totalPosts || posts.posts?.length || 0,
                    loading: false
                });

                // Run CTR heuristic scorer over the same batch
                try {
                    const scored = scoreCtrBatch(posts.posts || []);
                    // Average missed lift per post (not sum) — realistic opportunity read.
                    const lift = scored.length
                        ? Math.round((scored.reduce((a, r) => a + (r.missingLiftPct || 0), 0) / scored.length) * 10) / 10
                        : 0;
                    const atRisk = scored.filter(r => r.grade === 'D' || r.grade === 'F').length;
                    setCtrQuickWin({ lift, atRisk, loading: false });
                } catch {
                    setCtrQuickWin({ lift: 0, atRisk: 0, loading: false });
                }
            } catch (err) {
                console.error('Failed to load stats:', err);
                setStats({ articles: 0, loading: false });
                setCtrQuickWin({ lift: 0, atRisk: 0, loading: false });
            }
        }
        loadStats();

        // AI referral counters (local device)
        try {
            const full = getLocalReferralStats();
            const last30 = getLastNDays(30).reduce((acc, d) => acc + d.count, 0);
            setAiReferrals({ last30, total: full.total || 0 });
        } catch { /* ignore */ }

        // Engagement summary (local device)
        try {
            const e = getEngagementStats();
            const totals = e.totals || {};
            const landings = totals.landings || 0;
            const clickRate = landings > 0 ? Math.round((totals.secondClicks / landings) * 100) : 0;
            setEngagement({ landings, clickRate });
        } catch { /* ignore */ }
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">SEO Dashboard</h1>
                <p className="text-gray-400">Monitor and optimize your blog's search performance</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                            <Layers className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {stats.loading ? '...' : stats.articles}
                            </p>
                            <p className="text-sm text-gray-400">Total Articles</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <Link to="/admin/ctr-lab" className="flex items-center gap-3 group">
                        <div className="p-3 rounded-xl bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {ctrQuickWin.loading ? '...' : `+${ctrQuickWin.lift}%`}
                            </p>
                            <p className="text-sm text-gray-400">
                                Avg missed CTR lift
                                {!ctrQuickWin.loading && ctrQuickWin.atRisk > 0 && (
                                    <span className="text-gray-500"> · {ctrQuickWin.atRisk} at risk</span>
                                )}
                            </p>
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <Link to="/admin/ai-suite" className="flex items-center gap-3 group">
                        <div className="p-3 rounded-xl bg-pink-500/20 group-hover:bg-pink-500/30 transition-colors">
                            <Bot className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{aiReferrals.last30}</p>
                            <p className="text-sm text-gray-400">
                                AI Referrals (30d)
                                {aiReferrals.total > 0 && (
                                    <span className="text-gray-500"> · {aiReferrals.total} all-time</span>
                                )}
                            </p>
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <Link to="/admin/ai-suite" className="flex items-center gap-3 group">
                        <div className="p-3 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{engagement.clickRate}%</p>
                            <p className="text-sm text-gray-400">
                                Click-inside
                                {engagement.landings > 0 && (
                                    <span className="text-gray-500"> · {engagement.landings} landings</span>
                                )}
                            </p>
                        </div>
                    </Link>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickActions.map((action, idx) => (
                        <motion.div
                            key={action.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link
                                to={action.path}
                                className="block bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-4 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group"
                            >
                                <div className={`p-3 rounded-xl ${COLOR_CLASSES[action.color]?.bg || 'bg-blue-500/20'} inline-block mb-3`}>
                                    <action.icon className={`w-6 h-6 ${COLOR_CLASSES[action.color]?.text || 'text-blue-400'}`} />
                                </div>
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {action.label}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Recent Articles for Quick Scan */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Recent Articles</h2>
                    <Link to="/admin/bulk" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        Scan All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
                    {recentArticles.length === 0 && !stats.loading ? (
                        <div className="p-8 text-center text-gray-500">
                            No articles found. Create some content to analyze!
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Title</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {recentArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-slate-700/30">
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium line-clamp-1">{article.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-400 text-sm">{article.category || 'Uncategorized'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-sm">
                                                {new Date(article.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <a
                                                href={`/articles/${article.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                                            >
                                                Open →
                                            </a>
                                            <Link
                                                to={`/admin/scanner?url=${encodeURIComponent(`${window.location.origin}/articles/${article.slug}`)}`}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                            >
                                                Scan
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SEODashboard;
