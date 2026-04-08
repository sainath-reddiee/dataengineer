// scripts/generateStaticPagesIncremental.js
// FIXED VERSION - Generates FULL CONTENT for SEO/AdSense with IMAGES
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const WORDPRESS_BASE_URL = 'https://app.dataengineerhub.blog';

// SEO overrides for CTR-optimized titles and descriptions
import seoOverrides, { getSEOOverride } from '../src/data/seoOverrides.js';

// ============================================================================
// 🛡️ XSS PREVENTION HELPERS
// ============================================================================

/** Escape a string for safe embedding inside HTML content and attributes. */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a string for safe embedding inside a JSON-LD <script> block value. */
function escapeJsonLd(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
/**
 * Sanitize WordPress HTML content for safe embedding in static pages.
 * Strips dangerous elements (script, iframe, object, embed, form),
 * on* event handlers, and javascript: URIs.
 */
function sanitizeWordPressHTML(html) {
  if (!html) return '';
  return String(html)
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe, object, embed, form tags
    .replace(/<\/?(?:iframe|object|embed|form|applet)\b[^>]*>/gi, '')
    // Remove on* event handlers from any tag
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URIs
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="')
    // Remove data: URIs in src attributes (potential XSS vector)
    .replace(/src\s*=\s*["']?\s*data:/gi, 'src="');
}

/**
 * Extract FAQ-style Q&A pairs from article HTML content.
 * Looks for h2/h3 headings that end with '?' and extracts the following
 * paragraph(s) as the answer text. Returns array of {question, answer}.
 */
function extractFAQsFromContent(html) {
  if (!html) return [];
  const faqs = [];
  // Match h2 or h3 headings ending with '?'
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const questionHtml = match[1];
    const question = stripHTML(questionHtml).trim();
    if (!question.endsWith('?')) continue;

    // Extract text between this heading and the next heading (h2/h3/h4)
    const afterHeading = html.substring(match.index + match[0].length);
    const nextHeadingMatch = afterHeading.match(/<h[2-4][^>]*>/i);
    const answerBlock = nextHeadingMatch
      ? afterHeading.substring(0, nextHeadingMatch.index)
      : afterHeading.substring(0, 1000);
    const answer = stripHTML(answerBlock).trim().substring(0, 500);

    if (answer.length > 20) {
      faqs.push({ question, answer });
    }
    if (faqs.length >= 10) break; // Cap at 10 FAQs per article
  }
  return faqs;
}

/**
 * Smart title truncation: omit " | DataEngineer Hub" suffix if combined
 * title exceeds 60 chars (Google's typical SERP truncation point).
 */
function smartTitle(title) {
  const suffix = ' | DataEngineer Hub';
  return (title.length + suffix.length) > 60 ? title : title + suffix;
}

/**
 * Normalize heading hierarchy in WordPress content.
 * If no <h2> exists but <h3> tags do, promote all headings up one level
 * (h3→h2, h4→h3, h5→h4, h6→h5) to avoid hierarchy gaps.
 */
function normalizeHeadings(html) {
  if (!html) return html;
  const hasH2 = /<h2[\s>]/i.test(html);
  const hasH3 = /<h3[\s>]/i.test(html);
  if (!hasH2 && hasH3) {
    // Promote each level up by one: h6→h5, h5→h4, h4→h3, h3→h2
    // Process from highest to lowest to avoid double-promotion
    html = html.replace(/<(\/?)h6([\s>])/gi, '<$1h5$2');
    html = html.replace(/<(\/?)h5([\s>])/gi, '<$1h4$2');
    html = html.replace(/<(\/?)h4([\s>])/gi, '<$1h3$2');
    html = html.replace(/<(\/?)h3([\s>])/gi, '<$1h2$2');
  }
  return html;
}
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

// Discover critical JS chunks for modulepreload hints (eliminates waterfall)
function findCriticalChunks(distDir) {
  const jsDir = path.join(distDir, 'assets', 'js');
  if (!fs.existsSync(jsDir)) return [];

  const jsFiles = fs.readdirSync(jsDir);
  // Critical chunks that the browser will need immediately after the entry module
  const criticalPrefixes = ['react-vendor-', 'vendor-', 'helmet-'];
  const chunks = [];

  for (const prefix of criticalPrefixes) {
    const match = jsFiles.find(f => f.startsWith(prefix) && f.endsWith('.js'));
    if (match) {
      chunks.push(`/assets/js/${match}`);
    }
  }

  if (chunks.length > 0) {
    console.log(`📦 Found ${chunks.length} critical chunks for modulepreload`);
  }
  return chunks;
}

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

function generateFullArticleHTML(pageData, bundleFiles, relatedArticles = []) {
  const { title: rawTitle, description: rawDescription, path: pagePath, fullContent = '', slug, date: postDate, modified: postModified, featuredImage } = pageData;
  const { jsFile, cssFile, modulePreloadHtml = '' } = bundleFiles;

  // 🛡️ Sanitize user-supplied strings from WordPress
  const title = escapeHtml(rawTitle);
  const description = escapeHtml(rawDescription);
  const titleJsonLd = escapeJsonLd(rawTitle);
  const descriptionJsonLd = escapeJsonLd(rawDescription);

  // 🔥 CRITICAL: Use relative paths from article subdirectory
  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  // Remove leading slash and prepend relative prefix
  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;
  // Convert absolute modulepreload paths to relative
  const relativeModulePreload = modulePreloadHtml.replace(/href="\/assets\//g, `href="${relativePrefix}assets/`);

  const buildTimestamp = new Date().toISOString();
  const buildHash = crypto.randomBytes(8).toString('hex');

  // 🖼️ Process images to make them absolute
  const absoluteContent = makeImagesAbsolute(fullContent);

  // 📐 Normalize heading hierarchy (h3→h2 etc. when h2 is missing)
  const processedContent = normalizeHeadings(absoluteContent);

  // 🖼️ Determine OG image: use featured image or fallback to default
  const ogImageUrl = featuredImage || 'https://dataengineerhub.blog/og-image.jpg';

  // 🔥 Extract FAQ-style Q&A from article content for FAQPage schema
  const articleFaqs = extractFAQsFromContent(processedContent);
  let faqSchemaBlock = '';
  if (articleFaqs.length > 0) {
    const faqItems = articleFaqs.map(faq =>
      `{"@type":"Question","name":${JSON.stringify(faq.question)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(faq.answer)}}}`
    ).join(',');
    faqSchemaBlock = `
    <!-- 🔥 STRUCTURED DATA - FAQPage Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${faqItems}]
    }
    </script>`;
  }

  // 🎬 Extract YouTube/Vimeo embeds for VideoObject schema
  let videoSchemaBlock = '';
  const videoEmbeds = [];
  const seenVideos = new Set();
  const ytRegex = /src=["'](?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})[^"']*["']/gi;
  const vimeoRegex = /src=["'](?:https?:)?\/\/player\.vimeo\.com\/video\/(\d+)[^"']*["']/gi;
  let vMatch;
  while ((vMatch = ytRegex.exec(processedContent)) !== null) {
    const vid = vMatch[1];
    if (seenVideos.has(vid)) continue;
    seenVideos.add(vid);
    videoEmbeds.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": title,
      "description": description,
      "thumbnailUrl": `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
      "uploadDate": postDate || buildTimestamp,
      "embedUrl": `https://www.youtube.com/embed/${vid}`,
      "contentUrl": `https://www.youtube.com/watch?v=${vid}`
    });
  }
  while ((vMatch = vimeoRegex.exec(processedContent)) !== null) {
    const vid = vMatch[1];
    if (seenVideos.has(`vimeo-${vid}`)) continue;
    seenVideos.add(`vimeo-${vid}`);
    videoEmbeds.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": title,
      "description": description,
      "thumbnailUrl": ogImageUrl,
      "uploadDate": postDate || buildTimestamp,
      "embedUrl": `https://player.vimeo.com/video/${vid}`
    });
  }
  if (videoEmbeds.length > 0) {
    const videoData = videoEmbeds.length === 1 ? videoEmbeds[0] : videoEmbeds;
    videoSchemaBlock = `
    <!-- 🎬 STRUCTURED DATA - VideoObject Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(videoData, null, 2)}
    </script>`;
  }

  // 📋 Extract HowTo steps from article content (regex-based, no DOM parser)
  let howToSchemaBlock = '';
  const howToSteps = [];
  // Strategy 1: H2/H3 headings with "Step N:" pattern
  const stepHeadingRegex = /<h[23][^>]*>\s*(Step\s+\d+\s*[:\-–—]\s*(.+?))\s*<\/h[23]>/gi;
  let stepMatch;
  while ((stepMatch = stepHeadingRegex.exec(processedContent)) !== null) {
    const stepName = (stepMatch[2] || stepMatch[1]).replace(/<[^>]+>/g, '').trim();
    if (stepName.length > 3) {
      // Grab next <p> text as step description
      const afterHeading = processedContent.substring(stepMatch.index + stepMatch[0].length, stepMatch.index + stepMatch[0].length + 1000);
      const pMatch = afterHeading.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const stepText = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500) : stepName;
      howToSteps.push({ name: stepName, text: stepText.length > 20 ? stepText : stepName });
    }
  }
  if (howToSteps.length >= 2) {
    const howToData = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": rawTitle,
      "description": rawDescription,
      "step": howToSteps.slice(0, 10).map((s, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": s.name,
        "text": s.text
      }))
    };
    howToSchemaBlock = `
    <!-- 📋 STRUCTURED DATA - HowTo Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(howToData, null, 2)}
    </script>`;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${smartTitle(title)}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
${featuredImage ? `    <link rel="preload" as="image" href="${featuredImage}" />` : ''}

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://dataengineerhub.blog${pagePath}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="DataEngineer Hub" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    <meta property="article:published_time" content="${postDate || buildTimestamp}" />
    <meta property="article:modified_time" content="${postModified || postDate || buildTimestamp}" />
    <meta property="article:author" content="https://dataengineerhub.blog/about" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@sainath29" />
    <meta name="twitter:creator" content="@sainath29" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta name="twitter:image:alt" content="${title}" />

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
            ${sanitizeWordPressHTML(processedContent)}
          </div>
          
          ${relatedArticles.length > 0 ? `
          <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <h2 style="color: #93c5fd; font-size: 1.4rem; margin-bottom: 1rem;">More Articles</h2>
            <ul style="list-style: none; padding: 0;">
              ${relatedArticles.map(a => `<li style="margin-bottom: 0.8rem;"><a href="/articles/${a.slug}" style="color: #60a5fa; text-decoration: none; font-weight: 500;">${escapeHtml(a.title)}</a></li>`).join('\n              ')}
            </ul>
          </div>
          ` : ''}

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
      "headline": "${titleJsonLd}",
      "description": "${descriptionJsonLd}",
      "image": {
        "@type": "ImageObject",
        "url": "${ogImageUrl}",
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Person",
        "@id": "https://dataengineerhub.blog/about#person",
        "name": "Sainath Reddy",
        "url": "https://dataengineerhub.blog/about",
        "jobTitle": "Data Engineer",
        "sameAs": [
          "https://twitter.com/sainath29",
          "https://www.linkedin.com/in/sainath-reddy-06a97817a/"
        ]
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
      "datePublished": "${postDate || buildTimestamp}",
      "dateModified": "${postModified || postDate || buildTimestamp}",
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
          "name": "${titleJsonLd}",
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

    <!-- 🔥 STRUCTURED DATA - Person/Author Schema (E-E-A-T) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://dataengineerhub.blog/#author",
      "name": "Sainath Reddy",
      "url": "https://dataengineerhub.blog",
      "jobTitle": "Data Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "Anblicks"
      },
      "sameAs": [
        "https://www.linkedin.com/in/sainath-reddy-06a97817a/",
        "https://twitter.com/sainath29",
        "https://github.com/sainathreddy-dataengineer"
      ],
      "knowsAbout": ["Data Engineering", "Snowflake", "AWS", "Azure", "Databricks", "Apache Airflow", "dbt", "ETL/ELT Pipelines", "Data Warehousing", "Cloud Architecture"],
      "description": "Data Engineer with 4+ years of experience specializing in building scalable data pipelines and cloud-native data solutions."
    }
    </script>
