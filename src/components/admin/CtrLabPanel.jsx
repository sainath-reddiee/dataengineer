// src/components/admin/CtrLabPanel.jsx
// Batch CTR scorer over all published articles. Merges real GSC data (position,
// impressions, clicks, CTR) when connected. Sorted by click-gap opportunity when
// GSC available, by heuristic score otherwise. Expands into CtrLabDetail for
// full diagnostic per article.

import React, { useEffect, useMemo, useState } from 'react';
import {
    TrendingUp, RefreshCw, Zap, AlertTriangle, ChevronDown, ChevronRight,
    ExternalLink, Search, MousePointerClick,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import { scoreCtr, scoreCtrBatch } from '@/utils/ctrScorer';
import gscService from '@/services/gscService';
import { CtrLabDetail } from './CtrLabDetail';

const GRADE_COLORS = {
    A: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    B: 'text-lime-400   border-lime-500/40   bg-lime-500/10',
    C: 'text-amber-400  border-amber-500/40  bg-amber-500/10',
    D: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    F: 'text-red-400    border-red-500/40    bg-red-500/10',
};

// Expected CTR by position (industry averages)
function getExpectedCTR(position) {
    const table = [0, 0.28, 0.15, 0.11, 0.08, 0.06, 0.045, 0.035, 0.03, 0.025, 0.02];
    const pos = Math.max(1, Math.min(10, Math.round(position || 999)));
    if (pos <= 10) return table[pos];
    if (pos <= 20) return 0.01;
    return 0.005;
}

export function CtrLabPanel() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rows, setRows] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('opportunity'); // opportunity | score | impressions
    const [tick, setTick] = useState(0);
    const [gscAvailable, setGscAvailable] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const hasGsc = gscService.isConnected();
                setGscAvailable(hasGsc);

                // Fetch WP posts + GSC data in parallel
                const promises = [wordpressApi.getAllPosts(1, 100)];
                if (hasGsc) promises.push(gscService.queryTopPages({ rowLimit: 200 }).catch(() => []));
                else promises.push(Promise.resolve([]));

                const [wpResult, gscPages] = await Promise.all(promises);
                const posts = wpResult.posts || [];

                // Build scored rows from heuristic scorer
                const scored = scoreCtrBatch(posts);

                // Merge GSC data
                const gscMap = {};
                (gscPages || []).forEach(row => {
                    const m = (row.page || '').match(/\/articles\/([^/?#]+)/);
                    if (m) gscMap[m[1]] = row;
                });

                const merged = scored.map(r => {
                    const gsc = gscMap[r.slug];
                    if (gsc) {
                        const expected = getExpectedCTR(gsc.position);
                        return {
                            ...r,
                            position: gsc.position,
                            impressions: gsc.impressions,
                            clicks: gsc.clicks,
                            ctr: gsc.ctr,
                            expectedCtr: expected,
                            clickGap: Math.max(0, Math.round(gsc.impressions * expected) - gsc.clicks),
                        };
                    }
                    return { ...r, position: null, impressions: 0, clicks: 0, ctr: null, expectedCtr: null, clickGap: 0 };
                });

                if (!cancelled) {
                    setRows(merged);
                    // Auto-expand from URL param
                    const targetSlug = searchParams.get('slug');
                    if (targetSlug) {
                        const match = merged.find(s => s.slug === targetSlug);
                        if (match) setExpanded({ [match.slug]: true });
                    }
                }
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Failed to load posts');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [tick, searchParams]);

    const summary = useMemo(() => {
        if (!rows.length) return { avg: 0, atRisk: 0, totalMissedClicks: 0, totalImpressions: 0 };
        const avg = Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
        const atRisk = rows.filter(r => r.grade === 'D' || r.grade === 'F').length;
        const totalMissedClicks = rows.reduce((a, r) => a + (r.clickGap || 0), 0);
        const totalImpressions = rows.reduce((a, r) => a + (r.impressions || 0), 0);
        return { avg, atRisk, totalMissedClicks, totalImpressions };
    }, [rows]);

    const visible = useMemo(() => {
        let filtered = rows;
        if (filter === 'red')    filtered = rows.filter(r => r.grade === 'D' || r.grade === 'F');
        if (filter === 'yellow') filtered = rows.filter(r => r.grade === 'C');
        if (filter === 'green')  filtered = rows.filter(r => r.grade === 'A' || r.grade === 'B');

        // Sort
        if (sortBy === 'opportunity') filtered = [...filtered].sort((a, b) => (b.clickGap || 0) - (a.clickGap || 0));
        else if (sortBy === 'score') filtered = [...filtered].sort((a, b) => a.score - b.score); // worst first
        else if (sortBy === 'impressions') filtered = [...filtered].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));

        return filtered;
    }, [rows, filter, sortBy]);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                        <MousePointerClick className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">CTR Lab</h2>
                        <p className="text-sm text-gray-400">
                            Diagnose why articles underperform in clicks — fix titles, descriptions, and keyword alignment.
                            {!gscAvailable && ' Connect GSC for real position + click gap data.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setTick(t => t + 1)}
                    className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-sm text-white flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <div className="text-xs uppercase tracking-wider text-blue-300">Avg CTR Score</div>
                    <div className="text-3xl font-bold text-white mt-1">{summary.avg}<span className="text-sm text-gray-400"> / 100</span></div>
                    <div className="text-xs text-gray-400 mt-1">across {rows.length} articles</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <div className="text-xs uppercase tracking-wider text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> At-Risk
                    </div>
                    <div className="text-3xl font-bold text-white mt-1">{summary.atRisk}</div>
                    <div className="text-xs text-gray-400 mt-1">grade D or F — fix first</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <div className="text-xs uppercase tracking-wider text-amber-300">Missed Clicks</div>
                    <div className="text-3xl font-bold text-white mt-1">{summary.totalMissedClicks.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">recoverable clicks/month</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="text-xs uppercase tracking-wider text-emerald-300">Impressions</div>
                    <div className="text-3xl font-bold text-white mt-1">{(summary.totalImpressions / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-gray-400 mt-1">monthly search visibility</div>
                </div>
            </div>

            {/* Filters + Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { k: 'all',    label: `All (${rows.length})` },
                        { k: 'red',    label: `Red (${rows.filter(r => r.grade === 'D' || r.grade === 'F').length})` },
                        { k: 'yellow', label: `Yellow (${rows.filter(r => r.grade === 'C').length})` },
                        { k: 'green',  label: `Green (${rows.filter(r => r.grade === 'A' || r.grade === 'B').length})` },
                    ].map(f => (
                        <button
                            key={f.k}
                            onClick={() => setFilter(f.k)}
                            className={`px-3 py-1.5 rounded-lg text-xs ${filter === f.k
                                ? 'bg-blue-600/40 text-white border border-blue-500/50'
                                : 'bg-slate-700/40 text-gray-400 hover:text-white border border-transparent'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">Sort:</span>
                    {[
                        { k: 'opportunity', label: 'Click Gap' },
                        { k: 'score', label: 'Worst Score' },
                        { k: 'impressions', label: 'Impressions' },
                    ].map(s => (
                        <button
                            key={s.k}
                            onClick={() => setSortBy(s.k)}
                            className={`px-2 py-1 rounded text-[10px] ${sortBy === s.k
                                ? 'bg-blue-600/30 text-blue-300'
                                : 'bg-slate-700/40 text-gray-500 hover:text-gray-300'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* GSC not connected banner */}
            {!gscAvailable && !loading && (
                <div className="p-3 bg-blue-900/10 border border-blue-800/30 rounded-lg flex items-center gap-2 text-blue-300 text-xs">
                    <Search className="w-3.5 h-3.5 flex-shrink-0" />
                    Connect GSC in the sidebar for real position data, click gaps, and keyword-aware diagnostics.
                </div>
            )}

            {/* Table */}
            {loading && <div className="text-sm text-gray-400 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading posts…</div>}
            {error && <div className="text-sm text-red-400">Error: {error}</div>}
            {!loading && !error && visible.length === 0 && (
                <div className="text-sm text-gray-500 italic py-8 text-center">No posts match this filter.</div>
            )}

            {!loading && !error && visible.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-slate-700">
                                <th className="py-2 pr-2 w-8">#</th>
                                <th className="py-2 pr-3">Title</th>
                                <th className="py-2 pr-3 text-center">Score</th>
                                {gscAvailable && <th className="py-2 pr-3 text-center">Pos</th>}
                                {gscAvailable && <th className="py-2 pr-3 text-right">Imp</th>}
                                {gscAvailable && <th className="py-2 pr-3 text-right">Gap</th>}
                                <th className="py-2 pr-3">Top Issue</th>
                                <th className="py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r, i) => {
                                const open = !!expanded[r.slug];
                                return (
                                    <React.Fragment key={r.slug || `row-${i}`}>
                                        <tr className="border-b border-slate-800/60 align-top hover:bg-slate-800/30 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [r.slug]: !e[r.slug] }))}>
                                            <td className="py-3 pr-2 text-gray-600 text-xs">{i + 1}</td>
                                            <td className="py-3 pr-3">
                                                <div className="text-white line-clamp-1 max-w-xs">{r.title}</div>
                                                <div className="text-[10px] text-gray-600 mt-0.5">{r.slug}</div>
                                            </td>
                                            <td className="py-3 pr-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${GRADE_COLORS[r.grade]}`}>
                                                    {r.score} · {r.grade}
                                                </span>
                                            </td>
                                            {gscAvailable && (
                                                <td className="py-3 pr-3 text-center text-xs text-gray-400">
                                                    {r.position ? `#${Math.round(r.position)}` : '—'}
                                                </td>
                                            )}
                                            {gscAvailable && (
                                                <td className="py-3 pr-3 text-right text-xs text-gray-400 tabular-nums">
                                                    {r.impressions ? r.impressions.toLocaleString() : '—'}
                                                </td>
                                            )}
                                            {gscAvailable && (
                                                <td className="py-3 pr-3 text-right">
                                                    {r.clickGap > 0
                                                        ? <span className="text-xs text-emerald-400 font-mono">+{r.clickGap}</span>
                                                        : <span className="text-xs text-gray-600">—</span>}
                                                </td>
                                            )}
                                            <td className="py-3 pr-3">
                                                {r.quickWins?.[0] && (
                                                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                                                        {r.quickWins[0].label.split('(')[0].trim().slice(0, 28)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right whitespace-nowrap">
                                                <button className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1">
                                                    {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                    {open ? 'Close' : 'Diagnose'}
                                                </button>
                                            </td>
                                        </tr>
                                        {open && (
                                            <tr className="border-b border-slate-800/60">
                                                <td />
                                                <td colSpan={gscAvailable ? 7 : 4} className="py-3 pr-3">
                                                    <CtrLabDetail row={r} onClose={() => setExpanded(e => ({ ...e, [r.slug]: false }))} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong>{' '}
                Scores every article against CTR benchmarks (title length, numbers, year, power words, keyword alignment).
                When GSC is connected, merges real position + impressions data to compute missed-click opportunities.
                Click "Diagnose" on any article for SERP preview, keyword map, competitor titles, AI variants, and before/after comparison.
            </div>
        </div>
    );
}

export default CtrLabPanel;
