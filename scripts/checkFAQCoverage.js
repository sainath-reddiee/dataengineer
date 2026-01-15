// scripts/checkFAQCoverage.js
/**
 * Diagnostic tool to check which articles will get FAQ schema
 * Run this to see FAQ coverage across your content
 */

import fetch from 'node-fetch';

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

// Simulate FAQ extraction logic
function hasFAQContent(content) {
    if (!content || !content.rendered) return false;

    const html = content.rendered;

    // Check for question patterns
    const questionPatterns = [
        /\?/g,
        /<h[23][^>]*>how\s+/gi,
        /<h[23][^>]*>what\s+/gi,
        /<h[23][^>]*>why\s+/gi,
        /<h[23][^>]*>when\s+/gi,
        /<h[23][^>]*>where\s+/gi,
        /<h[23][^>]*>can\s+/gi,
        /<h[23][^>]*>should\s+/gi,
        /<h[23][^>]*>is\s+/gi,
        /<h[23][^>]*>are\s+/gi,
        /<h[23][^>]*>do\s+/gi,
        /<h[23][^>]*>does\s+/gi
    ];

    return questionPatterns.some(pattern => pattern.test(html));
}

async function checkFAQCoverage() {
    console.log('🔍 Checking FAQ Coverage Across All Articles\n');

    try {
        // Fetch all posts
        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_fields=id,title,slug,content`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'FAQ-Coverage-Checker'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 400) break;
                throw new Error(`HTTP ${response.status}`);
            }

            const posts = await response.json();
            if (!Array.isArray(posts) || posts.length === 0) break;

            allPosts = allPosts.concat(posts);
            page++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`📊 Total Articles: ${allPosts.length}\n`);

        // Check each post for FAQ content
        const withFAQ = [];
        const withoutFAQ = [];

        allPosts.forEach(post => {
            if (hasFAQContent(post.content)) {
                withFAQ.push(post);
            } else {
                withoutFAQ.push(post);
            }
        });

        console.log(`✅ Articles WITH FAQ potential: ${withFAQ.length} (${Math.round(withFAQ.length / allPosts.length * 100)}%)`);
        console.log(`❌ Articles WITHOUT FAQ potential: ${withoutFAQ.length} (${Math.round(withoutFAQ.length / allPosts.length * 100)}%)\n`);

        // Show articles WITH FAQs
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ARTICLES WITH FAQ SCHEMA (Will show rich snippets)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        withFAQ.slice(0, 10).forEach((post, index) => {
            console.log(`${index + 1}. ${post.title.rendered}`);
            console.log(`   URL: https://dataengineerhub.blog/articles/${post.slug}\n`);
        });

        if (withFAQ.length > 10) {
            console.log(`   ... and ${withFAQ.length - 10} more\n`);
        }

        // Show articles WITHOUT FAQs
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ ARTICLES WITHOUT FAQ SCHEMA (Needs FAQ sections)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        withoutFAQ.slice(0, 10).forEach((post, index) => {
            console.log(`${index + 1}. ${post.title.rendered}`);
            console.log(`   URL: https://dataengineerhub.blog/articles/${post.slug}`);
            console.log(`   💡 Add FAQ section to enable rich snippets\n`);
        });

        if (withoutFAQ.length > 10) {
            console.log(`   ... and ${withoutFAQ.length - 10} more\n`);
        }

        // Recommendations
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 RECOMMENDATIONS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('1. ✅ GOOD NEWS: FAQ extraction is automatic for ALL articles');
        console.log('   - Works on existing articles');
        console.log('   - Works on new articles');
        console.log('   - No rebuild needed\n');

        console.log('2. 💡 TO IMPROVE COVERAGE:');
        console.log('   - Add FAQ sections to high-traffic articles');
        console.log('   - Use H2/H3 headings with questions');
        console.log('   - Format: "What is X?", "How do I Y?", etc.\n');

        console.log('3. 🎯 PRIORITY ARTICLES TO UPDATE:');
        console.log('   - Focus on articles WITHOUT FAQs');
        console.log('   - Start with top 10 by traffic');
        console.log('   - Add 3-5 FAQ questions per article\n');

        console.log('4. 📝 EXAMPLE FAQ SECTION:');
        console.log('   ```markdown');
        console.log('   ## Frequently Asked Questions');
        console.log('   ');
        console.log('   ### What is Snowflake cost optimization?');
        console.log('   Snowflake cost optimization involves...');
        console.log('   ');
        console.log('   ### How can I reduce my Snowflake bill?');
        console.log('   You can reduce costs by...');
        console.log('   ```\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkFAQCoverage();
