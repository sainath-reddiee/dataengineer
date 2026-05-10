// src/utils/linkAnalysis.js
// Shared link analysis utilities for computing internal/outbound/authority link metrics.
// Used by ArticleOptimizer, ArticleFixer, CTRFixer, RankDashboard for link health insights.

const AUTHORITY_DOMAINS = [
    'docs.snowflake.com', 'snowflake.com',
    'docs.getdbt.com', 'getdbt.com',
    'docs.aws.amazon.com', 'aws.amazon.com',
    'cloud.google.com', 'developers.google.com',
    'learn.microsoft.com', 'azure.microsoft.com',
    'docs.databricks.com', 'databricks.com',
    'airflow.apache.org', 'spark.apache.org', 'kafka.apache.org', 'iceberg.apache.org',
    'kubernetes.io', 'docs.docker.com',
    'docs.python.org', 'python.org',
    'github.com', 'wikipedia.org', 'arxiv.org',
    'developer.hashicorp.com', 'terraform.io',
    'stackoverflow.com',
];

const OWN_DOMAIN = 'dataengineerhub.blog';

/**
 * Analyze link metrics for a single article.
 * @param {Object} article - { slug, content (HTML) }
 * @param {Object} linkGraph - Optional precomputed { inboundCount: {slug: n} } from buildLinkGraph
 * @returns {Object} Link health metrics
 */
export function analyzeArticleLinks(article, linkGraph = null) {
    const html = article.content || '';

    // Extract all <a href="..."> links
    const linkMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)];
    const allLinks = linkMatches.map(m => m[1]);

    let internalOutbound = 0;
    let externalOutbound = 0;
    let authorityLinks = 0;
    const externalDomains = new Set();
    const authorityHits = [];

    for (const href of allLinks) {
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

        const lower = href.toLowerCase();

        // Internal link: relative or own domain
        if (href.startsWith('/') || lower.includes(OWN_DOMAIN)) {
            // Don't count tag/category/non-article links as content links
            if (lower.match(/\/articles\//) || href.startsWith('/articles/')) {
                internalOutbound++;
            }
            continue;
        }

        // External link
        if (lower.startsWith('http')) {
            externalOutbound++;
            try {
                const url = new URL(href);
                externalDomains.add(url.hostname);
                // Check if it's an authority domain
                const isAuthority = AUTHORITY_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith('.' + d));
                if (isAuthority) {
                    authorityLinks++;
                    authorityHits.push(url.hostname);
                }
            } catch { /* invalid URL, skip */ }
        }
    }

    const inboundCount = linkGraph?.inboundCount?.[article.slug] ?? null;
    const isOrphan = inboundCount === 0;

    // Compute Link Score (0-100)
    let score = 0;
    // Inbound links are most valuable for SEO (PageRank flow)
    if (inboundCount !== null) {
        if (inboundCount >= 5) score += 35;
        else if (inboundCount >= 3) score += 25;
        else if (inboundCount >= 1) score += 15;
    }
    // Internal outbound links (3-5 is ideal)
    if (internalOutbound >= 3 && internalOutbound <= 7) score += 25;
    else if (internalOutbound >= 1) score += 15;
    // Authority external links (2-3 is ideal for E-E-A-T + GEO)
    if (authorityLinks >= 3) score += 30;
    else if (authorityLinks >= 1) score += 18;
    // Total external links variety
    if (externalDomains.size >= 3) score += 10;
    else if (externalDomains.size >= 1) score += 5;

    score = Math.min(100, score);

    // Severity tier
    const tier = score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor';

    // Specific recommendations
    const recommendations = [];
    if (isOrphan) {
        recommendations.push({ severity: 'high', text: 'ORPHAN PAGE — no other articles link to this. Add inbound links from related posts.' });
    } else if (inboundCount !== null && inboundCount < 3) {
        recommendations.push({ severity: 'medium', text: `Only ${inboundCount} inbound link(s) — link from 2-3 more related articles to boost rankings.` });
    }
    if (internalOutbound < 3) {
        recommendations.push({ severity: 'medium', text: `Only ${internalOutbound} internal outbound link(s) — add 3-5 contextual links to related articles.` });
    } else if (internalOutbound > 8) {
        recommendations.push({ severity: 'low', text: `${internalOutbound} internal outbound links — consider trimming to 5-7 most relevant.` });
    }
    if (authorityLinks < 2) {
        recommendations.push({ severity: 'high', text: `Only ${authorityLinks} authority outbound link(s) — add 2-3 links to official docs (docs.snowflake.com, docs.aws.amazon.com, github.com) for E-E-A-T and GEO citations.` });
    }
    if (externalOutbound === 0) {
        recommendations.push({ severity: 'medium', text: 'No external links at all — Google/AI prefer content with authority citations.' });
    }

    return {
        inboundCount,
        internalOutbound,
        externalOutbound,
        authorityLinks,
        authorityDomains: [...new Set(authorityHits)],
        externalDomainCount: externalDomains.size,
        isOrphan,
        score,
        tier,
        recommendations,
    };
}

