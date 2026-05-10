// src/services/backlinkService.js
// TinyFish-based backlink discovery — finds external mentions and unlinked references.
// Lightweight wrapper that caches results in sessionStorage to conserve TinyFish quota.

import tinyfishService from './tinyfishService';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const OWN_DOMAIN = 'dataengineerhub.blog';

function cacheKey(slug, type) {
    return `backlink_${type}_${slug}`;
}

function getCached(slug, type) {
    if (typeof sessionStorage === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(cacheKey(slug, type));
        if (!raw) return null;
        const { data, savedAt } = JSON.parse(raw);
        if (Date.now() - savedAt > CACHE_TTL_MS) return null;
        return data;
    } catch {
        return null;
    }
}

function setCached(slug, type, data) {
    if (typeof sessionStorage === 'undefined') return;
    try {
        sessionStorage.setItem(cacheKey(slug, type), JSON.stringify({ data, savedAt: Date.now() }));
    } catch { /* quota exceeded */ }
}

/**
 * Find external pages that mention/link to a specific article URL.
 * @param {string} slug - Article slug
 * @param {string} title - Article title (for unlinked mention search)
 * @param {Object} options - Optional flags
 * @param {boolean} options.forceRefresh - Skip cache and fetch fresh results
 * @returns {Promise<Object>} { linkedMentions, unlinkedMentions, referringDomains, totalMentions }
 */
export async function findBacklinks(slug, title, options = {}) {
    const { forceRefresh = false } = options;

    if (!tinyfishService.isEnabled) {
        return {
            available: false,
            error: 'TinyFish API key not configured. Set it in the admin sidebar to enable backlink discovery.',
            linkedMentions: [],
            unlinkedMentions: [],
            referringDomains: [],
        };
    }

    // Check cache first (skip if force refresh)
    if (!forceRefresh) {
        const cached = getCached(slug, 'all');
        if (cached) return { ...cached, fromCache: true };
    }

    const articleUrl = `dataengineerhub.blog/articles/${slug}`;

    try {
        // Run two parallel searches
        const [linkedResults, unlinkedResults] = await Promise.all([
            // Search for the URL itself (likely linking pages)
            tinyfishService.search(`"${articleUrl}" -site:${OWN_DOMAIN}`).catch(() => ({ results: [] })),
            // Search for the title (mentions, may or may not link)
            title ? tinyfishService.search(`"${title}" -site:${OWN_DOMAIN}`).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
        ]);

        const linkedMentions = (linkedResults.results || []).slice(0, 10).map(r => ({
            url: r.url,
            domain: extractDomain(r.url),
            title: r.title,
            snippet: r.snippet,
            position: r.position,
            type: 'linked',
        }));

        // Filter out URLs already in linkedMentions to avoid duplicates
        const linkedUrls = new Set(linkedMentions.map(m => m.url));
        const unlinkedMentions = (unlinkedResults.results || [])
            .filter(r => !linkedUrls.has(r.url))
            .slice(0, 10)
            .map(r => ({
                url: r.url,
                domain: extractDomain(r.url),
                title: r.title,
                snippet: r.snippet,
                position: r.position,
                type: 'unlinked',
            }));

        // Compute unique referring domains
        const allDomains = new Set();
        [...linkedMentions, ...unlinkedMentions].forEach(m => {
            if (m.domain) allDomains.add(m.domain);
        });

        const result = {
            available: true,
            linkedMentions,
            unlinkedMentions,
            referringDomains: [...allDomains],
            totalMentions: linkedMentions.length + unlinkedMentions.length,
            domainCount: allDomains.size,
        };

        setCached(slug, 'all', result);
        return result;
    } catch (e) {
        return {
            available: true,
            error: e.message,
            linkedMentions: [],
            unlinkedMentions: [],
            referringDomains: [],
        };
    }
}

/**
 * Extract domain from a URL safely.
 */
function extractDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * Score backlink health (0-100).
 * Based on quantity and domain diversity.
 */
export function scoreBacklinks(backlinkData) {
    if (!backlinkData?.available || backlinkData.error) return null;
    let score = 0;
    const linkedCount = backlinkData.linkedMentions?.length || 0;
    const unlinkedCount = backlinkData.unlinkedMentions?.length || 0;
    const domainCount = backlinkData.domainCount || 0;

    // Linked mentions are most valuable
    if (linkedCount >= 5) score += 50;
    else if (linkedCount >= 3) score += 35;
    else if (linkedCount >= 1) score += 20;

    // Unlinked mentions = opportunity
    if (unlinkedCount >= 3) score += 25;
    else if (unlinkedCount >= 1) score += 12;

    // Domain diversity
    if (domainCount >= 5) score += 25;
    else if (domainCount >= 3) score += 15;
    else if (domainCount >= 1) score += 8;

    return Math.min(100, score);
}

export default { findBacklinks, scoreBacklinks };
