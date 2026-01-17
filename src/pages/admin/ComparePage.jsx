// src/pages/admin/ComparePage.jsx
/**
 * Compare Page - Side-by-side URL comparison with AI citation metrics
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Loader2, Globe, Trophy, ArrowRight, TrendingUp, TrendingDown, Minus, Link as LinkIcon } from 'lucide-react';
import contentOptimizerService from '../../services/contentOptimizerService';

export function ComparePage() {
    const [url1, setUrl1] = useState('');
    const [url2, setUrl2] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);

    const handleCompare = async () => {
        if (!url1.trim() || !url2.trim()) {
            setError('Please enter both URLs');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const [analysis1, analysis2] = await Promise.all([
                contentOptimizerService.analyzeURL(url1),
                contentOptimizerService.analyzeURL(url2)
            ]);

            if (!analysis1.success) {
                throw new Error(`Failed to analyze URL 1: ${analysis1.error}`);
            }
            if (!analysis2.success) {
                throw new Error(`Failed to analyze URL 2: ${analysis2.error}`);
            }

            setResults({
                report1: analysis1.data,
                report2: analysis2.data
            });
        } catch (err) {
            setError(`Comparison failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getWinner = (val1, val2) => {
        if (val1 > val2) return 'you';
        if (val2 > val1) return 'competitor';
        return 'tie';
    };

    const getDiffIndicator = (val1, val2) => {
        const diff = val1 - val2;
        if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', text: `+${diff}` };
        if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', text: `${diff}` };
        return { icon: Minus, color: 'text-gray-400', text: '0' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/50">
                            <GitCompare className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        Competitor Analysis
                    </h1>
                    <p className="text-gray-400 text-lg">Compare your content against competitors</p>
                </div>

                {/* URL Input Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Your URL */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Your URL</h3>
                        </div>
                        <input
                            type="url"
                            value={url1}
                            onChange={(e) => setUrl1(e.target.value)}
                            placeholder="https://your-site.com/article"
                            className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Competitor URL */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-bold text-white">Competitor URL</h3>
                        </div>
                        <input
                            type="url"
                            value={url2}
                            onChange={(e) => setUrl2(e.target.value)}
                            placeholder="https://competitor.com/article"
                            className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white placeholder-gray-500"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Compare Button */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={handleCompare}
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transform hover:scale-105 disabled:transform-none font-semibold text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <GitCompare className="w-6 h-6" />
                                Compare
                            </>
                        )}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 mb-8 backdrop-blur-xl">
                        <p className="text-red-300 text-center">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Winner Banner */}
                        {results.report1.score !== results.report2.score && (
                            <div className={`rounded-2xl p-6 text-center backdrop-blur-xl ${results.report1.score > results.report2.score
                                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50'
                                    : 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50'
                                }`}>
                                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {results.report1.score > results.report2.score ? 'Your Page Wins! 🎉' : 'Competitor Wins'}
                                </h2>
                                <p className="text-gray-300">
                                    Score: {Math.max(results.report1.score, results.report2.score)}/100
                                </p>
                            </div>
                        )}

                        {/* Comparison Table */}
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
                            <div className="p-6 border-b border-gray-700/50">
                                <h3 className="text-2xl font-bold text-white">Detailed Comparison</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Metric</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-blue-400">You</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Diff</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-purple-400">Competitor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {[
                                            { label: 'Overall Score', key: 'score', suffix: '/100' },
                                            { label: 'Word Count', key: 'wordCount', suffix: '' },
                                            { label: 'Statistics', key: 'statistics', suffix: '' },
                                            { label: 'Data Tables', key: 'tables', suffix: '' },
                                            { label: 'Questions', key: 'questions', suffix: '' },
                                            { label: 'Internal Links', key: 'internalLinks', suffix: '' },
                                            { label: 'External Links', key: 'externalLinks', suffix: '' },
                                            { label: 'Authority Links', key: 'authorityLinks', suffix: '' },
                                            { label: 'Code Examples', key: 'codeBlocks', suffix: '' }
                                        ].map((metric, idx) => {
                                            const val1 = results.report1[metric.key] || 0;
                                            const val2 = results.report2[metric.key] || 0;
                                            const winner = getWinner(val1, val2);
                                            const diff = getDiffIndicator(val1, val2);
                                            const DiffIcon = diff.icon;

                                            return (
                                                <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-300">{metric.label}</td>
                                                    <td className={`px-6 py-4 text-center text-lg font-bold ${winner === 'you' ? 'text-green-400' : winner === 'tie' ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                        {val1}{metric.suffix}
                                                        {winner === 'you' && ' ✓'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`inline-flex items-center gap-1 ${diff.color}`}>
                                                            <DiffIcon className="w-4 h-4" />
                                                            <span className="text-sm font-medium">{diff.text}</span>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 text-center text-lg font-bold ${winner === 'competitor' ? 'text-purple-400' : winner === 'tie' ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                        {val2}{metric.suffix}
                                                        {winner === 'competitor' && ' ✓'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Feature Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Your Strengths */}
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Your Strengths</h3>
                                <div className="space-y-2">
                                    {results.report1.strengths.length > 0 ? (
                                        results.report1.strengths.map((strength, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-green-300 bg-green-900/20 px-3 py-2 rounded-lg">
                                                <span className="text-sm">✓ {strength}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No strengths detected</p>
                                    )}
                                </div>
                            </div>

                            {/* Competitor Strengths */}
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Competitor Strengths</h3>
                                <div className="space-y-2">
                                    {results.report2.strengths.length > 0 ? (
                                        results.report2.strengths.map((strength, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-purple-300 bg-purple-900/20 px-3 py-2 rounded-lg">
                                                <span className="text-sm">✓ {strength}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No strengths detected</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {results.report1.recommendations.length > 0 && (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
                                <h3 className="text-2xl font-bold text-white mb-4">Your Improvement Opportunities</h3>
                                <div className="space-y-3">
                                    {results.report1.recommendations.slice(0, 5).map((rec, idx) => (
                                        <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${rec.priority === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                                                        rec.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {rec.priority}
                                                </span>
                                                <span className="font-semibold text-white">{rec.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-1">
                                                <strong>Action:</strong> {rec.action}
                                            </p>
                                            <p className="text-sm text-blue-300">
                                                <strong>Impact:</strong> {rec.impact}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {!results && !error && !loading && (
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-16 text-center border-2 border-dashed border-gray-600 shadow-2xl">
                        <GitCompare className="w-20 h-20 mx-auto mb-6 text-purple-400" />
                        <h3 className="text-3xl font-bold text-white mb-3">Ready to Compare</h3>
                        <p className="text-gray-400 text-lg mb-6">Enter both URLs above to see detailed comparison</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                            {[
                                'AI citation scores',
                                'Content depth analysis',
                                'Link profile comparison',
                                'Actionable recommendations'
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-300 bg-gray-700/30 px-4 py-2 rounded-lg">
                                    <ArrowRight className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ComparePage;
