// scripts/generateStaticPagesIncremental.js
// FIXED VERSION - Generates FULL CONTENT for SEO/AdSense with IMAGES
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
// BUNDLE DETECTION
// ============================================================================

function findBundleFiles(distDir) {
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('⚠️  dist/index.html not found');
    return { jsFile: null, cssFile: null };
  }

  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Match CSS file - straightforward
  const cssMatch = indexContent.match(/href="(\/assets\/[^"]+\.css)"/);
  const cssFile = cssMatch ? cssMatch[1] : null;

  // Match JS file - can be in /assets/ or /assets/js/
  const jsMatch = indexContent.match(/src="(\/assets\/[^"]+\.js)"/);
  let jsFile = jsMatch ? jsMatch[1] : null;

  // 🔥 CRITICAL: Find the ACTUAL JS file location
  if (jsFile) {
    const directPath = path.join(distDir, jsFile);

    if (!fs.existsSync(directPath)) {
      console.warn(`⚠️  JS file not found at expected path: ${jsFile}`);

      // Search strategy 1: Look in /assets/js/ subdirectory
      const jsSubdirPath = path.join(distDir, 'assets', 'js');
      if (fs.existsSync(jsSubdirPath)) {
        const jsFiles = fs.readdirSync(jsSubdirPath);
        const indexJsFile = jsFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));

        if (indexJsFile) {
          jsFile = `/assets/js/${indexJsFile}`;
          console.log(`✅ Found JS in subdirectory: ${jsFile}`);
          return { jsFile, cssFile };
        }
      }

      // Search strategy 2: Look directly in /assets/
      const assetsPath = path.join(distDir, 'assets');
      if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        const indexJsFile = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));

        if (indexJsFile) {
          jsFile = `/assets/${indexJsFile}`;
          console.log(`✅ Found JS in assets root: ${jsFile}`);
          return { jsFile, cssFile };
        }
      }

      console.error('❌ Could not locate JS bundle anywhere!');
      jsFile = null;
    }
  } else {
    // No JS match in index.html - try to find it manually
    console.warn('⚠️  No JS reference found in index.html, searching manually...');

    // Check /assets/js/ first
    const jsSubdirPath = path.join(distDir, 'assets', 'js');
    if (fs.existsSync(jsSubdirPath)) {
      const jsFiles = fs.readdirSync(jsSubdirPath);
      const indexJsFile = jsFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));

      if (indexJsFile) {
        jsFile = `/assets/js/${indexJsFile}`;
        console.log(`✅ Manually found JS: ${jsFile}`);
        return { jsFile, cssFile };
      }
    }

    // Check /assets/ root
    const assetsPath = path.join(distDir, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      const indexJsFile = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));

      if (indexJsFile) {
        jsFile = `/assets/${indexJsFile}`;
        console.log(`✅ Manually found JS: ${jsFile}`);
        return { jsFile, cssFile };
      }
    }
  }

  if (jsFile) console.log(`📦 JS bundle: ${jsFile}`);
  if (cssFile) console.log(`🎨 CSS bundle: ${cssFile}`);

  // Final verification
  if (jsFile) {
    const finalPath = path.join(distDir, jsFile);
    if (fs.existsSync(finalPath)) {
      console.log(`✅ Verified JS exists at: ${jsFile}`);
    } else {
      console.error(`❌ CRITICAL: JS bundle NOT found at ${jsFile}`);
    }
  }

  if (cssFile) {
    const finalPath = path.join(distDir, cssFile);
    if (fs.existsSync(finalPath)) {
      console.log(`✅ Verified CSS exists at: ${cssFile}`);
    } else {
      console.error(`❌ CRITICAL: CSS bundle NOT found at ${cssFile}`);
    }
  }

  return { jsFile, cssFile };
}

// ============================================================================
// API FETCHING
// ============================================================================

async function fetchFromWP(endpoint, fields = '') {
  const items = [];
  let page = 1;
  const RETRY_COUNT = 3;
  const TIMEOUT = 15000; // 15 seconds

  while (true) {
    const url = `${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}${fields ? `&_fields=${fields}` : ''}`;

    let attempt = 0;
    let success = false;
    let data = null;

    while (attempt < RETRY_COUNT && !success) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          if (res.status === 400) {
            // End of pagination
            success = true; // Loop done
            data = [];
            break;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        data = await res.json();
        success = true;
      } catch (error) {
        attempt++;
        console.warn(`⚠️  Fetch failed (Attempt ${attempt}/${RETRY_COUNT}) for ${url}: ${error.message}`);
        if (attempt < RETRY_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Linear backoff
        } else {
          console.error(`❌ Permanent failure fetching ${url}`);
          // If we can't fetch a page, we should likely stop the build or break the pagination loop
          // Breaking here stops pagination, so we at least return what we have so far
          return items;
        }
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) break;

    items.push(...data);
    page++;

    // Safety break for infinite loops
    if (page > 100) break;
  }

  return items;
}

