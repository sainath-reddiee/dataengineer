// scripts/generateSitemap.js - Full sitemap generation with categories, tags, pSEO
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

// Static pages with realistic lastmod dates (not "today")
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0, lastmod: 'today' },       // Homepage changes with new posts
  { url: '/articles', changefreq: 'daily', priority: 0.9, lastmod: 'today' }, // Articles listing changes with new posts
  { url: '/about', changefreq: 'monthly', priority: 0.7, lastmod: '2026-03-01' },
  { url: '/contact', changefreq: 'monthly', priority: 0.4, lastmod: '2026-03-01' },
  { url: '/newsletter', changefreq: 'monthly', priority: 0.5, lastmod: '2026-03-01' },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/disclaimer', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/tags', changefreq: 'weekly', priority: 0.6, lastmod: 'today' },
  { url: '/explore', changefreq: 'weekly', priority: 0.7, lastmod: 'today' },
  { url: '/certification', changefreq: 'monthly', priority: 0.6, lastmod: '2026-03-01' },
  { url: '/checklist', changefreq: 'monthly', priority: 0.6, lastmod: '2026-03-01' },
];

// Format date to W3C format (YYYY-MM-DD)
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

// Fetch all posts with proper error handling
async function fetchAllPosts() {
  try {
    console.log('📡 Fetching posts from WordPress...');

    let allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      const response = await fetch(
        `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_embed`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DataEngineerHub-Sitemap-Generator'
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

// Fetch all categories
async function fetchAllCategories() {
  try {
    console.log('📡 Fetching categories from WordPress...');

    const response = await fetch(
      `${WORDPRESS_API_URL}/categories?per_page=100&_fields=slug,count`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DataEngineerHub-Sitemap-Generator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    const activeCategories = categories.filter(cat => cat.count > 0);

    console.log(`✅ Total categories fetched: ${activeCategories.length}`);
    return activeCategories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    return [];
  }
}

// ✅ NEW: Fetch all tags
async function fetchAllTags() {
  try {
    console.log('🏷️  Fetching tags from WordPress...');

    const response = await fetch(
      `${WORDPRESS_API_URL}/tags?per_page=100&_fields=slug,count`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DataEngineerHub-Sitemap-Generator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tags = await response.json();
    const activeTags = tags.filter(tag => tag.count > 0);

    console.log(`✅ Total tags fetched: ${activeTags.length}`);
    return activeTags;
  } catch (error) {
    console.error('❌ Error fetching tags:', error.message);
    return [];
  }
}

// Generate XML sitemap with proper escaping
function generateSitemapXML(pages) {
  const escapeXml = (str) => {
    return str.replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return char;
      }
    });
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${pages.map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.image ? `
    <image:image>
      <image:loc>${escapeXml(page.image)}</image:loc>
      <image:title>${escapeXml(page.imageTitle || '')}</image:title>
    </image:image>` : ''}${page.newsDate ? `
    <news:news>
      <news:publication>
        <news:name>DataEngineer Hub</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${page.newsDate}</news:publication_date>
      <news:title>${escapeXml(page.newsTitle || '')}</news:title>
    </news:news>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

// Validate sitemap
function validateSitemap(entries) {
  const errors = [];

  entries.forEach((entry, index) => {
    if (!entry.url.startsWith('http')) {
      errors.push(`Line ${index + 1}: Invalid URL format - ${entry.url}`);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(entry.lastmod)) {
      errors.push(`Line ${index + 1}: Invalid date format - ${entry.lastmod}`);
    }

    if (entry.priority < 0 || entry.priority > 1) {
      errors.push(`Line ${index + 1}: Invalid priority - ${entry.priority}`);
    }
  });

  return errors;
}

// Load pSEO data from JSON files
function loadPSEOData() {
  const pseoDir = path.join(__dirname, '..', 'src', 'data', 'pseo');
  const entries = [];

  // Hub pages
  entries.push(
    { url: `${SITE_URL}/glossary`, changefreq: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/compare`, changefreq: 'monthly', priority: 0.8 }
  );

  // Glossary terms
  const glossaryDir = path.join(pseoDir, 'glossary');
  if (fs.existsSync(glossaryDir)) {
    const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(glossaryDir, file), 'utf8'));
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.slug) {
              entries.push({
                url: `${SITE_URL}/glossary/${item.slug}`,
                changefreq: 'monthly',
                priority: 0.7,
              });
            }
          });
        }
      } catch (e) {
        console.warn(`  Warning: Could not parse ${file}: ${e.message}`);
      }
    }
  }

  // Comparison pages
  const comparisonsDir = path.join(pseoDir, 'comparisons');
  if (fs.existsSync(comparisonsDir)) {
    const files = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(comparisonsDir, file), 'utf8'));
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.slug) {
              entries.push({
                url: `${SITE_URL}/compare/${item.slug}`,
                changefreq: 'monthly',
                priority: 0.7,
              });
            }
          });
        }
      } catch (e) {
        console.warn(`  Warning: Could not parse ${file}: ${e.message}`);
      }
    }
  }

  return entries;
}

