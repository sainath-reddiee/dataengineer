// src/lib/pseo/schemaFactory.js
/**
 * Schema Factory for PSEO Pages
 * Generates JSON-LD structured data for glossary and comparison pages
 * Following Schema.org best practices for rich snippets
 */

import { SITE_CONFIG } from '@/lib/seoConfig';

/**
 * Generate DefinedTerm schema for a glossary term
 * @param {Object} term - Term object from glossaryData.js
 * @returns {Object} JSON-LD schema object
 */
export const generateDefinedTermSchema = (term) => {
    if (!term) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': `${SITE_CONFIG.url}/glossary/${term.slug}#term`,
        name: term.term,
        description: term.shortDefinition,
        inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            '@id': `${SITE_CONFIG.url}/glossary#termset`,
            name: 'Data Engineering Glossary',
            url: `${SITE_CONFIG.url}/glossary`,
        },
    };
};

/**
 * Generate FAQPage schema from term FAQs
 * @param {Object} term - Term object with faqs array
 * @returns {Object} JSON-LD FAQPage schema
 */
export const generateFAQSchema = (term) => {
    if (!term?.faqs?.length) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: term.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
};

/**
 * Generate Article schema for glossary term page
 * @param {Object} term - Term object from glossaryData.js
 * @returns {Object} JSON-LD Article schema
 */
export const generateGlossaryArticleSchema = (term) => {
    if (!term) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `What is ${term.term}? Complete Guide`,
        description: term.shortDefinition,
        author: {
            '@type': 'Person',
            name: SITE_CONFIG.author.name,
            url: SITE_CONFIG.author.url,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_CONFIG.url}/logo.png`,
            },
        },
        datePublished: term.lastUpdated,
        dateModified: term.lastUpdated,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_CONFIG.url}/glossary/${term.slug}`,
        },
        keywords: term.keywords?.join(', '),
        articleSection: 'Glossary',
        about: {
            '@type': 'Thing',
            name: term.term,
        },
    };
};

/**
 * Generate BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of breadcrumb items {name, url}
 * @returns {Object} JSON-LD BreadcrumbList schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
    if (!breadcrumbs?.length) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
        })),
    };
};

/**
 * Generate WebPage schema for glossary hub
 * @returns {Object} JSON-LD WebPage schema
 */
export const generateGlossaryHubSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${SITE_CONFIG.url}/glossary`,
        name: 'Data Engineering Glossary',
        description: 'Comprehensive glossary of data engineering terms, tools, and concepts.',
        url: `${SITE_CONFIG.url}/glossary`,
        isPartOf: {
            '@type': 'WebSite',
            '@id': `${SITE_CONFIG.url}#website`,
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
        },
        about: {
            '@type': 'Thing',
            name: 'Data Engineering',
        },
        mainEntity: {
            '@type': 'DefinedTermSet',
            '@id': `${SITE_CONFIG.url}/glossary#termset`,
            name: 'Data Engineering Glossary',
            description: 'A comprehensive collection of data engineering terminology.',
        },
    };
};

/**
 * Generate all schemas for a glossary term page
 * @param {Object} term - Term object from glossaryData.js
 * @param {Array} breadcrumbs - Breadcrumb items
 * @returns {Array} Array of schema objects to render
 */
export const generateAllGlossarySchemas = (term, breadcrumbs) => {
    const schemas = [];

    const definedTerm = generateDefinedTermSchema(term);
    if (definedTerm) schemas.push(definedTerm);

    const faq = generateFAQSchema(term);
    if (faq) schemas.push(faq);

    const article = generateGlossaryArticleSchema(term);
    if (article) schemas.push(article);

    const breadcrumb = generateBreadcrumbSchema(breadcrumbs);
    if (breadcrumb) schemas.push(breadcrumb);

    return schemas;
};

/**
 * Generate Article schema for comparison page
 * @param {Object} comparison - Comparison object
 * @returns {Object} JSON-LD Article schema
 */
export const generateComparisonSchema = (comparison) => {
    if (!comparison) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${comparison.toolA} vs ${comparison.toolB}: Check the Winner (2026)`,
        description: comparison.shortVerdict,
        author: {
            '@type': 'Person',
            name: SITE_CONFIG.author.name,
            url: SITE_CONFIG.author.url,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_CONFIG.url}/logo.png`,
            },
        },
        datePublished: comparison.lastUpdated,
        dateModified: comparison.lastUpdated,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_CONFIG.url}/compare/${comparison.slug}`,
        },
        about: [
            { '@type': 'Thing', name: comparison.toolA },
            { '@type': 'Thing', name: comparison.toolB }
        ]
    };
};

export default {
    generateDefinedTermSchema,
    generateFAQSchema,
    generateGlossaryArticleSchema,
    generateBreadcrumbSchema,
    generateGlossaryHubSchema,
    generateAllGlossarySchemas,
    generateComparisonSchema
};
