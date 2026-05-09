// src/pages/admin/ArticleOptimizerPage.jsx
// Unified single-article optimization dashboard — runs CTR scoring, GSC keyword
// analysis, and content optimization in parallel, then displays a consolidated
// health score with prioritized actions.

import React, { useEffect, useState, useMemo } from 'react';
import {
    Loader2, AlertTriangle, Sparkles, Copy, Check, BarChart3,
    TrendingUp, FileText, Target, Zap, ArrowRight, RefreshCw,
    MousePointerClick, Eye, BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import gscService from '@/services/gscService';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';
import contentOptimizerService from '@/services/contentOptimizerService';
import { scoreCtr } from '@/utils/ctrScorer';

function getScoreColor(score) {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
}

function getScoreGradient(score) {
    if (score >= 70) return 'from-emerald-400 to-teal-500';
    if (score >= 40) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-pink-500';
}

function getScoreBg(score) {
    if (score >= 70) return 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    if (score >= 40) return 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    return 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30';
}

function getPriorityBadge(priority) {
    const colors = {
        HIGH: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
        MEDIUM: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
        LOW: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
    };
    return colors[priority] || colors.MEDIUM;
}

function DimensionCard({ icon: Icon, title, score, subtitle, color }) {
    return (
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-gray-400">{title}</span>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}
                <span className="text-lg text-gray-500">/100</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

export function ArticleOptimizerPage() {
    const [searchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [postsLoading, setPostsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Analysis results
    const [ctrResult, setCtrResult] = useState(null);
    const [gscKeywords, setGscKeywords] = useState([]);
    const [contentResult, setContentResult] = useState(null);

    // AI fixes
    const [fixesLoading, setFixesLoading] = useState(false);
    const [fixes, setFixes] = useState(null);
    const [copied, setCopied] = useState(false);
    const [fixesExpanded, setFixesExpanded] = useState(false);

    const slugParam = searchParams.get('slug') || '';

    // Load posts on mount
    useEffect(() => {
        async function fetchPosts() {
            setPostsLoading(true);
            try {
                const wpData = await wordpressApi.getAllPosts(1, 100);
                setPosts(wpData.posts || []);
            } catch (e) {
                setError('Failed to load articles: ' + e.message);
            }
            setPostsLoading(false);
        }
        fetchPosts();
    }, []);

    // Auto-select from URL param
    useEffect(() => {
        if (slugParam && posts.length > 0) {
            const match = posts.find(p => p.slug === slugParam);
            if (match) setSelectedSlug(slugParam);
        }
    }, [slugParam, posts]);

    // Run analysis when article changes
    useEffect(() => {
        if (selectedSlug) runAnalysis(selectedSlug);
    }, [selectedSlug]);

    async function runAnalysis(slug) {
        setLoading(true);
        setError('');
        setCtrResult(null);
        setGscKeywords([]);
        setContentResult(null);
        setFixes(null);

        const post = posts.find(p => p.slug === slug);
        if (!post) {
            setError('Article not found');
            setLoading(false);
            return;
        }

        const articleUrl = `https://dataengineerhub.blog/articles/${slug}`;

        try {
            // Run all analyses in parallel
            const promises = [
                // Content analysis
                contentOptimizerService.analyzeURL(articleUrl).catch(e => ({ success: false, error: e.message })),
            ];

            // GSC keywords (only if connected)
            if (gscService.isConnected()) {
                promises.push(
                    gscService.queryTopKeywords({ url: articleUrl, rowLimit: 50 }).catch(() => [])
                );
            } else {
                promises.push(Promise.resolve([]));
            }

            const [contentAnalysis, keywords] = await Promise.all(promises);

            setGscKeywords(keywords);

            // Content result
            if (contentAnalysis.success) {
                setContentResult(contentAnalysis.data);
            }

            // CTR score (uses keywords if available)
            const ctr = scoreCtr({
                title: post.title,
                description: post.metaDescription || post.excerpt || '',
                gscKeywords: keywords.length > 0 ? keywords : null,
            });
            setCtrResult(ctr);
        } catch (e) {
            setError(e.message || 'Analysis failed');
        }
        setLoading(false);
    }

    // Compute dimension scores
    const dimensions = useMemo(() => {
        if (!ctrResult && !contentResult) return null;

        const ctrScore = ctrResult?.score || 0;
        const aiVisScore = contentResult?.aiVisibility?.score || 0;

        // Keyword coverage: how many of top 10 GSC keywords appear in title + content
        const post = posts.find(p => p.slug === selectedSlug);
        let kwCoverage = 0;
        if (gscKeywords.length > 0 && post) {
            const text = (post.title + ' ' + (post.content || '')).toLowerCase();
            const top10 = gscKeywords.slice(0, 10);
            const found = top10.filter(kw => text.includes(kw.query.toLowerCase()));
            kwCoverage = Math.round((found.length / Math.max(top10.length, 1)) * 100);
        }

        // Content depth score
        const wordCount = contentResult?.wordCount || 0;
        let depthScore = 0;
        if (wordCount >= 2000) depthScore = 90;
        else if (wordCount >= 1500) depthScore = 75;
        else if (wordCount >= 1000) depthScore = 55;
        else if (wordCount >= 500) depthScore = 35;
        else depthScore = 15;

        const overall = Math.round((ctrScore + aiVisScore + kwCoverage + depthScore) / 4);

        return { ctrScore, aiVisScore, kwCoverage, depthScore, overall };
    }, [ctrResult, contentResult, gscKeywords, posts, selectedSlug]);

    // Build prioritized action list
    const actions = useMemo(() => {
        const list = [];

        // CTR quick wins
        if (ctrResult?.quickWins) {
            ctrResult.quickWins.forEach(win => {
                list.push({
                    priority: 'HIGH',
                    category: 'CTR',
                    issue: win.label,
                    lift: win.lift,
                    link: `/admin/ctr-fixer?slug=${selectedSlug}`,
                    tool: 'CTR Fixer',
                });
            });
        }

        // Content optimizer recommendations
        if (contentResult?.recommendations) {
            contentResult.recommendations.forEach(rec => {
                list.push({
                    priority: rec.priority || 'MEDIUM',
                    category: 'Content',
                    issue: rec.issue,
                    lift: rec.impact || '',
                    link: `/admin/content-optimizer?slug=${selectedSlug}`,
                    tool: 'Content Optimizer',
                });
            });
        }

        // Keyword coverage action
        if (dimensions && dimensions.kwCoverage < 50 && gscKeywords.length > 0) {
            list.push({
                priority: 'MEDIUM',
                category: 'Keywords',
                issue: `Only ${dimensions.kwCoverage}% of top GSC keywords appear in content`,
                lift: '+10-15%',
                link: `/admin/keyword-injector`,
                tool: 'Keyword Injector',
            });
        }

        // Sort by priority
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        list.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));

        return list;
    }, [ctrResult, contentResult, dimensions, gscKeywords, selectedSlug]);

    async function generateAllFixes() {
        if (!aiService.isEnabled) {
            setFixes('AI API key not configured. Set it in the admin sidebar.');
            setFixesExpanded(true);
            return;
        }

        setFixesLoading(true);
        const post = posts.find(p => p.slug === selectedSlug);

        const issuesList = actions.slice(0, 10).map((a, i) =>
            `${i + 1}. [${a.priority}] ${a.category}: ${a.issue}`
        ).join('\n');

        const prompt = `You are an SEO content specialist. An article has been analyzed and multiple issues were found. Generate a COMPREHENSIVE FIX PACKAGE addressing all issues at once.

ARTICLE:
Title: ${post?.title || selectedSlug}
Slug: ${selectedSlug}
Word Count: ${contentResult?.wordCount || 'unknown'}
CTR Score: ${ctrResult?.score || 'N/A'}/100
AI Visibility: ${contentResult?.aiVisibility?.score || 'N/A'}%

ISSUES FOUND:
${issuesList}

TOP GSC KEYWORDS: ${gscKeywords.slice(0, 5).map(k => k.query).join(', ') || 'N/A'}

Generate a READY-TO-IMPLEMENT fix package. For each issue, provide the specific fix (new title, added paragraph, schema markup, etc.). Be concise but actionable.

Format:
---
FIX 1: [Issue category]
[The actual fix content — ready to paste]

FIX 2: [Issue category]
[The actual fix content]
...
---`;

        try {
            const result = await aiService.generateSuggestion(prompt, '');
            setFixes(result);
            setFixesExpanded(true);
        } catch (e) {
            setFixes(`Error: ${e.message}`);
            setFixesExpanded(true);
        }
        setFixesLoading(false);
    }

    const handleCopy = () => {
        if (fixes) {
            navigator.clipboard.writeText(fixes);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-blue-400" />
                        Article Optimizer
                    </h1>
                    <p className="text-gray-400">
                        Unified health dashboard — CTR, AI visibility, keywords, and content depth in one view.
                    </p>
                </div>
                {selectedSlug && (
                    <button
                        onClick={() => runAnalysis(selectedSlug)}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Re-analyze
                    </button>
                )}
            </div>

            {/* Article selector */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-4">
                <label className="text-xs text-gray-400 block mb-2">Select Article</label>
                {postsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading articles...
                    </div>
                ) : (
                    <select
                        value={selectedSlug}
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    >
                        <option value="">Choose an article...</option>
                        {posts.map(p => (
                            <option key={p.slug} value={p.slug}>{p.title}</option>
                        ))}
                    </select>
                )}
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {!gscService.isConnected() && selectedSlug && (
                <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl flex items-center gap-2 text-blue-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> GSC not connected — keyword coverage unavailable. Connect GSC for full analysis.
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-40 gap-3">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-gray-400">Running all analyses in parallel...</span>
                </div>
            )}

            {/* Results */}
            {!loading && dimensions && (
                <div className="space-y-6">
                    {/* Overall health score */}
                    <div className={`rounded-2xl p-6 border ${getScoreBg(dimensions.overall)}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Target className="w-6 h-6 text-blue-400" />
                                    Overall Health Score
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Average across all optimization dimensions</p>
                            </div>
                            <div className={`text-6xl font-black bg-gradient-to-r ${getScoreGradient(dimensions.overall)} bg-clip-text text-transparent`}>
                                {dimensions.overall}
                                <span className="text-3xl">/100</span>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(dimensions.overall)} transition-all duration-1000`}
                                style={{ width: `${dimensions.overall}%` }}
                            />
                        </div>
                    </div>

                    {/* Dimension cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DimensionCard
                            icon={MousePointerClick}
                            title="CTR Score"
                            score={dimensions.ctrScore}
                            subtitle={`Grade: ${ctrResult?.grade || '?'}`}
                            color="text-blue-400"
                        />
                        <DimensionCard
                            icon={Eye}
                            title="AI Visibility"
                            score={dimensions.aiVisScore}
                            subtitle="Citation probability"
                            color="text-purple-400"
                        />
                        <DimensionCard
                            icon={TrendingUp}
                            title="Keyword Coverage"
                            score={dimensions.kwCoverage}
                            subtitle={`${gscKeywords.length} keywords tracked`}
                            color="text-emerald-400"
                        />
                        <DimensionCard
                            icon={BookOpen}
                            title="Content Depth"
                            score={dimensions.depthScore}
                            subtitle={`${contentResult?.wordCount || 0} words`}
                            color="text-amber-400"
                        />
                    </div>

                    {/* Prioritized actions */}
                    {actions.length > 0 && (
                        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Prioritized Actions
                            </h3>
                            <div className="space-y-3">
                                {actions.map((action, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(action.priority)}`}>
                                            {action.priority}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-gray-300">
                                            {action.category}
                                        </span>
                                        <span className="text-sm text-gray-300 flex-1 truncate">{action.issue}</span>
                                        {action.lift && (
                                            <span className="text-xs text-emerald-400">{action.lift}</span>
                                        )}
                                        <Link
                                            to={action.link}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 flex-shrink-0"
                                        >
                                            {action.tool} <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate All Fixes */}
                    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-pink-400" />
                                    AI Fix Package
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Generate ready-to-paste fixes for all issues at once</p>
                            </div>
                            <button
                                onClick={generateAllFixes}
                                disabled={fixesLoading || actions.length === 0}
                                className="px-5 py-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white flex items-center gap-2 font-medium"
                            >
                                {fixesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {fixesLoading ? 'Generating...' : 'Generate All Fixes'}
                            </button>
                        </div>

                        {fixes && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => setFixesExpanded(!fixesExpanded)}
                                        className="text-xs text-gray-400 flex items-center gap-1"
                                    >
                                        {fixesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        {fixesExpanded ? 'Hide' : 'Show'} generated fixes
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied!' : 'Copy All'}
                                    </button>
                                </div>
                                {fixesExpanded && (
                                    <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto leading-relaxed">
                                        {fixes}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!loading && !selectedSlug && !postsLoading && (
                <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-lg">Select an article to analyze</p>
                    <p className="text-sm mt-1">Choose from the dropdown above or navigate here with ?slug= parameter.</p>
                </div>
            )}

            {/* Info footer */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong>{' '}
                Runs CTR scoring, AI visibility analysis, keyword coverage check, and content depth
                assessment in parallel. Combines all findings into a single prioritized action list
                with direct links to each specialized tool. "Generate All Fixes" produces a ready-to-paste
                fix package using AI.
            </div>
        </div>
    );
}

export default ArticleOptimizerPage;
