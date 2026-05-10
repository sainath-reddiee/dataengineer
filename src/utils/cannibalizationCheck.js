// src/utils/cannibalizationCheck.js
// Detect keyword cannibalization — when 2+ articles compete for the same query.
// Splits authority and confuses Google's relevance signals.

/**
 * Build a keyword → articles map from GSC keyword data.
 * Detects keywords where multiple articles have meaningful impressions.
 *
 * @param {Map<string, Array>} keywordsBySlug - Map of slug → array of {query, impressions, clicks, position}
 * @returns {Object} { conflicts, byArticle }
 */
export function detectCannibalization(keywordsBySlug) {
    const keywordMap = new Map(); // keyword → [{slug, position, impressions, clicks}]

    keywordsBySlug.forEach((keywords, slug) => {
        if (!Array.isArray(keywords)) return;
        keywords.forEach(kw => {
            const query = (kw.query || '').toLowerCase().trim();
            if (!query || query.length < 4) return;
            if (!keywordMap.has(query)) keywordMap.set(query, []);
            keywordMap.get(query).push({
                slug,
                position: kw.position,
                impressions: kw.impressions,
                clicks: kw.clicks,
            });
        });
    });

    const conflicts = []; // [{query, articles: [...]}]
    const byArticle = {}; // slug → [{query, competitors}]

    keywordMap.forEach((articles, query) => {
        // Only flag if 2+ articles have meaningful impressions on same query
        const meaningful = articles.filter(a => (a.impressions || 0) >= 5);
        if (meaningful.length < 2) return;

        // Sort by best position (lowest)
        meaningful.sort((a, b) => (a.position || 999) - (b.position || 999));
        const primary = meaningful[0];
        const competitors = meaningful.slice(1);

        conflicts.push({
            query,
            primary,
            competitors,
            totalImpressions: meaningful.reduce((sum, a) => sum + (a.impressions || 0), 0),
        });

        meaningful.forEach(a => {
            if (!byArticle[a.slug]) byArticle[a.slug] = [];
            byArticle[a.slug].push({
                query,
                isPrimary: a.slug === primary.slug,
                yourPosition: a.position,
                competingArticles: meaningful.filter(x => x.slug !== a.slug).map(x => x.slug),
            });
        });
    });

    // Sort conflicts by total impressions (most impactful first)
    conflicts.sort((a, b) => b.totalImpressions - a.totalImpressions);

    return {
        conflicts,
        byArticle,
        conflictCount: conflicts.length,
    };
}

/**
 * Get cannibalized keywords for a specific article.
 * @param {string} slug
 * @param {Object} cannibalizationData - Result from detectCannibalization()
 * @returns {Array<string>} cannibalized keywords
 */
export function getCannibalizedKeywords(slug, cannibalizationData) {
    if (!cannibalizationData?.byArticle?.[slug]) return [];
    return cannibalizationData.byArticle[slug].map(c => c.query);
}

export default { detectCannibalization, getCannibalizedKeywords };
