// src/pages/admin/CompetitorGapPage.jsx
// Compare your article against any competitor URL â€” AI-powered gap analysis.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, AlertTriangle, Sparkles, TrendingUp, FileText } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { analyzeCompetitorGap } from '@/services/competitorAnalyzer';
import aiService from '@/services/aiService';

export function CompetitorGapPage() {
    const [articles, setArticles] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [competitorUrl, setCompetitorUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [geminiEnabled, setGeminiEnabled] = useState(aiService.isEnabled);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                setArticles((data.posts || []).map(p => ({ slug: p.slug, title: p.title })));
            } catch { /* ignore */ }
            setLoadingArticles(false);
        }
        load();
    }, []);

    // Poll gemini state every 2s so button enables when key is set
    useEffect(() => {
        const interval = setInterval(() => {
            setGeminiEnabled(aiService.isEnabled);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyze = async () => {
        if (!selectedSlug || !competitorUrl) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            // Fetch full article content
            const data = await fetch(`https://app.dataengineerhub.blog/wp-json/wp/v2/posts?slug=${encodeURIComponent(selectedSlug)}&_fields=slug,title,content,excerpt`);
            if (!data.ok) throw new Error(`WordPress API returned HTTP ${data.status}`);
            const posts = await data.json();
            if (!Array.isArray(posts) || !posts.length) throw new Error('Article not found');

            const yourArticle = {
                slug: posts[0].slug,
                title: posts[0].title.rendered.replace(/<[^>]*>/g, ''),
                content: posts[0].content.rendered,
                excerpt: posts[0].excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            };

            let url = competitorUrl.trim();
            if (!url.startsWith('http')) url = 'https://' + url;

            const analysis = await analyzeCompetitorGap(url, yourArticle);
            setResult(analysis);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Users className="w-8 h-8 text-orange-400" />
                    Competitor Gap Analyzer
                </h1>
                <p className="text-gray-400">Paste any competitor URL and see exactly what they cover that you don't â€” AI-powered.</p>
            </div>

            {!geminiEnabled && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-300 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>AI API key required.</strong> Select a provider and enter the key in the sidebar.
                    </div>
                </div>
            )}

            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Your Article</label>
                    <select
                        value={selectedSlug}
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    >
                        <option value="">
                            {loadingArticles ? 'Loading...' : 'Select one of your articles'}
                        </option>
                        {articles.map(a => (
                            <option key={a.slug} value={a.slug}>{a.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Competitor URL</label>
                    <input
                        type="url"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="https://medium.com/@author/article-slug"
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedSlug || !competitorUrl || loading || !geminiEnabled}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Analyze Gap'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Side-by-side stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatsCard label="Your Article" stats={result.yours} highlight="blue" />
                        <StatsCard label="Competitor" stats={result.competitor} highlight="orange" url={result.competitor.url} />
                    </div>

                    {/* AI Gap Analysis */}
                    <div className="p-4 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-800/30 rounded-xl">
                        <h3 className="text-sm font-semibold text-orange-300 flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4" /> AI Gap Analysis
                        </h3>
                        <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {result.aiGapAnalysis}
                        </div>
                    </div>

                    {/* Competitor Headings for reference */}
                    {result.competitor.h2?.length > 0 && (
                        <details className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <summary className="text-sm font-semibold text-white cursor-pointer">
                                Competitor H2 Headings ({result.competitor.h2.length})
                            </summary>
                            <div className="mt-3 space-y-1">
                                {result.competitor.h2.map((h, i) => (
                                    <div key={i} className="text-sm text-gray-300 pl-4">â€¢ {h}</div>
                                ))}
                            </div>
                        </details>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function StatsCard({ label, stats, highlight = 'blue', url = null }) {
    const colors = {
        blue: 'border-blue-500/30 bg-blue-900/10',
        orange: 'border-orange-500/30 bg-orange-900/10',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[highlight]}`}>
            <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
            </div>
            <div className="text-sm font-semibold text-white truncate mb-2" title={stats.title}>
                {stats.title || '(no title)'}
            </div>
            {url && (
                <a href={url} target="_blank" rel="noopener" className="text-[11px] text-orange-300 hover:text-orange-200 truncate block mb-2">
                    {url}
                </a>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
                <Stat label="Words" value={stats.wordCount} />
                <Stat label="H2s" value={stats.h2?.length || 0} />
                <Stat label="H3s" value={stats.h3?.length || 0} />
                <Stat label="Images" value={stats.images} />
                <Stat label="Tables" value={stats.tables} />
                <Stat label="Code" value={stats.codeBlocks} />
                <Stat label="Internal" value={stats.internalLinks} />
                <Stat label="External" value={stats.externalLinks} />
            </div>
            {stats.schemas?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Schema Types</div>
                    <div className="flex flex-wrap gap-1">
                        {stats.schemas.map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-gray-300 rounded">{s}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-[10px] text-gray-500 uppercase">{label}</div>
        </div>
    );
}

export default CompetitorGapPage;
