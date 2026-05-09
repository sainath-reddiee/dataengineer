// src/services/keywordTrendService.js
// Detects rising keywords by comparing GSC data across time periods
// and optionally enriches with Google Trends data.
//
// Usage:
//   import keywordTrendService from '@/services/keywordTrendService';
//   const rising = await keywordTrendService.detectRisingKeywords();
//   const trends = await keywordTrendService.fetchGoogleTrends('snowflake interview questions');

import gscService from './gscService';

// Google Trends unofficial API (via CORS proxy for client-side usage)
const TRENDS_PROXY_BASE = 'https://trends.google.com/trends/api/dailytrends';

class KeywordTrendService {
    /**
     * Detect rising keywords by comparing recent GSC data vs previous period.
     * Returns keywords with significant impression growth (potential trending topics).
     *
     * @param {Object} options
     * @param {number} options.recentDays - Recent window size (default 7)
     * @param {number} options.baselineDays - Baseline window size (default 28)
     * @param {number} options.minImpressions - Minimum impressions in recent period (default 20)
     * @param {number} options.minGrowthRate - Minimum growth rate to qualify (default 0.3 = 30%)
     * @returns {Promise<Array>} Rising keywords sorted by growth rate
     */
    async detectRisingKeywords({
        recentDays = 7,
        baselineDays = 28,
        minImpressions = 20,
        minGrowthRate = 0.3,
    } = {}) {
        if (!gscService.isConnected()) {
            throw new Error('GSC not connected. Connect in Rank Intelligence first.');
        }

        const now = Date.now();
        const dayMs = 86400000;
        // GSC has ~3-day lag
        const lagDays = 3;

        // Recent period: last N days (minus lag)
        const recentEnd = new Date(now - lagDays * dayMs).toISOString().split('T')[0];
        const recentStart = new Date(now - (lagDays + recentDays) * dayMs).toISOString().split('T')[0];

        // Baseline period: the N days before the recent period
        const baselineEnd = recentStart;
        const baselineStart = new Date(now - (lagDays + recentDays + baselineDays) * dayMs).toISOString().split('T')[0];

        // Fetch both periods in parallel
        const [recentData, baselineData] = await Promise.all([
            gscService.queryTopKeywords({
                startDate: recentStart,
                endDate: recentEnd,
                rowLimit: 500,
            }),
            gscService.queryTopKeywords({
                startDate: baselineStart,
                endDate: baselineEnd,
                rowLimit: 500,
            }),
        ]);

        // Build baseline lookup (normalize per-day for fair comparison)
        const baselineMap = {};
        baselineData.forEach(row => {
            baselineMap[row.query] = {
                impressionsPerDay: row.impressions / baselineDays,
                clicks: row.clicks,
                position: row.position,
            };
        });

        // Identify rising keywords
        const rising = recentData
            .filter(row => row.impressions >= minImpressions)
            .map(row => {
                const baseline = baselineMap[row.query];
                const recentPerDay = row.impressions / recentDays;

                if (!baseline || baseline.impressionsPerDay === 0) {
                    // New keyword (not in baseline) — treat as 100% growth if enough impressions
                    return {
                        query: row.query,
                        recentImpressions: row.impressions,
                        recentPerDay: Math.round(recentPerDay * 10) / 10,
                        baselinePerDay: 0,
                        growthRate: baseline ? 0 : Infinity,
                        isNew: !baseline,
                        position: Math.round(row.position),
                        clicks: row.clicks,
                        ctr: row.ctr,
                    };
                }

                const growthRate = (recentPerDay - baseline.impressionsPerDay) / baseline.impressionsPerDay;
                return {
                    query: row.query,
                    recentImpressions: row.impressions,
                    recentPerDay: Math.round(recentPerDay * 10) / 10,
                    baselinePerDay: Math.round(baseline.impressionsPerDay * 10) / 10,
                    growthRate: Math.round(growthRate * 100) / 100,
                    isNew: false,
                    position: Math.round(row.position),
                    clicks: row.clicks,
                    ctr: row.ctr,
                };
            })
            .filter(row => row.isNew || row.growthRate >= minGrowthRate)
            .sort((a, b) => {
                // New keywords first, then by growth rate
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;
                return b.growthRate - a.growthRate;
            });

        return rising;
    }

    /**
     * Detect rising keywords for a specific article URL.
     *
     * @param {string} articleUrl - Full URL of the article
     * @param {Object} options - Same as detectRisingKeywords
     * @returns {Promise<Array>} Rising keywords for this specific article
     */
    async detectRisingForArticle(articleUrl, options = {}) {
        if (!gscService.isConnected()) {
            throw new Error('GSC not connected');
        }

        const { recentDays = 7, baselineDays = 28, minImpressions = 5, minGrowthRate = 0.3 } = options;

        const now = Date.now();
        const dayMs = 86400000;
        const lagDays = 3;

        const recentEnd = new Date(now - lagDays * dayMs).toISOString().split('T')[0];
        const recentStart = new Date(now - (lagDays + recentDays) * dayMs).toISOString().split('T')[0];
        const baselineEnd = recentStart;
        const baselineStart = new Date(now - (lagDays + recentDays + baselineDays) * dayMs).toISOString().split('T')[0];

        const [recentData, baselineData] = await Promise.all([
            gscService.queryTopKeywords({ startDate: recentStart, endDate: recentEnd, rowLimit: 100, url: articleUrl }),
            gscService.queryTopKeywords({ startDate: baselineStart, endDate: baselineEnd, rowLimit: 100, url: articleUrl }),
        ]);

        const baselineMap = {};
        baselineData.forEach(row => {
            baselineMap[row.query] = { impressionsPerDay: row.impressions / baselineDays };
        });

        return recentData
            .filter(row => row.impressions >= minImpressions)
            .map(row => {
                const baseline = baselineMap[row.query];
                const recentPerDay = row.impressions / recentDays;
                const basePerDay = baseline?.impressionsPerDay || 0;
                const growthRate = basePerDay === 0 ? (row.impressions > 10 ? Infinity : 0) : (recentPerDay - basePerDay) / basePerDay;

                return {
                    query: row.query,
                    recentImpressions: row.impressions,
                    growthRate: Math.round(growthRate * 100) / 100,
                    isNew: !baseline,
                    position: Math.round(row.position),
                    clicks: row.clicks,
                    ctr: row.ctr,
                };
            })
            .filter(row => row.isNew || row.growthRate >= minGrowthRate)
            .sort((a, b) => b.growthRate - a.growthRate);
    }

