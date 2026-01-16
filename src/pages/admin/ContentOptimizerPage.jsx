import React, { useState } from 'react';
import { Search, TrendingUp, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
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

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 85) return 'bg-green-100';
        if (score >= 70) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            HIGH: 'bg-red-100 text-red-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            LOW: 'bg-blue-100 text-blue-800'
        };
        return colors[priority] || colors.MEDIUM;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Optimizer</h1>
                <p className="text-gray-600">Analyze any URL for AI citation optimization</p>
            </div>

            {/* URL Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder="https://example.com/article"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>
                                <Clock className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Analyze
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900">Error</h3>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6">
                    {/* Score Card */}
                    <div className={`${getScoreBg(result.score)} rounded-lg p-6 border-2 ${result.score >= 85 ? 'border-green-300' : result.score >= 70 ? 'border-yellow-300' : 'border-red-300'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Optimization Score</h2>
                                <p className="text-gray-600 text-sm">{result.url}</p>
                            </div>
                            <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                                {result.score}
                                <span className="text-3xl">/100</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${result.score >= 85 ? 'bg-green-600' : result.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                style={{ width: `${result.score}%` }}
                            />
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{result.wordCount}</div>
                                <div className="text-sm text-gray-600">Words</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{result.statistics}</div>
                                <div className="text-sm text-gray-600">Statistics</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{result.questions}</div>
                                <div className="text-sm text-gray-600">Questions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{result.authorityLinks}</div>
                                <div className="text-sm text-gray-600">Authority Links</div>
                            </div>
                        </div>
                    </div>

                    {/* Strengths */}
                    {result.strengths.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                Strengths ({result.strengths.length})
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {result.strengths.map((strength, index) => (
                                    <div key={index} className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded">
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm">{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Issues */}
                    {result.issues.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                Issues Found ({result.issues.length})
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {result.issues.map((issue, index) => (
                                    <div key={index} className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm">{issue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                                Recommendations ({result.recommendations.length})
                            </h3>
                            <div className="space-y-4">
                                {result.recommendations.map((rec, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(rec.priority)}`}>
                                                    {rec.priority}
                                                </span>
                                                <span className="font-semibold text-gray-900">{rec.type}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">
                                            <strong>Issue:</strong> {rec.issue}
                                        </p>
                                        <p className="text-sm text-gray-700 mb-2">
                                            <strong>Action:</strong> {rec.action}
                                        </p>
                                        <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                                            <strong>Impact:</strong> {rec.impact}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
                <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
                    <p className="text-gray-600 mb-4">Enter a URL above to get AI citation optimization insights</p>
                    <div className="text-sm text-gray-500 space-y-1">
                        <p>✓ Checks for TL;DR summaries</p>
                        <p>✓ Analyzes statistics and data</p>
                        <p>✓ Detects FAQ opportunities</p>
                        <p>✓ Validates freshness signals</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentOptimizerPage;
