// src/components/admin/SerpCoveragePanel.jsx
// Rich-result coverage matrix. Rows = articles, cols = SERP features.
// Run an on-demand scan (same-origin fetch of each article URL) and show a
// gap matrix + prioritized list of the biggest lift-unlocks per page.

import React, { useState } from 'react';
import { Award, Play, Check, X as XIcon, AlertTriangle, ExternalLink } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { auditBatch, SERP_FEATURE_LIFTS } from '@/utils/serpFeatureAudit';

const FEATURES = [
    { key: 'article',    label: 'Article' },
    { key: 'faq',        label: 'FAQ' },
    { key: 'howto',      label: 'HowTo' },
    { key: 'video',      label: 'Video' },
    { key: 'review',     label: 'Review' },
    { key: 'breadcrumb', label: 'Breadcrumb' },
    { key: 'image',      label: 'OG image' },
];

const Cell = ({ ok }) => (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
        {ok ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
    </span>
);

export function SerpCoveragePanel() {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const runScan = async () => {
        setRunning(true);
        setError('');
        setResults([]);
        try {
            const r = await wordpressApi.getAllPosts(1, 100);
            const posts = r.posts || [];
            const urls = posts.map(p => `/articles/${p.slug}`);
            setProgress({ done: 0, total: urls.length });
            const audits = await auditBatch(urls, {
                concurrency: 4,
                onProgress: (done, total) => setProgress({ done, total }),
            });
            // Merge back titles
            const byUrl = new Map(audits.map(a => [a.url, a]));
            const merged = posts.map(p => {
                const url = `/articles/${p.slug}`;
                const a = byUrl.get(url) || { features: {}, missingLift: 0, ok: false };
                return { ...p, url, ...a };
            });
            merged.sort((a, b) => (b.missingLift || 0) - (a.missingLift || 0));
            setResults(merged);
        } catch (e) {
            setError(e?.message || 'Scan failed');
        } finally {
            setRunning(false);
        }
    };

    const coverage = (() => {
        if (!results.length) return null;
        const out = {};
        FEATURES.forEach(f => {
            const present = results.filter(r => r.features?.[f.key]).length;
            out[f.key] = { present, total: results.length, pct: Math.round((present / results.length) * 100) };
        });
        return out;
    })();

    const topOpportunities = results.slice(0, 8);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20">
                        <Award className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">SERP Feature Coverage</h2>
                        <p className="text-sm text-gray-400">
                            Scan every article for rich-result eligibility (FAQ, HowTo, Video, Review, Breadcrumb, OG image).
                            Each missing feature = a missed SERP real-estate slot and lost CTR.
                        </p>
                    </div>
                </div>
                <button
                    onClick={runScan}
                    disabled={running}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm text-white flex items-center gap-2"
                >
                    <Play className="w-4 h-4" />
                    {running ? `Scanning ${progress.done}/${progress.total}…` : 'Run coverage scan'}
                </button>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {coverage && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {FEATURES.map(f => (
                        <div key={f.key} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700">
                            <div className="text-xs text-gray-400">{f.label}</div>
                            <div className="text-2xl font-bold text-white mt-1">{coverage[f.key].pct}%</div>
                            <div className="text-xs text-gray-500 mt-1">{coverage[f.key].present}/{coverage[f.key].total} pages</div>
                            <div className="text-[10px] text-purple-300 mt-1">+{SERP_FEATURE_LIFTS[f.key] || 0}% lift if unlocked</div>
                        </div>
                    ))}
                </div>
            )}

            {results.length > 0 && (
                <>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Biggest opportunities</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-slate-700">
                                        <th className="py-2 pr-3">Article</th>
                                        {FEATURES.map(f => <th key={f.key} className="py-2 pr-3 text-center">{f.label}</th>)}
                                        <th className="py-2 pr-3 text-right">Missing lift</th>
                                        <th className="py-2 pr-3 text-right">Link</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topOpportunities.map(r => (
                                        <tr key={r.id || r.slug} className="border-b border-slate-800/60">
                                            <td className="py-2 pr-3">
                                                <div className="text-white truncate max-w-xs">{r.title}</div>
                                                <div className="text-xs text-gray-500">{r.category || '—'}</div>
                                            </td>
                                            {FEATURES.map(f => (
                                                <td key={f.key} className="py-2 pr-3 text-center">
                                                    <Cell ok={!!r.features?.[f.key]} />
                                                </td>
                                            ))}
                                            <td className="py-2 pr-3 text-right text-red-300 tabular-nums">+{r.missingLift || 0}%</td>
                                            <td className="py-2 pr-3 text-right">
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-xs">
                                                    Open <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                        <strong className="text-gray-400">Lift references:</strong>{' '}
                        FAQ +20% (Search Engine Land), HowTo +18%, Video thumbnail +15% (AWR), Review stars +30%,
                        Breadcrumb +5%, OG image on social preview +15%. Scan runs same-origin fetches — no external calls.
                    </div>
                </>
            )}

            {!running && results.length === 0 && !error && (
                <p className="text-sm text-gray-500 italic">Click "Run coverage scan" to audit every article's rich-result eligibility.</p>
            )}
        </div>
    );
}

export default SerpCoveragePanel;
