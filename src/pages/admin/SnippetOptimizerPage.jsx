// src/pages/admin/SnippetOptimizerPage.jsx
// Analyzes articles for featured snippet / PAA readiness and helps reformat content.

import React, { useEffect, useState } from 'react';
import { Award, Loader2, RefreshCw, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';

function analyzeSnippetReadiness(content) {
    const html = content || '';
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Definition snippet: clear "X is Y" pattern in first 300 chars
    const firstParagraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const firstPara = firstParagraphMatch ? firstParagraphMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    const hasDefinition = /\b(?:is|are|refers to|means|defined as)\b/i.test(firstPara) && firstPara.length >= 40 && firstPara.length <= 300;

    // List snippet: ordered/unordered lists with 4-8 items
    const olMatches = html.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi) || [];
    const ulMatches = html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
    const listsWithItems = [...olMatches, ...ulMatches].filter(list => {
        const items = (list.match(/<li/gi) || []).length;
        return items >= 4 && items <= 8;
    });
    const hasGoodList = listsWithItems.length > 0;

    // Table snippet: has comparison/data tables
    const tables = (html.match(/<table/gi) || []).length;
    const hasTable = tables > 0;

    // How-to snippet: has step-by-step with numbered headings or "Step X" pattern
    const hasHowTo = /step\s*\d|step-by-step|<h[23][^>]*>.*?step/i.test(html);

    // Question headings for PAA
    const questionHeadings = (html.match(/<h[2-4][^>]*>[^<]*(what|how|why|when|where|which|can|does|is it|should)[^<]*\??<\/h[2-4]>/gi) || []).length;
    const hasPAAFormat = questionHeadings >= 3;

    // Short answer after question heading (50-60 word answer = ideal for PAA)
    const qaPairs = html.match(/<h[2-4][^>]*>[^<]*\?<\/h[2-4]>\s*<p[^>]*>[^<]{100,400}<\/p>/gi) || [];
    const hasGoodQA = qaPairs.length >= 2;

    // Score
    let score = 0;
    if (hasDefinition) score += 20;
    if (hasGoodList) score += 20;
    if (hasTable) score += 15;
    if (hasHowTo) score += 15;
    if (hasPAAFormat) score += 15;
    if (hasGoodQA) score += 15;

    const checks = [
        { label: 'Definition paragraph (40-300 chars, "X is Y" format)', pass: hasDefinition },
        { label: 'Structured list (4-8 items, ordered or unordered)', pass: hasGoodList },
        { label: 'Comparison/data table', pass: hasTable },
        { label: 'Step-by-step / How-to format', pass: hasHowTo },
        { label: 'Question-format headings (3+ for PAA)', pass: hasPAAFormat },
        { label: 'Concise Q&A pairs (question heading + short answer)', pass: hasGoodQA },
    ];

    return { score, checks, questionHeadings, tables, listsWithItems: listsWithItems.length };
}

export function SnippetOptimizerPage() {
    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState([]);
    const [expandedSlug, setExpandedSlug] = useState(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await wordpressApi.getAllPosts(1, 100);
            const analyzed = (data.posts || []).map(p => ({
                slug: p.slug,
                title: p.title,
                content: p.content || '',
                ...analyzeSnippetReadiness(p.content || ''),
            })).sort((a, b) => a.score - b.score); // Worst first
            setArticles(analyzed);
        } catch { /* ignore */ }
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Award className="w-8 h-8 text-indigo-400" />
                        Featured Snippet Optimizer
                    </h1>
                    <p className="text-gray-400">Score each article's readiness for featured snippets & People Also Ask — AI reformats content for the win.</p>
                </div>
                <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
            )}

            {!loading && articles.length > 0 && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700">
                        <h3 className="text-sm font-semibold text-white">Articles (lowest snippet readiness first)</h3>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {articles.map(a => (
                            <SnippetRow key={a.slug} article={a} expanded={expandedSlug === a.slug} onToggle={() => setExpandedSlug(expandedSlug === a.slug ? null : a.slug)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SnippetRow({ article, expanded, onToggle }) {
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const scoreColor = article.score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' :
                       article.score >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/40' :
                       'text-red-400 bg-red-500/10 border-red-500/40';

    const handleAI = async () => {
        if (!aiService.isEnabled) { alert('Set AI key in sidebar.'); return; }
        setAiLoading(true);
        try {
            const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const content = stripHtml(article.content).substring(0, 2500);
            const failedChecks = article.checks.filter(c => !c.pass).map(c => c.label).join(', ');

            const prompt = `Article: "${article.title}"
Content preview: ${content.substring(0, 1000)}

This article is MISSING these featured-snippet elements: ${failedChecks}

For each missing element, generate the exact content I should add to this article to win the featured snippet. Be specific to THIS article's topic:

1. If missing definition: Write a 40-60 word definition paragraph starting with "[Topic] is..."
2. If missing list: Write a 4-8 item structured list relevant to the article
3. If missing table: Suggest a comparison table structure with headers
4. If missing how-to: Write step-by-step headings
5. If missing Q&A: Write 3 question headings + concise 50-word answers

Only generate content for the MISSING elements. Make it directly paste-ready for WordPress.`;

            const response = await aiService.generateSuggestion(prompt, '');
            setAiResult(response);
        } catch (e) { console.error(e); }
        setAiLoading(false);
    };

    return (
        <div className="border-b border-slate-700/50 last:border-0">
            <div onClick={onToggle} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/60 cursor-pointer">
                <div className="col-span-7 text-sm text-gray-200 truncate">{article.title}</div>
                <div className="col-span-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${scoreColor}`}>
                        {article.score}/100
                    </span>
                </div>
                <div className="col-span-3 text-right text-xs text-gray-500">
                    {article.checks.filter(c => c.pass).length}/{article.checks.length} checks
                </div>
            </div>
            {expanded && (
                <div className="px-6 pb-4 bg-slate-900/40 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                        {article.checks.map((check, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs flex items-center gap-2 ${check.pass ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                                {check.pass ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                <span className="truncate">{check.label.split('(')[0].trim()}</span>
                            </div>
                        ))}
                    </div>

                    {article.checks.some(c => !c.pass) && (
                        <button onClick={handleAI} disabled={aiLoading} className="flex items-center gap-2 px-3 py-2 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg">
                            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {aiLoading ? 'Generating...' : 'AI: Generate Missing Snippet Content'}
                        </button>
                    )}

                    {aiResult && (
                        <div className="p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg text-sm text-gray-200 whitespace-pre-wrap">
                            {aiResult}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SnippetOptimizerPage;