    /**
     * Fetch Google Trends interest-over-time data for a keyword.
     * Uses a CORS-friendly approach via the Google Trends explore widget API.
     *
     * @param {string} keyword - Search term to check
     * @param {string} geo - Country code (default 'US')
     * @param {string} timeframe - Time range (default 'today 3-m' for last 3 months)
     * @returns {Promise<Object>} { keyword, trend: 'rising'|'stable'|'declining', data: [...] }
     */
    async fetchGoogleTrends(keyword, geo = 'US', timeframe = 'today 3-m') {
        try {
            // Google Trends doesn't have an official API, so we use the explore endpoint
            // This requires a CORS proxy in production. For now, use the widget token approach.
            const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-330&req=${encodeURIComponent(JSON.stringify({
                comparisonItem: [{ keyword, geo, time: timeframe }],
                category: 0,
                property: '',
            }))}`;

            // In client-side environments, this will likely fail due to CORS.
            // Fall back to a classification based on GSC data trends instead.
            const response = await fetch(exploreUrl, { mode: 'cors' });

            if (!response.ok) {
                // CORS blocked — return null so callers know to use GSC-only data
                return null;
            }

            // Google Trends API returns a weird prefix ")]}'," before JSON
            const text = await response.text();
            const jsonStr = text.replace(/^\)\]\}',?\n/, '');
            const data = JSON.parse(jsonStr);

            return {
                keyword,
                available: true,
                widgets: data.widgets || [],
            };
        } catch {
            // Expected to fail in browser due to CORS — this is the fallback path
            return { keyword, available: false, reason: 'CORS_BLOCKED' };
        }
    }

    /**
     * Classify keyword trend direction using GSC data (CORS-safe fallback).
     * Compares recent vs baseline impression rates.
     *
     * @param {number} recentPerDay - Impressions per day in recent period
     * @param {number} baselinePerDay - Impressions per day in baseline period
     * @returns {'rising'|'stable'|'declining'|'new'}
     */
    classifyTrend(recentPerDay, baselinePerDay) {
        if (baselinePerDay === 0) return 'new';
        const growthRate = (recentPerDay - baselinePerDay) / baselinePerDay;
        if (growthRate >= 0.3) return 'rising';
        if (growthRate <= -0.3) return 'declining';
        return 'stable';
    }

    /**
     * Match rising keywords to articles that could target them.
     * Cross-references rising keywords against article content/titles.
     *
     * @param {Array} risingKeywords - Output from detectRisingKeywords()
     * @param {Array} articles - WordPress posts [{ slug, title, content, excerpt }]
     * @returns {Array} Matched opportunities [{ article, keyword, reason }]
     */
    matchKeywordsToArticles(risingKeywords, articles) {
        const opportunities = [];

        for (const kw of risingKeywords) {
            const kwLower = kw.query.toLowerCase();
            const kwWords = kwLower.split(/\s+/);

            for (const article of articles) {
                const titleLower = (article.title || '').toLowerCase();
                const contentLower = (article.content || article.excerpt || '').toLowerCase().substring(0, 5000);

                // Check if article is relevant to this keyword
                const titleMatch = kwWords.some(w => titleLower.includes(w));
                const contentMatch = kwLower.length > 3 && contentLower.includes(kwLower);
                const partialContentMatch = kwWords.filter(w => w.length > 3 && contentLower.includes(w)).length >= 2;

                if (contentMatch || (titleMatch && partialContentMatch)) {
                    const inTitle = titleLower.includes(kwLower);
                    const inContent = contentLower.includes(kwLower);

                    opportunities.push({
                        article: { slug: article.slug, title: article.title },
                        keyword: kw,
                        inTitle,
                        inContent,
                        action: !inTitle && !inContent
                            ? 'inject'       // Keyword is relevant but not present — add it
                            : !inTitle
                                ? 'promote'  // In content but not title — consider adding to title
                                : 'boost',   // Already present — consider making it more prominent
                    });
                }
            }
        }

        // Sort: inject opportunities first (most value), then by growth rate
        return opportunities.sort((a, b) => {
            const actionOrder = { inject: 0, promote: 1, boost: 2 };
            const aDiff = actionOrder[a.action] - actionOrder[b.action];
            if (aDiff !== 0) return aDiff;
            return b.keyword.growthRate - a.keyword.growthRate;
        });
    }
}

export const keywordTrendService = new KeywordTrendService();
export default keywordTrendService;
