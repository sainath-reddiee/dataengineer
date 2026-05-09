// src/pages/admin/PAAOptimizerPage.jsx
// People Also Ask Optimizer â€” discovers question keywords from GSC data,
// predicts additional PAA questions via AI, and generates snippet-optimized answers.

import React, { useEffect, useState, useMemo } from 'react';
import {
    Loader2, AlertTriangle, RefreshCw, Sparkles, Copy, Check,
    HelpCircle, ChevronDown, ChevronRight, CheckCircle, XCircle,
    MessageCircle, Search, Code,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import gscService from '@/services/gscService';
import wordpressApi from '@/services/wordpressApi';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';

const QUESTION_WORDS = /\b(how|what|why|when|can|does|is|should|which)\b/i;

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function QuestionCard({ question, answer, jsonLd, loading, onGenerate }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSchema, setShowSchema] = useState(false);

    // Auto-expand the first time an answer becomes available (e.g. after batch generate)
    useEffect(() => {
        if (answer && !expanded) setExpanded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answer]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-white font-medium text-sm">{question.text}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Source badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            question.source === 'gsc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : question.source === 'web'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-purple-500/20 text-purple-300'
                        }`}>
                            {question.source === 'gsc' ? 'FROM GSC' : question.source === 'web' ? 'WEB SEARCH' : 'AI PREDICTED'}
                        </span>
                        {/* Position */}
                        {question.position && (
                            <span className="text-xs text-gray-400">
                                pos {question.position.toFixed(1)}
                            </span>
                        )}
                        {/* Answered badge */}
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                            question.alreadyAnswered
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                        }`}>
                            {question.alreadyAnswered
                                ? <><CheckCircle className="w-3 h-3" /> Answered</>
                                : <><XCircle className="w-3 h-3" /> Not Answered</>}
                        </span>
                        {question.impressions && (
                            <span className="text-xs text-gray-500">{question.impressions} imp</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={answer ? () => setExpanded(!expanded) : () => onGenerate(question)}
                    disabled={loading}
                    className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white flex items-center gap-1.5"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     answer ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) :
                     <Sparkles className="w-3 h-3" />}
                    {loading ? 'Generating...' : answer ? (expanded ? 'Hide' : 'Show') : 'Generate Answer'}
                </button>
            </div>

            {expanded && answer && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                    {/* Snippet answer */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                <MessageCircle className="w-3 h-3" /> Snippet Answer (40-60 words)
                            </span>
                            <button
                                onClick={() => handleCopy(answer)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="bg-slate-900/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono">
                            {answer}
                        </div>
                    </div>

                    {/* JSON-LD Schema */}
                    {jsonLd && (
                        <div>
                            <button
                                onClick={() => setShowSchema(!showSchema)}
                                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 mb-2"
                            >
                                <Code className="w-3 h-3" />
                                {showSchema ? 'Hide' : 'Show'} FAQ Schema JSON-LD
                                {showSchema ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            {showSchema && (
                                <div className="relative">
                                    <button
                                        onClick={() => handleCopy(jsonLd)}
                                        className="absolute top-2 right-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                    <div className="bg-slate-900/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                                        {jsonLd}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function PAAOptimizerPage() {
    const [searchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    // Parent-owned answer state so individual cards + "Generate All" both feed the same map.
    // Keyed by question.text; each entry is { answer, jsonLd } | { loading: true }.
    const [answersMap, setAnswersMap] = useState({});
    const [batchProgress, setBatchProgress] = useState(null); // { done, total } when running

    const slugParam = searchParams.get('slug') || '';

    // Load posts on mount
    useEffect(() => {
        async function fetchPosts() {
            setPostsLoading(true);
            try {
                const wpData = await wordpressApi.getAllPosts(1, 100);
                setPosts(wpData.posts || []);
            } catch (e) {
                setError('Failed to load articles: ' + e.message);
            }
            setPostsLoading(false);
        }
        fetchPosts();
    }, []);

    // Auto-select from URL param
    useEffect(() => {
        if (slugParam && posts.length > 0) {
            const match = posts.find(p => p.slug === slugParam);
            if (match) {
                setSelectedSlug(slugParam);
            }
        }
    }, [slugParam, posts]);

    // Analyze when article changes
    useEffect(() => {
        if (selectedSlug) analyzeArticle(selectedSlug);
    }, [selectedSlug]);

    async function analyzeArticle(slug) {
        setLoading(true);
        setError('');
        setQuestions([]);
        setAnswersMap({});
        setBatchProgress(null);

        const post = posts.find(p => p.slug === slug);
        if (!post) {
            setError('Article not found');
            setLoading(false);
            return;
        }

        const contentText = stripHtml(post.content).toLowerCase();

        try {
            let gscQuestions = [];

            // Fetch GSC keywords and filter for questions
            if (gscService.isConnected()) {
                const keywords = await gscService.queryTopKeywords({
                    url: `https://dataengineerhub.blog/articles/${slug}`,
                    rowLimit: 50,
                });

                gscQuestions = keywords
                    .filter(kw => QUESTION_WORDS.test(kw.query))
                    .map(kw => ({
                        text: kw.query,
                        source: 'gsc',
                        position: kw.position,
                        impressions: kw.impressions,
                        alreadyAnswered: contentText.includes(kw.query.toLowerCase().replace(/\?$/, '')),
                    }));
            }

            // Generate AI predictions
            let aiQuestions = [];
            if (aiService.isEnabled) {
                const prompt = `You are an SEO expert. Based on this article title and topic, predict 5-10 "People Also Ask" questions that Google would show for related searches.

ARTICLE TITLE: ${post.title}
ARTICLE TOPIC: ${post.excerpt || post.title}

Return ONLY a JSON array of question strings. Example:
["How do I set up X?", "What is the difference between X and Y?", "Why should I use X?"]

Return the JSON array and nothing else.`;

                try {
                    const aiResult = await aiService.generateSuggestion(prompt, '');
                    // Try to parse as JSON
                    const jsonMatch = aiResult.match(/\[[\s\S]*?\]/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (Array.isArray(parsed)) {
                            aiQuestions = parsed.map(q => ({
                                text: String(q).trim(),
                                source: 'ai',
                                position: null,
                                impressions: null,
                                alreadyAnswered: contentText.includes(String(q).toLowerCase().replace(/\?$/, '')),
                            }));
                        }
                    } else {
                        // Fallback: split by newlines
                        aiQuestions = aiResult
                            .split('\n')
                            .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-â€¢]\s*/, '').trim())
                            .filter(line => line.length > 10 && QUESTION_WORDS.test(line))
                            .slice(0, 10)
                            .map(q => ({
                                text: q,
                                source: 'ai',
                                position: null,
                                impressions: null,
                                alreadyAnswered: contentText.includes(q.toLowerCase().replace(/\?$/, '')),
                            }));
                    }
                } catch (e) {
                    console.warn('AI PAA prediction failed:', e.message);
                }
            }

            // Fetch related questions from web search (FREE â€” TinyFish Search API)
            let webQuestions = [];
            if (tinyfishService.isEnabled) {
                try {
                    const topicKeyword = post.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 4).join(' ');
                    const searchResults = await tinyfishService.search(topicKeyword);
                    // Extract related searches that look like questions
                    const relatedSearches = searchResults.related_searches || [];
                    const allSnippets = (searchResults.results || []).map(r => r.snippet || '');
                    // Find question-like snippets from search results
                    const questionSnippets = [...relatedSearches, ...allSnippets]
                        .filter(s => QUESTION_WORDS.test(s) && s.length > 15 && s.length < 120)
                        .map(s => s.replace(/^[.â€¦\s]+/, '').trim());

                    webQuestions = questionSnippets.slice(0, 5).map(q => ({
                        text: q.endsWith('?') ? q : q + '?',
                        source: 'web',
                        position: null,
                        impressions: null,
                        alreadyAnswered: contentText.includes(q.toLowerCase().replace(/\?$/, '')),
                    }));
                } catch { /* web enrichment is optional */ }
            }

            // Deduplicate by question text
            const seen = new Set();
            const allQuestions = [...gscQuestions, ...webQuestions, ...aiQuestions].filter(q => {
                const key = q.text.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            setQuestions(allQuestions);
        } catch (e) {
            setError(e.message || 'Failed to analyze article');
        }
        setLoading(false);
    }

    const stats = useMemo(() => ({
        gscCount: questions.filter(q => q.source === 'gsc').length,
        aiCount: questions.filter(q => q.source === 'ai').length,
        answeredCount: questions.filter(q => q.alreadyAnswered).length,
    }), [questions]);

    const handleGenerateAnswer = async (question) => {
        if (!aiService.isEnabled) {
            return {
                answer: 'AI API key not configured. Set it in the admin sidebar.',
                jsonLd: null,
            };
        }

        const post = posts.find(p => p.slug === selectedSlug);
        const prompt = `You are an SEO content specialist optimizing for Google's People Also Ask feature.

ARTICLE: "${post?.title || selectedSlug}"
QUESTION: "${question.text}"

Generate TWO things:

1. A SNIPPET-OPTIMIZED ANSWER (40-60 words, concise, direct, starts by answering the question immediately, uses simple language, includes relevant keywords naturally)

2. The FAQ Schema JSON-LD for this Q&A pair (valid JSON-LD using FAQPage schema)

Format your response EXACTLY as:
---ANSWER---
[Your 40-60 word answer here]
---SCHEMA---
[The complete JSON-LD script tag here]
---END---`;

        try {
            const result = await aiService.generateSuggestion(prompt, '');

            // Parse response
            const answerMatch = result.match(/---ANSWER---\s*([\s\S]*?)---SCHEMA---/);
            const schemaMatch = result.match(/---SCHEMA---\s*([\s\S]*?)---END---/);

            const answer = answerMatch ? answerMatch[1].trim() : result.trim();
            const jsonLd = schemaMatch ? schemaMatch[1].trim() : JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [{
                    "@type": "Question",
                    "name": question.text,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answer,
                    }
                }]
            }, null, 2);

            return { answer, jsonLd };
        } catch (e) {
            return { answer: `Error: ${e.message}`, jsonLd: null };
        }
    };

    // Run a single generation and store result in answersMap
    const runGenerate = async (question) => {
        const key = question.text;
        setAnswersMap(prev => ({ ...prev, [key]: { ...(prev[key] || {}), loading: true } }));
        const result = await handleGenerateAnswer(question);
        setAnswersMap(prev => ({ ...prev, [key]: { answer: result.answer, jsonLd: result.jsonLd, loading: false } }));
    };

    // Generate answers for every question that doesn't already have one. Sequential
    // with a small delay so we don't blow rate limits on Groq/Gemini.
    const handleGenerateAll = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        const pending = questions.filter(q => !answersMap[q.text]?.answer);
        if (pending.length === 0) return;
        setBatchProgress({ done: 0, total: pending.length });
        for (let i = 0; i < pending.length; i++) {
            await runGenerate(pending[i]);
            setBatchProgress({ done: i + 1, total: pending.length });
            // Small delay between calls to ease rate limits
            if (i < pending.length - 1) await new Promise(r => setTimeout(r, 400));
        }
        setBatchProgress(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <HelpCircle className="w-8 h-8 text-purple-400" />
                        PAA Optimizer
                    </h1>
                    <p className="text-gray-400">
                        Discover People Also Ask questions and generate snippet-optimized answers with FAQ schema.
                    </p>
                </div>
            </div>

            {/* Article selector */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-4">
                <label className="text-xs text-gray-400 block mb-2">Select Article</label>
                {postsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading articles...
                    </div>
                ) : (
                    <select
                        value={selectedSlug}
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    >
                        <option value="">Choose an article...</option>
                        {posts.map(p => (
                            <option key={p.slug} value={p.slug}>{p.title}</option>
                        ))}
                    </select>
                )}
            </div>

            {error && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {!gscService.isConnected() && selectedSlug && (
                <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl flex items-center gap-2 text-blue-300 text-sm">
                    <AlertTriangle className="w-4 h-4" /> GSC not connected â€” showing AI predictions only. Connect GSC for real question data.
                </div>
            )}

            {/* Stats */}
            {!loading && questions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                        <div className="text-xs uppercase tracking-wider text-blue-300">GSC Questions</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.gscCount}</div>
                        <div className="text-xs text-gray-400 mt-1">from search data</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="text-xs uppercase tracking-wider text-purple-300">AI Predicted</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.aiCount}</div>
                        <div className="text-xs text-gray-400 mt-1">additional opportunities</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <div className="text-xs uppercase tracking-wider text-emerald-300">Already Answered</div>
                        <div className="text-3xl font-bold text-white mt-1">{stats.answeredCount}</div>
                        <div className="text-xs text-gray-400 mt-1">in current content</div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-40 gap-3">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    <span className="text-gray-400">Analyzing questions and generating predictions...</span>
                </div>
            )}

            {/* Questions list */}
            {!loading && questions.length > 0 && (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs text-gray-400">
                            {Object.values(answersMap).filter(v => v?.answer).length} of {questions.length} answered
                        </div>
                        <button
                            onClick={handleGenerateAll}
                            disabled={!!batchProgress || !aiService.isEnabled || questions.every(q => answersMap[q.text]?.answer)}
                            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
                        >
                            {batchProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {batchProgress
                                ? `Generating ${batchProgress.done}/${batchProgress.total}...`
                                : 'Generate All Answers'}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {questions.map((q, i) => {
                            const entry = answersMap[q.text] || {};
                            return (
                                <QuestionCard
                                    key={`${q.text}-${i}`}
                                    question={q}
                                    answer={entry.answer || null}
                                    jsonLd={entry.jsonLd || null}
                                    loading={!!entry.loading}
                                    onGenerate={runGenerate}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {!loading && selectedSlug && questions.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-lg">No questions found</p>
                    <p className="text-sm mt-1">
                        {aiService.isEnabled
                            ? 'No question keywords detected and AI prediction returned no results.'
                            : 'Connect GSC and configure AI to discover question opportunities.'}
                    </p>
                </div>
            )}

            {/* Info footer */}
            <div className="text-xs text-gray-500 border-t border-slate-700 pt-3 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong>{' '}
                Pulls question-format keywords from GSC (how, what, why, etc.), then uses AI to predict
                additional PAA questions Google might show. For each question, you can generate a
                snippet-optimized 40-60 word answer plus the FAQ schema JSON-LD markup to boost
                your chances of appearing in the PAA box.
            </div>
        </div>
    );
}

export default PAAOptimizerPage;
