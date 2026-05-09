// src/components/admin/QualityGate.jsx
// Pre-publish quality gate — scores content for AI detection risk, SEO, readability, and AEO/GEO readiness.
// Use in Article Writer (Step 4) and Article Fixer before publishing.

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

// AI-tell phrases that flag content as AI-generated
const AI_TELLS = [
    'in today\'s fast-paced', 'it\'s important to note', 'let\'s dive in',
    'in conclusion', 'furthermore', 'moreover', 'leverage', 'utilize',
    'comprehensive guide', 'in this article we will', 'without further ado',
    'it is worth noting', 'in the realm of', 'navigating the', 'at the end of the day',
    'game-changer', 'unlock the power', 'in today\'s digital landscape',
    'plays a crucial role', 'it goes without saying', 'needless to say',
];

// Words that indicate formulaic AI patterns when overused
const FORMULAIC_STARTERS = ['additionally', 'furthermore', 'moreover', 'however', 'therefore', 'consequently'];

/**
 * Score content across 4 dimensions (0-100 total)
 */
export function scoreContent(text, focusKeyword = '') {
    if (!text || text.length < 100) return null;

    const lower = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const wordCount = words.length;

    // ─── 1. AI Detection Risk (30 pts) ───────────────────────────
    let aiScore = 30;

    // Check for AI-tell phrases (-3 per occurrence, max -15)
    const aiTellCount = AI_TELLS.filter(phrase => lower.includes(phrase)).length;
    aiScore -= Math.min(15, aiTellCount * 3);

    // Check for repetitive sentence starters (-2 per occurrence, max -8)
    let repetitiveStarters = 0;
    for (let i = 1; i < sentences.length; i++) {
        const prevFirst = sentences[i - 1].split(/\s+/)[0]?.toLowerCase();
        const currFirst = sentences[i].split(/\s+/)[0]?.toLowerCase();
        if (prevFirst && currFirst && prevFirst === currFirst && FORMULAIC_STARTERS.includes(currFirst)) {
            repetitiveStarters++;
        }
    }
    aiScore -= Math.min(8, repetitiveStarters * 2);

    // Check sentence length variation (good = varied lengths)
    const sentLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLen = sentLengths.length > 0 ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length : 0;
    const variance = sentLengths.length > 0
        ? sentLengths.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / sentLengths.length
        : 0;
    if (variance < 20) aiScore -= 4; // Low variance = robotic
    if (variance > 50) aiScore += 2; // High variance = human (bonus, cap at 30)

    // Check for contractions (humans use them)
    const contractions = (text.match(/\b(don't|won't|can't|it's|that's|I'd|we're|they're|isn't|aren't|wasn't)\b/g) || []).length;
    if (contractions < 3 && wordCount > 500) aiScore -= 3;

    aiScore = Math.max(0, Math.min(30, aiScore));

    // ─── 2. SEO Score (30 pts) ───────────────────────────────────
    let seoScore = 0;
    const kw = focusKeyword.toLowerCase().trim();

    if (kw) {
        // Keyphrase in first 200 chars
        if (lower.substring(0, 200).includes(kw)) seoScore += 6;
        // Keyphrase in headings
        const headingMatches = (text.match(/^##? .+$/gm) || []).filter(h => h.toLowerCase().includes(kw)).length;
        if (headingMatches >= 2) seoScore += 6;
        else if (headingMatches >= 1) seoScore += 3;
        // Keyword density (0.5-2.5%)
        const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const occurrences = (text.match(kwRegex) || []).length;
        const density = wordCount > 0 ? (occurrences * kw.split(/\s+/).length / wordCount) * 100 : 0;
        if (density >= 0.5 && density <= 2.5) seoScore += 6;
        else if (density > 0 && density < 0.5) seoScore += 3;
        // Has internal links
        if (text.includes('/articles/') || text.includes('dataengineerhub.blog')) seoScore += 4;
        // Has external links
        if (text.includes('docs.snowflake.com') || text.includes('docs.getdbt.com') || text.includes('https://')) seoScore += 4;
        // Word count >= 1500
        if (wordCount >= 2000) seoScore += 4;
        else if (wordCount >= 1500) seoScore += 2;
    } else {
        // Without keyword, just check structural SEO
        if (wordCount >= 2000) seoScore += 10;
        if ((text.match(/^## /gm) || []).length >= 5) seoScore += 10;
        if (text.includes('https://')) seoScore += 5;
        if (text.includes('/articles/')) seoScore += 5;
    }
    seoScore = Math.min(30, seoScore);

    // ─── 3. Readability (20 pts) ─────────────────────────────────
    let readScore = 20;

    // Average sentence length (ideal: 12-20 words)
    if (avgLen > 25) readScore -= 6;
    else if (avgLen > 20) readScore -= 3;

    // Long paragraphs (>150 words)
    const longParas = paragraphs.filter(p => p.split(/\s+/).length > 150).length;
    readScore -= Math.min(6, longParas * 2);

    // Has subheadings (## or ###)
    const headingCount = (text.match(/^#{2,3} /gm) || []).length;
    if (headingCount < 3 && wordCount > 1000) readScore -= 4;

    // Short paragraphs exist (good sign)
    const shortParas = paragraphs.filter(p => p.split(/\s+/).length <= 30).length;
    if (shortParas >= 3) readScore += 2;

    readScore = Math.max(0, Math.min(20, readScore));

    // ─── 4. AEO/GEO Readiness (20 pts) ──────────────────────────
    let aeoGeoScore = 0;

    // Has TL;DR section
    if (lower.includes('tl;dr') || lower.includes('key takeaway')) aeoGeoScore += 4;
    // Has FAQ section
    if (lower.includes('frequently asked') || lower.includes('q:') || lower.includes('**q:')) aeoGeoScore += 4;
    // Has data/statistics (numbers with %)
    const statCount = (text.match(/\d+%|\$\d+|\d+x|\d+\.\d+/g) || []).length;
    if (statCount >= 3) aeoGeoScore += 3;
    else if (statCount >= 1) aeoGeoScore += 1;
    // Has comparison table
    if (text.includes('|') && (text.match(/\|/g) || []).length >= 10) aeoGeoScore += 3;
    // Has citation patterns
    if (text.includes('[source]') || text.includes('according to') || text.includes('(docs)')) aeoGeoScore += 3;
    // Has freshness date
    if (text.includes('2026') || text.includes('last updated') || text.includes('Updated:')) aeoGeoScore += 3;

    aeoGeoScore = Math.min(20, aeoGeoScore);

    // ─── Total ───────────────────────────────────────────────────
    const total = aiScore + seoScore + readScore + aeoGeoScore;

    return {
        total,
        grade: total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : 'D',
        dimensions: {
            aiDetection: { score: aiScore, max: 30, label: 'AI Detection Safety', issues: aiTellCount > 0 ? `${aiTellCount} AI-tell phrase(s) found` : null },
            seo: { score: seoScore, max: 30, label: 'SEO Optimization', issues: kw && seoScore < 20 ? 'Missing keyword placements' : null },
            readability: { score: readScore, max: 20, label: 'Readability', issues: avgLen > 25 ? 'Sentences too long' : null },
            aeoGeo: { score: aeoGeoScore, max: 20, label: 'AEO/GEO Readiness', issues: aeoGeoScore < 10 ? 'Missing TL;DR, FAQ, or data' : null },
        },
        meta: { wordCount, sentenceCount: sentences.length, avgSentenceLength: Math.round(avgLen), aiTellCount, contractions },
    };
}

/**
 * Quality Gate UI Component
 */
export function QualityGate({ content, focusKeyword }) {
    const result = content ? scoreContent(content, focusKeyword) : null;

    if (!result) return null;

    const getColor = (score, max) => {
        const pct = max > 0 ? (score / max) * 100 : 0;
        if (pct >= 80) return 'text-emerald-400';
        if (pct >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBg = (score, max) => {
        const pct = max > 0 ? (score / max) * 100 : 0;
        if (pct >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
        if (pct >= 60) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    const overallColor = result.total >= 80 ? 'text-emerald-400' : result.total >= 65 ? 'text-amber-400' : 'text-red-400';
    const overallBg = result.total >= 80 ? 'from-emerald-900/20 to-teal-900/20 border-emerald-500/30' : result.total >= 65 ? 'from-amber-900/20 to-orange-900/20 border-amber-500/30' : 'from-red-900/20 to-pink-900/20 border-red-500/30';

    return (
        <div className={`bg-gradient-to-br ${overallBg} rounded-2xl border p-5 space-y-4`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold text-white">Pre-Publish Quality Gate</span>
                </div>
                <div className="text-right">
                    <span className={`text-3xl font-black ${overallColor}`}>{result.total}</span>
                    <span className="text-gray-500 text-sm">/100</span>
                    <div className={`text-xs font-bold ${overallColor}`}>Grade {result.grade}</div>
                </div>
            </div>

            {/* Dimension bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(result.dimensions).map((dim) => {
                    const pct = dim.max > 0 ? Math.min(100, Math.max(0, (dim.score / dim.max) * 100)) : 0;
                    const ratio = dim.max > 0 ? dim.score / dim.max : 0;
                    return (
                        <div key={dim.label} className={`p-3 rounded-xl border ${getBg(dim.score, dim.max)}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{dim.label}</span>
                                <span className={`text-xs font-bold ${getColor(dim.score, dim.max)}`}>{dim.score}/{dim.max}</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            {dim.issues && <div className="text-[9px] text-gray-500 mt-1">{dim.issues}</div>}
                        </div>
                    );
                })}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 pt-2 border-t border-slate-700/50">
                <span>{result.meta.wordCount.toLocaleString()} words</span>
                <span>{result.meta.sentenceCount} sentences</span>
                <span>Avg {result.meta.avgSentenceLength} words/sentence</span>
                <span>{result.meta.contractions} contractions</span>
                {result.meta.aiTellCount > 0 && <span className="text-red-400">{result.meta.aiTellCount} AI-tells detected</span>}
            </div>

            {/* Verdict */}
            <div className={`flex items-center gap-2 text-sm font-medium ${overallColor}`}>
                {result.total >= 80 ? <CheckCircle className="w-4 h-4" /> : result.total >= 65 ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.total >= 80 ? 'Ready to publish — high quality content' : result.total >= 65 ? 'Publishable with minor improvements' : 'Needs work before publishing — review flagged issues'}
            </div>
        </div>
    );
}

export default QualityGate;
