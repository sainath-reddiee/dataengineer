// src/utils/articleDoctor.js
// Core diagnostic orchestrator — runs ALL checks for a single article and produces a unified verdict.
// Combines: link analysis, position blockers, cannibalization, position trend, optional backlinks/competitor.

import { analyzeArticleLinks } from './linkAnalysis';
import { detectBlockers, getPositionBucket, BUCKET_LABELS } from './positionBlockers';
import { getCannibalizedKeywords } from './cannibalizationCheck';
import { getTrend } from './positionHistory';

/**
 * Compute expected CTR for a given position (CTR curve from industry data).
 */
function expectedCtrForPosition(position) {
    if (!position) return 0;
    if (position <= 1) return 0.27;
    if (position <= 2) return 0.15;
    if (position <= 3) return 0.11;
    if (position <= 5) return 0.07;
    if (position <= 10) return 0.03;
    if (position <= 20) return 0.012;
    return 0.005;
}

function stripHtml(html) {
    return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(html) {
    const text = stripHtml(html);
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Compute a letter grade from a 0-100 score.
 */
function gradeFromScore(score) {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

/**
 * Main entry point: produce a comprehensive diagnosis for one article.
 *
 * @param {Object} article - WordPress article: { slug, title, content, ... }
 * @param {Object} options
 * @param {Object} options.linkGraph - Precomputed link graph from buildLinkGraph()
 * @param {number} options.position - Avg GSC position
 * @param {number} options.ctr - Avg GSC CTR
 * @param {number} options.impressions - GSC impressions
 * @param {number} options.clicks - GSC clicks
 * @param {Array} options.gscKeywords - Top GSC keywords for this article
 * @param {number} options.contentScore - 0-100
 * @param {number} options.aiVisScore - 0-100
 * @param {number} options.ctrScore - 0-100
 * @param {Object} options.cannibalization - Result from detectCannibalization()
 * @param {Object} options.competitorGap - Optional { wordCountGap, competitorWordCount, yourWordCount }
 * @param {Object} options.backlinkData - Optional from findBacklinks()
 * @returns {Object} verdict
 */
export function runDoctorDiagnosis(article, options = {}) {
    const {
        linkGraph,
        position,
        ctr,
        impressions,
        clicks,
        gscKeywords = [],
        contentScore = 0,
        aiVisScore = 0,
        ctrScore = 0,
        cannibalization,
        competitorGap,
        backlinkData,
    } = options;

    // NOTE: This function is pure — call recordPosition(slug, position) from a
    // useEffect on the calling page to persist the trend, not from here.

    // Compute link metrics
    const linkMetrics = analyzeArticleLinks(article, linkGraph);

    // Get cannibalized keywords
    const cannibalizedKeywords = cannibalization
        ? getCannibalizedKeywords(article?.slug, cannibalization)
        : [];

    // Position trend
    const trend = article?.slug ? getTrend(article.slug) : { trend: 'new' };

    // Word count
    const wordCount = countWords(article?.content);

    // Position bucket + label
    const bucket = getPositionBucket(position);
    const bucketLabel = BUCKET_LABELS[bucket];

    // Detect blockers
    const blockers = detectBlockers({
        article: { ...article, position, ctr, impressions, clicks },
        linkMetrics,
        contentScore,
        aiVisScore,
        ctrScore,
        gscKeywords,
        expectedCtr: expectedCtrForPosition(position),
        cannibalizedKeywords,
        competitorGap,
        wordCount,
    });

    // Quick wins = blockers with lift <= 4 and severity not critical
    const quickWins = blockers.filter(b => (b.lift || 0) <= 4 && b.severity !== 'critical').slice(0, 3);

    // Page jump path = top 3 blockers ordered by impact
    const pageJumpPath = blockers.slice(0, 3);

    // Total estimated lift if all blockers fixed
    const totalLift = blockers.reduce((sum, b) => sum + (b.lift || 0), 0);

    // Dimension scores (0-100)
    const dimensionScores = {
        links: linkMetrics?.score || 0,
        content: contentScore,
        ctr: ctrScore,
        aiVisibility: aiVisScore,
        backlinks: backlinkData?.available ? scoreBacklinkData(backlinkData) : null,
    };

    // Compute composite health (weighted average of available scores)
    const weights = { links: 0.25, content: 0.30, ctr: 0.20, aiVisibility: 0.15, backlinks: 0.10 };
    let weightedSum = 0;
    let weightTotal = 0;
    Object.entries(dimensionScores).forEach(([key, val]) => {
        if (val !== null && val !== undefined && Number.isFinite(val)) {
            weightedSum += val * weights[key];
            weightTotal += weights[key];
        }
    });
    const healthScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;
    const healthGrade = gradeFromScore(healthScore);

    // Find weakest dimension (the bottleneck)
    let bottleneck = null;
    let lowestScore = 101;
    Object.entries(dimensionScores).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val < lowestScore) {
            lowestScore = val;
            bottleneck = key;
        }
    });

    // One-liner summary
    const oneLiner = buildOneLiner({
        article,
        position,
        bucket,
        bucketLabel,
        blockers,
        totalLift,
        trend,
        gscKeywords,
    });

    return {
        slug: article?.slug,
        title: article?.title,
        position,
        bucket,
        bucketLabel,
        healthScore,
        healthGrade,
        oneLiner,
        bottleneck,
        dimensionScores,
        blockers,
        quickWins,
        pageJumpPath,
        totalLift,
        trend,
        linkMetrics,
        cannibalizedKeywords,
        wordCount,
        backlinkData,
        gscMetrics: { position, ctr, impressions, clicks, expectedCtr: expectedCtrForPosition(position) },
    };
}

