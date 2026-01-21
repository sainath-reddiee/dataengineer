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
    TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight
} from 'lucide-react';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';
import wordpressApi from '@/services/wordpressApi';

const quickActions = [
    { path: '/admin/scanner', icon: Search, label: 'Scan URL', desc: 'Analyze any page', color: 'blue' },
    { path: '/admin/bulk', icon: Layers, label: 'Bulk Scan', desc: 'Scan all articles', color: 'purple' },
    { path: '/admin/compare', icon: GitCompare, label: 'Compare', desc: 'Side-by-side', color: 'green' },
    { path: '/admin/schema', icon: Code2, label: 'Schema', desc: 'Generate markup', color: 'orange' },
    { path: '/admin/serp', icon: Eye, label: 'SERP Preview', desc: 'Search preview', color: 'pink' },
    { path: '/admin/ai-suite', icon: Sparkles, label: 'AI Suite', desc: 'PSEO/AEO/GEO', color: 'cyan' },
];

export function SEODashboard() {
    const [stats, setStats] = useState({ articles: 0, loading: true });
    const [recentArticles, setRecentArticles] = useState([]);

    useEffect(() => {
        async function loadStats() {
            try {
                const posts = await wordpressApi.getAllPosts(1, 5);
                setRecentArticles(posts.posts || []);
                setStats({
                    articles: posts.totalPosts || posts.posts?.length || 0,
                    loading: false
                });
            } catch (err) {
                console.error('Failed to load stats:', err);
                setStats({ articles: 0, loading: false });
            }
        }
        loadStats();
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
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-green-500/20">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">30+</p>
                            <p className="text-sm text-gray-400">SEO Checks</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">3</p>
                            <p className="text-sm text-gray-400">AI Analyzers</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-orange-500/20">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">~5s</p>
                            <p className="text-sm text-gray-400">Scan Time</p>
                        </div>
                    </div>
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
                                <div className={`p-3 rounded-xl bg-${action.color}-500/20 inline-block mb-3`}>
                                    <action.icon className={`w-6 h-6 text-${action.color}-400`} />
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
