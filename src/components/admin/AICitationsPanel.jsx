// src/components/admin/AICitationsPanel.jsx
// Admin panel: how many times LLM assistants (ChatGPT, Perplexity, Claude, Gemini...)
// referred visitors to this blog. Reads the rolling localStorage record written
// by src/utils/aiReferralTracker.js on each landing, and renders:
//   - Headline total + last-30-day total
//   - Bar chart of referrals by AI source
//   - Top 10 landed pages table
//   - 30-day sparkline
//   - Reset button + GA4 deep link
//
// No backend required. Per-device counter. GA4 provides the cross-device view
// via the `ai_referral` custom event.

import React, { useEffect, useState, useMemo } from 'react';
import { Bot, RefreshCw, Trash2, ExternalLink, TrendingUp } from 'lucide-react';
import {
    getLocalReferralStats,
    clearLocalReferralStats,
    getLastNDays,
    AI_SOURCES,
} from '@/utils/aiReferralTracker';

const SOURCE_LABELS = {
    chatgpt: 'ChatGPT',
    perplexity: 'Perplexity',
    claude: 'Claude',
    gemini: 'Gemini',
    copilot: 'Copilot',
    you: 'You.com',
    phind: 'Phind',
    ddgchat: 'DuckDuckGo AI',
    poe: 'Poe',
    kagi: 'Kagi Assistant',
    meta: 'Meta AI',
};

const SOURCE_COLORS = {
    chatgpt: 'from-emerald-500 to-teal-500',
    perplexity: 'from-sky-500 to-indigo-500',
    claude: 'from-orange-500 to-amber-500',
    gemini: 'from-blue-500 to-purple-500',
    copilot: 'from-cyan-500 to-blue-500',
    you: 'from-pink-500 to-rose-500',
    phind: 'from-violet-500 to-fuchsia-500',
    ddgchat: 'from-yellow-500 to-orange-500',
    poe: 'from-purple-500 to-pink-500',
    kagi: 'from-lime-500 to-green-500',
    meta: 'from-blue-600 to-indigo-600',
};

