// src/utils/rankIntelligence.js
// Unified scoring engine that combines SEO, AEO, CTR, AI visibility,
// engagement, and freshness signals into a single "article health" score
// with actionable bottleneck identification.
//
// All scoring uses FREE signals — no external API required.

import { scoreCtr } from './ctrScorer';

const VIEW_STORAGE_KEY = 'deh_views';

/**
 * Read local view counts (populated by usePopularity hook on article page visits).
 */
function getStoredViews() {
    if (typeof localStorage === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

/**
 * Score a single article across all SEO/AEO/CTR/AI pillars.
 * @param {Object} post - WordPress post object { slug, title, excerpt, content, date, modified, views }
 * @param {Object} options - { engagement, aiReferrals, rankData }
 * @returns {Object} RankIntelligence result
 */
export function scoreArticle(post, options = {}) {
    const { engagement = null, aiReferrals = null, rankData = null } = options;

    const content = post.content || '';
    const title = post.title || '';
    const excerpt = post.excerpt || '';

    // ── Pillar 1: SEO (content structure) ────────────────────
    const seo = scoreSEO(post, content);

    // ── Pillar 2: AEO (AI/Answer Engine) ─────────────────────
    const aeo = scoreAEO(content);

    // ── Pillar 3: CTR (title + meta quality) ─────────────────
    const ctrResult = scoreCtr({ title, description: excerpt });
    const ctr = ctrResult.score;

    // ── Pillar 4: AI Visibility ──────────────────────────────
    const ai = scoreAI(content);

    // ── Pillar 5: Engagement ─────────────────────────────────
    const engagementScore = scoreEngagement(post.slug, engagement);

    // ── Pillar 6: Freshness ──────────────────────────────────
    const freshness = scoreFreshness(post.modified || post.date);

    const pillarScores = { seo, aeo, ctr, ai, engagement: engagementScore, freshness };

    // ── Weighted overall health score ────────────────────────
    const weights = { seo: 0.25, aeo: 0.15, ctr: 0.20, ai: 0.10, engagement: 0.15, freshness: 0.15 };
    const articleHealth = Math.round(
        Object.entries(pillarScores).reduce((sum, [k, v]) => sum + v * weights[k], 0)
    );

    // ── Bottleneck: weakest pillar with meaningful weight ────
    const weightedScores = Object.entries(pillarScores)
        .map(([k, v]) => ({ pillar: k, score: v, weighted: v * weights[k] }))
        .sort((a, b) => a.weighted - b.weighted);
    const bottleneck = weightedScores[0].pillar;

    // ── Rank estimate based on health + actual rank data ─────
    let rankEstimate;
    const currentPosition = rankData?.currentPosition;
    if (currentPosition) {
        if (currentPosition <= 10) rankEstimate = 'Page 1';
        else if (currentPosition <= 20) rankEstimate = 'Page 2';
        else if (currentPosition <= 100) rankEstimate = `Page ${Math.ceil(currentPosition / 10)}`;
        else rankEstimate = 'Not ranking';
    } else {
        // Estimate from health score
        if (articleHealth >= 80) rankEstimate = 'Page 1 likely';
        else if (articleHealth >= 65) rankEstimate = 'Page 2 likely';
        else if (articleHealth >= 50) rankEstimate = 'Page 3-5 likely';
        else rankEstimate = 'Not ranking yet';
    }

    // Rank potential = how close to page 1 they could get with improvements
    const rankPotential = Math.min(100, articleHealth + (100 - articleHealth) * 0.6);

    // ── Top actions to fix the bottleneck ────────────────────
    const topActions = generateActions(pillarScores, post, ctrResult);

    // ── Revenue projection ───────────────────────────────────
    const revenueProjection = projectRevenue(post, articleHealth, engagementScore);

    return {
        articleHealth,
        rankPotential: Math.round(rankPotential),
        pillarScores,
        bottleneck,
        topActions,
        revenueProjection,
        rankEstimate,
        currentPosition: currentPosition || null,
    };
}

/**
 * Batch score all articles.
 * Note: `options.rankData` is expected to be a dictionary keyed by slug
 * (as returned by getAllRanks()). This function extracts the per-article
 * rank record before passing it down to scoreArticle().
 */
export function scoreArticlesBatch(posts, options = {}) {
    const { rankData: rankStore, ...restOpts } = options;
    return posts.map(p => {
        const perArticleRank = rankStore && typeof rankStore === 'object'
            ? (rankStore[p.slug] || null)
            : null;
        return {
            slug: p.slug,
            title: p.title,
            ...scoreArticle(p, { ...restOpts, rankData: perArticleRank }),
        };
    }).sort((a, b) => a.articleHealth - b.articleHealth); // worst first = biggest opportunities
}

// ─── Individual Pillar Scorers ──────────────────────────────────

function scoreSEO(post, content) {
    let score = 0;
    const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
    const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
    const altTextCount = (content.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;
    const internalLinks = (content.match(/href=["'](?:https?:\/\/(?:www\.)?dataengineerhub\.blog)?\/articles\//gi) || []).length;
    const externalLinks = (content.match(/href=["']https?:\/\//gi) || []).length - internalLinks;

    // Word count (25 pts)
    if (wordCount >= 1500) score += 25;
    else if (wordCount >= 1000) score += 20;
    else if (wordCount >= 800) score += 15;
    else if (wordCount >= 500) score += 8;

    // Heading structure (20 pts)
    if (h2Count >= 3) score += 15;
    else if (h2Count >= 1) score += 8;
    if (h3Count >= 2) score += 5;

    // Images with alt text (15 pts)
    if (imageCount > 0) {
        const altRatio = altTextCount / imageCount;
        score += Math.round(15 * altRatio);
    } else if (wordCount < 800) {
        score += 10; // short articles may not need images
    }

    // Internal links (15 pts)
    if (internalLinks >= 3) score += 15;
    else if (internalLinks >= 1) score += 8;

    // External authority links (10 pts)
    if (externalLinks >= 3) score += 10;
    else if (externalLinks >= 1) score += 5;

    // Title includes keyword/year (15 pts)
    if (/\b(20(2[4-9]|3\d))\b/.test(post.title || '')) score += 8;
    if ((post.title || '').length >= 50 && (post.title || '').length <= 60) score += 7;

    return Math.min(100, score);
}

function scoreAEO(content) {
    let score = 0;
    const hasTLDR = /(?:TL;?DR|Summary|Key Takeaways?)[:;.\s]/i.test(content);
    const questionHeadings = (content.match(/<h[23][^>]*>[^<]*\?[^<]*<\/h[23]>/gi) || []).length;
    const hasTable = /<table/i.test(content);
    const hasCode = /<pre|<code/i.test(content);
    const lists = (content.match(/<(ul|ol)[^>]*>/gi) || []).length;

    if (hasTLDR) score += 25;
    score += Math.min(30, questionHeadings * 10);
    if (hasTable) score += 15;
    if (hasCode) score += 10;
    score += Math.min(20, lists * 5);

    return Math.min(100, score);
}

function scoreAI(content) {
    let score = 50; // baseline
    const stats = content.match(/\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)/gi) || [];
    const questionHeadings = (content.match(/<h[23][^>]*>[^<]*\?/gi) || []).length;
    const hasAuthorityLinks = /href=["'][^"']*(docs\.snowflake|aws\.amazon|cloud\.google|github\.com|wikipedia)/i.test(content);
    const hasFAQ = /\b(FAQ|Frequently Asked)\b/i.test(content);

    if (stats.length >= 3) score += 15;
    if (questionHeadings >= 3) score += 15;
    if (hasAuthorityLinks) score += 10;
    if (hasFAQ) score += 10;

    return Math.min(100, score);
}

function scoreEngagement(slug, engagementData) {
    if (!engagementData || !engagementData.byEntry) return 50; // neutral baseline

    const articlePath = `/articles/${slug}`;
    const entry = engagementData.byEntry[articlePath];
    if (!entry || entry.landings === 0) return 50;

    let score = 50;
    const clickThroughRate = (entry.secondClicks / entry.landings) * 100;
    const avgScrollDepth = entry.landingsWithScroll > 0 ? (entry.scrollSum / entry.landingsWithScroll) : 0;

    if (clickThroughRate >= 30) score += 25;
    else if (clickThroughRate >= 15) score += 15;
    else if (clickThroughRate >= 5) score += 5;

    if (avgScrollDepth >= 75) score += 25;
    else if (avgScrollDepth >= 50) score += 15;
    else if (avgScrollDepth >= 25) score += 5;

    return Math.min(100, score);
}

function scoreFreshness(dateStr) {
    if (!dateStr) return 0;
    const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);

    if (days <= 30) return 100;
    if (days <= 60) return 85;
    if (days <= 90) return 70;
    if (days <= 180) return 50;
    if (days <= 365) return 30;
    return 15;
}

// ─── Action Generator ───────────────────────────────────────────

function generateActions(pillarScores, post, ctrResult) {
    const actions = [];

    // Pillar-weighted action suggestions (biggest impact first)
    if (pillarScores.ctr < 70) {
        actions.push({
            priority: 'HIGH',
            category: 'CTR',
            action: 'Rewrite title and meta description (use CTR Lab)',
            projectedLift: `+${Math.round((70 - pillarScores.ctr) * 0.5)}% clicks`,
            link: '/admin/ctr-lab',
        });
    }

    if (pillarScores.freshness < 50) {
        actions.push({
            priority: 'HIGH',
            category: 'Freshness',
            action: `Update article — last modified ${Math.round((100 - pillarScores.freshness) * 3)} days ago`,
            projectedLift: '+15-25% rank signal',
            link: `https://app.dataengineerhub.blog/wp-admin/post.php?post=${post.id}&action=edit`,
        });
    }

    if (pillarScores.seo < 60) {
        actions.push({
            priority: 'HIGH',
            category: 'SEO',
            action: 'Expand content, add H2/H3 headings, internal links',
            projectedLift: `+${Math.round((60 - pillarScores.seo) * 0.4)}% rank potential`,
            link: `/admin/scanner?url=https://dataengineerhub.blog/articles/${post.slug}`,
        });
    }

    if (pillarScores.aeo < 60) {
        actions.push({
            priority: 'MEDIUM',
            category: 'AEO',
            action: 'Add FAQ section, TL;DR summary, and question-based headings',
            projectedLift: '+30% AI citation rate',
            link: `/admin/content-optimizer`,
        });
    }

    if (pillarScores.ai < 70) {
        actions.push({
            priority: 'MEDIUM',
            category: 'AI Visibility',
            action: 'Add statistics, authority links, and structured data',
            projectedLift: '+20% ChatGPT/Perplexity citations',
            link: `/admin/ai-suite`,
        });
    }

    if (pillarScores.engagement < 50 && pillarScores.engagement > 0) {
        actions.push({
            priority: 'LOW',
            category: 'Engagement',
            action: 'Add more internal links and improve content flow',
            projectedLift: '+10% time-on-page',
            link: `/admin/internal-links`,
        });
    }

    return actions.slice(0, 5); // top 5 actions
}

// ─── Revenue Projection ─────────────────────────────────────────

function projectRevenue(post, articleHealth, engagementScore) {
    // Conservative tech-blog RPM (revenue per 1000 pageviews): $3
    const RPM = 3;

    // Try to get real local view count first; fall back to age-based estimate.
    const storedViews = getStoredViews();
    let monthlyViews = storedViews[post.slug] || 0;

    // If no local data, estimate based on article age + health.
    // Formula: healthy recent articles get 50-200 monthly views as a baseline.
    if (monthlyViews === 0) {
        const ageInDays = post.date ? Math.max(1, (Date.now() - new Date(post.date).getTime()) / (1000 * 60 * 60 * 24)) : 90;
        const ageMultiplier = Math.min(1, ageInDays / 30); // ramp up over first month
        monthlyViews = Math.round((articleHealth / 2) * ageMultiplier);
    }

    const currentMonthly = (monthlyViews * RPM) / 1000;

    // Potential: if article hits page 1 (top 10), assume multiplier based on current health.
    // Higher health = already close to page 1, so less uplift. Lower health = huge potential.
    const trafficMultiplier = articleHealth >= 80 ? 1.5 : articleHealth >= 60 ? 4.0 : 10.0;
    const potentialMonthly = currentMonthly * trafficMultiplier;

    return {
        currentMonthly: Math.round(currentMonthly * 100) / 100,
        potentialMonthly: Math.round(potentialMonthly * 100) / 100,
        uplift: Math.round(trafficMultiplier * 10) / 10,
        monthlyViews, // expose for debugging
    };
}
