// src/services/competitorAnalyzer.js
// Fetches competitor articles via CORS proxy and uses Gemini to produce
// structured gap analysis against one of YOUR articles.

import geminiService from './geminiService';

const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

async function fetchWithProxy(url) {
    for (const proxy of CORS_PROXIES) {
        try {
            const resp = await fetch(`${proxy}${encodeURIComponent(url)}`);
            if (resp.ok) {
                const html = await resp.text();
                if (html && html.length > 100) return html;
            }
        } catch { /* try next */ }
    }
    throw new Error('All CORS proxies failed. The competitor site may be blocking automated access.');
}

/**
 * Extract key structural elements from HTML for comparison.
 */
function extractStructure(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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
 * Analyze a competitor URL vs your article.
 * Returns { competitor, yours, aiGapAnalysis }
 */
export async function analyzeCompetitorGap(competitorUrl, yourArticle) {
    if (!geminiService.isEnabled) {
        throw new Error('Gemini API key required. Set it in the admin sidebar.');
    }

    // 1. Fetch competitor
    const competitorHtml = await fetchWithProxy(competitorUrl);
    const competitorStructure = extractStructure(competitorHtml);

    // 2. Extract structure from your article (use its content directly)
    const yourSyntheticHtml = `<!DOCTYPE html><html><head><title>${yourArticle.title}</title><meta name="description" content="${yourArticle.excerpt || ''}"></head><body>${yourArticle.content || ''}</body></html>`;
    const yourStructure = extractStructure(yourSyntheticHtml);

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

    const aiGapAnalysis = await geminiService.generateSuggestion(prompt, '');

    return {
        competitor: { url: competitorUrl, ...competitorStructure },
        yours: { slug: yourArticle.slug, ...yourStructure },
        aiGapAnalysis,
    };
}
