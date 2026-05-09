// src/services/competitorAnalyzer.js
// Fetches competitor articles via TinyFish Fetch (real browser) or CORS proxy fallback,
// then uses AI to produce structured gap analysis against one of YOUR articles.

import aiService from './aiService';
import tinyfishService from './tinyfishService';

const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

const FETCH_TIMEOUT_MS = 25000;

// Short-TTL in-memory cache so re-running gap analysis on the same competitor
// within a session doesn't re-fetch + re-parse from scratch.
const FETCH_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

async function timedFetch(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

async function fetchWithProxy(url) {
    for (const proxy of CORS_PROXIES) {
        try {
            const resp = await timedFetch(`${proxy}${encodeURIComponent(url)}`);
            if (resp.ok) {
                const html = await resp.text();
                if (html && html.length > 100) return html;
            }
        } catch { /* try next */ }
    }
    throw new Error('All CORS proxies failed. The competitor site may be blocking automated access.');
}

/**
 * Fetch competitor page HTML — tries TinyFish first (real browser), falls back to CORS proxies.
 */
async function fetchCompetitorPage(url) {
    // Cache hit
    const cached = FETCH_CACHE.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.html;
    }
    // Prefer TinyFish Fetch API (uses real browser, handles SPAs and JS rendering)
    if (tinyfishService.isEnabled) {
        try {
            const result = await tinyfishService.fetchContent([url], { format: 'html', links: true });
            const page = result.results?.[0];
            if (page?.text && page.text.length > 100) {
                FETCH_CACHE.set(url, { html: page.text, ts: Date.now() });
                return page.text;
            }
        } catch { /* fall through to CORS proxies */ }
    }
    const html = await fetchWithProxy(url);
    FETCH_CACHE.set(url, { html, ts: Date.now() });
    return html;
}

/**
 * Extract key structural elements from an already-parsed Document.
 */
function extractStructureFromDoc(doc) {
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.content || '';

    const h1 = Array.from(doc.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean);
    const h2 = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent.trim()).filter(Boolean);
    const h3 = Array.from(doc.querySelectorAll('h3')).map(h => h.textContent.trim()).filter(Boolean);

    // Word count from main content area (fallback to body)
    const main = doc.querySelector('main, article, [role="main"]') || doc.body;
    const text = main?.textContent || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    const images = doc.querySelectorAll('img').length;
    const tables = doc.querySelectorAll('table').length;
    const codeBlocks = doc.querySelectorAll('pre, code').length;

    // Schema types
    const schemas = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => {
            try {
                const parsed = JSON.parse(s.textContent);
                return parsed['@type'] || (Array.isArray(parsed) ? parsed[0]?.['@type'] : null);
            } catch { return null; }
        })
        .filter(Boolean);

    const internalLinks = Array.from(doc.querySelectorAll('a[href]')).filter(a => {
        const href = a.getAttribute('href') || '';
        return href.startsWith('/') || href.startsWith('#');
    }).length;

    const externalLinks = Array.from(doc.querySelectorAll('a[href^="http"]')).length;

    return {
        title,
        metaDesc,
        h1Count: h1.length,
        h2: h2.slice(0, 30),
        h3: h3.slice(0, 30),
        wordCount,
        images,
        tables,
        codeBlocks,
        schemas: [...new Set(schemas)],
        internalLinks,
        externalLinks,
    };
}

/**
 * Extract key structural elements from HTML string (competitor page).
 */
function extractStructure(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return extractStructureFromDoc(doc);
}

/**
 * Analyze a competitor URL vs your article.
 * Returns { competitor, yours, aiGapAnalysis }
 */
export async function analyzeCompetitorGap(competitorUrl, yourArticle) {
    if (!aiService.isEnabled) {
        throw new Error('AI API key required. Set it in the admin sidebar.');
    }

    // 1. Fetch competitor
    const competitorHtml = await fetchCompetitorPage(competitorUrl);
    const competitorStructure = extractStructure(competitorHtml);

    // 2. Extract structure from your article — build DOM programmatically
    // to avoid HTML injection from unescaped quotes in excerpt/title/content.
    const yourDoc = new DOMParser().parseFromString(
        '<!DOCTYPE html><html><head></head><body></body></html>',
        'text/html'
    );
    const titleEl = yourDoc.createElement('title');
    titleEl.textContent = yourArticle.title || '';
    yourDoc.head.appendChild(titleEl);
    const metaEl = yourDoc.createElement('meta');
    metaEl.setAttribute('name', 'description');
    metaEl.setAttribute('content', yourArticle.excerpt || '');
    yourDoc.head.appendChild(metaEl);
    yourDoc.body.innerHTML = yourArticle.content || '';
    const yourStructure = extractStructureFromDoc(yourDoc);

    // 3. Build a comparison prompt for Gemini
    const prompt = `I'm comparing my data engineering blog article to a competitor article on the same topic. Give me actionable gaps.

MY ARTICLE:
Title: ${yourArticle.title}
H2 sections: ${yourStructure.h2.slice(0, 20).join(' | ')}
Word count: ${yourStructure.wordCount}

COMPETITOR ARTICLE:
URL: ${competitorUrl}
Title: ${competitorStructure.title}
H2 sections: ${competitorStructure.h2.slice(0, 20).join(' | ')}
Word count: ${competitorStructure.wordCount}

Respond with 3 sections:

1. **TOPICS THEY COVER THAT I DON'T** (bullet list of 3-5 concrete topics based on their H2 sections that mine lacks)
2. **DEPTH GAPS ON SHARED TOPICS** (2-3 bullets on where they go deeper on common topics)
3. **SPECIFIC ADDITIONS TO MAKE** (3-5 actionable recommendations like "Add a section on X covering Y, Z" — not generic advice)

Be direct and specific. No fluff.`;

        const aiGapAnalysis = await aiService.generateSuggestion(prompt, '');

    return {
        competitor: { url: competitorUrl, ...competitorStructure },
        yours: { slug: yourArticle.slug, ...yourStructure },
        aiGapAnalysis,
    };
}
