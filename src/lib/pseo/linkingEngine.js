/**
 * Internal Linking Engine for PSEO
 * Graph-based automatic internal linking for Glossary and Comparison pages.
 * Implements Hub-and-Spoke model for optimal SEO link equity distribution.
 */

import { glossaryTerms, GLOSSARY_CATEGORIES } from '@/data/glossaryData';
import { comparisons } from '@/data/comparisonData';
import { SITE_CONFIG } from '@/lib/seoConfig';

// =============================================================================
// DYNAMIC ARTICLES (Auto-synced from WordPress)
// =============================================================================

/**
 * Articles are auto-synced from WordPress via:
 *   node scripts/sync-articles-for-linking.js
 * 
 * The sync runs as part of the pSEO build process and generates:
 *   src/data/pseo/articles.json
 * 
 * Format:
 *   { slug, title, keywords, categories }
 */

import articlesData from '../../data/pseo/articles.json';
import {
    injectArticleLinks,
    buildLinkCandidates,
    hasLinkToArticle,
    MAX_INTERNAL_LINKS,
} from './injectArticleLinks.js';

const SYNCED_ARTICLES = articlesData || [];

/**
 * Export for use in templates. Combines synced articles with any manual overrides.
 */
export const MANUAL_ARTICLES = [
    ...SYNCED_ARTICLES,
    // Add manual overrides below if needed (these take priority)
    // { slug: 'special-article', title: 'My Special Article', keywords: ['special'] },
];

export { buildLinkCandidates, hasLinkToArticle, MAX_INTERNAL_LINKS };

// =============================================================================
// INTERNAL LINK INJECTION ENGINE
// =============================================================================

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAlreadyLinked(html, keyword) {
    const anchorRegex = new RegExp(`<a[^>]*>[^<]*${escapeRegex(keyword)}[^<]*</a>`, 'i');
    if (anchorRegex.test(html)) return true;
    const attrRegex = new RegExp(`<[^>]*${escapeRegex(keyword)}[^>]*>`, 'i');
    if (attrRegex.test(html)) return true;
    return false;
}

function maskCodeBlocks(html) {
    const blocks = [];
    const token = (i) => `\u0001PSEO_CODE_BLOCK_${i}\u0001`;
    const stripped = html
        .replace(/<pre[\s\S]*?<\/pre>/gi, (match) => {
            const i = blocks.length;
            blocks.push(match);
            return token(i);
        })
        .replace(/<code[\s\S]*?<\/code>/gi, (match) => {
            const i = blocks.length;
            blocks.push(match);
            return token(i);
        });

    const restore = (processed) =>
        processed.replace(/\u0001PSEO_CODE_BLOCK_(\d+)\u0001/g, (_, i) => blocks[Number(i)] || '');

    return { stripped, restore };
}

/**
 * Inject internal links from pSEO content to Manual Articles.
 * See injectArticleLinks.js for ranking / dedupe / heading / code rules.
 */
export function injectInternalLinks(htmlContent, excludeSlug = '', options = {}) {
    return injectArticleLinks(htmlContent, excludeSlug, {
        articles: options.articles || MANUAL_ARTICLES,
        maxLinks: options.maxLinks,
    });
}

/**
 * Inject cross-links between glossary terms within content.
 * Links glossary terms mentioned in the content to their respective pages.
 * 
 * @param {string} htmlContent - The HTML content to process
 * @param {string} currentSlug - The current term's slug (to exclude self-linking)
 * @param {number} maxLinks - Maximum number of term links to inject
 * @returns {string} - HTML with glossary cross-links injected
 */
export function injectGlossaryCrossLinks(htmlContent, currentSlug = '', maxLinks = 5, { terms = null } = {}) {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return htmlContent;
    }

    // Mask <pre>/<code> blocks so we never inject links inside code samples.
    const { stripped, restore } = maskCodeBlocks(htmlContent);
    let result = stripped;
    let linkCount = 0;

    const allTerms = terms || glossaryTerms || [];

    // Sort terms by length (descending) to match longer phrases first
    const sortedTerms = [...allTerms]
        .filter(t => t.slug !== currentSlug)
        .sort((a, b) => b.term.length - a.term.length);

    for (const term of sortedTerms) {
        if (linkCount >= maxLinks) break;

        // Skip if term is already linked
        if (isAlreadyLinked(result, term.term)) continue;

        const regex = new RegExp(
            `(?<!<[^>]*)\\b(${escapeRegex(term.term)})\\b(?![^<]*>)`,
            'i'
        );

        const match = result.match(regex);
        if (match) {
            const anchor = `<a href="/glossary/${term.slug}" class="glossary-link" title="${term.shortDefinition?.substring(0, 100) || term.term}">${match[1]}</a>`;
            result = result.replace(regex, anchor);
            linkCount++;
        }
    }

    return restore(result);
}

