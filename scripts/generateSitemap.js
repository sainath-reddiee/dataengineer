// scripts/generateSitemap.js - FIXED WITH TAGS SUPPORT
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/articles', changefreq: 'daily', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.4 },
  { url: '/newsletter', changefreq: 'monthly', priority: 0.5 },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
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

// Main function
async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...\n');

  try {
    // Fetch posts only - category/tag pages are noindex so excluded from sitemap
    const posts = await fetchAllPosts();

    // Build sitemap entries
    const sitemapEntries = [];
    const today = formatDate(new Date());

    // Add static pages
    console.log('\n📝 Adding static pages...');
    STATIC_PAGES.forEach(page => {
      sitemapEntries.push({
        url: `${SITE_URL}${page.url}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // Add blog posts with validated dates and images
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
        priority: 0.7,
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

    // NOTE: Category and tag pages are excluded from sitemap (they are noindex)

    // Validate sitemap entries
    console.log('\n🔍 Validating sitemap...');
    const validationErrors = validateSitemap(sitemapEntries);

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors found:');
      validationErrors.forEach(error => console.error('  ' + error));
      throw new Error('Sitemap validation failed');
    }

    console.log('✅ Sitemap validation passed!');

    // Generate XML
    const sitemapXML = generateSitemapXML(sitemapEntries);

    // Write to file
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');

    // Also update sitemap-index.xml with current date
    const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- WordPress Main Sitemap (Dynamically managed by API) -->
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
    console.log(`📍 Location: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${sitemapEntries.length}`);
    console.log(`   - Static pages: ${STATIC_PAGES.length}`);
    console.log(`   - Blog posts: ${posts.length}`);
    console.log(`   - News entries (last 2 days): ${newsCount}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Validate sitemap: https://www.xml-sitemaps.com/validate-xml-sitemap.html`);
    console.log(`   2. Test locally: Open ${sitemapPath} in browser`);
    console.log(`   3. Deploy and submit to Google Search Console`);

    return sitemapEntries;
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();