${faqSchemaBlock}
${videoSchemaBlock}
${howToSchemaBlock}

    <!-- React app loads and takes over for interactive experience -->
${relativeModulePreload}
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
  const { title: rawTitle, description: rawDescription, path: pagePath } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  // 🛡️ Sanitize user-supplied strings
  const title = escapeHtml(rawTitle);
  const description = escapeHtml(rawDescription);

  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${smartTitle(title)}</title>
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
// HOMEPAGE HTML ENHANCEMENT - Inject article listings for 500+ words
// ============================================================================

function generateHomepageEnhancement(allArticleSummaries, categories) {
  // Build category-to-name map
  const catMap = {};
  for (const cat of categories) {
    catMap[cat.id] = cat.name;
  }

  // Group articles by category
  const articlesByCategory = {};
  for (const article of allArticleSummaries) {
    for (const catId of article.categories) {
      const catName = catMap[catId] || 'General';
      if (!articlesByCategory[catName]) articlesByCategory[catName] = [];
      articlesByCategory[catName].push(article);
    }
  }

  // Build rich HTML content
  let articlesHTML = `
        <div class="seo-articles" style="margin-top: 3rem;">
          <h2 style="font-size: 2rem; color: #93c5fd; margin-bottom: 1.5rem; text-align: center;">Latest Data Engineering Articles</h2>
          <p style="color: #cbd5e1; text-align: center; margin-bottom: 2rem; font-size: 1.1rem;">
            Explore our comprehensive collection of ${allArticleSummaries.length} in-depth tutorials and guides covering 
            Snowflake, Apache Spark, dbt, Airflow, Python, SQL, and modern data engineering practices.
          </p>`;

  // Show articles grouped by category
  const sortedCategories = Object.entries(articlesByCategory)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [catName, articles] of sortedCategories) {
    articlesHTML += `
          <div style="margin-bottom: 2rem;">
            <h3 style="color: #60a5fa; font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">${catName} (${articles.length} articles)</h3>
            <ul style="list-style: none; padding: 0;">`;

    for (const article of articles.slice(0, 8)) {
      articlesHTML += `
              <li style="margin-bottom: 0.8rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <a href="https://dataengineerhub.blog/articles/${article.slug}" style="color: #e2e8f0; text-decoration: none; font-size: 1.05rem; font-weight: 500;">${escapeHtml(article.title)}</a>
                ${article.excerpt ? `<p style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.3rem; line-height: 1.5;">${escapeHtml(article.excerpt)}</p>` : ''}
              </li>`;
    }

    articlesHTML += `
            </ul>
          </div>`;
  }

  articlesHTML += `
          <div style="text-align: center; margin-top: 2rem;">
            <a href="https://dataengineerhub.blog/articles" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Browse All ${allArticleSummaries.length} Articles</a>
          </div>
        </div>`;

  return articlesHTML;
}

// ============================================================================
// ARTICLES LISTING PAGE HTML - Full listing of all articles (800+ words)
// ============================================================================

function generateArticlesListingHTML(allArticleSummaries, categories, bundleFiles) {
  const { jsFile, cssFile } = bundleFiles;

  const productionJsFile = jsFile ? `.${jsFile}` : null;
  const productionCssFile = cssFile ? `.${cssFile}` : null;

  const buildTimestamp = new Date().toISOString();

  // Build category-to-name map
  const catMap = {};
  for (const cat of categories) {
    catMap[cat.id] = { name: cat.name, slug: cat.slug };
  }

  // Build article list HTML
  let articleListHTML = '';
  for (const article of allArticleSummaries) {
    const catNames = article.categories
      .map(cid => catMap[cid])
      .filter(Boolean)
      .map(c => `<a href="https://dataengineerhub.blog/category/${c.slug}" style="color: #60a5fa; text-decoration: none; font-size: 0.8rem; background: rgba(96,165,250,0.1); padding: 2px 8px; border-radius: 4px;">${c.name}</a>`)
      .join(' ');

    articleListHTML += `
              <li style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <a href="https://dataengineerhub.blog/articles/${article.slug}" style="color: #f1f5f9; text-decoration: none; font-size: 1.15rem; font-weight: 600; line-height: 1.4;">${escapeHtml(article.title)}</a>
                ${catNames ? `<div style="margin-top: 0.4rem;">${catNames}</div>` : ''}
                ${article.excerpt ? `<p style="color: #94a3b8; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6;">${escapeHtml(article.excerpt)}</p>` : ''}
              </li>`;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>All Data Engineering Articles | DataEngineer Hub</title>
    <meta name="description" content="Browse all ${allArticleSummaries.length} data engineering articles on DataEngineer Hub. Tutorials on Snowflake, Apache Spark, dbt, Airflow, Python, SQL, and more." />
    <link rel="canonical" href="https://dataengineerhub.blog/articles" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dataengineerhub.blog/articles" />
    <meta property="og:title" content="All Data Engineering Articles | DataEngineer Hub" />
    <meta property="og:description" content="Browse ${allArticleSummaries.length} in-depth tutorials covering Snowflake, Spark, dbt, Airflow, Python, and modern data engineering." />
    <meta property="og:site_name" content="DataEngineer Hub" />
    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@sainath29" />
    <meta name="twitter:creator" content="@sainath29" />
    <meta name="twitter:title" content="All Data Engineering Articles | DataEngineer Hub" />
    <meta name="twitter:description" content="Browse ${allArticleSummaries.length} in-depth tutorials covering Snowflake, Spark, dbt, Airflow, Python, and modern data engineering." />
    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />
    <meta name="twitter:image:alt" content="All Data Engineering Articles | DataEngineer Hub" />

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
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1.2;
      }
      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }
      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }
      .seo-content a { color: #60a5fa; text-decoration: none; }
      .seo-content a:hover { text-decoration: underline; }
      body.react-loaded .seo-content { display: none; }
      body.react-loaded .breadcrumb-nav { display: none; }
      .breadcrumb-nav { max-width: 900px; margin: 20px auto 0; padding: 0 20px; }
      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }
      .breadcrumb-item { display: flex; align-items: center; }
      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }
      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }
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
          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>
          <li class="breadcrumb-separator">\u203A</li>
          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>Articles</span></li>
        </ol>
      </nav>

      <div class="seo-content">
        <h1>All Data Engineering Articles</h1>
        <p>
          Welcome to the complete article library at DataEngineer Hub. We have published <strong>${allArticleSummaries.length} in-depth articles</strong> covering
          the most important topics in modern data engineering, including cloud data warehouses, ETL and ELT pipelines,
          data orchestration, transformation tools, and programming best practices.
        </p>
        <p>
          Whether you are a beginner starting your data engineering journey or an experienced professional looking for advanced techniques,
          our tutorials provide practical, hands-on guidance with real-world examples and production-ready code snippets.
        </p>

        <h2>Browse All Articles</h2>
        <ul style="list-style: none; padding: 0;">
          ${articleListHTML}
        </ul>

        <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(96,165,250,0.1); border-radius: 12px; border: 1px solid rgba(96,165,250,0.2);">
          <h2 style="font-size: 1.3rem; margin-top: 0;">About DataEngineer Hub</h2>
          <p style="margin-bottom: 0;">
            DataEngineer Hub is created by Sainath Reddy, a data engineer with extensive experience building
            scalable data pipelines using Snowflake, Apache Spark, dbt, Apache Airflow, and cloud platforms like AWS, Azure, and GCP.
            Every article is written from hands-on experience to help you master data engineering concepts and tools.
          </p>
        </div>

        <a href="https://dataengineerhub.blog" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">\u2190 Back to Home</a>
      </div>
    </div>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "All Data Engineering Articles",
      "description": "Complete collection of ${allArticleSummaries.length} data engineering tutorials and guides",
      "url": "https://dataengineerhub.blog/articles",
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
        var checkReactMount = setInterval(function() {
          var root = document.getElementById('root');
          if (root && root.children.length > 2) {
            document.body.classList.add('react-loaded');
            clearInterval(checkReactMount);
          }
        }, 100);
        setTimeout(function() { clearInterval(checkReactMount); }, 3000);
      });
    </script>
  </body>
</html>`;
}

// ============================================================================
// CATEGORY PAGE HTML - Rich content with article listings per category
// ============================================================================

function generateCategoryPageHTML(category, categoryArticles, bundleFiles) {
  const { jsFile, cssFile } = bundleFiles;
  const pagePath = `/category/${category.slug}`;

  // 🛡️ Sanitize WordPress-sourced category name
  const safeName = escapeHtml(category.name);
  const safeNameJsonLd = escapeJsonLd(category.name);

  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  const productionJsFile = jsFile ? `${relativePrefix}${jsFile.substring(1)}` : null;
  const productionCssFile = cssFile ? `${relativePrefix}${cssFile.substring(1)}` : null;

  const buildTimestamp = new Date().toISOString();
  const catDescription = stripHTML(category.description || '').trim();

  // Build article list HTML
  let articleListHTML = '';
  for (const article of categoryArticles) {
    const safeTitle = escapeHtml(article.title);
    const safeExcerpt = escapeHtml(article.excerpt);
    articleListHTML += `
              <li style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <a href="https://dataengineerhub.blog/articles/${article.slug}" style="color: #f1f5f9; text-decoration: none; font-size: 1.15rem; font-weight: 600; line-height: 1.4;">${safeTitle}</a>
                ${article.excerpt ? `<p style="color: #94a3b8; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6;">${safeExcerpt}</p>` : ''}
              </li>`;
  }

  const descriptionMeta = catDescription || 'Browse ' + categoryArticles.length + ' articles about ' + safeName + ' on DataEngineer Hub. In-depth tutorials and guides for data engineers.';

  // Build the HTML using string concatenation to avoid template literal issues
  let html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>' + safeName + ' - Data Engineering Articles | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + descriptionMeta + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="' + (categoryArticles.length === 0 ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1') + '" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + safeName + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta property="og:description" content="Browse ' + categoryArticles.length + ' ' + safeName + ' tutorials and guides for data engineers." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + safeName + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta name="twitter:description" content="Browse ' + categoryArticles.length + ' ' + safeName + ' tutorials and guides for data engineers." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="' + safeName + ' Articles | DataEngineer Hub" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  if (productionCssFile) {
    html += '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n';
  }
  html += '\n    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 900px; margin: 0 auto; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; margin-top: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #60a5fa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 900px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.8rem; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>' + safeName + '</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>' + safeName + ' Articles</h1>\n';
  html += '        <p>\n';
  html += '          ' + (catDescription ? catDescription + ' ' : '') + 'Explore our collection of <strong>' + categoryArticles.length + ' in-depth articles</strong> about ' + safeName + '\n';
  html += '          on DataEngineer Hub. Each tutorial provides practical, hands-on guidance with real-world examples\n';
  html += '          to help you master ' + safeName + ' concepts and best practices.\n';
  html += '        </p>\n\n';
  html += '        <h2>All ' + safeName + ' Articles (' + categoryArticles.length + ')</h2>\n';
  html += '        <ul style="list-style: none; padding: 0;">\n';
  html += '          ' + articleListHTML + '\n';
  html += '        </ul>\n\n';
  if (categoryArticles.length === 0) {
    html += '        <p style="color: #94a3b8; font-style: italic;">New articles coming soon. Check back for the latest tutorials.</p>\n';
  }
  html += '        <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">\n';
  html += '          <a href="https://dataengineerhub.blog/articles" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Browse All Articles</a>\n';
  html += '          <a href="https://dataengineerhub.blog" style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid rgba(255,255,255,0.2);">&#8592; Back to Home</a>\n';
  html += '        </div>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "CollectionPage",\n';
  html += '      "name": "' + safeNameJsonLd + ' Articles",\n';
  html += '      "description": "Browse ' + categoryArticles.length + ' articles about ' + safeNameJsonLd + ' on DataEngineer Hub",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" }\n';
  html += '    }\n';
  html += '    <\/script>\n\n';
  if (productionJsFile) {
    html += '    <script type="module" crossorigin src="' + productionJsFile + '"><\/script>\n\n';
  }
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    <\/script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// MARKDOWN TO HTML CONVERTER - Lightweight converter for pSEO content
// ============================================================================

function markdownToHTML(md) {
  if (!md) return '';
  var html = md;

  // Convert code blocks (``` ... ```) first to protect their content
  var codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
    var idx = codeBlocks.length;
    codeBlocks.push('<pre style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0;"><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim() + '</code></pre>');
    return '%%CODEBLOCK' + idx + '%%';
  });

  // Convert markdown tables
  html = html.replace(/\n\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, function(match, headerRow, bodyRows) {
    var headers = headerRow.split('|').map(function(h) { return h.trim(); }).filter(function(h) { return h; });
    var tableHTML = '<div style="overflow-x: auto; margin: 1.5rem 0;"><table style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); border-radius: 8px;">';
    tableHTML += '<thead><tr>';
    for (var i = 0; i < headers.length; i++) {
      tableHTML += '<th style="padding: 10px 14px; border-bottom: 2px solid rgba(96,165,250,0.3); color: #93c5fd; text-align: left; font-weight: 600;">' + headers[i] + '</th>';
    }
    tableHTML += '</tr></thead><tbody>';
    var rows = bodyRows.trim().split('\n');
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].split('|').map(function(c) { return c.trim(); }).filter(function(c) { return c; });
      tableHTML += '<tr>';
      for (var c = 0; c < cells.length; c++) {
        tableHTML += '<td style="padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e2e8f0;">' + cells[c] + '</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table></div>';
    return tableHTML;
  });

  // Convert headers
  html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #a5b4fc; font-size: 1.15rem; margin-top: 1.5rem; margin-bottom: 0.5rem;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="color: #93c5fd; font-size: 1.3rem; margin-top: 1.8rem; margin-bottom: 0.6rem;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem;">$1</h2>');

  // Convert bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</code>');

  // Convert unordered lists
  html = html.replace(/((?:^[\t ]*[-*] .+\n?)+)/gm, function(match) {
    var items = match.trim().split('\n');
    var listHTML = '<ul style="margin: 0.8rem 0; padding-left: 1.5rem;">';
    for (var i = 0; i < items.length; i++) {
      var item = items[i].replace(/^[\t ]*[-*] /, '').trim();
      if (item) {
        listHTML += '<li style="margin-bottom: 0.4rem; color: #e2e8f0;">' + item + '</li>';
      }
    }
    listHTML += '</ul>';
    return listHTML;
  });

  // Convert numbered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, function(match) {
    var items = match.trim().split('\n');
    var listHTML = '<ol style="margin: 0.8rem 0; padding-left: 1.5rem;">';
    for (var i = 0; i < items.length; i++) {
      var item = items[i].replace(/^\d+\. /, '').trim();
      if (item) {
        listHTML += '<li style="margin-bottom: 0.4rem; color: #e2e8f0;">' + item + '</li>';
      }
    }
    listHTML += '</ol>';
    return listHTML;
  });

  // Convert paragraphs (double newlines)
  html = html.replace(/\n\n+/g, '</p><p style="color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8;">');

  // Restore code blocks
  for (var i = 0; i < codeBlocks.length; i++) {
    html = html.replace('%%CODEBLOCK' + i + '%%', codeBlocks[i]);
  }

  // Wrap in paragraph if not starting with a block element
  if (html && !html.trim().match(/^<(h[1-6]|ul|ol|div|table|pre|p)/)) {
    html = '<p style="color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8;">' + html;
  }
  if (html && !html.trim().match(/(\/h[1-6]|\/ul|\/ol|\/div|\/table|\/pre|\/p)>$/)) {
    html = html + '</p>';
  }

  return html;
}

