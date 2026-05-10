// src/utils/positionBlockers.js
// Position-specific blocker detection — different recommendations based on actual GSC position.
// What it takes to push from #11 to page 1 is very different from what it takes to push #50 to page 2.

/**
 * Get position bucket for an article.
 * @param {number} position - Average GSC position
 * @returns {string} bucket: 'top3' | 'page1' | 'striking' | 'page3' | 'unranked'
 */
export function getPositionBucket(position) {
    if (!position || position <= 0) return 'unranked';
    if (position <= 3) return 'top3';
    if (position <= 10) return 'page1';
    if (position <= 20) return 'striking'; // Top of page 2 — striking distance
    if (position <= 50) return 'page3';
    return 'unranked';
}

const BUCKET_LABELS = {
    top3: 'Top 3',
    page1: 'Page 1',
    striking: 'Striking Distance (Page 2)',
    page3: 'Page 3+',
    unranked: 'Unranked',
};

/**
 * Detect blockers preventing an article from moving up.
 * Returns an array of blockers ranked by impact (highest first).
 * Each blocker has: { severity, category, text, fix, lift (estimated position gain), tool, slug }
 *
 * @param {Object} ctx - Context object with all signals
 * @param {Object} ctx.article - { slug, title, position, ctr, impressions, clicks }
 * @param {Object} ctx.linkMetrics - From analyzeArticleLinks()
 * @param {number} ctx.contentScore - Content quality score (0-100)
 * @param {number} ctx.aiVisScore - AI visibility score (0-100)
 * @param {number} ctx.ctrScore - CTR optimization score (0-100)
 * @param {Array} ctx.gscKeywords - GSC keywords for this article
 * @param {number} ctx.expectedCtr - Expected CTR for this position
 * @param {Array} ctx.cannibalizedKeywords - Keywords this article competes with itself on
 * @param {Object} ctx.competitorGap - Gap analysis vs #1 result
 * @returns {Array} blockers
 */
