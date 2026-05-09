// src/pages/admin/SerpIntelligencePage.jsx
// TinyFish-powered SERP Intelligence â€” live competitor analysis, SERP feature
// detection, PAA extraction, page validation, and competitor monitoring.

import React, { useState } from 'react';
import {
    Globe, Loader2, AlertTriangle, Search, Target, FileText, CheckCircle,
    XCircle, ExternalLink, RefreshCw, Copy, Check, Eye,
    MessageCircleQuestion, Shield, Users,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import tinyfishService from '@/services/tinyfishService';

const TABS = [
    { id: 'serp', label: 'SERP Features', icon: Search, desc: 'Check Google results for any keyword' },
    { id: 'competitor', label: 'Competitor Scrape', icon: Users, desc: 'Analyze competitor article structure' },
    { id: 'paa', label: 'PAA Extraction', icon: MessageCircleQuestion, desc: 'Get real People Also Ask questions' },
    { id: 'validate', label: 'Page Validation', icon: Shield, desc: 'Check how your page renders live' },
    { id: 'monitor', label: 'Competitor Monitor', icon: Eye, desc: 'Track competitor content updates' },
];

// API Key status check (key is now set via sidebar)
function ApiKeyStatus() {
    return !tinyfishService.isEnabled ? (
        <div className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-lg border border-amber-500/40">
            Set TinyFish key in sidebar â†’
        </div>
    ) : (
        <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-lg border border-emerald-500/40">
            TinyFish Active
        </div>
    );
}

// SERP Features Tab
function SerpFeaturesTab() {
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleCheck = async () => {
        if (!keyword.trim()) return;
        if (!tinyfishService.isEnabled) { setError('Set TinyFish API key first'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const data = await tinyfishService.checkSERPFeatures(keyword);
            setResult(data.result || data);
        } catch (e) { setError(e.message); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheck()} placeholder="Enter keyword (e.g., snowflake interview questions)" className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500" />
                <button onClick={handleCheck} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Searching Google...' : 'Check SERP'}
                </button>
            </div>
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            {result && (
                <div className="space-y-4">
                    {/* Feature Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <FeatureCard label="Featured Snippet" active={result.featuredSnippet?.exists} detail={result.featuredSnippet?.type} />
                        <FeatureCard label="AI Overview" active={result.hasAIOverview} />
                        <FeatureCard label="Knowledge Panel" active={result.hasKnowledgePanel} />
                        <FeatureCard label="PAA Box" active={(result.paaQuestions || []).length > 0} detail={`${(result.paaQuestions || []).length} questions`} />
                    </div>
                    {/* PAA Questions */}
                    {result.paaQuestions?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-purple-400 mb-2">People Also Ask</h4>
                            <div className="space-y-1">
                                {result.paaQuestions.map((q, i) => <div key={i} className="text-xs text-gray-300 flex items-start gap-2"><MessageCircleQuestion className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />{q}</div>)}
                            </div>
                        </div>
                    )}
                    {/* Organic Results */}
                    {result.organicResults?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-blue-400 mb-2">Top Organic Results</h4>
                            <div className="space-y-2">
                                {result.organicResults.slice(0, 10).map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className="text-gray-500 font-mono w-5 flex-shrink-0">#{r.position}</span>
                                        <div className="min-w-0">
                                            <div className="text-white font-medium truncate">{r.title}</div>
                                            <div className="text-emerald-400 truncate">{r.url}</div>
                                            <div className="text-gray-500 line-clamp-1">{r.snippet}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Related Searches */}
                    {result.relatedSearches?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-amber-400 mb-2">Related Searches</h4>
                            <div className="flex flex-wrap gap-2">
                                {result.relatedSearches.map((s, i) => <span key={i} className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-gray-300 border border-slate-700">{s}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Competitor Scrape Tab
function CompetitorScrapeTab() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleScrape = async () => {
        if (!url.trim()) return;
        if (!tinyfishService.isEnabled) { setError('Set TinyFish API key first'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const data = await tinyfishService.analyzeCompetitor(url.startsWith('http') ? url : `https://${url}`);
            setResult(data.result || data);
        } catch (e) { setError(e.message); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScrape()} placeholder="https://competitor.com/their-article" className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500" />
                <button onClick={handleScrape} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {loading ? 'Scraping...' : 'Analyze'}
                </button>
            </div>
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            {result && (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                        <h4 className="text-lg font-bold text-white mb-1">{result.title}</h4>
                        <p className="text-xs text-gray-400 mb-3">{result.metaDescription}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <StatCard label="Words" value={result.wordCount?.toLocaleString() || '?'} />
                            <StatCard label="Headings" value={result.headings?.length || 0} />
                            <StatCard label="Images" value={result.images?.length || 0} />
                            <StatCard label="FAQs" value={result.faqs?.length || 0} />
                            <StatCard label="Internal Links" value={result.internalLinks || 0} />
                            <StatCard label="External Links" value={result.externalLinks || 0} />
                            <StatCard label="Has TL;DR" value={result.hasTLDR ? 'Yes' : 'No'} good={result.hasTLDR} />
                            <StatCard label="Updated Date" value={result.hasLastUpdated ? 'Yes' : 'No'} good={result.hasLastUpdated} />
                        </div>
                    </div>
                    {result.headings?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-blue-400 mb-2">Content Structure ({result.headings.length} headings)</h4>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {result.headings.map((h, i) => <div key={i} className="text-xs text-gray-300">{h}</div>)}
                            </div>
                        </div>
                    )}
                    {result.faqs?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-green-400 mb-2">FAQs Found ({result.faqs.length})</h4>
                            <div className="space-y-2">
                                {result.faqs.map((f, i) => <div key={i} className="text-xs"><span className="text-white font-medium">Q: {f.question}</span><br /><span className="text-gray-400">A: {f.answer?.substring(0, 150)}...</span></div>)}
                            </div>
                        </div>
                    )}
                    {result.schemaTypes?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                            <h4 className="text-sm font-semibold text-purple-400 mb-2">Schema Markup</h4>
                            <div className="flex flex-wrap gap-2">
                                {result.schemaTypes.map((s, i) => <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{s}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// PAA Extraction Tab
function PAAExtractionTab() {
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleExtract = async () => {
        if (!keyword.trim()) return;
        if (!tinyfishService.isEnabled) { setError('Set TinyFish API key first'); return; }
        setLoading(true); setError(''); setQuestions([]);
        try {
            const data = await tinyfishService.extractPAA(keyword);
            setQuestions(Array.isArray(data) ? data : data?.result || []);
        } catch (e) { setError(e.message); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExtract()} placeholder="Enter keyword to find PAA questions" className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500" />
                <button onClick={handleExtract} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircleQuestion className="w-4 h-4" />}
                    {loading ? 'Extracting from Google...' : 'Extract PAA'}
                </button>
            </div>
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            {questions.length > 0 && (
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-purple-400">{questions.length} PAA Questions Found</h4>
                        <button onClick={() => { navigator.clipboard.writeText(questions.join('\n')).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs text-blue-400 flex items-center gap-1">
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied!' : 'Copy All'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {questions.map((q, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                                <span className="text-purple-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                                <span className="text-sm text-gray-200">{q}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-3">Use these questions as H2/H3 headings or FAQ entries to target PAA boxes. Answer each in 40-60 words for snippet eligibility.</p>
                </div>
            )}
        </div>
    );
}

// Page Validation Tab
function PageValidationTab() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleValidate = async () => {
        if (!url.trim()) return;
        if (!tinyfishService.isEnabled) { setError('Set TinyFish API key first'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const data = await tinyfishService.validatePage(url.startsWith('http') ? url : `https://${url}`);
            setResult(data.result || data);
        } catch (e) { setError(e.message); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleValidate()} placeholder="https://dataengineerhub.blog/articles/your-article" className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500" />
                <button onClick={handleValidate} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {loading ? 'Validating...' : 'Validate'}
                </button>
            </div>
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            {result && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ValidationCheck label="Page Renders" passed={result.fullyRendered} detail={result.fullyRendered ? 'Fully rendered' : 'Incomplete render detected'} />
                        <ValidationCheck label="Has Content" passed={result.hasContent} detail={result.hasContent ? 'Content visible' : 'Page appears blank'} />
                        <ValidationCheck label="Title Tag" passed={!!result.title} detail={result.title?.substring(0, 60) || 'Missing'} />
                        <ValidationCheck label="Meta Description" passed={!!result.metaDescription} detail={result.metaDescription?.substring(0, 80) || 'Missing'} />
                        <ValidationCheck label="H1 Tag" passed={result.h1Count === 1} detail={result.h1Count === 1 ? result.h1 : `${result.h1Count || 0} H1 tags found`} />
                        <ValidationCheck label="Canonical URL" passed={!!result.canonical} detail={result.canonical || 'Not set'} />
                        <ValidationCheck label="Schema Markup" passed={(result.schemaTypes || []).length > 0} detail={(result.schemaTypes || []).join(', ') || 'None found'} />
                        <ValidationCheck label="Broken Images" passed={result.brokenImages === 0} detail={result.brokenImages === 0 ? 'None' : `${result.brokenImages} broken`} />
                    </div>
                </div>
            )}
        </div>
    );
}

// Competitor Monitor Tab
function CompetitorMonitorTab() {
    const [domain, setDomain] = useState('');
    const [topic, setTopic] = useState('snowflake');
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');

    const handleMonitor = async () => {
        if (!domain.trim()) return;
        if (!tinyfishService.isEnabled) { setError('Set TinyFish API key first'); return; }
        setLoading(true); setError(''); setArticles([]);
        try {
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const data = await tinyfishService.monitorCompetitor(cleanDomain, topic);
            setArticles(Array.isArray(data.result) ? data.result : data?.result || []);
        } catch (e) { setError(e.message); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="competitor-blog.com" className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 col-span-1" />
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic to track" className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 col-span-1" />
                <button onClick={handleMonitor} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    {loading ? 'Monitoring...' : 'Check'}
                </button>
            </div>
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
            {articles.length > 0 && (
                <div className="space-y-2">
                    {articles.map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm text-white font-medium">{a.title}</div>
                                    {a.url && <div className="text-xs text-blue-400 truncate mt-0.5">{a.url}</div>}
                                    {a.excerpt && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{a.excerpt}</div>}
                                </div>
                                {a.publishDate && <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{a.publishDate}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper Components
function FeatureCard({ label, active, detail }) {
    return (
        <div className={`p-3 rounded-xl border text-center ${active ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700/50'}`}>
            <div className={`text-xs font-medium ${active ? 'text-emerald-300' : 'text-gray-500'}`}>{label}</div>
            <div className={`text-lg font-bold mt-1 ${active ? 'text-emerald-400' : 'text-gray-600'}`}>{active ? 'YES' : 'NO'}</div>
            {detail && <div className="text-[10px] text-gray-500 mt-0.5">{detail}</div>}
        </div>
    );
}

function StatCard({ label, value, good }) {
    return (
        <div className="p-2 bg-slate-800/60 rounded-lg">
            <div className="text-[10px] text-gray-500">{label}</div>
            <div className={`text-lg font-bold ${good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-white'}`}>{value}</div>
        </div>
    );
}

function ValidationCheck({ label, passed, detail }) {
    return (
        <div className={`p-3 rounded-xl border flex items-start gap-2 ${passed ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
            {passed ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
            <div className="min-w-0">
                <div className={`text-xs font-medium ${passed ? 'text-emerald-300' : 'text-red-300'}`}>{label}</div>
                <div className="text-[10px] text-gray-500 truncate">{detail}</div>
            </div>
        </div>
    );
}

// Main Page
export function SerpIntelligencePage() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('serp');

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Globe className="w-8 h-8 text-cyan-400" />
                        SERP Intelligence
                    </h1>
                    <p className="text-gray-400">Powered by TinyFish â€” live Google SERP analysis, competitor scraping, PAA extraction, and page validation using a real browser.</p>
                </div>
                <ApiKeyStatus />
            </div>

            {!tinyfishService.isEnabled && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Enter your TinyFish API key above to enable SERP intelligence features.
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1.5 bg-slate-800/50 p-1.5 rounded-xl overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-white border border-cyan-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Tab */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">{TABS.find(t => t.id === activeTab)?.label}</h3>
                    <p className="text-xs text-gray-500">{TABS.find(t => t.id === activeTab)?.desc}</p>
                </div>
                {activeTab === 'serp' && <SerpFeaturesTab />}
                {activeTab === 'competitor' && <CompetitorScrapeTab />}
                {activeTab === 'paa' && <PAAExtractionTab />}
                {activeTab === 'validate' && <PageValidationTab />}
                {activeTab === 'monitor' && <CompetitorMonitorTab />}
            </div>
        </div>
    );
}

export default SerpIntelligencePage;
