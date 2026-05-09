// src/pages/admin/StrikingDistancePage.jsx
// Finds keywords where you rank #8-20 with high impressions â€” low-hanging fruit for page 1.

import React, { useEffect, useState } from 'react';
import { Target, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';

export function StrikingDistancePage() {
    const [loading, setLoading] = useState(true);
    const [keywords, setKeywords] = useState([]);
    const [error, setError] = useState('');
    const [expandedQuery, setExpandedQuery] = useState(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            if (!gscService.isConnected()) {
                setError('Connect Google Search Console first (use the button in Rank Intelligence).');
                setLoading(false);
                return;
            }

            const data = await gscService.queryTopKeywords({ rowLimit: 500 });

            // Filter for striking distance: position 8-20 with meaningful impressions
            const striking = data
                .filter(row => row.position >= 8 && row.position <= 20 && row.impressions >= 30)
                .map(row => ({
                    ...row,
                    potentialClicks: Math.round(row.impressions * getExpectedCTR(3)), // if moved to #3
                    currentExpectedClicks: Math.round(row.impressions * getExpectedCTR(row.position)),
                    uplift: Math.round(row.impressions * getExpectedCTR(3)) - row.clicks,
                }))
                .sort((a, b) => b.uplift - a.uplift);

            setKeywords(striking);
        } catch (e) {
            setError(e.message || 'Failed to load');
        }
        setLoading(false);
    }

    const totalUplift = keywords.reduce((s, k) => s + k.uplift, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Target className="w-8 h-8 text-amber-400" />
                        Striking Distance Keywords
                    </h1>
                    <p className="text-gray-400">Keywords ranking #8-20 with high impressions â€” a content refresh or optimization could push these to page 1.</p>
                </div>
                <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Fetching keyword data from GSC...</span>
                </div>
            )}

            {!loading && !error && keywords.length > 0 && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-amber-400">{keywords.length}</div>
                            <div className="text-xs text-gray-400">Striking Distance Keywords</div>
                        </div>
                        <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">+{totalUplift.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Potential Extra Clicks/Month</div>
                        </div>
                        <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-blue-400">{keywords.reduce((s, k) => s + k.impressions, 0).toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Total Impressions</div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-700 text-[10px] text-gray-500 uppercase tracking-wider">
                            <div className="col-span-5">Keyword</div>
                            <div className="col-span-1 text-center">Position</div>
                            <div className="col-span-2 text-center">Impressions</div>
                            <div className="col-span-1 text-center">Clicks</div>
                            <div className="col-span-1 text-center">CTR</div>
                            <div className="col-span-2 text-right">If Page 1</div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {keywords.map((kw, i) => (
                                <KeywordRow key={i} kw={kw} expanded={expandedQuery === kw.query} onToggle={() => setExpandedQuery(expandedQuery === kw.query ? null : kw.query)} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function KeywordRow({ kw, expanded, onToggle }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [aiTips, setAiTips] = useState(null);

    const posColor = kw.position <= 10 ? 'text-amber-400' : 'text-orange-400';

    const handleAI = async () => {
        if (!aiService.isEnabled) { alert('Set AI key in sidebar.'); return; }
        setAiLoading(true);
        try {
            const prompt = `Keyword: "${kw.query}"
Current position: #${kw.position.toFixed(1)}
Impressions: ${kw.impressions}/month
Current clicks: ${kw.clicks}

This keyword is in "striking distance" (position 8-20). Give me 3-4 specific actions to push it to page 1 (position 1-5). Be concrete â€” what content to add, what to optimize, what format Google prefers for this query. Keep each point to 1-2 sentences.`;

            const response = await aiService.generateSuggestion(prompt, '');
            setAiTips(response);
        } catch (e) { console.error(e); setAiTips(`Error: ${e.message || 'Failed to generate AI tips'}`); }
        setAiLoading(false);
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-5 text-sm text-gray-200 truncate">{kw.query}</div>
                <div className={`col-span-1 text-center text-xs font-bold ${posColor}`}>#{kw.position.toFixed(1)}</div>
                <div className="col-span-2 text-center text-xs text-gray-400">{kw.impressions.toLocaleString()}</div>
                <div className="col-span-1 text-center text-xs text-gray-400">{kw.clicks}</div>
                <div className="col-span-1 text-center text-xs text-gray-400">{(kw.ctr * 100).toFixed(1)}%</div>
                <div className="col-span-2 text-right text-xs text-emerald-400 font-mono">+{kw.uplift} clicks</div>
            </div>
            {expanded && (
                <div className="px-6 pb-3 bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                            Move to top 3 â†’ estimated <span className="text-emerald-300">+{kw.uplift} clicks/month</span>
                        </div>
                        <button onClick={handleAI} disabled={aiLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white rounded-lg">
                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {aiLoading ? 'Thinking...' : 'AI: How to rank #1'}
                        </button>
                    </div>
                    {aiTips && (
                        <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg text-sm text-gray-200 whitespace-pre-wrap">
                            {aiTips}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function getExpectedCTR(position) {
    const ctrByPosition = [0, 0.28, 0.15, 0.11, 0.08, 0.06, 0.045, 0.035, 0.03, 0.025, 0.02];
    const pos = Math.max(1, Math.min(10, Math.round(position)));
    if (pos <= 10) return ctrByPosition[pos];
    if (pos <= 20) return 0.01;
    return 0.005;
}

export default StrikingDistancePage;
