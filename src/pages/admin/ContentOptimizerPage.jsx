import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Sparkles, Target, Zap, Link as LinkIcon, ArrowRight, Loader2, Copy, Check, Globe } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import contentOptimizerService from '../../services/contentOptimizerService';
import { AIOutputSections } from '../../components/admin/AIOutputSections';
import pdfExportService from '../../services/pdfExportService';
import aiService from '../../services/aiService';
import tinyfishService from '../../services/tinyfishService';

const ContentOptimizerPage = () => {
    const [searchParams] = useSearchParams();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [serpLandscape, setSerpLandscape] = useState(null);
    // Sequence counter to drop stale analyze responses if user re-runs quickly
    const analyzeReqIdRef = useRef(0);

    // Auto-fill URL from query params (when navigated from Rank Dashboard or other tools)
    useEffect(() => {
        const paramUrl = searchParams.get('url');
        const paramSlug = searchParams.get('slug');
        if (paramUrl) {
            setUrl(decodeURIComponent(paramUrl));
        } else if (paramSlug) {
            setUrl(`https://dataengineerhub.blog/articles/${paramSlug}`);
        }
    }, [searchParams]);

    const handleAnalyze = async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            setError('Please enter a URL');
            return;
        }
        // Validate URL shape so the service doesn't get garbage input
        try {
            new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        } catch {
            setError('Please enter a valid URL (e.g. https://example.com/article)');
            return;
        }

        const myReqId = ++analyzeReqIdRef.current;
        setLoading(true);
        setError(null);
        setResult(null);
        setSerpLandscape(null);

        try {
            const analysis = await contentOptimizerService.analyzeURL(trimmed);
            if (myReqId !== analyzeReqIdRef.current) return; // stale

            if (analysis.success) {
                setResult(analysis.data);

                // Fetch SERP landscape in background (non-blocking, optional)
                if (tinyfishService.isEnabled) {
                    // Extract keyword from URL slug
                    const slugMatch = trimmed.match(/\/articles\/([^/?#]+)/);
                    const keyword = slugMatch ? slugMatch[1].replace(/-/g, ' ') : '';
                    if (keyword) {
                        tinyfishService.search(keyword).then(searchData => {
                            if (myReqId !== analyzeReqIdRef.current) return; // stale
                            const competitors = (searchData.results || [])
                                .filter(r => !r.url?.includes('dataengineerhub.blog'))
                                .slice(0, 5);
                            if (competitors.length > 0) setSerpLandscape(competitors);
                        }).catch(() => {});
                    }
                }
            } else {
                setError(analysis.error);
            }
        } catch (e) {
            if (myReqId === analyzeReqIdRef.current) {
                setError(e.message || 'Analysis failed. Please check the URL and try again.');
            }
        }
        if (myReqId === analyzeReqIdRef.current) setLoading(false);
    };

    const getScoreGradient = (score) => {
        if (score >= 85) return 'from-green-400 to-emerald-500';
        if (score >= 70) return 'from-yellow-400 to-orange-400';
        return 'from-red-400 to-pink-500';
    };

    const getScoreBg = (score) => {
        if (score >= 85) return 'bg-gradient-to-br from-green-900/20 to-emerald-900/20';
        if (score >= 70) return 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20';
        return 'bg-gradient-to-br from-red-900/20 to-pink-900/20';
    };

    const getScoreBorder = (score) => {
        if (score >= 85) return 'border-green-500/30';
        if (score >= 70) return 'border-yellow-500/30';
        return 'border-red-500/30';
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            HIGH: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/50',
            MEDIUM: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50',
            LOW: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
        };
        return colors[priority] || colors.MEDIUM;
    };

    const handleExportPDF = () => {
        if (!result) return;
        let hostname = 'page';
        try { hostname = new URL(result.url).hostname; } catch { /* fallback */ }
        const filename = `seo-analysis-${hostname}-${Date.now()}.pdf`;
        pdfExportService.exportSingleAnalysis(result, filename);
    };

    // AI-powered fix generation for a specific recommendation
    const generateAIFix = async (rec, articleUrl) => {
        if (!aiService.isEnabled) {
            return { error: 'AI API key not configured. Set it in the admin sidebar.' };
        }

        const prompt = `You are a content optimization expert. An article has been analyzed and a specific issue was found. Generate a READY-TO-USE fix.

ARTICLE URL: ${articleUrl}
ARTICLE KEYWORDS: ${result?.keywords?.join(', ') || 'N/A'}
WORD COUNT: ${result?.wordCount || 'unknown'}

ISSUE FOUND:
- Type: ${rec.type}
- Problem: ${rec.issue}
- Recommended Action: ${rec.action}
- Impact: ${rec.impact}
- Priority: ${rec.priority}

YOUR TASK: Generate the actual content that fixes this issue. Be SPECIFIC and READY-TO-PASTE.

Rules:
- If the fix is a TL;DR section, write it (3-5 bullet points summarizing key takeaways)
- If the fix is FAQ questions, write 3-5 Q&A pairs with detailed answers
- If the fix is statistics/data, suggest where to find relevant stats and write example sentences with placeholders
- If the fix is about freshness, write an "Updated" header with current date context
- If the fix is about authority links, suggest 3-5 specific URLs to link to (official docs, research)
- If the fix is about code examples, write a relevant code snippet
- Keep the writing style conversational, data-engineering focused, first person

Format:
---
FIX TYPE: [what this content block is]
PASTE LOCATION: [where in the article to add this â€” be specific]
CONTENT:
[The actual content to paste into WordPress â€” formatted in HTML]
---`;

        try {
            const response = await aiService.generateSuggestion(prompt, (result?.plainContent || '').substring(0, 10000));
            return { content: response };
        } catch (e) {
            return { error: e.message || 'AI generation failed' };
        }
    };

    // Determine which admin tools are relevant based on analysis results
    const getRelevantTools = () => {
        if (!result) return [];
        const tools = [];

        // Always recommend CTR Lab for title/description optimization
        tools.push({
            path: '/admin/ctr-lab',
            label: 'CTR Lab',
            reason: 'Optimize title & meta description for click-through rate',
            icon: 'âš¡',
        });

        // If low internal links, recommend Smart Linking
        if ((result.internalLinks || 0) < 5) {
            tools.push({
                path: '/admin/smart-linking',
                label: 'Smart Linking (AI)',
                reason: `Only ${result.internalLinks || 0} internal links found â€” get AI suggestions for relevant connections`,
                icon: 'ðŸ”—',
                urgent: true,
            });
        }

        // If low authority links, recommend Smart Linking (for external links)
        if (result.authorityLinks < 3) {
            tools.push({
                path: '/admin/smart-linking',
                label: 'Smart Linking (External)',
                reason: `Only ${result.authorityLinks} authority links â€” add external citations for E-E-A-T`,
                icon: 'ðŸŒ',
                urgent: true,
            });
        }

        // Keyword Injector for rising keyword opportunities
        tools.push({
            path: '/admin/keyword-injector',
            label: 'Keyword Injector',
            reason: 'Check if rising keywords can be injected to capture trending search demand',
            icon: 'ðŸ“ˆ',
        });

        // Striking Distance for keyword position opportunities
        tools.push({
            path: '/admin/striking-distance',
            label: 'Striking Distance',
            reason: 'Find keywords ranking #8-20 that a content refresh could push to page 1',
            icon: 'ðŸŽ¯',
        });

        // CTR Fixer if content might have high impressions but low clicks
        tools.push({
            path: '/admin/ctr-fixer',
            label: 'CTR Fixer',
            reason: 'Check if this article has high impressions but low click-through rate',
            icon: 'ðŸ–±ï¸',
        });

        // Content Decay if freshness is an issue
        if (!result.hasLastUpdated) {
            tools.push({
                path: '/admin/content-decay',
                label: 'Content Decay',
                reason: 'No freshness signal found â€” check if this article is losing rankings over time',
                icon: 'ðŸ“‰',
                urgent: true,
            });
        }

        return tools;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/50">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                        Content Optimizer
                    </h1>
                    <p className="text-gray-400 text-lg">Analyze any URL for AI citation optimization</p>
                </div>

                {/* URL Input Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-4 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder="https://example.com/article"
                                className="w-full px-6 py-4 bg-gray-900/50 border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg text-white placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transform hover:scale-105 disabled:transform-none font-semibold text-lg"
                        >
                            {loading ? (
                                <>
                                    <Clock className="w-6 h-6 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Search className="w-6 h-6" />
                                    Analyze
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg shadow-red-500/20 animate-shake backdrop-blur-xl">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-300 text-lg mb-1">Error</h3>
                            <p className="text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Score Card */}
                        <div className={`${getScoreBg(result.score)} backdrop-blur-xl rounded-2xl p-8 border-2 ${getScoreBorder(result.score)} shadow-2xl`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Target className="w-8 h-8 text-blue-400" />
                                        Optimization Score
                                    </h2>
                                    <p className="text-gray-400 text-sm truncate max-w-md">{result.url}</p>
                                </div>
                                <div className={`text-4xl md:text-7xl font-black bg-gradient-to-r ${getScoreGradient(result.score)} bg-clip-text text-transparent`}>
                                    {result.score}
                                    <span className="text-4xl">/100</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700/50 rounded-full h-4 mb-6 overflow-hidden shadow-inner">
                                <div
                                    className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getScoreGradient(result.score)} shadow-lg`}
                                    style={{ width: `${result.score}%` }}
                                />
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Words', value: result.wordCount, icon: FileText },
                                    { label: 'Statistics', value: result.statistics, icon: TrendingUp },
                                    { label: 'Questions', value: result.questions, icon: Sparkles },
                                    { label: 'Authority Links', value: result.authorityLinks, icon: Zap },
                                    { label: 'Internal Links', value: result.internalLinks || 0, icon: LinkIcon },
                                    { label: 'External Links', value: result.externalLinks, icon: LinkIcon }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700/50 shadow-md">
                                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                                        <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Visibility Score */}
                        {result.aiVisibility && (
                            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-500/30 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                            <Sparkles className="w-7 h-7 text-purple-400" />
                                            AI Visibility Score
                                        </h3>
                                        <p className="text-gray-400 text-sm">Probability of AI citation</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                            {result.aiVisibility.score}%
                                        </div>
                                        <div className={`text-sm font-bold mt-1 ${result.aiVisibility.citationProbability === 'Very High' ? 'text-green-400' :
                                            result.aiVisibility.citationProbability === 'High' ? 'text-blue-400' :
                                                result.aiVisibility.citationProbability === 'Medium' ? 'text-yellow-400' :
                                                    'text-red-400'
                                            }`}>
                                            {result.aiVisibility.citationProbability} Citation Probability
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.aiVisibility.factors.map((factor, idx) => (
                                        <div key={idx} className={`flex items-center justify-between px-4 py-2 rounded-lg ${factor.status === 'good' ? 'bg-green-900/20 border border-green-500/30' :
                                            factor.status === 'moderate' ? 'bg-yellow-900/20 border border-yellow-500/30' :
                                                'bg-red-900/20 border border-red-500/30'
                                            }`}>
                                            <span className={`text-sm font-medium ${factor.status === 'good' ? 'text-green-300' :
                                                factor.status === 'moderate' ? 'text-yellow-300' :
                                                    'text-red-300'
                                                }`}>
                                                {factor.factor}
                                            </span>
                                            <span className={`text-xs font-bold ${factor.status === 'good' ? 'text-green-400' :
                                                factor.status === 'moderate' ? 'text-yellow-400' :
                                                    'text-red-400'
                                                }`}>
                                                {factor.impact}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Competitor Suggestions */}
                        {result.competitorSuggestions && result.competitorSuggestions.length > 0 && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Target className="w-6 h-6 text-purple-400" />
                                    </div>
                                    Suggested Competitors to Analyze
                                </h3>
                                <p className="text-gray-400 mb-4 text-sm">
                                    Based on your content keywords: <span className="text-purple-400 font-semibold">{result.keywords.slice(0, 5).join(', ')}</span>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {result.competitorSuggestions.map((suggestion, idx) => (
                                        <a
                                            key={idx}
                                            href={suggestion.searchUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <LinkIcon className="w-5 h-5 text-purple-400" />
                                                <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                    {suggestion.domain}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">{suggestion.reason}</p>
                                            <div className="flex items-center gap-1 text-xs text-purple-400 font-semibold">
                                                <Search className="w-4 h-4" />
                                                Find similar articles â†’
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths */}
                        {result.strengths.length > 0 && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    Strengths ({result.strengths.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.strengths.map((strength, index) => (
                                        <div key={index} className="flex items-center gap-3 text-green-300 bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-4 py-3 rounded-xl border border-green-500/30 shadow-sm">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{strength}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Issues */}
                        {result.issues.length > 0 && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-400" />
                                    </div>
                                    Issues Found ({result.issues.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.issues.map((issue, index) => (
                                        <div key={index} className="flex items-center gap-3 text-red-300 bg-gradient-to-r from-red-900/30 to-pink-900/30 px-4 py-3 rounded-xl border border-red-500/30 shadow-sm">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{issue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SERP Landscape (from TinyFish web search) */}
                        {serpLandscape && (
                            <div className="bg-cyan-900/10 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-5">
                                <h3 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    SERP Landscape â€” What You're Competing Against
                                </h3>
                                <div className="space-y-2">
                                    {serpLandscape.map((c, i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50">
                                            <span className="text-xs font-bold text-gray-500 w-5 text-center pt-0.5">#{c.position}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs text-white truncate">{c.title}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{c.url}</div>
                                                {c.snippet && <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{c.snippet}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations with AI Fix */}
                        {result.recommendations.length > 0 && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-blue-400" />
                                    </div>
                                    Recommendations ({result.recommendations.length})
                                </h3>
                                <div className="space-y-4">
                                    {result.recommendations.map((rec, index) => (
                                        <RecommendationCard
                                            key={index}
                                            rec={rec}
                                            onGenerateFix={() => generateAIFix(rec, result.url)}
                                            getPriorityBadge={getPriorityBadge}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GEO Citation Rewriter */}
                        {result && result.aiVisibility && result.aiVisibility.score < 70 && (
                            <GEORewriterPanel url={result.url} keywords={result.keywords} aiVisibility={result.aiVisibility} serpData={serpLandscape} articleContent={result.plainContent || ''} />
                        )}

                        {/* Cross-Links to Other Admin Tools */}
                        {result && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <ArrowRight className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    Continue Optimization
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">Based on this analysis, these tools can help improve your content further:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {getRelevantTools().map((tool, idx) => (
                                        <Link
                                            key={idx}
                                            to={tool.path}
                                            className={`group p-4 rounded-xl border transition-all hover:shadow-lg ${
                                                tool.urgent
                                                    ? 'border-red-500/30 bg-red-900/10 hover:border-red-400/50 hover:shadow-red-500/20'
                                                    : 'border-gray-700/50 bg-gray-900/30 hover:border-blue-500/50 hover:shadow-blue-500/20'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">{tool.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white group-hover:text-blue-300 transition-colors text-sm">
                                                            {tool.label}
                                                        </span>
                                                        {tool.urgent && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/30 text-red-300 font-bold">FIX</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tool.reason}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!result && !error && !loading && (
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-16 text-center border-2 border-dashed border-gray-600 shadow-2xl">
                        <div className="inline-flex p-6 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-2xl mb-6">
                            <FileText className="w-20 h-20 text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">Ready to Analyze</h3>
                        <p className="text-gray-400 mb-6 text-lg">Enter a URL above to get AI citation optimization insights</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                            {[
                                'Checks for TL;DR summaries',
                                'Analyzes statistics and data',
                                'Detects FAQ opportunities',
                                'Validates freshness signals',
                                'Counts internal & external links',
                                'Measures content depth'
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-300 bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600/50">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <span className="text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

// Recommendation card with AI "Fix It" button
function RecommendationCard({ rec, onGenerateFix, getPriorityBadge }) {
    const [fix, setFix] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFix = async () => {
        setLoading(true);
        try {
            const result = await onGenerateFix();
            setFix(result);
            setExpanded(true);
        } catch (e) {
            setFix({ error: e?.message || 'Failed to generate fix' });
            setExpanded(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (fix?.content) {
            navigator.clipboard.writeText(fix.content).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="border-2 border-gray-700/50 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getPriorityBadge(rec.priority)}`}>
                        {rec.priority}
                    </span>
                    <span className="font-bold text-white text-lg">{rec.type}</span>
                </div>
                <button
                    onClick={fix ? () => setExpanded(!expanded) : handleFix}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white transition-colors"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {loading ? 'Generating...' : fix ? (expanded ? 'Hide Fix' : 'Show Fix') : 'AI Fix It'}
                </button>
            </div>
            <div className="space-y-2">
                <p className="text-sm text-gray-300">
                    <strong className="text-white">Issue:</strong> {rec.issue}
                </p>
                <p className="text-sm text-gray-300">
                    <strong className="text-white">Action:</strong> {rec.action}
                </p>
                <p className="text-sm text-blue-300 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 px-4 py-2 rounded-lg border border-blue-500/30">
                    <strong>Impact:</strong> {rec.impact}
                </p>
            </div>

            {/* AI-Generated Fix */}
            {expanded && fix && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                    {fix.error ? (
                        <div className="text-sm text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {fix.error}
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" /> AI-Generated Fix
                                </span>
                                <button
                                    onClick={handleCopy}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-gray-900/80 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-wrap max-h-72 overflow-y-auto font-mono leading-relaxed">
                                {fix.content}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// GEO Citation Rewriter panel â€” rewrites weak sections for AI citation
function GEORewriterPanel({ url, keywords, aiVisibility, serpData, articleContent = '' }) {
    const [loading, setLoading] = useState(false);
    const [rewrite, setRewrite] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleRewrite = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        setLoading(true);
        const weakFactors = (aiVisibility.factors || []).filter(f => f.status === 'weak' || f.status === 'missing');

        // Include SERP competitor context for grounded rewrites
        const serpContext = serpData && serpData.length > 0
            ? `\nCOMPETITOR CONTENT (from live Google results â€” use as reference for what Google currently ranks):\n${serpData.slice(0, 3).map((c, i) => `${i + 1}. "${c.title}" â€” ${c.snippet || ''}`).join('\n')}\n`
            : '';

        const prompt = `You are a GEO (Generative Engine Optimization) expert. Rewrite content to maximize AI citation probability.

ARTICLE: ${url}
KEYWORDS: ${(keywords || []).slice(0, 8).join(', ')}
AI VISIBILITY SCORE: ${aiVisibility.score}/100 (${aiVisibility.citationProbability} citation probability)
${serpContext}
WEAK FACTORS TO FIX:
${weakFactors.map(f => `- ${f.factor}: ${f.impact} (status: ${f.status})`).join('\n')}

Generate content patches that fix ALL weak factors. For each:

1. **TL;DR Summary** (if missing): Write 4-5 bullet point key takeaways
2. **FAQ Section** (if missing): Write 3-5 Q&A pairs with direct, definitive answers
3. **Statistics** (if weak): Write 3-5 sentences with specific numbers, percentages, benchmarks (with [source] attribution)
4. **Authority Citations** (if weak): Suggest 3-5 inline citations in "[According to Official Docs]" format
5. **Last Updated** (if missing): Write an update notice with today's context

CITATION OPTIMIZATION RULES:
- Every statement should be citable: "X is Y" not "X can be Y"
- Add "[Source: Official Docs]" patterns after claims
- First sentence of each section must directly answer the heading
- Use specific numbers: "reduces latency by 47%" not "significantly reduces latency"
- Write in a tone AI systems prefer to quote: authoritative, concise, factual

Format output as HTML blocks ready to paste into WordPress. Base ALL content on the actual article text provided — match its voice, style, and specific technical claims.`;

        try {
            const response = await aiService.generateSuggestion(prompt, articleContent);
            setRewrite(response);
        } catch (e) {
            setRewrite(`Error: ${e.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-purple-400" />
                        GEO Citation Rewriter
                    </h3>
                    <p className="text-gray-400 text-sm">AI visibility score is {aiVisibility.score}/100 â€” rewrite for higher AI citation probability</p>
                </div>
                <button
                    onClick={handleRewrite}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Rewriting...' : 'Rewrite for AI Citations'}
                </button>
            </div>
            {rewrite && (
                <AIOutputSections text={rewrite} className="mt-4" />
            )}
        </div>
    );
}

export default ContentOptimizerPage;
