// src/pages/admin/SmartLinkingPage.jsx
// AI-powered internal linking suggestions. Uses Gemini to recommend
// which articles to link TO and FROM, with exact anchor text.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertTriangle, ArrowRight, ArrowLeft, Check, ExternalLink, Globe, CheckCircle, Clock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { rankCandidates } from '@/utils/articleSimilarity';
import { buildLinkGraph } from '@/utils/linkAnalysis';
import activityHistory from '@/services/activityHistory';

const APPLIED_STORAGE_KEY = 'smart_linking_applied_v1';

function getApplied() {
    if (typeof localStorage === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY) || '{}'); }
    catch { return {}; }
}

function saveApplied(data) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function markApplied(articleSlug, linkKey) {
    const data = getApplied();
    data[articleSlug] = data[articleSlug] || {};
    data[articleSlug][linkKey] = true;
    saveApplied(data);
}

function unmarkApplied(articleSlug, linkKey) {
    const data = getApplied();
    if (data[articleSlug]) {
        delete data[articleSlug][linkKey];
        // Clean up empty slug entries
        if (Object.keys(data[articleSlug]).length === 0) {
            delete data[articleSlug];
        }
        saveApplied(data);
    }
}

function isApplied(articleSlug, linkKey) {
    const data = getApplied();
    return !!(data[articleSlug] && data[articleSlug][linkKey]);
}