function scoreBacklinkData(d) {
    if (!d?.available) return null;
    let score = 0;
    const linked = d.linkedMentions?.length || 0;
    const unlinked = d.unlinkedMentions?.length || 0;
    const domains = d.domainCount || 0;
    if (linked >= 5) score += 50; else if (linked >= 3) score += 35; else if (linked >= 1) score += 20;
    if (unlinked >= 3) score += 25; else if (unlinked >= 1) score += 12;
    if (domains >= 5) score += 25; else if (domains >= 3) score += 15; else if (domains >= 1) score += 8;
    return Math.min(100, score);
}

function buildOneLiner({ position, bucket, bucketLabel, blockers, totalLift, trend, gscKeywords }) {
    const topKeyword = gscKeywords?.[0]?.query;
    const topBlockerCount = Math.min(3, blockers.length);

    if (bucket === 'unranked') {
        return `Not ranking yet. ${blockers.length} issue(s) detected — fix the top ${topBlockerCount} to start showing up.`;
    }

    const trendBadge = trend?.trend === 'improving' ? ' (improving)' : trend?.trend === 'declining' ? ' (declining)' : '';
    const positionStr = position ? `#${position.toFixed(1)}` : 'N/A';
    const keywordPart = topKeyword ? ` for "${topKeyword}"` : '';
    const liftPart = totalLift > 0 ? ` Fixing top issues = +${totalLift} positions.` : '';

    if (bucket === 'top3') {
        return `Ranking ${positionStr}${keywordPart}${trendBadge}. Focus on Featured Snippet capture and CTR optimization to dominate.`;
    }
    if (bucket === 'page1') {
        return `Page 1 at ${positionStr}${keywordPart}${trendBadge}.${liftPart} Goal: top 3.`;
    }
    if (bucket === 'striking') {
        return `Striking distance at ${positionStr}${keywordPart}${trendBadge}.${liftPart} ${topBlockerCount} fixes can break to page 1.`;
    }
    if (bucket === 'page3') {
        return `Page 3 at ${positionStr}${keywordPart}${trendBadge}. Needs major work — ${blockers.filter(b => b.severity === 'critical').length} critical blockers.`;
    }
    return `${bucketLabel} at ${positionStr}${trendBadge}.`;
}

export default { runDoctorDiagnosis };
