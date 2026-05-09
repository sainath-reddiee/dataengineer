// src/pages/admin/CTRFixerPage.jsx
// CTR Emergency Tool â€” surfaces articles with high impressions but terrible CTR.
// Uses GSC real data + AI to generate click-optimized title/description variants.

import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Sparkles, RefreshCw, MousePointerClick } from 'lucide-react';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { scoreCtr } from '@/utils/ctrScorer';
import wordpressApi from '@/services/wordpressApi';

export function CTRFixerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);

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

            // Fetch GSC pages + WP posts in parallel
            const [gscPages, wpData] = await Promise.all([
                gscService.queryTopPages({ rowLimit: 200 }),
                wordpressApi.getAllPosts(1, 100),
            ]);

            const posts = wpData.posts || [];
            const postMap = {};
            posts.forEach(p => { postMap[p.slug] = p; });

            // Match GSC rows to articles and compute CTR metrics
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
                        // Potential clicks if CTR improved to expected for position
                        potentialClicks: Math.round(row.impressions * getExpectedCTR(row.position)),
                        clickGap: Math.round(row.impressions * getExpectedCTR(row.position)) - row.clicks,
                    };
                })
                .filter(Boolean)
                .filter(a => a.impressions >= 20) // Only show articles with meaningful data
                .sort((a, b) => b.clickGap - a.clickGap); // Biggest click opportunity first

            setArticles(matched);
        } catch (e) {
            setError(e.message || 'Failed to load data');
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <MousePointerClick className="w-8 h-8 text-rose-400" />
                        CTR Fixer
                    </h1>
                    <p className="text-gray-400">Find articles with high impressions but low clicks â€” fix titles to unlock traffic you're already earning.</p>
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
                    <div className="grid grid-cols-3 gap-4">
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

function CTRArticleRow({ article, expanded, onToggle }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [variants, setVariants] = useState(null);
    const [aiError, setAiError] = useState('');

    const ctrColor = article.ctr < 0.02 ? 'text-red-400' : article.ctr < 0.05 ? 'text-amber-400' : 'text-emerald-400';

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

            // Fetch competitor titles from web search if TinyFish is available
            let competitorContext = '';
            if (tinyfishService.isEnabled) {
                try {
                    // Use the article's slug as a keyword proxy
                    const keyword = article.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 5).join(' ');
                    const searchResults = await tinyfishService.search(keyword);
                    const competitors = (searchResults.results || [])
                        .filter(r => !r.url?.includes('dataengineerhub.blog'))
                        .slice(0, 5);
                    if (competitors.length > 0) {
                        competitorContext = `\n\nCOMPETITOR TITLES CURRENTLY RANKING (what's winning in SERP right now):\n${competitors.map((c, i) => `${i + 1}. "${c.title}" â€” ${c.snippet || ''}`).join('\n')}\n\nUse these as inspiration. Beat them with more compelling, specific titles.`;
                    }
                } catch { /* search enrichment is optional */ }
            }

            const prompt = `You are a CTR optimization specialist. An article has HIGH impressions (${article.impressions}) but VERY LOW CTR (${(article.ctr * 100).toFixed(2)}%) at position #${article.position.toFixed(1)}.

CURRENT:
Title: "${article.title}"
Description: "${article.excerpt}"
Content preview: ${contentSnippet.substring(0, 500)}

The expected CTR for position #${Math.round(article.position)} is ~${(getExpectedCTR(article.position) * 100).toFixed(1)}%. This article is massively underperforming.${competitorContext}

Generate 3 title + description variants that will dramatically improve CTR. Each variant should use different psychological triggers:

Variant 1: Use curiosity/information gap
Variant 2: Use specificity/numbers/data
Variant 3: Use urgency/authority/social proof

Rules:
- Titles: 50-60 chars, keyword near front, compelling
- Descriptions: 120-155 chars, start with action verb, include benefit
- Keep the core topic/keyword intact
- Make searchers NEED to click

Respond in EXACTLY this JSON (no markdown):
{"variants": [{"title": "...", "description": "...", "trigger": "curiosity"}, {"title": "...", "description": "...", "trigger": "specificity"}, {"title": "...", "description": "...", "trigger": "authority"}]}`;

            const response = await aiService.generateSuggestion(prompt, '');
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const parsed = JSON.parse(response.substring(firstBrace, lastBrace + 1));
                // Score each variant
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
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-5 text-sm text-gray-200 truncate">{article.title}</div>
                <div className="col-span-2 text-center text-xs text-gray-400">{article.impressions.toLocaleString()} imp</div>
                <div className="col-span-1 text-center text-xs text-gray-400">{article.clicks} clk</div>
                <div className={`col-span-1 text-center text-xs font-bold ${ctrColor}`}>{(article.ctr * 100).toFixed(1)}%</div>
                <div className="col-span-1 text-center text-xs text-gray-400">#{article.position.toFixed(1)}</div>
                <div className="col-span-2 text-right text-xs text-emerald-400 font-mono">+{article.clickGap} clicks</div>
            </div>

            {expanded && (
                <div className="px-6 pb-4 bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                            Expected CTR for position #{Math.round(article.position)}: <span className="text-blue-300">{(getExpectedCTR(article.position) * 100).toFixed(1)}%</span>
                            {' '}Â· You're at <span className={ctrColor}>{(article.ctr * 100).toFixed(2)}%</span>
                            {' '}Â· Missing <span className="text-emerald-400">{article.clickGap} clicks/month</span>
                        </div>
                        <button
                            onClick={handleAIFix}
                            disabled={aiLoading}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg"
                        >
                            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {aiLoading ? 'Generating...' : 'AI: Generate Click-Optimized Variants'}
                        </button>
                    </div>

                    {aiError && (
                        <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/10 border border-red-800/30 rounded-lg">{aiError}</div>
                    )}

                    {variants && (
                        <div className="space-y-2 mt-3">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI-Generated Variants (scored by CTR potential)</div>
                            {variants.sort((a, b) => b.score - a.score).map((v, i) => (
                                <div key={i} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] uppercase text-purple-300 font-bold">{v.trigger}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            v.score >= 70 ? 'bg-emerald-500/20 text-emerald-300' :
                                            v.score >= 50 ? 'bg-amber-500/20 text-amber-300' :
                                            'bg-red-500/20 text-red-300'
                                        }`}>Score: {v.score}</span>
                                    </div>
                                    <div className="text-sm text-white font-medium">{v.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">{v.description}</div>
                                    <div className="text-[10px] text-gray-600 mt-1">
                                        Title: {v.title.length} chars Â· Desc: {v.description.length} chars
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
