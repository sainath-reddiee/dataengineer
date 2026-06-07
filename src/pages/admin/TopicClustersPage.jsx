// src/pages/admin/TopicClustersPage.jsx
// Visualizes content clusters and suggests missing sub-topics.

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, Loader2, Award, AlertTriangle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { clusterArticles, suggestMissingTopics } from '@/utils/topicClusters';
import { scoreArticlesBatch } from '@/utils/rankIntelligence';

export function TopicClustersPage() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Memoize missing-topic computation for the currently-expanded cluster
    // to avoid re-running keyword extraction on every expand/collapse.
    const expandedMissingTopics = useMemo(() => {
        if (expandedId === null || !analysis) return [];
        const cluster = analysis.clusters.find(c => c.id === expandedId);
        return cluster ? suggestMissingTopics(cluster, posts) : [];
    }, [expandedId, analysis, posts]);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                const scored = scoreArticlesBatch(data.posts || []);
                setPosts(data.posts || []);
                // Merge health scores into posts for cluster analysis
                const enriched = (data.posts || []).map(p => ({
                    ...p,
                    articleHealth: scored.find(s => s.slug === p.slug)?.articleHealth || 50,
                }));
                const result = clusterArticles(enriched);
                setAnalysis(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Analyzing topic clusters...</span>
            </div>
        );
    }

    if (!analysis) return <div className="text-red-400">Failed to analyze articles</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Network className="w-8 h-8 text-purple-400" />
                    Topic Clusters
                </h1>
                <p className="text-gray-400">Find your content pillars, identify orphan articles, and discover missing sub-topics.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-900/20 border border-purple-800/40 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-400">{analysis.clusters.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Clusters</div>
                </div>
                <div className="p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-xl text-center">
                    <div className="text-2xl font-bold text-emerald-400">{analysis.clusteredCount}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Clustered</div>
                </div>
                <div className="p-4 bg-amber-900/20 border border-amber-800/40 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-400">{analysis.orphans.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Orphans</div>
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-800/40 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-400">{analysis.totalArticles}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Articles</div>
                </div>
            </div>

            {/* Clusters */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Content Pillars</h2>
                {analysis.clusters.map(cluster => {
                    const expanded = expandedId === cluster.id;
                    const missingTopics = expanded ? expandedMissingTopics : [];
                    return (
                        <div key={cluster.id} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                            <div
                                onClick={() => setExpandedId(expanded ? null : cluster.id)}
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/60 transition"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white truncate capitalize">{cluster.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {cluster.size} articles · Pillar: <span className="text-blue-300">{cluster.pillar.title}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-xs text-gray-400">
                                        Health: <span className={
                                            cluster.avgHealth >= 75 ? 'text-emerald-400' :
                                            cluster.avgHealth >= 55 ? 'text-amber-400' :
                                            'text-red-400'
                                        }>{cluster.avgHealth}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {cluster.dominantTopics.slice(0, 3).map(t => (
                                            <span key={t} className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {expanded && (
                                <div className="px-6 pb-4 bg-slate-900/40 border-t border-slate-700">
                                    {/* Articles in cluster */}
                                    <div className="mt-3">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Articles in this cluster
                                        </div>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {cluster.members.map(m => (
                                                <div key={m.slug} className="flex items-center justify-between text-sm py-1.5 px-2 hover:bg-slate-800/40 rounded">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {m.slug === cluster.pillar.slug && <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" title="Pillar article" />}
                                                        <span className="text-gray-200 truncate">{m.title}</span>
                                                    </div>
                                                    <span className={`text-xs font-mono ml-2 ${
                                                        m.health >= 75 ? 'text-emerald-400' :
                                                        m.health >= 55 ? 'text-amber-400' :
                                                        'text-red-400'
                                                    }`}>{m.health}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Missing sub-topics */}
                                    {missingTopics.length > 0 && (
                                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                                            <div className="text-xs font-semibold text-blue-300 flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-3.5 h-3.5" />
                                                Suggested missing sub-topics
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {missingTopics.map(t => (
                                                    <span key={t.topic} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded border border-blue-500/30">
                                                        {t.topic} <span className="text-blue-400/60">×{t.frequency}</span>
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-2">
                                                Write new articles on these topics to strengthen this pillar.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Orphans */}
            {analysis.orphans.length > 0 && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        Orphan Articles ({analysis.orphans.length}) — don't fit any cluster
                    </h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {analysis.orphans.map(o => (
                            <div key={o.slug} className="flex items-center justify-between text-sm py-1.5 px-2 hover:bg-slate-800/40 rounded">
                                <span className="text-gray-200 truncate flex-1">{o.title}</span>
                                {o.suggestedCluster && (
                                    <span className="text-xs text-gray-500 shrink-0">
                                        Best fit: <span className="text-amber-300">{o.suggestedCluster}</span> ({o.similarity}%)
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TopicClustersPage;
