// scripts/optimizeForAICitation.js
// Analyzes articles and generates optimization recommendations for AI citations
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const REPORT_FILE = path.join(__dirname, '..', 'citation-optimization-report.json');

// Fetch all posts
async function fetchAllPosts() {
    try {
        console.log('📡 Fetching posts for optimization analysis...');

        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-Optimization-Analyzer'
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

        console.log(`✅ Total posts fetched: ${allPosts.length}\n`);
        return allPosts;
    } catch (error) {
        console.warn('⚠️  WordPress API unavailable:', error.message);
        console.log('💡 Attempting to use LLM sitemap data as fallback...\n');

        // Fallback: Use LLM sitemap data
        const llmSitemapPath = path.join(__dirname, '..', 'public', 'llm-sitemap.json');
        if (fs.existsSync(llmSitemapPath)) {
            const llmData = JSON.parse(fs.readFileSync(llmSitemapPath, 'utf8'));
            console.log(`✅ Loaded ${llmData.pages.length} articles from LLM sitemap\n`);

            // Convert LLM sitemap format to WordPress post format
            return llmData.pages.map(page => ({
                slug: page.url.split('/').pop(),
                title: { rendered: page.title },
                content: { rendered: `<p>${page.summary}</p>` }, // Limited content
                modified: page.lastUpdated,
                date: page.published
            }));
        }

        console.error('❌ No fallback data available');
        return [];
    }
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

// Analyze article for AI citation optimization
function analyzeArticle(post) {
    const content = post.content?.rendered || '';
    const title = stripHTML(post.title?.rendered || 'Untitled');
    const plainContent = stripHTML(content);

    const recommendations = [];
    const issues = [];
    const strengths = [];
    let score = 100;

    // 1. Check for TL;DR / Summary
    const hasTLDR = /(?:^|\n|<p>)(TL;?DR|Summary|Key Takeaways?|In Brief)[:;.\s]/i.test(content);
    if (!hasTLDR) {
        score -= 15;
        issues.push('Missing TL;DR summary');
        recommendations.push({
            priority: 'HIGH',
            type: 'TL;DR',
            issue: 'No TL;DR or summary section found',
            action: 'Add a "TL;DR:" section at the start with 2-3 key sentences (40-60 words)',
            impact: 'AI systems extract opening summaries for quick answers',
            example: 'TL;DR: This guide shows you how to reduce Snowflake costs by 40% using warehouse optimization, auto-suspend settings, and clustering strategies.'
        });
    } else {
        strengths.push('Has TL;DR summary');
    }

    // 2. Check for statistics and numbers
    const statPatterns = [
        /\d+(?:\.\d+)?%/g,
        /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|MB|GB|TB|ms|seconds?|minutes?|hours?)/gi,
        /\$\d+(?:,\d{3})*(?:\.\d+)?/gi
    ];

    let allStats = [];
    statPatterns.forEach(pattern => {
        const matches = plainContent.match(pattern) || [];
        allStats = allStats.concat(matches);
    });
    const uniqueStats = [...new Set(allStats)];

    if (uniqueStats.length < 3) {
        score -= 10;
        issues.push(`Only ${uniqueStats.length} statistics found`);
        recommendations.push({
            priority: 'MEDIUM',
            type: 'Statistics',
            issue: `Only ${uniqueStats.length} statistics/numbers found`,
            action: 'Add 3-5 specific statistics, percentages, or benchmarks',
            impact: 'AI loves citing specific data - increases citation rate by 25%',
            example: '"Reduces costs by 40%", "$30,000/month average", "Processes 1M rows in 30 seconds"'
        });
    } else if (uniqueStats.length >= 5) {
        strengths.push(`${uniqueStats.length} statistics (excellent)`);
    }

    // 3. Check for data tables
    const tables = (content.match(/<table/gi) || []).length;
    if (tables === 0) {
        score -= 8;
        issues.push('No data tables');
        recommendations.push({
            priority: 'MEDIUM',
            type: 'Data Tables',
            issue: 'No comparison or data tables found',
            action: 'Add 1-2 tables comparing tools, features, or performance metrics',
            impact: 'AI can directly cite structured data from tables',
            example: 'Create a comparison table: Tool | Cost | Performance | Use Case'
        });
    } else {
        strengths.push(`${tables} table(s)`);
    }

    // 4. Check for "Last Updated" date
    const hasLastUpdated = /(?:last |recently )?updated:?\s*(?:on\s*)?(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i.test(content);
    if (!hasLastUpdated) {
        score -= 12;
        issues.push('Missing "Last Updated" date');
        recommendations.push({
            priority: 'HIGH',
            type: 'Freshness',
            issue: 'No visible "Last Updated" date',
            action: 'Add "Last Updated: January 16, 2026" at the top or bottom of article',
            impact: 'Recent content gets 2x more AI citations - freshness is critical',
            example: 'Add after title: "Last Updated: January 16, 2026"'
        });
    } else {
        strengths.push('Has Last Updated date');
    }

    // 5. Check for FAQ section or Q&A format
    const questionCount = (content.match(/<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>/gi) || []).length;

    if (questionCount === 0) {
        score -= 15;
        issues.push('No Q&A format');
        recommendations.push({
            priority: 'HIGH',
            type: 'FAQ Section',
            issue: 'No question-based headings or FAQ section',
            action: 'Add a "Frequently Asked Questions" section with 3-5 common questions',
            impact: 'Enables FAQ schema + 36% higher AI citation rate',
            example: 'Add section: "What is the best way to...?", "How do I...?", "When should I...?"'
        });
    } else if (questionCount < 3) {
        score -= 8;
        issues.push(`Only ${questionCount} question(s)`);
        recommendations.push({
            priority: 'MEDIUM',
            type: 'FAQ Section',
            issue: `Only ${questionCount} question heading(s) found`,
            action: 'Add 2-3 more question-based headings',
            impact: 'More questions = more FAQ schema entries = more citations',
            example: 'Convert headings to questions: "Best Practices" → "What are the best practices?"'
        });
    } else {
        strengths.push(`${questionCount} question headings`);
    }

    // 6. Check for external authority links
    const externalLinks = content.match(/<a[^>]+href=["']https?:\/\/(?!dataengineerhub)[^"']+["']/gi) || [];
    const authorityDomains = externalLinks.filter(link =>
        /docs\.snowflake|aws\.amazon|cloud\.google|microsoft\.com|github\.com|wikipedia\.org|arxiv\.org/i.test(link)
    );

    if (authorityDomains.length === 0) {
        score -= 10;
        issues.push('No authority citations');
        recommendations.push({
            priority: 'MEDIUM',
            type: 'Citations',
            issue: 'No links to authoritative sources',
            action: 'Add 2-3 links to official documentation or research',
            impact: 'E-E-A-T signals - builds trust with AI systems',
            example: 'Link to: Snowflake docs, AWS documentation, research papers, Wikipedia'
        });
    } else if (authorityDomains.length < 3) {
        score -= 5;
        issues.push(`Only ${authorityDomains.length} authority link(s)`);
    } else {
        strengths.push(`${authorityDomains.length} authority citations`);
    }

    // 7. Check content length
    const wordCount = plainContent.split(/\s+/).length;
    if (wordCount < 800) {
        score -= 10;
        issues.push('Content too short');
        recommendations.push({
            priority: 'MEDIUM',
            type: 'Content Length',
            issue: `Only ${wordCount} words (minimum 800 recommended)`,
            action: 'Expand content with more examples, use cases, or detailed explanations',
            impact: 'Longer, comprehensive content gets cited more often',
            example: 'Add code examples, real-world scenarios, or troubleshooting tips'
        });
    } else if (wordCount >= 1500) {
        strengths.push(`${wordCount} words (comprehensive)`);
    }

    // 8. Check for code examples
    const codeBlocks = (content.match(/<pre|<code/gi) || []).length;
    if (codeBlocks === 0 && /snowflake|sql|python|javascript|data/i.test(title)) {
        score -= 8;
        issues.push('No code examples');
        recommendations.push({
            priority: 'LOW',
            type: 'Code Examples',
            issue: 'Technical article without code examples',
            action: 'Add 2-3 code snippets showing implementation',
            impact: 'Code examples make content more actionable and citable',
            example: 'Add SQL queries, Python scripts, or configuration examples'
        });
    } else if (codeBlocks >= 3) {
        strengths.push(`${codeBlocks} code examples`);
    }

    // Calculate final score (0-100)
    score = Math.max(0, Math.min(100, score));

    return {
        title,
        slug: post.slug,
        url: `https://dataengineerhub.blog/articles/${post.slug}`,
        score,
        wordCount,
        statistics: uniqueStats.length,
        tables,
        questions: questionCount,
        externalLinks: externalLinks.length,
        authorityLinks: authorityDomains.length,
        codeBlocks,
        hasTLDR,
        hasLastUpdated,
        issues,
        strengths,
        recommendations: recommendations.sort((a, b) => {
            const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return priority[a.priority] - priority[b.priority];
        }),
        lastModified: post.modified || post.date
    };
}

// Main function
async function generateOptimizationReport() {
    console.log('🤖 Starting AI Citation Optimization Analysis...\n');

    try {
        const posts = await fetchAllPosts();

        if (posts.length === 0) {
            console.log('⚠️  No posts fetched - cannot generate report');
            return;
        }

        console.log('📊 Analyzing articles for AI citation optimization...\n');

        const analyses = [];
        let processedCount = 0;

        for (const post of posts) {
            const analysis = analyzeArticle(post);
            analyses.push(analysis);
            processedCount++;

            if (processedCount % 10 === 0) {
                console.log(`   Analyzed ${processedCount}/${posts.length} articles...`);
            }
        }

        // Sort by score (lowest first - needs most work)
        analyses.sort((a, b) => a.score - b.score);

        // Generate summary statistics
        const summary = {
            totalArticles: analyses.length,
            averageScore: Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length),
            articlesNeedingWork: analyses.filter(a => a.score < 70).length,
            articlesExcellent: analyses.filter(a => a.score >= 85).length,
            commonIssues: {},
            generatedAt: new Date().toISOString()
        };

        // Count common issues
        analyses.forEach(a => {
            a.issues.forEach(issue => {
                summary.commonIssues[issue] = (summary.commonIssues[issue] || 0) + 1;
            });
        });

        // Create report
        const report = {
            summary,
            topPriorities: analyses.slice(0, 10).map(a => ({
                title: a.title,
                url: a.url,
                score: a.score,
                topRecommendations: a.recommendations.slice(0, 3)
            })),
            allArticles: analyses
        };

        // Write report to file
        fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

        console.log('\n✅ Optimization report generated successfully!');
        console.log(`📍 Location: ${REPORT_FILE}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total articles analyzed: ${summary.totalArticles}`);
        console.log(`   - Average optimization score: ${summary.averageScore}/100`);
        console.log(`   - Articles needing work (<70): ${summary.articlesNeedingWork}`);
        console.log(`   - Excellent articles (≥85): ${summary.articlesExcellent}`);

        console.log(`\n🔥 Most Common Issues:`);
        Object.entries(summary.commonIssues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([issue, count]) => {
                console.log(`   - ${issue}: ${count} articles`);
            });

        console.log(`\n🎯 Top 5 Articles Needing Optimization:`);
        analyses.slice(0, 5).forEach((a, i) => {
            console.log(`   ${i + 1}. ${a.title.substring(0, 50)}... (Score: ${a.score}/100)`);
        });

        console.log(`\n💡 Next Steps:`);
        console.log(`   1. Review citation-optimization-report.json`);
        console.log(`   2. Start with top 10 priority articles`);
        console.log(`   3. Implement HIGH priority recommendations first`);
        console.log(`   4. Re-run analysis after updates to track progress`);

    } catch (error) {
        console.error('\n❌ Error generating optimization report:', error.message);
        process.exit(1);
    }
}

// Run the analyzer
generateOptimizationReport();
