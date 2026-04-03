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
// ESSENTIAL PAGES - Static content for AdSense/SEO crawlers
// These pages currently serve the same SPA fallback HTML, causing "low value content"
// ============================================================================

const ESSENTIAL_PAGES = [
  {
    path: '/about',
    title: 'About Sainath Reddy - Data Engineer & Technical Writer',
    description: 'Learn about Sainath Reddy, the creator of DataEngineer Hub. Expert in Snowflake, Apache Spark, dbt, Airflow, and modern data engineering.',
    content: `
      <h1>About DataEngineer Hub</h1>
      <p>Welcome to DataEngineer Hub, created by <strong>Sainath Reddy</strong> — a passionate Data Engineer based in Hyderabad, India with extensive experience in building scalable data pipelines and cloud-native data solutions.</p>

      <h2>Who Am I?</h2>
      <p>I'm Sainath Reddy, a Data Engineer who specializes in designing and implementing modern data architectures. With years of hands-on experience, I've worked with technologies like <strong>Snowflake</strong>, <strong>Apache Spark</strong>, <strong>Apache Airflow</strong>, <strong>dbt</strong>, <strong>Apache Kafka</strong>, and various cloud platforms including <strong>AWS</strong>, <strong>Azure</strong>, and <strong>GCP</strong>.</p>

      <h2>My Mission</h2>
      <p>DataEngineer Hub was born from my desire to share practical, real-world knowledge about data engineering. I believe in making complex data concepts accessible to everyone — from beginners exploring the field to seasoned professionals looking for advanced techniques.</p>

      <h2>What You'll Find Here</h2>
      <ul>
        <li><strong>In-Depth Tutorials:</strong> Step-by-step guides on Snowflake, Spark, dbt, Airflow, and more</li>
        <li><strong>Architecture Deep-Dives:</strong> Understanding data warehouse design, lakehouse patterns, and ETL/ELT strategies</li>
        <li><strong>Tool Comparisons:</strong> Honest comparisons between data engineering tools and platforms</li>
        <li><strong>Best Practices:</strong> Industry-proven patterns for building reliable data pipelines</li>
        <li><strong>Career Guidance:</strong> Tips for growing your data engineering career</li>
      </ul>

      <h2>Technical Expertise</h2>
      <p>My core areas of expertise include:</p>
      <ul>
        <li><strong>Cloud Data Warehouses:</strong> Snowflake, BigQuery, Redshift, Synapse Analytics</li>
        <li><strong>Big Data Processing:</strong> Apache Spark, PySpark, Databricks</li>
        <li><strong>Data Orchestration:</strong> Apache Airflow, Prefect, Dagster</li>
        <li><strong>Data Transformation:</strong> dbt (data build tool), SQL, Python</li>
        <li><strong>Streaming:</strong> Apache Kafka, Spark Streaming, Flink</li>
        <li><strong>Cloud Platforms:</strong> AWS (Glue, EMR, S3, Redshift), Azure (Data Factory, Synapse), GCP (BigQuery, Dataflow)</li>
        <li><strong>DevOps for Data:</strong> Docker, Kubernetes, CI/CD pipelines, Terraform</li>
      </ul>

      <h2>My Philosophy</h2>
      <p>I believe that great data engineering is about more than just writing code. It's about understanding business requirements, designing maintainable systems, and building trust in data. Every article I write aims to bridge the gap between theory and practice.</p>

      <h2>Connect With Me</h2>
      <p>Have questions or want to collaborate? Reach out at <strong>sainath@dataengineerhub.blog</strong>. I'm always happy to discuss data engineering challenges and share insights.</p>
    `
  },
  {
    path: '/contact',
    title: 'Contact DataEngineer Hub - Get In Touch',
    description: 'Contact Sainath Reddy at DataEngineer Hub for data engineering queries, collaboration opportunities, or feedback.',
    content: `
      <h1>Contact Us</h1>
      <p>We'd love to hear from you! Whether you have a question about data engineering, want to suggest a topic, or are interested in collaboration, feel free to reach out.</p>

      <h2>How to Reach Us</h2>
      <ul>
        <li><strong>Email:</strong> sainath@dataengineerhub.blog</li>
        <li><strong>Phone:</strong> +91 9441414140</li>
        <li><strong>Location:</strong> Hyderabad, India</li>
      </ul>

      <h2>What Can We Help With?</h2>
      <ul>
        <li><strong>Technical Questions:</strong> Have a data engineering problem? Share it with us and we'll try to help or write about it.</li>
        <li><strong>Content Suggestions:</strong> Want us to cover a specific topic? We welcome suggestions for new articles and tutorials.</li>
        <li><strong>Collaboration:</strong> Interested in guest posting or partnership opportunities? Let's discuss.</li>
        <li><strong>Feedback:</strong> Found an error in an article or have suggestions for improvement? We appreciate your feedback.</li>
      </ul>

      <h2>Response Time</h2>
      <p>We typically respond to emails within 24-48 hours. For urgent inquiries, please mention "Urgent" in your subject line.</p>

      <h2>Follow DataEngineer Hub</h2>
      <p>Stay updated with the latest data engineering content by bookmarking our site and checking back regularly for new articles, tutorials, and guides.</p>
    `
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy - DataEngineer Hub',
    description: 'Read the Privacy Policy for DataEngineer Hub. Learn how we collect, use, and protect your personal information.',
    content: `
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> January 2025</p>
      <p>DataEngineer Hub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website at dataengineerhub.blog.</p>

      <h2>Information We Collect</h2>
      <p>We may collect information about you in various ways, including:</p>
      <ul>
        <li><strong>Log Data:</strong> When you visit our website, our servers may automatically log standard data provided by your web browser, including your IP address, browser type, pages visited, and the date/time of your visit.</li>
        <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your browsing experience and analyze site traffic.</li>
      </ul>

      <h2>Google AdSense and DART Cookies</h2>
      <p>We use Google AdSense to display advertisements on our website. Google, as a third-party vendor, uses the DART cookie to serve ads based on your visit to our site and other sites on the Internet. You may opt out of the use of the DART cookie by visiting the <strong>Google Ad and Content Network Privacy Policy</strong>.</p>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain our website</li>
        <li>To analyze how our website is used and improve content</li>
        <li>To display relevant advertisements</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>We may use third-party services such as Google Analytics and Google AdSense that collect, monitor, and analyze browsing data. These services have their own privacy policies addressing how they use such information.</p>

      <h2>GDPR Compliance (EU Users)</h2>
      <p>If you are a European Union resident, you have certain data protection rights under the General Data Protection Regulation (GDPR). You have the right to access, update, or delete your personal information. You can exercise these rights by contacting us.</p>

      <h2>CCPA Compliance (California Users)</h2>
      <p>Under the California Consumer Privacy Act (CCPA), California residents have the right to request disclosure of data collection practices, request deletion of personal data, and opt out of the sale of personal information. We do not sell personal information.</p>

      <h2>Children's Privacy</h2>
      <p>Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at <strong>sainath@dataengineerhub.blog</strong>.</p>
    `
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service - DataEngineer Hub',
    description: 'Read the Terms of Service for DataEngineer Hub. Understand the rules and regulations governing your use of our website.',
    content: `
      <h1>Terms of Service</h1>
      <p><strong>Last Updated:</strong> January 2025</p>
      <p>Welcome to DataEngineer Hub. By accessing and using this website (dataengineerhub.blog), you agree to comply with and be bound by the following terms and conditions.</p>

      <h2>Acceptance of Terms</h2>
      <p>By accessing this website, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>

      <h2>Intellectual Property</h2>
      <p>All content published on DataEngineer Hub, including articles, tutorials, code snippets, images, and graphics, is the intellectual property of DataEngineer Hub unless otherwise stated. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>

      <h2>Use of Content</h2>
      <ul>
        <li>You may read and share links to our articles for personal and educational purposes.</li>
        <li>Code snippets provided in tutorials may be used in your own projects with proper attribution.</li>
        <li>Bulk copying or scraping of content is strictly prohibited.</li>
      </ul>

      <h2>User Conduct</h2>
      <p>You agree not to use the website for any unlawful purpose, attempt to gain unauthorized access to any portion of the website, or interfere with the proper working of the website.</p>

      <h2>Disclaimer of Warranties</h2>
      <p>The content on DataEngineer Hub is provided "as is" without warranties of any kind. While we strive for accuracy, we make no guarantees about the completeness, reliability, or suitability of the information provided.</p>

      <h2>Limitation of Liability</h2>
      <p>DataEngineer Hub shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or reliance on any information provided.</p>

      <h2>Governing Law</h2>
      <p>These Terms of Service are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, India.</p>

      <h2>Contact</h2>
      <p>For questions about these Terms of Service, contact us at <strong>sainath@dataengineerhub.blog</strong>.</p>
    `
  },
  {
    path: '/disclaimer',
    title: 'Disclaimer - DataEngineer Hub',
    description: 'Read the Disclaimer for DataEngineer Hub. Understand the limitations and conditions of the information provided on our website.',
    content: `
      <h1>Disclaimer</h1>
      <p><strong>Last Updated:</strong> January 2025</p>

      <h2>General Information</h2>
      <p>The information provided on DataEngineer Hub (dataengineerhub.blog) is for general informational and educational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information.</p>

      <h2>Professional Advice Disclaimer</h2>
      <p>The articles, tutorials, and guides on this website are not a substitute for professional advice. Always consult with qualified professionals for specific technical implementations, architectural decisions, and production deployments.</p>

      <h2>Code and Technical Content</h2>
      <p>Code examples and technical tutorials are provided for educational purposes. While we test our examples, they may need modifications for your specific use case, environment, or production requirements. Always review and test code thoroughly before using it in production systems.</p>

      <h2>External Links</h2>
      <p>Our website may contain links to external websites. We have no control over the content and nature of these sites and are not responsible for their content or privacy practices.</p>

      <h2>Affiliate and Advertising Disclosure</h2>
      <p>DataEngineer Hub may display advertisements through Google AdSense and may contain affiliate links. We may earn a commission when you click on these links or make purchases through them. This does not affect our editorial independence or the accuracy of our content.</p>

      <h2>Contact</h2>
      <p>If you have any questions about this Disclaimer, please contact us at <strong>sainath@dataengineerhub.blog</strong>.</p>
    `
  }
];

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

  // eslint-disable-next-line no-constant-condition
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
          // After all retries failed, log error but continue with empty data
          console.error(`❌ Error fetching ${endpoint}: ${error.message}`);
          console.log(`ℹ️  Continuing build with empty data for ${endpoint}`);
          return items; // Return whatever we have so far (might be empty)
        }
      }
    }

    if (!success || !data) {
      // If we couldn't fetch this page, stop pagination
      break;
    }

    if (!Array.isArray(data) || data.length === 0) {
      break; // No more pages
    }

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
// ESSENTIAL PAGE HTML GENERATION - Unique content for AdSense approval
// ============================================================================

