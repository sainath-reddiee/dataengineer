// AI Insights Component
// Analyze patterns across all scanned articles

import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';

export function AIInsights({ results }) {
    const insights = useMemo(() => {
        if (!results || results.length === 0) return null;

        // Aggregate all issues
        const issueCount = {};
        const strengthCount = {};
        let totalScore = 0;
        let totalWords = 0;

        results.forEach(r => {
            totalScore += r.score || 0;
            totalWords += r.wordCount || 0;

            // Count issues from topIssues
            (r.topIssues || []).forEach(issue => {
                const key = issue.label || issue.type;
                if (key) {
                    issueCount[key] = (issueCount[key] || 0) + 1;
                }
            });

            // Count missing elements
            if (!r.hasTLDR) issueCount['Missing TL;DR'] = (issueCount['Missing TL;DR'] || 0) + 1;
            if (!r.hasLastUpdated) issueCount['No Last Updated'] = (issueCount['No Last Updated'] || 0) + 1;
            if (r.questions < 3) issueCount['Few Questions'] = (issueCount['Few Questions'] || 0) + 1;
            if (r.authorityLinks < 2) issueCount['Few Authority Links'] = (issueCount['Few Authority Links'] || 0) + 1;

            // Count strengths
            if (r.hasTLDR) strengthCount['Has TL;DR'] = (strengthCount['Has TL;DR'] || 0) + 1;
            if (r.questions >= 3) strengthCount['Good Q&A'] = (strengthCount['Good Q&A'] || 0) + 1;
            if ((r.codeBlocks || 0) >= 3) strengthCount['Rich Code'] = (strengthCount['Rich Code'] || 0) + 1;
        });

        // Calculate averages
        const avgScore = Math.round(totalScore / results.length);

        // Sort issues by frequency
        const topIssues = Object.entries(issueCount)
            .map(([label, count]) => ({
                label,
                count,
                percent: Math.round((count / results.length) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Generate quick wins
        const quickWins = [];
        if (issueCount['Missing TL;DR'] > 0) {
            quickWins.push({
                action: 'Add TL;DR summary',
                affected: issueCount['Missing TL;DR'],
                impact: '+20% AI visibility',
                effort: '2 min/article'
            });
        }
        if (issueCount['Few Questions'] > 0) {
            quickWins.push({
                action: 'Add FAQ section',
                affected: issueCount['Few Questions'],
                impact: '+36% citation rate',
                effort: '5 min/article'
            });
        }
        if (issueCount['No Last Updated'] > 0) {
            quickWins.push({
                action: 'Add Last Updated date',
                affected: issueCount['No Last Updated'],
                impact: '+2x freshness signal',
                effort: '1 min/article'
            });
        }
        if (issueCount['Few Authority Links'] > 0) {
            quickWins.push({
                action: 'Add authority citations',
                affected: issueCount['Few Authority Links'],
                impact: '+15% E-E-A-T score',
                effort: '5 min/article'
            });
        }

        return {
            totalArticles: results.length,
            avgScore,
            topIssues,
            quickWins: quickWins.slice(0, 3),
            goodArticles: results.filter(r => r.score >= 70).length,
            criticalArticles: results.filter(r => r.score < 40).length
        };
    }, [results]);

    if (!insights) {
        return (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 text-center">
                <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Run a scan to see AI-powered insights</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/30 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900/30 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">AI Insights</h3>
                        <p className="text-sm text-gray-400">{insights.totalArticles} articles analyzed</p>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-3xl font-black text-white">{insights.avgScore}</div>
                        <div className="text-sm text-gray-400">Avg Score</div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Common Issues */}
                {insights.topIssues.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            Common Issues
                        </h4>
                        <div className="space-y-2">
                            {insights.topIssues.map((issue, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-900/30 rounded-lg p-3">
                                    <div className="flex-1">
                                        <span className="text-white text-sm">{issue.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-400 text-sm font-bold">{issue.percent}%</span>
                                        <span className="text-gray-500 text-xs">({issue.count} articles)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Wins */}
                {insights.quickWins.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-green-400" />
                            Quick Wins
                        </h4>
                        <div className="grid gap-3">
                            {insights.quickWins.map((win, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{win.action}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {win.affected} articles • {win.effort}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold text-sm">{win.impact}</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-green-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-500/20">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{insights.goodArticles}</div>
                        <div className="text-xs text-gray-400">Good (70+)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {insights.totalArticles - insights.goodArticles - insights.criticalArticles}
                        </div>
                        <div className="text-xs text-gray-400">Needs Work</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{insights.criticalArticles}</div>
                        <div className="text-xs text-gray-400">Critical</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIInsights;
