// src/pages/admin/ArticleFixerPage.jsx
// Batch Article Fixer â€” analyzes all articles against focus keyphrases,
// uses GSC performance data for smart prioritization, and generates ready-to-paste AI fixes.

import React, { useEffect, useState, useMemo } from 'react';
import {
    Wrench, Loader2, AlertTriangle, Sparkles, RefreshCw, Copy, Check,
    ChevronDown, ChevronRight, Target, TrendingUp, MousePointerClick,
    Zap, BarChart3,
} from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { buildLinkGraph } from '@/utils/linkAnalysis';
import { LinkHealthPanel } from '@/components/admin/LinkHealthPanel';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { useMountedRef } from '@/hooks/useMountedRef';
import { AIOutputSections } from '@/components/admin/AIOutputSections';

// Expected CTR by position (Google averages)
function getExpectedCTR(pos) {
    const rates = [0.32, 0.24, 0.18, 0.12, 0.08, 0.05, 0.04, 0.03, 0.025, 0.02];
    const p = Math.max(1, Math.min(10, Math.round(pos))) - 1;
    return rates[p] || 0.015;
}

// Lightweight inline keyword analysis
function quickAnalyze(keyword, article) {
    if (!keyword || !article) return null;
    const kw = keyword.toLowerCase().trim();
    const kwWords = kw.split(/\s+/);
    const title = (article.title || '').toLowerCase();
    const slug = (article.slug || '').toLowerCase();
    const content = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    const metaDesc = (article.metaDescription || article.excerpt || '').toLowerCase();
    const firstParagraph = content.substring(0, 500);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    const h2s = (article.content || '').match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
    const headings = h2s.map(h => h.replace(/<[^>]*>/g, '').toLowerCase());
    const imgAlts = ((article.content || '').match(/alt=["']([^"']+)["']/gi) || []).map(a => a.replace(/alt=["']/i, '').replace(/["']$/, '').toLowerCase());

    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const occurrences = (content.match(kwRegex) || []).length;
    const density = wordCount > 0 ? ((occurrences * kwWords.length) / wordCount) * 100 : 0;

    const checks = {
        title: title.includes(kw),
        meta: metaDesc.includes(kw),
        slug: kwWords.every(w => w.length <= 3 || slug.includes(w)),
        firstPara: firstParagraph.includes(kw),
        headings: headings.some(h => h.includes(kw)),
        imgAlt: imgAlts.some(a => a.includes(kw)),
        density: density >= 0.5 && density <= 2.5,
    };

    const passedCount = Object.values(checks).filter(Boolean).length;
    const score = Math.round((passedCount / 7) * 100);

    const failedList = [];
    if (!checks.title) failedList.push('title');
    if (!checks.meta) failedList.push('meta description');
    if (!checks.slug) failedList.push('URL slug');
    if (!checks.firstPara) failedList.push('first paragraph');
    if (!checks.headings) failedList.push('subheadings');
    if (!checks.imgAlt) failedList.push('image alt');
    if (!checks.density) failedList.push(density < 0.5 ? 'density (too low)' : 'density (too high)');

    return { keyword: kw, score, passedCount, failedList, density, wordCount, checks };
}

const SORT_MODES = [
    { id: 'ctr-gap', label: 'CTR Gap', icon: MousePointerClick, desc: 'High impressions + low CTR' },
    { id: 'striking', label: 'Striking Distance', icon: Target, desc: 'Position 5-20 (almost page 1)' },
    { id: 'impressions', label: 'Top Impressions', icon: BarChart3, desc: 'Most-seen articles' },
    { id: 'score', label: 'Worst Score', icon: Wrench, desc: 'Lowest keyword targeting' },
];

export function ArticleFixerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);
    const [progress, setProgress] = useState('');
    const [sortMode, setSortMode] = useState('ctr-gap');
    const [batchFixing, setBatchFixing] = useState(false);
    const [batchResult, setBatchResult] = useState('');
    const mounted = useMountedRef();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        if (!mounted.current) return;
        setLoading(true);
        setError('');
        setArticles([]);
        setBatchResult('');
        try {
            setProgress('Fetching articles...');
            const wpData = await wordpressApi.getAllPosts(1, 100);
            if (!mounted.current) return;
            const posts = wpData.posts || [];
            if (posts.length === 0) { setError('No articles found.'); setLoading(false); return; }

            // Get GSC page-level performance data + keywords
            let gscPages = {};
            let gscMap = {};
            if (gscService.isConnected()) {
                setProgress('Fetching GSC performance data...');
                try {
                    // Page-level metrics (impressions, clicks, CTR, position)
                    const pages = await gscService.queryTopPages({ rowLimit: 200 });
                    if (!mounted.current) return;
                    pages.forEach(p => {
                        const slugMatch = p.page.match(/\/articles\/([^/?#]+)/);
                        if (slugMatch) gscPages[slugMatch[1]] = p;
                    });

                    // Fetch per-article keywords for top 20
                    const topSlugs = Object.keys(gscPages)
                        .sort((a, b) => (gscPages[b]?.impressions || 0) - (gscPages[a]?.impressions || 0))
                        .slice(0, 20);

                    for (let i = 0; i < topSlugs.length; i++) {
                        if (!mounted.current) return;
                        setProgress(`Fetching keywords ${i + 1}/${topSlugs.length}...`);
                        try {
                            const kws = await gscService.queryTopKeywords({
                                url: `https://dataengineerhub.blog/articles/${topSlugs[i]}`,
                                rowLimit: 5,
                            });
                            if (!mounted.current) return;
                            if (kws.length > 0) {
                                gscMap[topSlugs[i]] = kws.sort((a, b) => b.impressions - a.impressions);
                            }
                        } catch { /* skip */ }
                    }
                } catch (e) {
                    console.warn('GSC fetch failed:', e.message);
                }
            }

            if (!mounted.current) return;
            setProgress('Analyzing articles...');

            // Analyze each article with GSC data
            const analyzed = posts.map(post => {
                const gscKws = gscMap[post.slug] || [];
                const gscPerf = gscPages[post.slug] || null;
                const focusKeyword = gscKws.length > 0
                    ? gscKws[0].query
                    : post.slug.replace(/-/g, ' ').replace(/\d{4}$/, '').trim();

                const result = quickAnalyze(focusKeyword, post);

                // Calculate opportunity metrics
                const impressions = gscPerf?.impressions || 0;
                const clicks = gscPerf?.clicks || 0;
                const ctr = gscPerf?.ctr || 0;
                const position = gscPerf?.position || 0;
                const expectedCTR = position > 0 ? getExpectedCTR(position) : 0;
                const missedClicks = Math.max(0, Math.round(impressions * expectedCTR) - clicks);
                const ctrGap = expectedCTR > 0 ? Math.max(0, expectedCTR - ctr) : 0;

                return {
                    ...post,
                    focusKeyword,
                    gscKeywords: gscKws,
                    analysis: result,
                    score: result?.score || 0,
                    impressions,
                    clicks,
                    ctr,
                    position,
                    missedClicks,
                    ctrGap,
                    // Priority score (0-100): combines keyword score gap + CTR opportunity + position potential
                    priority: Math.round(
                        (100 - (result?.score || 0)) * 0.3 +
                        Math.min(100, missedClicks / 5) * 0.4 +
                        (position >= 5 && position <= 20 ? 80 : position > 0 && position <= 5 ? 30 : 0) * 0.3
                    ),
                };
            });

            setArticles(analyzed);
        } catch (e) {
            if (mounted.current) setError(e.message || 'Failed to load data');
        }
        if (!mounted.current) return;
        setLoading(false);
        setProgress('');
    }

    // Build link graph from articles for link health analysis
    const linkGraph = useMemo(() => {
        if (!articles || articles.length === 0) return null;
        return buildLinkGraph(articles);
    }, [articles]);

    // Sort articles based on selected mode
    const sortedArticles = useMemo(() => {
        const arr = [...articles];
        switch (sortMode) {
            case 'ctr-gap':
                arr.sort((a, b) => b.missedClicks - a.missedClicks);
                break;
            case 'striking':
                arr.sort((a, b) => {
                    const aStriking = a.position >= 5 && a.position <= 20 ? 1 : 0;
                    const bStriking = b.position >= 5 && b.position <= 20 ? 1 : 0;
                    if (bStriking !== aStriking) return bStriking - aStriking;
                    return a.position - b.position;
                });
                break;
            case 'impressions':
                arr.sort((a, b) => b.impressions - a.impressions);
                break;
            case 'score':
            default:
                arr.sort((a, b) => a.score - b.score);
                break;
        }
        return arr;
    }, [articles, sortMode]);

    // Stats
    const totalMissedClicks = articles.reduce((s, a) => s + a.missedClicks, 0);
    const strikingCount = articles.filter(a => a.position >= 5 && a.position <= 20).length;
    const avgCTR = articles.filter(a => a.ctr > 0).length > 0
        ? (articles.filter(a => a.ctr > 0).reduce((s, a) => s + a.ctr, 0) / articles.filter(a => a.ctr > 0).length * 100).toFixed(1)
        : 'â€”';
    const needsWork = articles.filter(a => a.score < 70).length;

    // Batch fix top 5
    const handleBatchFix = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        setBatchFixing(true);
        setBatchResult('');
        const top5 = sortedArticles.filter(a => a.score < 85).slice(0, 5);
        let combined = '';

        for (let i = 0; i < top5.length; i++) {
            const article = top5[i];
            setProgress(`Generating fix ${i + 1}/5: ${article.title.substring(0, 30)}...`);

            try {
                let competitorContext = '';
                if (tinyfishService.isEnabled && article.focusKeyword) {
                    try {
                        const results = await tinyfishService.search(article.focusKeyword);
                        const top3 = (results.results || []).filter(r => !r.url?.includes('dataengineerhub.blog')).slice(0, 3);
                        if (top3.length > 0) {
                            competitorContext = `\nTOP COMPETITORS: ${top3.map(r => `"${r.title}"`).join(', ')}\n`;
                        }
                    } catch { /* optional */ }
                }

                const failedStr = (article.analysis?.failedList || []).join(', ');
                const articleText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const prompt = `Fix this article for "${article.focusKeyword}" (score: ${article.score}/100, position: #${article.position?.toFixed(1) || '?'}, CTR: ${(article.ctr * 100).toFixed(1)}%).
Title: "${article.title}"
Failed: ${failedStr || 'none'}
${competitorContext}
Generate CONCISELY (match the article's existing voice and technical style):
1. TITLE (50-60 chars, keyphrase front): 1 best option
2. META (120-155 chars): 1 best option
3. FIRST PARAGRAPH (2 sentences with keyphrase, grounded in the actual article topic)
4. Add "Updated May 2026" freshness notice

Be specific. Include "${article.focusKeyword}" naturally. Base ALL suggestions on the article content below.`;

                const response = await aiService.generateSuggestion(prompt, articleText.substring(0, 8000));
                combined += `\n${'â•'.repeat(60)}\nðŸ“ ${article.title}\n   URL: /articles/${article.slug}\n   Score: ${article.score}/100 | Position: #${article.position?.toFixed(1) || '?'} | Missed clicks: ${article.missedClicks}\n${'â”€'.repeat(60)}\n${response}\n`;
            } catch (e) {
                combined += `\n${'â•'.repeat(60)}\nðŸ“ ${article.title}\n   ERROR: ${e.message}\n`;
            }
        }

        setBatchResult(combined);
        setBatchFixing(false);
        setProgress('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Wrench className="w-8 h-8 text-orange-400" />
                        Article Fixer
                    </h1>
                    <p className="text-gray-400">Prioritize articles by real traffic opportunity â€” fix what matters most.</p>
                </div>
                <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2">
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
                    <span className="ml-3 text-gray-400">{progress || 'Loading...'}</span>
                </div>
            )}

            {!loading && articles.length > 0 && (
                <>
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-red-400">+{totalMissedClicks.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400 mt-1">Missed Clicks/Month</div>
                            <div className="text-[9px] text-gray-600">(if CTR matched position)</div>
                        </div>
                        <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-amber-400">{strikingCount}</div>
                            <div className="text-[10px] text-gray-400 mt-1">Striking Distance</div>
                            <div className="text-[9px] text-gray-600">(position 5-20)</div>
                        </div>
                        <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-blue-400">{avgCTR}%</div>
                            <div className="text-[10px] text-gray-400 mt-1">Average CTR</div>
                            <div className="text-[9px] text-gray-600">(across all articles)</div>
                        </div>
                        <div className="p-4 bg-purple-900/20 border border-purple-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-purple-400">{needsWork}</div>
                            <div className="text-[10px] text-gray-400 mt-1">Need Keyword Fixes</div>
                            <div className="text-[9px] text-gray-600">(score &lt; 70%)</div>
                        </div>
                    </div>

                    {/* Sort Mode + Batch Fix */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-1.5 bg-slate-800/50 p-1 rounded-lg">
                            {SORT_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSortMode(mode.id)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-medium flex items-center gap-1.5 transition-all ${
                                        sortMode === mode.id
                                            ? 'bg-blue-600/30 text-white border border-blue-500/40'
                                            : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                    title={mode.desc}
                                >
                                    <mode.icon className="w-3 h-3" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleBatchFix}
                            disabled={batchFixing}
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
                        >
                            {batchFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            {batchFixing ? progress || 'Generating...' : 'Batch Fix Top 5'}
                        </button>
                    </div>

                    {/* Batch Result */}
                    {batchResult && (
                        <div className="bg-gradient-to-br from-orange-900/20 to-rose-900/20 border border-orange-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-orange-300 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Batch Fixes (Top 5 Priority Articles)
                                </span>
                            </div>
                            <AIOutputSections text={batchResult} />
                        </div>
                    )}

                    {/* Article List */}
                    <div className="space-y-2">
                        {sortedArticles.map(article => (
                            <ArticleRow
                                key={article.slug}
                                article={article}
                                linkGraph={linkGraph}
                                expanded={expandedSlug === article.slug}
                                onToggle={() => setExpandedSlug(expandedSlug === article.slug ? null : article.slug)}
                            />
                        ))}
                    </div>
                </>
            )}

            {!loading && !error && articles.length === 0 && (
                <div className="text-center text-gray-500 py-12">No articles found.</div>
            )}
        </div>
    );
}

function ArticleRow({ article, linkGraph, expanded, onToggle }) {
    const [fixing, setFixing] = useState(false);
    const [fix, setFix] = useState(null);

    const scoreColor = article.score >= 70 ? 'text-emerald-400' : article.score >= 40 ? 'text-amber-400' : 'text-red-400';
    const scoreBg = article.score >= 70 ? 'bg-emerald-500/20' : article.score >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20';
    const posColor = article.position <= 3 ? 'text-emerald-400' : article.position <= 10 ? 'text-blue-400' : article.position <= 20 ? 'text-amber-400' : 'text-gray-500';

    const handleGenerateFix = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        setFixing(true);
        try {
            let competitorContext = '';
            if (tinyfishService.isEnabled && article.focusKeyword) {
                try {
                    const results = await tinyfishService.search(article.focusKeyword);
                    const top5 = (results.results || []).filter(r => !r.url?.includes('dataengineerhub.blog')).slice(0, 5);
                    if (top5.length > 0) {
                        competitorContext = `\nCURRENT TOP SERP RESULTS FOR "${article.focusKeyword}":\n${top5.map((r, i) => `${i + 1}. "${r.title}" â€” ${r.snippet || ''}`).join('\n')}\n`;
                    }
                } catch { /* optional */ }
            }

            const failedStr = (article.analysis?.failedList || []).join(', ');
            const prompt = `You are a senior SEO content specialist. Fix this article for the focus keyphrase "${article.focusKeyword}".

CURRENT STATE:
- Title: "${article.title}"
- Meta/Excerpt: "${article.metaDescription || article.excerpt || '(none)'}"
- URL: /articles/${article.slug}
- Word count: ${article.analysis?.wordCount || 'unknown'}
- Keyword score: ${article.score}/100
- GSC Position: #${article.position?.toFixed(1) || '?'}
- CTR: ${(article.ctr * 100).toFixed(2)}% (expected ${(getExpectedCTR(article.position) * 100).toFixed(1)}% for this position)
- Impressions: ${article.impressions.toLocaleString()} | Missed clicks: ${article.missedClicks}
- FAILED CHECKS: ${failedStr || 'none'}
- Keyword density: ${article.analysis?.density?.toFixed(2) || '?'}%
${competitorContext}
GENERATE THESE FIXES (ready to copy-paste into WordPress):

1. **OPTIMIZED TITLE** (50-60 chars, keyphrase near front, compelling, with number/power word):
   Write 2 options.

2. **OPTIMIZED META DESCRIPTION** (120-155 chars, starts with action verb, includes keyphrase, ends with benefit):
   Write 2 options.

3. **OPTIMIZED FIRST PARAGRAPH** (2-3 sentences, keyphrase in first sentence, sets up the article's value):
   Write 1 version.

4. **H2 HEADINGS WITH KEYPHRASE** (suggest 3 natural H2 headings that include "${article.focusKeyword}" or close variants):

5. **IMAGE ALT TEXT** (2 suggestions containing the keyphrase):

6. **FRESHNESS UPDATE** (Write a "Last Updated: May 2026" paragraph + suggest 1-2 new sections to add for freshness):

7. **AUTHORITY LINKS** (3-5 specific outbound links to add for E-E-A-T + GEO citations):
   Suggest specific URLs from official documentation that match this article's actual topic.
   Format each as: [Anchor text](URL) — Where to add it: "after the paragraph about X"
   Use REAL URLs from these authority domains: docs.snowflake.com, docs.getdbt.com, docs.aws.amazon.com, cloud.google.com, learn.microsoft.com, docs.databricks.com, airflow.apache.org, kafka.apache.org, github.com, kubernetes.io, docs.python.org

8. **INTERNAL LINK PATTERNS** (3-5 anchor text + topic patterns to add):
   Suggest natural internal link spots in the format: "Add a link with anchor text '[X]' pointing to a related article on [topic]"
   These should appear contextually in the article's body, not as a "Related Articles" list.

Format clearly with headers. Be specific, not generic. Every suggestion must contain "${article.focusKeyword}" naturally.
Base your fixes on the ACTUAL article content provided below — match its tone, technical depth, and style.`;

            // Pass actual article content as context so AI doesn't hallucinate
            const articleText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const response = await aiService.generateSuggestion(prompt, articleText);
            setFix(response);
        } catch (e) {
            setFix(`Error: ${e.message}`);
        }
        setFixing(false);
    };

    return (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
            <div
                onClick={onToggle}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 cursor-pointer"
            >
                <div className={`w-10 h-10 rounded-lg ${scoreBg} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${scoreColor}`}>{article.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{article.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                        <span>KW: <span className="text-blue-300">{article.focusKeyword}</span></span>
                        {article.position > 0 && <span className={posColor}>#{article.position.toFixed(1)}</span>}
                        {article.impressions > 0 && <span>{article.impressions.toLocaleString()} imp</span>}
                        {article.missedClicks > 0 && <span className="text-red-400">+{article.missedClicks} missed</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {linkGraph && <LinkHealthPanel article={article} linkGraph={linkGraph} compact />}
                    {article.position >= 5 && article.position <= 20 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] rounded-full border border-amber-500/30">PAGE 2</span>
                    )}
                    {article.missedClicks > 50 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[9px] rounded-full border border-red-500/30">HIGH OPP</span>
                    )}
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-4 border-t border-slate-700/50 space-y-3 pt-3">
                    {/* GSC Performance */}
                    {article.position > 0 && (
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-slate-900/50 rounded-lg">
                                <div className="text-xs font-bold text-white">{article.impressions.toLocaleString()}</div>
                                <div className="text-[9px] text-gray-500">Impressions</div>
                            </div>
                            <div className="p-2 bg-slate-900/50 rounded-lg">
                                <div className="text-xs font-bold text-white">{article.clicks}</div>
                                <div className="text-[9px] text-gray-500">Clicks</div>
                            </div>
                            <div className="p-2 bg-slate-900/50 rounded-lg">
                                <div className={`text-xs font-bold ${article.ctr < getExpectedCTR(article.position) ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {(article.ctr * 100).toFixed(1)}%
                                </div>
                                <div className="text-[9px] text-gray-500">CTR (exp: {(getExpectedCTR(article.position) * 100).toFixed(1)}%)</div>
                            </div>
                            <div className="p-2 bg-slate-900/50 rounded-lg">
                                <div className={`text-xs font-bold ${posColor}`}>#{article.position.toFixed(1)}</div>
                                <div className="text-[9px] text-gray-500">Position</div>
                            </div>
                        </div>
                    )}

                    {/* Keyword checks */}
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(article.analysis?.checks || {}).map(([key, passed]) => (
                            <span key={key} className={`px-2 py-0.5 rounded text-[10px] ${passed ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
                                {key}: {passed ? 'âœ“' : 'âœ—'}
                            </span>
                        ))}
                    </div>

                    {/* GSC keywords */}
                    {article.gscKeywords?.length > 0 && (
                        <div className="text-xs text-gray-500">
                            Top queries: {article.gscKeywords.slice(0, 5).map(k => k.query).join(' · ')}
                        </div>
                    )}

                    {/* Link Health Panel */}
                    {linkGraph && <LinkHealthPanel article={article} linkGraph={linkGraph} />}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleGenerateFix}
                            disabled={fixing}
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
                        >
                            {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {fixing ? 'Generating...' : 'Generate Fixes'}
                        </button>
                        <a
                            href={`/admin/keyword-target?slug=${article.slug}`}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs rounded-lg flex items-center gap-1"
                        >
                            <Target className="w-3 h-3" /> Full Analysis
                        </a>
                    </div>

                    {/* Fix output */}
                    {fix && (
                        <AIOutputSections text={fix} className="mt-3" />
                    )}
                </div>
            )}
        </div>
    );
}

export default ArticleFixerPage;
