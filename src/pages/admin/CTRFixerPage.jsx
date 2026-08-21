// src/pages/admin/CTRFixerPage.jsx
// CTR Fixer — finds page-1 URLs whose SERP snippet underperforms expected CTR,
// and lets you apply title/meta to seoOverrides.js (the file Google actually sees).
// Page-2+ rows are labeled as ranking problems so they stop looking like title bugs.

import { useEffect, useState, useMemo } from 'react';
import {
    Loader2, AlertTriangle, Sparkles, RefreshCw, MousePointerClick, Copy, Check,
    ExternalLink, Target, Wrench, Globe, Eye, Link2, GitCommit, Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import gscService from '@/services/gscService';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { scoreCtr } from '@/utils/ctrScorer';
import wordpressApi from '@/services/wordpressApi';
import { buildLinkGraph } from '@/utils/linkAnalysis';
import { LinkHealthPanel } from '@/components/admin/LinkHealthPanel';
import { getOptimizedTitle, getOptimizedDescription, getSEOOverride } from '@/data/seoOverrides';
import { diagnoseCtr, summarizeCtrMix } from '@/utils/expectedCtr';
import { formatSeoOverrideEntry, upsertSeoOverrideSource } from '@/utils/seoOverrideFile';
import { commitTextFile, hasGithubWriteToken } from '@/services/githubContentsService';

const KIND_STYLES = {
    snippet: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    rank: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ok: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    low_data: 'bg-slate-600/30 text-gray-400 border-slate-500/40',
};

function slugFromPage(url = '') {
    const m = String(url).match(/\/articles\/([^/?#]+)/);
    return m ? m[1] : null;
}

async function applySeoOverride(slug, title, description) {
    if (import.meta.env.DEV) {
        const response = await fetch('/api/save-seo-override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, title, description }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Local save failed. Is `npm run dev` running?');
        }
        return { local: true };
    }

    return commitTextFile({
        path: 'src/data/seoOverrides.js',
        message: `seo: CTR title override for ${slug}`,
        transform: (text) => upsertSeoOverrideSource(text, slug, title, description),
    });
}

function SerpPreview({ title, description, slug }) {
    const maxTitle = 60;
    const maxDesc = 160;
    const displayTitle = title.length > maxTitle ? `${title.slice(0, maxTitle)}…` : title;
    const displayDesc = (description || '').length > maxDesc
        ? `${description.slice(0, maxDesc)}…`
        : description || 'No meta description — Google will invent a snippet from the page.';
    return (
        <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-600 mb-0.5">
                dataengineerhub.blog › articles › {slug}
            </div>
            <div className="text-[#1a0dab] text-base font-medium leading-tight">{displayTitle}</div>
            <p className="text-sm text-[#4d5156] mt-0.5 leading-snug">{displayDesc}</p>
            {title.length > maxTitle && (
                <div className="mt-1 text-[10px] text-amber-700">Title truncated ({title.length} chars)</div>
            )}
        </div>
    );
}

export function CTRFixerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState('');
    const [expandedSlug, setExpandedSlug] = useState(null);
    const [filter, setFilter] = useState('snippet');
    const [tab, setTab] = useState('pages');
    const [queryRows, setQueryRows] = useState([]);
    const [queryLoading, setQueryLoading] = useState(false);
    const [queryError, setQueryError] = useState('');
    const [gscConnected, setGscConnected] = useState(gscService.isConnected());

    const linkGraph = useMemo(() => {
        if (!articles || articles.length === 0) return null;
        return buildLinkGraph(articles);
    }, [articles]);

    const mix = useMemo(() => summarizeCtrMix(articles), [articles]);

    const visible = useMemo(() => {
        if (filter === 'snippet') return articles.filter((a) => a.diagnosis.kind === 'snippet');
        if (filter === 'rank') return articles.filter((a) => a.diagnosis.kind === 'rank');
        if (filter === 'ok') return articles.filter((a) => a.diagnosis.kind === 'ok' || a.diagnosis.kind === 'low_data');
        return articles;
    }, [articles, filter]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const connected = gscService.isConnected();
            setGscConnected(connected);
            if (!connected) {
                setError('Connect Google Search Console first — use the button below or the sidebar.');
                setLoading(false);
                return;
            }

            const [gscPages, wpData] = await Promise.all([
                gscService.queryTopPages({ rowLimit: 200 }),
                wordpressApi.getAllPosts(1, 100),
            ]);

            const posts = wpData.posts || [];
            const postMap = {};
            posts.forEach((p) => { postMap[p.slug] = p; });

            const matched = gscPages
                .map((row) => {
                    const slug = slugFromPage(row.page);
                    if (!slug) return null;
                    const post = postMap[slug];
                    const wpTitle = post?.title || slug;
                    const wpDesc = post?.metaDescription || post?.excerpt || '';
                    const liveTitle = getOptimizedTitle(slug, wpTitle);
                    const liveDesc = getOptimizedDescription(slug, wpDesc);
                    const override = getSEOOverride(slug);
                    const diagnosis = diagnoseCtr({
                        impressions: row.impressions,
                        clicks: row.clicks,
                        ctr: row.ctr,
                        position: row.position,
                        title: liveTitle,
                    });
                    return {
                        slug,
                        wpTitle,
                        title: liveTitle,
                        excerpt: liveDesc,
                        wpExcerpt: wpDesc,
                        hasOverride: !!override,
                        content: post?.content || '',
                        impressions: row.impressions,
                        clicks: row.clicks,
                        ctr: row.ctr,
                        position: row.position,
                        diagnosis,
                        clickGap: Math.round(diagnosis.opportunity),
                    };
                })
                .filter(Boolean)
                .filter((a) => a.impressions >= 20)
                .sort((a, b) => b.clickGap - a.clickGap);

            setArticles(matched);
        } catch (e) {
            setError(e.message || 'Failed to load data');
        }
        setLoading(false);
    }

    async function loadQueries() {
        if (!gscService.isConnected()) return;
        setQueryLoading(true);
        setQueryError('');
        try {
            const rows = await gscService.queryPageQueryRows({ rowLimit: 500 });
            const scored = rows
                .map((row) => {
                    const slug = slugFromPage(row.page);
                    const diagnosis = diagnoseCtr(row);
                    return { ...row, slug, diagnosis, clickGap: Math.round(diagnosis.opportunity) };
                })
                .filter((r) => r.impressions >= 30 && r.diagnosis.kind === 'snippet')
                .sort((a, b) => b.clickGap - a.clickGap)
                .slice(0, 80);
            setQueryRows(scored);
        } catch (e) {
            setQueryError(e.message || 'Failed to load query rows');
        }
        setQueryLoading(false);
    }

    function handleTab(next) {
        setTab(next);
        if (next === 'queries' && queryRows.length === 0 && !queryLoading) {
            loadQueries();
        }
    }

    const snippetCount = articles.filter((a) => a.diagnosis.kind === 'snippet').length;
    const rankCount = articles.filter((a) => a.diagnosis.kind === 'rank').length;
    const snippetClicks = articles
        .filter((a) => a.diagnosis.kind === 'snippet')
        .reduce((s, a) => s + a.clickGap, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <MousePointerClick className="w-8 h-8 text-rose-400" />
                        CTR Fixer
                    </h1>
                    <p className="text-gray-400">
                        High impressions with &lt;1% CTR is usually page-2 rankings, not a bad title.
                        This tool only treats page-1 snippet gaps as title work — and applies them to the live SERP override file.
                    </p>
                </div>
                <div className="flex gap-2">
                    {!gscConnected && (
                        <button
                            onClick={() => gscService.startOAuth()}
                            disabled={!gscService.isConfigured()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2"
                        >
                            <Link2 className="w-4 h-4" /> Connect GSC
                        </button>
                    )}
                    <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Loading GSC data...</span>
                </div>
            )}

            {!loading && articles.length > 0 && (
                <>
                    <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-sm text-gray-300 flex gap-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-white">How to read a &lt;1% site CTR:</strong>{' '}
                            Position #1 averages ~28% CTR; page 2 averages ~1% or less.
                            If {(mix.page1Share * 100).toFixed(0)}% of impressions are page 1, title rewrites can help those URLs.
                            The rest need better rankings (internal links, freshness, matching the query), not a new H1.
                            Live Google titles come from <code className="text-blue-300">src/data/seoOverrides.js</code>, not WordPress.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-blue-300">{(mix.page1Share * 100).toFixed(0)}%</div>
                            <div className="text-xs text-gray-400">Impressions on page 1</div>
                        </div>
                        <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-amber-400">{rankCount}</div>
                            <div className="text-xs text-gray-400">URLs stuck page 2+ (rank, not snippet)</div>
                        </div>
                        <div className="p-4 bg-rose-900/20 border border-rose-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-rose-400">{snippetCount}</div>
                            <div className="text-xs text-gray-400">Page-1 snippet gaps (fix titles here)</div>
                        </div>
                        <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">{snippetClicks.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Recoverable clicks if snippets match rank</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleTab('pages')}
                            className={`px-3 py-1.5 rounded-lg text-xs ${tab === 'pages' ? 'bg-rose-600/40 text-white border border-rose-500/50' : 'bg-slate-700/40 text-gray-400 border border-transparent'}`}
                        >
                            Pages
                        </button>
                        <button
                            onClick={() => handleTab('queries')}
                            className={`px-3 py-1.5 rounded-lg text-xs ${tab === 'queries' ? 'bg-rose-600/40 text-white border border-rose-500/50' : 'bg-slate-700/40 text-gray-400 border border-transparent'}`}
                        >
                            Queries (page 1, low CTR)
                        </button>
                    </div>

                    {tab === 'pages' && (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { k: 'snippet', label: `Snippet gaps (${snippetCount})` },
                                    { k: 'rank', label: `Ranking issues (${rankCount})` },
                                    { k: 'all', label: `All (${articles.length})` },
                                ].map((f) => (
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

                            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-700">
                                    <h3 className="text-sm font-semibold text-white">
                                        {filter === 'snippet'
                                            ? 'Page-1 URLs whose title/meta is leaving clicks on the table'
                                            : filter === 'rank'
                                                ? 'High impressions, but average position is page 2+ — titles will not fix these'
                                                : 'All article URLs with 20+ impressions'}
                                    </h3>
                                </div>
                                <div className="max-h-[700px] overflow-y-auto">
                                    {visible.length === 0 && (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            {filter === 'snippet'
                                                ? 'No page-1 snippet gaps in this window. Check Ranking issues — that is probably your <1% CTR.'
                                                : 'No rows for this filter.'}
                                        </div>
                                    )}
                                    {visible.map((article) => (
                                        <CTRArticleRow
                                            key={article.slug}
                                            article={article}
                                            linkGraph={linkGraph}
                                            expanded={expandedSlug === article.slug}
                                            onToggle={() => setExpandedSlug(expandedSlug === article.slug ? null : article.slug)}
                                            onApplied={(title, desc) => {
                                                setArticles((prev) => prev.map((a) => (
                                                    a.slug === article.slug
                                                        ? { ...a, title, excerpt: desc, hasOverride: true }
                                                        : a
                                                )));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {tab === 'queries' && (
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white">Queries ranking page 1 with CTR far below expected</h3>
                                <button onClick={loadQueries} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Reload
                                </button>
                            </div>
                            {queryLoading && (
                                <div className="p-8 flex items-center justify-center text-gray-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading query × page rows…
                                </div>
                            )}
                            {queryError && <div className="p-4 text-sm text-red-400">{queryError}</div>}
                            {!queryLoading && !queryError && queryRows.length === 0 && (
                                <div className="p-8 text-center text-gray-500 text-sm">No page-1 query gaps with 30+ impressions.</div>
                            )}
                            {!queryLoading && queryRows.map((row, i) => (
                                <div key={`${row.page}-${row.query}-${i}`} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-700/40 text-xs items-center">
                                    <div className="col-span-5 text-gray-200 truncate" title={row.query}>{row.query}</div>
                                    <div className="col-span-3 text-gray-500 truncate" title={row.slug || row.page}>{row.slug || '—'}</div>
                                    <div className="col-span-1 text-gray-400 text-center">{row.impressions}</div>
                                    <div className="col-span-1 text-gray-400 text-center">#{row.position.toFixed(1)}</div>
                                    <div className="col-span-1 text-rose-400 text-center">{(row.ctr * 100).toFixed(1)}%</div>
                                    <div className="col-span-1 text-emerald-400 text-right font-mono">+{row.clickGap}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {!loading && !error && articles.length === 0 && gscConnected && (
                <div className="text-center text-gray-500 py-12">No article URLs with 20+ impressions in the last 28 days.</div>
            )}
        </div>
    );
}

function CTRArticleRow({ article, linkGraph, expanded, onToggle, onApplied }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [variants, setVariants] = useState(null);
    const [competitors, setCompetitors] = useState(null);
    const [aiError, setAiError] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [queries, setQueries] = useState(null);
    const [applyStatus, setApplyStatus] = useState('');
    const [applyError, setApplyError] = useState('');
    const [applyingIdx, setApplyingIdx] = useState(null);

    const diagnosis = article.diagnosis;
    const ctrColor = article.ctr < 0.02 ? 'text-red-400' : article.ctr < 0.05 ? 'text-amber-400' : 'text-emerald-400';
    const currentScore = scoreCtr({ title: article.title, description: article.excerpt, gscKeywords: queries });

    useEffect(() => {
        if (!expanded || queries !== null) return;
        if (!gscService.isConnected()) return;
        const url = `https://dataengineerhub.blog/articles/${article.slug}`;
        gscService.queryTopKeywords({ url, rowLimit: 15 })
            .then((data) => setQueries(data.sort((a, b) => b.impressions - a.impressions)))
            .catch(() => setQueries([]));
    }, [expanded, article.slug, queries]);

    const titleIssues = [];
    if (article.title.length > 60) titleIssues.push('Too long (truncated in SERP)');
    if (article.title.length < 30) titleIssues.push('Too short (wastes SERP real estate)');
    if (!/\d/.test(article.title)) titleIssues.push('No numbers (data attracts clicks)');
    if (article.wpTitle !== article.title) titleIssues.push('Live SERP title differs from WordPress H1 (good — override is active)');
    if (!article.hasOverride) titleIssues.push('No seoOverrides entry — Google may be using the WordPress title');
    if (!article.excerpt || article.excerpt.length < 80) titleIssues.push('Meta description too short/missing');
    if (article.excerpt && article.excerpt.length > 160) titleIssues.push('Meta description truncated (>160 chars)');

    const handleCopyVariant = (text, idx) => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleApply = async (title, description, idx) => {
        setApplyingIdx(idx);
        setApplyError('');
        setApplyStatus('');
        try {
            const result = await applySeoOverride(article.slug, title, description);
            setApplyStatus(result.local
                ? 'Saved locally. Restart/refresh the app; deploy still needed for production SERPs.'
                : 'Committed to GitHub. SERP titles update after the next main deploy.');
            onApplied?.(title, description);
        } catch (e) {
            setApplyError(e.message || 'Apply failed');
        }
        setApplyingIdx(null);
    };

    const handleAIFix = async () => {
        if (!aiService.isEnabled) {
            alert('AI API key not configured. Set it in the admin sidebar.');
            return;
        }
        setAiLoading(true);
        setAiError('');
        try {
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const contentSnippet = stripHtml(article.content || '').substring(0, 2000);
            const topQueries = (queries || []).slice(0, 8);

            let competitorContext = '';
            if (tinyfishService.isEnabled) {
                try {
                    const keyword = (topQueries[0]?.query || article.title).replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 5).join(' ');
                    const searchResults = await tinyfishService.search(keyword);
                    const comps = (searchResults.results || [])
                        .filter((r) => !r.url?.includes('dataengineerhub.blog'))
                        .slice(0, 5);
                    if (comps.length > 0) {
                        setCompetitors(comps);
                        competitorContext = `\n\nCOMPETITOR TITLES CURRENTLY RANKING:\n${comps.map((c, i) => `${i + 1}. "${c.title}" — ${c.snippet || ''}`).join('\n')}\n\nBeat these with more compelling, specific titles.`;
                    }
                } catch { /* optional */ }
            }

            const queryBlock = topQueries.length
                ? `\nREAL SEARCH QUERIES (from GSC, use the top one near the front of the title):\n${topQueries.map((q, i) => `${i + 1}. "${q.query}" — ${q.impressions} imp, CTR ${(q.ctr * 100).toFixed(1)}%, pos #${q.position.toFixed(1)}`).join('\n')}`
                : '';

            const prompt = `You are a CTR optimization specialist. Rewrite the GOOGLE SERP title and meta (not the on-page H1).

URL: https://dataengineerhub.blog/articles/${article.slug}
LIVE SERP TITLE (what Google shows today): "${article.title}" (${article.title.length} chars)
WORDPRESS H1 (do not copy this unless it is better): "${article.wpTitle}"
LIVE META: "${article.excerpt}" (${(article.excerpt || '').length} chars)
GSC: ${article.impressions} impressions, ${article.clicks} clicks, CTR ${(article.ctr * 100).toFixed(2)}%, avg position #${article.position.toFixed(1)}
Diagnosis: ${diagnosis.label} — ${diagnosis.detail}
Expected CTR for this rank: ~${(diagnosis.expected * 100).toFixed(1)}%
Content: ${contentSnippet.substring(0, 500)}${queryBlock}${competitorContext}

Generate 3 title + description variants:

Variant 1 (CURIOSITY): Information gap — make them NEED to know
Variant 2 (SPECIFICITY): Numbers, data, year — concrete value promise
Variant 3 (AUTHORITY): Expert proof, definitive language

Rules:
- Titles: 50-60 chars, primary query near front, no "| DataEngineer Hub" suffix
- Descriptions: 120-155 chars, start with action verb, include benefit
- Match the article's actual content — don't promise things the article doesn't deliver
- Prefer the real GSC queries over the H1 wording

Respond in EXACTLY this JSON (no markdown, no code blocks):
{"variants": [{"title": "...", "description": "...", "trigger": "curiosity"}, {"title": "...", "description": "...", "trigger": "specificity"}, {"title": "...", "description": "...", "trigger": "authority"}]}`;

            const response = await aiService.generateSuggestion(prompt, contentSnippet);
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const parsed = JSON.parse(response.substring(firstBrace, lastBrace + 1));
                const scored = (parsed.variants || []).map((v) => ({
                    ...v,
                    score: scoreCtr({ title: v.title, description: v.description, gscKeywords: queries }).score,
                }));
                setVariants(scored);
            } else {
                setAiError('AI returned no valid suggestions. Try again.');
            }
        } catch (e) {
            setAiError(e.message || 'AI generation failed. Try again.');
        }
        setAiLoading(false);
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-5 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{article.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border ${KIND_STYLES[diagnosis.kind] || KIND_STYLES.ok}`}>
                            {diagnosis.label}
                        </span>
                        {article.hasOverride && <span className="text-[10px] text-blue-400">override</span>}
                    </div>
                </div>
                <div className="col-span-2 text-center text-xs text-gray-400">{article.impressions.toLocaleString()} imp</div>
                <div className="col-span-1 text-center text-xs text-gray-400">{article.clicks}</div>
                <div className={`col-span-1 text-center text-xs font-bold ${ctrColor}`}>{(article.ctr * 100).toFixed(1)}%</div>
                <div className="col-span-1 text-center text-xs text-gray-400">#{article.position.toFixed(1)}</div>
                <div className="col-span-2 text-right text-xs text-emerald-400 font-mono">
                    {diagnosis.kind === 'snippet' ? `+${article.clickGap} clicks` : '—'}
                </div>
            </div>

            {expanded && (
                <div className="px-4 sm:px-6 pb-5 bg-slate-900/40 space-y-4">
                    <div className={`mt-3 p-3 rounded-lg border text-sm ${
                        diagnosis.kind === 'snippet' ? 'bg-rose-900/15 border-rose-800/40 text-rose-200'
                            : diagnosis.kind === 'rank' ? 'bg-amber-900/15 border-amber-800/40 text-amber-200'
                                : 'bg-slate-800/60 border-slate-700 text-gray-300'
                    }`}>
                        {diagnosis.detail}
                    </div>

                    <div className="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Your CTR</div>
                            <div className={`text-lg font-bold ${ctrColor}`}>{(article.ctr * 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">Expected for #{article.position.toFixed(1)}</div>
                            <div className="text-lg font-bold text-blue-400">{(diagnosis.expected * 100).toFixed(1)}%</div>
                        </div>
                        <div className="p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase">
                                {diagnosis.kind === 'snippet' ? "Title work could recover" : 'Not a title gap'}
                            </div>
                            <div className="text-lg font-bold text-emerald-400">
                                {diagnosis.kind === 'snippet' ? `+${article.clickGap} clicks/mo` : 'Rank first'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase">Live SERP (what Google shows)</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${currentScore.score >= 70 ? 'bg-emerald-500/20 text-emerald-300' : currentScore.score >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                    Score: {currentScore.score}/100
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-[10px] text-gray-500">TITLE ({article.title.length} chars){article.hasOverride ? ' · seoOverrides' : ' · WordPress fallback'}</div>
                                    <div className="text-sm text-white font-medium">{article.title}</div>
                                </div>
                                {article.wpTitle !== article.title && (
                                    <div>
                                        <div className="text-[10px] text-gray-500">WORDPRESS H1 (not used in SERP)</div>
                                        <div className="text-xs text-gray-500 line-through">{article.wpTitle}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-[10px] text-gray-500">META ({(article.excerpt || '').length} chars)</div>
                                    <div className="text-xs text-gray-300">{article.excerpt || <span className="text-red-400 italic">Missing</span>}</div>
                                </div>
                                {titleIssues.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {titleIssues.map((issue, i) => (
                                            <span key={i} className="px-2 py-0.5 text-[10px] bg-red-900/30 text-red-300 border border-red-800/30 rounded">
                                                {issue}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <SerpPreview title={article.title} description={article.excerpt} slug={article.slug} />
                    </div>

                    {queries && queries.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Top queries for this URL</div>
                            <div className="space-y-1">
                                {queries.slice(0, 8).map((q) => (
                                    <div key={q.query} className="grid grid-cols-12 gap-2 text-xs">
                                        <div className="col-span-6 text-gray-200 truncate">{q.query}</div>
                                        <div className="col-span-2 text-gray-500">{q.impressions} imp</div>
                                        <div className="col-span-2 text-gray-500">#{q.position.toFixed(1)}</div>
                                        <div className="col-span-2 text-right text-gray-400">{(q.ctr * 100).toFixed(1)}% CTR</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {linkGraph && <LinkHealthPanel article={article} linkGraph={linkGraph} />}

                    {competitors && competitors.length > 0 && (
                        <div className="p-4 bg-purple-900/10 border border-purple-700/30 rounded-lg">
                            <div className="text-xs font-semibold text-purple-300 uppercase mb-2">Competitor Titles in SERP</div>
                            <div className="space-y-1.5">
                                {competitors.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className="text-gray-600 shrink-0">#{i + 1}</span>
                                        <div className="min-w-0">
                                            <div className="text-white truncate">{c.title}</div>
                                            <div className="text-gray-500 truncate">{c.snippet}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <button
                            onClick={handleAIFix}
                            disabled={aiLoading || diagnosis.kind === 'rank'}
                            title={diagnosis.kind === 'rank' ? 'Title rewrites will not recover these clicks until the URL ranks page 1' : ''}
                            className="flex items-center gap-2 px-4 py-2 text-xs bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-40 text-white font-semibold rounded-lg"
                        >
                            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {aiLoading ? 'Generating...' : diagnosis.kind === 'rank' ? 'AI disabled until this ranks page 1' : 'AI: Generate SERP title variants'}
                        </button>
                        {!hasGithubWriteToken() && !import.meta.env.DEV && (
                            <span className="text-[10px] text-amber-400">
                                Apply-to-GitHub needs the Sponsor Manager PAT in this tab.
                            </span>
                        )}
                    </div>

                    {aiError && (
                        <div className="text-xs text-red-400 p-2 bg-red-900/10 border border-red-800/30 rounded-lg">{aiError}</div>
                    )}
                    {applyError && (
                        <div className="text-xs text-red-400 p-2 bg-red-900/10 border border-red-800/30 rounded-lg">{applyError}</div>
                    )}
                    {applyStatus && (
                        <div className="text-xs text-emerald-300 p-2 bg-emerald-900/10 border border-emerald-800/30 rounded-lg">{applyStatus}</div>
                    )}

                    {variants && (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI variants — apply writes seoOverrides.js (H1 unchanged)</div>
                            {variants.sort((a, b) => b.score - a.score).map((v, i) => (
                                <div key={i} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-purple-300 font-bold">{v.trigger}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            v.score >= 70 ? 'bg-emerald-500/20 text-emerald-300'
                                                : v.score >= 50 ? 'bg-amber-500/20 text-amber-300'
                                                    : 'bg-red-500/20 text-red-300'
                                        }`}>Score: {v.score}</span>
                                    </div>
                                    <SerpPreview title={v.title} description={v.description} slug={article.slug} />
                                    <div className="text-sm text-white font-medium">{v.title}</div>
                                    <div className="text-xs text-gray-400">{v.description}</div>
                                    <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                                        <div className="text-[10px] text-gray-600">
                                            Title: {v.title.length} chars · Desc: {(v.description || '').length} chars
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            <button
                                                onClick={() => handleCopyVariant(v.title, `title-${i}`)}
                                                className="px-2 py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1"
                                            >
                                                {copiedIdx === `title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                Title
                                            </button>
                                            <button
                                                onClick={() => handleCopyVariant(formatSeoOverrideEntry(article.slug, v.title, v.description), `js-${i}`)}
                                                className="px-2 py-1 text-[10px] bg-slate-600/40 hover:bg-slate-600 text-gray-200 rounded border border-slate-500/40 flex items-center gap-1"
                                            >
                                                {copiedIdx === `js-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                JS entry
                                            </button>
                                            <button
                                                onClick={() => handleApply(v.title, v.description, i)}
                                                disabled={applyingIdx !== null}
                                                className="px-2 py-1 text-[10px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded border border-emerald-500/40 flex items-center gap-1"
                                            >
                                                {applyingIdx === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitCommit className="w-3 h-3" />}
                                                Apply override
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
                        <Link to={`/admin/keyword-target?slug=${article.slug}`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Target className="w-3 h-3" /> Keyword Target
                        </Link>
                        <Link to={`/admin/article-fixer`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Article Fixer
                        </Link>
                        <Link to={`/admin/snippet-optimizer?slug=${article.slug}`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Snippet Optimizer
                        </Link>
                        <Link to={`/admin/serp-intelligence`} className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <Globe className="w-3 h-3" /> SERP Intel
                        </Link>
                        <a href={`https://dataengineerhub.blog/articles/${article.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[10px] bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-lg flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View Article
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CTRFixerPage;