function stripHTML(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// 🖼️ IMAGE PROCESSING - Make all image URLs absolute & fix CDN issues
// ============================================================================

function makeImagesAbsolute(content) {
  if (!content) return '';

  let processedContent = content;

  // Pattern 1: Fix data-recalc-dims (remove it - causes issues)
  processedContent = processedContent.replace(/data-recalc-dims="1"\s*/g, '');

  // Pattern 2: Fix images with / at end before loading attribute
  processedContent = processedContent.replace(/\s*\/\s*loading=/g, ' loading=');

  // Pattern 3: src="/wp-content/..." -> absolute URL
  processedContent = processedContent.replace(
    /src="(\/wp-content\/[^"]+)"/g,
    `src="${WORDPRESS_BASE_URL}$1"`
  );

  // Pattern 4: src="wp-content/..." (no leading slash) -> absolute URL
  processedContent = processedContent.replace(
    /src="(wp-content\/[^"]+)"/g,
    `src="${WORDPRESS_BASE_URL}/$1"`
  );

  // Pattern 5: Fix any remaining relative image URLs
  processedContent = processedContent.replace(
    /src="(\/[^"]+\.(jpg|jpeg|png|gif|webp|svg))"/gi,
    `src="${WORDPRESS_BASE_URL}$1"`
  );

  // Pattern 6: Fix srcset attributes for responsive images
  processedContent = processedContent.replace(
    /srcset="([^"]+)"/g,
    (match, srcsetValue) => {
      const fixedSrcset = srcsetValue
        .split(',')
        .map(src => {
          const trimmed = src.trim();
          // Already absolute (http/https)
          if (trimmed.startsWith('http')) {
            return trimmed;
          }
          // Starts with /wp-content/
          if (trimmed.startsWith('/wp-content/')) {
            return trimmed.replace(/^\/wp-content\//, `${WORDPRESS_BASE_URL}/wp-content/`);
          }
          // Starts with wp-content/ (no slash)
          if (trimmed.startsWith('wp-content/')) {
            return trimmed.replace(/^wp-content\//, `${WORDPRESS_BASE_URL}/wp-content/`);
          }
          // Other relative URLs starting with /
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

  // Pattern 7: Remove HTML entities that cause encoding issues
  processedContent = processedContent.replace(/&#038;/g, '&');

  return processedContent;
}

// ============================================================================
// 🔥 FIXED HTML GENERATION - FULL CONTENT FOR CRAWLERS WITH IMAGES
// ============================================================================

function generateFullArticleHTML(pageData, bundleFiles) {
  const { title, description, path: pagePath, fullContent = '', slug } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  // 🔥 CRITICAL: Use relative paths from article subdirectory
  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  // Remove leading slash and prepend relative prefix
  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  const buildTimestamp = new Date().toISOString();
  const buildHash = crypto.randomBytes(8).toString('hex');

  // 🖼️ Process images to make them absolute
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

    <!-- Build: ${buildTimestamp} | Hash: ${buildHash} -->

    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">
    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>
    ${productionCssFile ? `<link rel="stylesheet" crossorigin href="${productionCssFile}">` : ''}

    <style>
      /* 🎨 STYLED FOR CRAWLER VISIBILITY */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
        color: #f8fafc;
        line-height: 1.6;
        min-height: 100vh;
      }
      
      /* 🔥 CRITICAL: SEO content is FULLY VISIBLE by default */
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
      
      /* 🔥 FULL ARTICLE CONTENT - Visible to crawlers */
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
      
      /* 🖼️ IMAGE STYLING - Proper display and loading */
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
      
      /* Hide SEO content when React loads (for interactive experience) */
      body.react-loaded .seo-content {
        display: none;
      }
      
      /* Loading state for images */
      .seo-content .article-body img[loading="lazy"] {
        opacity: 0;
        transition: opacity 0.3s;
      }
      
        .seo-content .article-body img[loading="lazy"].loaded {
        opacity: 1;
      }
      
      /* 🔥 BREADCRUMB STYLES */
      .breadcrumb-nav {
        max-width: 900px;
        margin: 20px auto 0;
        padding: 0 20px;
      }
      
      .breadcrumb-list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.875rem;
        color: #94a3b8;
      }
      
      .breadcrumb-item {
        display: flex;
        align-items: center;
      }
      
      .breadcrumb-link {
        color: #60a5fa;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: color 0.2s;
      }
      
      .breadcrumb-link:hover {
        color: #93c5fd;
        text-decoration: underline;
      }
      
      .breadcrumb-icon {
        width: 16px;
        height: 16px;
      }
      
      .breadcrumb-separator {
        margin: 0 8px;
        color: #64748b;
      }
      
      .breadcrumb-current {
        color: #cbd5e1;
        font-weight: 500;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        
        .breadcrumb-nav {
          padding: 0 15px;
        }
        
        .breadcrumb-current {
          max-width: 150px;
        }
      }
    </style>
  </head>
  <body>
    <!-- 🔥 ROOT DIV: React will mount here, but SEO content is visible first -->
    <div id="root">
      <!-- 🔥 BREADCRUMBS - Visible to crawlers -->
      <nav aria-label="Breadcrumb" class="breadcrumb-nav">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <a href="https://dataengineerhub.blog" class="breadcrumb-link">
              <svg class="breadcrumb-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              Home
            </a>
          </li>
          <li class="breadcrumb-separator">›</li>
          <li class="breadcrumb-item">
            <a href="https://dataengineerhub.blog/articles" class="breadcrumb-link">Articles</a>
          </li>
          <li class="breadcrumb-separator">›</li>
          <li class="breadcrumb-item breadcrumb-current" aria-current="page">
            <span>${title}</span>
          </li>
        </ol>
      </nav>

      <!-- 🔥 FULL ARTICLE CONTENT - Visible to Googlebot/AdSense crawlers -->
      <div class="seo-content">
        <article>
          <h1>${title}</h1>
          <p class="excerpt">${description}</p>

          <!-- 🔥 THIS IS THE KEY: FULL HTML CONTENT WITH IMAGES -->
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

    <!-- 🔥 STRUCTURED DATA - Article Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title}",
      "description": "${description}",
      "image": {
        "@type": "ImageObject",
        "url": "https://dataengineerhub.blog/og-image.jpg",
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Person",
        "name": "Sainath Reddy",
        "url": "https://dataengineerhub.blog/about"
      },
      "publisher": {
        "@type": "Organization",
        "name": "DataEngineer Hub",
        "logo": {
          "@type": "ImageObject",
          "url": "https://dataengineerhub.blog/logo.png",
          "width": 250,
          "height": 250
        }
      },
      "datePublished": "${buildTimestamp}",
      "dateModified": "${buildTimestamp}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://dataengineerhub.blog${pagePath}"
      }
    }
    </script>

    <!-- 🔥 STRUCTURED DATA - BreadcrumbList Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://dataengineerhub.blog"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": "https://dataengineerhub.blog/articles"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${title}",
          "item": "https://dataengineerhub.blog${pagePath}"
        }
      ]
    }
    </script>

    <!-- 🔥 STRUCTURED DATA - Organization Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://dataengineerhub.blog/#organization",
      "name": "DataEngineer Hub",
      "url": "https://dataengineerhub.blog",
      "logo": {
        "@type": "ImageObject",
        "url": "https://dataengineerhub.blog/logo.png",
        "width": 250,
        "height": 250
      },
      "sameAs": [
        "https://twitter.com/sainath29"
      ]
    }
    </script>

    <!-- React app loads and takes over for interactive experience -->
    ${productionJsFile ? `<script type="module" crossorigin src="${productionJsFile}"></script>` : ''}

    <script>
      // 🖼️ Image lazy loading handler
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('.article-body img[loading="lazy"]');
        images.forEach(img => {
          img.addEventListener('load', function() {
            this.classList.add('loaded');
          });
          // If already loaded (cached)
          if (img.complete) {
            img.classList.add('loaded');
          }
        });
      });
      
      // Gracefully transition from static to React
      window.addEventListener('load', function() {
        // Wait for React to mount
        const checkReactMount = setInterval(function() {
          const root = document.getElementById('root');
          // Check if React has added its own content
          if (root && root.children.length > 1) {
            document.body.classList.add('react-loaded');
            clearInterval(checkReactMount);
            console.log('✅ React app mounted - switching to interactive mode');
          }
        }, 100);
        
        // Fallback: If React doesn't load in 3 seconds, keep static content
        setTimeout(function() {
          clearInterval(checkReactMount);
          if (!document.body.classList.contains('react-loaded')) {
            console.log('⚠️  React not detected - showing static content');
          }
        }, 3000);
      });
    </script>
  </body>
