// src/components/admin/EngagementPanel.jsx
// Visualizes the engagement funnel captured by engagementTracker.js:
//   - Source breakdown (AI / organic / direct / other / internal)
//   - Top landed pages with avg scroll + click-inside rate
//   - Dead-end list (high landings, 0% click inside) and Magnet list (high click-inside)

import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Trash2, TrendingDown, Flame } from 'lucide-react';
import {
    getEngagementStats, getTopEntries, getSourceBreakdown, clearEngagementStats,
} from '@/utils/engagementTracker';

const SOURCE_LABEL = {
    ai:       'AI assistants',
    organic:  'Organic search',
    direct:   'Direct / bookmarks',
    internal: 'Internal nav',
    other:    'Other referral',
};

const SOURCE_COLOR = {
    ai:       'from-pink-500 to-purple-500',
    organic:  'from-emerald-500 to-teal-500',
    direct:   'from-blue-500 to-indigo-500',
    internal: 'from-slate-500 to-slate-400',
    other:    'from-amber-500 to-orange-500',
};

export function EngagementPanel() {
    const [tick, setTick] = useState(0);
    const [stats, setStats] = useState(() => getEngagementStats());
    const [sources, setSources] = useState(() => getSourceBreakdown());
    const [top, setTop] = useState(() => getTopEntries(10));

    useEffect(() => {
        setStats(getEngagementStats());
        setSources(getSourceBreakdown());
        setTop(getTopEntries(10));
    }, [tick]);

    const deadEnds = top
        .filter(t => t.landings >= 3 && t.clickRate === 0)
        .slice(0, 5);

    const magnets = [...top]
        .filter(t => t.landings >= 3)
        .sort((a, b) => b.clickRate - a.clickRate)
        .slice(0, 5);

    const handleReset = () => {
        if (!window.confirm('Clear local engagement stats?')) return;
        clearEngagementStats();
        setTick(t => t + 1);
    };

    const totals = stats.totals || {};
    const overallClick = totals.landings > 0
        ? Math.round((totals.secondClicks / totals.landings) * 100)
        : 0;

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Engagement &amp; Click-Inside</h2>
                        <p className="text-sm text-gray-400">
                            Per-landing scroll depth and second-click rate by source. Shows which entry pages are
                            dead-ends vs magnets — both direct CTR-improvement signals.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setTick(t => t + 1)}
                        className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-sm text-white flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={handleReset}
                        className="px-3 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-sm text-white flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            {/* Headline totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <div className="text-xs uppercase tracking-wider text-blue-300">Total landings</div>
                    <div className="text-3xl font-bold text-white mt-1">{totals.landings || 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="text-xs uppercase tracking-wider text-emerald-300">Click-inside rate</div>
                    <div className="text-3xl font-bold text-white mt-1">{overallClick}%</div>
                    <div className="text-xs text-gray-400 mt-1">{totals.secondClicks || 0} second-clicks</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                    <div className="text-xs uppercase tracking-wider text-pink-300">Newsletter conversions</div>
                    <div className="text-3xl font-bold text-white mt-1">{totals.newsletter || 0}</div>
                </div>
            </div>

            {/* Source breakdown */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">By source</h3>
                {sources.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No landings recorded on this device yet.</p>
                ) : (
                    <div className="space-y-2">
                        {sources.map(s => (
                            <div key={s.source} className="flex items-center gap-3">
                                <div className="w-32 text-sm text-gray-300 truncate">{SOURCE_LABEL[s.source] || s.source}</div>
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <div className="text-xs text-gray-400">Landings: <span className="text-white">{s.landings}</span></div>
                                    <div className="text-xs text-gray-400">Click-inside: <span className="text-white">{s.clickRate}%</span></div>
                                    <div className="text-xs text-gray-400">Avg scroll: <span className="text-white">{s.avgScroll}%</span></div>
                                </div>
                                <div className="w-20 h-2 bg-slate-900/50 rounded overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r ${SOURCE_COLOR[s.source] || SOURCE_COLOR.other}`}
                                        style={{ width: `${Math.min(100, s.clickRate)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top pages */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Top landed pages</h3>
                {top.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nothing yet — visit a few pages to build a baseline.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-slate-700">
                                    <th className="py-2 pr-3">Page</th>
                                    <th className="py-2 pr-3 text-right">Landings</th>
                                    <th className="py-2 pr-3 text-right">Click-inside</th>
                                    <th className="py-2 pr-3 text-right">Avg scroll</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top.map(t => (
                                    <tr key={t.path} className="border-b border-slate-800/60">
                                        <td className="py-2 pr-3">
                                            <a href={t.path} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 truncate inline-block max-w-md">
                                                {t.path}
                                            </a>
                                        </td>
                                        <td className="py-2 pr-3 text-right text-white tabular-nums">{t.landings}</td>
                                        <td className="py-2 pr-3 text-right text-white tabular-nums">{t.clickRate}%</td>
                                        <td className="py-2 pr-3 text-right text-white tabular-nums">{t.avgScroll}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Dead-ends + magnets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-red-500/20">
                    <h4 className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4" /> Dead-end pages
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">≥3 landings, 0% click inside. Best candidates for internal-link CTAs.</p>
                    {deadEnds.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">None — nice.</p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {deadEnds.map(d => (
                                <li key={d.path} className="truncate">
                                    <a href={d.path} className="text-red-400 hover:text-red-300">{d.path}</a>
                                    <span className="text-gray-500 text-xs ml-2">({d.landings} landings)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/20">
                    <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4" /> Magnet pages
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">Highest click-inside rate. Model future articles on these.</p>
                    {magnets.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">Need more data.</p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {magnets.map(m => (
                                <li key={m.path} className="truncate">
                                    <a href={m.path} className="text-emerald-400 hover:text-emerald-300">{m.path}</a>
                                    <span className="text-gray-500 text-xs ml-2">({m.clickRate}% · {m.landings} landings)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EngagementPanel;
