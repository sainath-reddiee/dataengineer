// src/components/admin/CtrLabPanel.jsx
// Batch CTR scorer over all published articles. Lists biggest-opportunity
// pages first, with an inline editor that lets the owner rewrite a title or
// description and see the projected lift update in real time.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    TrendingUp, RefreshCw, Zap, AlertTriangle, ChevronDown, ChevronRight,
    Edit3, X, ExternalLink, Sparkles, Loader2, Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import { scoreCtr, scoreCtrBatch } from '@/utils/ctrScorer';
import aiService from '@/services/aiService';
import gscService from '@/services/gscService';

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
    const [aiLoading, setAiLoading] = useState(false);
    const [keywords, setKeywords] = useState([]);
    const [kwLoading, setKwLoading] = useState(false);
    const [kwError, setKwError] = useState('');
    const live = useMemo(() => scoreCtr({ title, description: desc }), [title, desc]);
    const deltaScore = live.score - row.score;
    const deltaLift  = live.projectedLiftPct - (row.projectedLiftPct || 0);

    // Identify keywords missing from title/description
    const missingKeywords = useMemo(() => {
        if (!keywords.length) return [];
        const combined = (title + ' ' + desc).toLowerCase();
        return keywords.filter(kw => !combined.includes(kw.query.toLowerCase()));
    }, [keywords, title, desc]);

    // Fetch GSC keywords for this article
    const fetchKeywords = useCallback(async () => {
        if (!gscService.isConnected()) {
            setKwError('GSC not connected. Connect in Rank Intelligence first.');
            return;
        }
        setKwLoading(true);
        setKwError('');
        try {
            const articleUrl = `https://dataengineerhub.blog/articles/${row.slug}`;
            const data = await gscService.queryTopKeywords({ url: articleUrl, rowLimit: 20 });
            setKeywords(data.sort((a, b) => b.impressions - a.impressions));
        } catch (e) {
            setKwError(e.message || 'Failed to fetch keywords');
        }
        setKwLoading(false);
    }, [row.slug]);

    // Auto-fetch keywords on mount if GSC is connected
    useEffect(() => {
        if (gscService.isConnected()) fetchKeywords();
    }, [fetchKeywords]);

    const handleAiSuggest = async () => {
        if (!aiService.isEnabled) {
            alert('AI API key not configured. Set it in the admin sidebar.');
            return;
        }
        setAiLoading(true);
        try {
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const contentSnippet = stripHtml(row.content || '').substring(0, 3000);

            // Build keyword context from GSC data
            const keywordContext = keywords.length > 0
                ? `\nREAL SEARCH KEYWORDS (from Google Search Console — these are the actual queries people use to find this article):
${keywords.slice(0, 10).map((kw, i) => `  ${i + 1}. "${kw.query}" — ${kw.impressions} impressions, ${kw.clicks} clicks, position ${Math.round(kw.position)}, CTR ${(kw.ctr * 100).toFixed(1)}%`).join('\n')}

MISSING FROM TITLE/DESCRIPTION (high-priority keywords to incorporate):
${missingKeywords.slice(0, 5).map(kw => `  - "${kw.query}" (${kw.impressions} impressions, not in title or description)`).join('\n') || '  (none — all top keywords are already present)'}
`
                : '\n(No GSC keyword data available — optimize based on content topic)\n';

            const prompt = `You are a CTR optimization expert for a data engineering blog. You have access to REAL Google Search Console data showing exactly what people search to find this article.

CURRENT ARTICLE:
Title: ${row.title}
Current description: ${row.excerpt}
Category: ${row.category || 'data engineering'}
Content (first ~3000 chars): ${contentSnippet || '(not available)'}
${keywordContext}
YOUR TASK: Generate an optimized SERP title and meta description that SPECIFICALLY targets the highest-impression keywords.

Rules for the title (50-60 chars ideal):
- MUST include the #1 impression keyword (or close variant) near the FRONT of the title
- Include a number or year if the keyword data shows year-related searches
- Use a power word that matches search intent (guide for tutorials, fix/avoid for troubleshooting)
- Do NOT use generic patterns like "Complete Guide" unless the keyword data supports it
- Prioritize exact-match keywords that are currently MISSING from the title

Rules for the description (120-155 chars ideal):
- Include 2-3 secondary keywords naturally (from the keyword list above)
- Start with a benefit or outcome the searcher wants
- Include specificity: numbers, tools, or techniques mentioned in the content
- Target the "People Also Ask" intent behind the top keywords

IMPORTANT: Your suggestion must be SPECIFIC to the keyword data above. Do NOT give generic SEO advice. Every word should be chosen to capture the real search queries shown.

Respond in EXACTLY this JSON format (no markdown fences):
{"title": "keyword-optimized title here", "description": "keyword-rich meta description here", "reasoning": "brief explanation of which keywords you targeted and why"}`;

            const response = await aiService.generateSuggestion(prompt, '');
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const parsed = JSON.parse(response.substring(firstBrace, lastBrace + 1));
                if (parsed.title) setTitle(parsed.title);
                if (parsed.description) setDesc(parsed.description);
            }
        } catch (e) {
            console.error('AI suggest failed:', e);
        }
        setAiLoading(false);
    };

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

            {/* GSC Keywords Panel */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-blue-400" />
                        Real Search Keywords (GSC)
                    </h5>
                    {!keywords.length && !kwLoading && (
                        <button
                            onClick={fetchKeywords}
                            className="text-[10px] text-blue-400 hover:text-blue-300"
                        >
                            Fetch keywords
                        </button>
                    )}
                </div>
                {kwLoading && <div className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading GSC data...</div>}
                {kwError && <div className="text-xs text-amber-400">{kwError}</div>}
                {keywords.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {keywords.slice(0, 10).map((kw, i) => {
                            const inTitle = title.toLowerCase().includes(kw.query.toLowerCase());
                            const inDesc = desc.toLowerCase().includes(kw.query.toLowerCase());
                            const present = inTitle || inDesc;
                            return (
                                <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${present ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        <span className={`truncate ${present ? 'text-gray-300' : 'text-white font-medium'}`}>
                                            {kw.query}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 text-gray-500">
                                        <span>{kw.impressions} imp</span>
                                        <span>pos {Math.round(kw.position)}</span>
                                        <span className={kw.ctr > 0.05 ? 'text-emerald-400' : kw.ctr > 0.02 ? 'text-amber-400' : 'text-red-400'}>
                                            {(kw.ctr * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {keywords.length > 0 && missingKeywords.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="text-[10px] text-red-300 font-medium mb-1">
                            ⚠ {missingKeywords.length} keyword{missingKeywords.length > 1 ? 's' : ''} missing from title/description:
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {missingKeywords.slice(0, 5).map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 text-[10px] cursor-pointer hover:bg-red-500/25"
                                    title={`${kw.impressions} impressions, position ${Math.round(kw.position)} — click to add to title`}
                                    onClick={() => setTitle(prev => prev + ' ' + kw.query)}
                                >
                                    +{kw.query} ({kw.impressions})
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {keywords.length > 0 && missingKeywords.length === 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-emerald-400">
                        ✓ All top keywords present in title/description
                    </div>
                )}
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
            <button
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiLoading ? 'Generating...' : keywords.length > 0 ? 'AI Suggest (Keyword-Aware)' : 'AI Suggest Title & Description'}
            </button>
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
    const [searchParams] = useSearchParams();
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
                if (!cancelled) {
                    setRows(scored);
                    // Auto-expand article if slug is in URL params (from Rank Dashboard)
                    const targetSlug = searchParams.get('slug');
                    if (targetSlug) {
                        const match = scored.find(s => s.slug === targetSlug);
                        if (match) {
                            setExpanded({ [match.id || match.slug]: true });
                            // Copy article URL to clipboard for convenience
                            navigator.clipboard?.writeText(`https://dataengineerhub.blog/articles/${targetSlug}`).catch(() => {});
                        }
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
                                const rowKey = r.id || r.slug || `row-${i}`;
                                const open = !!expanded[rowKey];
                                return (
                                    <React.Fragment key={rowKey}>
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
                                                    onClick={() => setExpanded(e => ({ ...e, [rowKey]: !e[rowKey] }))}
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
                                                    <RowEditor row={r} onClose={() => setExpanded(e => ({ ...e, [rowKey]: false }))} />
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
