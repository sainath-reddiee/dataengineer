// src/pages/admin/CTRFixerPage.jsx
// CTR Emergency Tool — surfaces articles with high impressions but terrible CTR.
// Uses GSC real data + AI to generate click-optimized title/description variants.

import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertTriangle, Sparkles, RefreshCw, MousePointerClick, Copy, Check, ExternalLink, ArrowRight, Target, Wrench, Globe, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { scoreCtr } from '@/utils/ctrScorer';
import wordpressApi from '@/services/wordpressApi';
import { buildLinkGraph } from '@/utils/linkAnalysis';
import { LinkHealthPanel } from '@/components/admin/LinkHealthPanel';

export function CTRFixerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);

    // Build link graph from articles (memoized)
    const linkGraph = useMemo(() => {
        if (!articles || articles.length === 0) return null;
        return buildLinkGraph(articles);
    }, [articles]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            if (!gscService.isConnected()) {
                setError('Connect Google Search Console first (use the button in Rank Intelligence).');
                setLoading(false);
                return;
            }

            const [gscPages, wpData] = await Promise.all([
                gscService.queryTopPages({ rowLimit: 200 }),
                wordpressApi.getAllPosts(1, 100),
            ]);

            const posts = wpData.posts || [];
            const postMap = {};
            posts.forEach(p => { postMap[p.slug] = p; });

            const matched = gscPages
                .map(row => {
                    const slugMatch = row.page.match(/\/articles\/([^/?#]+)/);
                    if (!slugMatch) return null;
                    const slug = slugMatch[1];
                    const post = postMap[slug];
                    return {
                        slug,
                        title: post?.title || slug,
                        excerpt: post?.metaDescription || post?.excerpt || '',
                        content: post?.content || '',
                        impressions: row.impressions,
                        clicks: row.clicks,
                        ctr: row.ctr,
                        position: row.position,
                        potentialClicks: Math.round(row.impressions * getExpectedCTR(row.position)),
                        clickGap: Math.round(row.impressions * getExpectedCTR(row.position)) - row.clicks,
                    };
                })
                .filter(Boolean)
                .filter(a => a.impressions >= 20)
                .sort((a, b) => b.clickGap - a.clickGap);

            setArticles(matched);
        } catch (e) {
            setError(e.message || 'Failed to load data');
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <MousePointerClick className="w-8 h-8 text-rose-400" />
                        CTR Fixer
                    </h1>
                    <p className="text-gray-400">Find articles with high impressions but low clicks — fix titles to unlock traffic you're already earning.</p>
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
                    <span className="ml-3 text-gray-400">Loading GSC data...</span>
                </div>
            )}

            {!loading && !error && articles.length > 0 && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-red-400">{articles.filter(a => a.ctr < 0.02).length}</div>
                            <div className="text-xs text-gray-400">Articles &lt; 2% CTR</div>
                        </div>
                        <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-amber-400">{articles.reduce((s, a) => s + a.clickGap, 0).toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Missed Clicks (28d)</div>
                        </div>
                        <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">{(articles.reduce((s, a) => s + a.impressions, 0) / 1000).toFixed(1)}k</div>
                            <div className="text-xs text-gray-400">Total Impressions</div>
                        </div>
                    </div>

                    {/* Article List */}
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700">
                            <h3 className="text-sm font-semibold text-white">Articles Sorted by Click Opportunity (biggest gap first)</h3>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {articles.map(article => (
                                <CTRArticleRow
                                    key={article.slug}
                                    article={article}
                                    linkGraph={linkGraph}
                                    expanded={expandedSlug === article.slug}
                                    onToggle={() => setExpandedSlug(expandedSlug === article.slug ? null : article.slug)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}

            {!loading && !error && articles.length === 0 && (
                <div className="text-center text-gray-500 py-12">No data yet. Connect GSC and wait for impressions data.</div>
            )}
        </div>
    );
}

function CTRArticleRow({ article, linkGraph, expanded, onToggle }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [variants, setVariants] = useState(null);
    const [competitors, setCompetitors] = useState(null);
    const [aiError, setAiError] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);

    const ctrColor = article.ctr < 0.02 ? 'text-red-400' : article.ctr < 0.05 ? 'text-amber-400' : 'text-emerald-400';
    const expectedCTR = getExpectedCTR(article.position);
    const ctrGapPercent = ((expectedCTR - article.ctr) * 100).toFixed(1);

    // Analyze current title issues
    const currentScore = scoreCtr({ title: article.title, description: article.excerpt });
    const titleIssues = [];
    if (article.title.length > 60) titleIssues.push('Too long (truncated in SERP)');
    if (article.title.length < 30) titleIssues.push('Too short (wastes SERP real estate)');
    if (!/\d/.test(article.title)) titleIssues.push('No numbers (data attracts clicks)');
    if (!/[:\-\|â€"]/.test(article.title)) titleIssues.push('No separator (harder to scan)');
    if (article.title.toLowerCase() === article.title) titleIssues.push('No capitalization');
    if (!article.excerpt || article.excerpt.length < 80) titleIssues.push('Meta description too short/missing');
    if (article.excerpt && article.excerpt.length > 160) titleIssues.push('Meta description truncated (>160 chars)');

    const handleCopyVariant = (text, idx) => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleAIFix = async () => {
        if (!aiService.isEnabled) {
            alert('AI API key not configured. Set it in the admin sidebar.');
            return;
        }
        setAiLoading(true);
        setAiError('');
        try {
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const contentSnippet = stripHtml(article.content || '').substring(0, 2000);

            // Fetch competitor titles
            let competitorContext = '';
            if (tinyfishService.isEnabled) {
                try {
                    const keyword = article.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 5).join(' ');
                    const searchResults = await tinyfishService.search(keyword);
                    const comps = (searchResults.results || [])
                        .filter(r => !r.url?.includes('dataengineerhub.blog'))
                        .slice(0, 5);
                    if (comps.length > 0) {
                        setCompetitors(comps);
                        competitorContext = `\n\nCOMPETITOR TITLES CURRENTLY RANKING:\n${comps.map((c, i) => `${i + 1}. "${c.title}" — ${c.snippet || ''}`).join('\n')}\n\nBeat these with more compelling, specific titles.`;
                    }
                } catch { /* optional */ }
            }

            const prompt = `You are a CTR optimization specialist. An article has HIGH impressions (${article.impressions}) but VERY LOW CTR (${(article.ctr * 100).toFixed(2)}%) at position #${article.position.toFixed(1)}.

CURRENT:
Title: "${article.title}" (${article.title.length} chars)
Description: "${article.excerpt}" (${(article.excerpt || '').length} chars)
Content: ${contentSnippet.substring(0, 500)}

Expected CTR for position #${Math.round(article.position)} is ~${(expectedCTR * 100).toFixed(1)}%. This article is underperforming by ${ctrGapPercent}%.${competitorContext}

Generate 3 title + description variants using different psychological triggers:

Variant 1 (CURIOSITY): Information gap — make them NEED to know
Variant 2 (SPECIFICITY): Numbers, data, year — concrete value promise
Variant 3 (AUTHORITY): Expert proof, definitive language, social proof

Rules:
- Titles: 50-60 chars, keyword near front, compelling
- Descriptions: 120-155 chars, start with action verb, include benefit
- Keep the core topic/keyword intact
- Match the article's actual content — don't promise things the article doesn't deliver
- Where appropriate, hint at authority sources (e.g., "based on Snowflake docs" in description) for trust signals

Respond in EXACTLY this JSON (no markdown, no code blocks):
{"variants": [{"title": "...", "description": "...", "trigger": "curiosity"}, {"title": "...", "description": "...", "trigger": "specificity"}, {"title": "...", "description": "...", "trigger": "authority"}]}`;

            const response = await aiService.generateSuggestion(prompt, contentSnippet);
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const parsed = JSON.parse(response.substring(firstBrace, lastBrace + 1));
                const scored = (parsed.variants || []).map(v => ({
                    ...v,
                    score: scoreCtr({ title: v.title, description: v.description }).score,
                }));
                setVariants(scored);
            } else {
                setAiError('AI returned no valid suggestions. Try again.');
            }
        } catch (e) {
            setAiError(e.message || 'AI generation failed. Try again.');
        }
        setAiLoading(false);
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            {/* Row header */}
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-5 text-sm text-gray-200 truncate">{article.title}</div>
                <div className="col-span-2 text-center text-xs text-gray-400">{article.impressions.toLocaleString()} imp</div>
                <div className="col-span-1 text-center text-xs text-gray-400">{article.clicks} clk</div>
                <div className={`col-span-1 text-center text-xs font-bold ${ctrColor}`}>{(article.ctr * 100).toFixed(1)}%</div>
                <div className="col-span-1 text-center text-xs text-gray-400">#{article.position.toFixed(1)}</div>
                <div className="col-span-2 text-right text-xs text-emerald-400 font-mono">+{article.clickGap} clicks</div>
            </div>

            {/* Expanded detail panel */}
            {expanded && (
                <div className="px-4 sm:px-6 pb-5 bg-slate-900/40 space-y-4">

                    {/* CTR Gap Explanation */}
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Your CTR</div>
                            <div className={`text-lg font-bold ${ctrColor}`}>{(article.ctr * 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Expected for #{Math.round(article.position)}</div>
                            <div className="text-lg font-bold text-blue-400">{(expectedCTR * 100).toFixed(1)}%</div>
                        </div>
                        <div className="p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">You're Missing</div>
                            <div className="text-lg font-bold text-emerald-400">+{article.clickGap} clicks/mo</div>
                        </div>
                    </div>

                    {/* Current Title/Meta Analysis */}
                    <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Current Title & Meta Analysis</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${currentScore.score >= 70 ? 'bg-emerald-500/20 text-emerald-300' : currentScore.score >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                CTR Score: {currentScore.score}/100
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <div className="text-[10px] text-gray-500">TITLE ({article.title.length} chars)</div>
                                <div className="text-sm text-white font-medium">{article.title}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500">META DESCRIPTION ({(article.excerpt || '').length} chars)</div>
                                <div className="text-xs text-gray-300">{article.excerpt || <span className="text-red-400 italic">Missing — Google generates its own snippet</span>}</div>
                            </div>
                            {titleIssues.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {titleIssues.map((issue, i) => (
                                        <span key={i} className="px-2 py-0.5 text-[10px] bg-red-900/30 text-red-300 border border-red-800/30 rounded">
                                            {issue}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Link Health Panel */}
                    {linkGraph && <LinkHealthPanel article={article} linkGraph={linkGraph} />}

                    {/* Competitor Titles (shown after AI generates, or if already fetched) */}
                    {competitors && competitors.length > 0 && (
                        <div className="p-4 bg-purple-900/10 border border-purple-700/30 rounded-lg">
                            <div className="text-xs font-semibold text-purple-300 uppercase mb-2">Competitor Titles in SERP</div>
                            <div className="space-y-1.5">
                                {competitors.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className="text-gray-600 shrink-0">#{i + 1}</span>
                                        <div className="min-w-0">
                                            <div className="text-white truncate">{c.title}</div>
                                            <div className="text-gray-500 truncate">{c.snippet}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <button
                            onClick={handleAIFix}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-xs bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg"
                        >
                            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {aiLoading ? 'Generating...' : 'AI: Generate Click-Optimized Variants'}
                        </button>
                    </div>

                    {aiError && (
                        <div className="text-xs text-red-400 p-2 bg-red-900/10 border border-red-800/30 rounded-lg">{aiError}</div>
                    )}

                    {/* AI Variants with per-variant copy */}
                    {variants && (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI-Generated Variants (scored by CTR potential)</div>
                            {variants.sort((a, b) => b.score - a.score).map((v, i) => (
                                <div key={i} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] uppercase text-purple-300 font-bold">{v.trigger}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                v.score >= 70 ? 'bg-emerald-500/20 text-emerald-300' :
                                                v.score >= 50 ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}>Score: {v.score}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-white font-medium">{v.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">{v.description}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-[10px] text-gray-600">
                                            Title: {v.title.length} chars · Desc: {v.description.length} chars
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleCopyVariant(v.title, `title-${i}`)}
                                                className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1"
                                            >
                                                {copiedIdx === `title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedIdx === `title-${i}` ? 'Copied!' : 'Title'}
                                            </button>
                                            <button
                                                onClick={() => handleCopyVariant(v.description, `desc-${i}`)}
                                                className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1"
                                            >
                                                {copiedIdx === `desc-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedIdx === `desc-${i}` ? 'Copied!' : 'Meta'}
                                            </button>
                                            <button
                                                onClick={() => handleCopyVariant(`${v.title}\n${v.description}`, `both-${i}`)}
                                                className="px-2 py-1 text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1"
                                            >
                                                {copiedIdx === `both-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedIdx === `both-${i}` ? 'Copied!' : 'Both'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cross-links to other tools */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
                        <Link to={`/admin/keyword-target?slug=${article.slug}`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Target className="w-3 h-3" /> Keyword Target
                        </Link>
                        <Link to={`/admin/article-fixer`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Article Fixer
                        </Link>
                        <Link to={`/admin/snippet-optimizer?slug=${article.slug}`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Snippet Optimizer
                        </Link>
                        <Link to={`/admin/serp-intelligence`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Globe className="w-3 h-3" /> SERP Intel
                        </Link>
                        <a href={`https://dataengineerhub.blog/articles/${article.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View Article
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// Expected CTR by position (industry averages from Advanced Web Ranking 2024)
function getExpectedCTR(position) {
    const ctrByPosition = [0, 0.28, 0.15, 0.11, 0.08, 0.06, 0.045, 0.035, 0.03, 0.025, 0.02];
    const pos = Math.max(1, Math.min(10, Math.round(position)));
    if (pos <= 10) return ctrByPosition[pos];
    if (pos <= 20) return 0.01;
    return 0.005;
}

export default CTRFixerPage;
