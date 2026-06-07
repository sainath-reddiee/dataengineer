// src/components/admin/CtrLabDetail.jsx
// Rich CTR diagnostic for a single article: SERP preview, factor breakdown,
// keyword map, quick-action buttons, AI variant generator, before/after diff.
// Designed to answer: "Why is this article's CTR bad, and exactly what do I fix?"

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Sparkles, Loader2, Copy, Check, X, Search, Zap,
    ChevronRight, ExternalLink, AlertTriangle,
} from 'lucide-react';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import gscService from '@/services/gscService';
import { scoreCtr } from '@/utils/ctrScorer';

// ─── SERP Preview ───────────────────────────────────────────────

function SerpPreview({ title, description, url }) {
    const maxTitle = 60;
    const maxDesc = 160;
    const displayTitle = title.length > maxTitle ? title.slice(0, maxTitle) + '...' : title;
    const displayDesc = (description || '').length > maxDesc
        ? description.slice(0, maxDesc) + '...'
        : description || 'No meta description set — Google will auto-generate a snippet from your content.';
    const displayUrl = url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'dataengineerhub.blog/articles/...';

    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">D</div>
                <span className="text-[11px] text-slate-600">{displayUrl}</span>
            </div>
            <h3 className="text-[#1a0dab] text-lg font-medium leading-tight hover:underline cursor-default">
                {displayTitle}
            </h3>
            <p className="text-sm text-[#4d5156] leading-relaxed mt-1">{displayDesc}</p>
            {title.length > maxTitle && (
                <span className="inline-block mt-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Title truncated at {maxTitle} chars — currently {title.length}
                </span>
            )}
            {(description || '').length > maxDesc && (
                <span className="inline-block mt-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Description truncated at {maxDesc} — currently {(description || '').length}
                </span>
            )}
        </div>
    );
}

// ─── Position-aware Tips ────────────────────────────────────────

function getPositionTip(position) {
    if (!position) return { text: 'Connect GSC for position-specific recommendations.', cls: 'bg-slate-500/10 border-slate-500/30 text-gray-300' };
    if (position <= 3) return { text: "Top 3 — focus on Featured Snippet formatting and CTR hooks to maximize clicks.", cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' };
    if (position <= 10) return { text: "Page 1 — your title competes with 9 others. Numbers, brackets, or emotional hooks help you stand out.", cls: 'bg-blue-500/10 border-blue-500/30 text-blue-300' };
    if (position <= 20) return { text: "Page 2 — searchers rarely scroll here. Your title needs to be SIGNIFICANTLY more compelling than page 1.", cls: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
    return { text: "Page 3+ — focus on keyword alignment first (match search intent), then optimize hooks.", cls: 'bg-red-500/10 border-red-500/30 text-red-300' };
}

// ─── Quick Actions ──────────────────────────────────────────────

function QuickActions({ title, setTitle, description, setDesc, topKeyword, currentScore }) {
    const year = new Date().getFullYear();
    const hasYear = new RegExp(`\\b(${year - 1}|${year}|${year + 1})\\b`).test(title);
    const hasNumber = /\d/.test(title);
    const hasKeywordFront = topKeyword && title.toLowerCase().startsWith(topKeyword.toLowerCase().slice(0, 8));

    const actions = [
        {
            label: `+${year}`,
            lift: '+10 pts',
            disabled: hasYear,
            action: () => setTitle(prev => prev.replace(/\s*\(\d{4}\)\s*$/, '') + ` (${year})`),
            tooltip: hasYear ? 'Already has a year' : `Append (${year}) for freshness signal`,
        },
        {
            label: 'Front-load KW',
            lift: '+10 pts',
            disabled: !topKeyword || hasKeywordFront,
            action: () => {
                if (!topKeyword) return;
                const cleaned = title.replace(new RegExp(topKeyword, 'i'), '').replace(new RegExp('^\\s*[-:' + '|–]\\s*'), '').trim();
                setTitle(`${topKeyword}: ${cleaned}`);
            },
            tooltip: !topKeyword ? 'No GSC keyword' : hasKeywordFront ? 'Already front-loaded' : `Move "${topKeyword}" to front`,
        },
        {
            label: 'Shorten to 60',
            lift: '+18 pts',
            disabled: title.length <= 60,
            action: () => setTitle(prev => prev.slice(0, 57) + '...'),
            tooltip: title.length <= 60 ? 'Already within 60' : `Trim from ${title.length} to 60 chars`,
        },
        {
            label: '+Power Word',
            lift: '+10 pts',
            disabled: /\b(guide|ultimate|best|complete|master|essential|proven|definitive)\b/i.test(title),
            action: () => {
                const words = ['Complete', 'Essential', 'Ultimate', 'Definitive'];
                const pick = words[Math.floor(Math.random() * words.length)];
                setTitle(prev => `${pick} ${prev}`);
            },
            tooltip: 'Prepend a power word',
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
                <button
                    key={i}
                    onClick={a.action}
                    disabled={a.disabled}
                    title={a.tooltip}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-700/50 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 hover:text-white rounded-lg border border-slate-600/50 hover:border-blue-500/40 transition-colors flex items-center gap-1.5"
                >
                    <Zap className="w-3 h-3 text-amber-400" />
                    {a.label}
                    <span className="text-[9px] text-emerald-400 font-bold">{a.lift}</span>
                </button>
            ))}
        </div>
    );
}

