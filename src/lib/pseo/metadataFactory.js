// src/lib/pseo/metadataFactory.js
/**
 * Metadata Factory for PSEO Pages
 * Generates SEO-optimized titles, descriptions, and keywords
 * following consistent patterns for programmatic pages
 */

import { SITE_CONFIG } from '@/lib/seoConfig';
import { optimizeMetaDescription } from '@/lib/metaDescriptionOptimizer';

/**
 * Generate metadata for a glossary term page
 * @param {Object} term - Term object from glossaryData.js
 * @returns {Object} SEO metadata object
 */
export const generateGlossaryMeta = (term) => {
    if (!term) {
        return {
            title: 'Data Engineering Glossary | DataEngineer Hub',
            description: 'Comprehensive glossary of data engineering terms, concepts, and technologies. Learn about data warehousing, ETL, data pipelines, and more.',
            keywords: 'data engineering glossary, data engineering terms, data warehouse definitions',
        };
    }

    // Generate title with power words for CTR
    const title = `What is ${term.term}? Definition & Guide | DataEngineer Hub`;

    // Generate description - use short definition + CTA
    const description = optimizeMetaDescription({
        title: term.term,
        excerpt: term.shortDefinition,
        category: 'Glossary',
        tags: term.keywords?.slice(0, 3) || [],
        readTime: 5,
    });

    // Combine keywords
    const keywords = [
        ...term.keywords,
        `what is ${term.term.toLowerCase()}`,
        `${term.term.toLowerCase()} definition`,
        `${term.term.toLowerCase()} explained`,
        'data engineering',
    ].join(', ');

    return {
        title,
        description,
        keywords,
    };
};

/**
 * Generate metadata for the glossary hub page
 * @returns {Object} SEO metadata object
 */
export const generateGlossaryHubMeta = () => {
    return {
        title: 'Data Engineering Glossary: 100+ Terms Explained | DataEngineer Hub',
        description: 'Master data engineering terminology with our comprehensive glossary. Learn about Snowflake, dbt, ETL, data warehousing, Apache Spark, Kafka, and more.',
        keywords: 'data engineering glossary, data engineering terms, data warehouse glossary, ETL glossary, data pipeline terms, snowflake glossary, dbt glossary',
    };
};

/**
 * Generate Open Graph data for glossary pages
 * @param {Object} term - Term object (optional, for individual pages)
 * @returns {Object} Open Graph metadata
 */
export const generateGlossaryOpenGraph = (term) => {
    if (!term) {
        return {
            type: 'website',
            title: 'Data Engineering Glossary | DataEngineer Hub',
            description: 'Comprehensive glossary of data engineering terms and concepts.',
            image: `${SITE_CONFIG.url}/og-glossary.png`,
        };
    }

    return {
        type: 'article',
        title: `What is ${term.term}? | DataEngineer Hub`,
        description: term.shortDefinition,
        image: `${SITE_CONFIG.url}/og-glossary-${term.slug}.png`,
    };
};

/**
 * Generate breadcrumb data for glossary pages
 * @param {Object} term - Term object (optional)
 * @returns {Array} Breadcrumb items
 */
export const generateGlossaryBreadcrumbs = (term) => {
    const breadcrumbs = [
        { name: 'Home', url: SITE_CONFIG.url },
        { name: 'Glossary', url: `${SITE_CONFIG.url}/glossary` },
    ];

    if (term) {
        breadcrumbs.push({
            name: term.term,
            url: `${SITE_CONFIG.url}/glossary/${term.slug}`,
        });
    }

    return breadcrumbs;
};

/**
 * Generate canonical URL for glossary pages
 * @param {string} slug - Term slug (optional)
 * @returns {string} Canonical URL
 */
export const generateGlossaryCanonical = (slug) => {
    if (slug) {
        return `${SITE_CONFIG.url}/glossary/${slug}`;
    }
    return `${SITE_CONFIG.url}/glossary`;
};

/**
 * Generate metadata for comparison pages
 * @param {Object} comparison - Comparison object from comparisonData.js
 * @returns {Object} SEO metadata object
 */
export const generateComparisonMeta = (comparison) => {
    if (!comparison) return null;

    const title = `${comparison.toolA} vs ${comparison.toolB}: Key Differences & Winner (2026) | DataEngineer Hub`;

    const description = optimizeMetaDescription({
        title: `${comparison.toolA} vs ${comparison.toolB}`,
        excerpt: comparison.shortVerdict,
        category: 'Comparison',
        tags: [comparison.toolA, comparison.toolB, 'comparison', comparison.category],
        readTime: 8
    });

    const keywords = [
        `${comparison.toolA} vs ${comparison.toolB}`,
        `${comparison.toolA} or ${comparison.toolB}`,
        `${comparison.toolA} vs ${comparison.toolB} comparison`,
        `${comparison.toolA} alternative`,
        `${comparison.toolB} alternative`,
        'data engineering tools'
    ].join(', ');

    return {
        title,
        description,
        keywords
    };
};

/**
 * Generate Canonical URL for comparison pages
 */
export const generateComparisonCanonical = (slug) => {
    if (!slug) return `${SITE_CONFIG.url}/compare`;
    return `${SITE_CONFIG.url}/compare/${slug}`;
};

/**
 * Generate metadata for comparison hub page
 */
export const generateComparisonHubMeta = () => {
    return {
        title: 'Data Tool Comparisons: Airflow vs Prefect, Snowflake vs BigQuery | DataEngineer Hub',
        description: 'In-depth comparisons of top data engineering tools. Decide between Airflow vs Prefect, Snowflake vs BigQuery, dbt vs Dataform, and more.',
        keywords: 'data tool comparisons, data engineering tools comparison, snowflake vs bigquery, airflow vs prefect'
    };
};

export default {
    generateGlossaryMeta,
    generateGlossaryHubMeta,
    generateGlossaryOpenGraph,
    generateGlossaryBreadcrumbs,
    generateGlossaryCanonical,
    generateComparisonMeta,
    generateComparisonCanonical,
    generateComparisonHubMeta
};
