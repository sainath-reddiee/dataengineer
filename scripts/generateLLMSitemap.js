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

// Extract key facts from content - returns contextual sentences, not raw numbers
function extractKeyFacts(content) {
    const facts = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 250);

    // 1. Sentences containing statistics WITH their context
    const statSentences = sentences.filter(s =>
        /\d+(?:\.\d+)?%|\d+(?:,\d{3})+|\d+x\b/i.test(s) &&
        /(?:reduce|improve|increase|save|cut|boost|faster|slower|more|less|compared|versus|over|under)/i.test(s)
    );
    facts.push(...statSentences.slice(0, 2).map(s => s.trim()));

    // 2. Definitional sentences (what something IS)
    const definitions = sentences.filter(s =>
        /(?:^|\s)(?:is a|is an|is the|are the|refers to|means|defined as|essentially)\s/i.test(s) &&
        !facts.includes(s.trim())
    );
    facts.push(...definitions.slice(0, 2).map(s => s.trim()));

    // 3. Key recommendation sentences
    const recommendations = sentences.filter(s =>
        /(?:best practice|recommend|should|always|never|important|critical|key takeaway|pro tip)/i.test(s) &&
        !facts.includes(s.trim())
    );
    facts.push(...recommendations.slice(0, 1).map(s => s.trim()));

    return facts.slice(0, 5);
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

// Extract the primary question this article answers
function extractQuestionAnswered(title, content) {
    // Check if title is already a question
    if (/^(?:what|why|how|when|where|who|can|is|are|do|does)\s/i.test(title)) {
        return title;
    }

    // Find first H2/H3 that is a question
    const questionMatch = content.match(/<h[2-3][^>]*>([^<]*\?[^<]*)<\/h[2-3]>/i);
    if (questionMatch) {
        return questionMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Generate a natural question from the title based on content type
    const cleanTitle = title.toLowerCase().trim();

    // Tutorial/guide patterns
    if (/guide|tutorial|getting started|introduction|intro\b/i.test(cleanTitle)) {
        return `What is ${title.replace(/[-:]?\s*(?:complete |ultimate |comprehensive )?(?:guide|tutorial|intro\w*)\s*(?:for\s+)?\d{0,4}\s*$/i, '').trim()} and how do you use it?`;
    }

    // "How to" patterns
    if (/how to|setup|configure|install|implement|build|create|deploy/i.test(cleanTitle)) {
        return title.endsWith('?') ? title : `${title}?`;
    }

    // "vs" comparison patterns
    if (/\bvs\.?\b|\bversus\b|\bcompared?\b/i.test(cleanTitle)) {
        return `${title} - which should you choose?`;
    }

    // Certification/exam patterns
    if (/certif|exam|pass/i.test(cleanTitle)) {
        return `How do you prepare for and pass the ${title.replace(/[-:]?\s*(?:guide|tips)\s*\d{0,4}\s*$/i, '').trim()}?`;
    }

    // Default: wrap as "What is" or "How does X work"
    if (/optimization|tuning|techniques|best practices|tips/i.test(cleanTitle)) {
        return `What are the best ${title.replace(/\d{4}\s*$/,'').trim().toLowerCase()}?`;
    }

    return `What is ${title.replace(/\d{4}\s*$/,'').trim()} and how does it work?`;
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
