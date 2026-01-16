// src/pages/admin/ScannerPage.jsx
/**
 * SEO Scanner Page - Analyze any URL
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Globe, Loader2, RefreshCw } from 'lucide-react';
import { SEOScanner } from '@/utils/seo/seoScanner';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';
import { IssuesList } from '@/components/admin/IssuesList';
import { ExportButton } from '@/components/admin/ExportButton';
import { History, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { scanHistoryService } from '@/services/scanHistory';

export function ScannerPage() {
    const [searchParams] = useSearchParams();
    const [url, setUrl] = useState(searchParams.get('url') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [report, setReport] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [recentScans, setRecentScans] = useState([]);

    useEffect(() => {
        // Load recent scans on mount
        setRecentScans(scanHistoryService.getAllScans());
    }, []);

    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam && !report) {
            setUrl(urlParam);
            handleScan(urlParam);
        }
    }, [searchParams]);

    const handleScan = async (scanUrl = url) => {
        if (!scanUrl.trim()) {
            setError('Please enter a URL');
            return;
        }

        let finalUrl = scanUrl.trim();
        if (!finalUrl.startsWith('http')) {
            finalUrl = 'https://' + finalUrl;
        }

        setLoading(true);
        setError('');
        setReport(null);

        try {
            let html;

            // Check if scanning current page
            if (finalUrl === window.location.href || scanUrl === 'current') {
                // Scan current page directly - no CORS issues!
                html = document.documentElement.outerHTML;
                finalUrl = window.location.href;
            } else {
                // For external URLs, try to fetch
                try {
                    const response = await fetch(finalUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    html = await response.text();
                } catch (fetchError) {
                    // CORS blocked - provide helpful error
                    setError(
                        `❌ Cannot scan external URL due to CORS restrictions.\n\n` +
                        `💡 Solutions:\n` +
                        `1. Click "Scan Current Page" to analyze this page\n` +
                        `2. For your blog articles, navigate to the article and scan it\n` +
                        `3. Use Bulk Scan to analyze all articles at once\n\n` +
                        `ℹ️ This tool analyzes HTML directly - no AI involved!`
                    );
                    setLoading(false);
                    return;
                }
            }

            const scanner = new SEOScanner();
            const result = await scanner.analyze(finalUrl, html);
            setReport(result);
        } catch (err) {
            setError(`Failed to scan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    } finally {
        setLoading(false);
        // Refresh history list after a scan
        setRecentScans(scanHistoryService.getAllScans());
    }
};

const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan history?')) {
        scanHistoryService.clearHistory();
        setRecentScans([]);
    }
};



const tabs = [
    { id: 'all', label: 'All', count: report?.summary?.total },
    { id: 'critical', label: 'Critical', count: report?.summary?.critical },
    { id: 'warning', label: 'Warnings', count: report?.summary?.warning },
    { id: 'good', label: 'Passed', count: report?.summary?.good },
    { id: 'history', label: 'History', count: null, icon: History },
];

return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">SEO Scanner</h1>
            <p className="text-gray-400">Analyze any URL for 30+ SEO factors</p>
        </div>

        {/* URL Input */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="flex gap-4">
                <div className="flex-1 relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter URL to analyze (e.g., https://example.com)"
                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {loading ? 'Scanning...' : 'Scan'}
                </button>
            </form>



            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <pre className="text-red-400 text-sm whitespace-pre-wrap font-sans">{error}</pre>
                </div>
            )}
        </div>

        {/* Results or History Overview */}
        {report ? (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Score Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <SEOScoreCard title="SEO Score" score={report.score} icon={Search} />
                        <div>
                            <p className="text-sm text-gray-400">Analyzed URL:</p>
                            <p className="text-white font-mono text-sm truncate max-w-md">{report.url}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(report.analyzedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleScan()}
                            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <ExportButton report={report} filename={`seo-scan-${new URL(report.url).hostname}`} />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-red-400">{report.summary.critical}</p>
                        <p className="text-sm text-gray-400">Critical</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-400">{report.summary.warning}</p>
                        <p className="text-sm text-gray-400">Warnings</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-400">{report.summary.good}</p>
                        <p className="text-sm text-gray-400">Passed</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-400">{report.summary.info}</p>
                        <p className="text-sm text-gray-400">Info</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-700 pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm rounded-t-lg transition-all ${activeTab === tab.id
                                ? 'bg-slate-700 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab.label} {tab.count != null && <span className="text-xs opacity-60">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* Issues List or History */}
                {activeTab === 'history' ? (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Scan History for this URL</h3>
                        <div className="space-y-4">
                            {scanHistoryService.getHistory(report.url).map((scan, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${scan.score >= 90 ? 'bg-green-500/20 text-green-400' : scan.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                            <span className="font-bold text-lg">{scan.score}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">{new Date(scan.timestamp).toLocaleString()}</p>
                                            <div className="flex gap-2 text-xs mt-1">
                                                <span className="text-red-400">{scan.critical} Critical</span>
                                                <span className="text-yellow-400">{scan.warning} Warnings</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {scanHistoryService.getHistory(report.url).length === 0 && (
                                <p className="text-gray-400">No previous history found.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <IssuesList checks={report.checks} filter={activeTab} />
                )}
            </motion.div>
                    {/* Issues List or History */}
        {activeTab === 'history' ? (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Scan History for this URL</h3>
                <div className="space-y-4">
                    {scanHistoryService.getHistory(report.url).map((scan, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${scan.score >= 90 ? 'bg-green-500/20 text-green-400' : scan.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                    <span className="font-bold text-lg">{scan.score}</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">{new Date(scan.timestamp).toLocaleString()}</p>
                                    <div className="flex gap-2 text-xs mt-1">
                                        <span className="text-red-400">{scan.critical} Critical</span>
                                        <span className="text-yellow-400">{scan.warning} Warnings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {scanHistoryService.getHistory(report.url).length === 0 && (
                        <p className="text-gray-400">No previous history found.</p>
                    )}
                </div>
            </div>
        ) : (
            <IssuesList checks={report.checks} filter={activeTab} />
        )}
    </motion.div>
) : (
    /* Global History View when no report is active */
    <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Recent Scans
            </h2>
            {recentScans.length > 0 && (
                <button
                    onClick={handleClearHistory}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                    <Trash2 className="w-4 h-4" /> Clear History
                </button>
            )}
        </div>

        {recentScans.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-gray-400">No scan history yet. Enter a URL above to start!</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {recentScans.map((scan, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => { setUrl(scan.url); handleScan(scan.url); }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-blue-500/30 hover:bg-slate-800/80 cursor-pointer transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${scan.score >= 90 ? 'bg-green-500/20 text-green-400' :
                                    scan.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {scan.score}
                            </div>
                            <div>
                                <p className="text-white font-medium truncate max-w-lg">{scan.url}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                    <span>{new Date(scan.timestamp).toLocaleString()}</span>
                                    {scan.critical > 0 && <span className="text-red-400">{scan.critical} Critical Issues</span>}
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                ))}
            </div>
        )}
    </div>
)}

export default ScannerPage;
