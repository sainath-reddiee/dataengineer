// src/pages/admin/RevenueProjectionPage.jsx
// AdSense revenue potential calculator — shows current vs projected
// earnings per article based on view counts and rank potential.

import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Loader2, TrendingUp, ExternalLink } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { scoreArticlesBatch } from '@/utils/rankIntelligence';

export function RevenueProjectionPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [rpm, setRpm] = useState(3); // Revenue Per 1000 pageviews (USD)
    const [monthlyTarget, setMonthlyTarget] = useState(500);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                const scored = scoreArticlesBatch(data.posts || []);
                setArticles(scored);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        load();
    }, []);

    // Recompute revenue with user-specified RPM
    const withRevenue = useMemo(() => {
        return articles.map(a => {
            const views = 0; // We don't have historical views here; use projections
            // Keep the model's trafficMultiplier logic but apply current RPM
            const ratio = rpm / 3; // default RPM in model is $3
            return {
                ...a,
                currentMonthly: a.revenueProjection.currentMonthly * ratio,
                potentialMonthly: a.revenueProjection.potentialMonthly * ratio,
                uplift: a.revenueProjection.potentialMonthly * ratio - a.revenueProjection.currentMonthly * ratio,
            };
        });
    }, [articles, rpm]);

    const totals = useMemo(() => {
        const current = withRevenue.reduce((s, a) => s + a.currentMonthly, 0);
        const potential = withRevenue.reduce((s, a) => s + a.potentialMonthly, 0);
        return {
            current: Math.round(current * 100) / 100,
            potential: Math.round(potential * 100) / 100,
            uplift: Math.round((potential - current) * 100) / 100,
            pctGap: Math.round(((potential - current) / (current || 1)) * 100),
        };
    }, [withRevenue]);

    const articlesByUplift = useMemo(
        () => [...withRevenue].sort((a, b) => b.uplift - a.uplift).slice(0, 20),
        [withRevenue]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Calculating revenue projections...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                    Revenue Projection
                </h1>
                <p className="text-gray-400">Estimate AdSense revenue potential per article if they reach page 1.</p>
            </div>

            {/* Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Your RPM ($ per 1000 views)</label>
                    <input
                        type="number"
                        value={rpm}
                        step="0.5"
                        min="0.5"
                        max="50"
                        onChange={(e) => setRpm(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Typical tech blogs: $2-5. Check AdSense after approval.</p>
                </div>
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Monthly Revenue Target ($)</label>
                    <input
                        type="number"
                        value={monthlyTarget}
                        step="50"
                        min="0"
                        onChange={(e) => setMonthlyTarget(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Used to show how close projections get you to your goal.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <div className="text-xs text-gray-400 uppercase">Current Monthly Est.</div>
                    <div className="text-2xl font-bold text-white">${totals.current.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                    <div className="text-xs text-emerald-400 uppercase">Potential Monthly</div>
                    <div className="text-2xl font-bold text-emerald-400">${totals.potential.toFixed(2)}</div>
                    <div className="text-[11px] text-gray-500 mt-1">if all articles hit page 1</div>
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-800/40 rounded-xl">
                    <div className="text-xs text-blue-400 uppercase">Revenue Gap</div>
                    <div className="text-2xl font-bold text-blue-400">+${totals.uplift.toFixed(2)}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{totals.pctGap}% uplift potential</div>
                </div>
                <div className="p-4 bg-purple-900/20 border border-purple-800/40 rounded-xl">
                    <div className="text-xs text-purple-400 uppercase">Target Progress</div>
                    <div className="text-2xl font-bold text-purple-400">
                        {monthlyTarget > 0 ? Math.min(100, Math.round((totals.potential / monthlyTarget) * 100)) : 0}%
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">of ${monthlyTarget}/mo goal</div>
                </div>
            </div>

            {/* Top Opportunities */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Top 20 Revenue Opportunities (biggest uplift first)
                    </h3>
                </div>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-slate-700 uppercase tracking-wider">
                    <div className="col-span-6">Article</div>
                    <div className="col-span-2 text-center">Health</div>
                    <div className="col-span-2 text-right">Current</div>
                    <div className="col-span-2 text-right">Potential</div>
                </div>
                <div className="divide-y divide-slate-700/50">
                    {articlesByUplift.map(a => (
                        <div key={a.slug} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 transition">
                            <div className="col-span-6 text-sm text-gray-200 truncate">{a.title}</div>
                            <div className="col-span-2 text-center">
                                <span className={`text-sm font-mono ${
                                    a.articleHealth >= 75 ? 'text-emerald-400' :
                                    a.articleHealth >= 55 ? 'text-amber-400' :
                                    'text-red-400'
                                }`}>{a.articleHealth}</span>
                            </div>
                            <div className="col-span-2 text-right text-sm text-gray-400 font-mono">
                                ${a.currentMonthly.toFixed(2)}
                            </div>
                            <div className="col-span-2 text-right text-sm text-emerald-400 font-mono font-semibold">
                                ${a.potentialMonthly.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                <p className="text-xs text-amber-300 leading-relaxed">
                    <strong>Note:</strong> Projections are estimates based on your article health score and assumed traffic multipliers
                    (1.2x for healthy articles, 3x for medium, 8x for low-health ones that can be significantly improved).
                    Actual revenue depends on your real traffic, niche CTR, and AdSense RPM. Check real numbers once AdSense is approved.
                </p>
            </div>
        </div>
    );
}

export default RevenueProjectionPage;
