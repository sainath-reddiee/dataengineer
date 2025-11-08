// scripts/generateStaticPagesIncremental.js
// Smart incremental build that only regenerates changed content
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const CACHE_FILE = path.join(__dirname, '..', '.build-cache.json');

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`📦 Loaded cache with ${Object.keys(cache.pages || {}).length} pages`);
      return cache;
    }
  } catch (e) {
    console.warn('⚠️  Could not load cache:', e.message);
  }
  return { pages: {}, lastBuild: null, stats: {} };
}

function saveCache(cache) {
  try {
    cache.lastBuild = new Date().toISOString();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log('💾 Cache saved successfully');
  } catch (e) {
    console.error('❌ Failed to save cache:', e.message);
  }
}

function hashContent(content) {
  return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}

// ============================================================================
// API FETCHING
// ============================================================================

async function fetchFromWP(endpoint, fields = '') {
  const items = [];
  let page = 1;
  
  while (true) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}${fields ? `&_fields=${fields}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 400) break;
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      
      items.push(...data);
      page++;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      break;
    }
  }
  
  return items;
}

function stripHTML(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateHTML(pageData) {
  const { title, description, path: pagePath, content = '' } = pageData;
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | DataEngineer Hub</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow" />
    
    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">
    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
        color: #f8fafc;
        line-height: 1.6;
      }
      
      /* SEO content visible by default */
      .seo-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 60px 20px;
      }
      
      .seo-content h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .seo-content p {
        font-size: 1.125rem;
        line-height: 1.8;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }
      
      /* Hide when React loads */
      body.react-loaded .seo-content {
        display: none;
      }
    </style>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('react-loading');
      });
    </script>
  </head>
  <body>
    <div id="root">
      <div class="seo-content">
        <h1>${title}</h1>
        <p>${description}</p>
        ${content ? `<div>${content}</div>` : ''}
        <noscript>
          <p style="margin-top: 2rem; color: #fbbf24;">
            Enable JavaScript for the full interactive experience.
          </p>
        </noscript>
      </div>
    </div>
    
    <script type="module" src="/src/main.jsx"></script>
    
    <script>
      window.addEventListener('load', function() {
        document.body.classList.remove('react-loading');
        document.body.classList.add('react-loaded');
      });
    </script>
  </body>
</html>`;
}

// ============================================================================
// INCREMENTAL BUILD LOGIC
// ============================================================================

