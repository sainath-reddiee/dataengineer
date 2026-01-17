import React, { useState } from 'react';
import { Search, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Sparkles, Target, Zap } from 'lucide-react';
import contentOptimizerService from '../../services/contentOptimizerService';

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
        if (score >= 85) return 'from-green-500 to-emerald-600';
        if (score >= 70) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-600';
    };

    const getScoreBg = (score) => {
        if (score >= 85) return 'bg-gradient-to-br from-green-50 to-emerald-50';
        if (score >= 70) return 'bg-gradient-to-br from-yellow-50 to-orange-50';
        return 'bg-gradient-to-br from-red-50 to-pink-50';
    };

    const getScoreBorder = (score) => {
        if (score >= 85) return 'border-green-300';
        if (score >= 70) return 'border-yellow-300';
        return 'border-red-300';
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            HIGH: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-200',
            MEDIUM: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-200',
            LOW: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
        };
        return colors[priority] || colors.MEDIUM;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Content Optimizer
                    </h1>
                    <p className="text-gray-600 text-lg">Analyze any URL for AI citation optimization</p>
                </div>

                {/* URL Input Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 backdrop-blur-sm bg-white/90">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder="https://example.com/article"
                                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg"
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none font-semibold text-lg"
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
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg animate-shake">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-lg mb-1">Error</h3>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Score Card */}
                        <div className={`${getScoreBg(result.score)} rounded-2xl p-8 border-2 ${getScoreBorder(result.score)} shadow-2xl`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Target className="w-8 h-8" />
                                        Optimization Score
                                    </h2>
                                    <p className="text-gray-600 text-sm truncate max-w-md">{result.url}</p>
                                </div>
                                <div className={`text-7xl font-black bg-gradient-to-r ${getScoreGradient(result.score)} bg-clip-text text-transparent`}>
                                    {result.score}
                                    <span className="text-4xl">/100</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden shadow-inner">
                                <div
                                    className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getScoreGradient(result.score)} shadow-lg`}
                                    style={{ width: `${result.score}%` }}
                                />
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Words', value: result.wordCount, icon: FileText },
                                    { label: 'Statistics', value: result.statistics, icon: TrendingUp },
                                    { label: 'Questions', value: result.questions, icon: Sparkles },
                                    { label: 'Authority Links', value: result.authorityLinks, icon: Zap }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white shadow-md">
                                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths */}
                        {result.strengths.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm bg-white/90">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    Strengths ({result.strengths.length})
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {result.strengths.map((strength, index) => (
                                        <div key={index} className="flex items-center gap-3 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200 shadow-sm">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{strength}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Issues */}
                        {result.issues.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm bg-white/90">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    Issues Found ({result.issues.length})
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {result.issues.map((issue, index) => (
                                        <div key={index} className="flex items-center gap-3 text-red-700 bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 rounded-xl border border-red-200 shadow-sm">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{issue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {result.recommendations.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm bg-white/90">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-blue-600" />
                                    </div>
                                    Recommendations ({result.recommendations.length})
                                </h3>
                                <div className="space-y-4">
                                    {result.recommendations.map((rec, index) => (
                                        <div key={index} className="border-2 border-gray-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getPriorityBadge(rec.priority)}`}>
                                                        {rec.priority}
                                                    </span>
                                                    <span className="font-bold text-gray-900 text-lg">{rec.type}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-700">
                                                    <strong className="text-gray-900">Issue:</strong> {rec.issue}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <strong className="text-gray-900">Action:</strong> {rec.action}
                                                </p>
                                                <p className="text-sm text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
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
                    <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-300 shadow-xl backdrop-blur-sm bg-white/90">
                        <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6">
                            <FileText className="w-20 h-20 text-blue-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">Ready to Analyze</h3>
                        <p className="text-gray-600 mb-6 text-lg">Enter a URL above to get AI citation optimization insights</p>
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                            {[
                                'Checks for TL;DR summaries',
                                'Analyzes statistics and data',
                                'Detects FAQ opportunities',
                                'Validates freshness signals'
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
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
