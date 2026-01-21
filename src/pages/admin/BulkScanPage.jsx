// src/pages/admin/BulkScanPage.jsx
/**
 * Advanced Bulk Scan Page
 * Features:
 * 1. Manual URL Input
 * 2. Article Selection
 * 3. Custom Feed Parser (Sitemap, RSS, JSON, Text)
 * 4. AI-Powered Insights
 * 5. Competitor Comparison
 * 6. Advanced Filters
 * 7. Scan Queue Management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Play, Loader2, CheckCircle, AlertCircle, ArrowUpDown,
    ChevronDown, ChevronRight, AlertTriangle, TrendingUp, TrendingDown,
    Download, FileText
} from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { analyzeArticleFull } from '@/utils/seo';
import scanHistory from '@/services/scanHistory';
import feedParser from '@/services/feedParser';
import contentOptimizerService from '@/services/contentOptimizerService';
import pdfExportService from '@/services/pdfExportService';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';

// Import new bulk scan components
import {
    ScanSourceSelector,
    ManualUrlInput,
    FeedUrlInput,
    ArticleSelector,
    AdvancedFilters,
    ScanQueue,
    AIInsights,
    CompetitorComparison
} from '@/components/admin/bulk-scan';

export function BulkScanPage() {
    // Data sources
    const [scanSource, setScanSource] = useState('wordpress'); // 'wordpress' | 'manual' | 'feed'
    const [articles, setArticles] = useState([]);
    const [manualUrls, setManualUrls] = useState([]);
    const [feedUrls, setFeedUrls] = useState([]);

    // Selection
    const [selectedArticles, setSelectedArticles] = useState(new Set());

    // Scanning state
    const [loading, setLoading] = useState(false);
    const [queue, setQueue] = useState([]);
    const [queueStatus, setQueueStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'completed'
    const [currentIndex, setCurrentIndex] = useState(0);

    // Results
    const [results, setResults] = useState([]);
    const [competitorResults, setCompetitorResults] = useState([]);

    // Filters & sorting
    const [filters, setFilters] = useState({
        search: '',
        category: null,
        scoreMin: 0,
        scoreMax: 100
    });
    const [sortBy, setSortBy] = useState('score');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Refs for pause/cancel
    const scanningRef = useRef(false);
    const pausedRef = useRef(false);

    // Load WordPress articles on mount
    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await wordpressApi.getAllPosts(1, 100);
            setArticles(data.posts || []);
            // Select all by default
            setSelectedArticles(new Set((data.posts || []).map(a => a.id)));
        } catch (err) {
            console.error('Failed to load articles:', err);
            setArticles([]);
        }
        setLoading(false);
    };

    // Handle manual URL input
    const handleManualUrls = (urls) => {
        setManualUrls(urls);
        setSelectedArticles(new Set(urls.map(u => u.url)));
    };

    // Handle feed URL parsing
    const handleFeedUrls = (urls) => {
        setFeedUrls(urls);
        setSelectedArticles(new Set(urls.map(u => u.url)));
    };

    // Get current data source
    const getCurrentArticles = () => {
        switch (scanSource) {
            case 'manual': return manualUrls;
            case 'feed': return feedUrls;
            default: return articles;
        }
    };

    // Filter articles based on filters
    const getFilteredArticles = useCallback(() => {
        let items = getCurrentArticles();

        if (filters.search) {
            const search = filters.search.toLowerCase();
            items = items.filter(a =>
                (a.title || '').toLowerCase().includes(search) ||
                (a.url || a.slug || '').toLowerCase().includes(search)
            );
        }

        if (filters.category) {
            items = items.filter(a => a.category === filters.category);
        }

        return items;
    }, [scanSource, articles, manualUrls, feedUrls, filters]);

    // Get unique categories
    const getCategories = () => {
        const cats = new Set();
        getCurrentArticles().forEach(a => {
            if (a.category) cats.add(a.category);
        });
        return [...cats];
    };

    // Build scan queue from selection
    const buildQueue = () => {
        const items = getFilteredArticles().filter(a =>
            selectedArticles.has(a.id || a.url)
        );
        return items.map((a, i) => ({
            id: a.id || a.url || i,
            title: a.title || 'Untitled',
            url: a.url || `${window.location.origin}/articles/${a.slug}`,
            slug: a.slug,
            content: a.content || '',
            category: a.category,
            status: 'queued'
        }));
    };

    // Start scanning
    const handleStartScan = async () => {
        const newQueue = buildQueue();
        if (newQueue.length === 0) return;

        setQueue(newQueue);
        setQueueStatus('running');
        setCurrentIndex(0);
        setResults([]);
        scanningRef.current = true;
        pausedRef.current = false;

        await runScanQueue(newQueue, 0);
    };

    // Run the scan queue
    const runScanQueue = async (queueItems, startIndex) => {
        const newResults = [...results];

        for (let i = startIndex; i < queueItems.length; i++) {
            // Check for pause/cancel
            if (!scanningRef.current) {
                setQueueStatus('idle');
                return;
            }
            if (pausedRef.current) {
                setQueueStatus('paused');
                setCurrentIndex(i);
                return;
            }

            const item = queueItems[i];
            setCurrentIndex(i);

            // Update queue item status
            const updatedQueue = [...queueItems];
            updatedQueue[i] = { ...updatedQueue[i], status: 'scanning' };
            setQueue(updatedQueue);

            try {
                let analysis;

                // Different analysis for different sources
                if (scanSource === 'wordpress') {
                    // Use existing WordPress analysis
                    analysis = await analyzeArticleFull({
                        ...item,
                        content: item.content
                    }, `<!DOCTYPE html><html><head><title>${item.title}</title></head><body>${item.content}</body></html>`);
                } else {
                    // Fetch and analyze external URL
                    try {
                        analysis = await contentOptimizerService.analyzeURL(item.url);
                    } catch (fetchErr) {
                        throw new Error(`Failed to fetch: ${fetchErr.message}`);
                    }
                }

                // Calculate trend
                const previous = scanHistory.getLatest(item.slug || item.url);
                const trend = previous ? (analysis.overallScore || analysis.score) - previous.score : 0;

                // Save history
                if (item.slug) {
                    scanHistory.addScan(item.slug, analysis.overallScore || analysis.score, {
                        pseo: analysis.pseo?.score,
                        aeo: analysis.aeo?.score,
                        geo: analysis.geo?.score
                    });
                }

                // Aggregate issues
                const critical = (analysis.traditional?.summary?.critical || 0);
                const warning = (analysis.traditional?.summary?.warning || 0) +
                    (analysis.pseo?.summary?.warning || 0) +
                    (analysis.aeo?.summary?.warning || 0) +
                    (analysis.geo?.summary?.warning || 0);

                // Collect top issues
                const allChecks = [
                    ...(analysis.traditional?.checks || []),
                    ...(analysis.pseo?.checks || []),
                    ...(analysis.aeo?.checks || []),
                    ...(analysis.geo?.checks || []),
                    ...(analysis.issues || []).map(i => ({ label: i, score: 0 }))
                ];

                const topIssues = allChecks
                    .filter(c => (c.score || 0) < 100)
                    .sort((a, b) => (a.score || 0) - (b.score || 0))
                    .slice(0, 5);

                const result = {
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    url: item.url,
                    category: item.category,
                    score: analysis.overallScore || analysis.score || 0,
                    grade: analysis.overallGrade || analysis.grade || 'N/A',
                    trend,
                    pseo: analysis.pseo?.score || 0,
                    aeo: analysis.aeo?.score || 0,
                    geo: analysis.geo?.score || 0,
                    critical,
                    warning,
                    wordCount: analysis.wordCount || 0,
                    questions: analysis.questions || 0,
                    authorityLinks: analysis.authorityLinks || 0,
                    hasTLDR: analysis.hasTLDR || false,
                    hasLastUpdated: analysis.hasLastUpdated || false,
                    topIssues,
                    aiVisibility: analysis.aiVisibility
                };

                newResults.push(result);
                updatedQueue[i] = { ...updatedQueue[i], status: 'done', score: result.score };
                setQueue([...updatedQueue]);
                setResults([...newResults]);

            } catch (err) {
                console.error(`Failed to analyze ${item.title}:`, err);
                updatedQueue[i] = { ...updatedQueue[i], status: 'error', error: err.message };
                setQueue([...updatedQueue]);
                newResults.push({
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    url: item.url,
                    score: 0,
                    grade: 'F',
                    trend: 0,
                    error: err.message,
                    critical: 0, warning: 0, topIssues: []
                });
                setResults([...newResults]);
            }

            // Small delay to prevent overwhelming
            await new Promise(r => setTimeout(r, 100));
        }

        // Only mark as completed if we actually finished all items
        if (scanningRef.current && !pausedRef.current) {
            setQueueStatus('completed');
        }
        scanningRef.current = false;
    };

    // Pause scanning
    const handlePause = () => {
        pausedRef.current = true;
    };

    // Resume scanning
    const handleResume = () => {
        pausedRef.current = false;
        setQueueStatus('running');
        runScanQueue(queue, currentIndex);
    };

    // Cancel scanning
    const handleCancel = () => {
        scanningRef.current = false;
        pausedRef.current = false;
        setQueueStatus('idle');
    };

    // Clear queue
    const handleClearQueue = () => {
        setQueue([]);
        setQueueStatus('idle');
        setCurrentIndex(0);
    };

    // Load competitor data
    const handleLoadCompetitor = async (url) => {
        const urls = await feedParser.parseUrl(url, 'auto');
        const competitorQueue = urls.slice(0, 10).map((u, i) => ({
            id: `comp-${i}`,
            url: u,
            title: new URL(u).pathname.split('/').filter(Boolean).pop() || 'Untitled'
        }));

        // Quick scan competitor URLs
        const compResults = [];
        for (const item of competitorQueue) {
            try {
                const analysis = await contentOptimizerService.analyzeURL(item.url);
                compResults.push({
                    ...item,
                    score: analysis.score || 0,
                    wordCount: analysis.wordCount || 0,
                    questions: analysis.questions || 0,
                    authorityLinks: analysis.authorityLinks || 0
                });
            } catch (e) {
                compResults.push({ ...item, score: 0, error: e.message });
            }
        }
        setCompetitorResults(compResults);
    };

    // Export results to PDF
    const handleExportPDF = () => {
        if (results.length === 0) return;
        pdfExportService.exportBulkScan(results, `bulk-scan-${Date.now()}.pdf`);
    };

    // Toggle row expansion
    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Filter and sort results
    const filteredResults = results.filter(r => {
        if (filters.search) {
            const search = filters.search.toLowerCase();
            if (!(r.title || '').toLowerCase().includes(search) &&
                !(r.url || '').toLowerCase().includes(search)) return false;
        }
        if (filters.category && r.category !== filters.category) return false;
        if (r.score < filters.scoreMin || r.score > filters.scoreMax) return false;
        return true;
    });

    const sortedResults = [...filteredResults].sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
        : 0;

    // Source counts
    const sourceCounts = {
        wordpress: articles.length,
        manual: manualUrls.length,
        feed: feedUrls.length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Advanced Bulk Scan</h1>
                        <p className="text-gray-400">Analyze multiple articles with AI-powered insights</p>
                    </div>
                    <div className="flex gap-3">
                        {results.length > 0 && (
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Export PDF
                            </button>
                        )}
                        <button
                            onClick={handleStartScan}
                            disabled={queueStatus === 'running' || selectedArticles.size === 0}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/30"
                        >
                            {queueStatus === 'running' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                            {queueStatus === 'running' ? 'Scanning...' : `Scan ${selectedArticles.size} Articles`}
                        </button>
                    </div>
                </div>

                {/* Source Selector */}
                <ScanSourceSelector
                    source={scanSource}
                    onChange={setScanSource}
                    counts={sourceCounts}
                />

                {/* Source-specific Input */}
                {scanSource === 'manual' && (
                    <ManualUrlInput
                        onUrlsLoad={handleManualUrls}
                        initialUrls={manualUrls.map(u => u.url)}
                    />
                )}

                {scanSource === 'feed' && (
                    <FeedUrlInput onUrlsLoad={handleFeedUrls} />
                )}

                {/* Advanced Filters */}
                <AdvancedFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={getCategories()}
                />

                {/* Article Selector - Show for all sources */}
                {!loading && getCurrentArticles().length > 0 && (
                    <ArticleSelector
                        articles={getFilteredArticles()}
                        selected={selectedArticles}
                        onSelectionChange={setSelectedArticles}
                        disabled={queueStatus === 'running'}
                    />
                )}

                {/* Scan Queue */}
                {queue.length > 0 && (
                    <ScanQueue
                        queue={queue}
                        currentIndex={currentIndex}
                        status={queueStatus}
                        onStart={handleStartScan}
                        onPause={handlePause}
                        onResume={handleResume}
                        onCancel={handleCancel}
                        onClear={handleClearQueue}
                    />
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

                {/* AI Insights & Competitor Comparison */}
                {results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AIInsights results={results} />
                        <CompetitorComparison
                            yourResults={results}
                            competitorResults={competitorResults}
                            onLoadCompetitor={handleLoadCompetitor}
                        />
                    </div>
                )}

                {/* Results Table */}
                {sortedResults.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                Scan Results ({sortedResults.length})
                            </h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-900/30">
                                <tr>
                                    <th className="w-10"></th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Title</th>
                                    <th
                                        className="text-center px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-white"
                                        onClick={() => { setSortBy('score'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                                    >
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
                                    <React.Fragment key={result.id || result.url}>
                                        <tr
                                            className={`hover:bg-slate-700/30 cursor-pointer ${expandedRows.has(result.id) ? 'bg-slate-700/30' : ''}`}
                                            onClick={() => toggleRow(result.id)}
                                        >
                                            <td className="pl-4">
                                                {expandedRows.has(result.id)
                                                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium line-clamp-1">{result.title}</span>
                                                {result.url && (
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{result.url}</div>
                                                )}
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
                                                    href={result.url || `/articles/${result.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-purple-400 hover:text-purple-300 text-sm font-medium mr-3"
                                                >
                                                    Open
                                                </a>
                                                <a
                                                    href={`/admin/content-optimizer?url=${encodeURIComponent(result.url || `${window.location.origin}/articles/${result.slug}`)}`}
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
                                                            {result.topIssues && result.topIssues.length > 0 ? (
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
                                                                                {issue.message && (
                                                                                    <p className="text-xs text-gray-500 mt-1">{issue.message}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-500 italic">No critical issues found! 🎉</p>
                                                            )}
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
                {!loading && getCurrentArticles().length === 0 && (
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
                        <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">
                            {scanSource === 'wordpress'
                                ? 'No articles found from WordPress'
                                : scanSource === 'manual'
                                    ? 'Paste URLs to scan'
                                    : 'Enter a feed URL to load articles'
                            }
                        </p>
                        {scanSource === 'wordpress' && (
                            <button
                                onClick={loadArticles}
                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                                Retry Loading
                            </button>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default BulkScanPage;
