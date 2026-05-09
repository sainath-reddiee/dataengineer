// src/components/admin/AdminLayout.jsx
/**
 * Admin Layout with Sidebar Navigation
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
    FileSearch, MessageCircleQuestion, Wand2, Globe, Activity, Fish, Wrench
} from 'lucide-react';
import { AdminAuth, useAdminAuth } from './AdminAuth';
import aiService from '@/services/aiService';
import gscService from '@/services/gscService';
import tinyfishService from '@/services/tinyfishService';

const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/article-optimizer', icon: Wand2, label: 'Article Optimizer', highlight: true },
    { path: '/admin/article-fixer', icon: Wrench, label: 'Article Fixer', highlight: true },
    { path: '/admin/trend-intelligence', icon: TrendingUp, label: 'Trend Intelligence', highlight: true },
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

function AdminNav() {
    const location = useLocation();
    const { logout } = useAdminAuth();
    const [provider, setProvider] = useState(aiService.provider);
    const [apiKey, setApiKey] = useState(aiService.isEnabled ? '••••••••' : '');
    const [keySet, setKeySet] = useState(aiService.isEnabled);
    const [gscConnected, setGscConnected] = useState(gscService.isConnected());
    const [tfKey, setTfKey] = useState(tinyfishService.isEnabled ? '••••••••' : '');
    const [tfSet, setTfSet] = useState(tinyfishService.isEnabled);

    // Handle GSC OAuth callback on any admin page load
    useEffect(() => {
        const handled = gscService.handleOAuthCallback();
        if (handled) setGscConnected(true);
        else setGscConnected(gscService.isConnected());
    }, [location]);

    const handleProviderChange = (p) => {
        aiService.setProvider(p);
        setProvider(p);
        setApiKey(aiService.isEnabled ? '••••••••' : '');
        setKeySet(aiService.isEnabled);
    };

    const handleApiKeySubmit = () => {
        if (apiKey && apiKey !== '••••••••') {
            aiService.setApiKey(apiKey);
            setApiKey('••••••••');
            setKeySet(true);
        }
    };

    const handleTfKeySubmit = () => {
        if (tfKey && tfKey !== '••••••••') {
            tinyfishService.setApiKey(tfKey);
            setTfKey('••••••••');
            setTfSet(true);
        }
    };

    return (
        <aside className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700 min-h-screen flex flex-col">
            <div className="p-4 border-b border-slate-700">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Blog</span>
                </Link>
                <h1 className="text-xl font-bold gradient-text">SEO Toolkit</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
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
                            className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
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

                {/* AI Provider */}
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Key className="w-3 h-3" />
                        AI Provider
                        {keySet && <span className="text-green-400 text-[10px]">Active</span>}
                    </label>
                    <div className="flex gap-1 mb-2">
                        <button
                            onClick={() => handleProviderChange('gemini')}
                            className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                                provider === 'gemini'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                            }`}
                        >
                            Gemini
                        </button>
                        <button
                            onClick={() => handleProviderChange('groq')}
                            className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                                provider === 'groq'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                            }`}
                        >
                            Groq
                        </button>
                    </div>
                    <div className="flex gap-1">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); setKeySet(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                            placeholder={provider === 'gemini' ? 'Gemini API key...' : 'Groq API key...'}
                            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleApiKeySubmit}
                            className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Set
                        </button>
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
                            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                            onClick={handleTfKeySubmit}
                            className="px-2 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
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
        </aside>
    );
}

export function AdminLayout() {
    return (
        <AdminAuth>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
                <AdminNav />
                <main className="flex-1 p-6 overflow-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </AdminAuth>
    );
}

export default AdminLayout;
