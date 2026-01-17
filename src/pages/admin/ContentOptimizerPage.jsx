import React, { useState } from 'react';
import { Search, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Sparkles, Target, Zap, Link as LinkIcon, Download } from 'lucide-react';
import contentOptimizerService from '../../services/contentOptimizerService';
import pdfExportService from '../../services/pdfExportService';

const ContentOptimizerPage = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const analysis = await contentOptimizerService.analyzeURL(url);

        setLoading(false);

        if (analysis.success) {
            setResult(analysis.data);
        } else {
            setError(analysis.error);
        }
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
        const filename = `seo-analysis-${new URL(result.url).hostname}-${Date.now()}.pdf`;
        pdfExportService.exportSingleAnalysis(result, filename);
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
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                        Content Optimizer
                    </h1>
                    <p className="text-gray-400 text-lg">Analyze any URL for AI citation optimization</p>
                </div>

                {/* URL Input Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 mb-8">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
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
                                <div className={`text-7xl font-black bg-gradient-to-r ${getScoreGradient(result.score)} bg-clip-text text-transparent`}>
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
                                        <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                                                Find similar articles →
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

                        {/* Recommendations */}
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
                                        <div key={index} className="border-2 border-gray-700/50 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getPriorityBadge(rec.priority)}`}>
                                                        {rec.priority}
                                                    </span>
                                                    <span className="font-bold text-white text-lg">{rec.type}</span>
                                                </div>
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
                                        </div>
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

export default ContentOptimizerPage;
