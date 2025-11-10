// scripts/generateStaticPagesIncremental.js
// PRODUCTION VERSION - True incremental builds, only updates changed content
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const WORDPRESS_BASE_URL = 'https://app.dataengineerhub.blog';
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
  return { pages: {}, lastBuild: null, bundleFiles: null };
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

function hashContent(data) {
  // Hash only the actual content, not timestamps or bundle paths
  const contentOnly = {
    title: data.title,
    description: data.description,
    fullContent: data.fullContent,
    slug: data.slug
  };
  return crypto.createHash('md5').update(JSON.stringify(contentOnly)).digest('hex');
}

// ============================================================================
// BUNDLE DETECTION WITH CACHING
// ============================================================================

function findBundleFiles(distDir) {
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('⚠️  dist/index.html not found');
    return { jsFile: null, cssFile: null };
  }

  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Match CSS file
  const cssMatch = indexContent.match(/href="(\/assets\/[^"]+\.css)"/);
  const cssFile = cssMatch ? cssMatch[1] : null;
  
  // Match JS file - can be in /assets/ or /assets/js/
  const jsMatch = indexContent.match(/src="(\/assets\/[^"]+\.js)"/);
  let jsFile = jsMatch ? jsMatch[1] : null;
  
  // Verify JS file exists
  if (jsFile) {
    const directPath = path.join(distDir, jsFile);
    
    if (!fs.existsSync(directPath)) {
      console.warn(`⚠️  JS file not found at: ${jsFile}, searching...`);
      
      // Search in /assets/js/ subdirectory
      const jsSubdirPath = path.join(distDir, 'assets', 'js');
      if (fs.existsSync(jsSubdirPath)) {
        const jsFiles = fs.readdirSync(jsSubdirPath);
        const indexJsFile = jsFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
        
        if (indexJsFile) {
          jsFile = `/assets/js/${indexJsFile}`;
          console.log(`✅ Found JS in subdirectory: ${jsFile}`);
        }
      }
      
      // Search in /assets/ root
      if (!jsFile || !fs.existsSync(path.join(distDir, jsFile))) {
        const assetsPath = path.join(distDir, 'assets');
        if (fs.existsSync(assetsPath)) {
          const assetFiles = fs.readdirSync(assetsPath);
          const indexJsFile = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
          
          if (indexJsFile) {
            jsFile = `/assets/${indexJsFile}`;
            console.log(`✅ Found JS in assets root: ${jsFile}`);
          }
        }
      }
    }
  }

  if (jsFile) console.log(`📦 JS bundle: ${jsFile}`);
  if (cssFile) console.log(`🎨 CSS bundle: ${cssFile}`);

  return { jsFile, cssFile };
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
// IMAGE PROCESSING
// ============================================================================

