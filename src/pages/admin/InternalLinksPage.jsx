// src/pages/admin/InternalLinksPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, AlertTriangle, ExternalLink, TrendingUp } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';

export function InternalLinksPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => { loadAndAnalyze(); }, []);

    async function loadAndAnalyze() {
        setLoading(true);
        try {
            const data = await wordpressApi.getAllPosts(1, 100);
            const posts = data.posts || [];
            setArticles(posts);

            // Build link graph: for each post, find which other posts it links to
            const slugToTitle = {};
            posts.forEach(p => { slugToTitle[p.slug] = p.title; });

            const inboundCount = {}; // slug -> count of articles linking TO it
            const outboundCount = {}; // slug -> count of internal links FROM it
            const linksFrom = {}; // slug -> [slugs it links to]

            posts.forEach(p => { inboundCount[p.slug] = 0; outboundCount[p.slug] = 0; linksFrom[p.slug] = []; });

            posts.forEach(post => {
                const content = post.content || '';
                // Find all internal article links
                const linkRegex = /href=["'](?:https?:\/\/(?:www\.)?dataengineerhub\.blog)?\/articles\/([a-z0-9-]+)["']/gi;
                const found = new Set();
                let match;
                while ((match = linkRegex.exec(content)) !== null) {
                    const targetSlug = match[1];
                    if (targetSlug !== post.slug && slugToTitle[targetSlug]) {
                        found.add(targetSlug);
                    }
                }
                outboundCount[post.slug] = found.size;
                linksFrom[post.slug] = [...found];
                found.forEach(target => {
                    inboundCount[target] = (inboundCount[target] || 0) + 1;
                });
            });

            // Identify orphan pages (0 inbound links from other articles)
            const orphans = posts
                .filter(p => inboundCount[p.slug] === 0)
                .map(p => ({ slug: p.slug, title: p.title, outbound: outboundCount[p.slug] }));

            // Most linked-to pages
            const topLinked = Object.entries(inboundCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([slug, count]) => ({ slug, title: slugToTitle[slug], inbound: count }));

            // Pages with no outbound links (not linking to anything)
            const noOutbound = posts
                .filter(p => outboundCount[p.slug] === 0)
                .map(p => ({ slug: p.slug, title: p.title, inbound: inboundCount[p.slug] }));

            // Linking suggestions: for orphans, find related articles by keyword overlap
            const suggestions = orphans.slice(0, 10).map(orphan => {
                const orphanWords = new Set(orphan.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
                const related = posts
                    .filter(p => p.slug !== orphan.slug)
                    .map(p => {
                        const pWords = p.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                        const overlap = pWords.filter(w => orphanWords.has(w)).length;
                        return { slug: p.slug, title: p.title, overlap };
                    })
                    .filter(p => p.overlap > 0)
                    .sort((a, b) => b.overlap - a.overlap)
                    .slice(0, 3);
                return { orphan, suggestLinkFrom: related };
            });

            setAnalysis({
                totalArticles: posts.length,
                totalInternalLinks: Object.values(outboundCount).reduce((a, b) => a + b, 0),
                orphans,
                topLinked,
                noOutbound,
                suggestions,
            });
        } catch (err) {
            console.error('Failed to analyze links:', err);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Analyzing internal link structure...</span>
            </div>
        );
    }

    if (!analysis) return <div className="text-red-400">Failed to load articles</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Internal Linking Analyzer</h1>
                <p className="text-gray-400">Find orphan pages, identify linking opportunities, and strengthen your site structure.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                    <div className="text-2xl font-bold text-white">{analysis.totalArticles}</div>
                    <div className="text-xs text-gray-400">Total Articles</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-400">{analysis.totalInternalLinks}</div>
                    <div className="text-xs text-gray-400">Internal Links</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-400">{analysis.orphans.length}</div>
                    <div className="text-xs text-gray-400">Orphan Pages</div>
                </div>
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-400">{analysis.noOutbound.length}</div>
                    <div className="text-xs text-gray-400">No Outbound Links</div>
                </div>
            </div>

            {/* Orphan Pages */}
            {analysis.orphans.length > 0 && (
                <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        Orphan Pages ({analysis.orphans.length}) — No other article links to these
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {analysis.orphans.map(o => (
                            <div key={o.slug} className="flex items-center justify-between text-sm py-1.5 px-3 bg-slate-900/50 rounded">
                                <span className="text-gray-300 truncate flex-1">{o.title}</span>
                                <a href={`/articles/${o.slug}`} target="_blank" rel="noopener" className="text-blue-400 ml-2">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Linking Suggestions */}
            {analysis.suggestions.length > 0 && (
                <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                        <Link2 className="w-4 h-4" />
                        Suggested Internal Links
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {analysis.suggestions.filter(s => s.suggestLinkFrom.length > 0).map((s, i) => (
                            <div key={i} className="p-3 bg-slate-900/50 rounded-lg">
                                <div className="text-sm text-white font-medium mb-1">{s.orphan.title}</div>
                                <div className="text-xs text-gray-500 mb-2">Add a link to this article from:</div>
                                {s.suggestLinkFrom.map(f => (
                                    <div key={f.slug} className="text-xs text-blue-300 pl-4">→ {f.title}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Linked Pages */}
            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Most Linked-To Pages (Top 10)
                </h3>
                <div className="space-y-1">
                    {analysis.topLinked.map(p => (
                        <div key={p.slug} className="flex items-center justify-between text-sm py-1.5">
                            <span className="text-gray-300 truncate flex-1">{p.title}</span>
                            <span className="text-emerald-400 font-mono text-xs ml-2">{p.inbound} inbound</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default InternalLinksPage;
