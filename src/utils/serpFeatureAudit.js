// src/utils/serpFeatureAudit.js
// Per-article audit of SERP-feature eligibility. Parses rendered HTML for:
//   - JSON-LD schema types (Article, FAQPage, HowTo, VideoObject, Review, BreadcrumbList)
//   - og:image, twitter:image
//   - Valid published/modified datetimes (ISO-8601 with timezone)
//
// Used by SerpCoveragePanel to build a gap matrix across the full catalog.

const SCHEMA_TYPES = ['Article', 'BlogPosting', 'FAQPage', 'HowTo', 'VideoObject', 'Review', 'BreadcrumbList'];

// Published CTR-lift benchmarks when a SERP feature is unlocked. Conservative.
export const SERP_FEATURE_LIFTS = {
    faq:        20,
    howto:      18,
    video:      15,
    review:     30,
    breadcrumb:  5,
    image:      15,
    article:     0, // prerequisite; no lift on its own
};

const parseSchemas = (doc) => {
    const found = new Set();
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(s => {
        try {
            const data = JSON.parse(s.textContent || '{}');
            const walk = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { node.forEach(walk); return; }
                const t = node['@type'];
                if (typeof t === 'string' && SCHEMA_TYPES.includes(t)) found.add(t);
                if (Array.isArray(t)) t.forEach(x => typeof x === 'string' && SCHEMA_TYPES.includes(x) && found.add(x));
                Object.values(node).forEach(walk);
            };
            walk(data);
        } catch { /* ignore malformed */ }
    });
    return found;
};

const isIsoWithTz = (s) => {
    if (typeof s !== 'string' || !s) return false;
    // ISO-8601 with Z or ±HH:MM
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(s.trim());
};

/**
 * Audit a single post's rendered HTML.
 * @param {string} html
 * @returns {object} { features: {faq, howto, video, review, breadcrumb, image, article}, missingLift: n, datesValid: bool }
 */
export const auditHtml = (html) => {
    if (typeof DOMParser === 'undefined') {
        return { features: {}, missingLift: 0, datesValid: false };
    }
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const schemas = parseSchemas(doc);

    const ogImage      = !!doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const twImage      = !!doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    const image        = ogImage || twImage;
    const article      = schemas.has('Article') || schemas.has('BlogPosting');
    const faq          = schemas.has('FAQPage');
    const howto        = schemas.has('HowTo');
    const video        = schemas.has('VideoObject');
    const review       = schemas.has('Review');
    const breadcrumb   = schemas.has('BreadcrumbList');

    const published    = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content');
    const modified     = doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content');
    const datesValid   = isIsoWithTz(published) && (!modified || isIsoWithTz(modified));

    const features = { article, faq, howto, video, review, breadcrumb, image };

    const missingLift = Object.entries(features)
        .filter(([, present]) => !present)
        .reduce((acc, [k]) => acc + (SERP_FEATURE_LIFTS[k] || 0), 0);

    return { features, missingLift, datesValid };
};

/**
 * Audit a single URL by fetching it and parsing the HTML. Same-origin only
 * (we're an admin tool on the same domain as the content).
 *
 * @param {string} url
 * @returns {Promise<object>} audit result + { url, ok, status }
 */
export const auditUrl = async (url) => {
    try {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) return { url, ok: false, status: res.status, features: {}, missingLift: 0, datesValid: false };
        const html = await res.text();
        const a = auditHtml(html);
        return { url, ok: true, status: res.status, ...a };
    } catch (e) {
        return { url, ok: false, status: 0, error: e?.message, features: {}, missingLift: 0, datesValid: false };
    }
};

/**
 * Batch audit with concurrency limit. Yields progress via onProgress(done, total).
 */
export const auditBatch = async (urls, { concurrency = 4, onProgress } = {}) => {
    const results = [];
    let done = 0;
    const queue = [...urls];
    const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
        while (queue.length) {
            const u = queue.shift();
            const r = await auditUrl(u);
            results.push(r);
            done += 1;
            if (onProgress) try { onProgress(done, urls.length); } catch { /* ignore */ }
        }
    });
    await Promise.all(runners);
    // Preserve input order
    const idx = new Map(urls.map((u, i) => [u, i]));
    results.sort((a, b) => (idx.get(a.url) ?? 0) - (idx.get(b.url) ?? 0));
    return results;
};
