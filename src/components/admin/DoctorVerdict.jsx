// src/components/admin/DoctorVerdict.jsx
// Hero verdict card: shows health grade, one-liner, top blockers, and page-jump path.
// The single most important diagnostic component on ArticleOptimizer.

import { Link } from 'react-router-dom';

const SEVERITY_STYLES = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
    high: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300',
    low: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
};

const GRADE_COLORS = {
    A: { bg: 'from-green-500 to-emerald-600', text: 'text-green-50' },
    B: { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-50' },
    C: { bg: 'from-yellow-500 to-amber-600', text: 'text-yellow-50' },
    D: { bg: 'from-orange-500 to-red-500', text: 'text-orange-50' },
    F: { bg: 'from-red-600 to-rose-700', text: 'text-red-50' },
};

const TREND_BADGES = {
    improving: { icon: '↑', label: 'Improving', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    declining: { icon: '↓', label: 'Declining', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    stable: { icon: '→', label: 'Stable', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    new: { icon: '•', label: 'New', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
};

export function DoctorVerdict({ verdict }) {
    if (!verdict) return null;
    const grade = GRADE_COLORS[verdict.healthGrade] || GRADE_COLORS.F;
    const trend = TREND_BADGES[verdict.trend?.trend] || TREND_BADGES.new;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header strip */}
            <div className={`bg-gradient-to-r ${grade.bg} p-6 ${grade.text}`}>
                <div className="flex items-start gap-6">
                    {/* Big grade circle */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/30">
                        <span className="text-5xl font-black">{verdict.healthGrade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 className="text-xl font-bold">Article Doctor Verdict</h2>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 backdrop-blur">
                                {verdict.bucketLabel}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${trend.cls}`}>
                                {trend.icon} {trend.label}
                                {verdict.trend?.change !== 0 && verdict.trend?.trend !== 'new' ? ` ${verdict.trend.change > 0 ? '+' : ''}${verdict.trend.change}` : ''}
                            </span>
                        </div>
                        <p className="text-base font-medium opacity-95 leading-relaxed">{verdict.oneLiner}</p>
                        <div className="mt-3 flex items-center gap-4 text-sm opacity-90">
                            <span>Health: <strong>{verdict.healthScore}/100</strong></span>
                            {verdict.bottleneck && <span>Bottleneck: <strong className="capitalize">{verdict.bottleneck}</strong></span>}
                            {verdict.totalLift > 0 && <span>Potential lift: <strong>+{verdict.totalLift} positions</strong></span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Jump Path */}
            {verdict.pageJumpPath?.length > 0 && (
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Page Jump Path — fix in this order
                    </h3>
                    <div className="space-y-2">
                        {verdict.pageJumpPath.map((blocker, i) => (
                            <Step key={i} number={i + 1} blocker={blocker} />
                        ))}
                    </div>
                </div>
            )}

            {/* Dimension Scores */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(verdict.dimensionScores)
                    .filter(([, v]) => v !== null && v !== undefined)
                    .map(([key, val]) => (
                        <DimChip key={key} label={key} value={val} />
                    ))}
            </div>

            {/* All Blockers */}
            {verdict.blockers?.length > verdict.pageJumpPath?.length && (
                <details className="px-6 pb-6">
                    <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                        View all {verdict.blockers.length} blockers ({verdict.blockers.length - verdict.pageJumpPath.length} more)
                    </summary>
                    <div className="mt-3 space-y-2">
                        {verdict.blockers.slice(verdict.pageJumpPath.length).map((b, i) => (
                            <BlockerRow key={i} blocker={b} />
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

function Step({ number, blocker }) {
    const sevCls = SEVERITY_STYLES[blocker.severity] || SEVERITY_STYLES.medium;
    const content = (
        <>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                {number}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{blocker.text}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${sevCls}`}>
                            {blocker.severity?.toUpperCase()}
                        </span>
                        {blocker.lift > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                +{blocker.lift}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{blocker.fix}</p>
                {blocker.tool && (
                    <span className="inline-block mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        → {blocker.tool}
                    </span>
                )}
            </div>
        </>
    );

    if (blocker.link) {
        return (
            <Link
                to={blocker.link}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 transition-colors"
            >
                {content}
            </Link>
        );
    }
    return <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">{content}</div>;
}

function BlockerRow({ blocker }) {
    const sevCls = SEVERITY_STYLES[blocker.severity] || SEVERITY_STYLES.medium;
    return (
        <div className={`p-2.5 rounded-lg border text-xs ${sevCls}`}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="font-semibold">{blocker.text}</span>
                <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/60 dark:bg-black/30 uppercase">
                        {blocker.severity}
                    </span>
                    {blocker.lift > 0 && <span className="text-[10px] font-bold">+{blocker.lift}</span>}
                </div>
            </div>
            <p className="mt-1 opacity-90">{blocker.fix}</p>
            {blocker.link && (
                <Link to={blocker.link} className="text-[11px] underline mt-1 inline-block">→ Fix in {blocker.tool}</Link>
            )}
        </div>
    );
}

function DimChip({ label, value }) {
    const color = value >= 70 ? 'green' : value >= 40 ? 'yellow' : 'red';
    const cls = {
        green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300',
        red: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
    }[color];
    const labelMap = {
        links: 'Link Health',
        content: 'Content',
        ctr: 'CTR',
        aiVisibility: 'AI Visibility',
        backlinks: 'Backlinks',
    };
    return (
        <div className={`p-3 rounded-lg border ${cls}`}>
            <div className="text-xs font-medium opacity-90">{labelMap[label] || label}</div>
            <div className="text-2xl font-bold mt-1">{value}<span className="text-sm font-normal opacity-70">/100</span></div>
        </div>
    );
}

export default DoctorVerdict;
