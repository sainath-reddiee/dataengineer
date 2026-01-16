// src/pages/admin/ComparePage.jsx
/**
 * Compare Page - Side-by-side URL comparison
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Loader2, Globe, Trophy, ArrowRight } from 'lucide-react';
import { SEOScanner } from '@/utils/seo/seoScanner';

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

        try {
            const scanUrl = async (url) => {
                let finalUrl = url.startsWith('http') ? url : 'https://' + url;
                const proxyUrl = finalUrl.includes('dataengineerhub.blog')
                    ? finalUrl
                    : `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;

                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Failed to fetch ${finalUrl}`);

                const html = await response.text();
                const scanner = new SEOScanner();
                return await scanner.analyze(finalUrl, html);
            };

            const [report1, report2] = await Promise.all([scanUrl(url1), scanUrl(url2)]);
            setResults({ report1, report2 });
        } catch (err) {
            setError(`Comparison failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getComparisonDetails = () => {
        if (!results) return [];
        const { report1, report2 } = results;

        // Extracts metric from a specific check if available
        const getMetric = (report, checkName) => {
            const check = report.checks.find(c => c.name.includes(checkName));
            return check ? check.score : '-';
        };

        const r1Meta = report1.checks.find(c => c.name === 'Meta Description Length') || {};
        const r2Meta = report2.checks.find(c => c.name === 'Meta Description Length') || {};

        return [
            { label: 'Overall Score', v1: report1.score, v2: report2.score, win: report1.score > report2.score ? 1 : 2 },
            { label: 'Word Count', v1: report1.wordCount || '-', v2: report2.wordCount || '-', win: (report1.wordCount || 0) > (report2.wordCount || 0) ? 1 : 2 },
            { label: 'Critical Issues', v1: report1.summary.critical, v2: report2.summary.critical, win: report1.summary.critical < report2.summary.critical ? 1 : 2 },
            { label: 'Meta Desc Length', v1: r1Meta.details?.length || '-', v2: r2Meta.details?.length || '-', win: 0 },
            { label: 'Load Time (est)', v1: '< 1s', v2: '< 1s', win: 0 }
        ];
    };

    const getWinner = (metric) => {
        if (!results) return 0;
        const { report1, report2 } = results;
        if (report1.score > report2.score) return 1;
        if (report2.score > report1.score) return 2;
        return 0;
    };

    const details = results ? getComparisonDetails() : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Compare URLs</h1>
                <p className="text-gray-400">Side-by-side SEO comparison</p>
            </div>

            {/* URL Inputs */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={url1}
                            onChange={(e) => setUrl1(e.target.value)}
                            placeholder="Your URL"
                            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-blue-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={url2}
                            onChange={(e) => setUrl2(e.target.value)}
                            placeholder="Competitor URL"
                            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
                <button
                    onClick={handleCompare}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GitCompare className="w-5 h-5" />}
                    {loading ? 'Comparing...' : 'Compare'}
                </button>
                {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
            </div>

            {/* Results */}
            {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Winner Banner */}
                    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl p-6 text-center">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-lg text-white font-bold">
                            {getWinner('score') === 1 && 'Your Page Wins! 🏆'}
                            {getWinner('score') === 2 && 'Competitor Wins! 🏆'}
                            {getWinner('score') === 0 && "It's a tie!"}
                        </p>
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase">Metric</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-blue-400 uppercase w-1/3">You</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-purple-400 uppercase w-1/3">Competitor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {details.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/20">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-300">{row.label}</td>
                                        <td className={`py-4 px-6 text-center font-bold ${row.win === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {row.v1} {row.win === 1 && '✅'}
                                        </td>
                                        <td className={`py-4 px-6 text-center font-bold ${row.win === 2 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {row.v2} {row.win === 2 && '✅'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Visual Summary */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <h3 className="text-blue-400 font-bold mb-2 text-center">Your Issues</h3>
                            <div className="flex justify-around text-center">
                                <div><p className="text-2xl font-bold text-red-400">{results.report1.summary.critical}</p><p className="text-xs text-gray-500">Critical</p></div>
                                <div><p className="text-2xl font-bold text-yellow-400">{results.report1.summary.warning}</p><p className="text-xs text-gray-500">Warnings</p></div>
                            </div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                            <h3 className="text-purple-400 font-bold mb-2 text-center">Competitor Issues</h3>
                            <div className="flex justify-around text-center">
                                <div><p className="text-2xl font-bold text-red-400">{results.report2.summary.critical}</p><p className="text-xs text-gray-500">Critical</p></div>
                                <div><p className="text-2xl font-bold text-yellow-400">{results.report2.summary.warning}</p><p className="text-xs text-gray-500">Warnings</p></div>
                            </div>
                        </div>
                    </div>

                </motion.div>
            )}
        </div>
    );
}

export default ComparePage;
