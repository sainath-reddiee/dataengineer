// src/pages/admin/ArticleFixerPage.jsx
// Batch Article Fixer — analyzes all articles against focus keyphrases,
// prioritizes by score, and generates ready-to-paste AI fixes.

import React, { useEffect, useState } from 'react';
import {
    Wrench, Loader2, AlertTriangle, Sparkles, RefreshCw, Copy, Check,
    ChevronDown, ChevronRight, Target,
} from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';

// Lightweight inline keyword analysis (same logic as KeywordTargetPage)
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

export function ArticleFixerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);
    const [progress, setProgress] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        setArticles([]);
        try {
            setProgress('Fetching articles...');
            const wpData = await wordpressApi.getAllPosts(1, 100);
            const posts = wpData.posts || [];
            if (posts.length === 0) { setError('No articles found.'); setLoading(false); return; }

            // Get GSC keyword data if connected
            let gscMap = {};
            if (gscService.isConnected()) {
                setProgress('Fetching GSC keywords...');
                try {
                    const keywords = await gscService.queryTopKeywords({ rowLimit: 500 });
                    // Group keywords by matching article slug
                    keywords.forEach(kw => {
                        // Try to match the URL to a post slug
                        posts.forEach(post => {
                            const articleUrl = `https://dataengineerhub.blog/articles/${post.slug}`;
                            // Check by page dimension if available, or fuzzy match
                            if (!gscMap[post.slug]) gscMap[post.slug] = [];
                        });
                    });

                    // Fetch per-article keywords for top 20 articles
                    const topPosts = posts.slice(0, 20);
                    for (let i = 0; i < topPosts.length; i++) {
                        setProgress(`Fetching keywords for ${i + 1}/${topPosts.length}...`);
                        try {
                            const kws = await gscService.queryTopKeywords({
                                url: `https://dataengineerhub.blog/articles/${topPosts[i].slug}`,
                                rowLimit: 5,
                            });
                            if (kws.length > 0) {
                                gscMap[topPosts[i].slug] = kws.sort((a, b) => b.impressions - a.impressions);
                            }
                        } catch { /* skip */ }
                    }
                } catch (e) {
                    console.warn('GSC fetch failed:', e.message);
                }
            }

            setProgress('Analyzing articles...');

            // Analyze each article
            const analyzed = posts.map(post => {
                // Determine focus keyword: GSC top query or slug-derived
                const gscKws = gscMap[post.slug] || [];
                const focusKeyword = gscKws.length > 0
                    ? gscKws[0].query
                    : post.slug.replace(/-/g, ' ').replace(/\d{4}$/, '').trim();

                const result = quickAnalyze(focusKeyword, post);
                return {
                    ...post,
                    focusKeyword,
                    gscKeywords: gscKws,
                    analysis: result,
                    score: result?.score || 0,
                };
            });

            // Sort: worst scores first (biggest opportunity)
            analyzed.sort((a, b) => a.score - b.score);
            setArticles(analyzed);
        } catch (e) {
            setError(e.message || 'Failed to load data');
        }
        setLoading(false);
        setProgress('');
    }

    const needsWork = articles.filter(a => a.score < 70);
    const avgScore = articles.length > 0 ? Math.round(articles.reduce((s, a) => s + a.score, 0) / articles.length) : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Wrench className="w-8 h-8 text-orange-400" />
                        Article Fixer
                    </h1>
                    <p className="text-gray-400">Batch keyword analysis of all articles — prioritized by optimization opportunity. Fix the worst first.</p>
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
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                            <div className="text-3xl font-bold text-white">{avgScore}%</div>
                            <div className="text-xs text-gray-400 mt-1">Avg Keyword Score</div>
                        </div>
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                            <div className="text-3xl font-bold text-red-400">{needsWork.length}</div>
                            <div className="text-xs text-gray-400 mt-1">Articles Need Fixing</div>
                        </div>
                        <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                            <div className="text-3xl font-bold text-emerald-400">{articles.filter(a => a.score >= 70).length}</div>
                            <div className="text-xs text-gray-400 mt-1">Well Optimized</div>
                        </div>
                    </div>

                    {/* Article List */}
                    <div className="space-y-2">
                        {articles.map(article => (
                            <ArticleRow
                                key={article.slug}
                                article={article}
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

function ArticleRow({ article, expanded, onToggle }) {
    const [fixing, setFixing] = useState(false);
    const [fix, setFix] = useState(null);
    const [copied, setCopied] = useState(false);

    const scoreColor = article.score >= 70 ? 'text-emerald-400' : article.score >= 40 ? 'text-amber-400' : 'text-red-400';
    const scoreBg = article.score >= 70 ? 'bg-emerald-500/20' : article.score >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20';

    const handleGenerateFix = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        setFixing(true);
        try {
            // Get competitor context from web search
            let competitorContext = '';
            if (tinyfishService.isEnabled && article.focusKeyword) {
                try {
                    const results = await tinyfishService.search(article.focusKeyword);
                    const top5 = (results.results || []).filter(r => !r.url?.includes('dataengineerhub.blog')).slice(0, 5);
                    if (top5.length > 0) {
                        competitorContext = `\nCURRENT TOP SERP RESULTS FOR "${article.focusKeyword}":\n${top5.map((r, i) => `${i + 1}. "${r.title}" — ${r.snippet || ''}`).join('\n')}\n`;
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
- FAILED CHECKS: ${failedStr || 'none'}
- Keyword density: ${article.analysis?.density?.toFixed(2) || '?'}%
${competitorContext}
GENERATE THESE FIXES (ready to copy-paste):

1. **OPTIMIZED TITLE** (50-60 chars, keyphrase near front, compelling, with number/power word):
   Write 2 options.

2. **OPTIMIZED META DESCRIPTION** (120-155 chars, starts with action verb, includes keyphrase, ends with benefit):
   Write 2 options.

3. **OPTIMIZED FIRST PARAGRAPH** (2-3 sentences, keyphrase in first sentence, sets up the article's value):
   Write 1 version.

4. **H2 HEADINGS WITH KEYPHRASE** (suggest 3 natural H2 headings that include "${article.focusKeyword}" or close variants):

5. **IMAGE ALT TEXT** (2 suggestions containing the keyphrase):

Format clearly with headers. Be specific, not generic. Every suggestion must contain "${article.focusKeyword}" naturally.`;

            const response = await aiService.generateSuggestion(prompt, '');
            setFix(response);
        } catch (e) {
            setFix(`Error: ${e.message}`);
        }
        setFixing(false);
    };

    const handleCopy = () => {
        if (fix) {
            navigator.clipboard.writeText(fix);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>Focus: <span className="text-blue-300">{article.focusKeyword}</span></span>
                        {article.analysis?.failedList?.length > 0 && (
                            <span className="text-red-400">· Missing: {article.analysis.failedList.slice(0, 3).join(', ')}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {article.score < 70 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded-full border border-red-500/30">NEEDS FIX</span>
                    )}
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-4 border-t border-slate-700/50 space-y-3 pt-3">
                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(article.analysis?.checks || {}).map(([key, passed]) => (
                            <span key={key} className={`px-2 py-0.5 rounded text-[10px] ${passed ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
                                {key}: {passed ? '✓' : '✗'}
                            </span>
                        ))}
                    </div>

                    {/* GSC keywords */}
                    {article.gscKeywords?.length > 0 && (
                        <div className="text-xs text-gray-500">
                            Top GSC queries: {article.gscKeywords.slice(0, 5).map(k => k.query).join(' · ')}
                        </div>
                    )}

                    {/* Generate Fix */}
                    <div className="flex items-center gap-2">
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
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-emerald-400">AI-Generated Fixes</span>
                                <button onClick={handleCopy} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>
                            <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-80 overflow-y-auto font-mono leading-relaxed">
                                {fix}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ArticleFixerPage;
