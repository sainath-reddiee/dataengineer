// scripts/generateSitemap.js - Full sitemap generation with categories, tags, pSEO
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const SITE_URL = 'https://dataengineerhub.blog';

// Derive a realistic changefreq from how old a lastmod date is. Google largely
// ignores changefreq today, but a value that obviously contradicts lastmod
// (e.g. "daily" on a page that hasn't changed in a year) is a small trust
// signal against the sitemap. Mapping:
//   <= 14 days:  weekly
//   <= 90 days:  monthly
//   <= 365 days: yearly
//   > 365 days:  yearly
function changefreqFromAge(lastmodDate) {
  if (!(lastmodDate instanceof Date) || isNaN(lastmodDate)) return 'monthly';
  const ageDays = (Date.now() - lastmodDate.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 14) return 'weekly';
  if (ageDays <= 90) return 'monthly';
  return 'yearly';
}

// Static pages with realistic lastmod dates (not "today")
// Only include pages that:
// 1. Have a real public route in App.jsx
// 2. Are NOT noindexed by their React component
// 3. Have pre-rendered HTML or are meaningful indexable pages
// Excluded: /newsletter (noindexed), /tags (noindexed), /explore (no route),
//           /checklist (admin-only)
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0, lastmod: 'today' },
  { url: '/articles', changefreq: 'daily', priority: 0.9, lastmod: 'today' },
  { url: '/about', changefreq: 'monthly', priority: 0.7, lastmod: '2026-03-01' },
  { url: '/contact', changefreq: 'monthly', priority: 0.4, lastmod: '2026-03-01' },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/disclaimer', changefreq: 'yearly', priority: 0.3, lastmod: '2025-12-01' },
  { url: '/cheatsheets', changefreq: 'weekly', priority: 0.8, lastmod: 'today' },
  { url: '/certification', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools', changefreq: 'weekly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/snowflake-cost-calculator', changefreq: 'monthly', priority: 0.9, lastmod: 'today' },
  { url: '/tools/snowflake-credit-cost', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/snowflake-query-cost-estimator', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/snowflake-warehouse-sizing', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/databricks-cost-calculator', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/dbt-cloud-cost-calculator', changefreq: 'monthly', priority: 0.85, lastmod: 'today' },
  { url: '/tools/sql-formatter', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/cron-expression-builder', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/json-to-sql-ddl', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/csv-to-sql', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/dbt-schema-generator', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/unix-timestamp-converter', changefreq: 'monthly', priority: 0.9, lastmod: 'today' },
  { url: '/tools/bigquery-cost-calculator', changefreq: 'monthly', priority: 0.9, lastmod: 'today' },
  { url: '/tools/cloud-data-warehouse-cost-comparison', changefreq: 'monthly', priority: 0.9, lastmod: 'today' },
  { url: '/tools/sql-playground',   changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/tools/json-parquet-avro-converter', changefreq: 'monthly', priority: 0.8, lastmod: 'today' },
  { url: '/interview-prep', changefreq: 'weekly', priority: 0.85, lastmod: 'today' },
  { url: '/cheatsheets/category/sql', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
  { url: '/cheatsheets/category/orchestration', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
  { url: '/cheatsheets/category/cloud', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
  { url: '/cheatsheets/category/programming', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
  { url: '/cheatsheets/category/architecture', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
  { url: '/cheatsheets/category/interview', changefreq: 'weekly', priority: 0.8, lastmod: 'today' },
  { url: '/cheatsheets/category/bestpractices', changefreq: 'weekly', priority: 0.75, lastmod: 'today' },
];

// Article slugs to exclude from sitemap (noindexed due to thin content <400 words)
const EXCLUDED_ARTICLE_SLUGS = [
  'snowpro-specialty-gen-ai-practice-exams', // <400 words, marked noindex by SSG
];

// Cheatsheet slugs to exclude from sitemap (noindexed due to thin content <250 words)
const EXCLUDED_CHEATSHEET_SLUGS = [
  'airflow-best-practices',    // <250 words, marked noindex by SSG
  'snowflake-best-practices',  // <250 words, marked noindex by SSG
];

/** Decode HTML entities that WordPress REST API returns pre-encoded
 *  (e.g. &amp; for &, &#8217; for right single quote).
 *  Decoding first prevents escapeXml() from double-encoding them. */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');  // must be last
}

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
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.image ? `
    <image:image>
      <image:loc>${escapeXml(page.image)}</image:loc>
      <image:title>${escapeXml(page.imageTitle || '')}</image:title>
    </image:image>` : ''}
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
        const filePath = path.join(glossaryDir, file);
        const fileMod = fs.statSync(filePath).mtime.toISOString().split('T')[0];
        const fileModFreq = changefreqFromAge(new Date(fileMod));
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.slug) {
              entries.push({
                url: `${SITE_URL}/glossary/${item.slug}`,
                changefreq: fileModFreq,
                priority: 0.7,
                lastmod: fileMod,
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
        const filePath = path.join(comparisonsDir, file);
        const fileMod = fs.statSync(filePath).mtime.toISOString().split('T')[0];
        const fileModFreq = changefreqFromAge(new Date(fileMod));
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.slug) {
              entries.push({
                url: `${SITE_URL}/compare/${item.slug}`,
                changefreq: fileModFreq,
                priority: 0.7,
                lastmod: fileMod,
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

// Load cheatsheet slugs from cheatsheetData.js
function loadCheatsheetData() {
  const entries = [];
  const cheatsheetPath = path.join(__dirname, '..', 'src', 'data', 'cheatsheetData.js');

  if (!fs.existsSync(cheatsheetPath)) {
    console.warn('  Warning: cheatsheetData.js not found, skipping cheatsheets');
    return entries;
  }

  try {
    const raw = fs.readFileSync(cheatsheetPath, 'utf-8');
    const today = formatDate(new Date());

    // Extract slug and lastUpdated from each cheatsheet entry
    const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
    const dateRegex = /lastUpdated:\s*['"]([^'"]+)['"]/g;

    const slugs = [];
    const dates = [];
    let match;
    while ((match = slugRegex.exec(raw)) !== null) slugs.push(match[1]);
    while ((match = dateRegex.exec(raw)) !== null) dates.push(match[1]);

    slugs.forEach((slug, i) => {
      if (EXCLUDED_CHEATSHEET_SLUGS.includes(slug)) {
        console.log(`   ⏭️  Skipping thin cheatsheet: ${slug}`);
        return;
      }
      entries.push({
        url: `${SITE_URL}/cheatsheets/${slug}`,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: dates[i] || today,
      });
    });
  } catch (e) {
    console.warn(`  Warning: Could not parse cheatsheetData.js: ${e.message}`);
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
      const lastmodStr = page.lastmod === 'today' ? today : page.lastmod;
      // Only override the hardcoded changefreq when it would obviously
      // contradict the lastmod age (e.g. 'daily' on a page that hasn't been
      // touched in a year). Keep the declared value if it's already realistic.
      const parsedDate = new Date(lastmodStr);
      const ageBased = changefreqFromAge(parsedDate);
      const declaredOrder = { daily: 1, weekly: 2, monthly: 3, yearly: 4 };
      const finalChangefreq =
        (declaredOrder[page.changefreq] || 3) < (declaredOrder[ageBased] || 3)
          ? ageBased
          : page.changefreq;
      sitemapEntries.push({
        url: `${SITE_URL}${page.url}`,
        lastmod: lastmodStr,
        changefreq: finalChangefreq,
        priority: page.priority,
      });
    });

    // Add blog posts with priority differentiation and images
    console.log('📝 Adding blog posts...');
    let excludedCount = 0;
    posts.forEach(post => {
      // Skip articles that are noindexed due to thin content
      if (EXCLUDED_ARTICLE_SLUGS.includes(post.slug)) {
        excludedCount++;
        console.log(`   ⏭️  Skipping thin article: ${post.slug}`);
        return;
      }

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
        // Derive realistic changefreq from the actual post mtime so stale
        // articles do not advertise "weekly" updates. Freshly-published or
        // recently-modified posts still land in the "weekly" bucket.
        changefreq: changefreqFromAge(new Date(post.modified || post.date)),
        priority: getPostPriority(post),
        image: imageUrl,
        imageTitle: decodeHtmlEntities(post.title?.rendered) || post.slug.replace(/-/g, ' '),
      };

      sitemapEntries.push(entry);
    });
    if (excludedCount > 0) {
      console.log(`   ⏭️  Excluded ${excludedCount} thin article(s) from sitemap`);
    }

    // Category pages excluded from sitemap — no pre-rendered HTML exists,
    // so Googlebot receives the SPA shell (soft 404 / thin content).
    // Re-add once category pages are pre-rendered with unique content.
    console.log('⏭️  Skipping category pages (no pre-rendered HTML, soft 404 for Googlebot)...');

    // Tag pages excluded from sitemap — all have noindex={true} in TagPage.jsx
    // Including noindexed pages in sitemap sends contradictory signals to Google
    console.log('⏭️  Skipping tag pages (all noindexed in React)...');

    // pSEO pages (glossary + comparisons) — now pre-rendered with full static HTML
    console.log('\n📖 Adding pSEO pages (glossary + comparisons)...');
    const pseoEntries = loadPSEOData();
    pseoEntries.forEach(entry => {
      if (!entry.lastmod) entry.lastmod = today;
      sitemapEntries.push(entry);
    });
    console.log(`✅ Added ${pseoEntries.length} pSEO pages`);

    // Cheatsheet pages — pre-rendered with full static HTML
    console.log('📋 Adding cheatsheet pages...');
    const cheatsheetEntries = loadCheatsheetData();
    cheatsheetEntries.forEach(entry => sitemapEntries.push(entry));
    console.log(`✅ Added ${cheatsheetEntries.length} cheatsheet pages`);

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

    // Update sitemap-index.xml
    const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://dataengineerhub.blog/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
    const sitemapIndexPath = path.join(publicDir, 'sitemap-index.xml');
    fs.writeFileSync(sitemapIndexPath, sitemapIndexXML, 'utf8');

    console.log(`\n✅ Sitemap generated successfully!`);
    console.log(`📍 Main sitemap: ${sitemapPath}`);
    console.log(`📍 Sitemap index: ${sitemapIndexPath}`);
    console.log(`📊 Main sitemap URLs: ${sitemapEntries.length}`);
    console.log(`   - Static pages: ${STATIC_PAGES.length}`);
    console.log(`   - Blog posts: ${posts.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - pSEO pages: ${pseoEntries.length}`);
    console.log(`   - Cheatsheets: ${cheatsheetEntries.length}`);

    return sitemapEntries;
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();