/**
 * Build a link graph across all articles (inbound counts).
 * @param {Array} posts - Array of { slug, content }
 * @returns {Object} { inboundCount: {slug: n}, outboundLinks: {slug: [targetSlugs]} }
 */
export function buildLinkGraph(posts) {
    const inboundCount = {};
    const outboundLinks = {};

    posts.forEach(p => { inboundCount[p.slug] = 0; outboundLinks[p.slug] = []; });

    posts.forEach(post => {
        const html = post.content || '';
        const matches = [...html.matchAll(/href=["'][^"']*\/articles\/([a-z0-9-]+)/gi)];
        const linksTo = new Set();
        for (const m of matches) {
            const targetSlug = m[1];
            if (targetSlug && targetSlug !== post.slug && Object.prototype.hasOwnProperty.call(inboundCount, targetSlug)) {
                linksTo.add(targetSlug);
            }
        }
        outboundLinks[post.slug] = [...linksTo];
        linksTo.forEach(target => {
            inboundCount[target] = (inboundCount[target] || 0) + 1;
        });
    });

    return { inboundCount, outboundLinks };
}

/**
 * Suggest authority outbound links based on article content topic detection.
 * @param {string} content - Article content (text or HTML)
 * @returns {Array} Suggested authority domains/URLs to consider linking to
 */
export function suggestAuthorityLinks(content) {
    const text = (content || '').toLowerCase();
    const suggestions = [];

    const topicMap = [
        { keywords: ['snowflake', 'cortex', 'snowpark'], suggest: { topic: 'Snowflake', url: 'https://docs.snowflake.com/' } },
        { keywords: ['dbt', 'data build tool'], suggest: { topic: 'dbt', url: 'https://docs.getdbt.com/' } },
        { keywords: ['airflow', 'dag'], suggest: { topic: 'Airflow', url: 'https://airflow.apache.org/docs/' } },
        { keywords: ['aws', 'redshift', 's3', 'glue'], suggest: { topic: 'AWS', url: 'https://docs.aws.amazon.com/' } },
        { keywords: ['azure', 'synapse', 'data factory'], suggest: { topic: 'Azure', url: 'https://learn.microsoft.com/azure/' } },
        { keywords: ['bigquery', 'gcp', 'dataflow'], suggest: { topic: 'GCP', url: 'https://cloud.google.com/bigquery/docs' } },
        { keywords: ['databricks', 'delta lake', 'unity catalog'], suggest: { topic: 'Databricks', url: 'https://docs.databricks.com/' } },
        { keywords: ['spark', 'pyspark'], suggest: { topic: 'Spark', url: 'https://spark.apache.org/docs/latest/' } },
        { keywords: ['kafka', 'streaming', 'event'], suggest: { topic: 'Kafka', url: 'https://kafka.apache.org/documentation/' } },
        { keywords: ['python', 'pandas', 'numpy'], suggest: { topic: 'Python', url: 'https://docs.python.org/3/' } },
        { keywords: ['iceberg', 'apache iceberg'], suggest: { topic: 'Iceberg', url: 'https://iceberg.apache.org/docs/latest/' } },
        { keywords: ['terraform', 'iac'], suggest: { topic: 'Terraform', url: 'https://developer.hashicorp.com/terraform/docs' } },
        { keywords: ['kubernetes', 'k8s'], suggest: { topic: 'Kubernetes', url: 'https://kubernetes.io/docs/' } },
        { keywords: ['docker', 'container'], suggest: { topic: 'Docker', url: 'https://docs.docker.com/' } },
    ];

    for (const { keywords, suggest } of topicMap) {
        if (keywords.some(k => text.includes(k))) {
            suggestions.push(suggest);
        }
    }

    return suggestions;
}