// ============================================================================
// GLOSSARY HUB PAGE HTML - Listing page for all glossary terms (/glossary)
// ============================================================================

function generateGlossaryHubPageHTML(allGlossaryTerms, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;

  var productionJsFile = jsFile ? '.' + jsFile : null;
  var productionCssFile = cssFile ? '.' + cssFile : null;

  var buildTimestamp = new Date().toISOString();

  // Group terms by category
  var categoryMap = {};
  for (var i = 0; i < allGlossaryTerms.length; i++) {
    var term = allGlossaryTerms[i];
    var cat = term.category || 'general';
    if (!categoryMap[cat]) {
      categoryMap[cat] = [];
    }
    categoryMap[cat].push(term);
  }

  // Sort categories alphabetically
  var categoryKeys = Object.keys(categoryMap).sort();

  // Format category name for display
  function formatCategoryName(key) {
    return key.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  }

  // Build the category sections HTML
  var categorySectionsHTML = '';
  var categoryNavHTML = '';
  var totalTerms = allGlossaryTerms.length;

  for (var c = 0; c < categoryKeys.length; c++) {
    var catKey = categoryKeys[c];
    var catTerms = categoryMap[catKey];
    var catDisplayName = formatCategoryName(catKey);

    // Sort terms alphabetically within each category
    catTerms.sort(function(a, b) {
      return a.term.localeCompare(b.term);
    });

    categoryNavHTML += '<a href="#glossary-' + catKey + '" style="display: inline-block; padding: 6px 14px; background: rgba(96,165,250,0.12); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.9rem; border: 1px solid rgba(96,165,250,0.25); margin: 4px;">' + catDisplayName + ' (' + catTerms.length + ')</a>';

    categorySectionsHTML += '<div id="glossary-' + catKey + '" style="margin-top: 2.5rem;">';
    categorySectionsHTML += '<h2 style="color: #93c5fd; font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(147,197,253,0.2);">' + catDisplayName + '</h2>';
    categorySectionsHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">';

    for (var t = 0; t < catTerms.length; t++) {
      var glossaryTerm = catTerms[t];
      var shortDef = glossaryTerm.shortDefinition || '';
      if (shortDef.length > 150) {
        shortDef = shortDef.substring(0, 147) + '...';
      }

      categorySectionsHTML += '<a href="https://dataengineerhub.blog/glossary/' + glossaryTerm.slug + '" style="display: block; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); text-decoration: none; transition: border-color 0.2s;">';
      categorySectionsHTML += '<h3 style="color: #f1f5f9; font-size: 1.1rem; margin-bottom: 0.4rem; font-weight: 600;">' + glossaryTerm.term + '</h3>';
      categorySectionsHTML += '<p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0;">' + shortDef + '</p>';
      categorySectionsHTML += '</a>';
    }

    categorySectionsHTML += '</div>';
    categorySectionsHTML += '</div>';
  }

  var html = '<!doctype html>\n';
  html += '<html lang="en">\n';
  html += '  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>Data Engineering Glossary | ' + totalTerms + ' Key Terms Explained | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="Comprehensive data engineering glossary with ' + totalTerms + ' key terms explained. Learn about ETL, data warehousing, streaming, orchestration, cloud platforms, and more." />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog/glossary" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n';
  html += '\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog/glossary" />\n';
  html += '    <meta property="og:title" content="Data Engineering Glossary | ' + totalTerms + ' Key Terms Explained" />\n';
  html += '    <meta property="og:description" content="Comprehensive glossary covering ' + totalTerms + ' essential data engineering terms across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="Data Engineering Glossary | ' + totalTerms + ' Key Terms Explained" />\n';
  html += '    <meta name="twitter:description" content="Comprehensive glossary covering ' + totalTerms + ' essential data engineering terms across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="Data Engineering Glossary | DataEngineer Hub" />\n';
  html += '\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n';
  html += '\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += (productionCssFile ? '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n' : '');
  html += '\n';
  html += '    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body {\n';
  html += '        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n';
  html += '        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);\n';
  html += '        color: #f8fafc;\n';
  html += '        line-height: 1.6;\n';
  html += '        min-height: 100vh;\n';
  html += '      }\n';
  html += '      .seo-content {\n';
  html += '        max-width: 1000px;\n';
  html += '        margin: 0 auto;\n';
  html += '        padding: 40px 20px;\n';
  html += '        background: rgba(255, 255, 255, 0.05);\n';
  html += '        backdrop-filter: blur(10px);\n';
  html += '        border-radius: 16px;\n';
  html += '        margin-top: 40px;\n';
  html += '        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);\n';
  html += '      }\n';
  html += '      .seo-content h1 {\n';
  html += '        font-size: 2.5rem;\n';
  html += '        margin-bottom: 1rem;\n';
  html += '        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);\n';
  html += '        -webkit-background-clip: text;\n';
  html += '        -webkit-text-fill-color: transparent;\n';
  html += '        background-clip: text;\n';
  html += '        line-height: 1.2;\n';
  html += '      }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #60a5fa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 1000px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) {\n';
  html += '        .seo-content { padding: 20px 15px; margin-top: 20px; }\n';
  html += '        .seo-content h1 { font-size: 1.8rem; }\n';
  html += '      }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">\u203A</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>Glossary</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n';
  html += '\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>Data Engineering Glossary</h1>\n';
  html += '        <p>\n';
  html += '          Welcome to the DataEngineer Hub glossary \u2014 a comprehensive reference of <strong>' + totalTerms + ' essential data engineering terms</strong>\n';
  html += '          organized across ' + categoryKeys.length + ' categories. Whether you are preparing for interviews, studying for certifications,\n';
  html += '          or looking up unfamiliar concepts in documentation, this glossary provides clear, practical definitions\n';
  html += '          written by experienced data engineers.\n';
  html += '        </p>\n';
  html += '        <p>\n';
  html += '          Each term includes a concise definition, key points, frequently asked questions, and links to related concepts.\n';
  html += '          Topics span the full data engineering landscape: ETL/ELT pipelines, data warehousing, real-time streaming,\n';
  html += '          cloud platforms, data orchestration, data quality, governance, observability, and analytics engines.\n';
  html += '        </p>\n';
  html += '\n';
  html += '        <h2>Browse by Category</h2>\n';
  html += '        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 1rem;">\n';
  html += '          ' + categoryNavHTML + '\n';
  html += '        </div>\n';
  html += '\n';
  html += categorySectionsHTML;
  html += '\n';
  html += '        <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(96,165,250,0.1); border-radius: 12px; border: 1px solid rgba(96,165,250,0.2);">\n';
  html += '          <h2 style="font-size: 1.3rem; margin-top: 0;">Explore More</h2>\n';
  html += '          <p style="margin-bottom: 0.5rem;">\n';
  html += '            Looking for side-by-side tool comparisons? Check out our <a href="https://dataengineerhub.blog/compare">Data Engineering Comparisons</a> hub\n';
  html += '            to see how popular tools like Snowflake, Databricks, Spark, Kafka, and more stack up against each other.\n';
  html += '          </p>\n';
  html += '          <p style="margin-bottom: 0;">\n';
  html += '            For hands-on tutorials and in-depth guides, browse our <a href="https://dataengineerhub.blog/articles">full article library</a>.\n';
  html += '          </p>\n';
  html += '        </div>\n';
  html += '\n';
  html += '        <a href="https://dataengineerhub.blog" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">\u2190 Back to Home</a>\n';
  html += '      </div>\n';
  html += '    </div>\n';
  html += '\n';
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "CollectionPage",\n';
  html += '      "name": "Data Engineering Glossary",\n';
  html += '      "description": "Comprehensive glossary of ' + totalTerms + ' data engineering terms and concepts",\n';
  html += '      "url": "https://dataengineerhub.blog/glossary",\n';
  html += '      "numberOfItems": ' + totalTerms + ',\n';
  html += '      "publisher": {\n';
  html += '        "@type": "Organization",\n';
  html += '        "name": "DataEngineer Hub",\n';
  html += '        "url": "https://dataengineerhub.blog"\n';
  html += '      }\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  // ItemList schema for glossary terms
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "ItemList",\n';
  html += '      "name": "Data Engineering Glossary Terms",\n';
  html += '      "numberOfItems": ' + totalTerms + ',\n';
  html += '      "itemListElement": [\n';
  for (var ili = 0; ili < allGlossaryTerms.length; ili++) {
    var listTerm = allGlossaryTerms[ili];
    html += '        { "@type": "ListItem", "position": ' + (ili + 1) + ', "name": "' + listTerm.term.replace(/"/g, '\\"') + '", "url": "https://dataengineerhub.blog/glossary/' + listTerm.slug + '" }';
    html += (ili < allGlossaryTerms.length - 1 ? ',\n' : '\n');
  }
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Glossary" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  html += (productionJsFile ? '    <script type="module" crossorigin src="' + productionJsFile + '"></script>\n' : '');
  html += '\n';
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    </script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// GLOSSARY PAGE HTML GENERATION - Rich definition pages for pSEO
// ============================================================================

function generateGlossaryPageHTML(term, allGlossaryTerms, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;
  var pagePath = '/glossary/' + term.slug;

  var depth = (pagePath.match(/\//g) || []).length - 1;
  var relativePrefix = '../'.repeat(depth);

  var productionJsFile = jsFile ? relativePrefix + jsFile.substring(1) : null;
  var productionCssFile = cssFile ? relativePrefix + cssFile.substring(1) : null;

  var buildTimestamp = new Date().toISOString();

  // Build key points HTML
  var keyPointsHTML = '';
  if (term.keyPoints && term.keyPoints.length > 0) {
    keyPointsHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem;">Key Points</h2>';
    keyPointsHTML += '<ul style="margin: 0.8rem 0; padding-left: 1.5rem;">';
    for (var i = 0; i < term.keyPoints.length; i++) {
      keyPointsHTML += '<li style="margin-bottom: 0.6rem; color: #e2e8f0; line-height: 1.7;">' + term.keyPoints[i] + '</li>';
    }
    keyPointsHTML += '</ul>';
  }

  // Build FAQ HTML and schema
  var faqHTML = '';
  var faqSchemaItems = '';
  if (term.faqs && term.faqs.length > 0) {
    faqHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Frequently Asked Questions</h2>';
    for (var f = 0; f < term.faqs.length; f++) {
      var faq = term.faqs[f];
      faqHTML += '<div style="margin-bottom: 1.5rem; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border-left: 3px solid #60a5fa;">';
      faqHTML += '<h3 style="color: #f1f5f9; font-size: 1.15rem; margin-bottom: 0.5rem;">' + escapeHtml(faq.question) + '</h3>';
      faqHTML += '<p style="color: #cbd5e1; font-size: 1.05rem; line-height: 1.7; margin: 0;">' + escapeHtml(faq.answer) + '</p>';
      faqHTML += '</div>';
      if (f > 0) faqSchemaItems += ',';
      faqSchemaItems += '{"@type":"Question","name":' + JSON.stringify(faq.question) + ',"acceptedAnswer":{"@type":"Answer","text":' + JSON.stringify(faq.answer.replace(/\n/g, ' ')) + '}}';
    }
  }

  // Build related terms HTML
  var relatedHTML = '';
  if (term.relatedTerms && term.relatedTerms.length > 0) {
    relatedHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Related Terms</h2>';
    relatedHTML += '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">';
    for (var r = 0; r < term.relatedTerms.length; r++) {
      var relSlug = term.relatedTerms[r];
      var relTerm = null;
      for (var t = 0; t < allGlossaryTerms.length; t++) {
        if (allGlossaryTerms[t].slug === relSlug) { relTerm = allGlossaryTerms[t]; break; }
      }
      if (relTerm) {
        relatedHTML += '<a href="https://dataengineerhub.blog/glossary/' + relSlug + '" style="display: inline-block; padding: 8px 16px; background: rgba(96,165,250,0.15); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.95rem; border: 1px solid rgba(96,165,250,0.3); transition: background 0.2s;">' + relTerm.term + '</a>';
      } else {
        var displayName = relSlug.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        relatedHTML += '<a href="https://dataengineerhub.blog/glossary/' + relSlug + '" style="display: inline-block; padding: 8px 16px; background: rgba(96,165,250,0.15); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.95rem; border: 1px solid rgba(96,165,250,0.3);">' + displayName + '</a>';
      }
    }
    relatedHTML += '</div>';
  }

  // Build related tools HTML
  var toolsHTML = '';
  if (term.relatedTools && term.relatedTools.length > 0) {
    toolsHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Related Tools</h2>';
    toolsHTML += '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">';
    for (var tl = 0; tl < term.relatedTools.length; tl++) {
      toolsHTML += '<span style="display: inline-block; padding: 8px 16px; background: rgba(167,139,250,0.15); color: #a5b4fc; border-radius: 20px; font-size: 0.95rem; border: 1px solid rgba(167,139,250,0.3);">' + term.relatedTools[tl] + '</span>';
    }
    toolsHTML += '</div>';
  }

  // Build external links HTML
  var linksHTML = '';
  if (term.externalLinks && term.externalLinks.length > 0) {
    linksHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Learn More</h2>';
    linksHTML += '<ul style="list-style: none; padding: 0;">';
    for (var el = 0; el < term.externalLinks.length; el++) {
      var link = term.externalLinks[el];
      linksHTML += '<li style="margin-bottom: 0.75rem;"><a href="' + link.url + '" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none; font-size: 1.05rem;">&#8599; ' + link.title + '</a></li>';
    }
    linksHTML += '</ul>';
  }

  // Convert fullDefinition markdown to HTML
  var fullDefHTML = markdownToHTML(term.fullDefinition || '');

  // Category display name
  var categoryDisplay = (term.category || '').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });

  var descriptionMeta = term.shortDefinition || ('Learn what ' + term.term + ' means in data engineering. Comprehensive definition, key points, and FAQs.');

  // Build HTML
  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>What is ' + term.term + '? | Data Engineering Glossary | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="article" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="What is ' + term.term + '? | Data Engineering Glossary" />\n';
  html += '    <meta property="og:description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="What is ' + term.term + '? | Data Engineering Glossary" />\n';
  html += '    <meta name="twitter:description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="What is ' + term.term + '? | Data Engineering Glossary" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  if (productionCssFile) {
    html += '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n';
  }
  html += '\n    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 900px; margin: 0 auto; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; margin-top: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #60a5fa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 900px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.8rem; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';

  // Breadcrumbs
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog/glossary" class="breadcrumb-link">Glossary</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>' + term.term + '</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';

  // Main content
  html += '      <div class="seo-content">\n';
  html += '        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">\n';
  html += '          <span style="padding: 6px 14px; background: rgba(96,165,250,0.15); color: #93c5fd; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(96,165,250,0.3);">' + categoryDisplay + '</span>\n';
  if (term.lastUpdated) {
    html += '          <span style="color: #64748b; font-size: 0.85rem;">Updated: ' + term.lastUpdated + '</span>\n';
  }
  html += '        </div>\n';
  html += '        <h1>What is ' + term.term + '?</h1>\n';
  html += '        <p style="font-size: 1.2rem; color: #cbd5e1; margin-bottom: 2rem; line-height: 1.8; border-left: 3px solid #60a5fa; padding-left: 1rem;">' + term.shortDefinition + '</p>\n\n';

  // Full definition (markdown converted to HTML)
  html += '        <div class="full-definition">\n';
  html += '          ' + fullDefHTML + '\n';
  html += '        </div>\n\n';

  // Key points
  html += '        ' + keyPointsHTML + '\n\n';

  // FAQs
  html += '        ' + faqHTML + '\n\n';

  // Related terms
  html += '        ' + relatedHTML + '\n\n';

  // Related tools
  html += '        ' + toolsHTML + '\n\n';

  // External links
  html += '        ' + linksHTML + '\n\n';

  // Navigation buttons
  html += '        <div style="margin-top: 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">\n';
  html += '          <a href="https://dataengineerhub.blog/glossary" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Browse All Terms</a>\n';
  html += '          <a href="https://dataengineerhub.blog/articles" style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid rgba(255,255,255,0.2);">Read Articles</a>\n';
  html += '        </div>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';

  // Schema.org - DefinedTerm
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "DefinedTerm",\n';
  html += '      "name": "' + term.term.replace(/"/g, '\\"') + '",\n';
  html += '      "description": "' + (term.shortDefinition || '').replace(/"/g, '\\"') + '",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "inDefinedTermSet": {\n';
  html += '        "@type": "DefinedTermSet",\n';
  html += '        "name": "Data Engineering Glossary",\n';
  html += '        "url": "https://dataengineerhub.blog/glossary"\n';
  html += '      }\n';
  html += '    }\n';
  html += '    <\/script>\n\n';

  // Article schema for glossary term
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "Article",\n';
  html += '      "headline": "What is ' + term.term.replace(/"/g, '\\"') + '?",\n';
  html += '      "description": "' + (term.shortDefinition || '').replace(/"/g, '\\"') + '",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "author": {\n';
  html += '        "@type": "Person",\n';
  html += '        "name": "Sainath Reddy",\n';
  html += '        "url": "https://dataengineerhub.blog/about"\n';
  html += '      },\n';
  html += '      "publisher": {\n';
  html += '        "@type": "Organization",\n';
  html += '        "name": "DataEngineer Hub",\n';
  html += '        "url": "https://dataengineerhub.blog"\n';
  html += '      }' + (term.lastUpdated ? ',\n      "dateModified": "' + term.lastUpdated + '"' : '') + '\n';
  html += '    }\n';
  html += '    <\/script>\n\n';

  // FAQ schema
  if (term.faqs && term.faqs.length > 0) {
    html += '    <script type="application/ld+json">\n';
    html += '    {\n';
    html += '      "@context": "https://schema.org",\n';
    html += '      "@type": "FAQPage",\n';
    html += '      "mainEntity": [' + faqSchemaItems + ']\n';
    html += '    }\n';
    html += '    <\/script>\n\n';
  }

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Glossary", "item": "https://dataengineerhub.blog/glossary" },\n';
  html += '        { "@type": "ListItem", "position": 3, "name": "' + term.term.replace(/"/g, '\\"') + '" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    <\/script>\n\n';

  // React bootstrap
  if (productionJsFile) {
    html += '    <script type="module" crossorigin src="' + productionJsFile + '"><\/script>\n\n';
  }
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    <\/script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// COMPARE HUB PAGE HTML - Listing page for all comparisons (/compare)
// ============================================================================

function generateCompareHubPageHTML(allComparisons, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;

  var productionJsFile = jsFile ? '.' + jsFile : null;
  var productionCssFile = cssFile ? '.' + cssFile : null;

  var buildTimestamp = new Date().toISOString();

  // Group comparisons by category
  var categoryMap = {};
  for (var i = 0; i < allComparisons.length; i++) {
    var comp = allComparisons[i];
    var cat = comp.category || 'general';
    if (!categoryMap[cat]) {
      categoryMap[cat] = [];
    }
    categoryMap[cat].push(comp);
  }

  // Sort categories alphabetically
  var categoryKeys = Object.keys(categoryMap).sort();

  // Format category name for display
  function formatCategoryName(key) {
    return key.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  }

  // Build the category sections HTML
  var categorySectionsHTML = '';
  var categoryNavHTML = '';
  var totalComparisons = allComparisons.length;

  for (var c = 0; c < categoryKeys.length; c++) {
    var catKey = categoryKeys[c];
    var catComps = categoryMap[catKey];
    var catDisplayName = formatCategoryName(catKey);

    // Sort comparisons alphabetically by toolA
    catComps.sort(function(a, b) {
      var nameA = a.toolA + ' vs ' + a.toolB;
      var nameB = b.toolA + ' vs ' + b.toolB;
      return nameA.localeCompare(nameB);
    });

    categoryNavHTML += '<a href="#compare-' + catKey + '" style="display: inline-block; padding: 6px 14px; background: rgba(167,139,250,0.12); color: #c4b5fd; text-decoration: none; border-radius: 20px; font-size: 0.9rem; border: 1px solid rgba(167,139,250,0.25); margin: 4px;">' + catDisplayName + ' (' + catComps.length + ')</a>';

    categorySectionsHTML += '<div id="compare-' + catKey + '" style="margin-top: 2.5rem;">';
    categorySectionsHTML += '<h2 style="color: #c4b5fd; font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(196,181,253,0.2);">' + catDisplayName + '</h2>';
    categorySectionsHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">';

    for (var t = 0; t < catComps.length; t++) {
      var comparison = catComps[t];
      var shortVerdict = comparison.shortVerdict || '';
      if (shortVerdict.length > 160) {
        shortVerdict = shortVerdict.substring(0, 157) + '...';
      }

      var winnerBadge = '';
      if (comparison.winner && comparison.winner !== 'It Depends') {
        winnerBadge = '<span style="display: inline-block; padding: 2px 8px; background: rgba(74,222,128,0.15); color: #4ade80; border-radius: 4px; font-size: 0.8rem; margin-top: 0.5rem;">Winner: ' + comparison.winner + '</span>';
      } else {
        winnerBadge = '<span style="display: inline-block; padding: 2px 8px; background: rgba(250,204,21,0.15); color: #facc15; border-radius: 4px; font-size: 0.8rem; margin-top: 0.5rem;">It Depends</span>';
      }

      categorySectionsHTML += '<a href="https://dataengineerhub.blog/compare/' + comparison.slug + '" style="display: block; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); text-decoration: none; transition: border-color 0.2s;">';
      categorySectionsHTML += '<h3 style="color: #f1f5f9; font-size: 1.1rem; margin-bottom: 0.4rem; font-weight: 600;">' + comparison.toolA + ' vs ' + comparison.toolB + '</h3>';
      categorySectionsHTML += '<p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.3rem 0;">' + shortVerdict + '</p>';
      categorySectionsHTML += winnerBadge;
      categorySectionsHTML += '</a>';
    }

    categorySectionsHTML += '</div>';
    categorySectionsHTML += '</div>';
  }

  var html = '<!doctype html>\n';
  html += '<html lang="en">\n';
  html += '  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>Data Engineering Tool Comparisons | ' + totalComparisons + ' Head-to-Head Guides | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="Compare ' + totalComparisons + ' popular data engineering tools side by side. Detailed feature comparisons for data warehousing, streaming, orchestration, analytics, and more." />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog/compare" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n';
  html += '\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog/compare" />\n';
  html += '    <meta property="og:title" content="Data Engineering Tool Comparisons | ' + totalComparisons + ' Head-to-Head Guides" />\n';
  html += '    <meta property="og:description" content="Side-by-side comparisons of ' + totalComparisons + ' data engineering tools across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="Data Engineering Tool Comparisons | ' + totalComparisons + ' Head-to-Head Guides" />\n';
  html += '    <meta name="twitter:description" content="Side-by-side comparisons of ' + totalComparisons + ' data engineering tools across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="Data Engineering Tool Comparisons | DataEngineer Hub" />\n';
  html += '\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n';
  html += '\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += (productionCssFile ? '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n' : '');
  html += '\n';
  html += '    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body {\n';
  html += '        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n';
  html += '        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);\n';
  html += '        color: #f8fafc;\n';
  html += '        line-height: 1.6;\n';
  html += '        min-height: 100vh;\n';
  html += '      }\n';
  html += '      .seo-content {\n';
  html += '        max-width: 1000px;\n';
  html += '        margin: 0 auto;\n';
  html += '        padding: 40px 20px;\n';
  html += '        background: rgba(255, 255, 255, 0.05);\n';
  html += '        backdrop-filter: blur(10px);\n';
  html += '        border-radius: 16px;\n';
  html += '        margin-top: 40px;\n';
  html += '        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);\n';
  html += '      }\n';
  html += '      .seo-content h1 {\n';
  html += '        font-size: 2.5rem;\n';
  html += '        margin-bottom: 1rem;\n';
  html += '        background: linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%);\n';
  html += '        -webkit-background-clip: text;\n';
  html += '        -webkit-text-fill-color: transparent;\n';
  html += '        background-clip: text;\n';
  html += '        line-height: 1.2;\n';
  html += '      }\n';
  html += '      .seo-content h2 { color: #c4b5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #a78bfa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 1000px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #a78bfa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #c4b5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) {\n';
  html += '        .seo-content { padding: 20px 15px; margin-top: 20px; }\n';
  html += '        .seo-content h1 { font-size: 1.8rem; }\n';
  html += '      }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">\u203A</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>Comparisons</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n';
  html += '\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>Data Engineering Tool Comparisons</h1>\n';
  html += '        <p>\n';
  html += '          Choosing the right tool is one of the most impactful decisions a data engineer makes. Our <strong>' + totalComparisons + ' head-to-head comparison guides</strong>\n';
  html += '          break down the differences between popular data engineering tools across features, performance, pricing,\n';
  html += '          and real-world use cases so you can make informed decisions for your stack.\n';
  html += '        </p>\n';
  html += '        <p>\n';
  html += '          Each comparison includes a detailed feature matrix, an honest verdict on which tool wins for different scenarios,\n';
  html += '          and practical recommendations based on team size, budget, and use case. Categories span data warehousing,\n';
  html += '          streaming platforms, orchestration tools, analytics engines, data quality, and cloud platforms.\n';
  html += '        </p>\n';
  html += '\n';
  html += '        <h2>Browse by Category</h2>\n';
  html += '        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 1rem;">\n';
  html += '          ' + categoryNavHTML + '\n';
  html += '        </div>\n';
  html += '\n';
  html += categorySectionsHTML;
  html += '\n';
  html += '        <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(167,139,250,0.1); border-radius: 12px; border: 1px solid rgba(167,139,250,0.2);">\n';
  html += '          <h2 style="font-size: 1.3rem; margin-top: 0;">Explore More</h2>\n';
  html += '          <p style="margin-bottom: 0.5rem;">\n';
  html += '            Need to understand a specific concept before comparing tools? Visit our <a href="https://dataengineerhub.blog/glossary">Data Engineering Glossary</a>\n';
  html += '            for clear definitions of key terms and technologies.\n';
  html += '          </p>\n';
  html += '          <p style="margin-bottom: 0;">\n';
  html += '            For hands-on tutorials and implementation guides, browse our <a href="https://dataengineerhub.blog/articles">full article library</a>.\n';
  html += '          </p>\n';
  html += '        </div>\n';
  html += '\n';
  html += '        <a href="https://dataengineerhub.blog" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">\u2190 Back to Home</a>\n';
  html += '      </div>\n';
  html += '    </div>\n';
  html += '\n';
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "CollectionPage",\n';
  html += '      "name": "Data Engineering Tool Comparisons",\n';
  html += '      "description": "Side-by-side comparisons of ' + totalComparisons + ' popular data engineering tools",\n';
  html += '      "url": "https://dataengineerhub.blog/compare",\n';
  html += '      "numberOfItems": ' + totalComparisons + ',\n';
  html += '      "publisher": {\n';
  html += '        "@type": "Organization",\n';
  html += '        "name": "DataEngineer Hub",\n';
  html += '        "url": "https://dataengineerhub.blog"\n';
  html += '      }\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  // ItemList schema for comparisons
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "ItemList",\n';
  html += '      "name": "Data Engineering Tool Comparisons",\n';
  html += '      "numberOfItems": ' + totalComparisons + ',\n';
  html += '      "itemListElement": [\n';
  for (var ci = 0; ci < allComparisons.length; ci++) {
    var comp = allComparisons[ci];
    html += '        { "@type": "ListItem", "position": ' + (ci + 1) + ', "name": "' + (comp.toolA + ' vs ' + comp.toolB).replace(/"/g, '\\"') + '", "url": "https://dataengineerhub.blog/compare/' + comp.slug + '" }';
    html += (ci < allComparisons.length - 1 ? ',\n' : '\n');
  }
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Compare" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n';
  html += '\n';

  html += (productionJsFile ? '    <script type="module" crossorigin src="' + productionJsFile + '"></script>\n' : '');
  html += '\n';
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    </script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// COMPARE PAGE HTML GENERATION - Tool comparison pages for pSEO
// ============================================================================

function generateComparePageHTML(comparison, allComparisons, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;
  var pagePath = '/compare/' + comparison.slug;

  var depth = (pagePath.match(/\//g) || []).length - 1;
  var relativePrefix = '../'.repeat(depth);

  var productionJsFile = jsFile ? relativePrefix + jsFile.substring(1) : null;
  var productionCssFile = cssFile ? relativePrefix + cssFile.substring(1) : null;

  var buildTimestamp = new Date().toISOString();

  // Build feature comparison table
  var featureTableHTML = '';
  if (comparison.features && comparison.features.length > 0) {
    featureTableHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Feature Comparison</h2>';
    featureTableHTML += '<div style="overflow-x: auto; margin: 1rem 0;">';
    featureTableHTML += '<table style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden;">';
    featureTableHTML += '<thead><tr>';
    featureTableHTML += '<th style="padding: 12px 16px; border-bottom: 2px solid rgba(96,165,250,0.3); color: #93c5fd; text-align: left; font-weight: 600;">Feature</th>';
    featureTableHTML += '<th style="padding: 12px 16px; border-bottom: 2px solid rgba(96,165,250,0.3); color: #93c5fd; text-align: left; font-weight: 600;">' + comparison.toolA + '</th>';
    featureTableHTML += '<th style="padding: 12px 16px; border-bottom: 2px solid rgba(96,165,250,0.3); color: #93c5fd; text-align: left; font-weight: 600;">' + comparison.toolB + '</th>';
    featureTableHTML += '<th style="padding: 12px 16px; border-bottom: 2px solid rgba(96,165,250,0.3); color: #93c5fd; text-align: center; font-weight: 600;">Winner</th>';
    featureTableHTML += '</tr></thead><tbody>';
    for (var fi = 0; fi < comparison.features.length; fi++) {
      var feat = comparison.features[fi];
      var winnerColor = feat.winner === comparison.toolA ? '#34d399' : (feat.winner === comparison.toolB ? '#f472b6' : '#fbbf24');
      featureTableHTML += '<tr>';
      featureTableHTML += '<td style="padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #f1f5f9; font-weight: 500;">' + feat.name + '</td>';
      featureTableHTML += '<td style="padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e2e8f0;">' + feat.toolAValue + '</td>';
      featureTableHTML += '<td style="padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e2e8f0;">' + feat.toolBValue + '</td>';
      featureTableHTML += '<td style="padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: ' + winnerColor + '; text-align: center; font-weight: 500;">' + (feat.winner || 'Tie') + '</td>';
      featureTableHTML += '</tr>';
    }
    featureTableHTML += '</tbody></table></div>';
  }

  // Build pros/cons HTML
  var prosConsHTML = '';
  if (comparison.pros) {
    prosConsHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2.5rem;">';

    // Tool A pros/cons
    prosConsHTML += '<div>';
    prosConsHTML += '<h3 style="color: #34d399; font-size: 1.2rem; margin-bottom: 0.8rem;">' + comparison.toolA + ' Pros</h3>';
    if (comparison.pros.toolA && comparison.pros.toolA.length > 0) {
      prosConsHTML += '<ul style="list-style: none; padding: 0;">';
      for (var pa = 0; pa < comparison.pros.toolA.length; pa++) {
        prosConsHTML += '<li style="margin-bottom: 0.5rem; color: #e2e8f0; padding-left: 1.2rem; position: relative;"><span style="position: absolute; left: 0; color: #34d399;">+</span> ' + comparison.pros.toolA[pa] + '</li>';
      }
      prosConsHTML += '</ul>';
    }
    if (comparison.cons && comparison.cons.toolA && comparison.cons.toolA.length > 0) {
      prosConsHTML += '<h3 style="color: #f87171; font-size: 1.2rem; margin-top: 1.5rem; margin-bottom: 0.8rem;">' + comparison.toolA + ' Cons</h3>';
      prosConsHTML += '<ul style="list-style: none; padding: 0;">';
      for (var ca = 0; ca < comparison.cons.toolA.length; ca++) {
        prosConsHTML += '<li style="margin-bottom: 0.5rem; color: #e2e8f0; padding-left: 1.2rem; position: relative;"><span style="position: absolute; left: 0; color: #f87171;">-</span> ' + comparison.cons.toolA[ca] + '</li>';
      }
      prosConsHTML += '</ul>';
    }
    prosConsHTML += '</div>';

    // Tool B pros/cons
    prosConsHTML += '<div>';
    prosConsHTML += '<h3 style="color: #34d399; font-size: 1.2rem; margin-bottom: 0.8rem;">' + comparison.toolB + ' Pros</h3>';
    if (comparison.pros.toolB && comparison.pros.toolB.length > 0) {
      prosConsHTML += '<ul style="list-style: none; padding: 0;">';
      for (var pb = 0; pb < comparison.pros.toolB.length; pb++) {
        prosConsHTML += '<li style="margin-bottom: 0.5rem; color: #e2e8f0; padding-left: 1.2rem; position: relative;"><span style="position: absolute; left: 0; color: #34d399;">+</span> ' + comparison.pros.toolB[pb] + '</li>';
      }
      prosConsHTML += '</ul>';
    }
    if (comparison.cons && comparison.cons.toolB && comparison.cons.toolB.length > 0) {
      prosConsHTML += '<h3 style="color: #f87171; font-size: 1.2rem; margin-top: 1.5rem; margin-bottom: 0.8rem;">' + comparison.toolB + ' Cons</h3>';
      prosConsHTML += '<ul style="list-style: none; padding: 0;">';
      for (var cb = 0; cb < comparison.cons.toolB.length; cb++) {
        prosConsHTML += '<li style="margin-bottom: 0.5rem; color: #e2e8f0; padding-left: 1.2rem; position: relative;"><span style="position: absolute; left: 0; color: #f87171;">-</span> ' + comparison.cons.toolB[cb] + '</li>';
      }
      prosConsHTML += '</ul>';
    }
    prosConsHTML += '</div>';
    prosConsHTML += '</div>';
  }

  // Convert intro and finalVerdict markdown to HTML
  var introHTML = markdownToHTML(comparison.intro || '');
  var verdictHTML = markdownToHTML(comparison.finalVerdict || '');

  // Related comparisons
  var relatedCompHTML = '';
  if (comparison.relatedComparisons && comparison.relatedComparisons.length > 0) {
    relatedCompHTML += '<h2 style="color: #93c5fd; font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem;">Related Comparisons</h2>';
    relatedCompHTML += '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">';
    for (var rc = 0; rc < comparison.relatedComparisons.length; rc++) {
      var relSlug = comparison.relatedComparisons[rc];
      var relComp = null;
      for (var ac = 0; ac < allComparisons.length; ac++) {
        if (allComparisons[ac].slug === relSlug) { relComp = allComparisons[ac]; break; }
      }
      var relLabel = relComp ? (relComp.toolA + ' vs ' + relComp.toolB) : relSlug.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
      relatedCompHTML += '<a href="https://dataengineerhub.blog/compare/' + relSlug + '" style="display: inline-block; padding: 8px 16px; background: rgba(96,165,250,0.15); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.95rem; border: 1px solid rgba(96,165,250,0.3);">' + relLabel + '</a>';
    }
    relatedCompHTML += '</div>';
  }

  // Winner badge
  var winnerBadge = '';
  if (comparison.winner) {
    var badgeColor = comparison.winner === 'It Depends' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
    var badgeTextColor = comparison.winner === 'It Depends' ? '#fbbf24' : '#34d399';
    var badgeBorder = comparison.winner === 'It Depends' ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)';
    winnerBadge = '<span style="padding: 6px 14px; background: ' + badgeColor + '; color: ' + badgeTextColor + '; border-radius: 20px; font-size: 0.85rem; border: 1px solid ' + badgeBorder + '; font-weight: 600;">Winner: ' + comparison.winner + '</span>';
  }

  var descriptionMeta = comparison.shortVerdict || (comparison.toolA + ' vs ' + comparison.toolB + ' comparison for data engineers. Feature-by-feature analysis with pros, cons, and verdict.');

  // Build HTML
  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>' + comparison.toolA + ' vs ' + comparison.toolB + ' | Data Engineering Tools Comparison | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="article" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + comparison.toolA + ' vs ' + comparison.toolB + ' Comparison" />\n';
  html += '    <meta property="og:description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + comparison.toolA + ' vs ' + comparison.toolB + ' Comparison" />\n';
  html += '    <meta name="twitter:description" content="' + descriptionMeta.replace(/"/g, '&quot;') + '" />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="' + comparison.toolA + ' vs ' + comparison.toolB + ' Comparison" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  if (productionCssFile) {
    html += '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n';
  }
  html += '\n    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 900px; margin: 0 auto; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; margin-top: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #60a5fa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 900px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.8rem; } .pros-cons-grid { grid-template-columns: 1fr !important; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';

  // Breadcrumbs
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog/compare" class="breadcrumb-link">Compare</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>' + comparison.toolA + ' vs ' + comparison.toolB + '</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';

  // Main content
  html += '      <div class="seo-content">\n';
  html += '        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">\n';
  html += '          <span style="padding: 6px 14px; background: rgba(96,165,250,0.15); color: #93c5fd; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(96,165,250,0.3);">' + (comparison.category || '') + '</span>\n';
  html += '          ' + winnerBadge + '\n';
  if (comparison.lastUpdated) {
    html += '          <span style="color: #64748b; font-size: 0.85rem;">Updated: ' + comparison.lastUpdated + '</span>\n';
  }
  html += '        </div>\n';
  html += '        <h1>' + comparison.toolA + ' vs ' + comparison.toolB + '</h1>\n';
  html += '        <p style="font-size: 1.2rem; color: #cbd5e1; margin-bottom: 2rem; line-height: 1.8; border-left: 3px solid #60a5fa; padding-left: 1rem;">' + (comparison.shortVerdict || '') + '</p>\n\n';

  // Intro (markdown)
  if (introHTML) {
    html += '        <div class="comparison-intro">\n';
    html += '          ' + introHTML + '\n';
    html += '        </div>\n\n';
  }

  // Feature comparison table
  html += '        ' + featureTableHTML + '\n\n';

  // Pros/cons
  html += '        ' + prosConsHTML + '\n\n';

  // Final verdict (markdown)
  if (verdictHTML) {
    html += '        <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(96,165,250,0.2);">\n';
    html += '          ' + verdictHTML + '\n';
    html += '        </div>\n\n';
  }

  // Related comparisons
  html += '        ' + relatedCompHTML + '\n\n';

  // Navigation buttons
  html += '        <div style="margin-top: 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">\n';
  html += '          <a href="https://dataengineerhub.blog/compare" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Browse All Comparisons</a>\n';
  html += '          <a href="https://dataengineerhub.blog/glossary" style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid rgba(255,255,255,0.2);">Explore Glossary</a>\n';
  html += '        </div>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';

  // Schema.org - Article with comparison
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "Article",\n';
  html += '      "headline": "' + comparison.toolA + ' vs ' + comparison.toolB + ' Comparison",\n';
  html += '      "description": "' + (comparison.shortVerdict || '').replace(/"/g, '\\"') + '",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" }\n';
  html += '    }\n';
  html += '    <\/script>\n\n';

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://dataengineerhub.blog/compare" },\n';
  html += '        { "@type": "ListItem", "position": 3, "name": "' + (comparison.toolA + ' vs ' + comparison.toolB).replace(/"/g, '\\"') + '" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    <\/script>\n\n';

  // React bootstrap
  if (productionJsFile) {
    html += '    <script type="module" crossorigin src="' + productionJsFile + '"><\/script>\n\n';
  }
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    <\/script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// TAG PAGE HTML GENERATION - Rich content with article listings
// ============================================================================

function generateTagPageHTML(tag, tagArticles, bundleFiles) {
  const { jsFile, cssFile } = bundleFiles;
  const pagePath = '/tag/' + tag.slug;

  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  const productionJsFile = jsFile ? relativePrefix + jsFile.substring(1) : null;
  const productionCssFile = cssFile ? relativePrefix + cssFile.substring(1) : null;

  const buildTimestamp = new Date().toISOString();
  const tagDescription = stripHTML(tag.description || '').trim();

  // Build article list HTML
  var articleListHTML = '';
  for (var i = 0; i < tagArticles.length; i++) {
    var article = tagArticles[i];
    articleListHTML += '\n              <li style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">';
    articleListHTML += '\n                <a href="https://dataengineerhub.blog/articles/' + article.slug + '" style="color: #f1f5f9; text-decoration: none; font-size: 1.15rem; font-weight: 600; line-height: 1.4;">' + escapeHtml(article.title) + '</a>';
    if (article.excerpt) {
      articleListHTML += '\n                <p style="color: #94a3b8; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6;">' + escapeHtml(article.excerpt) + '</p>';
    }
    articleListHTML += '\n              </li>';
  }

  var descriptionMeta = tagDescription || 'Browse ' + tagArticles.length + ' articles tagged with ' + tag.name + ' on DataEngineer Hub. In-depth tutorials and guides for data engineers.';

  // Build the HTML using string concatenation to avoid template literal issues
  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>' + tag.name + ' - Tagged Articles | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + descriptionMeta + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="' + (tagArticles.length === 0 ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1') + '" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + tag.name + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta property="og:description" content="Browse ' + tagArticles.length + ' ' + tag.name + ' tutorials and guides for data engineers." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + tag.name + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta name="twitter:description" content="Browse ' + tagArticles.length + ' ' + tag.name + ' tutorials and guides for data engineers." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="' + tag.name + ' Articles | DataEngineer Hub" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  if (productionCssFile) {
    html += '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n';
  }
  html += '\n    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 900px; margin: 0 auto; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; margin-top: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.6rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.1rem; margin-bottom: 1.2rem; line-height: 1.8; }\n';
  html += '      .seo-content a { color: #60a5fa; text-decoration: none; }\n';
  html += '      .seo-content a:hover { text-decoration: underline; }\n';
  html += '      body.react-loaded .seo-content { display: none; }\n';
  html += '      body.react-loaded .breadcrumb-nav { display: none; }\n';
  html += '      .breadcrumb-nav { max-width: 900px; margin: 20px auto 0; padding: 0 20px; }\n';
  html += '      .breadcrumb-list { display: flex; align-items: center; list-style: none; padding: 0; margin: 0; font-size: 0.875rem; color: #94a3b8; }\n';
  html += '      .breadcrumb-item { display: flex; align-items: center; }\n';
  html += '      .breadcrumb-link { color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px; }\n';
  html += '      .breadcrumb-link:hover { color: #93c5fd; text-decoration: underline; }\n';
  html += '      .breadcrumb-separator { margin: 0 8px; color: #64748b; }\n';
  html += '      .breadcrumb-current { color: #cbd5e1; font-weight: 500; }\n';
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.8rem; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog/articles" class="breadcrumb-link">Articles</a></li>\n';
  html += '          <li class="breadcrumb-separator">&#8250;</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>' + tag.name + '</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>Articles Tagged: ' + tag.name + '</h1>\n';
  html += '        <p>\n';
  html += '          ' + (tagDescription ? tagDescription + ' ' : '') + 'Explore our collection of <strong>' + tagArticles.length + ' in-depth articles</strong> tagged with ' + tag.name + '\n';
  html += '          on DataEngineer Hub. Each tutorial provides practical, hands-on guidance with real-world examples\n';
  html += '          to help you master ' + tag.name + ' concepts and best practices in data engineering.\n';
  html += '        </p>\n\n';
  if (tagArticles.length > 0) {
    html += '        <h2>All ' + tag.name + ' Articles (' + tagArticles.length + ')</h2>\n';
    html += '        <ul style="list-style: none; padding: 0;">\n';
    html += '          ' + articleListHTML + '\n';
    html += '        </ul>\n\n';
  } else {
    html += '        <p style="color: #94a3b8; font-style: italic;">New articles about ' + tag.name + ' are coming soon. Check back for the latest tutorials and guides.</p>\n\n';
  }
  html += '        <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">\n';
  html += '          <a href="https://dataengineerhub.blog/articles" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Browse All Articles</a>\n';
  html += '          <a href="https://dataengineerhub.blog" style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid rgba(255,255,255,0.2);">&#8592; Back to Home</a>\n';
  html += '        </div>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "CollectionPage",\n';
  html += '      "name": "' + tag.name + ' Articles",\n';
  html += '      "description": "Browse ' + tagArticles.length + ' articles tagged with ' + tag.name + ' on DataEngineer Hub",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" }\n';
  html += '    }\n';
  html += '    <\/script>\n\n';
  if (productionJsFile) {
    html += '    <script type="module" crossorigin src="' + productionJsFile + '"><\/script>\n\n';
  }
  html += '    <script>\n';
  html += '      window.addEventListener("load", function() {\n';
  html += '        var checkReactMount = setInterval(function() {\n';
  html += '          var root = document.getElementById("root");\n';
  html += '          if (root && root.children.length > 2) {\n';
  html += '            document.body.classList.add("react-loaded");\n';
  html += '            clearInterval(checkReactMount);\n';
  html += '          }\n';
  html += '        }, 100);\n';
  html += '        setTimeout(function() { clearInterval(checkReactMount); }, 3000);\n';
  html += '      });\n';
  html += '    <\/script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// ESSENTIAL PAGE HTML GENERATION - Unique content for AdSense approval
// ============================================================================

function generateEssentialPageHTML(pageData, bundleFiles) {
  const { title: rawTitle, description: rawDescription, path: pagePath, content } = pageData;
  const { jsFile, cssFile } = bundleFiles;

  // 🛡️ Sanitize user-supplied strings
  const title = escapeHtml(rawTitle);
  const description = escapeHtml(rawDescription);
  const titleJsonLd = escapeJsonLd(rawTitle);
  const descriptionJsonLd = escapeJsonLd(rawDescription);

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
    <title>${smartTitle(title)}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dataengineerhub.blog${pagePath}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="DataEngineer Hub" />
    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@sainath29" />
    <meta name="twitter:creator" content="@sainath29" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />
    <meta name="twitter:image:alt" content="${title}" />

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
      "name": "${titleJsonLd}",
      "description": "${descriptionJsonLd}",
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
  const criticalChunks = findCriticalChunks(distDir);
  bundleFiles.modulePreloadHtml = criticalChunks.map(c => `    <link rel="modulepreload" href="${c}" />`).join('\n');
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

  // Declared outside try so it's accessible for homepage/articles/category pages
  let allArticleSummaries = [];

  try {
    // 🔥 CRITICAL: Fetch with _embed to get full content + categories + tags for mapping
    const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content,modified,categories,tags,jetpack_featured_media_url');
    console.log(`   Found ${posts.length} posts from API`);

    // Build article list for "More Articles" section and listing pages
    allArticleSummaries = posts.map(p => ({
      slug: p.slug,
      title: stripHTML(p.title.rendered),
      excerpt: stripHTML(p.excerpt.rendered).substring(0, 200),
      categories: p.categories || [],
      tags: p.tags || []
    }));

    if (posts.length === 0) {
      console.warn('⚠️  No posts found from WordPress API!');
    }

    for (const post of posts) {
      const pagePath = `/articles/${post.slug}`;
      currentPages.add(pagePath);

      const rawTitle = stripHTML(post.title.rendered);
      const rawDescription = stripHTML(post.excerpt.rendered).substring(0, 160) ||
        'Read this article on DataEngineer Hub';

      // Apply SEO overrides for CTR-optimized titles and descriptions
      const seoOverride = getSEOOverride(post.slug);

      // 🔥 KEY FIX: Use FULL content, not just 500 chars!
      const fullContent = post.content.rendered; // Complete HTML content

      const pageData = {
        title: seoOverride?.title || rawTitle,
        description: seoOverride?.description || rawDescription,
        path: pagePath,
        fullContent: fullContent, // 🔥 FULL content for crawlers
        slug: post.slug,
        date: post.date,
        modified: post.modified,
        featuredImage: post.jetpack_featured_media_url || null
      };

      const contentHash = hashContent(pageData);
      const cachedPage = cache.pages[pagePath];
      const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

      if (needsRebuild) {
        try {
          // 🔥 Use the FULL content generator with image processing
          const relatedArticles = allArticleSummaries.filter(a => a.slug !== post.slug).slice(0, 10);
          const html = generateFullArticleHTML(pageData, bundleFiles, relatedArticles);
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

    // 📝 SEO Override Coverage Report
    const overrideKeys = Object.keys(seoOverrides);
    const articleSlugs = posts.map(p => p.slug);
    const coveredSlugs = articleSlugs.filter(slug => seoOverrides[slug]);
    const missingSlugs = articleSlugs.filter(slug => !seoOverrides[slug]);
    const coverage = articleSlugs.length > 0 ? ((coveredSlugs.length / articleSlugs.length) * 100).toFixed(1) : 0;
    console.log(`   🎯 SEO Override Coverage: ${coveredSlugs.length}/${articleSlugs.length} articles (${coverage}%)`);
    if (missingSlugs.length > 0) {
      console.log(`   ⚠️  ${missingSlugs.length} articles missing SEO overrides:`);
      missingSlugs.slice(0, 10).forEach(slug => console.log(`      - ${slug}`));
      if (missingSlugs.length > 10) {
        console.log(`      ... and ${missingSlugs.length - 10} more`);
      }
    }
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
  // PROCESS CATEGORIES & TAGS (if not postsOnly)
  // ============================================================================

  if (!postsOnly) {
    console.log('\n📂 Processing categories with article listings…');
    try {
      const categories = await fetchFromWP('/categories', 'id,slug,name,description,count');
      console.log(`   Found ${categories.length} categories from API`);

      for (const cat of categories) {
        const pagePath = `/category/${cat.slug}`;
        currentPages.add(pagePath);

        // Find articles belonging to this category
        const categoryArticles = allArticleSummaries.filter(a => a.categories.includes(cat.id));

        const contentHash = hashContent({ cat, articleCount: categoryArticles.length, articles: categoryArticles.map(a => a.slug) });
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

        if (needsRebuild) {
          try {
            const html = generateCategoryPageHTML(cat, categoryArticles, bundleFiles);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, html);

            const fileStats = fs.statSync(filePath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ${cachedPage ? '↻' : '✓'} ${cat.name}: ${categoryArticles.length} articles (${fileSizeKB} KB)`);

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

      // ====================================================================
      // GENERATE /articles LISTING PAGE
      // ====================================================================
      console.log('\n📄 Generating /articles listing page…');
      try {
        const articlesPagePath = '/articles';
        currentPages.add(articlesPagePath);

        const articlesContentHash = hashContent({ type: 'articles-listing', count: allArticleSummaries.length, slugs: allArticleSummaries.map(a => a.slug) });
        const cachedArticlesPage = cache.pages[articlesPagePath];
        const needsArticlesRebuild = force || !cachedArticlesPage || cachedArticlesPage.hash !== articlesContentHash;

        if (needsArticlesRebuild) {
          const articlesHTML = generateArticlesListingHTML(allArticleSummaries, categories, bundleFiles);
          const articlesFilePath = path.join(distDir, 'articles', 'index.html');
          const articlesFileDir = path.dirname(articlesFilePath);

          if (!fs.existsSync(articlesFileDir)) {
            fs.mkdirSync(articlesFileDir, { recursive: true });
          }

          fs.writeFileSync(articlesFilePath, articlesHTML);

          const fileStats = fs.statSync(articlesFilePath);
          const fileSizeKB = (fileStats.size / 1024).toFixed(2);
          console.log(`   ✓ Created /articles listing page (${fileSizeKB} KB, ${allArticleSummaries.length} articles)`);
          stats.new++;
        } else {
          stats.unchanged++;
          console.log(`   ✓ Unchanged: /articles listing page`);
        }

        newCache.pages[articlesPagePath] = {
          hash: articlesContentHash,
          built: needsArticlesRebuild ? new Date().toISOString() : cachedArticlesPage.built,
          type: 'articles-listing'
        };
      } catch (err) {
        console.error('   ❌ Error generating /articles listing:', err.message);
        stats.errors++;
      }

      // ====================================================================
      // ENHANCE HOMEPAGE with article listings
      // ====================================================================
      console.log('\n🏠 Enhancing homepage with article listings…');
      try {
        const homepagePath = path.join(distDir, 'index.html');
        if (fs.existsSync(homepagePath)) {
          let homepageHTML = fs.readFileSync(homepagePath, 'utf-8');

          // Only inject if not already enhanced
          if (!homepageHTML.includes('seo-articles')) {
            const articlesSection = generateHomepageEnhancement(allArticleSummaries, categories);
            // Inject before the closing </div> of seo-fallback
            homepageHTML = homepageHTML.replace(
              /<noscript>\s*<p[^>]*>\s*<strong>JavaScript Required:<\/strong>/,
              articlesSection + '\n        <noscript>\n          <p style="margin-top: 2rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444;">\n            <strong>JavaScript Required:</strong>'
            );
            fs.writeFileSync(homepagePath, homepageHTML);
            const fileStats = fs.statSync(homepagePath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ✓ Homepage enhanced with article listings (${fileSizeKB} KB)`);
          } else {
            console.log(`   ✓ Homepage already enhanced`);
          }
        } else {
          console.log(`   ⚠️ dist/index.html not found, skipping homepage enhancement`);
        }
      } catch (err) {
        console.error('   ❌ Error enhancing homepage:', err.message);
        stats.errors++;
      }
    } catch (error) {
      console.error('❌ Error processing categories:', error.message);
      stats.errors++;
    }

    console.log('\n🏷️  Processing tags with article listings…');
    try {
      const tags = await fetchFromWP('/tags', 'id,slug,name,description');
      console.log(`   Found ${tags.length} tags from API`);

      for (const tag of tags) {
        const pagePath = `/tag/${tag.slug}`;
        currentPages.add(pagePath);

        // Find articles belonging to this tag
        const tagArticles = allArticleSummaries.filter(a => a.tags.includes(tag.id));

        const contentHash = hashContent({ tag, articleCount: tagArticles.length, articles: tagArticles.map(a => a.slug) });
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

        if (needsRebuild) {
          try {
            const html = generateTagPageHTML(tag, tagArticles, bundleFiles);
            const filePath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, html);

            const fileStats = fs.statSync(filePath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ${cachedPage ? '↻' : '✓'} ${tag.name}: ${tagArticles.length} articles (${fileSizeKB} KB)`);

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

    // ============================================================================
    // GLOSSARY PAGES - Pre-rendered from JSON data (pSEO)
    // ============================================================================

    console.log('\n📖 Processing glossary pages from JSON data…');
    try {
      const glossaryDir = path.join(__dirname, '..', 'src', 'data', 'pseo', 'glossary');
      const glossaryFiles = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
      var allGlossaryTerms = [];

      for (const file of glossaryFiles) {
        const filePath = path.join(glossaryDir, file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(fileData)) {
          allGlossaryTerms = allGlossaryTerms.concat(fileData);
        }
      }

      console.log(`   Found ${allGlossaryTerms.length} glossary terms from ${glossaryFiles.length} JSON files`);

      for (const term of allGlossaryTerms) {
        const pagePath = '/glossary/' + term.slug;
        currentPages.add(pagePath);

        const contentHash = hashContent({ term: term.id, slug: term.slug, updated: term.lastUpdated, definition: term.shortDefinition });
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

        if (needsRebuild) {
          try {
            const html = generateGlossaryPageHTML(term, allGlossaryTerms, bundleFiles);
            const outputPath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(outputPath);

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(outputPath, html);

            const fileStats = fs.statSync(outputPath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ${cachedPage ? '↻' : '✓'} ${term.term} (${fileSizeKB} KB)`);

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
          type: 'glossary'
        };
      }

      console.log(`   ✅ Glossary pages complete: ${allGlossaryTerms.length} terms processed`);

      // Generate glossary hub page (/glossary)
      const glossaryHubPath = '/glossary';
      currentPages.add(glossaryHubPath);
      const glossaryHubHash = hashContent({ type: 'glossary-hub', count: allGlossaryTerms.length, terms: allGlossaryTerms.map(t => t.slug).join(',') });
      const cachedGlossaryHub = cache.pages[glossaryHubPath];
      const needsGlossaryHub = force || !cachedGlossaryHub || cachedGlossaryHub.hash !== glossaryHubHash;

      if (needsGlossaryHub) {
        try {
          const hubHtml = generateGlossaryHubPageHTML(allGlossaryTerms, bundleFiles);
          const hubOutputPath = path.join(distDir, 'glossary', 'index.html');
          const hubDir = path.dirname(hubOutputPath);
          if (!fs.existsSync(hubDir)) {
            fs.mkdirSync(hubDir, { recursive: true });
          }
          fs.writeFileSync(hubOutputPath, hubHtml);
          const hubStats = fs.statSync(hubOutputPath);
          console.log(`   ✓ Glossary hub page (${(hubStats.size / 1024).toFixed(2)} KB)`);
          if (cachedGlossaryHub) { stats.updated++; } else { stats.new++; }
        } catch (err) {
          console.error(`   ❌ Error generating glossary hub page:`, err.message);
          stats.errors++;
        }
      } else {
        stats.unchanged++;
      }
      newCache.pages[glossaryHubPath] = {
        hash: glossaryHubHash,
        built: needsGlossaryHub ? new Date().toISOString() : cachedGlossaryHub.built,
        type: 'glossary-hub'
      };

    } catch (error) {
      console.error('❌ Error processing glossary pages:', error.message);
      stats.errors++;
    }

    // ============================================================================
    // COMPARE PAGES - Pre-rendered from JSON data (pSEO)
    // ============================================================================

    console.log('\n⚖️  Processing comparison pages from JSON data…');
    try {
      const comparisonsDir = path.join(__dirname, '..', 'src', 'data', 'pseo', 'comparisons');
      const comparisonFiles = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
      var allComparisons = [];

      for (const file of comparisonFiles) {
        const filePath = path.join(comparisonsDir, file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(fileData)) {
          allComparisons = allComparisons.concat(fileData);
        }
      }

      console.log(`   Found ${allComparisons.length} comparisons from ${comparisonFiles.length} JSON files`);

      for (const comparison of allComparisons) {
        const pagePath = '/compare/' + comparison.slug;
        currentPages.add(pagePath);

        const contentHash = hashContent({ id: comparison.id, slug: comparison.slug, updated: comparison.lastUpdated, verdict: comparison.shortVerdict });
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

        if (needsRebuild) {
          try {
            const html = generateComparePageHTML(comparison, allComparisons, bundleFiles);
            const outputPath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(outputPath);

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(outputPath, html);

            const fileStats = fs.statSync(outputPath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ${cachedPage ? '↻' : '✓'} ${comparison.toolA} vs ${comparison.toolB} (${fileSizeKB} KB)`);

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
          type: 'compare'
        };
      }

      console.log(`   ✅ Comparison pages complete: ${allComparisons.length} comparisons processed`);

      // Generate compare hub page (/compare)
      const compareHubPath = '/compare';
      currentPages.add(compareHubPath);
      const compareHubHash = hashContent({ type: 'compare-hub', count: allComparisons.length, slugs: allComparisons.map(c => c.slug).join(',') });
      const cachedCompareHub = cache.pages[compareHubPath];
      const needsCompareHub = force || !cachedCompareHub || cachedCompareHub.hash !== compareHubHash;

      if (needsCompareHub) {
        try {
          const hubHtml = generateCompareHubPageHTML(allComparisons, bundleFiles);
          const hubOutputPath = path.join(distDir, 'compare', 'index.html');
          const hubDir = path.dirname(hubOutputPath);
          if (!fs.existsSync(hubDir)) {
            fs.mkdirSync(hubDir, { recursive: true });
          }
          fs.writeFileSync(hubOutputPath, hubHtml);
          const hubStats = fs.statSync(hubOutputPath);
          console.log(`   ✓ Compare hub page (${(hubStats.size / 1024).toFixed(2)} KB)`);
          if (cachedCompareHub) { stats.updated++; } else { stats.new++; }
        } catch (err) {
          console.error(`   ❌ Error generating compare hub page:`, err.message);
          stats.errors++;
        }
      } else {
        stats.unchanged++;
      }
      newCache.pages[compareHubPath] = {
        hash: compareHubHash,
        built: needsCompareHub ? new Date().toISOString() : cachedCompareHub.built,
        type: 'compare-hub'
      };

    } catch (error) {
      console.error('❌ Error processing comparison pages:', error.message);
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
