// scripts/generateLLMSitemap.js
// Generates LLM-friendly sitemap to help AI understand content context
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

// Manual overrides for questionAnswered — used when auto-generation produces poor results
const QUESTION_OVERRIDES = {
    'automation-in-data-engineering': 'How is automation transforming data engineering roles?',
    'why-i-stopped-using-snowflake-tasks-orchestration': 'Why should you avoid using Snowflake Tasks for orchestration?',
    'snowflake-cortex-code-cost-control-2026': 'How do you control Snowflake Cortex Code costs?',
    'snowflake-cortex-code-guide-real-examples': 'What is Snowflake Cortex Code and how do you use it?',
    'snowflake-cortex-code-dbt-optimization-guide': 'How can Snowflake Cortex Code optimize dbt build times?',
    'snowflake-cortex-cost-comparison': 'How much do Snowflake Cortex AI functions cost?',
    'snowflake-cortex-ai-complete-guide-2026': 'What is Snowflake Cortex AI and what can it do?',
    'snowpro-specialty-gen-ai-practice-exams': 'How do you prepare for the SnowPro Specialty Gen AI certification?',
    'snowflake-cortex-aisql-query-optimization-guide': 'How do you reduce Snowflake Cortex AI costs?',
    'snowflake-intelligence-guide-setup-optimization': 'How do you set up and optimize Snowflake Intelligence?',
    'snowflake-cost-optimization-techniques-2026': 'What are proven techniques to reduce your Snowflake bill?',
    'snowflake-query-optimization-guide-2026': 'What Snowflake query optimization techniques actually work?',
    'snowflake-interview-questions-answers-2026': 'What Snowflake interview questions should you prepare for?',
    'snowflake-dynamic-tables-complete-guide-2025': 'What are Snowflake Dynamic Tables and how do you use them?',
    'snowflake-hybrid-tables-unify-transactional-analytical-data': 'What are Snowflake Hybrid Tables?',
    'snowflake-unique-aggregations-hidden-functions': 'What are Snowflake hidden aggregation functions you should know?',
    'snowflake-optima-automatic-query-optimization-guide': 'What is Snowflake Optima and how does it optimize queries?',
    'open-semantic-interchange-snowflake-ai-problem-solved': 'What is Open Semantic Interchange and how does it help AI?',
    'star-schema-vs-snowflake-schema-comparison': 'What are the differences between star schema and snowflake schema?',
    'data-pipelines-python': 'How do you build Python data pipelines from APIs to Snowflake?',
    'snowflake-cortex-ai-financial-services': 'How is Snowflake Cortex AI used in financial services?',
    'snowflake-query-optimization-2025': 'What are effective Snowflake query optimization techniques?',
    'snowflake-merge-optimization-techniques': 'How do you optimize Snowflake MERGE queries?',
    'what-is-incremental-data-processing-a-data-engineers-guide': 'What is incremental data processing?',
    'how-i-passed-snowpro-gen-ai-certification-guide': 'How do you pass the SnowPro Gen AI certification exam?',
    'snowflake-data-science-agent-automate-ml-2025': 'What is the Snowflake Data Science Agent?',
    'meeting-notes-rag-snowflake-ai-assistant': 'How do you build a meeting notes RAG in Snowflake?',
    'load-data-into-snowflake': 'How do you load data into Snowflake?',
    'what-is-snowflake-guide': 'What is Snowflake and how does it work?',
    'aws-data-pipeline-cost-optimization-strategies': 'How do you optimize AWS data pipeline costs?',
    'advanced-snowflake-interview-questions-experienced': 'What advanced Snowflake interview questions should experienced engineers prepare for?',
    'snowflake-expert-interview-questions': 'What are the most important expert-level Snowflake interview questions?',
    'salesforce-copilot-custom-action-guide': 'How do you build a custom Salesforce Copilot action?',
    'build-data-lakehouse-on-azure': 'How do you build a data lakehouse on Azure?',
    'dynamic-data-masking-snowflake': 'How do you implement dynamic data masking in Snowflake?',
};

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
    // Helper: ensure string ends with exactly one ?
    const ensureQuestion = (s) => s.replace(/\?*$/, '?');

    // Check if title is already a question (starts with question word)
    if (/^(?:what|why|how|when|where|who|can|is|are|do|does)\s/i.test(title)) {
        return ensureQuestion(title);
    }

    // Find first H2/H3 that is a proper question (must end with ?)
    const questionMatch = content.match(/<h[2-3][^>]*>([^<]*\?)\s*<\/h[2-3]>/i);
    if (questionMatch) {
        const q = questionMatch[1].replace(/<[^>]+>/g, '').trim();
        if (q.length > 15 && q.length < 200) return q;
    }

    // Strip trailing year and any dangling preposition/punctuation
    const titleClean = title
        .replace(/\s*[-–—:,]?\s*\d{4}\s*$/, '')   // remove trailing year
        .replace(/\s+(?:in|for|of|from|by|on)\s*$/i, '')  // remove dangling preposition
        .replace(/\s*[-–—:,]\s*$/, '')              // remove trailing punctuation
        .trim();
    const cleanLower = titleClean.toLowerCase();

    // "How to" / "How I" patterns — already imperative
    if (/^how (?:to|i)\b/i.test(cleanLower)) {
        return ensureQuestion(titleClean);
    }

    // "Build/Create/Deploy" imperative patterns
    if (/^(?:build|create|deploy|design|master|automate|implement)\b/i.test(cleanLower)) {
        return `How do you ${titleClean.charAt(0).toLowerCase() + titleClean.slice(1)}?`;
    }

    // "vs" comparison patterns
    if (/\bvs\.?\b|\bversus\b/i.test(cleanLower)) {
        return `What are the differences between ${titleClean.replace(/\s*\bvs\.?\b\s*/i, ' and ')}?`;
    }

    // Certification/exam patterns
    if (/certif|exam/i.test(cleanLower)) {
        return `How do you prepare for the ${titleClean}?`;
    }

    // Interview questions patterns
    if (/interview\s*questions/i.test(cleanLower)) {
        return `What are the most important ${titleClean.toLowerCase()}?`;
    }

    // Guide/tutorial patterns
    if (/guide|tutorial|getting started|introduction|intro\b/i.test(cleanLower)) {
        return `What does the ${titleClean} cover?`;
    }

    // Setup/configure/install patterns
    if (/setup|configure|install/i.test(cleanLower)) {
        return `How do you ${titleClean.toLowerCase()}?`;
    }

    // Best practices / tips / optimization / techniques
    if (/optimization|tuning|techniques|best practices|tips|strategies|proven/i.test(cleanLower)) {
        return `What are the key ${titleClean.toLowerCase()}?`;
    }

    // "X Explained" / "Understanding X" patterns
    if (/explained|breakdown|deep dive|overview/i.test(cleanLower)) {
        return `What is ${titleClean.replace(/[-–—:]?\s*(?:explained|a simple breakdown|deep dive|overview)\s*/gi, '').trim()}?`;
    }

    // Default: simple "What is X?"
    return `What is ${titleClean}?`;
}

/** Decode HTML entities that WordPress REST API returns pre-encoded
 *  (e.g. &amp; for &, &#8217; for right single quote). */
function decodeHtmlEntities(str) {
    if (!str) return '';
    return String(str)
        .replace(/&nbsp;/g, ' ')
        .replace(/&hellip;/g, '...')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');  // must be last
}

// Strip HTML tags and decode entities
function stripHTML(html) {
    return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
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
                questionAnswered: QUESTION_OVERRIDES[post.slug] || extractQuestionAnswered(stripHTML(title), content),
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