function makeImagesAbsolute(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Remove problematic attributes
  processedContent = processedContent.replace(/data-recalc-dims="1"\s*/g, '');
  processedContent = processedContent.replace(/\s*\/\s*loading=/g, ' loading=');
  
  // Fix src="/wp-content/..." -> absolute URL
  processedContent = processedContent.replace(
    /src="(\/wp-content\/[^"]+)"/g,
    `src="${WORDPRESS_BASE_URL}$1"`
  );
  
  // Fix src="wp-content/..." (no leading slash) -> absolute URL
  processedContent = processedContent.replace(
    /src="(wp-content\/[^"]+)"/g,
    `src="${WORDPRESS_BASE_URL}/$1"`
  );
  
  // Fix any remaining relative image URLs
  processedContent = processedContent.replace(
    /src="(\/[^"]+\.(jpg|jpeg|png|gif|webp|svg))"/gi,
    `src="${WORDPRESS_BASE_URL}$1"`
  );
  
  // Fix srcset attributes for responsive images
  processedContent = processedContent.replace(
    /srcset="([^"]+)"/g,
    (match, srcsetValue) => {
      const fixedSrcset = srcsetValue
        .split(',')
        .map(src => {
          const trimmed = src.trim();
          if (trimmed.startsWith('http')) return trimmed;
          if (trimmed.startsWith('/wp-content/')) {
            return trimmed.replace(/^\/wp-content\//, `${WORDPRESS_BASE_URL}/wp-content/`);
          }
          if (trimmed.startsWith('wp-content/')) {
            return trimmed.replace(/^wp-content\//, `${WORDPRESS_BASE_URL}/wp-content/`);
          }
          if (trimmed.startsWith('/')) {
            const parts = trimmed.split(' ');
            parts[0] = WORDPRESS_BASE_URL + parts[0];
            return parts.join(' ');
          }
          return trimmed;
        })
        .join(', ');
      return `srcset="${fixedSrcset}"`;
    }
  );
  
  // Remove HTML entities that cause encoding issues
  processedContent = processedContent.replace(/&#038;/g, '&');
  
  return processedContent;
}

// ============================================================================
// HTML GENERATION - NO TIMESTAMPS/HASHES THAT CHANGE EVERY BUILD
// ============================================================================

function generateFullArticleHTML(pageData, bundleFiles) {
  const { title, description, path: pagePath, fullContent = '', slug } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  // Calculate relative paths from article subdirectory
  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);
  
  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  // Process images to make them absolute
  const processedContent = makeImagesAbsolute(fullContent);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | DataEngineer Hub</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://dataengineerhub.blog${pagePath}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="DataEngineer Hub" />

    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">
    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>
    ${productionCssFile ? `<link rel="stylesheet" crossorigin href="${productionCssFile}">` : ''}

    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
        color: #f8fafc;
        line-height: 1.6;
        min-height: 100vh;
      }
      
      .seo-content {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        margin-top: 40px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .seo-content h1 {
        font-size: 2.5rem;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1.2;
      }
      
      .seo-content .excerpt {
        font-size: 1.2rem;
        color: #cbd5e1;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .seo-content .article-body {
        color: #e2e8f0;
        font-size: 1.1rem;
        line-height: 1.8;
      }
      
      .seo-content .article-body h2 {
        color: #93c5fd;
        font-size: 1.8rem;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
      }
      
      .seo-content .article-body h3 {
        color: #bae6fd;
        font-size: 1.4rem;
        margin-top: 2rem;
        margin-bottom: 0.8rem;
      }
      
      .seo-content .article-body p {
        margin-bottom: 1.2rem;
      }
      
      .seo-content .article-body ul,
      .seo-content .article-body ol {
        margin-left: 2rem;
        margin-bottom: 1.2rem;
      }
      
      .seo-content .article-body li {
        margin-bottom: 0.5rem;
      }
      
      .seo-content .article-body code {
        background: rgba(0, 0, 0, 0.3);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: #fbbf24;
      }
      
      .seo-content .article-body pre {
        background: rgba(0, 0, 0, 0.5);
        padding: 1.5rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1.5rem 0;
        border-left: 4px solid #60a5fa;
      }
      
      .seo-content .article-body pre code {
        background: none;
        padding: 0;
        color: #e2e8f0;
      }
      
      .seo-content .article-body blockquote {
        border-left: 4px solid #a78bfa;
        padding-left: 1.5rem;
        margin: 1.5rem 0;
        font-style: italic;
        color: #cbd5e1;
      }
      
      .seo-content .article-body img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1.5rem 0;
        display: block;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .seo-content .article-body figure {
        margin: 1.5rem 0;
      }
      
      .seo-content .article-body figcaption {
        text-align: center;
        font-size: 0.9rem;
        color: #94a3b8;
        margin-top: 0.5rem;
        font-style: italic;
      }
      
      .seo-content .article-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
      }
      
      .seo-content .article-body table th,
      .seo-content .article-body table td {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.8rem;
        text-align: left;
      }
      
      .seo-content .article-body table th {
        background: rgba(96, 165, 250, 0.2);
        font-weight: 600;
      }
      
      .seo-content .article-body a {
        color: #60a5fa;
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;
      }
      
      .seo-content .article-body a:hover {
        border-bottom-color: #60a5fa;
      }
      
      .back-link {
        display: inline-block;
        margin-top: 2rem;
        padding: 12px 24px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        transition: transform 0.2s;
      }
      
      .back-link:hover {
        transform: translateY(-2px);
      }
      
      body.react-loaded .seo-content {
        display: none;
      }
      
      .seo-content .article-body img[loading="lazy"] {
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .seo-content .article-body img[loading="lazy"].loaded {
        opacity: 1;
      }
      
      @media (max-width: 768px) {
        .seo-content {
          padding: 20px 15px;
          margin-top: 20px;
        }
        
        .seo-content h1 {
          font-size: 1.8rem;
        }
        
        .seo-content .article-body {
          font-size: 1rem;
        }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="seo-content">
        <article>
          <h1>${title}</h1>
          <p class="excerpt">${description}</p>

          <div class="article-body">
            ${processedContent}
          </div>
          
          <a href="${relativePrefix}" class="back-link">← Back to Home</a>
        </article>
        
        <noscript>
          <p style="margin-top: 2rem; padding: 1rem; background: rgba(251, 191, 36, 0.2); border-radius: 8px; color: #fbbf24;">
            ✅ This article is fully accessible without JavaScript.
            Enable JavaScript for enhanced interactive features.
          </p>
        </noscript>
      </div>
    </div>

    ${productionJsFile ? `<script type="module" crossorigin src="${productionJsFile}"></script>` : ''}

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('.article-body img[loading="lazy"]');
        images.forEach(img => {
          img.addEventListener('load', function() {
            this.classList.add('loaded');
          });
          if (img.complete) {
            img.classList.add('loaded');
          }
        });
      });
      
      window.addEventListener('load', function() {
        const checkReactMount = setInterval(function() {
          const root = document.getElementById('root');
          if (root && root.children.length > 1) {
            document.body.classList.add('react-loaded');
            clearInterval(checkReactMount);
          }
        }, 100);
        
        setTimeout(function() {
          clearInterval(checkReactMount);
        }, 3000);
      });
    </script>
  </body>
