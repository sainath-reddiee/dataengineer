// src/pages/admin/BulkScanPage.jsx
/**
 * Bulk Scan Page - Analyze all blog articles
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Play, Loader2, CheckCircle, AlertCircle, ArrowUpDown, ChevronDown, ChevronRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { analyzeArticleFull } from '@/utils/seo';
import scanHistory from '@/services/scanHistory';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';

export function BulkScanPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [sortBy, setSortBy] = useState('score');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        loadArticles();
    }, []);

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await wordpressApi.getAllPosts(1, 50);
            setArticles(data.posts || []);
        } catch (err) {
            console.error('Failed to load articles:', err);
        }
        setLoading(false);
    };

    const handleBulkScan = async () => {
        setScanning(true);
        setProgress({ current: 0, total: articles.length });
        setResults([]);

        const newResults = [];

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            setProgress({ current: i + 1, total: articles.length });

            try {
                // Mock HTML structure if full HTML isn't available, to allow some checks to run
                // ideally we would fetch the real page, but for bulk this prevents CORS spam
                // We rely on what we have from WP API
                const analysis = await analyzeArticleFull({
                    ...article,
                    url: `https://dataengineerhub.blog/articles/${article.slug}`,
                    content: article.content || ''
                }, `<!DOCTYPE html><html><head><title>${article.title}</title><meta name="description" content="${article.excerpt}"/></head><body>${article.content}</body></html>`);

                // Calculate Trend
                const previous = scanHistory.getLatest(article.slug);
                const trend = previous ? analysis.overallScore - previous.score : 0;

                // Save formatted history
                scanHistory.addScan(article.slug, analysis.overallScore, {
                    pseo: analysis.pseo?.score,
                    aeo: analysis.aeo?.score,
                    geo: analysis.geo?.score
                });

                // Aggregate issues
                const critical = (analysis.traditional?.summary?.critical || 0);
                const warning = (analysis.traditional?.summary?.warning || 0) +
                    (analysis.pseo?.summary?.warning || 0) +
                    (analysis.aeo?.summary?.warning || 0) +
                    (analysis.geo?.summary?.warning || 0);
                const good = (analysis.traditional?.summary?.good || 0);

                // Collect top issues for preview
                const allChecks = [
                    ...(analysis.traditional?.checks || []),
                    ...(analysis.pseo?.checks || []),
                    ...(analysis.aeo?.checks || []),
                    ...(analysis.geo?.checks || [])
                ];

                const topIssues = allChecks
                    .filter(c => c.score < 100) // Only issues
                    .sort((a, b) => a.score - b.score) // Lowest score first (most critical)
                    .slice(0, 5); // Top 5

                newResults.push({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    category: article.category,
                    score: analysis.overallScore,
                    grade: analysis.overallGrade,
                    trend,
                    pseo: analysis.pseo?.score || 0,
                    aeo: analysis.aeo?.score || 0,
                    geo: analysis.geo?.score || 0,
                    critical,
                    warning,
                    good,
                    topIssues
                });

                setResults([...newResults]);
            } catch (err) {
                console.error(`Failed to analyze ${article.title}:`, err);
                newResults.push({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    score: 0,
                    grade: 'F',
                    trend: 0,
                    error: err.message,
                    critical: 0, warning: 0, good: 0, topIssues: []
                });
            }

            // Small delay to prevent overwhelming
            await new Promise(r => setTimeout(r, 50));
        }

        setScanning(false);
    };

    const sortedResults = [...results].sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bulk Scan</h1>
                    <p className="text-gray-400">Analyze all articles in one go</p>
                </div>
                <button
                    onClick={handleBulkScan}
                    disabled={scanning || articles.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                    {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {scanning ? `Scanning ${progress.current}/${progress.total}` : 'Start Bulk Scan'}
                </button>
            </div>

            {/* Progress */}
            {scanning && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Scanning articles...</span>
                        <span className="text-gray-400">{progress.current}/{progress.total}</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                    </div>
                </div>
            )}

            {/* Results Summary */}
            {results.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    <SEOScoreCard title="Average Score" score={avgScore} icon={Layers} />
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-400">
                            {results.filter(r => r.score >= 70).length}
                        </p>
                        <p className="text-sm text-gray-400">Good (70+)</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-400">
                            {results.filter(r => r.score >= 40 && r.score < 70).length}
                        </p>
                        <p className="text-sm text-gray-400">Needs Work</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-red-400">
                            {results.filter(r => r.score < 40).length}
                        </p>
                        <p className="text-sm text-gray-400">Critical</p>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="w-10"></th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Title</th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-white" onClick={() => { setSortBy('score'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                                    Score <ArrowUpDown className="w-3 h-3 inline" />
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">PSEO</th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">AEO</th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">GEO</th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Issues</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {sortedResults.map((result) => (
                                <React.Fragment key={result.id}>
                                    <tr className={`hover:bg-slate-700/30 cursor-pointer ${expandedRows.has(result.id) ? 'bg-slate-700/30' : ''}`} onClick={() => toggleRow(result.id)}>
                                        <td className="pl-4">
                                            {expandedRows.has(result.id)
                                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium line-clamp-1">{result.title}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${result.score >= 70 ? 'text-green-400' : result.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {result.score}
                                                </span>
                                                {result.trend !== 0 && (
                                                    <div className={`flex items-center text-xs mt-1 ${result.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {result.trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                                        {Math.abs(result.trend)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center text-purple-400">{result.pseo || '-'}</td>
                                        <td className="px-4 py-4 text-center text-green-400">{result.aeo || '-'}</td>
                                        <td className="px-4 py-4 text-center text-blue-400">{result.geo || '-'}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {result.critical > 0 && (
                                                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                                                        {result.critical}
                                                    </span>
                                                )}
                                                {result.warning > 0 && (
                                                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                                                        {result.warning}
                                                    </span>
                                                )}
                                                {result.critical === 0 && result.warning === 0 && (
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`/articles/${result.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-purple-400 hover:text-purple-300 text-sm font-medium mr-3"
                                            >
                                                Open
                                            </a>
                                            <a
                                                href={`/admin/scanner?url=${encodeURIComponent(`http://localhost:3000/articles/${result.slug}`)}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                            >
                                                Details
                                            </a>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedRows.has(result.id) && (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <td colSpan="8" className="bg-slate-800/30 px-6 py-4 border-b border-slate-700">
                                                    <div className="ml-8">
                                                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                            Top Priorities
                                                        </h4>
                                                        {result.topIssues.length > 0 ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {result.topIssues.map((issue, idx) => (
                                                                    <div key={idx} className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                                                        <div className="mt-0.5">
                                                                            {issue.score === 0
                                                                                ? <AlertCircle className="w-4 h-4 text-red-500" />
                                                                                : <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                                            }
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-200 font-medium">{issue.label}</p>
                                                                            <p className="text-xs text-gray-500 mt-1">{issue.message}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No critical issues found! 🎉</p>
                                                        )}
                                                        <div className="mt-4 pt-3 border-t border-slate-700/50">
                                                            <a
                                                                href={`/admin/scanner?url=${encodeURIComponent(`http://localhost:3000/articles/${result.slug}`)}`}
                                                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                                            >
                                                                View full report →
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && articles.length === 0 && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
                    <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No articles found to scan</p>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            )}
        </div>
    );
}

export default BulkScanPage;