export function detectBlockers(ctx) {
    const blockers = [];
    const { article, linkMetrics, contentScore, aiVisScore, ctrScore, gscKeywords = [], expectedCtr, cannibalizedKeywords = [], competitorGap } = ctx;
    const bucket = getPositionBucket(article?.position);
    const wordCount = ctx.wordCount || 0;

    // ─── Universal blockers (apply at every position) ───────────

    if (linkMetrics?.isOrphan) {
        blockers.push({
            severity: 'critical',
            category: 'links',
            text: 'Orphan page — no other articles link to this',
            fix: 'Add 3-5 inbound links from related articles. Search engines deprioritize orphan pages heavily.',
            lift: bucket === 'unranked' ? 25 : bucket === 'page3' ? 15 : 8,
            tool: 'Smart Linking',
            link: `/admin/smart-linking?slug=${article?.slug}`,
        });
    }

    if (linkMetrics && linkMetrics.authorityLinks < 2) {
        blockers.push({
            severity: 'high',
            category: 'authority',
            text: `Only ${linkMetrics.authorityLinks} authority outbound link(s)`,
            fix: 'Add 2-3 links to official docs (docs.snowflake.com, docs.aws.amazon.com, github.com). Critical for E-E-A-T and GEO citations.',
            lift: 5,
            tool: 'Article Fixer',
            link: `/admin/article-fixer`,
        });
    }

    if (cannibalizedKeywords.length > 0) {
        blockers.push({
            severity: 'critical',
            category: 'cannibalization',
            text: `Cannibalization: ${cannibalizedKeywords.length} keyword(s) split between multiple articles`,
            fix: `Choose primary article for: ${cannibalizedKeywords.slice(0, 3).join(', ')}. Update other articles to support, not compete.`,
            lift: 12,
            tool: 'Cannibalization',
            link: `/admin/cannibalization`,
        });
    }

    // ─── Position-specific blockers ───────────────────────────

    if (bucket === 'top3') {
        // At top 3 — focus on holding position + getting featured snippet
        if (aiVisScore < 70) {
            blockers.push({
                severity: 'medium',
                category: 'aeo',
                text: 'Not optimized for Featured Snippet capture',
                fix: 'Add direct definition paragraphs (40-60 words after H2 questions), comparison tables, and step-by-step lists.',
                lift: 0, // not a position lift, but snippet ownership
                tool: 'Snippet Optimizer',
                link: `/admin/snippet-optimizer?slug=${article?.slug}`,
            });
        }
        if (article?.ctr < expectedCtr * 0.8) {
            blockers.push({
                severity: 'high',
                category: 'ctr',
                text: `CTR (${(article.ctr * 100).toFixed(1)}%) below expected (${(expectedCtr * 100).toFixed(1)}%)`,
                fix: 'You\'re ranking but not getting clicks. Rewrite title with stronger hook, year, or numbers.',
                lift: 0,
                tool: 'CTR Fixer',
                link: `/admin/ctr-fixer?slug=${article?.slug}`,
            });
        }
    }

    if (bucket === 'page1') {
        // Position 4-10 — push to top 3
        if (linkMetrics && linkMetrics.inboundCount < 5) {
            blockers.push({
                severity: 'high',
                category: 'links',
                text: `Only ${linkMetrics.inboundCount} inbound link(s) — top-3 results typically have 5+`,
                fix: 'Add 3-5 more inbound links from your highest-authority articles.',
                lift: 3,
                tool: 'Smart Linking',
                link: `/admin/smart-linking?slug=${article?.slug}`,
            });
        }
        if (contentScore < 70) {
            blockers.push({
                severity: 'high',
                category: 'content',
                text: `Content quality score ${contentScore}/100 — needs depth`,
                fix: 'Expand thin sections, add more code examples, statistics, and FAQs.',
                lift: 4,
                tool: 'Content Optimizer',
                link: `/admin/content-optimizer?slug=${article?.slug}`,
            });
        }
        if (competitorGap?.wordCountGap > 500) {
            blockers.push({
                severity: 'high',
                category: 'content',
                text: `${competitorGap.wordCountGap} words behind #1 result`,
                fix: `Add ~${competitorGap.wordCountGap} words. The #1 ranks ${competitorGap.competitorWordCount} words; you have ${competitorGap.yourWordCount}.`,
                lift: 3,
                tool: 'Article Writer',
                link: `/admin/article-writer?topic=${encodeURIComponent(article?.title || '')}`,
            });
        }
    }

    if (bucket === 'striking') {
        // Position 11-20 — striking distance, push to page 1
        if (linkMetrics && linkMetrics.inboundCount < 3) {
            blockers.push({
                severity: 'critical',
                category: 'links',
                text: `Only ${linkMetrics.inboundCount} inbound link(s) — striking distance needs 3+`,
                fix: 'Build a content cluster: add 3 inbound contextual links from related articles.',
                lift: 7,
                tool: 'Smart Linking',
                link: `/admin/smart-linking?slug=${article?.slug}`,
            });
        }
        if (wordCount < 1500) {
            blockers.push({
                severity: 'critical',
                category: 'content',
                text: `Content too thin (${wordCount} words) for competitive keywords`,
                fix: 'Expand to 2000+ words. Page-1 results typically have 1800-3000 words for competitive terms.',
                lift: 6,
                tool: 'Article Writer',
                link: `/admin/article-writer?topic=${encodeURIComponent(article?.title || '')}`,
            });
        }
        if (aiVisScore < 60) {
            blockers.push({
                severity: 'high',
                category: 'aeo',
                text: 'No FAQ section or structured data',
                fix: 'Add 5-6 FAQ Q&A pairs targeting question keywords. Add FAQ schema.',
                lift: 4,
                tool: 'PAA Optimizer',
                link: `/admin/paa-optimizer?slug=${article?.slug}`,
            });
        }
        if (ctrScore < 60) {
            blockers.push({
                severity: 'medium',
                category: 'ctr',
                text: `Title CTR score ${ctrScore}/100 — won't stand out on page 2`,
                fix: 'Rewrite title with year, number, or power word. Add compelling meta description.',
                lift: 2,
                tool: 'CTR Fixer',
                link: `/admin/ctr-fixer?slug=${article?.slug}`,
            });
        }
    }

    if (bucket === 'page3') {
        // Position 21-50 — needs major work
        if (wordCount < 1500) {
            blockers.push({
                severity: 'critical',
                category: 'content',
                text: `Thin content (${wordCount} words) — major issue at this position`,
                fix: 'Rewrite as comprehensive 2500+ word guide. This is THE biggest blocker at page 3.',
                lift: 10,
                tool: 'Article Writer',
                link: `/admin/article-writer?topic=${encodeURIComponent(article?.title || '')}`,
            });
        }
        if (linkMetrics && linkMetrics.inboundCount < 2) {
            blockers.push({
                severity: 'critical',
                category: 'links',
                text: 'Almost no internal link equity',
                fix: 'Build a hub: link to this from your 5 most-trafficked related articles.',
                lift: 8,
                tool: 'Smart Linking',
                link: `/admin/smart-linking?slug=${article?.slug}`,
            });
        }
        blockers.push({
            severity: 'high',
            category: 'backlinks',
            text: 'Likely zero or very few external backlinks',
            fix: 'Find unlinked mentions and reach out. Pitch to industry blogs/newsletters.',
            lift: 7,
            tool: 'Backlink Discovery',
            link: `/admin/article-optimizer?slug=${article?.slug}`,
        });
        if (aiVisScore < 50) {
            blockers.push({
                severity: 'high',
                category: 'geo',
                text: 'Content not optimized for AI engines (low GEO score)',
                fix: 'Add TL;DR, statistics with sources, "Last Updated" date, more authority citations.',
                lift: 4,
                tool: 'Content Optimizer',
                link: `/admin/content-optimizer?slug=${article?.slug}`,
            });
        }
    }

    if (bucket === 'unranked') {
        blockers.push({
            severity: 'critical',
            category: 'visibility',
            text: 'Article not ranking in top 50 for tracked queries',
            fix: 'Check intent match: does Google show guides, tools, or listicles for this query? Make sure your format matches.',
            lift: 0,
            tool: 'SERP Intelligence',
            link: `/admin/serp-intelligence`,
        });
        if (wordCount < 1000) {
            blockers.push({
                severity: 'critical',
                category: 'content',
                text: `Very thin (${wordCount} words) — Google may be ignoring it`,
                fix: 'Rewrite at 2000+ words with deep, original analysis. Include code, tables, FAQs.',
                lift: 0,
                tool: 'Article Writer',
                link: `/admin/article-writer?topic=${encodeURIComponent(article?.title || '')}`,
            });
        }
    }

    // ─── Universal final checks ──────────────────────────────

    if (linkMetrics && linkMetrics.internalOutbound < 3) {
        blockers.push({
            severity: 'medium',
            category: 'links',
            text: `Only ${linkMetrics.internalOutbound} internal outbound links`,
            fix: 'Add 3-5 contextual links to related articles to distribute PageRank within your site.',
            lift: 2,
            tool: 'Smart Linking',
            link: `/admin/smart-linking?slug=${article?.slug}`,
        });
    }

    // Sort by severity then lift
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    blockers.sort((a, b) => {
        const sevDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
        if (sevDiff !== 0) return sevDiff;
        return (b.lift || 0) - (a.lift || 0);
    });

    return blockers;
}

export { BUCKET_LABELS };
