// src/pages/admin/ReadabilityPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, AlertTriangle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { analyzeReadability } from '@/utils/seo/readabilityAnalyzer';

const SEVERITY_ICON = { warning: AlertTriangle, info: Info };
const SEVERITY_COLOR = { warning: 'text-amber-400', info: 'text-blue-400' };

export function ReadabilityPage() {
    const [articles, setArticles] = useState([]);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [loadingArticles, setLoadingArticles] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await wordpressApi.getAllPosts(1, 100);
                setArticles((data.posts || []).map(p => ({ slug: p.slug, title: p.title })));
            } catch { /* ignore */ }
            setLoadingArticles(false);
        }
        load();
    }, []);

    const handleAnalyze = async () => {
        if (!selected) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`https://app.dataengineerhub.blog/wp-json/wp/v2/posts?slug=${selected}&_fields=content`);
            const posts = await res.json();
            if (posts.length > 0) {
                const analysis = analyzeReadability(posts[0].content.rendered);
                setResult(analysis);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-lime-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Readability Analyzer</h1>
                <p className="text-gray-400">Analyze reading difficulty, sentence length, and passive voice usage for any article.</p>
            </div>

            <div className="flex gap-3">
                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                >
                    <option value="">
                        {loadingArticles ? 'Loading articles...' : 'Select an article'}
                    </option>
                    {articles.map(a => (
                        <option key={a.slug} value={a.slug}>{a.title}</option>
                    ))}
                </select>
                <button
                    onClick={handleAnalyze}
                    disabled={!selected || loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white font-semibold flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    Analyze
                </button>
            </div>

            {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Score Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
                            <div className="text-xs text-gray-400 mt-1">Overall Score</div>
                        </div>
                        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(result.fleschScore)}`}>{result.fleschScore}</div>
                            <div className="text-xs text-gray-400 mt-1">Flesch Score</div>
                        </div>
                        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                            <div className="text-3xl font-bold text-white">{result.avgSentenceLength}</div>
                            <div className="text-xs text-gray-400 mt-1">Avg Sentence Length</div>
                        </div>
                        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
                            <div className="text-3xl font-bold text-white">{result.passivePercentage}%</div>
                            <div className="text-xs text-gray-400 mt-1">Passive Voice</div>
                        </div>
                    </div>

                    {/* Reading Level */}
                    <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">Reading Level</span>
                            <span className="text-blue-400 font-semibold">{result.readingLevel}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                            <span>{result.wordCount} words</span>
                            <span>{result.sentenceCount} sentences</span>
                            <span>{result.paragraphCount} paragraphs</span>
                            <span>Grade {result.fleschGrade}</span>
                        </div>
                    </div>

                    {/* Strengths */}
                    {result.strengths.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Strengths
                            </h3>
                            {result.strengths.map((s, i) => (
                                <div key={i} className="text-sm text-gray-300 pl-6">+ {s}</div>
                            ))}
                        </div>
                    )}

                    {/* Issues */}
                    {result.issues.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Issues
                            </h3>
                            {result.issues.map((issue, i) => {
                                const Icon = SEVERITY_ICON[issue.severity] || Info;
                                return (
                                    <div key={i} className={`text-sm pl-6 ${SEVERITY_COLOR[issue.severity] || 'text-gray-400'}`}>
                                        {issue.text}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Sample Long Sentences */}
                    {result.sampleLongSentences.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-300">Long Sentences to Shorten</h3>
                            {result.sampleLongSentences.map((s, i) => (
                                <div key={i} className="text-xs text-gray-500 p-2 bg-slate-900/50 rounded border border-slate-700/50 italic">
                                    "{s}"
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default ReadabilityPage;
