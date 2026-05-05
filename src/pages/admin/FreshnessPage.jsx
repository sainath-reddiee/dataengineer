// src/pages/admin/FreshnessPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Loader2, AlertTriangle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';

function daysSince(dateStr) {
    if (!dateStr) return 999;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function getAgeColor(days) {
    if (days <= 30) return 'text-emerald-400';
    if (days <= 90) return 'text-amber-400';
    return 'text-red-400';
}

function getAgeBadge(days) {
    if (days <= 30) return { label: 'Fresh', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (days <= 90) return { label: 'Aging', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { label: 'Stale', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
}

export function FreshnessPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('stale'); // 'stale' or 'fresh'

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                const posts = (data.posts || []).map(p => ({
                    slug: p.slug,
                    title: p.title,
                    date: p.date,
                    modified: p.modified || p.date,
                    daysSinceModified: daysSince(p.modified || p.date),
                    daysSincePublished: daysSince(p.date),
                    wordCount: p.content ? p.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0,
                }));
                setArticles(posts);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        load();
    }, []);

    const sorted = [...articles].sort((a, b) =>
        sortBy === 'stale'
            ? b.daysSinceModified - a.daysSinceModified
            : a.daysSinceModified - b.daysSinceModified
    );

    const freshCount = articles.filter(a => a.daysSinceModified <= 30).length;
    const agingCount = articles.filter(a => a.daysSinceModified > 30 && a.daysSinceModified <= 90).length;
    const staleCount = articles.filter(a => a.daysSinceModified > 90).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Loading content freshness data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Content Freshness</h1>
                <p className="text-gray-400">Track which articles need updating. Google rewards fresh content with higher rankings.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-900/10 border border-emerald-800/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-emerald-400">{freshCount}</div>
                    <div className="text-xs text-gray-400">Fresh (&lt;30 days)</div>
                </div>
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-400">{agingCount}</div>
                    <div className="text-xs text-gray-400">Aging (30-90 days)</div>
                </div>
                <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-400">{staleCount}</div>
                    <div className="text-xs text-gray-400">Stale (&gt;90 days)</div>
                </div>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Sort:</span>
                <button
                    onClick={() => setSortBy('stale')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === 'stale' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}
                >
                    Stalest First
                </button>
                <button
                    onClick={() => setSortBy('fresh')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === 'fresh' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}
                >
                    Freshest First
                </button>
            </div>

            {/* Articles Table */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-slate-700 uppercase">
                    <div className="col-span-5">Article</div>
                    <div className="col-span-2 text-center">Last Updated</div>
                    <div className="col-span-2 text-center">Days Ago</div>
                    <div className="col-span-1 text-center">Words</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Edit</div>
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
                    {sorted.map(article => {
                        const badge = getAgeBadge(article.daysSinceModified);
                        return (
                            <div key={article.slug} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 transition">
                                <div className="col-span-5 text-sm text-gray-200 truncate">{article.title}</div>
                                <div className="col-span-2 text-xs text-gray-400 text-center">
                                    {new Date(article.modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className={`col-span-2 text-sm font-mono text-center ${getAgeColor(article.daysSinceModified)}`}>
                                    {article.daysSinceModified}d
                                </div>
                                <div className="col-span-1 text-xs text-gray-400 text-center">{article.wordCount}</div>
                                <div className="col-span-1 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center">
                                    <a
                                        href={`https://app.dataengineerhub.blog/wp-admin/post.php?action=edit&post=${article.slug}`}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 inline" />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default FreshnessPage;
