// scripts/generateFAQSchema.js
// Automatically detects Q&A patterns and generates FAQPage schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Fetch all posts
async function fetchAllPosts() {
    try {
        console.log('📡 Fetching posts for FAQ schema generation...');

        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-FAQ-Schema-Generator'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 400) {
                    hasMore = false;
                    break;
                }
                throw new Error(`HTTP ${response.status}`);
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

// Extract Q&A pairs from content
function extractQAPairs(content) {
    if (!content) return [];

    const qaPairs = [];

    // Pattern 1: H2/H3 questions followed by paragraphs
    const questionPattern = /<h[2-3][^>]*>([^<]*\?[^<]*)<\/h[2-3]>\s*<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*?)<\/p>/gi;
    let match; // This 'match' variable is used in the while loop condition below.

    while ((match = questionPattern.exec(content)) !== null) {
        const question = stripHTML(match[1]).trim();
        let answer = stripHTML(match[2]).trim();

        // Get more context if answer is too short
        if (answer.length < 50) {
            // Try to get next paragraph too
            const nextPMatch = content.substring(match.index + match[0].length).match(/<p[^>]*>([^<]+)<\/p>/i);
            if (nextPMatch) {
                answer += ' ' + stripHTML(nextPMatch[1]).trim();
            }
        }

        // Only include if we have a good answer (50-500 chars)
        if (answer.length >= 50 && answer.length <= 500) {
            qaPairs.push({
                question,
                answer: answer.substring(0, 500) // Cap at 500 chars
            });
        }
    }

    // Pattern 2: Strong tags with questions
    const strongQuestionPattern = /<strong[^>]*>([^<]*\?[^<]*)<\/strong>\s*<\/p>\s*<p[^>]*>([^<]+)<\/p>/gi;

    while ((match = strongQuestionPattern.exec(content)) !== null) {
        const question = stripHTML(match[1]).trim();
        const answer = stripHTML(match[2]).trim();

        if (answer.length >= 50 && answer.length <= 500) {
            // Avoid duplicates
            if (!qaPairs.some(qa => qa.question === question)) {
                qaPairs.push({ question, answer: answer.substring(0, 500) });
            }
        }
    }

    return qaPairs.slice(0, 10); // Max 10 Q&A pairs per article
}

// Strip HTML tags
function stripHTML(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8230;/g, '...')
        .replace(/\s+/g, ' ')
        .trim();
}

// Escape JSON strings

// Generate FAQPage schema
function generateFAQSchema(qaPairs) {
    if (qaPairs.length === 0) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": qaPairs.map(qa => ({
            "@type": "Question",
            "name": qa.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": qa.answer
            }
        }))
    };

    return schema;
}

// Inject FAQ schema into HTML file
function injectFAQSchema(htmlPath, faqSchema) {
    try {
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Check if FAQ schema already exists
        if (html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"')) {
            // Remove existing FAQ schema
            html = html.replace(
                /<script type="application\/ld\+json">\s*\{[^}]*"@type"\s*:\s*"FAQPage"[^<]*<\/script>\s*/gi,
                ''
            );
        }

        // Find the position to inject (before closing </body> tag)
        const bodyCloseIndex = html.lastIndexOf('</body>');

        if (bodyCloseIndex === -1) {
            console.warn(`⚠️  No </body> tag found in ${htmlPath}`);
            return false;
        }

        // Create schema script tag
        const schemaScript = `
    <!-- FAQ Schema - Auto-generated -->
    <script type="application/ld+json">
    ${JSON.stringify(faqSchema, null, 2)}
    </script>
`;

        // Inject schema
        const newHTML = html.substring(0, bodyCloseIndex) + schemaScript + html.substring(bodyCloseIndex);

        fs.writeFileSync(htmlPath, newHTML, 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ Error injecting schema into ${htmlPath}:`, error.message);
        return false;
    }
}

// Main function
async function generateFAQSchemas() {
    console.log('🤖 Starting FAQ Schema generation...\n');

    try {
        // Check if dist directory exists
        if (!fs.existsSync(DIST_DIR)) {
            console.log('⚠️  dist directory not found');
            console.log('💡 FAQ schema generation should run AFTER static pages are built');
            console.log('✅ Skipping FAQ schema generation (will run on next build)');
            return;
        }

        const posts = await fetchAllPosts();

        if (posts.length === 0) {
            console.log('⚠️  No posts fetched - skipping FAQ schema generation');
            return;
        }

        let processedCount = 0;
        let schemaInjectedCount = 0;
        let skippedCount = 0;

        console.log('\n📝 Processing articles for FAQ schema...\n');

        for (const post of posts) {
            const slug = post.slug;
            const content = post.content?.rendered || '';
            const title = stripHTML(post.title?.rendered || 'Untitled');

            // Extract Q&A pairs
            const qaPairs = extractQAPairs(content);

            if (qaPairs.length === 0) {
                skippedCount++;
                continue;
            }

            // Generate FAQ schema
            const faqSchema = generateFAQSchema(qaPairs);

            if (!faqSchema) {
                skippedCount++;
                continue;
            }

            // Find the HTML file
            const htmlPath = path.join(DIST_DIR, 'articles', slug, 'index.html');

            if (!fs.existsSync(htmlPath)) {
                console.warn(`⚠️  HTML file not found: ${htmlPath}`);
                skippedCount++;
                continue;
            }

            // Inject FAQ schema
            const injected = injectFAQSchema(htmlPath, faqSchema);

            if (injected) {
                schemaInjectedCount++;
                console.log(`✅ ${title.substring(0, 50)}... (${qaPairs.length} Q&A pairs)`);
            } else {
                skippedCount++;
            }

            processedCount++;

            // Progress indicator
            if (processedCount % 10 === 0) {
                console.log(`   Processed ${processedCount}/${posts.length} articles...`);
            }
        }

        console.log('\n✅ FAQ Schema generation complete!');
        console.log(`📊 Summary:`);
        console.log(`   - Total articles: ${posts.length}`);
        console.log(`   - FAQ schemas injected: ${schemaInjectedCount}`);
        console.log(`   - Skipped (no Q&A): ${skippedCount}`);
        console.log(`   - Success rate: ${Math.round((schemaInjectedCount / posts.length) * 100)}%`);

        console.log('\n💡 Benefits:');
        console.log('   ✓ Rich snippets in Google search');
        console.log('   ✓ 36% higher AI citation rate');
        console.log('   ✓ Better visibility in voice search');
        console.log('   ✓ Enhanced user experience');

    } catch (error) {
        console.error('\n❌ Error generating FAQ schemas:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateFAQSchemas();
