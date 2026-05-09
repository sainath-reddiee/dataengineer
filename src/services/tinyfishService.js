// src/services/tinyfishService.js
// TinyFish Web Agent integration for SERP intelligence, competitor analysis,
// live page validation, and PAA extraction.
//
// Uses the TinyFish Agent API (natural-language web automation) and Fetch API
// (structured content extraction) for real browser-based web intelligence.
//
// API key stored in sessionStorage (same pattern as AI service keys).

const AGENT_URL = 'https://agent.tinyfish.ai/v1/automation/run';
const FETCH_URL = 'https://api.fetch.tinyfish.ai';
const SEARCH_URL = 'https://api.search.tinyfish.ai';
const SESSION_KEY = 'tinyfish_api_key';

const SEARCH_TIMEOUT_MS = 20000;
const FETCH_TIMEOUT_MS = 30000;
const AGENT_TIMEOUT_MS = 60000; // Agent runs can be slow (real browser)

/**
 * Run a fetch with timeout + single 429 retry honoring Retry-After header.
 */
async function timedFetch(url, options, timeoutMs, label) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            if (response.status === 429 && attempt === 0) {
                const retryAfter = parseFloat(response.headers.get('Retry-After')) || 1.5;
                await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
                continue;
            }
            return response;
        } catch (error) {
            lastError = error;
            if (error.name === 'AbortError') {
                throw new Error(`${label} timed out after ${timeoutMs / 1000}s.`);
            }
            if (attempt === 1) throw error;
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastError || new Error(`${label} failed.`);
}

