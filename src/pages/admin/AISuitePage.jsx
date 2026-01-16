// src/pages/admin/AISuitePage.jsx
/**
 * AI Suite Page - PSEO, AEO, GEO Analysis
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Mic, Search as SearchIcon, Loader2, Globe } from 'lucide-react';
import { PSEOAnalyzer } from '@/utils/seo/pseoAnalyzer';
import { AEOAnalyzer } from '@/utils/seo/aeoAnalyzer';
import { GEOAnalyzer } from '@/utils/seo/geoAnalyzer';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';
import { IssuesList } from '@/components/admin/IssuesList';
import { ExportButton } from '@/components/admin/ExportButton';

const tabs = [
    { id: 'pseo', label: 'PSEO', icon: Bot, desc: 'Programmatic SEO', color: 'purple' },
    { id: 'aeo', label: 'AEO', icon: Mic, desc: 'Answer Engine', color: 'green' },
    { id: 'geo', label: 'GEO', icon: Sparkles, desc: 'Generative Engine', color: 'blue' },
];

export function AISuitePage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('pseo');

    const handleAnalyze = async (scanUrl = url) => {
        if (!scanUrl.trim() && scanUrl !== 'current') {
            setError('Please enter a URL');
            return;
        }

        let finalUrl = scanUrl.trim();
        if (finalUrl !== 'current' && !finalUrl.startsWith('http')) {
            finalUrl = 'https://' + finalUrl;
        }

        setLoading(true);
        setError('');

        try {
            let html;
            let article;

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
                    setError(
                        `❌ Cannot scan external URL due to CORS restrictions.\n\n` +
                        `💡 Solutions:\n` +
                        `1. Click "Scan Current Page" to analyze this page\n` +
                        `2. Navigate to an article and scan it\n` +
                        `3. Use Bulk Scan for all articles\n\n` +
                        `ℹ️ This tool uses pattern analysis - no AI involved!`
                    );
                    setLoading(false);
                    return;
                }
            }

            // Create article object from fetched content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            article = {
                url: finalUrl,
                title: doc.querySelector('title')?.textContent || '',
                content: doc.body?.innerHTML || '',
                excerpt: doc.querySelector('meta[name="description"]')?.content || '',
                category: doc.querySelector('meta[property="article:section"]')?.content || '',
                tags: [],
                slug: new URL(finalUrl).pathname.split('/').pop() || ''
            };

            // Run all analyzers
            const pseo = new PSEOAnalyzer().analyze(article);
            const aeo = new AEOAnalyzer().analyze(article);
            const geo = new GEOAnalyzer().analyze(article);

            const overall = Math.round((pseo.score + aeo.score + geo.score) / 3);

            setResults({
                url: finalUrl,
                overall,
                pseo,
                aeo,
                geo,
                analyzedAt: new Date().toISOString()
            });
        } catch (err) {
            setError(`Failed to analyze: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };



    const getActiveReport = () => {
        if (!results) return null;
        return results[activeTab];
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Suite</h1>
                <p className="text-gray-400">PSEO, AEO, and GEO optimization analysis</p>
            </div>

            {/* URL Input */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter URL to analyze"
                            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'Analyzing...' : 'Analyze AI'}
                    </button>
                </form>



                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <pre className="text-red-400 text-sm whitespace-pre-wrap font-sans">{error}</pre>
                    </div>
                )}
            </div>

            {/* Results */}
            {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Score Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SEOScoreCard title="Overall AI Score" score={results.overall} icon={Sparkles} color="purple" />
                        <SEOScoreCard title="PSEO Score" score={results.pseo.score} icon={Bot} color="purple" subtitle="Programmatic SEO" />
                        <SEOScoreCard title="AEO Score" score={results.aeo.score} icon={Mic} color="green" subtitle="Answer Engine" />
                        <SEOScoreCard title="GEO Score" score={results.geo.score} icon={Sparkles} color="blue" subtitle="Generative Engine" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <div className="text-left">
                                    <span className="font-medium">{tab.label}</span>
                                    <span className="text-xs text-gray-500 ml-2">{tab.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Active Tab Content */}
                    {getActiveReport() && (
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    {tabs.find(t => t.id === activeTab)?.label} Analysis
                                </h3>
                                <ExportButton report={getActiveReport()} filename={`${activeTab}-analysis`} />
                            </div>
                            <IssuesList checks={getActiveReport()?.checks || []} />
                        </div>
                    )}
                </motion.div>
            )}

            {/* Info Cards */}
            {!results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tabs.map(tab => (
                        <div key={tab.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                            <div className={`p-3 rounded-xl bg-${tab.color}-500/20 inline-block mb-4`}>
                                <tab.icon className={`w-6 h-6 text-${tab.color}-400`} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{tab.label}</h3>
                            <p className="text-sm text-gray-400">{tab.desc} Optimization</p>
                            <ul className="mt-4 text-sm text-gray-500 space-y-1">
                                {tab.id === 'pseo' && (
                                    <>
                                        <li>• Template consistency</li>
                                        <li>• Automation quality</li>
                                        <li>• Scalability patterns</li>
                                    </>
                                )}
                                {tab.id === 'aeo' && (
                                    <>
                                        <li>• Featured snippet potential</li>
                                        <li>• Voice search optimization</li>
                                        <li>• FAQ schema detection</li>
                                    </>
                                )}
                                {tab.id === 'geo' && (
                                    <>
                                        <li>• AI readability score</li>
                                        <li>• Entity optimization</li>
                                        <li>• Citation worthiness</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AISuitePage;