export function SmartLinkingPage() {
    const [searchParams] = useSearchParams();
    const [articles, setArticles] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [analysisMeta, setAnalysisMeta] = useState(null);
    const [error, setError] = useState('');
    const [aiStatus, setAiStatus] = useState(() => aiService.getStatus());

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                const posts = (data.posts || []).map(p => ({
                    slug: p.slug,
                    title: p.title,
                    excerpt: p.excerpt,
                    content: p.content || '',
                }));
                setArticles(posts);

                // Auto-select article from URL params (when navigated from another tool)
                const paramSlug = searchParams.get('slug');
                if (paramSlug && posts.some(p => p.slug === paramSlug)) {
                    setSelectedSlug(paramSlug);
                }
            } catch { /* ignore */ }
            setLoadingArticles(false);
        }
        load();
    }, [searchParams]);

    useEffect(() => {
        // Refresh AI status every second so cooldown countdown ticks
        const interval = setInterval(() => {
            setAiStatus(aiService.getStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyze = async () => {
        if (!selectedSlug) return;
        setLoading(true);
        setError('');
        setResult(null);
        setAnalysisMeta(null);
        try {
            const selected = articles.find(a => a.slug === selectedSlug);
            if (!selected) throw new Error('Article not found');

            // Strip HTML tags helper
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            // ---- STAGE 1: Local relevance pre-filter (no AI) ----
            // Rank all other articles by topical similarity to target. Only the
            // top 15 candidates go into the AI prompt — this dramatically cuts
            // false positives caused by the AI seeing thin 150-char excerpts.
            const { targetTerms, ranked } = rankCandidates(selected, articles, 15);

            // Build link graph so we know which articles already link to/from target
            const { outboundLinks } = buildLinkGraph(articles);
            const existingOutbound = new Set(outboundLinks[selectedSlug] || []);
            const existingInbound = new Set();
            Object.entries(outboundLinks).forEach(([sourceSlug, targets]) => {
                if (targets.includes(selectedSlug)) existingInbound.add(sourceSlug);
            });

            // Stash for UI
            setAnalysisMeta({
                targetTerms: targetTerms.terms,
                ranked,
                existingOutbound: [...existingOutbound],
                existingInbound: [...existingInbound],
            });

            // Get full content of selected article (up to 6000 chars for better context)
            const articleContent = stripHtml(selected.content || '').substring(0, 6000);

            // TinyFish: search for related external authority pages
            let serpContext = '';
            if (tinyfishService.isEnabled) {
                try {
                    const topicKeyword = selected.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 4).join(' ');
                    const searchResults = await tinyfishService.search(`${topicKeyword} documentation tutorial`);
                    const authorityResults = (searchResults.results || [])
                        .filter(r => r.url && (r.url.includes('docs.') || r.url.includes('official') || r.url.includes('.io/docs') || r.url.includes('github.com')))
                        .slice(0, 5);
                    if (authorityResults.length > 0) {
                        serpContext = `\n\nREAL AUTHORITY PAGES FOUND VIA WEB SEARCH (use these for external link suggestions — verified live URLs):\n${authorityResults.map(r => `- "${r.title}" → ${r.url}`).join('\n')}\n`;
                    }
                } catch { /* optional enrichment */ }
            }

            // ---- STAGE 2: Build retrieval-augmented AI prompt ----
            // Only the top 15 ranked candidates with rich 400-char excerpts.
            const candidatesBlock = ranked.map(c => {
                const excerpt = stripHtml(c.content || c.excerpt || '').substring(0, 400);
                const matched = c.relevance.matchedTerms.length > 0
                    ? ` | shared terms: ${c.relevance.matchedTerms.join(', ')}`
                    : '';
                const inboundFlag = existingInbound.has(c.slug) ? ' [ALREADY LINKS TO TARGET]' : '';
                const outboundFlag = existingOutbound.has(c.slug) ? ' [TARGET ALREADY LINKS TO THIS]' : '';
                return `- "${c.title}" [/articles/${c.slug}] (relevance ${c.relevance.score}%${matched})${inboundFlag}${outboundFlag}\n  Excerpt: ${excerpt}`;
            }).join('\n\n');

            const skipBlock = (existingOutbound.size > 0 || existingInbound.size > 0)
                ? `\n\nEXISTING LINKS — DO NOT SUGGEST THESE AGAIN:\n${
                    [...existingOutbound].map(s => `- target already links TO: ${s}`).join('\n')
                }${existingOutbound.size && existingInbound.size ? '\n' : ''}${
                    [...existingInbound].map(s => `- already links FROM: ${s}`).join('\n')
                }`
                : '';

            const topicTermsLine = targetTerms.terms.slice(0, 12).join(', ');

            const prompt = `You are a senior SEO strategist specializing in internal linking for topical authority.

TARGET ARTICLE TO OPTIMIZE:
Title: "${selected.title}"
URL: /articles/${selected.slug}
Core topics (extracted from headings, code, and proper nouns): ${topicTermsLine}
Full content (first ~6000 chars):
---
${articleContent || '(content not available)'}
---

PRE-RANKED CANDIDATE ARTICLES (top 15 by topical similarity to target):
${candidatesBlock}
${skipBlock}
${serpContext}

YOUR TASK: Recommend internal links AND external authority links — but ONLY where the topical match is genuinely strong.

CRITICAL RELEVANCE RULES:
1. ONLY suggest a candidate if it directly relates to one of the target's core topics listed above. Surface-level overlap (e.g. "both about Snowflake") is NOT enough.
2. Reject any candidate where the only connection is a shared broad category or technology name.
3. Reject any candidate that's a generic intro article when the target is advanced (or vice versa).
4. The anchor text MUST be a phrase that already appears (or could naturally fit in one specific sentence) in the target article's content above. Don't invent anchor text that requires rewriting the article.
5. Do NOT suggest any link in the "EXISTING LINKS" list above — those already exist.
6. Each suggestion's "placement" must reference an actual sentence, paragraph topic, or section from the content above (not vague hints like "in the introduction").

QUOTA RULES (no padding):
- Return AT MOST 6 outbound (linkFrom) and AT MOST 4 inbound (linkTo) suggestions.
- Return FEWER if fewer truly relevant matches exist. Returning 0 or 1 suggestion is acceptable when the target is highly niche.
- Quality over quantity. A single excellent suggestion beats 6 weak ones.

INTERNAL LINKING:
- linkFrom — places in the TARGET article where you'd add an outbound link to one of the candidates.
- linkTo — candidates that should add an INBOUND link pointing to the target. Only suggest these when the candidate's excerpt clearly shows a natural place to link to this target.

EXTERNAL LINKING RULES:
1. Suggest 0-5 authoritative external resources (only if they add real value — don't pad).
2. Use only well-known stable URLs: official documentation (Snowflake, AWS, dbt, Apache, Google), research papers, official blog posts.
3. External links must support specific claims or concepts in the target article.

Respond in EXACTLY this JSON format (no markdown fences, just raw JSON):
{
  "linkFrom": [
    {"slug": "candidate-slug", "title": "Candidate Title", "anchorText": "natural 2-6 word phrase from the target article", "placement": "In the paragraph discussing [specific topic from target content]. After the sentence about [quote or paraphrase]", "reason": "Reader needs [concept candidate covers] to fully understand [related concept in target]"}
  ],
  "linkTo": [
    {"slug": "source-candidate-slug", "title": "Source Candidate Title", "anchorText": "anchor text that fits naturally in that source article", "placement": "In that article's section about [topic from its excerpt above], where it mentions [concept] — link to target as a deep-dive", "reason": "Specific reason why readers of that source would benefit from target"}
  ],
  "externalLinks": [
    {"url": "https://docs.example.com/page", "title": "Resource Title", "anchorText": "natural anchor text", "placement": "After the paragraph discussing [specific topic]", "reason": "Supports the claim about [specific point]", "authority": "Official Snowflake/AWS/dbt documentation"}
  ]
}

FINAL CHECK before responding:
- Every linkFrom slug MUST be one of the candidate slugs listed above.
- Every linkTo slug MUST be one of the candidate slugs listed above.
- No suggestion may duplicate an "EXISTING LINKS" entry.
- If you cannot find genuinely relevant matches for any category, return an empty array for that category.`;

            const response = await aiService.generateSuggestion(prompt, '');

            // Robust JSON extraction
            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                throw new Error('AI returned no valid JSON. Try again or rephrase.');
            }
            const jsonText = response.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonText);

            // ---- STAGE 3: Post-filter — drop hallucinations and existing links ----
            const validSlugs = new Set(ranked.map(c => c.slug));
            const relevanceBySlug = new Map(ranked.map(c => [c.slug, c.relevance]));

            const filterAndAnnotate = (arr, isInbound) => {
                if (!Array.isArray(arr)) return [];
                return arr
                    .filter(s => s && typeof s.slug === 'string')
                    // Drop hallucinated slugs (AI invented something not in candidate list)
                    .filter(s => validSlugs.has(s.slug))
                    // Drop existing link duplicates
                    .filter(s => {
                        if (isInbound) return !existingInbound.has(s.slug);
                        return !existingOutbound.has(s.slug);
                    })
                    // Annotate with relevance score from local ranker
                    .map(s => {
                        const rel = relevanceBySlug.get(s.slug);
                        return {
                            ...s,
                            relevanceScore: rel?.score ?? 0,
                            matchedTerms: rel?.matchedTerms ?? [],
                        };
                    })
                    // Sort by relevance descending
                    .sort((a, b) => b.relevanceScore - a.relevanceScore);
            };

            const cleaned = {
                linkFrom: filterAndAnnotate(parsed.linkFrom, false),
                linkTo: filterAndAnnotate(parsed.linkTo, true),
                externalLinks: Array.isArray(parsed.externalLinks) ? parsed.externalLinks : [],
            };

            setResult(cleaned);
            activityHistory.addEntry('smart-linking', 'analyzed', {
                slug: selectedSlug,
                title: `${(cleaned.linkFrom?.length || 0) + (cleaned.linkTo?.length || 0)} link suggestions`,
                data: { suggestions: cleaned, topicTerms: targetTerms?.terms || [] },
            });
        } catch (err) {
            setError(err.message || 'Analysis failed. AI may have returned invalid JSON — try again.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-pink-400" />
                    Smart Internal Linking
                </h1>
                <p className="text-gray-400">AI-powered link recommendations with exact anchor text and context.</p>
            </div>

            {/* Resume banner — show last analysis for the currently-selected article */}
            {(() => {
                const slugForBanner = selectedSlug;
                if (!slugForBanner) return null;
                const previous = activityHistory.getHistory({ tool: 'smart-linking', slug: slugForBanner, limit: 1 })[0];
                if (!previous) return null;
                return (
                    <div className="flex items-center gap-3 p-3 bg-purple-900/15 border border-purple-500/20 rounded-xl">
                        <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 flex-1">
                            Last analyzed for this article: <strong className="text-white">{previous.title}</strong>
                            <span className="text-gray-500 ml-2">
                                {new Date(previous.timestamp).toLocaleDateString()} {new Date(previous.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </span>
                        <a href="/admin/history" className="text-[10px] text-purple-400 hover:text-purple-300">View history</a>
                    </div>
                );
            })()}

            {!aiStatus.enabled && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-300 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>AI API key required.</strong> Select a provider and enter the key in the sidebar.
                    </div>
                </div>
            )}

            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Target Article</label>
                <select
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                >
                    <option value="">
                        {loadingArticles ? 'Loading articles...' : 'Select an article to analyze'}
                    </option>
                    {articles.map(a => (
                        <option key={a.slug} value={a.slug}>{a.title}</option>
                    ))}
                </select>
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedSlug || loading || !aiStatus.enabled || aiStatus.isRateLimited}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center gap-2"
                    title={aiStatus.isRateLimited ? `${aiStatus.provider === 'groq' ? 'Groq' : 'Gemini'} rate-limited — wait ${aiStatus.cooldownSeconds}s` : ''}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading
                        ? 'Analyzing...'
                        : aiStatus.isRateLimited
                            ? `Rate limited (${aiStatus.cooldownSeconds}s)`
                            : 'Get AI Link Suggestions'}
                </button>
            </div>

            {aiStatus.enabled && (
                <div className="text-xs text-gray-500 -mt-2">
                    Active provider: <span className="text-gray-300 font-medium capitalize">{aiStatus.provider}</span>
                    {aiStatus.isRateLimited && (
                        <span className="ml-2 text-amber-400">
                            • cooldown {aiStatus.cooldownSeconds}s remaining
                        </span>
                    )}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {analysisMeta && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Detected topics in target article</div>
                        <div className="flex flex-wrap gap-1.5">
                            {analysisMeta.targetTerms.slice(0, 15).map((t, i) => (
                                <span key={i} className="px-2 py-0.5 bg-pink-900/20 border border-pink-800/30 rounded text-xs text-pink-200">
                                    {t}
                                </span>
                            ))}
                            {analysisMeta.targetTerms.length === 0 && (
                                <span className="text-xs text-gray-500 italic">No clear topic terms detected — article may be too short.</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                        <span>Top candidates ranked: <strong className="text-gray-200">{analysisMeta.ranked.length}</strong></span>
                        <span>Best relevance: <strong className="text-gray-200">{analysisMeta.ranked[0]?.relevance.score ?? 0}%</strong></span>
                        <span>Existing inbound: <strong className="text-gray-200">{analysisMeta.existingInbound.length}</strong></span>
                        <span>Existing outbound: <strong className="text-gray-200">{analysisMeta.existingOutbound.length}</strong></span>
                    </div>
                </motion.div>
            )}

            {result && (result.linkFrom?.length === 0 && result.linkTo?.length === 0 && (result.externalLinks?.length || 0) === 0) && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl text-sm text-amber-200">
                    <strong>No high-confidence link suggestions found.</strong> The AI didn't find any candidates with strong enough topical match. This is the expected outcome for highly niche articles — quality over quantity.
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Link FROM target */}
                    {result.linkFrom?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                                <ArrowRight className="w-4 h-4" />
                                Add these outbound links (in your target article)
                            </h3>
                            <div className="space-y-2">
                                {result.linkFrom.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `from-${link.slug}`);
                                    return (
                                        <LinkSuggestion
                                            key={i}
                                            link={link}
                                            direction="from"
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `from-${link.slug}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `from-${link.slug}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Link TO target */}
                    {result.linkTo?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                                <ArrowLeft className="w-4 h-4" />
                                Add these inbound links (edit those other articles)
                            </h3>
                            <div className="space-y-2">
                                {result.linkTo.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `to-${link.slug}`);
                                    return (
                                        <LinkSuggestion
                                            key={i}
                                            link={link}
                                            direction="to"
                                            targetSlug={selectedSlug}
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `to-${link.slug}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `to-${link.slug}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    {result.externalLinks?.length > 0 && (
                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4" />
                                External authority links to add (boost E-E-A-T)
                            </h3>
                            <div className="space-y-2">
                                {result.externalLinks.map((link, i) => {
                                    const applied = isApplied(selectedSlug, `ext-${link.url}`);
                                    return (
                                        <ExternalLinkSuggestion
                                            key={i}
                                            link={link}
                                            applied={applied}
                                            onMarkApplied={() => markApplied(selectedSlug, `ext-${link.url}`)}
                                            onUnmarkApplied={() => unmarkApplied(selectedSlug, `ext-${link.url}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-xs text-gray-400">
                        <strong className="text-gray-300">How to apply:</strong> Use the "Where to add" hint to locate the right paragraph in WordPress, wrap the anchor text phrase in the HTML link, and mark as applied.
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function LinkSuggestion({ link, direction, targetSlug, applied, onMarkApplied, onUnmarkApplied }) {
    const [localApplied, setLocalApplied] = useState(applied);
    const linkHtml = direction === 'from'
        ? `<a href="/articles/${link.slug}">${link.anchorText}</a>`
        : `<a href="/articles/${targetSlug}">${link.anchorText}</a>`;

    const handleToggle = () => {
        if (localApplied) {
            onUnmarkApplied?.();
        } else {
            onMarkApplied?.();
        }
        setLocalApplied(!localApplied);
    };

    const score = typeof link.relevanceScore === 'number' ? link.relevanceScore : null;
    const scoreColor = score === null
        ? 'bg-slate-700 text-gray-300'
        : score >= 70
            ? 'bg-emerald-500/20 border-emerald-700/40 text-emerald-300'
            : score >= 50
                ? 'bg-blue-500/20 border-blue-700/40 text-blue-300'
                : score >= 30
                    ? 'bg-amber-500/20 border-amber-700/40 text-amber-300'
                    : 'bg-slate-700/40 border-slate-700 text-gray-400';

    return (
        <div className={`p-3 rounded-lg border transition ${
            localApplied
                ? 'bg-emerald-900/10 border-emerald-800/30 opacity-60'
                : 'bg-slate-900/50 border-slate-700'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium text-white truncate">{link.title}</div>
                        {score !== null && (
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${scoreColor}`} title="Topical relevance score (computed from target topics overlap)">
                                {score}% relevant
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-blue-300 mt-0.5">→ /articles/{link.slug}</div>
                    {Array.isArray(link.matchedTerms) && link.matchedTerms.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {link.matchedTerms.slice(0, 6).map((t, i) => (
                                <span key={i} className="px-1.5 py-0 bg-slate-800 border border-slate-700 rounded text-[9px] text-gray-400">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">Anchor text:</div>
                        <div className="text-emerald-300 font-mono">"{link.anchorText}"</div>
                    </div>
                    {link.placement && (
                        <div className="mt-2 p-2 bg-indigo-900/30 border border-indigo-700/30 rounded text-xs">
                            <div className="text-indigo-400 uppercase text-[10px] mb-1">Where to add:</div>
                            <div className="text-indigo-200">{link.placement}</div>
                        </div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">HTML to paste:</div>
                        <code className="text-blue-300 break-all">{linkHtml}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">{link.reason}</div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`p-1.5 rounded shrink-0 ${
                        localApplied
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600 text-gray-400'
                    }`}
                    title={localApplied ? 'Click to unmark' : 'Mark as applied'}
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ExternalLinkSuggestion({ link, applied, onMarkApplied, onUnmarkApplied }) {
    const [localApplied, setLocalApplied] = useState(applied);
    const [verified, setVerified] = useState(null); // null | 'loading' | true | false
    const linkHtml = `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.anchorText}</a>`;

    const handleToggle = () => {
        if (localApplied) {
            onUnmarkApplied?.();
        } else {
            onMarkApplied?.();
        }
        setLocalApplied(!localApplied);
    };

    const handleVerify = async () => {
        if (!tinyfishService.isEnabled) return;
        setVerified('loading');
        try {
            // Use search to check if the URL is indexed/live
            const domain = new URL(link.url).hostname;
            const results = await tinyfishService.search(`site:${domain} ${link.title || link.anchorText}`);
            setVerified((results.results || []).length > 0);
        } catch {
            setVerified(false);
        }
    };

    return (
        <div className={`p-3 rounded-lg border transition ${
            localApplied
                ? 'bg-emerald-900/10 border-emerald-800/30 opacity-60'
                : 'bg-slate-900/50 border-slate-700'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        {link.title}
                    </div>
                    <div className="text-xs text-purple-300 mt-0.5 truncate flex items-center gap-2">
                        â†’ {link.url}
                        {tinyfishService.isEnabled && verified === null && (
                            <button onClick={handleVerify} className="text-[9px] px-1.5 py-0.5 bg-cyan-900/30 border border-cyan-700/30 text-cyan-300 rounded hover:bg-cyan-800/30">verify</button>
                        )}
                        {verified === 'loading' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
                        {verified === true && <CheckCircle className="w-3 h-3 text-emerald-400" title="URL verified live" />}
                        {verified === false && <span className="text-[9px] text-red-400">not found</span>}
                    </div>
                    {link.authority && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{link.authority}</div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">Anchor text:</div>
                        <div className="text-emerald-300 font-mono">"{link.anchorText}"</div>
                    </div>
                    {link.placement && (
                        <div className="mt-2 p-2 bg-indigo-900/30 border border-indigo-700/30 rounded text-xs">
                            <div className="text-indigo-400 uppercase text-[10px] mb-1">Where to add:</div>
                            <div className="text-indigo-200">{link.placement}</div>
                        </div>
                    )}
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                        <div className="text-gray-500 uppercase text-[10px] mb-1">HTML to paste:</div>
                        <code className="text-blue-300 break-all">{linkHtml}</code>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">{link.reason}</div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`p-1.5 rounded shrink-0 ${
                        localApplied
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600 text-gray-400'
                    }`}
                    title={localApplied ? 'Click to unmark' : 'Mark as applied'}
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default SmartLinkingPage;
