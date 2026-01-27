/**
 * Sync Articles from WordPress
 * 
 * Fetches articles from WordPress REST API and generates a JSON file
 * for the pSEO linking engine. Runs as part of the build process.
 * 
 * Usage:
 *   node scripts/sync-articles-for-linking.js
 * 
 * Output:
 *   src/data/pseo/articles.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'pseo');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'articles.json');

// WordPress API config
const WP_API_BASE = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const PER_PAGE = 100;

/**
 * Fetch all posts from WordPress REST API
 */
async function fetchAllPosts() {
    const allPosts = [];
    let page = 1;
    let hasMore = true;

    console.log('📡 Fetching articles from WordPress...\n');

    while (hasMore) {
        const url = `${WP_API_BASE}/posts?per_page=${PER_PAGE}&page=${page}&_fields=id,slug,title,categories,tags,excerpt`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 400) {
                    // No more pages
                    hasMore = false;
                    continue;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const posts = await response.json();

            if (posts.length === 0) {
                hasMore = false;
            } else {
                allPosts.push(...posts);
                console.log(`   Page ${page}: ${posts.length} posts`);
                page++;
            }
        } catch (error) {
            console.error(`   ❌ Error fetching page ${page}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`\n✅ Total posts fetched: ${allPosts.length}\n`);
    return allPosts;
}

/**
 * Fetch category and tag names for ID mapping
 */
async function fetchTaxonomies() {
    const categories = {};
    const tags = {};

    try {
        // Fetch categories
        const catResponse = await fetch(`${WP_API_BASE}/categories?per_page=100&_fields=id,name,slug`);
        if (catResponse.ok) {
            const cats = await catResponse.json();
            cats.forEach(c => { categories[c.id] = { name: c.name, slug: c.slug }; });
        }

        // Fetch tags
        const tagResponse = await fetch(`${WP_API_BASE}/tags?per_page=100&_fields=id,name,slug`);
        if (tagResponse.ok) {
            const tgs = await tagResponse.json();
            tgs.forEach(t => { tags[t.id] = { name: t.name, slug: t.slug }; });
        }
    } catch (error) {
        console.error('⚠️  Error fetching taxonomies:', error.message);
    }

    return { categories, tags };
}

/**
 * Extract keywords from post data
 */
function extractKeywords(post, categoryMap, tagMap) {
    const keywords = [];

    // Clean title (remove HTML entities)
    const title = post.title?.rendered
        ?.replace(/&amp;/g, '&')
        ?.replace(/&#8211;/g, '-')
        ?.replace(/&#8217;/g, "'")
        ?.replace(/<[^>]+>/g, '') || '';

    // Add title-based keywords
    if (title.length > 0 && title.length < 60) {
        keywords.push(title);
    }

    // Add tag names as keywords (best for matching)
    (post.tags || []).forEach(tagId => {
        const tag = tagMap[tagId];
        if (tag?.name) {
            keywords.push(tag.name);
        }
    });

    // Extract key phrases from title
    const titleKeywords = extractPhrases(title);
    keywords.push(...titleKeywords);

    // Deduplicate and filter
    return [...new Set(keywords)]
        .filter(k => k.length >= 3 && k.length <= 50)
        .slice(0, 8); // Max 8 keywords per article
}

/**
 * Extract meaningful phrases from text
 */
function extractPhrases(text) {
    const phrases = [];

    // Common patterns: "X vs Y", "What is X", "How to X"
    const vsMatch = text.match(/(\w+)\s+vs\.?\s+(\w+)/i);
    if (vsMatch) {
        phrases.push(`${vsMatch[1]} vs ${vsMatch[2]}`);
        phrases.push(vsMatch[1]);
        phrases.push(vsMatch[2]);
    }

    const whatIsMatch = text.match(/what is (\w+[\s\w]*)/i);
    if (whatIsMatch) phrases.push(whatIsMatch[1].trim());

    const howToMatch = text.match(/how to (\w+[\s\w]*)/i);
    if (howToMatch) phrases.push(howToMatch[1].trim());

    // Tool names (common data engineering tools)
    const tools = ['Snowflake', 'dbt', 'Airflow', 'Spark', 'Databricks', 'BigQuery',
        'Redshift', 'Kafka', 'Flink', 'Fivetran', 'Airbyte', 'Dagster',
        'Prefect', 'dbt Cloud', 'AWS Glue', 'Azure Data Factory'];
    tools.forEach(tool => {
        if (text.toLowerCase().includes(tool.toLowerCase())) {
            phrases.push(tool);
        }
    });

    return phrases;
}

/**
 * Main sync function
 */
async function syncArticles() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Sync WordPress Articles for pSEO Linking           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Fetch data
    const [posts, { categories, tags }] = await Promise.all([
        fetchAllPosts(),
        fetchTaxonomies()
    ]);

    if (posts.length === 0) {
        console.log('⚠️  No posts found. Check WordPress API.');
        return;
    }

    // Transform posts to linking format
    const articles = posts.map(post => {
        const title = post.title?.rendered
            ?.replace(/&amp;/g, '&')
            ?.replace(/&#8211;/g, '-')
            ?.replace(/&#8217;/g, "'")
            ?.replace(/<[^>]+>/g, '') || post.slug;

        return {
            slug: post.slug,
            title: title,
            keywords: extractKeywords(post, categories, tags),
            categories: (post.categories || []).map(id => categories[id]?.slug).filter(Boolean),
        };
    }).filter(a => a.keywords.length > 0); // Only include articles with keywords

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2));

    console.log('📊 Results:');
    console.log(`   Total articles:    ${articles.length}`);
    console.log(`   With keywords:     ${articles.filter(a => a.keywords.length > 0).length}`);
    console.log(`   Output file:       ${OUTPUT_FILE}`);
    console.log('\n✅ Sync complete! Articles ready for pSEO linking.\n');

    // Show sample
    console.log('📝 Sample output:');
    console.log(JSON.stringify(articles.slice(0, 2), null, 2));
}

syncArticles().catch(console.error);
