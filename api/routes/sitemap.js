// api/sitemap.xml.js (for Vercel/Netlify serverless function)
// Or api/routes/sitemap.js (for Express server)

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

// Static pages
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/articles', changefreq: 'daily', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/newsletter', changefreq: 'monthly', priority: 0.7 },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
];

// Cache duration: 1 hour
const CACHE_DURATION = 3600;

// Fetch all posts
async function fetchAllPosts() {
  try {
    let allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Limit to 10 pages (1000 posts) to prevent timeout
      const response = await fetch(
        `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_fields=slug,modified`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        if (response.status === 400) break;
        throw new Error(`HTTP ${response.status}`);
      }

      const posts = await response.json();
      if (posts.length === 0) break;
      
      allPosts = allPosts.concat(posts);
      page++;
    }

    return allPosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Fetch all categories
async function fetchAllCategories() {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/categories?per_page=100&_fields=slug,count`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return [];
    
    const categories = await response.json();
    return categories.filter(cat => cat.count > 0);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Generate sitemap XML
function generateSitemapXML(entries) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  return xml;
}

// Main handler
export default async function handler(req, res) {
  try {
    const now = new Date().toISOString();
    const entries = [];

    // Fetch data in parallel
    const [posts, categories] = await Promise.all([
      fetchAllPosts(),
      fetchAllCategories()
    ]);

    // Add static pages
    STATIC_PAGES.forEach(page => {
      entries.push({
        url: `${SITE_URL}${page.url}`,
        lastmod: now,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // Add posts
    posts.forEach(post => {
      entries.push({
        url: `${SITE_URL}/articles/${post.slug}`,
        lastmod: post.modified || now,
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

    // Add categories
    categories.forEach(category => {
      entries.push({
        url: `${SITE_URL}/category/${category.slug}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Generate XML
    const sitemap = generateSitemapXML(entries);

    // Set headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`);
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap');
  }
}

// For Express.js, use this instead:
/*
export async function sitemapRoute(req, res) {
  return handler(req, res);
}
*/