class TinyFishService {
    constructor() {
        this._apiKey = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) || '';
    }

    get isEnabled() {
        return !!this._apiKey;
    }

    setApiKey(key) {
        this._apiKey = key || '';
        if (typeof sessionStorage !== 'undefined') {
            if (key) sessionStorage.setItem(SESSION_KEY, key);
            else sessionStorage.removeItem(SESSION_KEY);
        }
    }

    getApiKey() {
        return this._apiKey;
    }

    // ─── Agent API (natural language automation) ──────────────────────

    /**
     * Run a TinyFish automation on a URL with a goal.
     * @param {string} url - Target URL
     * @param {string} goal - Natural language instruction
     * @param {Object} outputSchema - Optional JSON schema for structured output
     * @returns {Promise<Object>} Run result
     */
    async runAgent(url, goal, outputSchema = null) {
        if (!this.isEnabled) throw new Error('TinyFish API key not configured');

        // Note: output_schema requires account-level feature access.
        // We omit it and parse JSON from the agent's text response instead.
        const body = { url, goal };

        const response = await timedFetch(AGENT_URL, {
            method: 'POST',
            headers: {
                'X-API-Key': this._apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }, AGENT_TIMEOUT_MS, 'TinyFish Agent');

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`TinyFish Agent error (${response.status}): ${err}`);
        }

        const data = await response.json();

        // If the agent returned structured result directly, use it
        if (data.result && typeof data.result === 'object') return data;

        // Otherwise, try to extract JSON from the agent's text output
        const text = data.result || data.output || data.text || '';
        if (outputSchema && typeof text === 'string') {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                              text.match(/(\[[\s\S]*\])/) ||
                              text.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    data.result = JSON.parse(jsonMatch[1]);
                } catch { /* leave as text */ }
            }
        }

        return data;
    }

    // ─── Fetch API (content extraction with real browser) ──────────

    /**
     * Fetch and extract content from URLs using a real browser.
     * Supports HTML, PDF, JSON, and plain text pages.
     * @param {string[]} urls - Up to 10 URLs
     * @param {Object} options - { format: 'markdown'|'html'|'json', links: false, image_links: false }
     * @returns {Promise<Object>} { results: [{ url, title, description, text, links?, image_links? }], errors: [] }
     */
    async fetchContent(urls, { format = 'markdown', links = false, image_links = false } = {}) {
        if (!this.isEnabled) throw new Error('TinyFish API key not configured');

        const response = await timedFetch(FETCH_URL, {
            method: 'POST',
            headers: {
                'X-API-Key': this._apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                urls: Array.isArray(urls) ? urls : [urls],
                format,
                links,
                image_links,
            }),
        }, FETCH_TIMEOUT_MS, 'TinyFish Fetch');

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`TinyFish Fetch error (${response.status}): ${err}`);
        }

        return response.json();
    }

    /**
     * Fetch a page and extract all outbound links (for link analysis).
     * Uses Fetch API with links=true.
     * @param {string} url - Page URL
     * @returns {Promise<Object>} { title, description, text, links: string[], image_links: string[] }
     */
    async fetchWithLinks(url) {
        const result = await this.fetchContent([url], { format: 'markdown', links: true, image_links: true });
        return result.results?.[0] || null;
    }

    // ─── Search API (web search — FREE, no credits) ────────────────

    /**
     * Search the web and get structured results.
     * FREE tier: 30 requests/minute. No credits consumed.
     * @param {string} query - Search query (supports site: and -site: operators)
     * @param {Object} options - { location: 'US', language: 'en', page: 0 }
     * @returns {Promise<Object>} { query, results: [{ position, site_name, title, snippet, url }], total_results }
     */
    async search(query, { location = 'US', language = 'en', page = 0 } = {}) {
        if (!this.isEnabled) throw new Error('TinyFish API key not configured');

        const params = new URLSearchParams({ query, location, language, page });
        const response = await timedFetch(`${SEARCH_URL}?${params}`, {
            method: 'GET',
            headers: { 'X-API-Key': this._apiKey },
        }, SEARCH_TIMEOUT_MS, 'TinyFish Search');

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`TinyFish Search error (${response.status}): ${err}`);
        }

        return response.json();
    }

    /**
     * Search for your domain's ranking for a keyword.
     * Uses site: operator to find your page, then full search for context.
     * FREE — uses Search API.
     * @param {string} keyword - Target keyword
     * @param {string} domain - Your domain (default: dataengineerhub.blog)
     * @returns {Promise<Object>} { keyword, yourPosition, yourUrl, topResults, totalResults }
     */
    async checkKeywordRanking(keyword, domain = 'dataengineerhub.blog') {
        const fullResults = await this.search(keyword);
        const results = fullResults.results || [];
        const yours = results.find(r => r.url?.includes(domain));

        return {
            keyword,
            found: !!yours,
            position: yours?.position || null,
            title: yours?.title || null,
            url: yours?.url || null,
            snippet: yours?.snippet || null,
            topResults: results.slice(0, 10),
            totalResults: fullResults.total_results || results.length,
        };
    }

    /**
     * Find competitor articles for a keyword (excludes your domain).
     * FREE — uses Search API.
     * @param {string} keyword - Target keyword
     * @param {string} excludeDomain - Your domain to exclude
     * @returns {Promise<Array>} Top competitor URLs
     */
    async findCompetitorArticles(keyword, excludeDomain = 'dataengineerhub.blog') {
        const results = await this.search(`${keyword} -site:${excludeDomain}`);
        return (results.results || []).map(r => ({
            position: r.position,
            title: r.title,
            url: r.url,
            domain: r.site_name,
            snippet: r.snippet,
        }));
    }

    // ─── High-Level Methods (combining APIs) ─────────────────────────

    /**
     * Extract competitor article structure (headings, word count, FAQs, links, schema).
     * @param {string} competitorUrl - URL to analyze
     * @returns {Promise<Object>} Structured analysis
     */
    async analyzeCompetitor(competitorUrl) {
        return this.runAgent(competitorUrl,
            `Analyze this article page thoroughly. Extract:
1. The exact page title (H1 or title tag)
2. Meta description content
3. All H2 and H3 headings as an ordered list
4. Total word count of the main article content (approximate)
5. Number of images with their alt text
6. All FAQ questions if a FAQ section exists
7. Number of internal links and external links
8. Any structured data/schema markup types present (look in script tags for application/ld+json)
9. Whether a "Last Updated" or publish date is visible
10. Whether there's a TL;DR or Key Takeaways section

Return as a JSON object with keys: title, metaDescription, headings (array), wordCount (number), images (array of {alt}), faqs (array of {question, answer}), internalLinks (number), externalLinks (number), schemaTypes (array of strings), hasLastUpdated (boolean), hasTLDR (boolean)`,
            {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    metaDescription: { type: 'string' },
                    headings: { type: 'array', items: { type: 'string' } },
                    wordCount: { type: 'number' },
                    images: { type: 'array', items: { type: 'object', properties: { alt: { type: 'string' } } } },
                    faqs: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
                    internalLinks: { type: 'number' },
                    externalLinks: { type: 'number' },
                    schemaTypes: { type: 'array', items: { type: 'string' } },
                    hasLastUpdated: { type: 'boolean' },
                    hasTLDR: { type: 'boolean' },
                },
                required: ['title', 'headings', 'wordCount'],
            }
        );
    }

    /**
     * Check live SERP features for a keyword by searching Google.
     * @param {string} keyword - Target keyword to search
     * @returns {Promise<Object>} SERP feature analysis
     */
    async checkSERPFeatures(keyword) {
        return this.runAgent(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
            `Analyze this Google search results page for the query "${keyword}". Extract:
1. Does a Featured Snippet appear? If yes, what type (paragraph, list, table) and from which domain?
2. Is there a "People Also Ask" (PAA) box? If yes, list all visible questions (expand them if possible)
3. Are there any Video results? From which domains?
4. Is there a Knowledge Panel on the right side?
5. How many organic results are on page 1?
6. List the top 5 organic results with: position, title, URL, and a snippet of the description
7. Are there any "Related searches" at the bottom? List them.
8. Is there an AI Overview/SGE box at the top?

Return as JSON with keys: featuredSnippet ({exists, type, domain, text} or null), paaQuestions (array of strings), videoResults (array of {title, domain}), hasKnowledgePanel (boolean), organicResults (array of {position, title, url, snippet}), relatedSearches (array of strings), hasAIOverview (boolean)`,
            {
                type: 'object',
                properties: {
                    featuredSnippet: { type: 'object', properties: { exists: { type: 'boolean' }, type: { type: 'string' }, domain: { type: 'string' }, text: { type: 'string' } } },
                    paaQuestions: { type: 'array', items: { type: 'string' } },
                    videoResults: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, domain: { type: 'string' } } } },
                    hasKnowledgePanel: { type: 'boolean' },
                    organicResults: { type: 'array', items: { type: 'object', properties: { position: { type: 'number' }, title: { type: 'string' }, url: { type: 'string' }, snippet: { type: 'string' } } } },
                    relatedSearches: { type: 'array', items: { type: 'string' } },
                    hasAIOverview: { type: 'boolean' },
                },
            }
        );
    }

    /**
     * Extract real "People Also Ask" questions from Google for a keyword.
     * @param {string} keyword - Target keyword
     * @returns {Promise<string[]>} Array of PAA questions
     */
    async extractPAA(keyword) {
        const result = await this.runAgent(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
            `Find the "People Also Ask" section on this Google search results page. Click on each question to expand it and reveal more questions. Extract ALL visible questions (both initially shown and newly revealed after clicking). Return as a JSON array of question strings.`,
            { type: 'array', items: { type: 'string' } }
        );
        return result?.result || [];
    }

    /**
     * Validate a live page — check how it renders in a real browser.
     * @param {string} pageUrl - Your article URL
     * @returns {Promise<Object>} Validation results
     */
    async validatePage(pageUrl) {
        return this.runAgent(pageUrl,
            `Validate this web page for SEO and rendering correctness. Check:
1. Page title (from the <title> tag as rendered)
2. Meta description (from meta tag)
3. H1 tag content (is there exactly 1 H1?)
4. Open Graph tags (og:title, og:description, og:image — are they present?)
5. Canonical URL (is it set? what is it?)
6. JSON-LD structured data (list all @type values found)
7. Any console errors visible (JavaScript errors)
8. Does the page have visible content (not a blank/loading screen)?
9. Mobile viewport meta tag present?
10. Page load — does it render fully or show a loading spinner/skeleton?
11. Any broken images (images that failed to load)?
12. robots meta tag (is indexing allowed?)

Return as JSON with keys: title, metaDescription, h1 (string or null), h1Count (number), ogTags ({title, description, image} or null), canonical (string or null), schemaTypes (array), consoleErrors (array of strings), hasContent (boolean), hasMobileViewport (boolean), fullyRendered (boolean), brokenImages (number), robotsMeta (string or "not set")`,
            {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    metaDescription: { type: 'string' },
                    h1: { type: 'string' },
                    h1Count: { type: 'number' },
                    canonical: { type: 'string' },
                    schemaTypes: { type: 'array', items: { type: 'string' } },
                    hasContent: { type: 'boolean' },
                    fullyRendered: { type: 'boolean' },
                    brokenImages: { type: 'number' },
                },
                required: ['title', 'hasContent', 'fullyRendered'],
            }
        );
    }

    /**
     * Monitor a competitor — check their latest content and changes.
     * @param {string} competitorDomain - e.g., "towardsdatascience.com"
     * @param {string} topic - Topic to focus on
     * @returns {Promise<Object>} Latest articles and changes
     */
    async monitorCompetitor(competitorDomain, topic) {
        return this.runAgent(`https://${competitorDomain}`,
            `Find the most recent articles about "${topic}" on this website. Look for a blog, articles section, or content feed. Extract the 5 most recent articles related to "${topic}" with: title, URL, publish date (if visible), and a brief description/excerpt. Return as JSON array.`,
            {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        url: { type: 'string' },
                        publishDate: { type: 'string' },
                        excerpt: { type: 'string' },
                    },
                    required: ['title', 'url'],
                },
            }
        );
    }

    /**
     * Check if your page ranks for a keyword and what position.
     * @param {string} keyword - Search keyword
     * @param {string} yourDomain - Your domain to look for
     * @returns {Promise<Object>} Ranking info
     */
    async checkRanking(keyword, yourDomain = 'dataengineerhub.blog') {
        const result = await this.checkSERPFeatures(keyword);
        const yourResult = (result?.result?.organicResults || []).find(r =>
            r.url && r.url.includes(yourDomain)
        );
        return {
            keyword,
            found: !!yourResult,
            position: yourResult?.position || null,
            title: yourResult?.title || null,
            snippet: yourResult?.snippet || null,
            totalResults: result?.result?.organicResults?.length || 0,
            featuredSnippet: result?.result?.featuredSnippet || null,
            paaQuestions: result?.result?.paaQuestions || [],
            relatedSearches: result?.result?.relatedSearches || [],
            hasAIOverview: result?.result?.hasAIOverview || false,
        };
    }
}

export const tinyfishService = new TinyFishService();
export default tinyfishService;