</html>`;
}

function generateSimpleHTML(pageData, bundleFiles) {
  const { title, description, path: pagePath } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);
  
  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | DataEngineer Hub</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    ${productionCssFile ? `<link rel="stylesheet" crossorigin href="${productionCssFile}">` : ''}
  </head>
  <body>
    <div id="root">
      <div style="padding: 60px 20px; text-align: center;">
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
    </div>
    ${productionJsFile ? `<script type="module" crossorigin src="${productionJsFile}"></script>` : ''}
  </body>
</html>`;
}

// ============================================================================
// INCREMENTAL BUILD LOGIC
// ============================================================================

async function buildIncremental(options = {}) {
  let { force = false, postsOnly = false } = options;

  console.log('🚀 Starting TRUE incremental build (only updates changed content)...');
  if (force) console.log('⚡ Force mode: Rebuilding all pages');
  console.log('');

  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build:vite" first.');
    process.exit(1);
  }

  const bundleFiles = findBundleFiles(distDir);
  const cache = loadCache();
  
  // Check if bundle files changed (CSS/JS hashes changed after Vite build)
  const bundleChanged = !cache.bundleFiles || 
                        cache.bundleFiles.jsFile !== bundleFiles.jsFile ||
                        cache.bundleFiles.cssFile !== bundleFiles.cssFile;
  
  if (bundleChanged && !force) {
    console.log('⚠️  Bundle files changed - will rebuild all pages to update references');
    force = true;
  }

  const articlesDir = path.join(distDir, 'articles');
  const articlesExist = fs.existsSync(articlesDir) && fs.readdirSync(articlesDir).length > 0;

  if (!articlesExist && !force) {
    console.warn('⚠️  articles/ directory not found or empty');
    console.log('🔨 Enabling force rebuild…');
    force = true;
  }

  const newCache = { 
    pages: {}, 
    lastBuild: new Date().toISOString(),
    bundleFiles: bundleFiles
  };

  let stats = {
    new: 0,
    updated: 0,
    unchanged: 0,
    errors: 0
  };

  const currentPages = new Set();

  // ============================================================================
  // PROCESS POSTS
  // ============================================================================

  console.log('📄 Processing posts...');
  const startTime = Date.now();

  try {
    const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content,modified');
    console.log(`   Found ${posts.length} posts from API`);

    if (posts.length === 0) {
      console.warn('⚠️  No posts found from WordPress API!');
    }

    for (const post of posts) {
      const pagePath = `/articles/${post.slug}`;
      currentPages.add(pagePath);
      
      const description = stripHTML(post.excerpt.rendered).substring(0, 160) || 
                          'Read this article on DataEngineer Hub';
      
      const fullContent = post.content.rendered;
      
      const pageData = {
        title: stripHTML(post.title.rendered),
        description,
        path: pagePath,
        fullContent: fullContent,
        slug: post.slug
      };
      
      const contentHash = hashContent(pageData);
      const cachedPage = cache.pages[pagePath];
      
      // Only rebuild if content actually changed OR force mode
      const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
      
      if (needsRebuild) {
        try {
          const html = generateFullArticleHTML(pageData, bundleFiles);
          const filePath = path.join(distDir, pagePath, 'index.html');
          const dir = path.dirname(filePath);
          
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, html);
          
          const fileStats = fs.statSync(filePath);
          const fileSizeKB = (fileStats.size / 1024).toFixed(2);
          
          if (cachedPage) {
            stats.updated++;
            console.log(`   ↻ Updated: ${pagePath} (${fileSizeKB} KB)`);
          } else {
            stats.new++;
            console.log(`   ✓ Created: ${pagePath} (${fileSizeKB} KB)`);
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
    stats.errors++;
  }

  // ============================================================================
  // PROCESS CATEGORIES & TAGS
  // ============================================================================

  if (!postsOnly) {
    console.log('\n📂 Processing categories...');
    try {
      const categories = await fetchFromWP('/categories', 'slug,name,description');
      console.log(`   Found ${categories.length} categories from API`);

      for (const cat of categories) {
        const pagePath = `/category/${cat.slug}`;
        currentPages.add(pagePath);
        
        const pageData = {
          title: `Category: ${cat.name}`,
          description: stripHTML(cat.description).substring(0, 160) || `Browse ${cat.name} articles`,
          path: pagePath
        };
        
        const contentHash = hashContent(pageData);
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
        
        if (needsRebuild) {
          try {
            const html = generateSimpleHTML(pageData, bundleFiles);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, html);
            
            if (cachedPage) {
              stats.updated++;
            } else {
              stats.new++;
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
          built: needsRebuild ? new Date().toISOString() : cachedPage.built,
          type: 'category'
        };
      }
    } catch (error) {
      console.error('❌ Error processing categories:', error.message);
      stats.errors++;
    }

    console.log('\n🏷️  Processing tags...');
    try {
      const tags = await fetchFromWP('/tags', 'slug,name,description');
      console.log(`   Found ${tags.length} tags from API`);

      for (const tag of tags) {
        const pagePath = `/tag/${tag.slug}`;
        currentPages.add(pagePath);
        
        const pageData = {
          title: `Tag: ${tag.name}`,
          description: stripHTML(tag.description).substring(0, 160) || `Browse ${tag.name} articles`,
          path: pagePath
        };
        
        const contentHash = hashContent(pageData);
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;
        
        if (needsRebuild) {
          try {
            const html = generateSimpleHTML(pageData, bundleFiles);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, html);
            
            if (cachedPage) {
              stats.updated++;
            } else {
              stats.new++;
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
          built: needsRebuild ? new Date().toISOString() : cachedPage.built,
          type: 'tag'
        };
      }
    } catch (error) {
      console.error('❌ Error processing tags:', error.message);
      stats.errors++;
    }
  }

  // ============================================================================
  // SAVE CACHE & SUMMARY
  // ============================================================================

  saveCache(newCache);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✅ TRUE incremental build complete!');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   ✨ New pages:       ${stats.new}`);
  console.log(`   ↻  Updated pages:   ${stats.updated}`);
  console.log(`   ✓  Unchanged pages: ${stats.unchanged}`);
  if (stats.errors > 0) {
    console.log(`   ❌ Errors:          ${stats.errors}`);
  }
  console.log(`   ⏱️  Build time:      ${totalTime}s`);
  console.log('='.repeat(60));
  
  if (stats.updated > 0 || stats.new > 0) {
    console.log('\n✅ Only changed articles were rebuilt!');
    console.log('✅ FTP will only upload modified files');
  } else {
    console.log('\n✅ No changes detected - all files up to date!');
  }
  console.log('');

  if (stats.errors > 0) {
    console.log('\n⚠️  Build completed with errors. Please review the logs above.');
    process.exit(1);
  }
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
📚 TRUE Incremental Static Page Generator

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

🔥 KEY FEATURES:
  ✅ TRUE incremental builds - only rebuilds changed content
  ✅ Content-based hashing (ignores timestamps)
  ✅ FULL article content for SEO/AdSense crawlers
  ✅ Absolute image URLs from WordPress
  ✅ Relative asset paths for proper loading
  ✅ Bundle change detection (auto-rebuilds if CSS/JS changes)
  ✅ No unnecessary file replacements
  ✅ Fast builds (only touches changed files)

🎯 How It Works:
  - Hashes only actual content (title, description, body)
  - Ignores timestamps and bundle paths in hash
  - Only regenerates HTML if content changed
  - Detects bundle file changes and rebuilds when needed
  - FTP only uploads files that actually changed

📊 Example Output:
  When you add 1 new article:
    ✨ New pages: 1
    ↻  Updated pages: 0
    ✓  Unchanged pages: 45
  
  FTP will only upload:
    - The 1 new article folder
    - sitemap.xml (if changed)
    - .build-cache.json

🖼️ Image Processing:
  - Converts relative WordPress image URLs to absolute
  - Handles /wp-content/uploads/... paths
  - Fixes srcset for responsive images
  - Images load properly from WordPress CDN

🔧 Path Handling:
  - Uses relative paths (../) for CSS/JS bundles
  - Works when accessing /articles/slug/index.html directly
  - No blue screen errors on direct HTML access
  - Proper base URL resolution
  `);
  process.exit(0);
}

buildIncremental(options).catch(error => {
  console.error('\n❌ Build failed:', error);
  console.error(error.stack);
  process.exit(1);
});