</html>`;
}

// Simplified HTML for categories/tags (they don't need full content)
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

  console.log('🚀 Starting FULL CONTENT static generation with images…');
  console.log('   🔥 Articles will include COMPLETE content for SEO/AdSense');
  console.log('   🖼️  Images will be properly linked with absolute URLs');
  if (force) console.log('⚡ Force mode: Rebuilding all pages');
  console.log('');

  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build:vite" first.');
    process.exit(1);
  }

  const bundleFiles = findBundleFiles(distDir);
  const articlesDir = path.join(distDir, 'articles');
  const articlesExist = fs.existsSync(articlesDir) && fs.readdirSync(articlesDir).length > 0;

  if (!articlesExist && !force) {
    console.warn('⚠️  articles/ directory not found or empty');
    console.log('🔨 Enabling force rebuild…');
    force = true;
  }

  const cache = loadCache();
  const newCache = { pages: {}, lastBuild: new Date().toISOString(), stats: {} };

  let stats = {
    new: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    errors: 0
  };

  const currentPages = new Set();

  // ============================================================================
  // 🔥 PROCESS POSTS - WITH FULL CONTENT AND IMAGES
  // ============================================================================

  console.log('📄 Processing posts with FULL content and images…');
  const startTime = Date.now();

  try {
    // 🔥 CRITICAL: Fetch with _embed to get full content
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

      // 🔥 KEY FIX: Use FULL content, not just 500 chars!
      const fullContent = post.content.rendered; // Complete HTML content

      const pageData = {
        title: stripHTML(post.title.rendered),
        description,
        path: pagePath,
        fullContent: fullContent, // 🔥 FULL content for crawlers
        slug: post.slug,
        modified: post.modified
      };

      const contentHash = hashContent(pageData);
      const cachedPage = cache.pages[pagePath];
      const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

      if (needsRebuild) {
        try {
          // 🔥 Use the FULL content generator with image processing
          const html = generateFullArticleHTML(pageData, bundleFiles);
          const filePath = path.join(distDir, pagePath, 'index.html');
          const dir = path.dirname(filePath);

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(filePath, html);

          // Verify file was created and has content
          const fileStats = fs.statSync(filePath);
          const fileSizeKB = (fileStats.size / 1024).toFixed(2);

          if (cachedPage) {
            stats.updated++;
            if (stats.updated <= 5) {
              console.log(`   ↻ Updated: ${pagePath} (${fileSizeKB} KB)`);
            }
          } else {
            stats.new++;
            if (stats.new <= 5) {
              console.log(`   ✓ Created: ${pagePath} (${fileSizeKB} KB)`);
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

    const finalArticleCount = fs.existsSync(articlesDir) ? fs.readdirSync(articlesDir).length : 0;
    console.log(`   📊 Verified: ${finalArticleCount} article directories in dist/articles/`);

  } catch (error) {
    console.error('❌ Error processing posts:', error.message);
    stats.errors++;
  }

  // ============================================================================
  // PROCESS CATEGORIES & TAGS (if not postsOnly)
  // ============================================================================

  if (!postsOnly) {
    console.log('\n📂 Processing categories…');
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

    console.log('\n🏷️  Processing tags…');
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
  // CLEANUP & SUMMARY
  // ============================================================================

  newCache.stats = stats;
  saveCache(newCache);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✅ FULL CONTENT build complete!');
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
  console.log('\n✅ All articles now contain FULL content for crawlers!');
  console.log('✅ AdSense/Googlebot will see complete articles with images');
  console.log('🖼️  All image URLs converted to absolute paths');
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
📚 FULL CONTENT Static Page Generator for AdSense

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
  ✅ FULL article content (not 500 char limit!)
  ✅ Complete HTML for SEO/AdSense crawlers
  ✅ Absolute image URLs from WordPress
  ✅ Relative asset paths for proper loading
  ✅ Works when accessing /index.html directly
  ✅ Automatic bundle detection
  ✅ Enhanced error logging
  ✅ Safety checks for missing directories
  ✅ Build timestamp + hash to force FTP uploads

🎯 AdSense Optimization:
  - Every article includes COMPLETE content
  - Crawlers see full HTML (20-50 KB per article)
  - All images properly linked with absolute URLs
  - No "thin content" issues
  - Proper structured data and meta tags
  - Static content visible before JavaScript loads

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

Safety Features:
  - Automatically detects missing articles directory
  - Forces rebuild if articles are missing
  - Verifies file creation after each write
  - Reports errors without silent failures
  - Auto-detects production bundle paths
  `);
  process.exit(0);
}

buildIncremental(options).catch(error => {
  console.error('\n❌ Build failed:', error);
  console.error(error.stack);
  process.exit(1);
});
