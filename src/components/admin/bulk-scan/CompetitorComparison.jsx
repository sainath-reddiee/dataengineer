// Competitor Comparison Component
// Compare your site against competitor sites

import React, { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, Target } from 'lucide-react';

export function CompetitorComparison({ yourResults, competitorResults, onLoadCompetitor }) {
    const [competitorUrl, setCompetitorUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLoadCompetitor = async () => {
        if (!competitorUrl.trim()) {
            setError('Please enter a competitor feed URL');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onLoadCompetitor(competitorUrl);
        } catch (err) {
            setError(err.message || 'Failed to load competitor data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const calcAvg = (results, field) => {
        if (!results || results.length === 0) return 0;
        return Math.round(results.reduce((sum, r) => sum + (r[field] || 0), 0) / results.length);
    };

    const yourMetrics = yourResults && yourResults.length > 0 ? {
        count: yourResults.length,
        avgScore: calcAvg(yourResults, 'score'),
        avgWords: calcAvg(yourResults, 'wordCount'),
        avgQuestions: calcAvg(yourResults, 'questions'),
        avgAuthority: calcAvg(yourResults, 'authorityLinks')
    } : null;

    const competitorMetrics = competitorResults && competitorResults.length > 0 ? {
        count: competitorResults.length,
        avgScore: calcAvg(competitorResults, 'score'),
        avgWords: calcAvg(competitorResults, 'wordCount'),
        avgQuestions: calcAvg(competitorResults, 'questions'),
        avgAuthority: calcAvg(competitorResults, 'authorityLinks')
    } : null;

    const getDiffIcon = (yours, theirs) => {
        if (yours > theirs) return { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' };
        if (yours < theirs) return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20' };
        return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/20' };
    };

    const metrics = [
        { label: 'Average Score', field: 'avgScore', suffix: '' },
        { label: 'Word Count', field: 'avgWords', suffix: '' },
        { label: 'Questions', field: 'avgQuestions', suffix: '' },
        { label: 'Authority Links', field: 'avgAuthority', suffix: '' }
    ];

    // Determine winner
    let yourWins = 0;
    let theirWins = 0;
    if (yourMetrics && competitorMetrics) {
        metrics.forEach(m => {
            if (yourMetrics[m.field] > competitorMetrics[m.field]) yourWins++;
            else if (yourMetrics[m.field] < competitorMetrics[m.field]) theirWins++;
        });
    }

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Competitor Comparison</h3>
                        <p className="text-sm text-gray-400">Compare your content against competitors</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Competitor URL Input */}
                {!competitorMetrics && (
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 mb-2">
                            Load competitor sitemap or feed URL:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={competitorUrl}
                                onChange={(e) => { setCompetitorUrl(e.target.value); setError(''); }}
                                placeholder="https://competitor.com/sitemap.xml"
                                className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={handleLoadCompetitor}
                                disabled={loading}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                                Load
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Comparison Table */}
                {yourMetrics && competitorMetrics ? (
                    <>
                        {/* Winner Banner */}
                        {yourWins !== theirWins && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${yourWins > theirWins
                                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                                }`}>
                                <Trophy className="w-5 h-5" />
                                <span className="font-medium">
                                    {yourWins > theirWins
                                        ? `You're winning! ${yourWins} of ${metrics.length} metrics are better.`
                                        : `Competitor leads in ${theirWins} of ${metrics.length} metrics.`
                                    }
                                </span>
                            </div>
                        )}

                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 text-sm text-gray-400 font-medium">Metric</th>
                                    <th className="text-center py-3 text-sm text-gray-400 font-medium">You ({yourMetrics.count})</th>
                                    <th className="text-center py-3 text-sm text-gray-400 font-medium">Competitor ({competitorMetrics.count})</th>
                                    <th className="text-center py-3 text-sm text-gray-400 font-medium">Diff</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map(m => {
                                    const yours = yourMetrics[m.field];
                                    const theirs = competitorMetrics[m.field];
                                    const diff = yours - theirs;
                                    const { icon: Icon, color, bg } = getDiffIcon(yours, theirs);

                                    return (
                                        <tr key={m.field} className="border-b border-slate-700/50">
                                            <td className="py-3 text-white">{m.label}</td>
                                            <td className="py-3 text-center text-white font-bold">{yours}{m.suffix}</td>
                                            <td className="py-3 text-center text-gray-400">{theirs}{m.suffix}</td>
                                            <td className="py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bg} ${color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {diff > 0 ? '+' : ''}{diff}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                ) : !competitorMetrics && yourMetrics ? (
                    <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Load a competitor feed to compare</p>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Scan your articles first, then load competitor data</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompetitorComparison;