export function AICitationsPanel() {
    const [stats, setStats] = useState(() => getLocalReferralStats());
    const [tick, setTick] = useState(0);

    // Reload when the component remounts or the admin hits refresh.
    useEffect(() => {
        setStats(getLocalReferralStats());
    }, [tick]);

    const last30 = useMemo(() => getLastNDays(30), [tick]);
    const last30Total = useMemo(
        () => last30.reduce((acc, d) => acc + d.count, 0),
        [last30]
    );
    const sparkMax = useMemo(
        () => Math.max(1, ...last30.map(d => d.count)),
        [last30]
    );

    const knownSources = Object.keys(AI_SOURCES);
    const bySource = knownSources
        .map(k => ({ key: k, label: SOURCE_LABELS[k] || k, count: stats.bySource[k] || 0 }))
        .sort((a, b) => b.count - a.count);
    const barMax = Math.max(1, ...bySource.map(s => s.count));

    const topPages = Object.entries(stats.byPage || {})
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const handleReset = () => {
        if (!window.confirm('Clear local AI referral counters? GA4 history is unaffected.')) return;
        clearLocalReferralStats();
        try { window.sessionStorage.removeItem('ai_ref_checked'); } catch { /* ignore */ }
        setTick(t => t + 1);
    };

    const gaLink =
        'https://analytics.google.com/analytics/web/#/p/reports/reportshome';

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-pink-500/20">
                        <Bot className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Citations &amp; Referrals</h2>
                        <p className="text-sm text-gray-400">
                            How often LLM assistants sent readers here. Local device counter + GA4 event <code className="text-pink-300">ai_referral</code>.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTick(t => t + 1)}
                        className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-sm text-white flex items-center gap-2"
                        title="Reload from localStorage"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <a
                        href={gaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-sm text-white flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        GA4
                    </a>
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-sm text-white flex items-center gap-2"
                        title="Clear local counters"
                    >
                        <Trash2 className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Headline numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                    <div className="text-xs uppercase tracking-wider text-pink-300">All-time AI referrals</div>
                    <div className="text-3xl font-bold text-white mt-1">{stats.total || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {stats.firstSeen ? `Since ${stats.firstSeen.slice(0, 10)}` : 'No referrals yet'}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="text-xs uppercase tracking-wider text-emerald-300">Last 30 days</div>
                    <div className="text-3xl font-bold text-white mt-1">{last30Total}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {last30Total > 0 ? `${(last30Total / 30).toFixed(1)} / day avg` : 'Still building baseline'}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <div className="text-xs uppercase tracking-wider text-blue-300">Top source</div>
                    <div className="text-3xl font-bold text-white mt-1">
                        {bySource[0] && bySource[0].count > 0 ? bySource[0].label : '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {bySource[0] && bySource[0].count > 0 ? `${bySource[0].count} referrals` : 'Awaiting first hit'}
                    </div>
                </div>
            </div>

            {/* 30-day sparkline */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        30-day trend
                    </h3>
                    <span className="text-xs text-gray-500">Peak: {sparkMax}</span>
                </div>
                <div className="flex items-end gap-[2px] h-16 bg-slate-900/40 rounded-lg p-2">
                    {last30.map((d, i) => {
                        const h = Math.max(2, Math.round((d.count / sparkMax) * 56));
                        return (
                            <div
                                key={d.day}
                                className="flex-1 rounded-sm bg-gradient-to-t from-pink-500 to-purple-500 opacity-80 hover:opacity-100"
                                style={{ height: `${h}px` }}
                                title={`${d.day}: ${d.count}`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Bar chart by source */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Referrals by AI source</h3>
                {stats.total > 0 ? (
                    <div className="space-y-2">
                        {bySource.filter(s => s.count > 0).map(s => (
                            <div key={s.key} className="flex items-center gap-3">
                                <div className="w-28 text-sm text-gray-300 truncate">{s.label}</div>
                                <div className="flex-1 h-6 bg-slate-900/50 rounded overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${SOURCE_COLORS[s.key] || 'from-slate-500 to-slate-400'}`}
                                        style={{ width: `${(s.count / barMax) * 100}%` }}
                                    />
                                </div>
                                <div className="w-12 text-right text-sm text-white tabular-nums">{s.count}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">
                        No AI referrals recorded on this device yet. GA4 will still capture them across all visitors under the <code className="text-pink-300">ai_referral</code> event.
                    </p>
                )}
            </div>

            {/* Top pages */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Top landed pages</h3>
                {topPages.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-slate-700">
                                    <th className="py-2 pr-4">#</th>
                                    <th className="py-2 pr-4">Page</th>
                                    <th className="py-2 pr-4 text-right">Referrals</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPages.map((p, i) => (
                                    <tr key={p.page} className="border-b border-slate-800/60">
                                        <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                                        <td className="py-2 pr-4">
                                            <a
                                                href={p.page}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 truncate inline-block max-w-md"
                                            >
                                                {p.page}
                                            </a>
                                        </td>
                                        <td className="py-2 pr-4 text-right text-white tabular-nums">{p.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No pages have received AI referrals yet.</p>
                )}
            </div>

            {/* Footnote */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How detection works:</strong>{' '}
                We check <code>document.referrer</code> against known assistant domains (chatgpt.com, perplexity.ai,
                claude.ai, gemini.google.com, copilot.microsoft.com, etc.) and any <code>utm_source</code> tag
                set by the assistant. Counts here are per-device; for cross-device totals, open GA4 and filter
                on event name <code className="text-pink-300">ai_referral</code>. Some browsers strip
                referrers — those visits won't be attributable.
            </div>
        </div>
    );
}

export default AICitationsPanel;