// Determine blog post priority based on recency
function getPostPriority(post) {
  const now = Date.now();
  const publishDate = new Date(post.date).getTime();
  const daysSincePublish = (now - publishDate) / (1000 * 60 * 60 * 24);

  if (daysSincePublish <= 7) return 0.9;   // Last week: highest
  if (daysSincePublish <= 30) return 0.8;   // Last month: high
  if (daysSincePublish <= 90) return 0.7;   // Last quarter: normal
  return 0.6;                                // Older: lower
}

// Main function
async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...\n');

  try {
    // Fetch posts, categories, and tags in parallel
    const [posts, categories, tags] = await Promise.all([
      fetchAllPosts(),
      fetchAllCategories(),
      fetchAllTags(),
    ]);

    // Build sitemap entries
    const sitemapEntries = [];
    const today = formatDate(new Date());

    // Add static pages with proper lastmod
    console.log('\n📝 Adding static pages...');
    STATIC_PAGES.forEach(page => {
      sitemapEntries.push({
        url: `${SITE_URL}${page.url}`,
        lastmod: page.lastmod === 'today' ? today : page.lastmod,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // Add blog posts with priority differentiation and images
    console.log('📝 Adding blog posts...');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    let newsCount = 0;
    posts.forEach(post => {
      const postDate = formatDate(post.modified || post.date || new Date());
      const publishDate = new Date(post.date);

      // Extract featured image URL from _embedded if available
      let imageUrl = null;
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
      }

      const entry = {
        url: `${SITE_URL}/articles/${post.slug}`,
        lastmod: postDate,
        changefreq: 'weekly',
        priority: getPostPriority(post),
        image: imageUrl,
        imageTitle: post.title?.rendered || post.slug.replace(/-/g, ' '),
      };

      // Add news:news markup for articles published within the last 2 days
      if (publishDate >= twoDaysAgo) {
        entry.newsDate = publishDate.toISOString();
        entry.newsTitle = post.title?.rendered || post.slug.replace(/-/g, ' ');
        newsCount++;
      }

      sitemapEntries.push(entry);
    });

    // Add category pages (now indexable)
    console.log('📝 Adding category pages...');
    categories.forEach(cat => {
      sitemapEntries.push({
        url: `${SITE_URL}/category/${cat.slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.6,
      });
    });

    // Add tag pages (now indexable)
    console.log('📝 Adding tag pages...');
    tags.forEach(tag => {
      sitemapEntries.push({
        url: `${SITE_URL}/tag/${tag.slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.5,
      });
    });

    // Validate sitemap entries
    console.log('\n🔍 Validating sitemap...');
    const validationErrors = validateSitemap(sitemapEntries);

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors found:');
      validationErrors.forEach(error => console.error('  ' + error));
      throw new Error('Sitemap validation failed');
    }

    console.log('✅ Sitemap validation passed!');

    // Generate main sitemap XML
    const sitemapXML = generateSitemapXML(sitemapEntries);

    // Write to file
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');

    // Generate pSEO sitemap dynamically from JSON data
    console.log('\n📝 Generating pSEO sitemap from data files...');
    const pseoEntries = loadPSEOData();
    const pseoLastmod = today;
    const pseoXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pseoEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${pseoLastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    const pseoSitemapPath = path.join(publicDir, 'sitemap-pseo-1.xml');
    fs.writeFileSync(pseoSitemapPath, pseoXML, 'utf8');

    // Update sitemap-index.xml
    const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://dataengineerhub.blog/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://dataengineerhub.blog/sitemap-pseo-1.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
    const sitemapIndexPath = path.join(publicDir, 'sitemap-index.xml');
    fs.writeFileSync(sitemapIndexPath, sitemapIndexXML, 'utf8');

    console.log(`\n✅ Sitemap generated successfully!`);
    console.log(`📍 Main sitemap: ${sitemapPath}`);
    console.log(`📍 pSEO sitemap: ${pseoSitemapPath}`);
    console.log(`📍 Sitemap index: ${sitemapIndexPath}`);
    console.log(`📊 Main sitemap URLs: ${sitemapEntries.length}`);
    console.log(`   - Static pages: ${STATIC_PAGES.length}`);
    console.log(`   - Blog posts: ${posts.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - News entries (last 2 days): ${newsCount}`);
    console.log(`📊 pSEO sitemap URLs: ${pseoEntries.length}`);

    return sitemapEntries;
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();