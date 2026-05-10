// src/components/admin/LinkHealthPanel.jsx
// Reusable panel showing link health metrics for an article.
// Used by ArticleOptimizer, ArticleFixer, CTRFixer.

import React from 'react';
import { Link2, Link as LinkIcon, AlertTriangle, ExternalLink, TrendingUp } from 'lucide-react';
import { analyzeArticleLinks, suggestAuthorityLinks } from '@/utils/linkAnalysis';

export function LinkHealthPanel({ article, linkGraph, compact = false }) {
    if (!article) return null;

    const metrics = analyzeArticleLinks(article, linkGraph);
    const authoritySuggestions = suggestAuthorityLinks(article.content || '');

    const tierColor = metrics.tier === 'good' ? 'emerald' : metrics.tier === 'fair' ? 'amber' : 'red';
    const scoreBg = metrics.tier === 'good' ? 'bg-emerald-500/20 text-emerald-300' : metrics.tier === 'fair' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300';

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded font-bold ${scoreBg}`}>
                <Link2 className="w-3 h-3" />
                Link: {metrics.score}
                {metrics.isOrphan && <span className="text-red-300 ml-1">·ORPHAN</span>}
            </span>
        );
    }

    return (
        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Link2 className={`w-4 h-4 text-${tierColor}-400`} />
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Link Health</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreBg}`}>
                    Score: {metrics.score}/100
                </span>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 bg-slate-900/60 rounded text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Inbound</div>
                    <div className={`text-lg font-bold ${metrics.isOrphan ? 'text-red-400' : metrics.inboundCount >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {metrics.inboundCount ?? '?'}
                    </div>
                    <div className="text-[9px] text-gray-600">articles linking in</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Internal Out</div>
                    <div className={`text-lg font-bold ${metrics.internalOutbound >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {metrics.internalOutbound}
                    </div>
                    <div className="text-[9px] text-gray-600">to other articles</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Authority</div>
                    <div className={`text-lg font-bold ${metrics.authorityLinks >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {metrics.authorityLinks}
                    </div>
                    <div className="text-[9px] text-gray-600">to docs/official</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded text-center">
                    <div className="text-[9px] text-gray-500 uppercase">External</div>
                    <div className="text-lg font-bold text-blue-400">{metrics.externalOutbound}</div>
                    <div className="text-[9px] text-gray-600">total outbound</div>
                </div>
            </div>

            {/* Orphan warning */}
            {metrics.isOrphan && (
                <div className="p-2 mb-2 bg-red-900/20 border border-red-700/40 rounded text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold">Orphan Page Detected</div>
                        <div className="text-[10px] text-red-300/80 mt-0.5">No other articles link to this page. Search engines treat orphans as low priority. Add 2-3 inbound links from related articles.</div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {metrics.recommendations.length > 0 && (
                <div className="space-y-1.5 mb-3">
                    {metrics.recommendations.map((rec, i) => (
                        <div key={i} className={`text-[11px] flex items-start gap-2 p-2 rounded ${
                            rec.severity === 'high' ? 'bg-red-900/15 text-red-300 border border-red-800/30' :
                            rec.severity === 'medium' ? 'bg-amber-900/15 text-amber-300 border border-amber-800/30' :
                            'bg-slate-800/40 text-gray-400 border border-slate-700'
                        }`}>
                            <span className="shrink-0 mt-0.5">·</span>
                            <span>{rec.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Authority link suggestions based on content topics */}
            {authoritySuggestions.length > 0 && metrics.authorityLinks < 3 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Suggested Authority Links Based on Content
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {authoritySuggestions.slice(0, 6).map((s, i) => (
                            <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1"
                            >
                                {s.topic}
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        ))}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1.5">Click to verify, then add as `[According to X docs](url)` for E-E-A-T + GEO citations.</div>
                </div>
            )}

            {/* Already-linked authority domains */}
            {metrics.authorityDomains.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="text-[10px] text-gray-500">Already linked to:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {metrics.authorityDomains.map((d, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[9px] bg-emerald-900/30 text-emerald-300 rounded">{d}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LinkHealthPanel;
