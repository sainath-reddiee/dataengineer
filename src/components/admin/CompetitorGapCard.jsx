// src/components/admin/CompetitorGapCard.jsx
// Side-by-side comparison vs the #1 ranking competitor.
// Shows specific gaps: word count, headings, schema, links — and tells you EXACTLY what to add.

import tinyfishService from '../../services/tinyfishService';

export function CompetitorGapCard({ gap, keyword, onAnalyze, loading }) {
    if (!gap && !loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Competitor Gap Analysis
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Compare your article against the #1 ranking result for "{keyword || 'your top keyword'}".
                </p>
                <button
                    onClick={onAnalyze}
                    disabled={!keyword || !tinyfishService.isEnabled}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    {!tinyfishService.isEnabled ? 'TinyFish API key required' : !keyword ? 'No GSC keyword available' : 'Analyze #1 Competitor'}
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                <div className="inline-block w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Analyzing #1 competitor for "{keyword}"...</p>
            </div>
        );
    }

    if (gap?.error) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-300 dark:border-amber-700 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">{gap.error}</p>
            </div>
        );
    }

    const gaps = computeGaps(gap);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Competitor Gap
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        For keyword: <strong>"{keyword}"</strong>
                    </p>
                </div>
                {gap?.competitorUrl && (
                    <a href={gap.competitorUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 dark:text-rose-400 hover:underline truncate max-w-xs">
                        #1: {gap.competitorDomain || gap.competitorUrl}
                    </a>
                )}
            </div>

            <div className="p-5">
                {/* Side-by-side metric comparison */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                <th className="py-2 pr-3">Metric</th>
                                <th className="py-2 pr-3">You</th>
                                <th className="py-2 pr-3">#1</th>
                                <th className="py-2">Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Row label="Word count" you={gap.yourWordCount} them={gap.competitorWordCount} unit="words" />
                            <Row label="Headings (H2+H3)" you={gap.yourHeadings} them={gap.competitorHeadings} unit="" />
                            <Row label="Images" you={gap.yourImages} them={gap.competitorImages} unit="" />
                            <Row label="FAQs" you={gap.yourFaqs} them={gap.competitorFaqs} unit="" />
                            <Row label="External links" you={gap.yourLinks} them={gap.competitorLinks} unit="" />
                            {gap.yourSchema !== undefined && (
                                <RowText label="Schema types" you={(gap.yourSchema || []).join(', ') || 'none'} them={(gap.competitorSchema || []).join(', ') || 'none'} />
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Specific actions to close the gap */}
                {gaps.length > 0 && (
                    <div className="mt-5">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Close the gap</h4>
                        <ul className="space-y-1.5">
                            {gaps.map((g, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="text-rose-500 flex-shrink-0">→</span>
                                    <span>{g}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, you, them, unit }) {
    const youNum = Number(you) || 0;
    const themNum = Number(them) || 0;
    const diff = themNum - youNum;
    const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
    const diffCls = diff > 0 ? 'text-rose-600 dark:text-rose-400' : diff < 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-500';
    return (
        <tr className="border-b border-slate-100 dark:border-slate-700/50">
            <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">{label}</td>
            <td className="py-2 pr-3 text-slate-900 dark:text-slate-100">{youNum}{unit ? ` ${unit}` : ''}</td>
            <td className="py-2 pr-3 text-slate-900 dark:text-slate-100">{themNum}{unit ? ` ${unit}` : ''}</td>
            <td className={`py-2 font-semibold ${diffCls}`}>{diffStr}</td>
        </tr>
    );
}

function RowText({ label, you, them }) {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-700/50">
            <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">{label}</td>
            <td className="py-2 pr-3 text-slate-900 dark:text-slate-100 text-xs">{you}</td>
            <td className="py-2 pr-3 text-slate-900 dark:text-slate-100 text-xs">{them}</td>
            <td className="py-2"></td>
        </tr>
    );
}

function computeGaps(gap) {
    const out = [];
    if (!gap) return out;
    const wordGap = (gap.competitorWordCount || 0) - (gap.yourWordCount || 0);
    if (wordGap > 200) out.push(`Add ~${wordGap} more words to match #1's depth (currently ${gap.yourWordCount} vs their ${gap.competitorWordCount})`);
    const headingGap = (gap.competitorHeadings || 0) - (gap.yourHeadings || 0);
    if (headingGap > 1) out.push(`Add ${headingGap} more H2/H3 sections to cover the topic comprehensively`);
    const faqGap = (gap.competitorFaqs || 0) - (gap.yourFaqs || 0);
    if (faqGap > 0) out.push(`Add ${faqGap} more FAQ questions — competitor has ${gap.competitorFaqs}, you have ${gap.yourFaqs}`);
    const imageGap = (gap.competitorImages || 0) - (gap.yourImages || 0);
    if (imageGap > 1) out.push(`Add ${imageGap} more images/diagrams to improve engagement`);
    const compSchemas = new Set(gap.competitorSchema || []);
    const yourSchemas = new Set(gap.yourSchema || []);
    const missingSchemas = [...compSchemas].filter(s => !yourSchemas.has(s));
    if (missingSchemas.length > 0) out.push(`Add ${missingSchemas.join(', ')} schema — competitor has it, you don't`);
    return out;
}

export default CompetitorGapCard;