// ─── Factor Checklist ───────────────────────────────────────────

function FactorChecklist({ scoreResult }) {
    const allFactors = scoreResult.factors || [];
    // Sort: failures first for actionability
    const sorted = [...allFactors].sort((a, b) => (a.ok === b.ok ? 0 : a.ok ? 1 : -1));

    return (
        <div className="space-y-1">
            {sorted.map(({ key, ok, points, lift, label }) => {
                if (!label) return null;
                return (
                    <div key={key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                        <span className="flex-shrink-0">{ok ? '✓' : '✗'}</span>
                        <span className="flex-1 min-w-0">{label}</span>
                        <span className="flex-shrink-0 font-mono text-[10px] opacity-75">
                            {ok ? `+${points} pts` : lift}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Keyword Map ────────────────────────────────────────────────

function KeywordMap({ keywords, title, description, onInsert }) {
    if (!keywords || keywords.length === 0) return null;
    const combined = (title + ' ' + description).toLowerCase();

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Search className="w-3 h-3 text-blue-400" />
                GSC Keyword Coverage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {keywords.slice(0, 10).map((kw, i) => {
                    const present = combined.includes(kw.query.toLowerCase());
                    return (
                        <div
                            key={i}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                                present
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20'
                            }`}
                            onClick={() => !present && onInsert(kw.query)}
                            title={present ? 'Already in title/description' : `Click to insert "${kw.query}" into title`}
                        >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${present ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="flex-1 truncate font-medium">{kw.query}</span>
                            <span className="text-[9px] opacity-70 flex-shrink-0">
                                {kw.impressions} imp · #{Math.round(kw.position)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Detail Component ──────────────────────────────────────

export function CtrLabDetail({ row, onClose }) {
    const [title, setTitle] = useState(row.title || '');
    const [desc, setDesc] = useState(row.excerpt || '');
    const [keywords, setKeywords] = useState([]);
    const [kwLoading, setKwLoading] = useState(false);
    const [competitors, setCompetitors] = useState(null);
    const [compLoading, setCompLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [variants, setVariants] = useState(null);
    const [aiError, setAiError] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);

    // Live score as user types
    const liveScore = useMemo(
        () => scoreCtr({ title, description: desc, gscKeywords: keywords.length > 0 ? keywords : null }),
        [title, desc, keywords]
    );
    const originalScore = useMemo(
        () => scoreCtr({ title: row.title, description: row.excerpt }),
        [row.title, row.excerpt]
    );
    const deltaScore = liveScore.score - originalScore.score;
    const articleUrl = `https://dataengineerhub.blog/articles/${row.slug}`;

    // Position tip
    const positionTip = getPositionTip(row.position);

    // Auto-fetch GSC keywords on mount
    useEffect(() => {
        if (!gscService.isConnected()) return;
        setKwLoading(true);
        gscService.queryTopKeywords({ url: articleUrl, rowLimit: 20 })
            .then(data => setKeywords(data.sort((a, b) => b.impressions - a.impressions)))
            .catch(() => {})
            .finally(() => setKwLoading(false));
    }, [row.slug]);

    const topKeyword = keywords[0]?.query;

    // Fetch competitor titles
    const fetchCompetitors = useCallback(async () => {
        if (!tinyfishService.isEnabled || !topKeyword) return;
        setCompLoading(true);
        try {
            const results = await tinyfishService.search(topKeyword);
            const comps = (results.results || [])
                .filter(r => !r.url?.includes('dataengineerhub.blog'))
                .slice(0, 5);
            setCompetitors(comps);
        } catch { /* optional */ }
        setCompLoading(false);
    }, [topKeyword]);

    // Auto-fetch competitors once keyword available
    useEffect(() => {
        if (topKeyword && tinyfishService.isEnabled && !competitors) fetchCompetitors();
    }, [topKeyword, fetchCompetitors]);

    // AI variant generation
    const handleGenerateVariants = async () => {
        if (!aiService.isEnabled) { setAiError('No AI key configured.'); return; }
        setAiLoading(true);
        setAiError('');
        try {
            const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const contentSnippet = stripHtml(row.content || '').substring(0, 2000);
            const kwContext = keywords.length > 0
                ? `\nTOP GSC KEYWORDS:\n${keywords.slice(0, 8).map((k, i) => `${i + 1}. "${k.query}" (${k.impressions} imp, pos #${Math.round(k.position)})`).join('\n')}`
                : '';
            const compContext = competitors?.length
                ? `\nCOMPETITOR TITLES:\n${competitors.map((c, i) => `${i + 1}. "${c.title}"`).join('\n')}`
                : '';

            const prompt = `CTR optimization for a data engineering blog article.

CURRENT:
Title: "${row.title}" (${row.title.length} chars)
Description: "${row.excerpt || ''}" (${(row.excerpt || '').length} chars)
Position: #${row.position ? Math.round(row.position) : '?'}
CTR: ${row.ctr ? (row.ctr * 100).toFixed(2) + '%' : 'unknown'}
Content (excerpt): ${contentSnippet.substring(0, 500)}
${kwContext}${compContext}

Generate 3 variants with different psychological triggers:
Variant 1 (CURIOSITY): Information gap that makes them NEED to click
Variant 2 (SPECIFICITY): Numbers, data, year — concrete value promise
Variant 3 (AUTHORITY): Expert proof, definitive language

Rules:
- Titles: 50-60 chars, primary keyword near front
- Descriptions: 120-155 chars, action verb start, include benefit
- Match article content — don't promise what isn't delivered
- Use real keyword data above to guide word choice

Respond in EXACTLY this JSON (no markdown):
{"variants": [{"title": "...", "description": "...", "trigger": "curiosity"}, {"title": "...", "description": "...", "trigger": "specificity"}, {"title": "...", "description": "...", "trigger": "authority"}]}`;

            const response = await aiService.generateSuggestion(prompt, contentSnippet);
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const parsed = JSON.parse(response.substring(firstBrace, lastBrace + 1));
                const scored = (parsed.variants || []).map(v => ({
                    ...v,
                    score: scoreCtr({ title: v.title, description: v.description, gscKeywords: keywords.length > 0 ? keywords : null }).score,
                }));
                setVariants(scored.sort((a, b) => b.score - a.score));
            } else {
                setAiError('AI returned no valid JSON. Try again.');
            }
        } catch (e) {
            setAiError(e.message || 'AI generation failed.');
        }
        setAiLoading(false);
    };

    const handleCopy = (text, idx) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {});
        }
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleUseVariant = (v) => {
        setTitle(v.title);
        setDesc(v.description);
    };

    const handleInsertKeyword = (kw) => {
        setTitle(prev => prev + ' ' + kw);
    };

    return (
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    CTR Deep Diagnostic
                </h4>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Position tip */}
            <div className={`px-3 py-2 rounded-lg border text-xs ${positionTip.cls}`}>
                <strong>Position #{row.position ? Math.round(row.position) : '?'}:</strong> {positionTip.text}
            </div>

            {/* Score + Position cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                    <div className="text-[10px] text-gray-500 uppercase">CTR Score</div>
                    <div className={`text-2xl font-bold ${liveScore.score >= 70 ? 'text-emerald-400' : liveScore.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {liveScore.score}
                    </div>
                    <div className="text-[10px] text-gray-500">/ 100 ({liveScore.grade})</div>
                </div>
                {row.position && (
                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Position</div>
                        <div className="text-2xl font-bold text-blue-400">#{Math.round(row.position)}</div>
                        <div className="text-[10px] text-gray-500">{row.impressions?.toLocaleString()} imp</div>
                    </div>
                )}
                {row.ctr !== undefined && (
                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Your CTR</div>
                        <div className={`text-2xl font-bold ${row.ctr < 0.02 ? 'text-red-400' : row.ctr < 0.05 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {(row.ctr * 100).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-gray-500">{row.clicks || 0} clicks</div>
                    </div>
                )}
                {row.clickGap > 0 && (
                    <div className="p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Missed</div>
                        <div className="text-2xl font-bold text-emerald-400">+{row.clickGap}</div>
                        <div className="text-[10px] text-gray-500">clicks/month</div>
                    </div>
                )}
            </div>

            {/* SERP Preview */}
            <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Live SERP Preview</h4>
                <SerpPreview title={title} description={desc} url={articleUrl} />
            </div>

            {/* Quick Actions */}
            <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Quick Actions</h4>
                <QuickActions title={title} setTitle={setTitle} description={desc} setDesc={setDesc} topKeyword={topKeyword} currentScore={liveScore.score} />
            </div>

            {/* Editor */}
            <div className="space-y-3">
                <div>
                    <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Title ({title.length} chars)</span>
                        <span className={title.length >= 50 && title.length <= 60 ? 'text-emerald-400' : title.length >= 40 && title.length <= 70 ? 'text-amber-400' : 'text-red-400'}>
                            {title.length >= 50 && title.length <= 60 ? '✓ ideal' : title.length > 60 ? 'truncated' : 'short'}
                        </span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <div>
                    <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Meta Description ({desc.length} chars)</span>
                        <span className={(desc.length >= 120 && desc.length <= 160) ? 'text-emerald-400' : desc.length > 160 ? 'text-red-400' : 'text-amber-400'}>
                            {desc.length >= 120 && desc.length <= 160 ? '✓ ideal' : desc.length > 160 ? 'truncated' : 'short'}
                        </span>
                    </label>
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            {/* Factor Checklist */}
            <details className="group">
                <summary className="text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    Factor Breakdown ({liveScore.hits?.length || 0} pass / {liveScore.misses?.length || 0} fail)
                </summary>
                <div className="mt-2">
                    <FactorChecklist scoreResult={liveScore} />
                </div>
            </details>

            {/* Keyword Map */}
            {kwLoading && <div className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading keywords...</div>}
            {keywords.length > 0 && <KeywordMap keywords={keywords} title={title} description={desc} onInsert={handleInsertKeyword} />}

            {/* Competitor Titles */}
            {compLoading && <div className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Fetching competitors...</div>}
            {competitors && competitors.length > 0 && (
                <div className="p-3 bg-purple-900/10 border border-purple-700/30 rounded-lg">
                    <h4 className="text-xs font-semibold text-purple-300 uppercase mb-2">Competitor Titles for "{topKeyword}"</h4>
                    <div className="space-y-1.5">
                        {competitors.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px]">
                                <span className="text-gray-600 flex-shrink-0">#{i + 1}</span>
                                <span className="text-white truncate">{c.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Variants */}
            <div className="space-y-3">
                <button
                    onClick={handleGenerateVariants}
                    disabled={aiLoading || !aiService.isEnabled}
                    className="flex items-center gap-2 px-4 py-2 text-xs bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg"
                >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {aiLoading ? 'Generating...' : 'Generate 3 AI Variants'}
                </button>
                {aiError && <div className="text-xs text-red-400 bg-red-900/10 border border-red-800/30 px-3 py-1.5 rounded-lg">{aiError}</div>}
                {variants && (
                    <div className="space-y-2">
                        {variants.map((v, i) => (
                            <div key={i} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase text-purple-300 font-bold tracking-wide">{v.trigger}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${v.score >= 70 ? 'bg-emerald-500/20 text-emerald-300' : v.score >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                        Score: {v.score}
                                    </span>
                                </div>
                                <div className="text-sm text-white font-medium">{v.title}</div>
                                <div className="text-xs text-gray-400 mt-1">{v.description}</div>
                                <div className="flex items-center justify-between mt-2.5">
                                    <span className="text-[10px] text-gray-600">{v.title.length}c · {v.description.length}c</span>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleUseVariant(v)} className="px-2 py-1 text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Use this
                                        </button>
                                        <button onClick={() => handleCopy(v.title, `t-${i}`)} className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1">
                                            {copiedIdx === `t-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            Title
                                        </button>
                                        <button onClick={() => handleCopy(v.description, `d-${i}`)} className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1">
                                            {copiedIdx === `d-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            Meta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Before/After Diff */}
            {(title !== row.title || desc !== (row.excerpt || '')) && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Before → After</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                            <div className="text-[10px] text-red-400 uppercase font-bold">Original</div>
                            <div className="p-2 bg-red-500/5 border border-red-800/20 rounded text-gray-300">{row.title}</div>
                            <div className="p-2 bg-red-500/5 border border-red-800/20 rounded text-gray-400">{row.excerpt || '(no description)'}</div>
                            <div className="text-[10px] text-gray-500">Score: {originalScore.score} ({originalScore.grade})</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] text-emerald-400 uppercase font-bold">Rewritten</div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-800/20 rounded text-white">{title}</div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-800/20 rounded text-gray-200">{desc || '(no description)'}</div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-gray-500">Score: {liveScore.score} ({liveScore.grade})</span>
                                <span className={`font-bold ${deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {deltaScore >= 0 ? '+' : ''}{deltaScore} pts
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => handleCopy(`${title}\n${desc}`, 'final')} className="px-3 py-1.5 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1">
                            {copiedIdx === 'final' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy Both
                        </button>
                    </div>
                </div>
            )}

            {/* Footer help */}
            <div className="text-[10px] text-gray-600">
                Copy the improved title/description into WordPress (Yoast / Rank Math). Changes here are not saved — they're a preview-only playground.
            </div>
        </div>
    );
}

export default CtrLabDetail;