// =============================================================================
// RELATED PAGES ENGINE
// =============================================================================

/**
 * Get semantically related glossary terms based on category and keywords.
 * Uses Jaccard similarity on keywords for ranking.
 * 
 * @param {string} currentSlug - The slug of the current term
 * @param {number} limit - Maximum number of related terms to return
 * @returns {Array} - Array of related term objects { slug, term, category }
 */
export const getRelatedGlossaryTerms = (currentSlug, limit = 5, { terms = null } = {}) => {
    const allTerms = terms || glossaryTerms || [];
    const currentTerm = allTerms.find(t => t.slug === currentSlug);
    if (!currentTerm) return [];

    // First, get explicitly defined related terms
    const explicitRelated = (currentTerm.relatedTerms || [])
        .map(slug => allTerms.find(t => t.slug === slug))
        .filter(Boolean)
        .slice(0, limit);

    if (explicitRelated.length >= limit) {
        return explicitRelated.map(t => ({
            slug: t.slug,
            term: t.term,
            category: t.category,
            shortDefinition: t.shortDefinition
        }));
    }

    // Fill remaining with category-based matches
    const currentKeywords = new Set((currentTerm.keywords || []).map(k => k.toLowerCase()));

    const scored = allTerms
        .filter(t => t.slug !== currentSlug && !explicitRelated.some(r => r.slug === t.slug))
        .map(t => {
            let score = 0;

            // Same category = +3 points
            if (t.category === currentTerm.category) score += 3;

            // Keyword overlap (Jaccard-like)
            const termKeywords = new Set((t.keywords || []).map(k => k.toLowerCase()));
            const intersection = [...currentKeywords].filter(k => termKeywords.has(k)).length;
            score += intersection * 2;

            return { term: t, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit - explicitRelated.length);

    const combined = [
        ...explicitRelated,
        ...scored.map(s => s.term)
    ];

    return combined.map(t => ({
        slug: t.slug,
        term: t.term,
        category: t.category,
        shortDefinition: t.shortDefinition
    }));
};

/**
 * Get related comparisons for a given comparison page.
 * 
 * @param {string} currentSlug - The slug of the current comparison
 * @param {number} limit - Maximum number of related comparisons
 * @returns {Array} - Array of related comparison objects
 */
export const getRelatedComparisons = (currentSlug, limit = 3, { comparisons: comps = null } = {}) => {
    const allComparisons = comps || comparisons || [];
    const currentComparison = allComparisons.find(c => c.slug === currentSlug);
    if (!currentComparison) return [];

    // First, get explicitly defined related comparisons
    const explicitRelated = (currentComparison.relatedComparisons || [])
        .map(slug => allComparisons.find(c => c.slug === slug))
        .filter(Boolean);

    if (explicitRelated.length >= limit) {
        return explicitRelated.slice(0, limit).map(c => ({
            slug: c.slug,
            toolA: c.toolA,
            toolB: c.toolB,
            category: c.category
        }));
    }

    // Fill with same-category comparisons
    const sameCategory = allComparisons
        .filter(c =>
            c.slug !== currentSlug &&
            c.category === currentComparison.category &&
            !explicitRelated.some(r => r.slug === c.slug)
        )
        .slice(0, limit - explicitRelated.length);

    const combined = [...explicitRelated, ...sameCategory];

    return combined.map(c => ({
        slug: c.slug,
        toolA: c.toolA,
        toolB: c.toolB,
        category: c.category
    }));
};

/**
 * Get glossary terms that mention a specific tool (for cross-linking).
 * 
 * @param {string} toolName - The tool name to search for
 * @param {number} limit - Maximum number of terms
 * @returns {Array} - Related glossary entries
 */
export const getGlossaryTermsForTool = (toolName, limit = 3, { terms = null } = {}) => {
    const normalizedTool = toolName.toLowerCase();
    const allTerms = terms || glossaryTerms || [];

    return allTerms
        .filter(t => {
            const inKeywords = (t.keywords || []).some(k =>
                k.toLowerCase().includes(normalizedTool)
            );
            const inRelatedTools = (t.relatedTools || []).some(rt =>
                rt.toLowerCase().includes(normalizedTool)
            );
            const inDefinition = (t.fullDefinition || '').toLowerCase().includes(normalizedTool);

            return inKeywords || inRelatedTools || inDefinition;
        })
        .slice(0, limit)
        .map(t => ({
            slug: t.slug,
            term: t.term,
            category: t.category
        }));
};

// =============================================================================
// BREADCRUMB GENERATOR
// =============================================================================

/**
 * Generate breadcrumb trail for PSEO pages.
 * Follows Hub-and-Spoke model: Home > Hub > Spoke
 * 
 * @param {string} pageType - 'glossary' | 'comparison' | 'glossary-hub' | 'comparison-hub'
 * @param {object} pageData - Page-specific data (term object or comparison object)
 * @returns {Array} - Breadcrumb items { name, url }
 */
export const generateBreadcrumbs = (pageType, pageData = null) => {
    const baseUrl = SITE_CONFIG.url;

    const breadcrumbs = [
        { name: 'Home', url: baseUrl }
    ];

    switch (pageType) {
        case 'glossary-hub':
            breadcrumbs.push({ name: 'Glossary', url: `${baseUrl}/glossary` });
            break;

        case 'glossary':
            breadcrumbs.push({ name: 'Glossary', url: `${baseUrl}/glossary` });
            if (pageData?.term) {
                breadcrumbs.push({
                    name: pageData.term,
                    url: `${baseUrl}/glossary/${pageData.slug}`
                });
            }
            break;

        case 'comparison-hub':
            breadcrumbs.push({ name: 'Comparisons', url: `${baseUrl}/compare` });
            break;

        case 'comparison':
            breadcrumbs.push({ name: 'Comparisons', url: `${baseUrl}/compare` });
            if (pageData?.toolA && pageData?.toolB) {
                breadcrumbs.push({
                    name: `${pageData.toolA} vs ${pageData.toolB}`,
                    url: `${baseUrl}/compare/${pageData.slug}`
                });
            }
            break;

        default:
            break;
    }

    return breadcrumbs;
};

// =============================================================================
// INTERNAL LINK SUGGESTIONS (for content enrichment)
// =============================================================================

/**
 * Find glossary terms that could be linked within a block of text.
 * Returns terms found in the text for auto-linking.
 * 
 * @param {string} text - The content to scan
 * @param {string} excludeSlug - Slug to exclude (current page)
 * @returns {Array} - Terms found { term, slug, positions }
 */
export const findLinkableTerms = (text, excludeSlug = '', { terms = null } = {}) => {
    if (!text) return [];

    const normalizedText = text.toLowerCase();
    const allTerms = terms || glossaryTerms || [];

    return allTerms
        .filter(t => t.slug !== excludeSlug)
        .filter(t => {
            const termLower = t.term.toLowerCase();
            return normalizedText.includes(termLower);
        })
        .map(t => ({
            term: t.term,
            slug: t.slug,
            url: `/glossary/${t.slug}`
        }));
};

// =============================================================================
// HUB PAGE HELPERS
// =============================================================================

/**
 * Get all glossary terms grouped by category for the hub page.
 * 
 * @returns {Object} - { categoryId: { name, icon, terms: [] } }
 */
export const getGlossaryByCategory = () => {
    const grouped = {};

    GLOSSARY_CATEGORIES.forEach(cat => {
        grouped[cat.id] = {
            name: cat.name,
            icon: cat.icon,
            terms: []
        };
    });

    glossaryTerms.forEach(term => {
        if (grouped[term.category]) {
            grouped[term.category].terms.push({
                slug: term.slug,
                term: term.term,
                shortDefinition: term.shortDefinition
            });
        }
    });

    // Sort terms alphabetically within each category
    Object.values(grouped).forEach(cat => {
        cat.terms.sort((a, b) => a.term.localeCompare(b.term));
    });

    return grouped;
};

/**
 * Get all comparisons grouped by category for the hub page.
 * 
 * @returns {Object} - { category: [comparisons] }
 */
export const getComparisonsByCategory = () => {
    const grouped = {};

    comparisons.forEach(comp => {
        if (!grouped[comp.category]) {
            grouped[comp.category] = [];
        }
        grouped[comp.category].push({
            slug: comp.slug,
            toolA: comp.toolA,
            toolB: comp.toolB,
            shortVerdict: comp.shortVerdict
        });
    });

    return grouped;
};
