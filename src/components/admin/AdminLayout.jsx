// src/components/admin/AdminLayout.jsx
/**
 * Admin Layout with Sidebar Navigation (responsive: desktop sidebar + mobile drawer)
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Search, Layers, GitCompare,
    Code2, Eye, Sparkles, LogOut, ChevronLeft, CheckSquare, TrendingUp, Key,
    BookOpen, Link2, Clock, Zap, Target, DollarSign,
    Network, Calendar, Users, Sparkle, MousePointerClick, TrendingDown, Award,
    FileSearch, MessageCircleQuestion, Wand2, Globe, Activity, Fish, Wrench,
    Menu, X
} from 'lucide-react';
import { AdminAuth, useAdminAuth } from './AdminAuth';
import aiService from '@/services/aiService';
import { groqService } from '@/services/groqService';
import { geminiService } from '@/services/geminiService';
import aiKeyRing from '@/services/aiKeyRing';
import modelRegistry from '@/services/modelRegistry';
import gscService from '@/services/gscService';
import tinyfishService from '@/services/tinyfishService';

const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/history', icon: Activity, label: 'Activity History' },
    { path: '/admin/article-optimizer', icon: Wand2, label: 'Article Optimizer', highlight: true },
    { path: '/admin/article-fixer', icon: Wrench, label: 'Article Fixer', highlight: true },
    { path: '/admin/trend-intelligence', icon: TrendingUp, label: 'Trend Intelligence', highlight: true },
    { path: '/admin/article-writer', icon: FileSearch, label: 'AI Article Writer', highlight: true },
    { path: '/admin/serp-intelligence', icon: Globe, label: 'SERP Intelligence', highlight: true },
    { path: '/admin/rank-dashboard', icon: Target, label: 'Rank Intelligence', highlight: true },
    { path: '/admin/revenue', icon: DollarSign, label: 'Revenue Projection', highlight: true },
    { path: '/admin/content-calendar', icon: Calendar, label: 'Content Calendar', highlight: true },
    { path: '/admin/topic-clusters', icon: Network, label: 'Topic Clusters' },
    { path: '/admin/competitor-gap', icon: Users, label: 'Competitor Gap (AI)' },
    { path: '/admin/smart-linking', icon: Sparkle, label: 'Smart Linking (AI)' },
    { path: '/admin/ctr-fixer', icon: MousePointerClick, label: 'CTR Fixer', highlight: true },
    { path: '/admin/striking-distance', icon: Target, label: 'Striking Distance' },
    { path: '/admin/cannibalization', icon: FileSearch, label: 'Cannibalization', highlight: true },
    { path: '/admin/paa-optimizer', icon: MessageCircleQuestion, label: 'PAA Optimizer', highlight: true },
    { path: '/admin/content-decay', icon: TrendingDown, label: 'Content Decay' },
    { path: '/admin/snippet-optimizer', icon: Award, label: 'Snippet Optimizer' },
    { path: '/admin/scanner', icon: Search, label: 'SEO Scanner' },
    { path: '/admin/bulk', icon: Layers, label: 'Bulk Scan' },
    { path: '/admin/compare', icon: GitCompare, label: 'Compare URLs' },
    { path: '/admin/schema', icon: Code2, label: 'Schema Generator' },
    { path: '/admin/serp', icon: Eye, label: 'SERP Preview' },
    { path: '/admin/ai-suite', icon: Sparkles, label: 'AI Suite' },
    { path: '/admin/checklist', icon: CheckSquare, label: 'Checklist' },
    { path: '/admin/content-optimizer', icon: TrendingUp, label: 'Content Optimizer' },
    { path: '/admin/ctr-lab', icon: Zap, label: 'CTR Lab' },
    { path: '/admin/keyword-injector', icon: TrendingUp, label: 'Keyword Injector', highlight: true },
    { path: '/admin/keyword-target', icon: Target, label: 'Keyword Target', highlight: true },
    { path: '/admin/readability', icon: BookOpen, label: 'Readability' },
    { path: '/admin/internal-links', icon: Link2, label: 'Internal Links' },
    { path: '/admin/freshness', icon: Clock, label: 'Freshness' },
];

/**
 * NavContent — the actual sidebar contents. Shared between desktop sidebar and
 * mobile off-canvas drawer so we never drift.
 */
