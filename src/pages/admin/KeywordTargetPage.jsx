// src/pages/admin/KeywordTargetPage.jsx
// Focus Keyphrase Analyzer — Yoast/RankMath equivalent for existing articles.
// Checks keyword placement in: title, meta, H1, H2s, first paragraph, URL, 
// image alts, density, and provides AI-powered rewrite suggestions.

import React, { useState, useEffect, useMemo } from 'react';
import {
    Target, Loader2, AlertTriangle, CheckCircle, XCircle, Sparkles,
    RefreshCw, Copy, Check, Search, FileText, ArrowRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';
import gscService from '@/services/gscService';

// Keyword analysis engine
function analyzeKeyword(keyword, article) {
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

    // Extract headings
    const h1s = (article.content || '').match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const h2s = (article.content || '').match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const h3s = (article.content || '').match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
    const allHeadings = [...h1s, ...h2s, ...h3s].map(h => h.replace(/<[^>]*>/g, '').toLowerCase());

    // Extract image alts
    const imgAlts = ((article.content || '').match(/alt=["']([^"']+)["']/gi) || [])
        .map(a => a.replace(/alt=["']/i, '').replace(/["']$/, '').toLowerCase());

    // Calculate density
    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const contentRaw = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const occurrences = (contentRaw.toLowerCase().match(kwRegex) || []).length;
    const density = wordCount > 0 ? ((occurrences * kwWords.length) / wordCount) * 100 : 0;

    // Check partial matches (individual words) for broader analysis
    const partialInTitle = kwWords.filter(w => w.length > 3 && title.includes(w)).length;
    const partialRatio = kwWords.length > 0 ? partialInTitle / kwWords.length : 0;

    const checks = [
        {
            id: 'title',
            label: 'Keyword in Title',
            passed: title.includes(kw),
            partial: !title.includes(kw) && partialRatio >= 0.5,
            value: title.includes(kw) ? 'Present' : partialRatio >= 0.5 ? 'Partial match' : 'Missing',
            weight: 25,
            tip: 'Place your exact focus keyphrase in the SEO title, ideally near the beginning.',
        },
        {
            id: 'meta',
            label: 'Keyword in Meta Description',
            passed: metaDesc.includes(kw),
            partial: !metaDesc.includes(kw) && kwWords.some(w => w.length > 3 && metaDesc.includes(w)),
            value: metaDesc.includes(kw) ? 'Present' : 'Missing',
            weight: 15,
            tip: 'Include the keyphrase in your meta description to improve CTR from search results.',
        },
        {
            id: 'slug',
            label: 'Keyword in URL Slug',
            passed: kwWords.every(w => w.length <= 3 || slug.includes(w)),
            partial: kwWords.some(w => w.length > 3 && slug.includes(w)),
            value: kwWords.every(w => w.length <= 3 || slug.includes(w)) ? 'Present' : kwWords.some(w => w.length > 3 && slug.includes(w)) ? 'Partial' : 'Missing',
            weight: 10,
            tip: 'Your URL slug should contain the focus keyphrase (e.g., /snowflake-interview-questions).',
        },
        {
            id: 'h1',
            label: 'Keyword in H1',
            passed: h1s.some(h => h.replace(/<[^>]*>/g, '').toLowerCase().includes(kw)),
            partial: h1s.some(h => kwWords.some(w => w.length > 3 && h.toLowerCase().includes(w))),
            value: h1s.length === 0 ? 'No H1 found' : h1s.some(h => h.replace(/<[^>]*>/g, '').toLowerCase().includes(kw)) ? 'Present' : 'Missing',
            weight: 15,
            tip: 'The H1 tag should contain your exact focus keyphrase.',
        },
        {
            id: 'h2',
            label: 'Keyword in Subheadings (H2/H3)',
            passed: allHeadings.filter(h => h.includes(kw)).length >= 1,
            partial: allHeadings.filter(h => kwWords.some(w => w.length > 3 && h.includes(w))).length >= 2,
            value: `${allHeadings.filter(h => h.includes(kw)).length} of ${allHeadings.length} subheadings`,
            weight: 10,
            tip: 'Include the keyphrase (or close variant) in at least 20-30% of your H2/H3 headings.',
        },
        {
            id: 'intro',
            label: 'Keyword in First Paragraph',
            passed: firstParagraph.includes(kw),
            partial: kwWords.filter(w => w.length > 3 && firstParagraph.includes(w)).length >= Math.ceil(kwWords.length * 0.6),
            value: firstParagraph.includes(kw) ? 'Present (first 500 chars)' : 'Missing from intro',
            weight: 15,
            tip: 'Mention your focus keyphrase within the first paragraph to signal relevance early.',
        },
        {
            id: 'density',
            label: 'Keyword Density',
            passed: density >= 0.5 && density <= 2.5,
            partial: density > 0 && density < 0.5,
            value: `${density.toFixed(2)}% (${occurrences} occurrences in ${wordCount} words)`,
            weight: 10,
            tip: density < 0.5 ? 'Density too low — use the keyphrase more naturally throughout the content.' :
                 density > 2.5 ? 'Density too high — reduce usage to avoid keyword stuffing penalty.' :
                 'Good density range (0.5-2.5%).',
        },
        {
            id: 'imgAlt',
            label: 'Keyword in Image Alt Text',
            passed: imgAlts.some(alt => alt.includes(kw)),
            partial: imgAlts.some(alt => kwWords.some(w => w.length > 3 && alt.includes(w))),
            value: imgAlts.length === 0 ? 'No images with alt text found' : imgAlts.some(alt => alt.includes(kw)) ? 'Present' : 'Missing',
            weight: 5,
            tip: 'Add the focus keyphrase to at least one image alt attribute for image search visibility.',
        },
    ];

    // Calculate overall score
    const maxScore = checks.reduce((sum, c) => sum + c.weight, 0);
    const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : c.partial ? c.weight * 0.4 : 0), 0);
    const score = Math.round((earned / maxScore) * 100);

    return {
        keyword: kw,
        score,
        checks,
        density,
        occurrences,
        wordCount,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
    };
}

export function KeywordTargetPage() {
    const [searchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [keyword, setKeyword] = useState('');
    const [gscKeywords, setGscKeywords] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [gscLoading, setGscLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const slugParam = searchParams.get('slug') || '';

    // Load posts
    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                setPosts(data.posts || []);
            } catch {}
            setPostsLoading(false);
        }
        load();
    }, []);

    // Auto-select from URL param
    useEffect(() => {
        if (slugParam && posts.length > 0 && posts.some(p => p.slug === slugParam)) {
            setSelectedSlug(slugParam);
        }
    }, [slugParam, posts]);

    // Fetch GSC keywords when article changes
    useEffect(() => {
        if (!selectedSlug) { setGscKeywords([]); return; }
        if (!gscService.isConnected()) return;

        setGscLoading(true);
        gscService.queryTopKeywords({
            url: `https://dataengineerhub.blog/articles/${selectedSlug}`,
            rowLimit: 20,
        }).then(data => {
            setGscKeywords(data.sort((a, b) => b.impressions - a.impressions));
            // Auto-set keyword to #1 GSC query if none set
            if (!keyword && data.length > 0) {
                setKeyword(data[0].query);
            }
        }).catch(() => {}).finally(() => setGscLoading(false));
    }, [selectedSlug]);

    // Run analysis when keyword or article changes
    useEffect(() => {
        if (!keyword || !selectedSlug) { setAnalysis(null); return; }
        const post = posts.find(p => p.slug === selectedSlug);
        if (!post) return;
        const result = analyzeKeyword(keyword, post);
        setAnalysis(result);
        setAiSuggestion(null);
    }, [keyword, selectedSlug, posts]);

    // AI optimization suggestions
    const handleAISuggest = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        if (!analysis) return;
        setAiLoading(true);

        const failedChecks = analysis.checks.filter(c => !c.passed);
        const post = posts.find(p => p.slug === selectedSlug);

        const prompt = `You are an SEO keyword targeting expert (like Yoast SEO / RankMath). An article has been analyzed for focus keyphrase optimization.

ARTICLE: "${post?.title}"
URL: /articles/${selectedSlug}
FOCUS KEYPHRASE: "${keyword}"
CURRENT SCORE: ${analysis.score}/100 (Grade: ${analysis.grade})
KEYWORD DENSITY: ${analysis.density.toFixed(2)}% (${analysis.occurrences} times in ${analysis.wordCount} words)

FAILED CHECKS:
${failedChecks.map(c => `- ${c.label}: ${c.value} — ${c.tip}`).join('\n')}

For EACH failed check, provide a SPECIFIC, ACTIONABLE fix:

1. If "Keyword in Title" failed: Write 2-3 optimized title options (50-60 chars) that naturally include "${keyword}" near the front
2. If "Keyword in Meta Description" failed: Write an optimized meta description (120-155 chars) that includes "${keyword}"
3. If "Keyword in First Paragraph" failed: Write an opening paragraph (2-3 sentences) that naturally includes "${keyword}" in the first sentence
4. If "Keyword in Subheadings" failed: Suggest 3-4 H2 headings that naturally incorporate "${keyword}" or close variants
5. If "Keyword Density" is too low: Suggest 5 natural sentences containing "${keyword}" that can be added throughout the article
6. If "Image Alt Text" failed: Suggest 2-3 descriptive alt texts that include "${keyword}"

Also suggest 5-8 LSI (Latent Semantic Indexing) keywords — related terms that should appear in the content alongside the focus keyphrase for topical relevance.

Format clearly with headers for each fix.`;

        try {
            const response = await aiService.generateSuggestion(prompt, '');
            setAiSuggestion(response);
        } catch (e) {
            setAiSuggestion(`Error: ${e.message}`);
        }
        setAiLoading(false);
    };

    const getScoreColor = (score) => score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-lime-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';
    const getScoreBg = (score) => score >= 80 ? 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' : score >= 60 ? 'from-lime-500/20 to-green-500/20 border-lime-500/30' : score >= 40 ? 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' : 'from-red-500/20 to-orange-500/20 border-red-500/30';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Target className="w-8 h-8 text-blue-400" />
                    Keyword Targeting
                </h1>
                <p className="text-gray-400">Analyze how well an article targets a specific focus keyphrase — Yoast-style optimization checks with AI fixes.</p>
            </div>

            {/* Article + Keyword Selection */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Article</label>
                        <select
                            value={selectedSlug}
                            onChange={(e) => { setSelectedSlug(e.target.value); setKeyword(''); }}
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                        >
                            <option value="">{postsLoading ? 'Loading...' : 'Select an article'}</option>
                            {posts.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                            Focus Keyphrase
                            {gscLoading && <span className="ml-2 text-blue-400">(loading GSC data...)</span>}
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g., snowflake interview questions"
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* GSC Keyword Suggestions */}
                {gscKeywords.length > 0 && (
                    <div>
                        <div className="text-xs text-gray-500 mb-2">Top GSC keywords (click to analyze):</div>
                        <div className="flex flex-wrap gap-1.5">
                            {gscKeywords.slice(0, 10).map((kw, i) => (
                                <button
                                    key={i}
                                    onClick={() => setKeyword(kw.query)}
                                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                                        keyword === kw.query
                                            ? 'bg-blue-600/40 text-blue-200 border border-blue-500/50'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-transparent'
                                    }`}
                                >
                                    {kw.query} <span className="text-gray-500 ml-1">({kw.impressions})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-4">
                    {/* Score Card */}
                    <div className={`bg-gradient-to-br ${getScoreBg(analysis.score)} backdrop-blur-xl rounded-2xl border p-6`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Keyword Targeting Score</div>
                                <div className="text-sm text-gray-300 mt-1">Focus: <span className="text-white font-semibold">"{analysis.keyword}"</span></div>
                            </div>
                            <div className="text-right">
                                <div className={`text-5xl font-black ${getScoreColor(analysis.score)}`}>
                                    {analysis.score}<span className="text-2xl text-gray-500">/100</span>
                                </div>
                                <div className={`text-sm font-bold ${getScoreColor(analysis.score)}`}>Grade {analysis.grade}</div>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                    analysis.score >= 80 ? 'bg-emerald-500' : analysis.score >= 60 ? 'bg-lime-500' : analysis.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${analysis.score}%` }}
                            />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-center text-xs">
                            <div><span className="text-gray-500">Density</span><br /><span className="text-white font-bold">{analysis.density.toFixed(2)}%</span></div>
                            <div><span className="text-gray-500">Occurrences</span><br /><span className="text-white font-bold">{analysis.occurrences}</span></div>
                            <div><span className="text-gray-500">Word Count</span><br /><span className="text-white font-bold">{analysis.wordCount.toLocaleString()}</span></div>
                        </div>
                    </div>

                    {/* Individual Checks */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Placement Checks</h3>
                        <div className="space-y-2">
                            {analysis.checks.map((check) => (
                                <div key={check.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                                    check.passed ? 'bg-emerald-900/10 border-emerald-500/30' :
                                    check.partial ? 'bg-amber-900/10 border-amber-500/30' :
                                    'bg-red-900/10 border-red-500/30'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {check.passed ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" /> :
                                         check.partial ? <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" /> :
                                         <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                                        <div>
                                            <div className={`text-sm font-medium ${check.passed ? 'text-emerald-300' : check.partial ? 'text-amber-300' : 'text-red-300'}`}>
                                                {check.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">{check.value}</div>
                                        </div>
                                    </div>
                                    {!check.passed && (
                                        <div className="text-[10px] text-gray-500 max-w-[200px] text-right">{check.tip}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Fix Suggestions */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-pink-400" />
                                AI Optimization Suggestions
                            </h3>
                            <button
                                onClick={handleAISuggest}
                                disabled={aiLoading || analysis.checks.every(c => c.passed)}
                                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {aiLoading ? 'Generating...' : analysis.checks.every(c => c.passed) ? 'All Checks Passed!' : 'Generate Fixes + LSI Keywords'}
                            </button>
                        </div>

                        {aiSuggestion && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-emerald-400">AI-Generated Optimization Plan</span>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(aiSuggestion); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-slate-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                                    {aiSuggestion}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap gap-2 text-xs">
                        <Link to={`/admin/ctr-lab?slug=${selectedSlug}`} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-700 flex items-center gap-1">
                            CTR Lab <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/admin/smart-linking?slug=${selectedSlug}`} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-700 flex items-center gap-1">
                            Smart Linking <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/admin/content-optimizer?slug=${selectedSlug}`} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-700 flex items-center gap-1">
                            Content Optimizer <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to={`/admin/article-optimizer?slug=${selectedSlug}`} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-700 flex items-center gap-1">
                            Full Optimizer <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!analysis && !postsLoading && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-slate-600 p-12 text-center">
                    <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Select an article and enter a focus keyphrase</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        This tool checks keyword placement across 8 critical positions (title, meta, headings, intro, URL, density, images) and provides AI-powered optimization suggestions.
                    </p>
                </div>
            )}
        </div>
    );
}

export default KeywordTargetPage;
