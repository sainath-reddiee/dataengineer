// src/pages/admin/AISuitePage.jsx
/**
 * AI Suite Page - PSEO, AEO, GEO Analysis
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Mic, Search as SearchIcon, Loader2, Globe, Copy, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PSEOAnalyzer } from '@/utils/seo/pseoAnalyzer';
import { AEOAnalyzer } from '@/utils/seo/aeoAnalyzer';
import { GEOAnalyzer } from '@/utils/seo/geoAnalyzer';
import { SEOScoreCard } from '@/components/admin/SEOScoreCard';
import { IssuesList } from '@/components/admin/IssuesList';
import { ExportButton } from '@/components/admin/ExportButton';
import { AICitationsPanel } from '@/components/admin/AICitationsPanel';
import { SerpCoveragePanel } from '@/components/admin/SerpCoveragePanel';
import { EngagementPanel } from '@/components/admin/EngagementPanel';
import { fetchBlogArticleHTML } from '@/utils/fetchBlogArticleHTML';
import aiService from '@/services/aiService';

const tabs = [
    { id: 'pseo', label: 'PSEO', icon: Bot, desc: 'Programmatic SEO', color: 'purple' },
    { id: 'aeo', label: 'AEO', icon: Mic, desc: 'Answer Engine', color: 'green' },
    { id: 'geo', label: 'GEO', icon: Sparkles, desc: 'Generative Engine', color: 'blue' },
];

export function AISuitePage() {
    const [searchParams] = useSearchParams();
    const [url, setUrl] = useState(searchParams.get('url') || (searchParams.get('slug') ? `https://dataengineerhub.blog/articles/${searchParams.get('slug')}` : ''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('pseo');
    const [aiFixLoading, setAiFixLoading] = useState(false);
    const [aiFix, setAiFix] = useState(null);
    const [copied, setCopied] = useState(false);

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

            // For blog articles, fetch from WordPress API directly
            const wpHTML = await fetchBlogArticleHTML(finalUrl);
            if (wpHTML) {
                html = wpHTML;
            }
            // Check if scanning current page
            else if (finalUrl === window.location.href || scanUrl === 'current') {
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
                tags: Array.from(doc.querySelectorAll('meta[property="article:tag"]')).map(tag => ({ name: tag.content })),
                date: doc.querySelector('meta[property="article:published_time"]')?.content || '',
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

            {/* LLM referral tracker — persistent, independent of the URL analyzer below */}
            <AICitationsPanel />

            {/* Engagement funnel — click-inside and scroll depth per source */}
            <EngagementPanel />

            {/* SERP feature coverage — rich-result gaps across all articles */}
            <SerpCoveragePanel />

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

                            {/* AI Fix All Button */}
                            <div className="mt-6 pt-4 border-t border-slate-700/50">
                                <button
                                    onClick={async () => {
                                        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
                                        setAiFixLoading(true);
                                        setAiFix(null);
                                        const failedChecks = (getActiveReport()?.checks || []).filter(c => !c.passed);
                                        const issueList = failedChecks.map(c => `- [${c.category}] ${c.message}${c.recommendation ? ` → Fix: ${c.recommendation}` : ''}`).join('\n');
                                        const tabName = tabs.find(t => t.id === activeTab)?.label || activeTab;
                                        const prompt = `You are a ${tabName} optimization expert. An article has been analyzed and these issues were found:\n\nARTICLE: ${results?.url || url}\n\nISSUES:\n${issueList}\n\nFor EACH issue, generate a READY-TO-PASTE fix. Format as:\n\n## [Issue Category]: [Issue Name]\n**Problem:** [what's wrong]\n**Fix (paste this into your article):**\n[actual HTML/content to add]\n\n---\n\nBe specific, actionable, and provide real content — not placeholders.`;
                                        try {
                                            const response = await aiService.generateSuggestion(prompt, '');
                                            setAiFix(response);
                                        } catch (e) {
                                            setAiFix(`Error: ${e.message}`);
                                        }
                                        setAiFixLoading(false);
                                    }}
                                    disabled={aiFixLoading || !(getActiveReport()?.checks || []).some(c => !c.passed)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    {aiFixLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {aiFixLoading ? 'Generating fixes...' : `AI Fix All ${activeTab.toUpperCase()} Issues`}
                                </button>

                                {aiFix && (
                                    <div className="mt-4 bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-emerald-400">AI-Generated Fixes</span>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(aiFix); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy All'}
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                                            {aiFix}
                                        </div>
                                    </div>
                                )}
                            </div>
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