async function buildIncremental(options = {}) {
  const { force = false, postsOnly = false } = options;
  
  console.log('🚀 Starting incremental static generation...');
  if (force) console.log('⚡ Force mode: Rebuilding all pages');
  if (postsOnly) console.log('📄 Posts only mode: Skipping categories/tags');
  console.log('');
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build:vite" first.');
    process.exit(1);
  }
  
  // Load cache
  const cache = loadCache();
  const newCache = { pages: {}, lastBuild: new Date().toISOString(), stats: {} };
  
  let stats = {
    new: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    errors: 0
  };
  
  // Track all current pages
  const currentPages = new Set();
  
  // ============================================================================
  // PROCESS POSTS (ARTICLES)
  // ============================================================================
  
  console.log('📄 Processing posts...');
  const startTime = Date.now();
  
  try {
    const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content,modified');
    console.log(`   Found ${posts.length} posts from API`);
    
    for (const post of posts) {
      const pagePath = `/articles/${post.slug}`;
      currentPages.add(pagePath);
      
      const description = stripHTML(post.excerpt.rendered).substring(0, 160) || 
                          'Read this article on DataEngineer Hub';
      const contentPreview = stripHTML(post.content.rendered).substring(0, 500);
      
      const pageData = {
        title: stripHTML(post.title.rendered),
        description,
        path: pagePath,
        content: `<p>${contentPreview}...</p>`,
        modified: post.modified
      };
      
      const contentHash = hashContent(pageData);
      const cachedPage = cache.pages[pagePath];
      const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
      
      if (needsRebuild) {
        try {
          const html = generateHTML(pageData);
          const filePath = path.join(distDir, pagePath, 'index.html');
          const dir = path.dirname(filePath);
          
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, html);
          
          if (cachedPage) {
            stats.updated++;
            if (stats.updated <= 5) {
              console.log(`   ↻ Updated: ${pagePath}`);
            }
          } else {
            stats.new++;
            if (stats.new <= 5) {
              console.log(`   ✓ Created: ${pagePath}`);
            }
          }
        } catch (err) {
          console.error(`   ❌ Error generating ${pagePath}:`, err.message);
          stats.errors++;
        }
      } else {
        stats.unchanged++;
      }
      
      newCache.pages[pagePath] = {
        hash: contentHash,
        modified: post.modified,
        built: needsRebuild ? new Date().toISOString() : cachedPage.built,
        type: 'post'
      };
    }
    
    const postsTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Posts: ${stats.new} new, ${stats.updated} updated, ${stats.unchanged} unchanged (${postsTime}s)`);
    
  } catch (error) {
    console.error('❌ Error processing posts:', error.message);
  }
  
  // ============================================================================
  // PROCESS CATEGORIES (OPTIONAL)
  // ============================================================================
  
  if (!postsOnly) {
    console.log('\n📁 Processing categories...');
    const catStartTime = Date.now();
    
    try {
      const categories = await fetchFromWP('/categories', 'slug,name,description,count');
      console.log(`   Found ${categories.length} categories from API`);
      
      let catStats = { new: 0, updated: 0, unchanged: 0 };
      
      for (const cat of categories) {
        // Skip Uncategorized
        if (cat.slug === 'uncategorized') continue;
        
        const pagePath = `/category/${cat.slug}`;
        currentPages.add(pagePath);
        
        const pageData = {
          title: `${stripHTML(cat.name)} Tutorials`,
          description: stripHTML(cat.description) || 
                       `Learn ${cat.name} with comprehensive tutorials and articles on DataEngineer Hub.`,
          path: pagePath
        };
        
        const contentHash = hashContent(pageData);
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
        
        if (needsRebuild) {
          try {
            const html = generateHTML(pageData);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, html);
            
            cachedPage ? catStats.updated++ : catStats.new++;
          } catch (err) {
            console.error(`   ❌ Error generating ${pagePath}:`, err.message);
            stats.errors++;
          }
        } else {
          catStats.unchanged++;
        }
        
        newCache.pages[pagePath] = {
          hash: contentHash,
          count: cat.count,
          built: needsRebuild ? new Date().toISOString() : cachedPage.built,
          type: 'category'
        };
      }
      
      const catTime = ((Date.now() - catStartTime) / 1000).toFixed(2);
      console.log(`✅ Categories: ${catStats.new} new, ${catStats.updated} updated, ${catStats.unchanged} unchanged (${catTime}s)`);
      
    } catch (error) {
      console.error('❌ Error processing categories:', error.message);
    }
    
    // ============================================================================
    // PROCESS TAGS (OPTIONAL)
    // ============================================================================
    
    console.log('\n🏷️  Processing tags...');
    const tagStartTime = Date.now();
    
    try {
      const tags = await fetchFromWP('/tags', 'slug,name,description,count');
      console.log(`   Found ${tags.length} tags from API`);
      
      let tagStats = { new: 0, updated: 0, unchanged: 0 };
      
      for (const tag of tags) {
        const pagePath = `/tag/${tag.slug}`;
        currentPages.add(pagePath);
        
        const pageData = {
          title: `${stripHTML(tag.name)} Articles`,
          description: stripHTML(tag.description) || 
                       `Articles tagged with ${tag.name} on DataEngineer Hub.`,
          path: pagePath
        };
        
        const contentHash = hashContent(pageData);
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
        
        if (needsRebuild) {
          try {
            const html = generateHTML(pageData);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, html);
            
            cachedPage ? tagStats.updated++ : tagStats.new++;
          } catch (err) {
            console.error(`   ❌ Error generating ${pagePath}:`, err.message);
            stats.errors++;
          }
        } else {
          tagStats.unchanged++;
        }
        
        newCache.pages[pagePath] = {
          hash: contentHash,
          count: tag.count,
          built: needsRebuild ? new Date().toISOString() : cachedPage.built,
          type: 'tag'
        };
      }
      
      const tagTime = ((Date.now() - tagStartTime) / 1000).toFixed(2);
      console.log(`✅ Tags: ${tagStats.new} new, ${tagStats.updated} updated, ${tagStats.unchanged} unchanged (${tagTime}s)`);
      
    } catch (error) {
      console.error('❌ Error processing tags:', error.message);
    }
  }
  
  // ============================================================================
  // CLEANUP DELETED PAGES
  // ============================================================================
  
  console.log('\n🧹 Checking for deleted pages...');
  for (const cachedPath in cache.pages) {
    if (!currentPages.has(cachedPath)) {
      const filePath = path.join(distDir, cachedPath, 'index.html');
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          stats.deleted++;
          console.log(`   🗑️  Deleted: ${cachedPath}`);
        }
      } catch (err) {
        console.error(`   ❌ Error deleting ${cachedPath}:`, err.message);
      }
    }
  }
  
  if (stats.deleted === 0) {
    console.log('   No deleted pages found');
  }
  
  // ============================================================================
  // SAVE CACHE & SUMMARY
  // ============================================================================
  
  newCache.stats = stats;
  saveCache(newCache);
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Incremental build complete!');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   ✨ New pages:       ${stats.new}`);
  console.log(`   ↻  Updated pages:   ${stats.updated}`);
  console.log(`   ✓  Unchanged pages: ${stats.unchanged}`);
  console.log(`   🗑️  Deleted pages:   ${stats.deleted}`);
  if (stats.errors > 0) {
    console.log(`   ❌ Errors:          ${stats.errors}`);
  }
  console.log(`   📦 Total tracked:   ${Object.keys(newCache.pages).length}`);
  console.log(`   ⏱️  Build time:      ${totalTime}s`);
  console.log('='.repeat(60));
  
  // Performance insights
  if (stats.unchanged > stats.new + stats.updated) {
    const saved = Math.round((stats.unchanged / (stats.unchanged + stats.new + stats.updated)) * 100);
    console.log(`\n💡 Performance: ${saved}% of pages were cached (saved ~${Math.round(stats.unchanged * 0.1)}s)`);
  }
  
  console.log('');
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  postsOnly: args.includes('--posts-only')
};

if (args.includes('--help')) {
  console.log(`
📚 Incremental Static Page Generator

Usage:
  node scripts/generateStaticPagesIncremental.js [options]

Options:
  --force        Force rebuild all pages (ignore cache)
  --posts-only   Only generate post pages (skip categories/tags)
  --help         Show this help message

Examples:
  npm run build:incremental                  # Normal incremental build
  npm run build:incremental -- --force       # Force full rebuild
  npm run build:incremental -- --posts-only  # Only rebuild posts
  `);
  process.exit(0);
}

buildIncremental(options).catch(error => {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
});