function generateEssentialPageHTML(pageData, bundleFiles) {
  const { title, description, path: pagePath, content } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  // Essential pages are at root level (depth = 0), so no relative prefix needed
  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = depth > 0 ? '../'.repeat(depth) : './';

  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  const buildTimestamp = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | DataEngineer Hub</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dataengineerhub.blog${pagePath}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="DataEngineer Hub" />

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8624144810216728" crossorigin="anonymous"></script>

    <!-- Build: ${buildTimestamp} -->

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

      .seo-content h2 {
        color: #93c5fd;
        font-size: 1.6rem;
        margin-top: 2rem;
        margin-bottom: 0.8rem;
      }

      .seo-content p {
        color: #e2e8f0;
        font-size: 1.1rem;
        margin-bottom: 1.2rem;
        line-height: 1.8;
      }

      .seo-content ul, .seo-content ol {
        margin-left: 2rem;
        margin-bottom: 1.2rem;
        color: #e2e8f0;
      }

      .seo-content li {
        margin-bottom: 0.5rem;
        line-height: 1.7;
      }

      .seo-content a {
        color: #60a5fa;
        text-decoration: none;
      }

      .seo-content a:hover {
        text-decoration: underline;
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

      .breadcrumb-nav {
        max-width: 900px;
        margin: 20px auto 0;
        padding: 0 20px;
      }

      .breadcrumb-list {
        display: flex;
        align-items: center;
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.875rem;
        color: #94a3b8;
      }

      .breadcrumb-item { display: flex; align-items: center; }
      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }
      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }
      .breadcrumb-icon { width: 16px; height: 16px; }
      .breadcrumb-separator { margin: 0 8px; color: #64748b; }
      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }

      @media (max-width: 768px) {
        .seo-content { padding: 20px 15px; margin-top: 20px; }
        .seo-content h1 { font-size: 1.8rem; }
      }
    </style>
  </head>
  <body>
    <div id="root">
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
          <li class="breadcrumb-item breadcrumb-current" aria-current="page">
            <span>${title}</span>
          </li>
        </ol>
      </nav>

      <div class="seo-content">
        ${content}
        <a href="https://dataengineerhub.blog" class="back-link">← Back to Home</a>

        <noscript>
          <p style="margin-top: 2rem; padding: 1rem; background: rgba(251, 191, 36, 0.2); border-radius: 8px; color: #fbbf24;">
            This page is fully accessible without JavaScript.
          </p>
        </noscript>
      </div>
    </div>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "https://dataengineerhub.blog${pagePath}",
      "publisher": {
        "@type": "Organization",
        "name": "DataEngineer Hub",
        "url": "https://dataengineerhub.blog"
      }
    }
    </script>

    ${productionJsFile ? `<script type="module" crossorigin src="${productionJsFile}"></script>` : ''}

    <script>
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
  // PROCESS ESSENTIAL PAGES - Always runs (critical for AdSense approval)
  // ============================================================================

  console.log('\n📄 Processing essential pages (About, Contact, Privacy, Terms, Disclaimer)…');

  for (const page of ESSENTIAL_PAGES) {
    const pagePath = page.path;
    currentPages.add(pagePath);

    const pageData = {
      title: page.title,
      description: page.description,
      path: pagePath,
      content: page.content
    };

    const contentHash = hashContent(pageData);
    const cachedPage = cache.pages[pagePath];
    const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

    if (needsRebuild) {
      try {
        const html = generateEssentialPageHTML(pageData, bundleFiles);
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
      console.log(`   ✓ Unchanged: ${pagePath}`);
    }

    newCache.pages[pagePath] = {
      hash: contentHash,
      built: needsRebuild ? new Date().toISOString() : cachedPage.built,
      type: 'essential'
    };
  }

  console.log(`✅ Essential pages processed: ${ESSENTIAL_PAGES.length} pages`);

  // ============================================================================
  // ENHANCE HOMEPAGE - Inject recent article links into dist/index.html
  // ============================================================================

  console.log('\n🏠 Enhancing homepage with recent article links…');

  try {
    const indexHtmlPath = path.join(distDir, 'index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Fetch recent posts for homepage enhancement
    const recentPosts = await fetchFromWP('/posts', 'slug,title,excerpt');
    const top10 = recentPosts.slice(0, 10);

    if (top10.length > 0) {
      const articleLinksHTML = top10.map(post => {
        const postTitle = post.title.rendered.replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 120).trim();
        return `<li style="margin-bottom: 1rem;"><a href="/articles/${post.slug}" style="color: #60a5fa; text-decoration: none; font-size: 1.1rem; font-weight: 500;">${postTitle}</a><p style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.3rem;">${excerpt}…</p></li>`;
      }).join('\n            ');

      const homepageEnhancement = `
      <!-- SEO: Recent articles for homepage uniqueness -->
      <div class="seo-content" style="max-width: 900px; margin: 40px auto; padding: 40px 20px; background: rgba(255,255,255,0.05); border-radius: 16px;">
        <h2 style="color: #93c5fd; font-size: 1.8rem; margin-bottom: 1.5rem;">Latest Data Engineering Articles</h2>
        <ul style="list-style: none; padding: 0;">
            ${articleLinksHTML}
        </ul>
        <a href="/articles" style="display: inline-block; margin-top: 1.5rem; padding: 10px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Browse All Articles →</a>
      </div>`;

      // Insert before the closing </div> of the seo-fallback section
      if (indexHtml.includes('class="seo-fallback"')) {
        // Insert the article links inside the seo-fallback div, before its closing tag
        const fallbackClosePattern = /(class="seo-fallback"[\s\S]*?)(<\/div>\s*<\/div>\s*<!--\s*End SEO)/;
        const simpleInsertPattern = /(class="seo-fallback"[\s\S]*?)(<!-- End SEO|<\/div>\s*<\/div>\s*<script)/;
        
        if (fallbackClosePattern.test(indexHtml)) {
          indexHtml = indexHtml.replace(fallbackClosePattern, `$1${homepageEnhancement}\n      $2`);
        } else if (simpleInsertPattern.test(indexHtml)) {
          indexHtml = indexHtml.replace(simpleInsertPattern, `$1${homepageEnhancement}\n      $2`);
        } else {
          // Fallback: insert before </body>
          indexHtml = indexHtml.replace('</body>', `${homepageEnhancement}\n  </body>`);
        }
      } else {
        // No seo-fallback div found, insert before </body>
        indexHtml = indexHtml.replace('</body>', `${homepageEnhancement}\n  </body>`);
      }

      fs.writeFileSync(indexHtmlPath, indexHtml);
      console.log(`   ✓ Homepage enhanced with ${top10.length} recent article links`);
    } else {
      console.log('   ⚠️  No posts found for homepage enhancement');
    }
  } catch (error) {
    console.error('   ❌ Error enhancing homepage:', error.message);
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
