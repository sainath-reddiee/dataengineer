// src/components/admin/CtrLabPanel.jsx
// Batch CTR scorer over all published articles. Lists biggest-opportunity
// pages first, with an inline editor that lets the owner rewrite a title or
// description and see the projected lift update in real time.

import React, { useEffect, useMemo, useState } from 'react';
import {
    TrendingUp, RefreshCw, Zap, AlertTriangle, ChevronDown, ChevronRight,
    Edit3, X, ExternalLink,
} from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { scoreCtr, scoreCtrBatch } from '@/utils/ctrScorer';

const GRADE_COLORS = {
    A: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    B: 'text-lime-400   border-lime-500/40   bg-lime-500/10',
    C: 'text-amber-400  border-amber-500/40  bg-amber-500/10',
    D: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    F: 'text-red-400    border-red-500/40    bg-red-500/10',
};

const RowEditor = ({ row, onClose }) => {
    const [title, setTitle] = useState(row.title || '');
    const [desc, setDesc] = useState(row.excerpt || '');
    const live = useMemo(() => scoreCtr({ title, description: desc }), [title, desc]);
    const deltaScore = live.score - row.score;
    const deltaLift  = live.projectedLiftPct - (row.projectedLiftPct || 0);

    return (
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    Rewrite &amp; re-score
                </h4>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Title ({title.length} chars)</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Meta description ({desc.length} chars)</label>
                <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/70">
                    <div className="text-xs text-gray-400">New score</div>
                    <div className="text-xl font-bold text-white">{live.score} <span className="text-xs text-gray-500">({live.grade})</span></div>
                    <div className={`text-xs ${deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {deltaScore >= 0 ? '+' : ''}{deltaScore} vs current
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/70">
                    <div className="text-xs text-gray-400">Projected CTR lift</div>
                    <div className="text-xl font-bold text-white">+{live.projectedLiftPct}%</div>
                    <div className={`text-xs ${deltaLift >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {deltaLift >= 0 ? '+' : ''}{deltaLift.toFixed(1)} pt vs current
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/70">
                    <div className="text-xs text-gray-400">Missed lift remaining</div>
                    <div className="text-xl font-bold text-white">{live.missingLiftPct}%</div>
                    <div className="text-xs text-gray-500">lower is better</div>
                </div>
            </div>
            <div className="text-xs text-gray-500">
                Copy the improved title/description into WordPress (Yoast / Rank Math or post meta). The preview above is live and does not save anywhere.
            </div>
        </div>
    );
};

export function CtrLabPanel() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rows, setRows] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [filter, setFilter] = useState('all'); // all | red | yellow | green
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const r = await wordpressApi.getAllPosts(1, 100);
                const posts = r.posts || [];
                const scored = scoreCtrBatch(posts);
                if (!cancelled) setRows(scored);
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Failed to load posts');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [tick]);

    const summary = useMemo(() => {
        if (!rows.length) return { avg: 0, atRisk: 0, avgMissedLift: 0 };
        const avg = Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
        const atRisk = rows.filter(r => r.grade === 'D' || r.grade === 'F').length;
        // Average missed lift per post — a realistic read of opportunity.
        // The old "sum across top-10" was misleading (looked like compound CTR).
        const avgMissedLift = Math.round(
            (rows.reduce((a, r) => a + (r.missingLiftPct || 0), 0) / rows.length) * 10
        ) / 10;
        return { avg, atRisk, avgMissedLift };
    }, [rows]);

    const visible = useMemo(() => {
        if (filter === 'all') return rows;
        return rows.filter(r => {
            if (filter === 'red')    return r.grade === 'D' || r.grade === 'F';
            if (filter === 'yellow') return r.grade === 'C';
            if (filter === 'green')  return r.grade === 'A' || r.grade === 'B';
            return true;
        });
    }, [rows, filter]);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">CTR Lab</h2>
                        <p className="text-sm text-gray-400">
                            Heuristic scorer for every article title + meta description. Finds the biggest
                            projected CTR lift per post based on Backlinko / Moz / AdvancedWebRanking benchmarks.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <div className="text-xs uppercase tracking-wider text-blue-300">Average score</div>
                    <div className="text-3xl font-bold text-white mt-1">{summary.avg || '—'}<span className="text-sm text-gray-400"> / 100</span></div>
                    <div className="text-xs text-gray-400 mt-1">across {rows.length} posts</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <div className="text-xs uppercase tracking-wider text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> At-risk posts
                    </div>
                    <div className="text-3xl font-bold text-white mt-1">{summary.atRisk}</div>
                    <div className="text-xs text-gray-400 mt-1">grade D or F</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Avg missed lift / post
                    </div>
                    <div className="text-3xl font-bold text-white mt-1">+{summary.avgMissedLift}%</div>
                    <div className="text-xs text-gray-400 mt-1">mean CTR ceiling left on the table</div>
                </div>
            </div>

            {/* Filters */}
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

            {/* Table */}
            {loading && <div className="text-sm text-gray-400">Loading posts…</div>}
            {error   && <div className="text-sm text-red-400">Error: {error}</div>}
            {!loading && !error && visible.length === 0 && (
                <div className="text-sm text-gray-500 italic">No posts match this filter.</div>
            )}

            {!loading && !error && visible.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-slate-700">
                                <th className="py-2 pr-3">#</th>
                                <th className="py-2 pr-3">Title</th>
                                <th className="py-2 pr-3">Score</th>
                                <th className="py-2 pr-3 text-right">Missed lift</th>
                                <th className="py-2 pr-3">Quick wins</th>
                                <th className="py-2 pr-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r, i) => {
                                const open = !!expanded[r.id];
                                return (
                                    <React.Fragment key={r.id || r.slug || i}>
                                        <tr className="border-b border-slate-800/60 align-top">
                                            <td className="py-3 pr-3 text-gray-500">{i + 1}</td>
                                            <td className="py-3 pr-3">
                                                <div className="text-white line-clamp-2 max-w-md">{r.title}</div>
                                                <div className="text-xs text-gray-500">{r.category || '—'}</div>
                                            </td>
                                            <td className="py-3 pr-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${GRADE_COLORS[r.grade]}`}>
                                                    {r.score} · {r.grade}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-3 text-right text-red-300 tabular-nums">
                                                {r.missingLiftPct ? `+${r.missingLiftPct}%` : '—'}
                                            </td>
                                            <td className="py-3 pr-3">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {r.quickWins[0] && (
                                                        <span
                                                            className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px]"
                                                            title={r.quickWins[0].label}
                                                        >
                                                            Fix: {r.quickWins[0].label.split('(')[0].trim().slice(0, 32)} ({r.quickWins[0].lift})
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const titleLen = (r.title || '').length;
                                                        const ok = titleLen >= 50 && titleLen <= 60;
                                                        const warn = !ok && titleLen >= 40 && titleLen <= 70;
                                                        const cls = ok
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : warn
                                                                ? 'bg-amber-500/20 text-amber-300'
                                                                : 'bg-slate-700/60 text-gray-300';
                                                        return (
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded text-[11px] ${cls}`}
                                                                title="Ideal title length is 50-60 chars"
                                                            >
                                                                {titleLen} chars
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-3 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))}
                                                    className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                                                >
                                                    {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                    {open ? 'Close' : 'Rewrite'}
                                                </button>
                                                <a
                                                    href={`/articles/${r.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-purple-400 hover:text-purple-300 text-xs inline-flex items-center gap-1"
                                                >
                                                    Open <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </td>
                                        </tr>
                                        {open && (
                                            <tr className="border-b border-slate-800/60">
                                                <td />
                                                <td colSpan={5} className="py-3 pr-3">
                                                    <RowEditor row={r} onClose={() => setExpanded(e => ({ ...e, [r.id]: false }))} />
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

            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">Benchmarks used:</strong>{' '}
                Title length 50-60 (ideal SERP width), numbers +15%, year +12%, brackets +16%,
                power words +10%, emotion +7%, How/Why/What +5%. Meta 120-160, CTA +8%, year +5%,
                benefit phrase +6%, action-verb start +4%. Lifts are industry medians, not guarantees —
                treat them as priority signals, not predictions.
            </div>
        </div>
    );
}

export default CtrLabPanel;
