// scripts/generateLLMSitemap.js
// Generates LLM-friendly sitemap to help AI understand content context
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

// Fetch all posts with full content
async function fetchAllPosts() {
    try {
        console.log('📡 Fetching posts for LLM sitemap...');

        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_embed`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-LLM-Sitemap-Generator'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 400) {
                    hasMore = false;
                    break;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const posts = await response.json();

            if (!Array.isArray(posts) || posts.length === 0) {
                hasMore = false;
                break;
            }

            allPosts = allPosts.concat(posts);
            console.log(`✅ Fetched page ${page} (${posts.length} posts)`);
            page++;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Total posts fetched: ${allPosts.length}`);
        return allPosts;
    } catch (error) {
        console.error('❌ Error fetching posts:', error.message);
        return [];
    }
}

// Extract key facts from content
function extractKeyFacts(content) {
    const facts = [];

    // Extract statistics
    const stats = content.match(/\d+(?:\.\d+)?%|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|MB|GB|TB|ms|seconds?|minutes?)/gi) || [];
    facts.push(...stats.slice(0, 3));

    // Extract strong statements (sentences with "is", "are", "means")
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20 && s.trim().length < 200);
    const definitions = sentences.filter(s => /(?:is|are|means?|refers? to)\s+/i.test(s)).slice(0, 2);
    facts.push(...definitions.map(d => d.trim()));

    return facts.slice(0, 5); // Max 5 facts
}

// Extract entities (technologies, tools, brands)
function extractEntities(content) {
    const entityPatterns = [
        /\b(?:Snowflake|AWS|Azure|GCP|Python|SQL|dbt|Airflow|Databricks|Kafka|Spark|Redshift|BigQuery|Tableau|Power BI|Docker|Kubernetes)\b/gi,
    ];

    let entities = [];
    entityPatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        entities = entities.concat(matches);
    });

    // Remove duplicates and limit
    return [...new Set(entities.map(e => e.toLowerCase()))].slice(0, 10);
}

// Extract first question from content
function extractQuestionAnswered(title, content) {
    // Check if title is a question
    if (/^(?:what|why|how|when|where|who|can|is|are|do|does)\s/i.test(title)) {
        return title;
    }

    // Find first H2/H3 question
    const questionMatch = content.match(/<h[2-3][^>]*>([^<]*\?[^<]*)<\/h[2-3]>/i);
    if (questionMatch) {
        return questionMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Generate from title
    return `How to ${title.toLowerCase()}`;
}

// Strip HTML tags
function stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Generate summary from content
function generateSummary(content, excerpt) {
    if (excerpt) {
        const clean = stripHTML(excerpt);
        if (clean.length > 50 && clean.length < 300) {
            return clean;
        }
    }

    // Extract first paragraph
    const firstPara = content.match(/<p[^>]*>([^<]+)<\/p>/i);
    if (firstPara) {
        const clean = stripHTML(firstPara[1]);
        if (clean.length > 50) {
            return clean.substring(0, 250) + '...';
        }
    }

    return 'Expert tutorial on data engineering best practices.';
}

// Main function
async function generateLLMSitemap() {
    console.log('🤖 Starting LLM-friendly sitemap generation...\n');

    try {
        const posts = await fetchAllPosts();

        if (posts.length === 0) {
            // Check if we have an existing sitemap to use
            const publicDir = path.join(__dirname, '..', 'public');
            const llmSitemapPath = path.join(publicDir, 'llm-sitemap.json');

            if (fs.existsSync(llmSitemapPath)) {
                console.log('⚠️  WordPress API unavailable, but existing LLM sitemap found');
                console.log('✅ Using cached sitemap - build can continue');
                return;
            }

            throw new Error('No posts fetched and no cached sitemap available');
        }

        // Build LLM sitemap structure
        const llmSitemap = {
            site: 'dataengineerhub.blog',
            description: 'Expert tutorials and guides on Snowflake, dbt, Airflow, data engineering, and analytics engineering',
            audience: 'Data Engineers, Analytics Engineers, Data Architects, Data Scientists',
            topics: ['Snowflake', 'dbt', 'Airflow', 'Data Engineering', 'Analytics Engineering', 'Data Warehousing', 'ETL/ELT'],
            lastUpdated: new Date().toISOString().split('T')[0],
            totalArticles: posts.length,
            pages: []
        };

        console.log('📝 Processing articles...');

        posts.forEach((post, index) => {
            const content = post.content?.rendered || '';
            const excerpt = post.excerpt?.rendered || '';
            const title = post.title?.rendered || 'Untitled';

            // Extract author info
            let authorName = 'Satya Sainath';
            let authorExpertise = 'Data Engineering Expert';
            if (post._embedded && post._embedded.author && post._embedded.author[0]) {
                authorName = post._embedded.author[0].name || authorName;
            }

            const pageData = {
                url: `${SITE_URL}/articles/${post.slug}`,
                title: stripHTML(title),
                summary: generateSummary(content, excerpt),
                keyFacts: extractKeyFacts(stripHTML(content)),
                entities: extractEntities(stripHTML(content)),
                questionAnswered: extractQuestionAnswered(stripHTML(title), content),
                lastUpdated: post.modified ? post.modified.split('T')[0] : post.date.split('T')[0],
                published: post.date.split('T')[0],
                author: authorName,
                expertise: authorExpertise,
                category: post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0][0]
                    ? post._embedded['wp:term'][0][0].name
                    : 'Data Engineering',
                wordCount: stripHTML(content).split(/\s+/).length
            };

            llmSitemap.pages.push(pageData);

            if ((index + 1) % 10 === 0) {
                console.log(`   Processed ${index + 1}/${posts.length} articles...`);
            }
        });

        console.log(`✅ Processed all ${posts.length} articles\n`);

        // Write to file
        const publicDir = path.join(__dirname, '..', 'public');
        const llmSitemapPath = path.join(publicDir, 'llm-sitemap.json');

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(llmSitemapPath, JSON.stringify(llmSitemap, null, 2), 'utf8');

        console.log('✅ LLM sitemap generated successfully!');
        console.log(`📍 Location: ${llmSitemapPath}`);
        console.log(`📊 Total articles: ${llmSitemap.pages.length}`);
        console.log(`🔗 Access at: ${SITE_URL}/llm-sitemap.json`);
        console.log('\n💡 This sitemap helps AI systems:');
        console.log('   ✓ Understand article context and purpose');
        console.log('   ✓ Extract key facts for citations');
        console.log('   ✓ Identify relevant entities and topics');
        console.log('   ✓ Match content to user questions');
        console.log('   ✓ Assess author expertise and freshness');

        return llmSitemap;
    } catch (error) {
        console.error('\n❌ Error generating LLM sitemap:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateLLMSitemap();
