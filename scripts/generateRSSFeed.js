// scripts/generateRSSFeed.js
// Generates RSS 2.0 feed for AI crawlers, feed readers, and content aggregators
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';
const SITE_TITLE = 'DataEngineer Hub';
const SITE_DESCRIPTION = 'Expert data engineering tutorials on Snowflake, AWS, Azure, SQL, Python, Airflow & dbt. Practical guides for data professionals.';

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getMimeType(url) {
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
    return types[ext] || 'image/jpeg';
}

async function fetchAllPosts() {
    try {
        console.log('Fetching posts for RSS feed...');
        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_embed`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-RSS-Generator'
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
            page++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Fetched ${allPosts.length} posts`);
        return allPosts;
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        return [];
    }
}

function buildRSSFeed(posts) {
    const now = new Date().toUTCString();

    // Sort by date descending
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = sorted.map(post => {
        const title = stripHTML(post.title?.rendered || 'Untitled');
        const excerpt = stripHTML(post.excerpt?.rendered || '');
        const link = `${SITE_URL}/articles/${post.slug}`;
        const pubDate = new Date(post.date).toUTCString();
        const modDate = post.modified ? new Date(post.modified).toUTCString() : pubDate;

        let authorName = 'Sainath Reddy';
        if (post._embedded?.author?.[0]?.name) {
            authorName = post._embedded.author[0].name;
        }

        let categories = '';
        if (post._embedded?.['wp:term']?.[0]) {
            categories = post._embedded['wp:term'][0]
                .map(cat => `      <category>${escapeXml(cat.name)}</category>`)
                .join('\n');
        }

        // Get featured image
        let imageUrl = '';
        if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
            imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
        }

        return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(excerpt.substring(0, 500))}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
${categories}${imageUrl ? `\n      <enclosure url="${escapeXml(imageUrl)}" type="${getMimeType(imageUrl)}" />` : ''}
    </item>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
    <managingEditor>contact@dataengineerhub.blog (Sainath Reddy)</managingEditor>
    <webMaster>contact@dataengineerhub.blog (Sainath Reddy)</webMaster>
    <ttl>60</ttl>
${items.join('\n')}
  </channel>
</rss>`;
}

async function generateRSSFeed() {
    console.log('Starting RSS feed generation...\n');

    const posts = await fetchAllPosts();

    if (posts.length === 0) {
        const publicDir = path.join(__dirname, '..', 'public');
        const rssPath = path.join(publicDir, 'rss.xml');
        if (fs.existsSync(rssPath)) {
            console.log('WordPress API unavailable, using cached RSS feed');
            return;
        }
        throw new Error('No posts fetched and no cached RSS feed available');
    }

    const rss = buildRSSFeed(posts);

    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const rssPath = path.join(publicDir, 'rss.xml');
    fs.writeFileSync(rssPath, rss, 'utf8');

    console.log(`RSS feed generated: ${rssPath}`);
    console.log(`Total items: ${posts.length}`);
    console.log(`Access at: ${SITE_URL}/rss.xml`);
}

generateRSSFeed().catch(err => {
    console.error('Error generating RSS feed:', err.message);
    process.exit(1);
});