function NavContent({ onNavigate }) {
    const location = useLocation();
    const { logout } = useAdminAuth();
    const [provider, setProvider] = useState(aiService.provider);
    const [apiKey, setApiKey] = useState(''); // input buffer for adding new keys
    const [keyList, setKeyList] = useState({
        gemini: aiKeyRing.listKeys('gemini'),
        groq: aiKeyRing.listKeys('groq'),
    });
    const [gscConnected, setGscConnected] = useState(gscService.isConnected());
    const [tfKey, setTfKey] = useState(tinyfishService.isEnabled ? '••••••••' : '');
    const [tfSet, setTfSet] = useState(tinyfishService.isEnabled);
    const [status, setStatus] = useState(aiService.getStatus());
    const [models, setModels] = useState(modelRegistry.getAllModels());
    const [modelsExpanded, setModelsExpanded] = useState(false);
    const [testing, setTesting] = useState({}); // map keyIdx -> bool
    const [testResults, setTestResults] = useState({}); // map keyIdx -> result
    const [refreshing, setRefreshing] = useState(false);
    const [refreshResult, setRefreshResult] = useState(null);
    const [autoSyncDone, setAutoSyncDone] = useState(false);
    const [addFeedback, setAddFeedback] = useState(''); // duplicate-warning message

    // Poll status every second so cooldown timers tick
    useEffect(() => {
        const tick = () => {
            setStatus(aiService.getStatus());
            setKeyList({
                gemini: aiKeyRing.listKeys('gemini'),
                groq: aiKeyRing.listKeys('groq'),
            });
            setModels(modelRegistry.getAllModels());
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handled = gscService.handleOAuthCallback();
        if (handled) setGscConnected(true);
        else setGscConnected(gscService.isConnected());
    }, [location]);

    // Auto-sync model discovery once per tab if last sync > 24h ago and at least one key exists
    useEffect(() => {
        if (autoSyncDone) return;
        if (!aiService.isEnabled) return;
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const lastGemini = modelRegistry.getLastSync('gemini');
        const lastGroq = modelRegistry.getLastSync('groq');
        const stale = (Date.now() - Math.max(lastGemini, lastGroq)) > ONE_DAY;
        if (!stale) { setAutoSyncDone(true); return; }
        setAutoSyncDone(true);
        aiService.refreshAvailableModels()
            .then(result => setRefreshResult(result))
            .catch(() => { /* silent */ });
    }, [autoSyncDone]);

    const handleProviderChange = (p) => {
        aiService.setProvider(p);
        setProvider(p);
    };

    const handleAddKey = () => {
        const trimmed = apiKey.trim();
        if (!trimmed) return;
        const beforeCount = aiKeyRing.getKeyCount(provider);
        aiKeyRing.addKey(provider, trimmed);
        const afterCount = aiKeyRing.getKeyCount(provider);
        if (afterCount === beforeCount) {
            // Duplicate — addKey returned existing index without inserting
            setAddFeedback('That key is already added.');
            setTimeout(() => setAddFeedback(''), 2500);
        } else {
            setAddFeedback('');
        }
        setApiKey('');
        setKeyList({
            gemini: aiKeyRing.listKeys('gemini'),
            groq: aiKeyRing.listKeys('groq'),
        });
    };

    /**
     * Rebuild a per-key map ({"provider:index": value}) so its indices stay in
     * sync with aiKeyRing after a key at `removedIndex` is spliced out.
     */
    const reindexMap = (map, p, removedIndex) => {
        const next = {};
        Object.entries(map).forEach(([k, v]) => {
            const m = k.match(/^([^:]+):(\d+)$/);
            if (!m) { next[k] = v; return; }
            const [, mp, iStr] = m;
            const i = parseInt(iStr, 10);
            if (mp !== p) { next[k] = v; return; }
            if (i === removedIndex) return;        // drop stale entry
            if (i > removedIndex) next[`${mp}:${i - 1}`] = v;
            else next[k] = v;
        });
        return next;
    };

    const handleRemoveKey = (p, index) => {
        aiKeyRing.removeKey(p, index);
        setKeyList({
            gemini: aiKeyRing.listKeys('gemini'),
            groq: aiKeyRing.listKeys('groq'),
        });
        // Shift testResults + testing maps so they keep matching the right key
        setTestResults(prev => reindexMap(prev, p, index));
        setTesting(prev => reindexMap(prev, p, index));
    };

    const handleToggleModel = (modelProvider, modelId, enabled) => {
        modelRegistry.setEnabled(modelProvider, modelId, enabled);
        setModels(modelRegistry.getAllModels());
    };

    const handleTfKeySubmit = () => {
        if (tfKey && tfKey !== '••••••••') {
            tinyfishService.setApiKey(tfKey);
            setTfKey('••••••••');
            setTfSet(true);
        }
    };

    const handleTestKey = async (p, index) => {
        const tag = `${p}:${index}`;
        setTesting(prev => ({ ...prev, [tag]: true }));
        try {
            const svc = p === 'groq' ? groqService : geminiService;
            const defaultModel = p === 'groq' ? groqService.model : geminiService.model;
            // Use a model that's enabled for this provider, or the default
            const enabledModel = models.find(m => m.provider === p && m.enabled);
            const model = enabledModel?.model || defaultModel;
            const result = await svc.testConnection({ keyIndex: index, model });
            setTestResults(prev => ({ ...prev, [tag]: result }));
        } catch (e) {
            setTestResults(prev => ({ ...prev, [tag]: { ok: false, error: e.message } }));
        } finally {
            setTesting(prev => ({ ...prev, [tag]: false }));
        }
    };

    const handleTogglePersist = (p, index, currentPersist) => {
        aiKeyRing.setPersist(p, index, !currentPersist);
        setKeyList({
            gemini: aiKeyRing.listKeys('gemini'),
            groq: aiKeyRing.listKeys('groq'),
        });
    };

    const handleRefreshModels = async () => {
        setRefreshing(true);
        setRefreshResult(null);
        try {
            const result = await aiService.refreshAvailableModels();
            setRefreshResult(result);
            setModels(modelRegistry.getAllModels());
        } catch (e) {
            setRefreshResult({ error: e.message });
        } finally {
            setRefreshing(false);
        }
    };

    const handleClearDeprecated = () => {
        modelRegistry.clearDeprecated();
        setModels(modelRegistry.getAllModels());
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Blog</span>
                </Link>
                <h1 className="text-xl font-bold gradient-text">SEO Toolkit</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>

            {/* Single scroll area for nav + provider config so the API-key inputs are
                always reachable even when many keys + Models section are expanded. */}
            <div className="flex-1 overflow-y-auto">
                <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700 space-y-3">
                {/* GSC Connection */}
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Search className="w-3 h-3" />
                        Google Search Console
                        {gscConnected && <span className="text-green-400 text-[10px]">Live</span>}
                    </label>
                    {!gscConnected ? (
                        <button
                            onClick={() => gscService.startOAuth()}
                            disabled={!gscService.isConfigured()}
                            title={!gscService.isConfigured() ? 'Set VITE_GSC_CLIENT_ID in .env' : 'Connect Google Search Console'}
                            className="w-full px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Link2 className="w-3 h-3" /> Connect GSC
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <span className="flex-1 px-2 py-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-lg border border-emerald-500/40 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Connected
                            </span>
                            <button
                                onClick={() => { gscService.clearToken(); setGscConnected(false); }}
                                className="px-2 py-1.5 text-[10px] bg-slate-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-300 rounded-lg transition-colors"
                                title="Disconnect GSC"
                            >
                                <LogOut className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* AI Provider — multi-key + multi-model */}
                <div>
                    <label className="flex items-center justify-between gap-2 text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-2">
                            <Key className="w-3 h-3" />
                            AI Providers
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {status.availableLanes}/{status.totalLanes} lanes
                            {status.cooldownSeconds > 0 ? ` · ${status.cooldownSeconds}s` : ''}
                        </span>
                    </label>

                    {/* Provider tab — picks which provider new keys + tests target */}
                    <div className="flex gap-1 mb-2">
                        <button
                            onClick={() => handleProviderChange('gemini')}
                            className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
                                provider === 'gemini'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                            }`}
                        >
                            Gemini ({keyList.gemini.length})
                        </button>
                        <button
                            onClick={() => handleProviderChange('groq')}
                            className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
                                provider === 'groq'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                            }`}
                        >
                            Groq ({keyList.groq.length})
                        </button>
                    </div>

                    {/* Existing keys for the active provider — chips with persist toggle, remove + test.
                        Wrapped in a scroll container so 50+ keys don't overflow the sidebar. */}
                    {keyList[provider].length > 0 && (
                        <div className="space-y-1 mb-2 max-h-48 overflow-y-auto pr-0.5 -mr-0.5">
                            {keyList[provider].map((k) => {
                                const tag = `${provider}:${k.index}`;
                                const result = testResults[tag];
                                const isTesting = testing[tag];
                                const isCooling = k.cooldownSeconds > 0;
                                return (
                                    <div key={k.index} className="flex items-center gap-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                                        <button
                                            onClick={() => handleTogglePersist(provider, k.index, k.persist)}
                                            aria-label={k.persist ? 'Saved across sessions, click to make session-only' : 'Session only, click to save across sessions'}
                                            className={`text-[12px] leading-none flex-shrink-0 ${k.persist ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
                                            title={k.persist ? 'Saved across sessions (click to make session-only)' : 'Session only (click to save across sessions)'}
                                        >
                                            {k.persist ? '★' : '☆'}
                                        </button>
                                        <span className="text-[10px] font-mono text-gray-300 flex-1 min-w-0 truncate">
                                            {k.masked}
                                            {isCooling && (
                                                <span className="ml-1.5 text-amber-400">· {k.cooldownSeconds}s</span>
                                            )}
                                        </span>
                                        {result && (
                                            <span className={`text-[9px] truncate max-w-[80px] ${result.ok ? 'text-green-400' : 'text-red-400'}`} title={result.error || result.response}>
                                                {result.ok ? `✓${result.latencyMs}ms` : `✗${(result.error || '').slice(0, 12)}`}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleTestKey(provider, k.index)}
                                            disabled={isTesting || isCooling}
                                            title={isCooling ? `Cooldown ${k.cooldownSeconds}s` : 'Test this key'}
                                            className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 hover:bg-slate-700 text-gray-400 hover:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isTesting ? '…' : 'Test'}
                                        </button>
                                        <button
                                            onClick={() => handleRemoveKey(provider, k.index)}
                                            aria-label="Remove key"
                                            className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-300 rounded"
                                            title="Remove key"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add new key */}
                    <div className="flex gap-1">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                            placeholder={provider === 'gemini' ? 'Add Gemini API key...' : 'Add Groq API key...'}
                            className="flex-1 min-w-0 px-2 py-2 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleAddKey}
                            disabled={!apiKey.trim()}
                            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1">
                        Add multiple keys to multiply free-tier quota via round-robin.
                        ★ = saved across sessions (this browser only, never bundled). ☆ = session only.
                    </p>
                    {addFeedback && (
                        <p className="text-[10px] text-amber-400 mt-1" role="status">{addFeedback}</p>
                    )}

                    {/* Aggregate cooldown badge */}
                    {status.isRateLimited && (
                        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-amber-900/30 border border-amber-600/30 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[10px] text-amber-300">
                                All lanes cooling — next free in {status.cooldownSeconds}s
                            </span>
                        </div>
                    )}

                    {/* Models toggle section */}
                    <div className="mt-3 border-t border-slate-700/50 pt-3">
                        <button
                            onClick={() => setModelsExpanded(!modelsExpanded)}
                            className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white"
                        >
                            <span className="flex items-center gap-1.5">
                                <Sparkle className="w-3 h-3" />
                                Models ({status.modelStats.enabled} enabled / {status.modelStats.total}
                                {status.modelStats.deprecated > 0 ? ` · ${status.modelStats.deprecated} deprecated` : ''})
                            </span>
                            <span>{modelsExpanded ? '▾' : '▸'}</span>
                        </button>
                        {modelsExpanded && (
                            <div className="mt-2 space-y-2">
                                {/* Refresh + last-synced */}
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={handleRefreshModels}
                                        disabled={refreshing || !aiService.isEnabled}
                                        className="px-2 py-1 text-[9px] font-medium bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-40 disabled:cursor-not-allowed text-blue-200 rounded transition-colors"
                                    >
                                        {refreshing ? 'Refreshing…' : '⟳ Refresh available models'}
                                    </button>
                                    {refreshResult && !refreshing && (
                                        <span className="text-[9px] text-gray-500 truncate" title={JSON.stringify(refreshResult)}>
                                            {refreshResult.gemini?.ok && `G:${refreshResult.gemini.count}`}
                                            {refreshResult.gemini?.ok && refreshResult.groq?.ok && ' · '}
                                            {refreshResult.groq?.ok && `Gq:${refreshResult.groq.count}`}
                                            {!refreshResult.gemini?.ok && !refreshResult.groq?.ok && '✗ failed'}
                                        </span>
                                    )}
                                </div>
                                {status.modelStats.deprecated > 0 && (
                                    <button
                                        onClick={handleClearDeprecated}
                                        className="text-[9px] text-amber-400 hover:text-amber-300 underline"
                                    >
                                        Clear {status.modelStats.deprecated} deprecated
                                    </button>
                                )}
                                {['gemini', 'groq'].map(p => (
                                    <div key={p}>
                                        <div className="text-[9px] uppercase tracking-wide text-gray-500 mb-1 capitalize">{p}</div>
                                        {models.filter(m => m.provider === p).map(m => (
                                            <label
                                                key={`${m.provider}:${m.model}`}
                                                className={`flex items-center gap-2 px-1.5 py-1 hover:bg-slate-700/30 rounded cursor-pointer ${m.deprecated ? 'opacity-60' : ''}`}
                                                title={m.deprecated ? 'Provider removed this model — disable to clean up' : m.model}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={m.enabled}
                                                    onChange={(e) => handleToggleModel(m.provider, m.model, e.target.checked)}
                                                    className="w-3 h-3 accent-blue-500"
                                                />
                                                <span className={`text-[10px] flex-1 truncate ${m.deprecated ? 'line-through text-gray-500' : m.enabled ? 'text-gray-200' : 'text-gray-500'}`}>
                                                    {m.label}
                                                </span>
                                                {m.deprecated && (
                                                    <span className="text-[9px] text-amber-400 flex-shrink-0">⚠ deprecated</span>
                                                )}
                                                {!m.deprecated && m.cooldownSeconds > 0 && (
                                                    <span className="text-[9px] text-amber-400">{m.cooldownSeconds}s</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* TinyFish Web Search */}
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Fish className="w-3 h-3" />
                        TinyFish (Web Search)
                        {tfSet && <span className="text-green-400 text-[10px]">Active</span>}
                    </label>
                    <div className="flex gap-1">
                        <input
                            type="password"
                            value={tfKey}
                            onChange={(e) => { setTfKey(e.target.value); setTfSet(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleTfKeySubmit()}
                            placeholder="sk-tinyfish-..."
                            className="flex-1 min-w-0 px-2 py-2 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                            onClick={handleTfKeySubmit}
                            className="px-3 py-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                        >
                            Set
                        </button>
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1">FREE search — enriches all tools</p>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
                    </div>
                </div>{/* end flex-1 overflow-y-auto */}
                </div>
    );
}

export function AdminLayout() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const location = useLocation();

    // Close drawer on route change
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    // Lock body scroll while drawer is open
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileNavOpen]);

    return (
        <AdminAuth>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Mobile sticky top bar — hidden on md+ */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700">
                    <button
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Open admin menu"
                        className="p-2 -ml-1 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 active:bg-slate-700"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-sm font-bold gradient-text">SEO Toolkit</span>
                    <Link
                        to="/"
                        className="p-2 -mr-1 rounded-lg text-gray-400 hover:text-white"
                        aria-label="Back to blog"
                    >
                        <Globe className="w-5 h-5" />
                    </Link>
                </header>

                <div className="flex">
                    {/* Desktop sidebar — hidden on mobile */}
                    <aside className="hidden md:flex w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700 min-h-screen flex-col flex-shrink-0">
                        <NavContent />
                    </aside>

                    {/* Mobile off-canvas drawer */}
                    {mobileNavOpen && (
                        <div className="md:hidden fixed inset-0 z-50 flex">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setMobileNavOpen(false)}
                                aria-hidden="true"
                            />
                            <div className="relative w-[85%] max-w-xs bg-slate-900 border-r border-slate-700 shadow-2xl animate-slide-in-left flex flex-col">
                                <button
                                    onClick={() => setMobileNavOpen(false)}
                                    className="absolute top-3 right-3 z-10 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <NavContent onNavigate={() => setMobileNavOpen(false)} />
                            </div>
                        </div>
                    )}

                    <main className="flex-1 min-w-0 p-3 md:p-6 overflow-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </main>
                </div>
            </div>
        </AdminAuth>
    );
}

export default AdminLayout;
