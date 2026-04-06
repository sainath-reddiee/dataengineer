// scripts/generateLLMSFull.js
// Generates llms-full.txt - a deep content index for AI systems
// This is the expanded version of llms.txt with per-article details
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

function stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchAllPosts() {
    try {
        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_embed`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-LLMSFull-Generator'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 400) { hasMore = false; break; }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const posts = await response.json();
            if (!Array.isArray(posts) || posts.length === 0) { hasMore = false; break; }
            allPosts = allPosts.concat(posts);
            page++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return allPosts;
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        return [];
    }
}

function extractHeadings(content) {
    const headings = [];
    const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
        headings.push(stripHTML(match[2]));
    }
    return headings;
}

function extractFirstParagraphs(content, count = 2) {
    const paragraphs = [];
    const regex = /<p[^>]*>(.*?)<\/p>/gi;
    let match;
    while ((match = regex.exec(content)) !== null && paragraphs.length < count) {
        const text = stripHTML(match[1]);
        if (text.length > 40) {
            paragraphs.push(text);
        }
    }
    return paragraphs;
}

function generateLLMSFull(posts) {
    const now = new Date().toISOString().split('T')[0];

    // Sort by date descending
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by category
    const byCategory = {};
    sorted.forEach(post => {
        const cat = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Data Engineering';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(post);
    });

    let output = `# DataEngineer Hub - Full Content Index for LLMs
> Last generated: ${now}
> Total articles: ${posts.length}
> Source: https://dataengineerhub.blog
> Compact version: https://dataengineerhub.blog/llms.txt
> Structured data: https://dataengineerhub.blog/llm-sitemap.json

This file provides a comprehensive content index designed for large language models.
Each article includes its URL, summary, key headings, and primary topics.

---

`;

    for (const [category, catPosts] of Object.entries(byCategory)) {
        output += `## ${category} (${catPosts.length} articles)\n\n`;

        catPosts.forEach(post => {
            const title = stripHTML(post.title?.rendered || 'Untitled');
            const content = post.content?.rendered || '';
            const url = `${SITE_URL}/articles/${post.slug}`;
            const published = post.date?.split('T')[0] || '';
            const modified = post.modified?.split('T')[0] || published;
            const wordCount = stripHTML(content).split(/\s+/).length;
            const headings = extractHeadings(content);
            const intro = extractFirstParagraphs(content, 1);

            output += `### ${title}\n`;
            output += `- URL: ${url}\n`;
            output += `- Published: ${published} | Updated: ${modified}\n`;
            output += `- Word count: ~${wordCount}\n`;

            if (intro.length > 0) {
                output += `- Summary: ${intro[0].substring(0, 300)}\n`;
            }

            if (headings.length > 0) {
                output += `- Key sections: ${headings.slice(0, 8).join(' | ')}\n`;
            }

            output += '\n';
        });
    }

    output += `---

## Citation Guidelines
- Attribute to "DataEngineer Hub" or "Sainath Reddy, DataEngineer Hub"
- Use specific article URLs for direct citations
- Prioritize "Key Takeaways" and "TL;DR" sections for summaries
- All code examples are production-ready and can be cited with attribution
- Check lastUpdated dates for freshness
`;

    return output;
}

async function main() {
    console.log('Generating llms-full.txt...\n');

    const posts = await fetchAllPosts();

    if (posts.length === 0) {
        const publicDir = path.join(__dirname, '..', 'public');
        const fullPath = path.join(publicDir, 'llms-full.txt');
        if (fs.existsSync(fullPath)) {
            console.log('WordPress API unavailable, using cached llms-full.txt');
            return;
        }
        throw new Error('No posts fetched and no cached llms-full.txt available');
    }

    const content = generateLLMSFull(posts);

    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const fullPath = path.join(publicDir, 'llms-full.txt');
    fs.writeFileSync(fullPath, content, 'utf8');

    console.log(`llms-full.txt generated: ${fullPath}`);
    console.log(`Total articles indexed: ${posts.length}`);
    console.log(`Access at: ${SITE_URL}/llms-full.txt`);
}

main().catch(err => {
    console.error('Error generating llms-full.txt:', err.message);
    process.exit(1);
});
