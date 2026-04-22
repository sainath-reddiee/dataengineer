// scripts/generateStaticPagesIncremental.js
// FIXED VERSION - Generates FULL CONTENT for SEO/AdSense with IMAGES
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env so build script can read VITE_ADSENSE_PUBLISHER_ID
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ADSENSE_PUBLISHER_ID = process.env.VITE_ADSENSE_PUBLISHER_ID || '';

// 🚨 Hard-fail the build if AdSense publisher ID is missing or malformed.
// Shipping pages with client="" silently breaks AdSense verification and
// poisons the "ad code present" signal used during approval.
if (!ADSENSE_PUBLISHER_ID || !ADSENSE_PUBLISHER_ID.startsWith('ca-pub-')) {
  console.error('❌ FATAL: VITE_ADSENSE_PUBLISHER_ID is missing or invalid.');
  console.error('   Expected format: ca-pub-XXXXXXXXXXXXXXXX');
  console.error(`   Got: "${ADSENSE_PUBLISHER_ID}"`);
  console.error('   Set it in .env before building to avoid shipping broken ad code.');
  process.exit(1);
}

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const WORDPRESS_BASE_URL = 'https://app.dataengineerhub.blog';

// ============================================================================
// 🔒 GOOGLE CONSENT MODE v2 — single source of truth
// Emitted in the <head> of every static page. EU/UK/EEA region defaults to
// denied (GDPR); rest-of-world (incl. US where AdSense crawler operates)
// defaults to granted so Googlebot-AdSense can verify ad code without a banner.
// Mirrors index.html and CookieConsent.jsx — keep them in sync.
// ============================================================================
const CONSENT_MODE_V2_HTML = `    <!-- Google Consent Mode v2: region-gated. EU denied; rest-of-world (incl. AdSense crawler) granted. -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'security_storage': 'granted',
        'wait_for_update': 500,
        'region': ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB','IS','LI','NO','CH']
      });
      gtag('consent', 'default', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted',
        'functionality_storage': 'granted',
        'personalization_storage': 'granted',
        'security_storage': 'granted',
        'wait_for_update': 500
      });
    </script>`;

// SEO overrides for CTR-optimized titles and descriptions
import seoOverrides, { getSEOOverride } from '../src/data/seoOverrides.js';

// Meta description optimizer for CTR-optimized descriptions
import { optimizeMetaDescription } from '../src/lib/metaDescriptionOptimizer.js';

// Articles data for internal linking during SSG
const articlesJsonPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/pseo/articles.json');
let LINKED_ARTICLES = [];
try {
  LINKED_ARTICLES = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf-8')) || [];
} catch (e) {
  console.warn('⚠️  Could not load articles.json for internal linking:', e.message);
}

// ============================================================================
// 🔗 INTERNAL LINKING ENGINE (SSG-compatible standalone version)
// ============================================================================

function escapeRegexSSG(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttrSSG(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAlreadyLinkedSSG(html, keyword) {
  const anchorRegex = new RegExp(`<a[^>]*>[^<]*${escapeRegexSSG(keyword)}[^<]*</a>`, 'i');
  if (anchorRegex.test(html)) return true;
  const attrRegex = new RegExp(`<[^>]*${escapeRegexSSG(keyword)}[^>]*>`, 'i');
  if (attrRegex.test(html)) return true;
  return false;
}

/**
 * Inject internal links into static HTML so crawlers see them.
 * Mirrors the runtime linkingEngine.js logic but runs at build time.
 * @param {string} htmlContent - The HTML content to process
 * @param {string} excludeSlug - Current article slug to exclude from self-linking
 * @returns {string} - HTML with internal links injected
 */
function injectInternalLinksSSG(htmlContent, excludeSlug = '') {
  if (!htmlContent || typeof htmlContent !== 'string' || LINKED_ARTICLES.length === 0) {
    return htmlContent;
  }

  let result = htmlContent;
  const linkedKeywords = new Set();

  for (const article of LINKED_ARTICLES) {
    if (article.slug === excludeSlug) continue;
    if (!article.keywords || !article.keywords.length) continue;

    for (const keyword of article.keywords) {
      if (linkedKeywords.has(keyword.toLowerCase())) continue;
      if (isAlreadyLinkedSSG(result, keyword)) continue;

      const keywordPattern = new RegExp(`\\b(${escapeRegexSSG(keyword)})\\b`, 'i');
      const parts = result.split(/(<[^>]*>)/);
      let matched = false;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0 && keywordPattern.test(parts[i])) {
          const anchor = `<a href="/articles/${article.slug}" class="internal-link" title="${escapeHtmlAttrSSG(article.title)}">${parts[i].match(keywordPattern)[1]}</a>`;
          parts[i] = parts[i].replace(keywordPattern, anchor);
          matched = true;
          break;
        }
      }

      if (matched) {
        result = parts.join('');
        linkedKeywords.add(keyword.toLowerCase());
        break; // Only one keyword per article to avoid over-optimization
      }
    }
  }

  return result;
}

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

/** Decode common HTML entities back to their literal characters.
 *  WordPress REST API returns pre-encoded text in `rendered` fields
 *  (e.g. &#8217; for a right single quote).  Decoding first prevents
 *  escapeHtml() from double-encoding them (& → &amp; inside &#8217;). */
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
 * Smart title truncation: omit " | DataEngineer Hub" suffix if combined
 * title exceeds 60 chars (Google's typical SERP truncation point).
 */
function smartTitle(title) {
  const suffix = ' | DataEngineer Hub';
  const displayLen = decodeHtmlEntities(title).length;
  return (displayLen + suffix.length) > 60 ? title : title + suffix;
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
    // Promote each level up by one: h3→h2, h4→h3, h5→h4, h6→h5
    // Process from lowest to highest to avoid double-promotion
    html = html.replace(/<(\/?)h3([\s>])/gi, '<$1h2$2');
    html = html.replace(/<(\/?)h4([\s>])/gi, '<$1h3$2');
    html = html.replace(/<(\/?)h5([\s>])/gi, '<$1h4$2');
    html = html.replace(/<(\/?)h6([\s>])/gi, '<$1h5$2');
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
    title: 'Privacy Policy',
    description: 'Read the Privacy Policy for DataEngineer Hub. Learn how we collect, use, and protect your personal information.',
    content: `
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> April 2026</p>
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
    title: 'Terms of Service',
    description: 'Read the Terms of Service for DataEngineer Hub. Understand the rules and regulations governing your use of our website.',
    content: `
      <h1>Terms of Service</h1>
      <p><strong>Last Updated:</strong> September 2025</p>
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
    title: 'Disclaimer',
    description: 'Read the Disclaimer for DataEngineer Hub. Understand the limitations and conditions of the information provided on our website.',
    content: `
      <h1>Disclaimer</h1>
      <p><strong>Last Updated:</strong> October 2025</p>

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
  },
  {
    path: '/certification',
    title: 'Snowflake Certification Prep 2026 - Free SnowPro Core, Advanced & Gen AI Practice',
    description: 'Free Snowflake certification prep for SnowPro Core (COF-C02), SnowPro Advanced: Data Engineer, Architect, and SnowPro Specialty: Gen AI. Study plan, exam breakdown, and interactive practice questions.',
    content: `
      <h1>Snowflake Certification Prep: SnowPro Core, Advanced & Specialty</h1>
      <p><strong>Everything you need to pass a SnowPro exam on the first attempt:</strong> the current exam blueprint for each track, a four-week study plan, the concepts that trip up most candidates, and a free interactive practice question bank covering SnowPro Core, SnowPro Advanced: Data Engineer, SnowPro Advanced: Architect, and the SnowPro Specialty: Generative AI exam.</p>

      <h2>The SnowPro Certification Family</h2>
      <p>Snowflake organizes its credentials into three tiers. Every Advanced and Specialty exam requires an active SnowPro Core credential as a prerequisite, so Core is the mandatory first step for everyone.</p>
      <ul>
        <li><strong>SnowPro Core (COF-C02):</strong> Entry level - 100 questions, 115 minutes, $175 USD, passing score 750/1000. Tests architecture, storage, virtual warehouses, data loading, transformations, RBAC, and data protection.</li>
        <li><strong>SnowPro Advanced: Data Engineer (DEA-C01):</strong> 65 questions, 115 minutes, $375 USD. Deep pipeline focus: Snowpipe, Streams, Tasks, Dynamic Tables, external tables, stored procedures, UDFs, and performance tuning.</li>
        <li><strong>SnowPro Advanced: Architect (ARA-C01):</strong> 65 questions, 115 minutes, $375 USD. Solution design focus: multi-account architecture, replication, failover, private connectivity, data sharing, Iceberg tables, and cost governance at scale.</li>
        <li><strong>SnowPro Specialty: Generative AI:</strong> 55 questions, 90 minutes, $225 USD. Cortex AI focus: LLM functions, Cortex Search, Cortex Analyst, document AI, embeddings, vector similarity, and RAG patterns.</li>
      </ul>

      <h2>SnowPro Core Domain Weights</h2>
      <p>The official COF-C02 study guide breaks the exam into six domains. Plan your study hours proportionally - architecture and transformations alone account for nearly half the exam.</p>
      <ul>
        <li><strong>Snowflake Cloud Data Platform Features & Architecture (~25%):</strong> editions, regions, micro-partitions, metadata, caching layers, Snowgrid.</li>
        <li><strong>Account Access & Security (~20%):</strong> roles, grants, network policies, MFA, SSO, masking, row access policies.</li>
        <li><strong>Data Transformations (~20%):</strong> SQL functions, semi-structured data (VARIANT), UDFs, stored procedures.</li>
        <li><strong>Performance Concepts (~15%):</strong> warehouse sizing, scaling, clustering, search optimization, query profile interpretation.</li>
        <li><strong>Data Loading & Unloading (~10%):</strong> COPY INTO, Snowpipe, stages, file formats, external tables.</li>
        <li><strong>Data Protection & Data Sharing (~10%):</strong> time travel, fail-safe, zero-copy cloning, secure shares, Marketplace.</li>
      </ul>

      <h2>A Realistic 4-Week Study Plan (SnowPro Core)</h2>
      <p>This plan assumes you can commit 6-8 hours per week - roughly one hour on weekdays plus a two-hour weekend deep-dive. Adjust the pace if you already have production Snowflake experience.</p>
      <ul>
        <li><strong>Week 1 - Architecture & Storage:</strong> read the architecture overview, create a free trial account, load a sample dataset, inspect TABLE_STORAGE_METRICS. Goal: explain decoupled compute/storage, micro-partitions, and how metadata enables zero-copy cloning.</li>
        <li><strong>Week 2 - Warehouses, Caching & Performance:</strong> virtual warehouses, multi-cluster scaling, auto-suspend/resume, and the three cache layers (result, local disk, remote storage). Inspect Query Profile for cache hits. Resize a warehouse mid-query to see credit burn.</li>
        <li><strong>Week 3 - Security, RBAC & Data Loading:</strong> build a SYSADMIN role hierarchy, practice GRANT/REVOKE, create a masking policy, load a CSV via COPY INTO, configure Snowpipe for continuous ingest.</li>
        <li><strong>Week 4 - Data Protection, Sharing & Practice:</strong> time travel with AT/BEFORE, zero-copy clones, a secure share between accounts. Take two full-length practice exams - one Monday, one Sunday. Review every missed question and write a one-line explanation in your own words.</li>
      </ul>

      <h2>Six Mistakes That Cost Candidates the Exam</h2>
      <ul>
        <li><strong>Confusing fail-safe with time travel.</strong> Time travel is user-queryable (up to 90 days on Enterprise). Fail-safe is a 7-day Snowflake-only recovery window - you cannot query fail-safe data.</li>
        <li><strong>Assuming clustering keys always help.</strong> Clustering only pays off on very large tables (&gt;1 TB) where the key aligns with frequent filter predicates. On small tables the maintenance credits exceed the query savings.</li>
        <li><strong>Mixing up SYSADMIN and ACCOUNTADMIN.</strong> ACCOUNTADMIN owns billing, resource monitors, and account settings. SYSADMIN should own databases, warehouses, and schemas. Daily work should never happen in ACCOUNTADMIN.</li>
        <li><strong>Forgetting the 60-second warehouse resume minimum.</strong> A resumed warehouse bills a minimum of 60 seconds even for a 2-second query. Important for cost questions.</li>
        <li><strong>Misreading result cache rules.</strong> The 24-hour result cache is invalidated when data changes, when non-deterministic functions like CURRENT_TIMESTAMP() are used, or when non-deterministic UDFs are in the query.</li>
        <li><strong>Memorizing answers instead of concepts.</strong> Snowflake rotates exam pools. If your study relies on leaked dumps, you will fail. Understand <em>why</em> each answer is correct.</li>
      </ul>

      <h2>Interactive Practice Question Bank</h2>
      <p>DataEngineer Hub provides a free practice question bank covering SnowPro Core, Advanced: Data Engineer, Advanced: Architect, and Specialty: Gen AI. It runs in your browser, gives instant feedback with rationales, and tracks your readiness by topic.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Which Snowflake certification should I take first?</h3>
      <p>Start with SnowPro Core (COF-C02). It is the foundational credential and a prerequisite for every SnowPro Advanced and Specialty track. Most candidates pass it after 3-6 weeks of part-time study if they already have working SQL experience.</p>

      <h3>How many questions are on SnowPro Core and what is the passing score?</h3>
      <p>100 questions, 115 minutes, scaled passing score of 750 out of 1000. Questions are multiple choice and multiple select with no penalty for guessing.</p>

      <h3>How much does the SnowPro Core exam cost?</h3>
      <p>SnowPro Core costs $175 USD. SnowPro Advanced exams (Data Engineer, Architect, Administrator, Data Scientist, Data Analyst) cost $375 USD each. Specialty exams cost $225 USD.</p>

      <h3>How long is a SnowPro certification valid?</h3>
      <p>SnowPro Core and Advanced certifications are valid for two years. You can recertify by passing the current version of the exam or, for some tracks, by earning continuing education credits before expiry.</p>

      <h3>Do I need hands-on Snowflake experience before taking SnowPro Core?</h3>
      <p>Snowflake recommends at least six months of hands-on practice. Most candidates who pass have loaded real data, written non-trivial queries, managed warehouses, and set up a role hierarchy. The exam heavily tests micro-partitions, caching, zero-copy cloning, and time travel - concepts that are hard to memorize from a PDF.</p>

      <h3>What topics carry the most weight on SnowPro Core?</h3>
      <p>Architecture (~25%), Account Access & Security (~20%), Data Transformations (~20%), Performance (~15%), Data Loading & Unloading (~10%), Data Protection & Sharing (~10%).</p>

      <h3>Is the practice tool free?</h3>
      <p>Yes. The interactive practice app is free, runs in your browser, and covers SnowPro Core, Advanced: Data Engineer, Advanced: Architect, and Specialty: Gen AI.</p>

      <h3>What is the best way to use practice questions without just memorizing answers?</h3>
      <p>Practice questions are diagnostics, not answer keys. After every question, read the rationale, open the Snowflake documentation, and write a one-line summary in your own words. If you cannot explain why the wrong answers are wrong, you do not understand the topic yet.</p>

      <h2>Disclaimer</h2>
      <p>Exam details (question counts, duration, pricing, domain weights) reflect Snowflake's published study guides as of 2026. Always verify current specifications on the official Snowflake Certifications page before registering. DataEngineer Hub is an independent community resource and is not affiliated with or endorsed by Snowflake Inc.</p>
    `
  },
  {
    path: '/tools/snowflake-cost-calculator',
    title: 'Snowflake Cost Calculator 2026 - Free Pricing Estimator',
    description: 'Free Snowflake cost calculator. Estimate warehouse credits, storage, and cloud services costs by edition (Standard/Enterprise/BC) and region. Instant monthly and annual estimates.',
    content: `
      <h1>Snowflake Cost Calculator 2026</h1>
      <p><strong>Free, instant Snowflake pricing estimator.</strong> Enter your warehouse size, hours of usage, storage, and edition to see a live monthly and annual cost breakdown across compute, storage, cloud services, and serverless features like Cortex AI and Snowpipe.</p>

      <h2>How Snowflake Pricing Works</h2>
      <p>Snowflake bills three primary categories: <strong>compute</strong> (measured in credits), <strong>storage</strong> (per TB per month), and <strong>cloud services</strong> (metadata, auth, query compilation). Compute credits are consumed by virtual warehouses — X-Small warehouses burn 1 credit per hour, and each size doubles: Small (2), Medium (4), Large (8), X-Large (16), up to 6X-Large (512 credits/hour).</p>

      <h2>Credit Prices by Edition</h2>
      <ul>
        <li><strong>Standard Edition:</strong> 1.0x multiplier - the base price. Includes complete SQL data warehouse features.</li>
        <li><strong>Enterprise Edition:</strong> 1.5x - adds multi-cluster warehouses, materialized views, 90-day time travel, and column-level security.</li>
        <li><strong>Business Critical:</strong> 2.0x - adds HIPAA/PCI compliance, customer-managed keys, and private connectivity.</li>
        <li><strong>Virtual Private Snowflake (VPS):</strong> 2.5x - fully isolated infrastructure for regulated industries.</li>
      </ul>

      <h2>Regional Price Variation</h2>
      <p>Credit prices vary significantly by cloud region. AWS US East (N. Virginia), Azure US East 2, and GCP US Central are the cheapest at roughly $2.00 per Standard credit. European regions add a ~30% premium (around $2.60/credit), and APAC regions can reach $2.90/credit. Storage follows a similar pattern: approximately $23 per TB per month on-demand in US regions, rising to $25/TB in APAC.</p>

      <h2>How to Estimate Your Snowflake Costs</h2>
      <ol>
        <li><strong>Choose your edition</strong> (Standard, Enterprise, Business Critical, or VPS) - each applies a credit-rate multiplier.</li>
        <li><strong>Pick your cloud region</strong> - credit prices and storage rates vary by cloud provider and geography.</li>
        <li><strong>Set warehouse size and usage</strong> - select XS through 6XL, then estimate hours per day and days per month the warehouse actively runs.</li>
        <li><strong>Add storage and serverless features</strong> - enter total storage in GB and toggle any serverless features (Snowpipe continuous ingest, Cortex AI LLM inference, Auto-Clustering).</li>
        <li><strong>Review monthly and annual estimate</strong> - the calculator shows compute, storage, cloud services, and serverless costs, plus potential savings from right-sizing your warehouse.</li>
      </ol>

      <h2>Top Ways to Cut Snowflake Costs</h2>
      <ul>
        <li><strong>Aggressive auto-suspend:</strong> Set warehouses to suspend after 60 seconds of idle. For bursty workloads this can cut compute by 70-90%.</li>
        <li><strong>Right-size warehouses:</strong> Moving from Large (8 credits/hr) to Medium (4 credits/hr) halves compute cost - test whether queries still meet SLAs at the smaller size.</li>
        <li><strong>Resource monitors:</strong> Cap monthly credit usage per warehouse with automatic suspend-on-threshold actions.</li>
        <li><strong>Query tagging + Account Usage review:</strong> Identify top spending queries and optimize or cache them.</li>
        <li><strong>Partition pruning and clustering keys:</strong> Properly clustered tables reduce scanned micro-partitions, cutting query time and credits.</li>
        <li><strong>Materialized views only when justified:</strong> They reduce query time but consume maintenance credits - use them only when queried far more often than the underlying table changes.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>How are Snowflake credits calculated?</h3>
      <p>Credits are consumed per second of warehouse run time, billed at a rate determined by warehouse size. A 60-second minimum applies when a warehouse resumes from suspend.</p>

      <h3>What is the cheapest Snowflake edition?</h3>
      <p>Standard Edition at 1.0x credit rate. Enterprise is 1.5x, Business Critical is 2.0x, and VPS is 2.5x.</p>

      <h3>Does auto-suspend really save money?</h3>
      <p>Yes, significantly. A Medium warehouse running 24/7 costs about 2,880 credits per month. Auto-suspend after 60 seconds of idle can cut compute costs by 70-90% for bursty workloads.</p>

      <h3>What counts as cloud services billing?</h3>
      <p>Cloud Services handle query compilation, metadata, authentication, and transaction coordination. Snowflake gives a 10% free allowance against compute credits - only usage above 10% is billed.</p>

      <h3>Is on-demand or capacity storage cheaper?</h3>
      <p>On-demand storage is roughly $23 per TB per month (pay-as-you-go). Capacity storage requires a pre-purchased commitment but can drop to about $40/TB/month on flat terms.</p>

      <h3>How do I estimate Cortex AI costs?</h3>
      <p>Cortex AI is billed per million tokens at roughly 3 credits per million tokens. A chatbot handling 10M tokens per month costs about 30 credits (~$60-$90 depending on edition and region).</p>

      <h3>Why is my Snowflake bill higher than the calculator estimate?</h3>
      <p>Common culprits include warehouses not auto-suspending, cloud services usage above 10%, replication and data transfer, serverless features (Snowpipe, Tasks), and Search Optimization Service. Use Account Usage views to audit actual credits.</p>

      <h3>Does this calculator include multi-cluster warehouses?</h3>
      <p>Yes - cluster count multiplies compute credits linearly. A Medium warehouse with 3 clusters running 8 hours consumes 4 x 8 x 3 = 96 credits before edition multiplier.</p>

      <h2>Disclaimer</h2>
      <p>Estimates are based on publicly documented Snowflake list pricing as of 2026. Actual costs depend on your contract, regional discounts (enterprise contracts often negotiate 20-40% off list), and real usage patterns. This tool is for planning purposes only - always verify against your Account Usage views for authoritative billing data.</p>
    `
  },
  {
    path: '/tools/snowflake-credit-cost',
    title: 'Snowflake Credit Cost Converter 2026 - Instant USD Calculator',
    description: 'How much does a Snowflake credit cost? Convert credits to USD by edition (Standard/Enterprise/BC/VPS) and region. Free instant price converter.',
    content: `
      <h1>Snowflake Credit Cost Converter</h1>
      <p><strong>Convert any number of Snowflake credits to US dollars instantly.</strong> Price depends on two inputs: your edition (Standard, Enterprise, Business Critical, or VPS) and your cloud region (AWS, Azure, or GCP).</p>

      <h2>How much does one Snowflake credit cost?</h2>
      <p>A single Snowflake credit costs between <strong>$2.00</strong> (AWS US East or GCP US Central on Standard edition) and <strong>$7.25</strong> (AWS Asia Pacific on VPS edition). The formula is simple: <code>credit_price = region_base_price x edition_multiplier</code>. Multipliers are Standard 1.0x, Enterprise 1.5x, Business Critical 2.0x, and VPS 2.5x.</p>

      <h2>Regional Credit Price Reference</h2>
      <ul>
        <li><strong>AWS US East (N. Virginia):</strong> $2.00 Standard, $3.00 Enterprise, $4.00 Business Critical, $5.00 VPS</li>
        <li><strong>AWS EU (Ireland/Frankfurt):</strong> $2.60 Standard, $3.90 Enterprise, $5.20 Business Critical, $6.50 VPS</li>
        <li><strong>AWS Asia Pacific (Singapore/Tokyo):</strong> $2.90 Standard, $4.35 Enterprise, $5.80 Business Critical, $7.25 VPS</li>
        <li><strong>Azure US East 2:</strong> $2.00 Standard (matches AWS US)</li>
        <li><strong>GCP US Central:</strong> $2.00 Standard (matches AWS US)</li>
      </ul>

      <h2>Why regional pricing differs</h2>
      <p>Snowflake prices credits higher in regions with higher underlying cloud infrastructure costs. US regions are cheapest. European regions carry roughly a 30% premium; APAC regions carry roughly 45%. If your workload is portable, deploying in US regions can cut your Snowflake bill by 30-45% vs. APAC.</p>

      <h2>Can I get a discount?</h2>
      <p>Yes. Enterprise capacity contracts (annual or multi-year commitments) typically negotiate 20-40% off list price. On-demand customers pay full list rate. If your annual spend exceeds $50k, a capacity contract is almost always cheaper than on-demand.</p>

      <h2>Related Tools</h2>
      <p>Use our <a href="/tools/snowflake-cost-calculator">full Snowflake Cost Calculator</a> to factor warehouse size, hours of use, storage, and serverless features into a complete monthly estimate. For single-query cost estimation, use the <a href="/tools/snowflake-query-cost-estimator">Query Cost Estimator</a>. To pick the right warehouse size for your workload, see the <a href="/tools/snowflake-warehouse-sizing">Warehouse Sizing Estimator</a>.</p>
    `
  },
  {
    path: '/tools/snowflake-query-cost-estimator',
    title: 'Snowflake Query Cost Estimator 2026 - Price Per Query Calculator',
    description: 'Estimate Snowflake query cost from bytes scanned and warehouse size. See cost per query plus daily and monthly projections. Free interactive tool.',
    content: `
      <h1>Snowflake Query Cost Estimator</h1>
      <p><strong>Estimate the cost of a single Snowflake query</strong> from bytes scanned, warehouse size, edition, and region. Includes the 60-second resume minimum and scales to daily and monthly totals.</p>

      <h2>How is query cost calculated in Snowflake?</h2>
      <p>Snowflake bills per second of warehouse uptime, not per query directly. The formula is: <code>query_cost = (credits_per_hour x runtime_in_hours) x price_per_credit</code>. An XS warehouse runs at 1 credit/hour; each size doubles. A 60-second minimum applies every time a warehouse resumes from auto-suspend, so a 2-second query on a freshly-resumed warehouse is billed as 60 seconds.</p>

      <h2>Why bytes scanned matters</h2>
      <p>Bytes scanned is the best predictor of runtime. Less pruning means more bytes scanned, which means longer runtime, which means higher cost. Three levers reduce bytes scanned: (1) <strong>clustering keys</strong> on high-cardinality filter columns, (2) <strong>Search Optimization Service</strong> for point lookups, and (3) <strong>materialized views</strong> for repeated aggregations.</p>

      <h2>How to find bytes scanned for your query</h2>
      <ol>
        <li>Open Snowsight -&gt; Activity -&gt; Query History</li>
        <li>Click the query ID and view the Query Profile panel</li>
        <li>Read "Bytes scanned" from the TableScan nodes</li>
        <li>Or query: <code>SELECT BYTES_SCANNED FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY WHERE QUERY_ID = '...'</code></li>
      </ol>

      <h2>Is a bigger warehouse more expensive per query?</h2>
      <p>Not necessarily. A 2XL that finishes in 10 seconds can cost the same as a Small that runs for 160 seconds. When queries spill to remote disk on smaller sizes, bumping up a size is often cheaper <em>and</em> faster. Use the Query Profile to check for spillage before deciding.</p>

      <h2>Related Tools</h2>
      <p>See the <a href="/tools/snowflake-cost-calculator">full cost calculator</a> for full-workload estimation, the <a href="/tools/snowflake-warehouse-sizing">warehouse sizing estimator</a> to pick the right size, and the <a href="/tools/snowflake-credit-cost">credit converter</a> for credit-to-USD lookups. Also see our guide on <a href="/articles/snowflake-query-optimization-2025">Snowflake query optimization</a>.</p>
    `
  },
  {
    path: '/tools/snowflake-warehouse-sizing',
    title: 'Snowflake Warehouse Sizing Estimator 2026 - Pick XS-6XL by Workload',
    description: 'Which Snowflake warehouse size should you use? Enter workload type, data volume, and concurrency - get an instant XS-6XL recommendation plus monthly cost.',
    content: `
      <h1>Snowflake Warehouse Sizing Estimator</h1>
      <p><strong>Get a starting-point warehouse size (XS to 6XL)</strong> based on workload type, data volume, and concurrency. Use it as a first cut, then right-size using real query profiles on production data.</p>

      <h2>How should I choose a Snowflake warehouse size?</h2>
      <p>Start small (XS or S) and monitor query runtimes. If queries routinely exceed your latency SLA or spill to remote disk, bump up one size. Bigger warehouses finish faster and often cost the same - a 2XL running 30 seconds may equal a Small running 8 minutes. Size to your critical-path query, not to your smallest queries.</p>

      <h2>Warehouse sizes and credit consumption</h2>
      <ul>
        <li><strong>X-Small (XS):</strong> 1 credit/hour - dev, sandbox, small dashboards</li>
        <li><strong>Small (S):</strong> 2 credits/hour - small ETL, simple BI</li>
        <li><strong>Medium (M):</strong> 4 credits/hour - typical production BI and ETL</li>
        <li><strong>Large (L):</strong> 8 credits/hour - heavier ETL, feature engineering</li>
        <li><strong>X-Large (XL):</strong> 16 credits/hour - large batch jobs, ML prep</li>
        <li><strong>2XL-6XL:</strong> 32-512 credits/hour - massive data volumes (only when needed)</li>
      </ul>

      <h2>When do I need multi-cluster warehouses?</h2>
      <p>Multi-cluster solves concurrency, not data volume. If 30+ BI users fire queries simultaneously and some queue for 10+ seconds, enable multi-cluster with auto-scale. Snowflake will spin up additional clusters only when concurrent demand exceeds one cluster's capacity, then scale back down.</p>

      <h2>Workload-based sizing heuristics</h2>
      <ul>
        <li><strong>BI / Dashboards:</strong> Latency-sensitive. Prefer one size larger with multi-cluster for concurrency.</li>
        <li><strong>Ad-hoc / exploration:</strong> Moderate data, relaxed latency. M or L works well.</li>
        <li><strong>ETL / batch:</strong> Throughput-sensitive. Size to the largest table scanned per query.</li>
        <li><strong>ML feature prep:</strong> Often massive joins. L to 2XL is typical; check for remote disk spillage.</li>
        <li><strong>Dev / sandbox:</strong> Always XS. Use resource monitors to cap spend.</li>
      </ul>

      <h2>How to validate your size</h2>
      <ol>
        <li>Run your top 10 queries on the recommended warehouse</li>
        <li>In each Query Profile, check for "Bytes spilled to remote storage" - any remote spill means the size is too small</li>
        <li>Check WAREHOUSE_LOAD_HISTORY - if average load is consistently &gt;1.0, add multi-cluster</li>
        <li>Check QUEUED_LOAD_PERCENTAGE - sustained queueing &gt;10s means concurrency is saturating</li>
        <li>Review WAREHOUSE_METERING_HISTORY after a week and right-size down if utilization is low</li>
      </ol>

      <h2>Related Tools</h2>
      <p>See the <a href="/tools/snowflake-cost-calculator">full cost calculator</a> for total monthly spend modeling, the <a href="/tools/snowflake-query-cost-estimator">query cost estimator</a> for single-query pricing, and the <a href="/tools/snowflake-credit-cost">credit-to-USD converter</a> for quick price lookups. See also <a href="/articles/snowflake-cost-optimization-techniques-2026">12 Snowflake cost optimization techniques</a>.</p>
    `
  },
  {
    path: '/tools',
    title: 'Free Data Engineering Tools 2026 | DataEngineer Hub',
    description: 'Free tools for data engineers: Snowflake, Databricks, and dbt Cloud cost calculators, warehouse sizing, SQL formatter, cron builder, JSON-to-SQL DDL. No login.',
    content: `
      <h1>Free Data Engineering Tools and Calculators</h1>
      <p><strong>Estimate costs, size warehouses, format SQL, build cron schedules, and convert JSON to DDL</strong> - all in your browser, no login required. Shareable URLs preserve every input, so you can send a configured estimate to your team with a single link.</p>

      <h2>Our free data engineering tools</h2>

      <h3>Snowflake cost tools</h3>
      <ul>
        <li><strong><a href="/tools/snowflake-cost-calculator">Snowflake Cost Calculator</a></strong> - full monthly spend estimator. Model compute, storage, Snowpipe, Cortex AI, and serverless feature costs across all editions and regions.</li>
        <li><strong><a href="/tools/snowflake-credit-cost">Credit -&gt; USD Converter</a></strong> - instant credit price lookup. Convert any credit count to USD across Standard, Enterprise, Business Critical, and VPS editions for every supported cloud region.</li>
        <li><strong><a href="/tools/snowflake-query-cost-estimator">Query Cost Estimator</a></strong> - price per query from bytes scanned and warehouse size. Includes the 60-second resume minimum and scales to daily and monthly totals.</li>
        <li><strong><a href="/tools/snowflake-warehouse-sizing">Warehouse Sizing Estimator</a></strong> - recommends a starting warehouse size (XS to 6XL) from workload type, data volume, and concurrency. Shows one-size-up and one-size-down cost comparison.</li>
      </ul>

      <h3>Databricks &amp; dbt cost tools</h3>
      <ul>
        <li><strong><a href="/tools/databricks-cost-calculator">Databricks Cost Calculator</a></strong> - DBU + underlying cloud VM pricing estimator. Pick SKU (Jobs, All-Purpose, SQL, Serverless), cluster size, and runtime hours across AWS, Azure, and GCP.</li>
        <li><strong><a href="/tools/dbt-cloud-cost-calculator">dbt Cloud Cost Calculator</a></strong> - price dbt Cloud plans by developer seats, successful model runs, and job concurrency. Compares Developer, Team, and Enterprise tiers.</li>
      </ul>

      <h3>SQL &amp; data productivity tools</h3>
      <ul>
        <li><strong><a href="/tools/sql-formatter">SQL Formatter</a></strong> - beautify messy SQL instantly. Handles Snowflake, BigQuery, PostgreSQL, and ANSI SQL with configurable indent size and keyword case.</li>
        <li><strong><a href="/tools/cron-expression-builder">Cron Expression Builder</a></strong> - build and validate cron expressions visually. Preview the next 5 fire times and copy schedules for Airflow, dbt Cloud, Snowflake Tasks, or Databricks Jobs.</li>
        <li><strong><a href="/tools/json-to-sql-ddl">JSON to SQL DDL</a></strong> - paste a JSON sample, get a CREATE TABLE statement. Supports Snowflake VARIANT, PostgreSQL JSONB, BigQuery STRUCT, and standard SQL types.</li>
        <li><strong><a href="/tools/csv-to-sql">CSV to SQL Converter</a></strong> - paste CSV data, get CREATE TABLE DDL and INSERT statements with inferred types. RFC 4180 compliant parser, Snowflake/Postgres/BigQuery/ANSI dialects.</li>
        <li><strong><a href="/tools/dbt-schema-generator">dbt Schema.yml Generator</a></strong> - paste a CREATE TABLE, get a dbt schema.yml with inferred unique/not_null tests, a staging SQL model, and a sources.yml entry with freshness checks.</li>
        <li><strong><a href="/tools/unix-timestamp-converter">Unix Timestamp Converter</a></strong> - epoch to human date and back. Auto-detects seconds, milliseconds, microseconds, nanoseconds. SQL cheat sheet for Snowflake, Postgres, BigQuery, MySQL, Redshift, Databricks.</li>
      </ul>

      <h3>Multi-cloud cost calculators</h3>
      <ul>
        <li><strong><a href="/tools/bigquery-cost-calculator">BigQuery Cost Calculator</a></strong> - model on-demand ($6.25/TB scanned) and capacity Editions (Standard/Enterprise/Enterprise Plus slot-hours), storage tiers, and streaming ingest. Includes on-demand vs Editions break-even analysis.</li>
      </ul>

      <h3>SQL practice</h3>
      <ul>
        <li><strong><a href="/tools/sql-playground">SQL Playground</a></strong> - in-browser SQL engine powered by DuckDB-WASM. Practice window functions, CTEs, QUALIFY, aggregations, and joins on preloaded sample datasets. No server, no signup, 100% client-side.</li>
      </ul>

      <h3>Data format conversion</h3>
      <ul>
        <li><strong><a href="/tools/json-parquet-avro-converter">JSON / Parquet / Avro Converter</a></strong> - convert between JSON, Apache Parquet, and Apache Avro directly in your browser. Powered by DuckDB-WASM for Parquet and avsc for Avro. No upload, no server — 100% client-side.</li>
      </ul>

      <h2>Which tool should I use?</h2>
      <ul>
        <li><strong>Planning a new Snowflake workload?</strong> Start with the <a href="/tools/snowflake-warehouse-sizing">Warehouse Sizing Estimator</a> to pick a size, then use the <a href="/tools/snowflake-cost-calculator">Cost Calculator</a> to model monthly spend.</li>
        <li><strong>Optimizing a slow Snowflake query?</strong> Use the <a href="/tools/snowflake-query-cost-estimator">Query Cost Estimator</a> to compare cost before and after applying clustering keys, Search Optimization Service, or materialized views.</li>
        <li><strong>Reviewing a Snowflake invoice?</strong> Plug credit counts from ACCOUNT_USAGE into the <a href="/tools/snowflake-credit-cost">Credit Converter</a> for quick dollar-value checks.</li>
        <li><strong>Comparing Databricks vs Snowflake?</strong> Run the <a href="/tools/databricks-cost-calculator">Databricks Cost Calculator</a> for the same workload hours and compare DBU + VM cost against a Snowflake estimate.</li>
        <li><strong>Budgeting dbt Cloud seats?</strong> The <a href="/tools/dbt-cloud-cost-calculator">dbt Cloud Cost Calculator</a> prices developer seats, model runs, and concurrency across Developer, Team, and Enterprise tiers.</li>
        <li><strong>Shipping SQL to production?</strong> Clean it first with the <a href="/tools/sql-formatter">SQL Formatter</a> - consistent formatting makes code review faster and cuts merge conflicts.</li>
        <li><strong>Scheduling a pipeline?</strong> Build the schedule visually in the <a href="/tools/cron-expression-builder">Cron Expression Builder</a> and paste the expression into Airflow, dbt Cloud, Snowflake Tasks, or Databricks Jobs.</li>
        <li><strong>Modeling a new JSON source?</strong> Drop a sample into the <a href="/tools/json-to-sql-ddl">JSON to SQL DDL</a> generator to scaffold your CREATE TABLE statement in seconds.</li>
        <li><strong>Loading a CSV export?</strong> Paste into the <a href="/tools/csv-to-sql">CSV to SQL Converter</a> for instant CREATE TABLE + INSERT scaffolding - great for seeds, fixtures, and small lookups.</li>
        <li><strong>Onboarding a new table into dbt?</strong> Run the <a href="/tools/dbt-schema-generator">dbt Schema.yml Generator</a> on the CREATE TABLE to auto-scaffold schema.yml, staging SQL, and sources.yml with freshness checks.</li>
        <li><strong>Debugging timestamp data?</strong> The <a href="/tools/unix-timestamp-converter">Unix Timestamp Converter</a> handles seconds, milliseconds, microseconds, and nanoseconds with SQL examples for every major warehouse.</li>
        <li><strong>Running on Google Cloud?</strong> Use the <a href="/tools/bigquery-cost-calculator">BigQuery Cost Calculator</a> to model on-demand vs capacity Editions pricing and find the break-even point for your workload.</li>
        <li><strong>Practicing SQL?</strong> Open the <a href="/tools/sql-playground">SQL Playground</a> — run queries on preloaded sample tables directly in your browser with DuckDB-WASM. No setup required.</li>
        <li><strong>Converting file formats?</strong> The <a href="/tools/json-parquet-avro-converter">JSON / Parquet / Avro Converter</a> handles all six conversion paths between JSON, Parquet, and Avro — powered by DuckDB-WASM and avsc, entirely in your browser.</li>
      </ul>

      <h2>Are these tools free?</h2>
      <p>Yes. Every tool on this page is free, requires no login, and stores nothing on our servers. All calculations and transformations run in your browser. Share the configured URL with your team - the query string preserves all inputs.</p>

      <h2>How accurate are the cost estimates?</h2>
      <p>Estimates use each vendor's publicly documented list pricing as of 2026 (Snowflake editions, Databricks DBU rates, dbt Cloud plan tiers). Actual invoiced cost depends on your contract (capacity deals typically discount 20-40% off list), regional pricing, and real usage patterns. Always verify against your vendor's usage views (Snowflake ACCOUNT_USAGE, Databricks System Tables, dbt Cloud admin console) for authoritative billing data.</p>

      <h2>Related reading</h2>
      <p>For deeper guidance, read our articles on <a href="/articles/snowflake-cost-optimization-techniques-2026">12 Snowflake cost optimization techniques</a>, <a href="/articles/snowflake-cortex-cost-comparison">Snowflake Cortex cost comparison</a>, and <a href="/category/snowflake">our Snowflake category</a> for tutorials on warehouse tuning, query performance, and ACCOUNT_USAGE analysis. Preparing for interviews? Visit <a href="/interview-prep">Interview Prep</a> for a 14-day study plan and 16 cheat sheets.</p>
    `
  },
  {
    path: '/tools/databricks-cost-calculator',
    title: 'Free Databricks Cost Calculator 2026 - DBU + VM Pricing Estimator',
    description: 'Estimate monthly Databricks cost in seconds. Pick SKU (Jobs, All-Purpose, SQL, Serverless), cluster size, runtime hours - see DBU spend plus AWS/Azure/GCP VM cost.',
    content: `
      <h1>Databricks Cost Calculator</h1>
      <p><strong>Estimate your total monthly Databricks spend</strong> across DBU (Databricks Units) and underlying cloud VM cost. Choose SKU, cluster size, runtime hours, and cloud - get an instant monthly total with a side-by-side Snowflake comparison.</p>

      <h2>How is Databricks billed?</h2>
      <p>Databricks charges you in two parts: <strong>DBUs</strong> (Databricks Unit consumption based on compute type and tier) and the <strong>underlying cloud VM cost</strong> (EC2 / Azure VM / GCE). Serverless SKUs bundle both into a single DBU rate so the VM line disappears, but the effective per-hour cost is higher because Databricks is now managing the VMs for you.</p>

      <h2>What are the main Databricks SKUs and DBU rates?</h2>
      <ul>
        <li><strong>Jobs Compute (Standard):</strong> $0.15/DBU - batch workloads, ETL pipelines, scheduled notebooks</li>
        <li><strong>Jobs Compute Photon:</strong> $0.22/DBU - Photon-accelerated Spark for 2-5x faster query performance</li>
        <li><strong>All-Purpose Compute:</strong> $0.55/DBU - interactive notebooks, shared clusters, dev/exploration</li>
        <li><strong>All-Purpose Photon:</strong> $0.65/DBU - interactive workloads with Photon acceleration</li>
        <li><strong>SQL Compute Classic:</strong> $0.22/DBU - BI dashboards, ad-hoc SQL, Databricks SQL warehouses</li>
        <li><strong>SQL Compute Pro:</strong> $0.55/DBU - unity catalog, query federation, advanced SQL features</li>
        <li><strong>SQL Serverless:</strong> $0.70/DBU - instant-start, auto-scaling, no VM management</li>
        <li><strong>Model Serving Serverless:</strong> $0.07-0.30/DBU - ML inference endpoints</li>
      </ul>

      <h2>Databricks vs Snowflake: how do the costs compare?</h2>
      <p>Direct comparison is tricky because the units differ. Snowflake charges per-credit (a Medium warehouse = 4 credits/hour = ~$16/hour on Enterprise), while Databricks charges DBU + VM. For a rough equivalent: a Databricks M5.xlarge Jobs Photon cluster with 4 workers runs around $7-9/hour all-in, vs a Snowflake Medium at $16/hour - but Databricks needs you to manage cluster startup/shutdown, while Snowflake auto-suspends in seconds. Factor in dev-time savings when comparing.</p>

      <h2>Pro tips to reduce Databricks spend</h2>
      <ul>
        <li><strong>Use Jobs clusters for production</strong> - never All-Purpose, which is 3x more expensive per DBU.</li>
        <li><strong>Enable Photon on CPU-heavy SQL and ETL</strong> - the 1.5x DBU premium typically cuts runtime by 2-5x.</li>
        <li><strong>Use spot instances</strong> on driver + workers for non-SLA jobs - 70-90% VM cost reduction.</li>
        <li><strong>Set auto-termination to 10-20 min on All-Purpose clusters</strong> - idle clusters are the #1 cost leak.</li>
        <li><strong>Right-size with cluster event logs</strong> - if CPU rarely exceeds 40%, downsize one tier.</li>
      </ul>

      <h2>Related reading</h2>
      <p>Compare against Snowflake with our <a href="/tools/snowflake-cost-calculator">Snowflake Cost Calculator</a>, read <a href="/cheatsheets/databricks">Databricks cheat sheet</a>, and explore <a href="/cheatsheets/category/architecture">architecture cheat sheets</a> for platform comparison guidance.</p>
    `
  },
  {
    path: '/tools/dbt-cloud-cost-calculator',
    title: 'dbt Cloud Cost Calculator 2026 - Developer vs Team vs Enterprise Pricing',
    description: 'Estimate dbt Cloud monthly cost by plan, seats, model runs, and CI builds. Compare Developer ($0), Team ($100/seat), Enterprise - pick the right tier.',
    content: `
      <h1>dbt Cloud Cost Calculator</h1>
      <p><strong>Estimate your dbt Cloud subscription cost</strong> across Developer (free), Team, and Enterprise plans. Factor in seats, monthly model runs, CI builds, and overage charges to pick the plan that actually fits your usage pattern.</p>

      <h2>dbt Cloud plans in 2026</h2>
      <ul>
        <li><strong>Developer:</strong> Free - 1 developer seat, 3000 successful models built/month, basic scheduling, public Git integration. Best for solo developers and small teams evaluating dbt.</li>
        <li><strong>Team:</strong> $100/developer seat/month - up to 8 seats, 15,000 successful models/month (pooled), SSO, environments, CI. Best for 3-8 developer teams.</li>
        <li><strong>Enterprise:</strong> Custom pricing - unlimited seats, dedicated support, private Git, audit logs, multi-tenancy, SOC 2. Best for 10+ developer organizations with compliance needs.</li>
      </ul>

      <h2>How do model runs get counted?</h2>
      <p>A "successful model built" is a single model (view, table, or incremental) that dbt executes successfully. A typical project with 100 models run 4x/day across dev + prod = ~12,000 models/month - that pushes you from Developer into Team territory. CI jobs count too; each PR that triggers a full refresh adds another 100 models per PR.</p>

      <h2>When should I upgrade from Developer to Team?</h2>
      <ul>
        <li>You've hit 3000 models/month and CI builds are getting throttled.</li>
        <li>You have 2+ developers needing their own IDE sessions.</li>
        <li>You need SSO or environments (dev/staging/prod separation).</li>
        <li>You want slim CI (only run models affected by PR changes) for faster feedback.</li>
      </ul>

      <h2>Cost optimization tips for dbt Cloud</h2>
      <ul>
        <li><strong>Use incremental models</strong> - drops model runtime 10-100x on large tables, reducing model-count pressure and warehouse cost.</li>
        <li><strong>Enable slim CI</strong> - only run models modified in the PR plus downstream dependencies.</li>
        <li><strong>Materialize as views for small reference tables</strong> - views don't count against run budgets the same way (no data rewrite).</li>
        <li><strong>Avoid hourly full-refreshes</strong> - most dim/fact tables only need a nightly full run plus hourly incrementals.</li>
      </ul>

      <h2>Related reading</h2>
      <p>See the <a href="/cheatsheets/dbt-commands">dbt cheat sheet</a> for commands and macros, and <a href="/cheatsheets/data-engineering-interview-questions">interview questions</a> for dbt topics covered by hiring managers.</p>
    `
  },
  {
    path: '/tools/sql-formatter',
    title: 'Free SQL Formatter 2026 - Pretty-Print SQL in Browser (No Upload)',
    description: 'Paste messy SQL, get pretty-printed output instantly. Supports Snowflake, Postgres, BigQuery, MySQL syntax. Runs in browser - nothing sent to server.',
    content: `
      <h1>Free SQL Formatter</h1>
      <p><strong>Paste any SQL query and get clean, indented output in milliseconds.</strong> Supports major keywords, subqueries, CTEs, and dialects including Snowflake, Postgres, BigQuery, and MySQL. Runs fully in your browser - your SQL never leaves the page.</p>

      <h2>Why format SQL?</h2>
      <p>Well-formatted SQL is easier to code-review, easier to debug, and easier to compare against version control diffs. A single-line 500-character query with nested subqueries is a code smell waiting for a production incident. Auto-formatting enforces consistency across teams and eliminates entire categories of "but mine looks different" disputes in PRs.</p>

      <h2>Formatting rules applied</h2>
      <ul>
        <li><strong>Major keywords uppercased:</strong> SELECT, FROM, WHERE, JOIN, GROUP BY, ORDER BY, HAVING, UNION, WITH</li>
        <li><strong>Sub-keywords uppercased:</strong> ON, AS, AND, OR, IN, BETWEEN, LIKE, IS NULL, NOT NULL</li>
        <li><strong>String literals preserved:</strong> quoted strings and comments are protected before keyword transforms</li>
        <li><strong>Paren-based indentation:</strong> subqueries and window specs indent by 2 spaces per depth level</li>
        <li><strong>One clause per line:</strong> each major keyword starts a new line at the correct indent level</li>
      </ul>

      <h2>Supported dialects</h2>
      <p>The formatter is dialect-aware for the most common variants - Snowflake QUALIFY clauses, Postgres DISTINCT ON, BigQuery STRUCT/ARRAY literals, and MySQL backtick identifiers all pass through intact. Unusual dialects may need minor manual cleanup.</p>

      <h2>Is this private?</h2>
      <p>Yes. The formatter runs entirely in your browser using JavaScript - no network request is made, no SQL is logged, and nothing is stored. You can even use it offline once the page is loaded.</p>

      <h2>Related reading</h2>
      <p>See the <a href="/cheatsheets/sql-window-functions">SQL window functions cheat sheet</a>, <a href="/cheatsheets/snowflake-sql">Snowflake SQL cheat sheet</a>, and <a href="/cheatsheets/databricks">Databricks cheat sheet</a> for syntax references.</p>
    `
  },
  {
    path: '/tools/cron-expression-builder',
    title: 'Free Cron Expression Builder 2026 - Build + Preview Next 5 Runs',
    description: 'Build cron expressions visually or paste existing schedules. See next 5 run times, plain-English description, 11 common presets. Works for cron, Airflow, dbt.',
    content: `
      <h1>Free Cron Expression Builder</h1>
      <p><strong>Build, preview, and validate cron expressions without guessing.</strong> Enter a schedule, see the next 5 run times, get a plain-English description, or pick from 11 common presets. Works for cron, Airflow DAGs, dbt Cloud schedules, and Snowflake tasks.</p>

      <h2>What is a cron expression?</h2>
      <p>Cron expressions define recurring schedules using 5 fields: minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), and day-of-week (0-6, where 0 = Sunday). Each field can be a specific number, a range (1-5), a list (1,3,5), a step (*/15), or a wildcard (*).</p>

      <h2>11 common presets included</h2>
      <ul>
        <li><strong>Every 5 minutes:</strong> */5 * * * * - frequent polls, health checks</li>
        <li><strong>Every hour:</strong> 0 * * * * - hourly rollups, metric snapshots</li>
        <li><strong>Every 15 minutes during business hours:</strong> */15 9-17 * * 1-5</li>
        <li><strong>Daily at midnight:</strong> 0 0 * * * - classic nightly batch window</li>
        <li><strong>Daily at 2 AM:</strong> 0 2 * * * - common for ETL to avoid business-hours contention</li>
        <li><strong>Weekdays at 9 AM:</strong> 0 9 * * 1-5 - business-day reports</li>
        <li><strong>Weekly (Sunday midnight):</strong> 0 0 * * 0 - weekly rollups</li>
        <li><strong>Monthly (1st at 3 AM):</strong> 0 3 1 * * - month-end close</li>
        <li><strong>Quarterly (1st of Jan/Apr/Jul/Oct):</strong> 0 3 1 1,4,7,10 *</li>
        <li><strong>Every 30 seconds:</strong> Not supported - cron's smallest unit is 1 minute</li>
      </ul>

      <h2>Where does this work?</h2>
      <ul>
        <li><strong>Unix cron:</strong> paste the expression into your crontab</li>
        <li><strong>Airflow:</strong> use schedule_interval="0 3 * * *"</li>
        <li><strong>dbt Cloud:</strong> paste into the job schedule field</li>
        <li><strong>Snowflake tasks:</strong> wrap in SCHEDULE = 'USING CRON 0 3 * * * UTC'</li>
        <li><strong>GitHub Actions:</strong> schedule.cron field</li>
        <li><strong>Kubernetes CronJobs:</strong> spec.schedule field</li>
      </ul>

      <h2>Common cron pitfalls</h2>
      <ul>
        <li><strong>Timezones:</strong> most systems interpret cron in UTC by default. Snowflake tasks need an explicit timezone in the USING CRON clause.</li>
        <li><strong>Day-of-month and day-of-week together:</strong> in Unix cron these are OR-ed, not AND-ed. 0 0 1 * 1 means "midnight on the 1st OR every Monday".</li>
        <li><strong>DST (Daylight Saving Time):</strong> schedules set in local time can skip or repeat on DST boundaries. Prefer UTC for reliable scheduling.</li>
      </ul>

      <h2>Related reading</h2>
      <p>See the <a href="/cheatsheets/airflow-essentials">Airflow cheat sheet</a>, <a href="/cheatsheets/airflow-best-practices">Airflow best practices</a>, and <a href="/cheatsheets/category/orchestration">orchestration cheat sheets</a> for scheduling patterns.</p>
    `
  },
  {
    path: '/tools/json-to-sql-ddl',
    title: 'Free JSON to SQL Schema Converter 2026 - DDL for Snowflake, Postgres, BigQuery',
    description: 'Paste JSON, get CREATE TABLE DDL. Auto-infers types across samples, tracks nullability. Supports Snowflake, Postgres, BigQuery, ANSI SQL dialects.',
    content: `
      <h1>Free JSON to SQL Schema Converter</h1>
      <p><strong>Turn any JSON sample into a CREATE TABLE statement in seconds.</strong> The converter infers column types from your data, promotes types across multiple samples (e.g., INT + FLOAT = FLOAT), and tracks nullability when fields are missing from any row. Supports Snowflake, Postgres, BigQuery, and ANSI SQL.</p>

      <h2>How does type inference work?</h2>
      <p>For each field, the tool walks every sample, records the observed type (boolean, integer, float, string, object, array, null), then picks the most permissive compatible type. If a field shows up as INT in one sample and FLOAT in another, the output column becomes FLOAT. If any sample is missing the field, the column becomes nullable. Nested objects become VARIANT (Snowflake) or JSONB (Postgres) or STRUCT (BigQuery).</p>

      <h2>Supported output dialects</h2>
      <ul>
        <li><strong>Snowflake:</strong> VARCHAR, NUMBER, FLOAT, BOOLEAN, VARIANT for nested, ARRAY for arrays</li>
        <li><strong>Postgres:</strong> TEXT, BIGINT, DOUBLE PRECISION, BOOLEAN, JSONB for nested/arrays</li>
        <li><strong>BigQuery:</strong> STRING, INT64, FLOAT64, BOOL, STRUCT&lt;...&gt; for nested, ARRAY&lt;...&gt; for arrays</li>
        <li><strong>ANSI SQL:</strong> VARCHAR, BIGINT, DOUBLE, BOOLEAN - safe for most databases</li>
      </ul>

      <h2>Best practices for schema inference</h2>
      <ul>
        <li><strong>Paste at least 10-20 samples</strong> - single samples miss optional fields and type variation.</li>
        <li><strong>Include boundary cases</strong> - rows with nulls, empty strings, zero, max-length strings.</li>
        <li><strong>Review nullability</strong> - the tool marks fields nullable conservatively; tighten to NOT NULL where the business guarantees presence.</li>
        <li><strong>Validate against production</strong> - for high-cardinality string fields, check actual max-length before committing to VARCHAR(255).</li>
      </ul>

      <h2>Common gotchas</h2>
      <ul>
        <li><strong>JSON numbers without decimals are treated as integers</strong> - if you expect fractional values, include at least one sample with a decimal.</li>
        <li><strong>Date strings stay as VARCHAR</strong> - JSON has no native date type; cast downstream.</li>
        <li><strong>Deeply nested objects</strong> - most dialects handle 2-3 levels well; beyond that, consider flattening.</li>
      </ul>

      <h2>Related reading</h2>
      <p>See <a href="/cheatsheets/snowflake-sql">Snowflake SQL cheat sheet</a> (VARIANT usage), <a href="/cheatsheets/snowflake-semi-structured-interview">Snowflake semi-structured interview</a> (FLATTEN/LATERAL), and <a href="/cheatsheets/databricks">Databricks cheat sheet</a> (Delta/Photon) for dialect-specific handling.</p>
    `
  },
  {
    path: '/tools/csv-to-sql',
    title: 'CSV to SQL Converter 2026 - Free INSERT + CREATE TABLE Generator',
    description: 'Paste CSV, get CREATE TABLE DDL and INSERT statements with inferred types. Supports Snowflake, PostgreSQL, BigQuery, ANSI SQL. RFC 4180 parser, client-side.',
    content: `
      <h1>Free CSV to SQL Converter</h1>
      <p><strong>Convert any CSV into CREATE TABLE DDL and INSERT statements instantly.</strong> Paste your CSV data, pick a target dialect (Snowflake, PostgreSQL, BigQuery, or ANSI SQL), and get a complete scaffold with inferred column types. Parser follows RFC 4180 for quoted fields, escaped quotes, and embedded commas. All processing runs in your browser.</p>

      <h2>How does the type inference work?</h2>
      <p>Every column is scanned across all non-empty values. If all values match an integer pattern, the column is typed as NUMBER(38,0) for Snowflake, BIGINT for Postgres, or INT64 for BigQuery. Decimals get NUMBER(38,10) / NUMERIC. ISO dates (YYYY-MM-DD) become DATE; ISO timestamps become TIMESTAMP. Booleans (true/false) become BOOLEAN. Any value that breaks a numeric pattern downgrades the column to VARCHAR / STRING / TEXT - with length picked by the longest observed value.</p>

      <h2>Supported CSV features</h2>
      <ul>
        <li><strong>Quoted fields</strong> - cells wrapped in double quotes can contain commas, newlines, and escaped double-quotes (written as "").</li>
        <li><strong>Alternative delimiters</strong> - choose comma, tab (TSV), semicolon, or pipe for international CSV exports.</li>
        <li><strong>Header detection</strong> - optional toggle; first row can be column names or the first data row.</li>
        <li><strong>Mixed-type columns</strong> - any non-numeric value in a numeric column correctly downgrades to VARCHAR.</li>
      </ul>

      <h2>When to use INSERT vs bulk-load (COPY INTO)</h2>
      <p>Generated INSERT statements are ideal for seeding test data, dbt seeds, fixtures, and small lookup tables (under ~1,000 rows). For production ingestion of larger CSVs, use bulk-load commands - they are 100-1000x faster and cheaper than INSERT-per-row. Use this tool to generate just the CREATE TABLE DDL, then:</p>
      <ul>
        <li><strong>Snowflake:</strong> <code>COPY INTO my_table FROM @stage/file.csv FILE_FORMAT = (TYPE = CSV SKIP_HEADER = 1)</code></li>
        <li><strong>PostgreSQL:</strong> <code>\\COPY my_table FROM 'file.csv' CSV HEADER</code></li>
        <li><strong>BigQuery:</strong> <code>bq load --source_format=CSV --skip_leading_rows=1 dataset.table gs://bucket/file.csv</code></li>
        <li><strong>Redshift:</strong> <code>COPY my_table FROM 's3://bucket/file.csv' IAM_ROLE '...' CSV IGNOREHEADER 1</code></li>
      </ul>

      <h2>Security and privacy</h2>
      <p>The CSV parser and SQL generator run 100% in your browser. No data is uploaded, nothing is stored, and the tool works offline after first load. Paste internal or regulated data with confidence - nothing leaves your machine.</p>

      <h2>Related tools and reading</h2>
      <p>See the <a href="/tools/json-to-sql-ddl">JSON to SQL DDL Generator</a> for JSON inputs, the <a href="/tools/sql-formatter">SQL Formatter</a> to pretty-print the output, and the <a href="/tools/dbt-schema-generator">dbt Schema.yml Generator</a> to turn your new CREATE TABLE into a full dbt staging scaffold. For Snowflake loading patterns see <a href="/cheatsheets/snowflake-sql">Snowflake SQL reference</a>.</p>
    `
  },
  {
    path: '/tools/dbt-schema-generator',
    title: 'dbt Schema.yml Generator 2026 - CREATE TABLE to dbt Scaffold',
    description: 'Paste a CREATE TABLE statement, get a dbt schema.yml with inferred tests, a staging SQL model, and a sources.yml entry. No warehouse connection. Free, client-side.',
    content: `
      <h1>Free dbt Schema.yml Generator</h1>
      <p><strong>Turn any CREATE TABLE into a complete dbt scaffold in one click.</strong> Paste a CREATE TABLE statement - from Snowflake, PostgreSQL, Redshift, BigQuery, or ANSI SQL - and get three artifacts: a <code>schema.yml</code> with inferred <code>unique</code> and <code>not_null</code> tests, a <code>staging SQL model</code> using the canonical <code>with source, renamed</code> pattern, and a <code>sources.yml</code> entry with freshness checks. No warehouse connection, no dbt codegen, no account required.</p>

      <h2>Why use a dbt schema generator?</h2>
      <p>Writing schema.yml files by hand is tedious and error-prone. <code>dbt codegen</code> does this against a live warehouse connection, but sometimes you don't have one yet - you're reviewing a CREATE TABLE in a pull request, designing a new staging layer from a data-contract doc, or bootstrapping a dbt project offline. This tool solves the offline case. Feed it any CREATE TABLE and get a schema.yml starting point in seconds.</p>

      <h2>What tests get inferred?</h2>
      <ul>
        <li><strong>PRIMARY KEY</strong> columns -&gt; both <code>unique</code> and <code>not_null</code> tests. PK enforces both invariants.</li>
        <li><strong>Columns named <code>id</code></strong> -&gt; both <code>unique</code> and <code>not_null</code> by convention - treated as surrogate keys.</li>
        <li><strong>NOT NULL columns</strong> (without PK) -&gt; <code>not_null</code> test. DDL explicitly requires a value.</li>
        <li><strong>Nullable columns</strong> -&gt; no auto-tests. Add <code>accepted_values</code>, <code>relationships</code>, or <code>dbt_utils.expression_is_true</code> manually based on business logic.</li>
      </ul>

      <h2>Generated artifacts explained</h2>
      <h3>schema.yml</h3>
      <p>A dbt YAML doc with <code>version: 2</code>, a single <code>models:</code> entry, column list with descriptions and tests. Column descriptions are inferred from naming conventions (_id columns become foreign-key descriptions, _at columns become event timestamps, status/amount/email get intuitive descriptions). Always review and rewrite with business context - good column documentation is the single highest-ROI item in a dbt project.</p>

      <h3>Staging SQL model</h3>
      <p>A .sql file using the dbt style-guide pattern: <code>with source as (...), renamed as (...) select * from renamed</code>. The source CTE pulls from <code>{{ source('...', '...') }}</code>; the renamed CTE is where you add column casts, renames, or surrogate keys like <code>{{ dbt_utils.generate_surrogate_key(['order_id']) }}</code>.</p>

      <h3>sources.yml</h3>
      <p>A <code>sources.yml</code> entry with <code>loaded_at_field</code> and <code>freshness</code> thresholds (warn after 12 hours, error after 24 hours - tune to your SLA). Lets you run <code>dbt source freshness</code> to detect stale ingestion.</p>

      <h2>Where to place the generated files</h2>
      <ol>
        <li><strong>Staging SQL</strong> -&gt; <code>models/staging/&lt;source&gt;/stg_&lt;table&gt;.sql</code></li>
        <li><strong>schema.yml</strong> -&gt; <code>models/staging/&lt;source&gt;/schema.yml</code> (one file per source folder is the dbt style-guide convention)</li>
        <li><strong>sources.yml</strong> -&gt; <code>models/staging/&lt;source&gt;/sources.yml</code></li>
        <li>Run <code>dbt build --select stg_&lt;table&gt;+</code> to compile, test, and materialize the model.</li>
      </ol>

      <h2>Related tools and reading</h2>
      <p>Need a CREATE TABLE first? Use the <a href="/tools/json-to-sql-ddl">JSON to SQL DDL Generator</a> or the <a href="/tools/csv-to-sql">CSV to SQL Converter</a>, then pipe the output here. Price your dbt Cloud usage with the <a href="/tools/dbt-cloud-cost-calculator">dbt Cloud Cost Calculator</a>. For dbt command syntax see the <a href="/cheatsheets/dbt-commands">dbt Commands Reference</a>.</p>
    `
  },
  {
    path: '/tools/unix-timestamp-converter',
    title: 'Unix Timestamp Converter 2026 - Epoch to Date (seconds, ms, us, ns)',
    description: 'Free Unix timestamp converter. Auto-detects seconds, milliseconds, microseconds, nanoseconds. Converts to UTC, ISO 8601, local time. Snowflake, Postgres, BigQuery SQL examples.',
    content: `
      <h1>Free Unix Timestamp Converter</h1>
      <p><strong>Convert Unix epoch time to a human-readable date and back, in any unit.</strong> This tool auto-detects whether your timestamp is in <strong>seconds, milliseconds, microseconds, or nanoseconds</strong> based on its magnitude, then shows the moment in four formats: UTC, ISO 8601, your local time, and a relative description like "3 hours ago". The reverse direction is also supported - pick any datetime and get the Unix timestamp in the unit you need.</p>

      <h2>What is a Unix timestamp?</h2>
      <p>A <strong>Unix timestamp</strong> (also called Unix time, epoch time, or POSIX time) is the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970, excluding leap seconds. It is the single most common way to represent a moment in time in databases, logs, APIs, and distributed systems because it is timezone-agnostic, sorts correctly as an integer, and is language-independent. Every major programming language and database has first-class support for it.</p>

      <h2>Seconds vs milliseconds vs microseconds vs nanoseconds</h2>
      <p>Unix time was originally defined in seconds (10 digits through year 2286), but many modern systems need more precision:</p>
      <ul>
        <li><strong>Seconds</strong> - classic Unix time, 10 digits for any realistic modern date. Used by most Unix command-line tools, cron, POSIX APIs.</li>
        <li><strong>Milliseconds</strong> - 13 digits. Used by <strong>JavaScript</strong> (<code>Date.now()</code>), <strong>Java</strong> (<code>System.currentTimeMillis()</code>), <strong>Kafka</strong>, most logging systems.</li>
        <li><strong>Microseconds</strong> - 16 digits. Used by <strong>PostgreSQL</strong> (<code>TIMESTAMP</code> internal precision), Python <code>datetime</code>.</li>
        <li><strong>Nanoseconds</strong> - 19 digits. Used by <strong>Snowflake</strong> <code>TIMESTAMP_NTZ</code> internal precision, Go <code>time.UnixNano()</code>, high-frequency trading logs.</li>
      </ul>
      <p>This tool auto-detects the unit from your number's magnitude (a 10-digit number is seconds, a 13-digit number is milliseconds, etc.), but you can force a unit via the dropdown if you know the source is different.</p>

      <h2>SQL conversion quick reference</h2>
      <p>Every warehouse has built-in conversion functions, but the syntax differs:</p>
      <ul>
        <li><strong>Snowflake:</strong> <code>TO_TIMESTAMP_NTZ(epoch_s)</code> for seconds; <code>TO_TIMESTAMP_NTZ(epoch_ms, 3)</code> for milliseconds (the second argument is the scale). Reverse: <code>DATE_PART(EPOCH_SECOND, ts)</code>.</li>
        <li><strong>PostgreSQL:</strong> <code>TO_TIMESTAMP(epoch_s)</code>; reverse: <code>EXTRACT(EPOCH FROM ts)</code>. For milliseconds divide by 1000 first.</li>
        <li><strong>BigQuery:</strong> <code>TIMESTAMP_SECONDS()</code>, <code>TIMESTAMP_MILLIS()</code>, <code>TIMESTAMP_MICROS()</code>. Reverse: <code>UNIX_SECONDS(ts)</code>, <code>UNIX_MILLIS(ts)</code>.</li>
        <li><strong>MySQL:</strong> <code>FROM_UNIXTIME(epoch_s)</code> and <code>UNIX_TIMESTAMP(ts)</code>. Milliseconds need manual math.</li>
        <li><strong>Redshift:</strong> <code>TIMESTAMP 'epoch' + epoch_s * INTERVAL '1 second'</code>. Verbose but portable.</li>
        <li><strong>Databricks (Spark):</strong> <code>from_unixtime(epoch_s)</code> and <code>unix_timestamp(ts)</code>.</li>
      </ul>

      <h2>The Year 2038 problem (and why it matters for data engineers)</h2>
      <p>Systems that store Unix time as a <strong>signed 32-bit integer</strong> can only represent times up to 2^31 - 1 seconds past the epoch, which is <strong>03:14:07 UTC on 19 January 2038</strong>. After that, the counter overflows to a negative number (December 1901). Most modern systems now use 64-bit timestamps and are unaffected, but legacy embedded systems, older databases, and poorly-written ETL code can still be vulnerable. Always check your data warehouse column types - a Snowflake <code>INTEGER</code> is 38-digit fixed-point and safe, but a source system might export epochs as 32-bit INT.</p>

      <h2>Common UTC timestamps (quick reference)</h2>
      <ul>
        <li><strong>0</strong> - Unix epoch - Thu, 01 Jan 1970 00:00:00 UTC</li>
        <li><strong>946684800</strong> - Y2K - Sat, 01 Jan 2000 00:00:00 UTC</li>
        <li><strong>2147483647</strong> - 32-bit signed max - Tue, 19 Jan 2038 03:14:07 UTC</li>
        <li><strong>1767225600</strong> - Thu, 01 Jan 2026 00:00:00 UTC</li>
      </ul>

      <h2>Related tools</h2>
      <p>Working with scheduled jobs? Use the <a href="/tools/cron-expression-builder">Cron Expression Builder</a> to model when your next run fires. Need to pretty-print SQL that uses epoch functions? The <a href="/tools/sql-formatter">SQL Formatter</a> handles multi-dialect output. For time-series cost estimation see the <a href="/tools/snowflake-cost-calculator">Snowflake Cost Calculator</a>, and for timestamp function reference see the <a href="/cheatsheets/snowflake-sql">Snowflake SQL cheat sheet</a>.</p>
    `
  },
  {
    path: '/tools/bigquery-cost-calculator',
    title: 'BigQuery Cost Calculator 2026 - On-Demand & Editions Pricing',
    description: 'Free BigQuery pricing calculator. Model on-demand ($6.25/TB scanned), Standard/Enterprise/Enterprise Plus slot capacity, storage, and streaming inserts. Compare with Snowflake.',
    content: `
      <h1>Free BigQuery Cost Calculator</h1>
      <p><strong>Estimate your monthly Google BigQuery spend in seconds.</strong> Model both pricing models - <strong>on-demand</strong> (per-TB scanned) and <strong>capacity Editions</strong> (Standard / Enterprise / Enterprise Plus slot-hours) - side by side with storage tiering and streaming ingest included. Perfect for budget planning, on-demand-vs-Editions break-even analysis, and multi-cloud cost comparison against Snowflake and Databricks.</p>

      <h2>How BigQuery pricing works</h2>
      <p>BigQuery splits cost into three completely independent dimensions: <strong>compute</strong> (how queries run), <strong>storage</strong> (how tables are kept on disk), and <strong>streaming ingest</strong> (how new rows arrive). Compute is almost always the dominant cost. Storage is usually cheap. Streaming is niche and often free at small volumes.</p>

      <h3>On-demand pricing ($6.25 per TB scanned)</h3>
      <p>The default billing model. You pay $6.25 for every terabyte of uncompressed logical data your queries scan. The <strong>first 1 TB of scan per project per month is free</strong>. No cluster to provision, no reservation to manage - just pay per query. Best for small and intermittent workloads, dev / staging projects, and any team with unpredictable usage. Downside: a single bad query can cost hundreds of dollars if it scans a full table without partitioning.</p>

      <h3>Capacity (Editions) pricing</h3>
      <p>You buy slot-hours in advance at one of three tiers:</p>
      <ul>
        <li><strong>Standard:</strong> $0.04/slot-hour. No BigQuery ML, no materialized views. Entry-level SQL.</li>
        <li><strong>Enterprise:</strong> $0.06/slot-hour. Full feature set (ML, materialized views, column-level security). Most common tier.</li>
        <li><strong>Enterprise Plus:</strong> $0.10/slot-hour. Adds autoscaling slots (0 to max), cross-region + cross-cloud queries, CMEK, assured workloads.</li>
      </ul>

      <h3>Storage tiers</h3>
      <ul>
        <li><strong>Active storage</strong> - $0.02/GB/month - any table or partition modified in the last 90 days.</li>
        <li><strong>Long-term storage</strong> - $0.01/GB/month (50% off) - automatic on tables/partitions not modified for 90+ days. No query penalty, totally automatic.</li>
        <li><strong>Physical storage</strong> (optional, opt-in per dataset) - pay for actual compressed bytes instead of logical. Typically ~50% cheaper for well-compressed datasets.</li>
      </ul>

      <h2>When to switch from on-demand to capacity Editions</h2>
      <p>Break-even example: You are running <strong>450 TB/month on on-demand</strong>. That costs (450 - 1) * $6.25 = <strong>$2,806/month</strong>. A Standard Edition reservation of 100 slots running 24/7 costs 100 * 730 * $0.04 = <strong>$2,920/month</strong> - about the same. But if your workload is bursty (big overnight ETL, idle during the day), Enterprise Plus with autoscale (50-150 avg slots) often comes in at ~$2,200/month, saving 20-40%.</p>
      <p><strong>General rule:</strong> if your on-demand spend is above $3,000/month and your query patterns are predictable, move to Editions. If spend is below $1,000/month or highly intermittent, stay on-demand.</p>

      <h2>How to reduce BigQuery cost on on-demand</h2>
      <p>Bytes scanned is the only cost lever on on-demand. Apply these in order of ROI:</p>
      <ol>
        <li><strong>Partition every fact table.</strong> Use DATE partitioning on the event timestamp for almost all analytics data. Filtering on the partition column prunes months of data in a single WHERE clause - often 90%+ bytes saved.</li>
        <li><strong>Cluster on common WHERE/GROUP BY columns.</strong> Up to 4 columns. Clustering prunes blocks within a partition.</li>
        <li><strong>Never <code>SELECT *</code>.</strong> BigQuery is columnar - unused columns are not scanned. Specifying columns can cut scan 50-90% on wide tables.</li>
        <li><strong>Use approximate aggregations.</strong> <code>APPROX_COUNT_DISTINCT</code> is ~100x cheaper than <code>COUNT(DISTINCT)</code> on large tables when 2% error is acceptable.</li>
        <li><strong>Materialize hot joins.</strong> A materialized view or scheduled query that pre-joins and pre-aggregates the two highest-traffic tables can eliminate 80% of dashboard scan cost.</li>
      </ol>

      <h2>BigQuery vs Snowflake vs Databricks</h2>
      <p>For predictable medium workloads the three platforms are within ~20% of each other on list price. Real differences come from usage patterns. Use the <a href="/tools/snowflake-cost-calculator">Snowflake Cost Calculator</a> and <a href="/tools/databricks-cost-calculator">Databricks Cost Calculator</a> for apples-to-apples comparisons at your actual TB and workload shape.</p>

      <h2>Related tools</h2>
      <p>Use the <a href="/tools/json-to-sql-ddl">JSON to SQL DDL Generator</a> to scaffold BigQuery CREATE TABLE statements from sample data. Use the <a href="/tools/sql-formatter">SQL Formatter</a> to clean up dialect-specific SQL. For multi-cloud comparisons see <a href="/compare/snowflake-vs-google-bigquery">Snowflake vs BigQuery</a>.</p>
    `
  },
  {
    path: '/tools/cloud-data-warehouse-cost-comparison',
    title: 'Snowflake vs BigQuery vs Databricks Cost Calculator 2026',
    description: 'Free cross-platform data warehouse cost comparison. Enter one workload profile and see monthly costs side-by-side across Snowflake, Google BigQuery, and Databricks with April 2026 list pricing.',
    content: `
      <h1>Cloud Data Warehouse Cost Comparison</h1>
      <p><strong>Compare monthly cost across Snowflake, BigQuery, and Databricks with a single unified input.</strong> Enter TB scanned, compute hours, storage GB, and workload complexity — get three side-by-side estimates and see which warehouse is cheapest for your specific pattern. Ideal for pre-RFP sizing, migration budget framing, and answering the "should we switch?" question with numbers instead of vendor slides.</p>

      <h2>How the three platforms charge differently</h2>
      <ul>
        <li><strong>Snowflake</strong> bills per-second of warehouse uptime, at a credit rate driven by edition (1.0x Standard / 1.5x Enterprise / 2.0x Business Critical / 2.5x VPS) and warehouse size (XS = 1 credit/hr, doubling each size). Cloud Services get a 10% free allowance on top of compute.</li>
        <li><strong>Databricks</strong> bills per-DBU (Databricks Unit) consumed. A DBU rate varies by compute tier: SQL Pro, Jobs Compute, and Serverless have different $/DBU prices. Storage is passthrough to S3/ADLS.</li>
        <li><strong>BigQuery</strong> has two billing models: on-demand ($6.25/TB scanned, first 1 TB/month free) and Editions ($0.04 Standard / $0.06 Enterprise / $0.10 Enterprise Plus per slot-hour). The cheaper of the two applies to your workload — this calculator auto-picks.</li>
      </ul>

      <h2>When each platform tends to win</h2>
      <ul>
        <li><strong>Snowflake wins</strong> on bursty workloads with strong auto-suspend discipline, and when you can get a 25-40% contract discount off list. Unique strengths: data sharing, Snowpark, zero-copy clones.</li>
        <li><strong>BigQuery wins</strong> on truly intermittent workloads under 1-2 TB/month scanned (first-TB-free + no compute to idle) and on heavily partitioned/pruned queries.</li>
        <li><strong>Databricks wins</strong> on ML and heavy ETL where you mix SQL and PySpark, especially with Photon-accelerated SQL Warehouses and Serverless DBU credits.</li>
      </ul>

      <h2>Assumptions behind the estimate</h2>
      <p>This calculator uses published April 2026 list pricing and these normalized assumptions: Snowflake credit rate defaults to Enterprise ($3 avg), Databricks DBU rate defaults to SQL Pro list ($0.55), BigQuery auto-picks between on-demand and Enterprise Editions. Storage is priced at active-tier list (~$20-$23 per TB-month). Networking egress and long-term storage savings are NOT included. These are order-of-magnitude numbers for architecture decisions, not procurement quotes.</p>

      <h2>Platform-specific deep dives</h2>
      <p>After narrowing down, use the platform-specific calculators for a fuller picture:</p>
      <ul>
        <li><a href="/tools/snowflake-cost-calculator">Snowflake Cost Calculator</a> — edition × warehouse size × hours + serverless (Cortex, Snowpipe, Auto-Clustering).</li>
        <li><a href="/tools/bigquery-cost-calculator">BigQuery Cost Calculator</a> — on-demand vs Editions break-even, active/long-term storage, streaming ingest.</li>
        <li><a href="/tools/databricks-cost-calculator">Databricks Cost Calculator</a> — DBU rate by tier, instance types, cluster uptime, Photon.</li>
      </ul>
    `
  },
  {
    path: '/tools/sql-playground',
    title: 'Free SQL Playground 2026 — Run SQL in Your Browser | DuckDB-WASM',
    description: 'Practice SQL instantly in your browser with DuckDB-WASM. Sample datasets, window functions, CTEs, QUALIFY — no signup, no server. 100% private and free.',
    content: `
      <h1>SQL Playground — Run SQL in Your Browser</h1>
      <p><strong>Free, in-browser SQL engine powered by DuckDB-WASM.</strong> Write and execute SQL queries instantly on preloaded sample datasets — employees, orders, and web events. No server, no signup, no data leaves your device. Practice window functions, CTEs, QUALIFY, aggregations, joins, and more.</p>

      <h2>How It Works</h2>
      <p>This playground loads <a href="https://duckdb.org/docs/api/wasm/overview">DuckDB-WASM</a>, a full analytical SQL engine compiled to WebAssembly, directly in your browser. The ~2 MB engine downloads once and runs entirely client-side. Three sample tables are preloaded with realistic data so you can start writing queries immediately.</p>

      <h2>Preloaded Sample Tables</h2>
      <ul>
        <li><strong>employees</strong> (15 rows) — id, name, department, salary, hire_date. Practice GROUP BY, HAVING, window functions, and top-N per group patterns.</li>
        <li><strong>orders</strong> (15 rows) — order_id, customer_id, product, quantity, unit_price, order_date, region. Practice aggregations, running totals, and revenue analysis.</li>
        <li><strong>web_events</strong> (15 rows) — event_id, user_id, event_type, page, ts, device. Practice funnel analysis, sessionization, and conditional aggregation.</li>
      </ul>

      <h2>What You Can Practice</h2>
      <h3>Fundamentals</h3>
      <ul>
        <li>SELECT, WHERE, GROUP BY, HAVING, ORDER BY</li>
        <li>JOINs (INNER, LEFT, RIGHT, FULL, CROSS)</li>
        <li>Subqueries and correlated subqueries</li>
        <li>UNION, INTERSECT, EXCEPT</li>
      </ul>

      <h3>Advanced SQL</h3>
      <ul>
        <li>Window functions — ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER, AVG OVER</li>
        <li>CTEs (WITH ... AS) and recursive CTEs</li>
        <li>QUALIFY clause (supported by DuckDB and Snowflake)</li>
        <li>CASE expressions, COALESCE, NULLIF</li>
      </ul>

      <h3>Data Engineering Patterns</h3>
      <ul>
        <li>Running totals and moving averages with window frames</li>
        <li>Funnel analysis with conditional aggregation</li>
        <li>Sessionization using LAG and date arithmetic</li>
        <li>Deduplication with ROW_NUMBER</li>
      </ul>

      <h3>Interview Prep</h3>
      <ul>
        <li>Top-N per group (a classic data engineer interview question)</li>
        <li>Year-over-year comparisons</li>
        <li>Percentile and median calculations</li>
        <li>Self-joins for sequential event analysis</li>
      </ul>

      <h2>DuckDB SQL Dialect</h2>
      <p>DuckDB supports a PostgreSQL-compatible dialect with modern extensions. Most Snowflake and BigQuery SQL patterns work with minor syntax adjustments. Supported features include: window functions, CTEs, recursive CTEs, QUALIFY, PIVOT/UNPIVOT, LATERAL joins, LIST/STRUCT/MAP types, regex functions, and lambda expressions.</p>

      <h2>Privacy and Security</h2>
      <p>DuckDB runs entirely in your browser via WebAssembly. Your SQL queries and any data you paste never leave your device — there is no server, no database connection, and no logging of queries. You can safely paste proprietary data for testing.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Is this SQL playground free?</h3>
      <p>Yes, completely free. No signup, no limits, no tracking. DuckDB-WASM runs 100% in your browser.</p>

      <h3>What SQL dialect does DuckDB support?</h3>
      <p>DuckDB supports a PostgreSQL-compatible dialect with modern extensions: window functions, CTEs, QUALIFY, PIVOT/UNPIVOT, LATERAL joins, LIST/STRUCT/MAP types, regex, lambda functions, and more.</p>

      <h3>Can I load my own data?</h3>
      <p>The playground ships with three preloaded sample tables. You can also use DuckDB's read_csv() function to query CSV data directly.</p>

      <h3>How large a dataset can it handle?</h3>
      <p>DuckDB-WASM runs inside your browser's memory budget — typically 1-4 GB. For sample datasets (15 rows each), performance is instant. For analytical workloads up to ~100 MB, DuckDB-WASM performs well.</p>

      <h3>Does it support Snowflake-specific syntax?</h3>
      <p>DuckDB supports many Snowflake SQL patterns natively: QUALIFY, FLATTEN (as UNNEST), window functions, CTEs, MERGE, and most date/string functions. Snowflake-only functions (GET_DDL, SYSTEM$) are not available.</p>

      <h2>Related Tools</h2>
      <ul>
        <li><a href="/tools/sql-formatter">SQL Formatter</a> — clean up your SQL before running it here.</li>
        <li><a href="/cheatsheets/snowflake-sql">Snowflake SQL Cheat Sheet</a> — full Snowflake SQL reference with examples you can copy into the playground.</li>
        <li><a href="/cheatsheets/sql-window-functions">Window Functions Reference</a> — ROW_NUMBER, RANK, LAG, LEAD — all examples are runnable in this playground.</li>
        <li><a href="/interview-prep">Interview Prep Hub</a> — complete 14-day study plan for data engineer interviews.</li>
      </ul>
    `
  },
  {
    path: '/tools/json-parquet-avro-converter',
    title: 'Free JSON / Parquet / Avro Converter 2026 — Browser-Based Format Conversion',
    description: 'Convert between JSON, Apache Parquet, and Apache Avro directly in your browser. Powered by DuckDB-WASM and avsc. No upload, no server — 100% client-side and free.',
    content: `
      <h1>JSON / Parquet / Avro Converter — Convert Data Formats in Your Browser</h1>
      <p><strong>Free, client-side data format converter.</strong> Convert between JSON, Apache Parquet, and Apache Avro instantly — no file uploads, no server processing, no data leaves your device. Powered by DuckDB-WASM for Parquet operations and avsc for Avro serialization.</p>

      <h2>Supported Conversion Paths</h2>
      <p>This tool supports all six conversion directions between the three most common data lake and streaming formats:</p>
      <ul>
        <li><strong>JSON → Parquet</strong> — Compress JSON arrays into columnar Parquet files for efficient analytics. Ideal for loading into Snowflake external tables, AWS Athena, or Spark.</li>
        <li><strong>Parquet → JSON</strong> — Inspect and preview Parquet files without a query engine. Read column types, row counts, and actual data as human-readable JSON.</li>
        <li><strong>JSON → Avro</strong> — Encode JSON records into compact Avro binary with auto-inferred schemas. Perfect for Kafka producers and schema registry workflows.</li>
        <li><strong>Avro → JSON</strong> — Decode Avro container files (OCF) or raw Avro binary back to readable JSON. Debug Kafka consumer output and inspect Avro payloads.</li>
        <li><strong>Parquet → Avro</strong> — Convert columnar Parquet files to Avro binary for streaming ingestion. The converter chains Parquet → JSON → Avro internally.</li>
        <li><strong>Avro → Parquet</strong> — Convert Avro container files to columnar Parquet for analytical queries. The converter chains Avro → JSON → Parquet internally.</li>
      </ul>

      <h2>How It Works</h2>
      <ol>
        <li><strong>Select formats</strong> — Choose your source and target formats from the format selector (JSON, Parquet, Avro). Use the swap button to reverse direction instantly.</li>
        <li><strong>Provide input</strong> — Paste or type JSON directly, or drag-and-drop / browse for binary files (Parquet, Avro). Sample JSON data is preloaded for quick testing.</li>
        <li><strong>Convert</strong> — Click "Convert" and the tool processes everything in your browser. DuckDB-WASM handles Parquet read/write; avsc handles Avro encode/decode.</li>
        <li><strong>Preview and download</strong> — View a preview table (up to 50 rows), copy JSON output to clipboard, or download the converted file directly.</li>
      </ol>

      <h2>Technology</h2>
      <ul>
        <li><strong>DuckDB-WASM</strong> — A full analytical SQL engine compiled to WebAssembly (~2 MB). Handles native Parquet reading (read_parquet) and writing (COPY TO FORMAT PARQUET). Shared instance with the <a href="/tools/sql-playground">SQL Playground</a> so the engine only downloads once.</li>
        <li><strong>avsc</strong> — A pure JavaScript implementation of the Apache Avro specification (~264 KB). Handles Avro schema inference, binary serialization (toBuffer), deserialization (fromBuffer), and Avro Object Container File (OCF) decoding.</li>
        <li><strong>No server</strong> — All processing runs in your browser via WebAssembly and JavaScript. Files are read with the FileReader API and never uploaded anywhere.</li>
      </ul>

      <h2>Format Comparison</h2>
      <table>
        <thead>
          <tr><th>Feature</th><th>JSON</th><th>Parquet</th><th>Avro</th></tr>
        </thead>
        <tbody>
          <tr><td>Storage format</td><td>Text (row-oriented)</td><td>Binary (columnar)</td><td>Binary (row-oriented)</td></tr>
          <tr><td>Compression</td><td>None (gzip separately)</td><td>Built-in (Snappy, Zstd, Gzip)</td><td>Built-in (Deflate, Snappy)</td></tr>
          <tr><td>Schema</td><td>Schema-less</td><td>Embedded in footer</td><td>Embedded in header</td></tr>
          <tr><td>Best for</td><td>APIs, config, debugging</td><td>Analytics, data lakes, OLAP</td><td>Streaming, Kafka, CDC</td></tr>
          <tr><td>Columnar pruning</td><td>No</td><td>Yes (read only needed columns)</td><td>No</td></tr>
          <tr><td>Human readable</td><td>Yes</td><td>No</td><td>No</td></tr>
          <tr><td>Typical compression ratio</td><td>1x (baseline)</td><td>5-10x vs JSON</td><td>2-4x vs JSON</td></tr>
        </tbody>
      </table>

      <h2>When to Use Each Format</h2>
      <h3>Choose JSON when:</h3>
      <ul>
        <li>You need human-readable data for debugging, APIs, or configuration files</li>
        <li>Data is small (under 10 MB) and schema flexibility matters</li>
        <li>Consuming systems expect text-based input (REST APIs, logging pipelines)</li>
      </ul>

      <h3>Choose Parquet when:</h3>
      <ul>
        <li>Data is destined for analytical queries (Snowflake external tables, AWS Athena, Spark, BigQuery)</li>
        <li>You need columnar pruning — queries that read a subset of columns are dramatically faster</li>
        <li>Storage cost matters — Parquet typically achieves 5-10x compression vs raw JSON</li>
        <li>You are building a data lake on S3, GCS, or Azure Blob Storage</li>
      </ul>

      <h3>Choose Avro when:</h3>
      <ul>
        <li>Data flows through Apache Kafka or other message brokers with schema registry</li>
        <li>Schema evolution is critical — Avro supports backward/forward compatible schema changes</li>
        <li>Row-level serialization performance matters (streaming writes)</li>
        <li>You need compact binary encoding for change data capture (CDC) pipelines</li>
      </ul>

      <h2>Privacy and Security</h2>
      <p>All conversions run entirely in your browser. DuckDB-WASM and avsc process files locally via WebAssembly and JavaScript — no data is uploaded to any server, no network requests are made during conversion, and no files are stored. You can safely convert proprietary or sensitive data.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Is this converter free?</h3>
      <p>Yes, completely free with no signup, no limits, and no tracking. DuckDB-WASM and avsc run 100% in your browser.</p>

      <h3>What is the maximum file size?</h3>
      <p>The converter runs inside your browser's memory budget — typically 1-4 GB depending on your device. For most data engineering workflows (files under 100 MB), performance is fast. Very large files (500 MB+) may be slow or cause out-of-memory errors in the browser tab.</p>

      <h3>Does the Parquet output support compression?</h3>
      <p>Yes. DuckDB-WASM writes Parquet files with Snappy compression by default, which provides a good balance of compression ratio and speed. This matches the default used by Spark, Snowflake, and most data lake tools.</p>

      <h3>Can I convert Avro files without a schema?</h3>
      <p>Avro Object Container Files (OCF) embed their schema in the file header — the converter reads it automatically. For raw Avro binary without an embedded schema, you need to provide the schema separately (not currently supported in this tool).</p>

      <h3>How does Parquet-to-Avro conversion work?</h3>
      <p>The converter chains two steps internally: first it reads the Parquet file to JSON using DuckDB-WASM, then encodes the JSON to Avro using avsc. This approach works reliably for typical data sizes and avoids the need for a dedicated Parquet-to-Avro library.</p>

      <h3>Can I use this to preview Parquet files?</h3>
      <p>Yes. Select "Parquet → JSON", drop your .parquet file, and click Convert. The preview table shows the first 50 rows with all columns. You can also copy the full JSON output to clipboard.</p>

      <h2>Related Tools</h2>
      <ul>
        <li><a href="/tools/sql-playground">SQL Playground</a> — query data with SQL directly in your browser using DuckDB-WASM. Shares the same engine as this converter.</li>
        <li><a href="/tools/json-to-sql-ddl">JSON to SQL DDL</a> — generate CREATE TABLE statements from JSON samples for Snowflake, Postgres, BigQuery, and more.</li>
        <li><a href="/tools/csv-to-sql">CSV to SQL Converter</a> — convert CSV data to CREATE TABLE + INSERT statements.</li>
        <li><a href="/cheatsheets/sql-window-functions">Window Functions Reference</a> — SQL window function cheat sheet with runnable examples.</li>
        <li><a href="/interview-prep">Interview Prep Hub</a> — complete 14-day study plan for data engineer interviews.</li>
      </ul>
    `
  },
  {
    path: '/interview-prep',
    title: 'Data Engineer Interview Prep Hub 2026 - 14-Day Study Plan + 16 Cheat Sheets',
    description: 'Complete data engineer interview prep: 14-day structured study plan, 16 cheat sheets (SQL, Snowflake, Airflow, Python, System Design), mock questions, articles.',
    content: `
      <h1>Data Engineer Interview Preparation Hub</h1>
      <p><strong>Everything you need to prep for data engineer interviews in 2026</strong> - a 14-day structured study plan, 16+ topic-focused cheat sheets, mock questions, and deep-dive articles. Designed for mid-to-senior roles at data-heavy companies (FAANG, fintech, high-scale SaaS).</p>

      <h2>The 14-day study plan</h2>
      <p>Work through one focus area per day. Each day combines a cheat sheet review (30-45 min) with 5-10 mock questions (30 min) and one deep-dive article (30 min). Total: ~2 hours/day for 2 weeks.</p>

      <h3>Week 1: Core fundamentals</h3>
      <ul>
        <li><strong>Day 1 - SQL fundamentals:</strong> joins, group by, window functions, CTEs. Cheat sheet: <a href="/cheatsheets/sql-window-functions">SQL Window Functions</a>.</li>
        <li><strong>Day 2 - SQL interview patterns:</strong> top-N per group, gaps-and-islands, pivots. Cheat sheet: <a href="/cheatsheets/sql-interview-questions">SQL Interview Questions</a>.</li>
        <li><strong>Day 3 - Python for data:</strong> pandas, list comprehensions, generators. Cheat sheet: <a href="/cheatsheets/python-for-data-engineers">Python for DE</a>.</li>
        <li><strong>Day 4 - Data modeling:</strong> star vs snowflake schema, SCD types, normalization. Cheat sheet: <a href="/cheatsheets/data-modeling">Data modeling</a>.</li>
        <li><strong>Day 5 - Warehousing:</strong> OLTP vs OLAP, columnar storage, partitioning. Cheat sheet: <a href="/cheatsheets/snowflake-sql">Snowflake SQL</a>.</li>
        <li><strong>Day 6 - Orchestration:</strong> Airflow DAGs, dependencies, retries, SLAs. Cheat sheet: <a href="/cheatsheets/airflow-essentials">Airflow Essentials</a>.</li>
        <li><strong>Day 7 - Transformation:</strong> dbt models, tests, macros, incremental. Cheat sheet: <a href="/cheatsheets/dbt-commands">dbt Commands</a>.</li>
      </ul>

      <h3>Week 2: Platform + system design</h3>
      <ul>
        <li><strong>Day 8 - Snowflake deep dive:</strong> virtual warehouses, micro-partitions, clustering. Cheat sheet: <a href="/cheatsheets/snowflake-performance-deep-dive-interview">Snowflake Query Tuning (Interview)</a>.</li>
        <li><strong>Day 9 - PySpark:</strong> lazy eval, shuffles, broadcast joins, skew. Cheat sheet: <a href="/cheatsheets/pyspark">PySpark cheat sheet</a>.</li>
        <li><strong>Day 10 - Streaming:</strong> Kafka partitions, exactly-once, watermarks. Cheat sheet: <a href="/cheatsheets/snowflake-snowpipe-streaming-interview">Snowpipe Streaming & Kafka (Interview)</a>.</li>
        <li><strong>Day 11 - Cloud storage:</strong> S3 formats, Parquet vs Iceberg, lifecycle policies. Cheat sheet: <a href="/cheatsheets/aws-for-data-engineers">AWS for Data Engineers</a>.</li>
        <li><strong>Day 12 - System design:</strong> batch vs streaming, CAP theorem, idempotency. Cheat sheet: <a href="/cheatsheets/data-engineering-interview-questions">Data Engineering Interview Questions</a>.</li>
        <li><strong>Day 13 - Behavioral + STAR:</strong> conflict, ownership, on-call. Cheat sheet: <a href="/cheatsheets/snowflake-interview-questions">Snowflake Interview Questions</a>.</li>
        <li><strong>Day 14 - Mock + review:</strong> one end-to-end mock interview, review weak areas.</li>
      </ul>

      <h2>Cheat sheets by topic</h2>
      <p>Each cheat sheet is tightly scoped, runnable, and includes many code snippets. Filter by <a href="/cheatsheets/category/sql">SQL</a>, <a href="/cheatsheets/category/orchestration">orchestration</a>, <a href="/cheatsheets/category/cloud">cloud platforms</a>, <a href="/cheatsheets/category/programming">programming</a>, <a href="/cheatsheets/category/architecture">architecture</a>, <a href="/cheatsheets/category/interview">interview-specific</a>, or <a href="/cheatsheets/category/bestpractices">best practices</a>.</p>

      <h2>Interview format at top companies</h2>
      <ul>
        <li><strong>FAANG (Amazon, Meta, Google):</strong> 2 SQL rounds (advanced window functions, optimization), 1 system design (lambda architecture), 1-2 coding (Python/Spark), 1 behavioral (STAR).</li>
        <li><strong>Fintech (Stripe, Robinhood):</strong> heavy on correctness/consistency (idempotency, exactly-once), strong SQL, moderate coding.</li>
        <li><strong>SaaS scale-ups:</strong> dbt/Snowflake/Airflow deep dives, cost-aware design, more ownership questions.</li>
      </ul>

      <h2>Common question categories</h2>
      <ul>
        <li><strong>SQL:</strong> top-N per group, cumulative totals, gap detection, pivoting, slowest queries</li>
        <li><strong>Data modeling:</strong> design schema for X, SCD Type 2 implementation, fact vs dim</li>
        <li><strong>Pipelines:</strong> design daily sales dashboard, handle late-arriving data, backfill strategy</li>
        <li><strong>System design:</strong> real-time recommendations, data lake + warehouse, streaming ETL</li>
        <li><strong>Behavioral:</strong> hardest incident, disagreement with PM, on-call horror story</li>
      </ul>

      <h2>Related reading</h2>
      <p>Browse the full <a href="/cheatsheets/category/interview">interview cheat sheets category</a>, the <a href="/cheatsheets">complete cheat sheet library</a>, and the <a href="/articles">articles archive</a> for targeted prep.</p>
    `
  },
  {
    path: '/cheatsheets/category/sql',
    title: 'SQL Cheat Sheets 2026 - Window Functions, Snowflake SQL, SQL Interview',
    description: 'All SQL-focused cheat sheets in one place. Window functions, Snowflake SQL, SQL interview questions, and Databricks SQL references.',
    content: `
      <h1>SQL Cheat Sheets</h1>
      <p><strong>Every SQL cheat sheet in one place</strong> - core window functions, platform-specific syntax (Snowflake, Databricks), and SQL interview prep. Each sheet is runnable, snippet-heavy, and updated for 2026.</p>

      <h2>Core SQL</h2>
      <ul>
        <li><a href="/cheatsheets/sql-window-functions">SQL Window Functions</a> - ranking, running totals, lead/lag, frame specs, partitioning</li>
        <li><a href="/cheatsheets/snowflake-sql">Snowflake SQL</a> - QUALIFY, VARIANT, FLATTEN, time travel, MERGE</li>
      </ul>

      <h2>Platform-specific SQL</h2>
      <ul>
        <li><a href="/cheatsheets/databricks">Databricks Cheat Sheet</a> - Photon, Delta Lake DML, MERGE, Unity Catalog</li>
      </ul>

      <h2>SQL for interviews</h2>
      <ul>
        <li><a href="/cheatsheets/sql-interview-questions">Top 25 SQL Interview Questions</a> - worked answers with patterns</li>
        <li><a href="/cheatsheets/data-engineering-interview-questions">Data Engineering Interview Questions</a> - includes SQL sections</li>
      </ul>

      <h2>Related tools</h2>
      <p>Use the <a href="/tools/sql-formatter">SQL formatter</a> to pretty-print queries and the <a href="/tools/json-to-sql-ddl">JSON-to-SQL converter</a> to generate CREATE TABLE DDL.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/cloud">cloud platform cheat sheets</a>, <a href="/cheatsheets/category/orchestration">orchestration</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/orchestration',
    title: 'Data Orchestration Cheat Sheets 2026 - Airflow, dbt, Scheduling Patterns',
    description: 'All orchestration cheat sheets - Airflow DAGs, dbt models and tests, scheduling patterns, dependency management, retries, SLAs.',
    content: `
      <h1>Data Orchestration Cheat Sheets</h1>
      <p><strong>Schedule, chain, and monitor data pipelines</strong> with the right orchestrator. These cheat sheets cover Airflow (most common) and dbt (transformation-focused). Each explains when to pick it and includes production-grade patterns.</p>

      <h2>Orchestrators covered</h2>
      <ul>
        <li><a href="/cheatsheets/airflow-essentials">Airflow Essentials</a> - DAG authoring, operators, XCom, retries, SLAs, backfill</li>
        <li><a href="/cheatsheets/dbt-commands">dbt Commands</a> - models, tests, macros, incremental, exposures, packages</li>
      </ul>

      <h2>Best-practice sheets</h2>
      <ul>
        <li><a href="/cheatsheets/airflow-best-practices">Airflow Best Practices</a> - idempotent tasks, retries, SLA design, secrets handling</li>
        <li><a href="/cheatsheets/dbt-best-practices">dbt Best Practices</a> - model structure, testing strategy, CI, documentation</li>
      </ul>

      <h2>Which orchestrator should I pick?</h2>
      <ul>
        <li><strong>Airflow:</strong> mature, huge community, operator ecosystem - default for enterprise teams</li>
        <li><strong>dbt:</strong> transformation-only, SQL-first - pair with Airflow for end-to-end pipelines</li>
      </ul>

      <h2>Related tools</h2>
      <p>Use the <a href="/tools/cron-expression-builder">cron builder</a> to define schedules and the <a href="/tools/dbt-cloud-cost-calculator">dbt Cloud cost calculator</a> to estimate subscription cost.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/bestpractices">best-practices cheat sheets</a>, <a href="/cheatsheets/category/sql">SQL cheat sheets</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/cloud',
    title: 'Cloud Data Platform Cheat Sheets 2026 - AWS, Azure, Snowflake, Databricks',
    description: 'Cloud platform cheat sheets for data engineers - AWS (S3, Glue, Redshift), Azure (ADF, Synapse), Snowflake, Databricks.',
    content: `
      <h1>Cloud Data Platform Cheat Sheets</h1>
      <p><strong>Master the major cloud data platforms</strong> with focused cheat sheets on AWS, Azure, Snowflake, and Databricks. Each sheet covers storage, compute, orchestration, and cost controls for that platform.</p>

      <h2>Cloud platforms</h2>
      <ul>
        <li><a href="/cheatsheets/aws-for-data-engineers">AWS for Data Engineers</a> - S3, Glue, Athena, Redshift, EMR, Lambda</li>
        <li><a href="/cheatsheets/azure-for-data-engineers">Azure for Data Engineers</a> - ADLS, Synapse, Data Factory, Fabric</li>
      </ul>

      <h2>Warehouse and lakehouse</h2>
      <ul>
        <li><a href="/cheatsheets/snowflake-sql">Snowflake SQL</a> - warehouses, clustering, time travel, MERGE</li>
        <li><a href="/cheatsheets/databricks">Databricks Cheat Sheet</a> - Photon, Delta, Unity Catalog, MERGE</li>
      </ul>

      <h2>Related tools</h2>
      <p>Estimate costs with the <a href="/tools/snowflake-cost-calculator">Snowflake cost calculator</a> and <a href="/tools/databricks-cost-calculator">Databricks cost calculator</a>.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/sql">SQL cheat sheets</a>, <a href="/cheatsheets/category/architecture">architecture cheat sheets</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/programming',
    title: 'Programming Cheat Sheets for Data Engineers 2026 - Python, PySpark',
    description: 'Programming cheat sheets for data engineers - Python for DE, PySpark, data manipulation, distributed processing, performance patterns.',
    content: `
      <h1>Programming Cheat Sheets for Data Engineers</h1>
      <p><strong>Python and PySpark references built for data work</strong> - not generic Python. Focus on data manipulation, distributed processing, and performance patterns that actually matter in data pipelines.</p>

      <h2>Python</h2>
      <ul>
        <li><a href="/cheatsheets/python-for-data-engineers">Python for Data Engineers</a> - pandas, list comprehensions, generators, context managers, typing</li>
      </ul>

      <h2>Distributed processing</h2>
      <ul>
        <li><a href="/cheatsheets/pyspark">PySpark & Spark SQL Cheat Sheet</a> - DataFrame API, lazy eval, partitioning, shuffles, broadcast joins</li>
      </ul>

      <h2>Streaming and ingestion</h2>
      <ul>
        <li><a href="/cheatsheets/snowflake-snowpipe-streaming-interview">Snowpipe Streaming & Kafka (Interview)</a> - producers, consumers, partitions, exactly-once</li>
      </ul>

      <h2>Related tools</h2>
      <p>Use the <a href="/tools/json-to-sql-ddl">JSON to SQL converter</a> when going from semi-structured data to warehouse tables, and the <a href="/tools/sql-formatter">SQL formatter</a> to standardize output queries.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/orchestration">orchestration cheat sheets</a>, <a href="/cheatsheets/category/sql">SQL cheat sheets</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/architecture',
    title: 'Data Architecture Cheat Sheets 2026 - Modeling, SCD, Dimensional Design',
    description: 'Data architecture cheat sheets - dimensional modeling, SCD types, star vs snowflake schema, fact vs dim, normalization patterns.',
    content: `
      <h1>Data Architecture Cheat Sheets</h1>
      <p><strong>Design durable data systems</strong> - dimensional modeling, storage architecture, and system-design patterns. These sheets cover the decisions that hurt most when you get them wrong: star vs snowflake, SCD strategy, batch vs streaming, storage vs compute separation.</p>

      <h2>Data modeling</h2>
      <ul>
        <li><a href="/cheatsheets/data-modeling">Data Modeling Cheat Sheet</a> - star/snowflake schemas, SCD Type 1/2/3, normalization, fact vs dim, Data Vault</li>
      </ul>

      <h2>Interview-focused architecture sheets</h2>
      <ul>
        <li><a href="/cheatsheets/snowflake-streams-tasks-interview">Snowflake Streams & Tasks (Interview)</a> - change data capture, incremental patterns</li>
        <li><a href="/cheatsheets/snowflake-dynamic-tables-interview">Snowflake Dynamic Tables (Interview)</a> - declarative pipelines, refresh semantics</li>
        <li><a href="/cheatsheets/snowflake-iceberg-tables-interview">Snowflake Iceberg Tables (Interview)</a> - open table format, catalog integrations</li>
        <li><a href="/cheatsheets/snowflake-replication-failover-interview">Snowflake Replication & Failover (Interview)</a> - DR patterns, cross-region</li>
      </ul>

      <h2>Related tools</h2>
      <p>Use the <a href="/tools/snowflake-warehouse-sizing">warehouse sizing tool</a> for capacity planning and the <a href="/tools/snowflake-cost-calculator">cost calculator</a> for TCO modeling.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/cloud">cloud platform cheat sheets</a>, <a href="/cheatsheets/category/interview">interview cheat sheets</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/interview',
    title: 'Data Engineer Interview Cheat Sheets 2026 - 16+ Topic-Focused Sheets',
    description: 'Interview-focused cheat sheets for data engineers - top questions, Snowflake deep-dive topics, SQL interview, paired with 14-day study plan.',
    content: `
      <h1>Data Engineer Interview Cheat Sheets</h1>
      <p><strong>Pass your next data engineer interview</strong> with focused prep materials. These sheets cover the questions, patterns, and deep-dive topics most commonly asked in 2026 - at FAANG, fintech, and high-scale SaaS companies.</p>

      <h2>General interview sheets</h2>
      <ul>
        <li><a href="/cheatsheets/data-engineering-interview-questions">Data Engineering Interview Questions</a> - broad-coverage, worked answers</li>
        <li><a href="/cheatsheets/sql-interview-questions">Top 25 SQL Interview Questions</a> - SQL patterns for DE roles</li>
        <li><a href="/cheatsheets/snowflake-interview-questions">Top 30 Snowflake Interview Questions</a> - platform fundamentals</li>
      </ul>

      <h2>Snowflake deep-dive interview sheets</h2>
      <ul>
        <li><a href="/cheatsheets/snowflake-streams-tasks-interview">Streams & Tasks</a></li>
        <li><a href="/cheatsheets/snowflake-dynamic-tables-interview">Dynamic Tables</a></li>
        <li><a href="/cheatsheets/snowflake-snowpark-interview">Snowpark</a></li>
        <li><a href="/cheatsheets/snowflake-data-sharing-interview">Data Sharing & Marketplace</a></li>
        <li><a href="/cheatsheets/snowflake-iceberg-tables-interview">Iceberg Tables</a></li>
        <li><a href="/cheatsheets/snowflake-cortex-ai-interview">Cortex AI & ML</a></li>
        <li><a href="/cheatsheets/snowflake-snowpipe-streaming-interview">Snowpipe Streaming & Kafka</a></li>
        <li><a href="/cheatsheets/snowflake-governance-interview">Governance & Masking</a></li>
        <li><a href="/cheatsheets/snowflake-cost-optimization-interview">Cost Optimization</a></li>
        <li><a href="/cheatsheets/snowflake-performance-deep-dive-interview">Query Tuning</a></li>
        <li><a href="/cheatsheets/snowflake-replication-failover-interview">Replication & Failover</a></li>
        <li><a href="/cheatsheets/snowflake-semi-structured-interview">Semi-Structured Data</a></li>
        <li><a href="/cheatsheets/snowflake-stored-procedures-interview">Stored Procedures & UDFs</a></li>
        <li><a href="/cheatsheets/snowflake-external-integrations-interview">External Functions & Integrations</a></li>
      </ul>

      <h2>14-day study plan</h2>
      <p>Work through the <a href="/interview-prep">full 14-day prep plan</a> - 2 hours/day covering SQL, Python, modeling, orchestration, Snowflake, Spark, streaming, cloud, system design, and behavioral.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/sql">SQL cheat sheets</a>, <a href="/cheatsheets/category/architecture">architecture</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
    `
  },
  {
    path: '/cheatsheets/category/bestpractices',
    title: 'Data Engineering Best Practices Cheat Sheets 2026 - Snowflake, dbt, Airflow',
    description: 'Best-practice cheat sheets for data engineers - Snowflake ops, dbt projects, Airflow in production. Testing, quality, monitoring, cost optimization.',
    content: `
      <h1>Data Engineering Best Practices</h1>
      <p><strong>Ship pipelines that don't page you at 3 AM.</strong> These cheat sheets cover the operational patterns, testing strategies, and quality gates that separate hobby pipelines from production-grade systems.</p>

      <h2>Best-practice cheat sheets</h2>
      <ul>
        <li><a href="/cheatsheets/snowflake-best-practices">Snowflake Best Practices</a> - warehouses, clustering, resource monitors, security, cost controls</li>
        <li><a href="/cheatsheets/dbt-best-practices">dbt Best Practices</a> - model structure, testing strategy, CI, documentation, incremental models</li>
        <li><a href="/cheatsheets/airflow-best-practices">Airflow Best Practices</a> - idempotent tasks, retries, SLA design, secrets handling, observability</li>
      </ul>

      <h2>Related topics</h2>
      <p>For orchestration patterns (retries, backfills, SLA alerting) see <a href="/cheatsheets/category/orchestration">orchestration cheat sheets</a>. For cost instrumentation on Snowflake, see <a href="/cheatsheets/snowflake-cost-optimization-interview">Snowflake cost optimization interview sheet</a>.</p>

      <h2>Related tools</h2>
      <p>Estimate costs with the <a href="/tools/snowflake-cost-calculator">Snowflake cost calculator</a>, visualize schedules with the <a href="/tools/cron-expression-builder">cron builder</a>.</p>

      <h2>Related categories</h2>
      <p>Explore <a href="/cheatsheets/category/orchestration">orchestration</a>, <a href="/cheatsheets/category/architecture">architecture</a>, and the full <a href="/cheatsheets">cheat sheet library</a>.</p>
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
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
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
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Truncate text at a sentence boundary without exceeding maxLen.
 * Prefers cutting at the last '.', '!', or '?' before maxLen.
 * Falls back to the last space before maxLen with '…' appended.
 */
function truncateAtSentence(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  const region = text.substring(0, maxLen);
  // Find last sentence-ending punctuation
  const lastSentenceEnd = Math.max(
    region.lastIndexOf('. '),
    region.lastIndexOf('! '),
    region.lastIndexOf('? '),
    region.lastIndexOf('.\u00a0'),  // non-breaking space
  );
  if (lastSentenceEnd > maxLen * 0.4) {
    // Cut right after the punctuation mark
    return region.substring(0, lastSentenceEnd + 1).trim();
  }
  // No good sentence boundary — cut at last space
  const lastSpace = region.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.4) {
    return region.substring(0, lastSpace).trim() + '…';
  }
  // Worst case: hard cut
  return region.trim() + '…';
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

  // Pattern 8: Add loading="lazy" to <img> tags that don't already have it
  processedContent = processedContent.replace(
    /<img(?![^>]*loading=)([^>]*?)(\s*\/?>)/gi,
    '<img loading="lazy"$1$2'
  );

  // Pattern 9: Alt text fallback — derive from filename when alt is empty or missing
  processedContent = processedContent.replace(
    /<img([^>]*?)(\s*\/?>)/gi,
    (match, attrs, close) => {
      const altMatch = attrs.match(/alt="([^"]*)"/i);
      if (altMatch && altMatch[1].trim()) return match; // already has meaningful alt
      // Extract filename from src for fallback alt text
      const srcMatch = attrs.match(/src="([^"]+)"/i);
      if (!srcMatch) return match;
      const filename = srcMatch[1].split('/').pop().split('?')[0]
        .replace(/\.[^.]+$/, '')       // remove extension
        .replace(/[-_]/g, ' ')         // dashes/underscores to spaces
        .replace(/\d{2,}/g, '')        // remove numeric sequences
        .replace(/\s+/g, ' ')          // collapse whitespace
        .trim();
      if (!filename) return match;
      const altText = filename.charAt(0).toUpperCase() + filename.slice(1);
      if (altMatch) {
        // Replace empty alt=""
        return `<img${attrs.replace(/alt="[^"]*"/i, `alt="${escapeHtml(altText)}`)}${close}`;
      }
      // No alt attribute at all — add one
      return `<img alt="${escapeHtml(altText)}"${attrs}${close}`;
    }
  );

  return processedContent;
}

// ============================================================================
// 🔥 FIXED HTML GENERATION - FULL CONTENT FOR CRAWLERS WITH IMAGES
// ============================================================================

function generateFullArticleHTML(pageData, bundleFiles, relatedArticles = []) {
  const { title: rawTitle, description: rawDescription, path: pagePath, fullContent = '', slug, date: postDate, modified: postModified, featuredImage, categoryNames = [], tagNames = [] } = pageData;
  const { jsFile, cssFile, modulePreloadHtml = '' } = bundleFiles;

  // 🛡️ Sanitize user-supplied strings from WordPress
  // WordPress REST API returns pre-encoded entities in rendered fields —
  // decode first, then re-encode to prevent double-encoding.
  const title = escapeHtml(decodeHtmlEntities(rawTitle));
  const description = escapeHtml(decodeHtmlEntities(rawDescription));
  const titleJsonLd = escapeJsonLd(decodeHtmlEntities(rawTitle));
  const descriptionJsonLd = escapeJsonLd(decodeHtmlEntities(rawDescription));

  // 🔥 CRITICAL: Use relative paths from article subdirectory
  const depth = (pagePath.match(/\//g) || []).length - 1;
  const relativePrefix = '../'.repeat(depth);

  // Remove leading slash and prepend relative prefix
  const productionJsFile = jsFile;
  const productionCssFile = cssFile;
  // Convert absolute modulepreload paths to relative
  const relativeModulePreload = modulePreloadHtml.replace(/href="\/assets\//g, `href="${relativePrefix}assets/`);

  const buildTimestamp = new Date().toISOString();
  const buildHash = crypto.randomBytes(8).toString('hex');

  // Ensure dateModified is never before datePublished (Google flags this)
  const effectivePublished = postDate || buildTimestamp;
  let effectiveModified = postModified || postDate || buildTimestamp;
  if (effectiveModified < effectivePublished) {
    effectiveModified = effectivePublished;
  }

  // 🖼️ Process images to make them absolute
  const absoluteContent = makeImagesAbsolute(fullContent);

  // 📐 Normalize heading hierarchy (h3→h2 etc. when h2 is missing)
  let processedContent = normalizeHeadings(absoluteContent);

  // 🔗 Inject internal links so crawlers see cross-article links in static HTML
  processedContent = injectInternalLinksSSG(processedContent, slug);

  // 📑 Extract headings for Table of Contents and inject anchor IDs
  const tocHeadings = [];
  const seenSlugs = new Set();
  processedContent = processedContent.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, inner) => {
      const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')).trim();
      if (!text || text.length < 3) return match;
      // Generate unique slug
      let baseSlug = text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 60);
      let slug = baseSlug;
      let counter = 2;
      while (seenSlugs.has(slug)) { slug = baseSlug + '-' + counter++; }
      seenSlugs.add(slug);
      tocHeadings.push({ tag: tag.toLowerCase(), text, slug });
      // Inject id attribute into heading (preserve existing attrs)
      if (/id\s*=/i.test(attrs)) return match; // already has id
      return `<${tag}${attrs} id="${slug}">${inner}</${tag}>`;
    }
  );
  const tocHtml = tocHeadings.length >= 3 ? (() => {
    let html = '        <nav class="article-toc" aria-label="Table of Contents">\n';
    html += '          <details open>\n';
    html += '            <summary>Table of Contents</summary>\n';
    html += '            <ul>\n';
    for (const h of tocHeadings) {
      const indent = h.tag === 'h3' ? '                ' : '              ';
      const cls = h.tag === 'h3' ? ' class="toc-sub"' : '';
      html += `${indent}<li${cls}><a href="#${h.slug}">${escapeHtml(h.text)}</a></li>\n`;
    }
    html += '            </ul>\n';
    html += '          </details>\n';
    html += '        </nav>\n';
    return html;
  })() : '';

  // 🖼️ Determine OG image: use featured image or fallback to default
  const ogImageUrl = featuredImage || 'https://dataengineerhub.blog/og-image.jpg';

  // 📊 Thin content detection for articles
  const articlePlainText = stripHTML(processedContent || '');
  const articleWordCount = articlePlainText.split(/\s+/).filter(w => w.length > 0).length;
  const articleRobotsDirective = articleWordCount < 400
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large';

  // 📖 Reading time + formatted publish date for visible byline
  const readingTime = Math.max(1, Math.ceil(articleWordCount / 250));
  const publishDateObj = new Date(effectivePublished);
  const formattedDate = publishDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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
    <meta name="robots" content="${articleRobotsDirective}" />
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
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:locale" content="en_US" />
    <meta property="article:published_time" content="${effectivePublished}" />
    <meta property="article:modified_time" content="${effectiveModified}" />
    <meta property="article:author" content="https://dataengineerhub.blog/about" />
${categoryNames.length > 0 ? `    <meta property="article:section" content="${escapeHtml(categoryNames[0])}" />\n` : ''}${tagNames.slice(0, 6).map(t => `    <meta property="article:tag" content="${escapeHtml(t)}" />`).join('\n')}

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
    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">
${CONSENT_MODE_V2_HTML}
    ${articleRobotsDirective.startsWith('noindex') ? '<!-- AdSense loader omitted on noindex article -->' : `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}"
            crossorigin="anonymous"></script>`}
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="apple-touch-icon" href="/logo.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1e293b">
    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />
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
      
      /* Table of Contents styles */
      .article-toc {
        background: #f8f9fa;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px 20px;
        margin: 20px 0 28px;
        max-width: 600px;
      }
      .article-toc summary {
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        color: #1a202c;
      }
      .article-toc ul {
        list-style: none;
        padding: 0;
        margin: 12px 0 0;
      }
      .article-toc li {
        margin: 6px 0;
      }
      .article-toc li.toc-sub {
        padding-left: 20px;
      }
      .article-toc a {
        color: #2563eb;
        text-decoration: none;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .article-toc a:hover {
        text-decoration: underline;
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

      /* Site Nav */
      .site-nav {
        background: rgba(15, 23, 42, 0.95);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 12px 20px;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .site-nav-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      .site-nav-brand {
        color: #60a5fa;
        font-weight: 700;
        font-size: 1.1rem;
        text-decoration: none;
      }
      .site-nav-links {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .site-nav-links a {
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
      }
      .site-nav-links a:hover { color: #60a5fa; }

      /* Site Footer */
      .site-footer {
        max-width: 900px;
        margin: 3rem auto 0;
        padding: 2rem 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
        text-align: center;
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .site-footer-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px 20px;
        list-style: none;
        padding: 0;
        margin: 0 0 0.75rem;
      }
      .site-footer-links a {
        color: #60a5fa;
        text-decoration: none;
      }
      .site-footer-links a:hover { text-decoration: underline; }

      body.react-loaded .site-nav,
      body.react-loaded .site-footer { display: none; }

      @media (max-width: 768px) {
        .site-nav-links { gap: 4px 12px; }
      }
    </style>
  </head>
  <body>
    <!-- 🔥 ROOT DIV: React will mount here, but SEO content is visible first -->
    <div id="root">
      <nav class="site-nav" aria-label="Site navigation">
        <div class="site-nav-inner">
          <a href="https://dataengineerhub.blog" class="site-nav-brand">DataEngineer Hub</a>
          <ul class="site-nav-links">
            <li><a href="https://dataengineerhub.blog/articles">Articles</a></li>
            <li><a href="https://dataengineerhub.blog/glossary">Glossary</a></li>
            <li><a href="https://dataengineerhub.blog/compare">Compare</a></li>
            <li><a href="https://dataengineerhub.blog/cheatsheets">Cheatsheets</a></li>
            <li><a href="https://dataengineerhub.blog/tools">Tools</a></li>
            <li><a href="https://dataengineerhub.blog/about">About</a></li>
            <li><a href="https://dataengineerhub.blog/contact">Contact</a></li>
          </ul>
        </div>
      </nav>

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
          <h1 class="article-title">${title}</h1>
          <div style="display:flex;align-items:center;gap:0.6rem;margin:0.75rem 0 1rem;flex-wrap:wrap;color:#94a3b8;font-size:0.9rem;">
            <a href="/about" style="color:#60a5fa;text-decoration:none;font-weight:500;">Sainath Reddy</a>
            <span>·</span>
            <time datetime="${effectivePublished}">${formattedDate}</time>
            <span>·</span>
            <span>${readingTime} min read</span>
          </div>
          <p class="excerpt article-description">${description}</p>

          ${tocHtml}

          ${slug === 'snowflake-cost-optimization-techniques-2026' ? `
          <!-- Contextual CTA: drive readers to the interactive cost calculator -->
          <aside class="calculator-promo" style="background:linear-gradient(90deg,#1e3a8a 0%,#6b21a8 100%);border-radius:12px;padding:1.1rem 1.4rem;margin:0 0 1.75rem 0;box-shadow:0 4px 14px rgba(107,33,168,0.25);">
            <a href="/tools/snowflake-cost-calculator" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
              <span style="font-size:1.3rem;" aria-hidden="true">🧮</span>
              <span>Try our free Snowflake Cost Calculator — estimate your monthly spend in seconds →</span>
            </a>
          </aside>` : ''}

          ${(categoryNames || []).some(c => String(c).toLowerCase() === 'snowflake') ? `
          <!-- Related Tools aside: every Snowflake article gets 4 tool links for internal linking + user discovery -->
          <aside class="related-tools" style="background:#0f172a;border:1px solid rgba(96,165,250,0.25);border-radius:12px;padding:1.1rem 1.4rem;margin:0 0 1.75rem 0;">
            <h3 style="color:#93c5fd;font-size:1rem;margin:0 0 0.6rem;font-weight:600;">Free Snowflake Tools</h3>
            <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr;gap:0.45rem;">
              <li><a href="/tools/snowflake-cost-calculator" style="color:#60a5fa;text-decoration:none;font-weight:500;">Snowflake Cost Calculator</a> <span style="color:#94a3b8;font-size:0.9rem;">&mdash; full monthly spend estimator</span></li>
              <li><a href="/tools/snowflake-query-cost-estimator" style="color:#60a5fa;text-decoration:none;font-weight:500;">Query Cost Estimator</a> <span style="color:#94a3b8;font-size:0.9rem;">&mdash; cost per query from bytes scanned</span></li>
              <li><a href="/tools/snowflake-warehouse-sizing" style="color:#60a5fa;text-decoration:none;font-weight:500;">Warehouse Sizing</a> <span style="color:#94a3b8;font-size:0.9rem;">&mdash; pick XS&ndash;6XL for your workload</span></li>
              <li><a href="/tools/snowflake-credit-cost" style="color:#60a5fa;text-decoration:none;font-weight:500;">Credit &rarr; USD Converter</a> <span style="color:#94a3b8;font-size:0.9rem;">&mdash; instant credit price lookup</span></li>
            </ul>
          </aside>` : ''}

          <!-- 🔥 THIS IS THE KEY: FULL HTML CONTENT WITH IMAGES -->
          <div class="article-body">
            ${sanitizeWordPressHTML(processedContent)}
          </div>

          <!-- AdSense: we rely on Auto Ads (enabled in AdSense UI) instead of
               manual ad units. The adsbygoogle loader in head is enough
               for AdSense site verification and automatic ad placement.
               No manual ad unit markup is emitted here because we do not
               yet have a real numeric ad slot ID. -->
          ${articleRobotsDirective.startsWith('noindex') ? '' : `
          <!-- Auto Ads placement hint (no manual slot). Safe no-op when Auto Ads is on. -->
          <div class="auto-ads-placement" style="min-height: 1px;" aria-hidden="true"></div>`}
          
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

      <footer class="site-footer">
        <ul class="site-footer-links">
          <li><a href="https://dataengineerhub.blog/privacy-policy">Privacy Policy</a></li>
          <li><a href="https://dataengineerhub.blog/terms-of-service">Terms</a></li>
          <li><a href="https://dataengineerhub.blog/disclaimer">Disclaimer</a></li>
          <li><a href="https://dataengineerhub.blog/about">About</a></li>
          <li><a href="https://dataengineerhub.blog/contact">Contact</a></li>
          <li><a href="https://dataengineerhub.blog/rss.xml">RSS</a></li>
        </ul>
        <p>&copy; ${new Date().getFullYear()} DataEngineer Hub. All rights reserved.</p>
      </footer>
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
          "https://www.linkedin.com/in/sainathreddypogaku/",
          "https://github.com/sainath-reddiee/dataengineer"
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
      "datePublished": "${effectivePublished}",
      "dateModified": "${effectiveModified}",
      "wordCount": ${articleWordCount},
      ${categoryNames.length > 0 ? `"articleSection": ${JSON.stringify(categoryNames[0])},` : ''}
      ${tagNames.length > 0 ? `"keywords": ${JSON.stringify(tagNames.slice(0, 10))},` : ''}
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".article-title", ".article-description"]
      },
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
        "https://twitter.com/sainath29",
        "https://www.linkedin.com/in/sainathreddypogaku/",
        "https://github.com/sainath-reddiee/dataengineer"
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
      "url": "https://dataengineerhub.blog/about",
      "jobTitle": "Data Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "Anblicks"
      },
      "sameAs": [
        "https://www.linkedin.com/in/sainathreddypogaku/",
        "https://twitter.com/sainath29",
        "https://github.com/sainath-reddiee/dataengineer"
      ],
      "knowsAbout": ["Data Engineering", "Snowflake", "AWS", "Azure", "Databricks", "Apache Airflow", "dbt", "ETL/ELT Pipelines", "Data Warehousing", "Cloud Architecture"],
      "description": "Data Engineer with 4+ years of experience specializing in building scalable data pipelines and cloud-native data solutions."
    }
    </script>
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
      window.addEventListener('react-mounted', function() {
        document.body.classList.add('react-loaded');
        console.log('✅ React app mounted - switching to interactive mode');
      }, { once: true });
      // Fallback: If React doesn't load in 5 seconds, keep static content
      setTimeout(function() {
        if (!document.body.classList.contains('react-loaded')) {
          console.log('⚠️  React not detected - showing static content');
        }
      }, 5000);
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

  const productionJsFile = jsFile;
  const productionCssFile = cssFile;

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

  // Group articles by PRIMARY category only (first category) to avoid duplicates
  const articlesByCategory = {};
  for (const article of allArticleSummaries) {
    const primaryCatId = (article.categories || [])[0];
    const catName = primaryCatId ? (catMap[primaryCatId] || 'General') : 'General';
    if (!articlesByCategory[catName]) articlesByCategory[catName] = [];
    articlesByCategory[catName].push(article);
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

  const productionJsFile = jsFile;
  const productionCssFile = cssFile;

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
    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">
${CONSENT_MODE_V2_HTML}
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}"
            crossorigin="anonymous"></script>
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="apple-touch-icon" href="/logo.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1e293b">
    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />
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
      window.addEventListener('react-mounted', function() {
        document.body.classList.add('react-loaded');
      }, { once: true });
      setTimeout(function() {
        if (!document.body.classList.contains('react-loaded')) {
          console.log('React not detected - showing static content');
        }
      }, 5000);
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

  const productionJsFile = jsFile;
  const productionCssFile = cssFile;

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
  // Thin-content mitigation: noindex category pages with fewer than 3 articles (AdSense quality signal)
  var catRobots = (categoryArticles.length < 3)
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  html += '    <meta name="robots" content="' + catRobots + '" />\n\n';
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
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
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

  var productionJsFile = jsFile;
  var productionCssFile = cssFile;

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
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-glossary.png" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="Data Engineering Glossary | ' + totalTerms + ' Key Terms Explained" />\n';
  html += '    <meta name="twitter:description" content="Comprehensive glossary covering ' + totalTerms + ' essential data engineering terms across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-glossary.png" />\n';
  html += '    <meta name="twitter:image:alt" content="Data Engineering Glossary | DataEngineer Hub" />\n';
  html += '\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n';
  html += '\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
  html += '    </script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// GLOSSARY PAGE HTML GENERATION - Rich definition pages for pSEO
// ============================================================================

function generateGlossaryPageHTML(term, allGlossaryTerms, bundleFiles, allArticleSummaries) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;
  var pagePath = '/glossary/' + term.slug;

  var depth = (pagePath.match(/\//g) || []).length - 1;
  var relativePrefix = '../'.repeat(depth);

  var productionJsFile = jsFile;
  var productionCssFile = cssFile;

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

  // Determine if content is thin (< 250 words) — noindex thin pages
  var defWordCount = (term.fullDefinition || '').split(/\s+/).length;
  var robotsDirective = defWordCount < 250
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  // Category display name
  var categoryDisplay = (term.category || '').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });

  var descriptionMeta = term.shortDefinition || ('Learn what ' + term.term + ' means in data engineering. Comprehensive definition, key points, and FAQs.');

  // Build HTML
  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>What is ' + escapeHtml(term.term) + '? | Data Engineering Glossary | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="' + robotsDirective + '" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="article" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="What is ' + escapeHtml(term.term) + '? | Data Engineering Glossary" />\n';
  html += '    <meta property="og:description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-glossary.png" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="What is ' + escapeHtml(term.term) + '? | Data Engineering Glossary" />\n';
  html += '    <meta name="twitter:description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-glossary.png" />\n';
  html += '    <meta name="twitter:image:alt" content="What is ' + escapeHtml(term.term) + '? | Data Engineering Glossary" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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

  // Related articles (keyword match from blog articles)
  if (allArticleSummaries && allArticleSummaries.length > 0) {
    var termLower = term.term.toLowerCase();
    var termWords = termLower.split(/\s+/).filter(function(w) { return w.length > 3; });
    var matched = allArticleSummaries.filter(function(a) {
      var titleLower = (a.title || '').toLowerCase();
      return termWords.some(function(w) { return titleLower.indexOf(w) !== -1; });
    }).slice(0, 5);
    if (matched.length > 0) {
      html += '        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">\n';
      html += '          <h2 style="color: #93c5fd; font-size: 1.3rem; margin-bottom: 1rem;">Related Articles</h2>\n';
      html += '          <ul style="list-style: none; padding: 0;">\n';
      for (var i = 0; i < matched.length; i++) {
        html += '            <li style="margin-bottom: 0.6rem;"><a href="/articles/' + matched[i].slug + '" style="color: #60a5fa; text-decoration: none; font-weight: 500;">' + escapeHtml(matched[i].title) + '</a></li>\n';
      }
      html += '          </ul>\n';
      html += '        </div>\n\n';
    }
  }

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
  html += '      },\n';
  html += '      "datePublished": "' + (term.lastUpdated || new Date().toISOString().split('T')[0]) + '",\n';
  html += '      "dateModified": "' + (term.lastUpdated || new Date().toISOString().split('T')[0]) + '"\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
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

  var productionJsFile = jsFile;
  var productionCssFile = cssFile;

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
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-comparison.png" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="Data Engineering Tool Comparisons | ' + totalComparisons + ' Head-to-Head Guides" />\n';
  html += '    <meta name="twitter:description" content="Side-by-side comparisons of ' + totalComparisons + ' data engineering tools across ' + categoryKeys.length + ' categories." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-comparison.png" />\n';
  html += '    <meta name="twitter:image:alt" content="Data Engineering Tool Comparisons | DataEngineer Hub" />\n';
  html += '\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n';
  html += '\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
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

  var productionJsFile = jsFile;
  var productionCssFile = cssFile;

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
  html += '    <title>' + escapeHtml(comparison.toolA) + ' vs ' + escapeHtml(comparison.toolB) + ' | Data Engineering Tools Comparison | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="article" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + escapeHtml(comparison.toolA) + ' vs ' + escapeHtml(comparison.toolB) + ' Comparison" />\n';
  html += '    <meta property="og:description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-comparison.png" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + escapeHtml(comparison.toolA) + ' vs ' + escapeHtml(comparison.toolB) + ' Comparison" />\n';
  html += '    <meta name="twitter:description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-comparison.png" />\n';
  html += '    <meta name="twitter:image:alt" content="' + escapeHtml(comparison.toolA) + ' vs ' + escapeHtml(comparison.toolB) + ' Comparison" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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
  html += '      "author": { "@type": "Person", "name": "Sainath Reddy", "url": "https://dataengineerhub.blog/about" },\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" },\n';
  html += '      "datePublished": "' + (comparison.lastUpdated || new Date().toISOString().split('T')[0]) + '",\n';
  html += '      "dateModified": "' + (comparison.lastUpdated || new Date().toISOString().split('T')[0]) + '"\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
  html += '    <\/script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// CHEATSHEET HUB PAGE HTML - Listing page for all cheat sheets (/cheatsheets)
// ============================================================================

function generateCheatsheetHubPageHTML(allCheatsheets, categories, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;
  var productionJsFile = jsFile;
  var productionCssFile = cssFile;
  var buildTimestamp = new Date().toISOString();
  var totalSheets = allCheatsheets.length;

  // Group by category
  var categoryMap = {};
  for (var i = 0; i < allCheatsheets.length; i++) {
    var cs = allCheatsheets[i];
    var cat = cs.category || 'general';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(cs);
  }

  // Build category lookup for display names
  var catNameLookup = {};
  for (var ci = 0; ci < categories.length; ci++) {
    catNameLookup[categories[ci].id] = categories[ci].name;
  }

  var categoryKeys = Object.keys(categoryMap).sort();

  // Build category nav + sections
  var categoryNavHTML = '';
  var categorySectionsHTML = '';

  for (var c = 0; c < categoryKeys.length; c++) {
    var catKey = categoryKeys[c];
    var catSheets = categoryMap[catKey];
    var catDisplayName = catNameLookup[catKey] || catKey.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });

    categoryNavHTML += '<a href="#cs-' + escapeHtml(catKey) + '" style="display: inline-block; padding: 6px 14px; background: rgba(96,165,250,0.12); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.9rem; border: 1px solid rgba(96,165,250,0.25); margin: 4px;">' + escapeHtml(catDisplayName) + ' (' + catSheets.length + ')</a>';

    categorySectionsHTML += '<div id="cs-' + escapeHtml(catKey) + '" style="margin-top: 2.5rem;">';
    categorySectionsHTML += '<h2 style="color: #93c5fd; font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(147,197,253,0.2);">' + escapeHtml(catDisplayName) + '</h2>';
    categorySectionsHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">';

    for (var s = 0; s < catSheets.length; s++) {
      var sheet = catSheets[s];
      var shortDesc = sheet.shortDescription || '';
      if (shortDesc.length > 160) shortDesc = shortDesc.substring(0, 157) + '...';

      categorySectionsHTML += '<a href="https://dataengineerhub.blog/cheatsheets/' + escapeHtml(sheet.slug) + '" style="display: block; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); text-decoration: none;">';
      categorySectionsHTML += '<h3 style="color: #f1f5f9; font-size: 1.1rem; margin-bottom: 0.4rem; font-weight: 600;">' + escapeHtml(sheet.title) + '</h3>';
      categorySectionsHTML += '<p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin: 0 0 0.5rem 0;">' + escapeHtml(shortDesc) + '</p>';
      categorySectionsHTML += '<span style="display: inline-block; padding: 2px 8px; background: rgba(96,165,250,0.15); color: #93c5fd; border-radius: 4px; font-size: 0.75rem;">' + escapeHtml(sheet.difficulty || 'Intermediate') + '</span>';
      categorySectionsHTML += '</a>';
    }

    categorySectionsHTML += '</div></div>';
  }

  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>Data Engineering Cheat Sheets | ' + totalSheets + ' Quick References | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + totalSheets + ' data engineering cheat sheets covering Snowflake SQL, dbt, Airflow, window functions, interview prep, and best practices. Quick reference guides for data engineers." />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog/cheatsheets" />\n';
  html += '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog/cheatsheets" />\n';
  html += '    <meta property="og:title" content="Data Engineering Cheat Sheets | ' + totalSheets + ' Quick References" />\n';
  html += '    <meta property="og:description" content="' + totalSheets + ' cheat sheets across ' + categoryKeys.length + ' categories for data engineers." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="Data Engineering Cheat Sheets | ' + totalSheets + ' Quick References" />\n';
  html += '    <meta name="twitter:description" content="' + totalSheets + ' cheat sheets across ' + categoryKeys.length + ' categories for data engineers." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
  html += (productionCssFile ? '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n' : '');
  html += '\n';
  html += '    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 1000px; margin: 40px auto 0; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
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
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.8rem; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">\u203A</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>Cheat Sheets</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>Data Engineering Cheat Sheets</h1>\n';
  html += '        <p>\n';
  html += '          Quick-reference guides for data engineers — <strong>' + totalSheets + ' cheat sheets</strong> across ' + categoryKeys.length + ' categories.\n';
  html += '          From Snowflake SQL syntax to dbt commands, Airflow DAG patterns, window functions, interview questions,\n';
  html += '          and production best practices — bookmark these for fast lookups during development and interview prep.\n';
  html += '        </p>\n\n';
  html += '        <h2>Browse by Category</h2>\n';
  html += '        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 1rem;">\n';
  html += '          ' + categoryNavHTML + '\n';
  html += '        </div>\n\n';
  html += categorySectionsHTML + '\n';
  html += '        <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(96,165,250,0.1); border-radius: 12px; border: 1px solid rgba(96,165,250,0.2);">\n';
  html += '          <h2 style="font-size: 1.3rem; margin-top: 0;">Explore More</h2>\n';
  html += '          <p style="margin-bottom: 0.5rem;">Looking for in-depth explanations? Check our <a href="https://dataengineerhub.blog/glossary">Data Engineering Glossary</a> for ' + totalSheets + '+ key terms.</p>\n';
  html += '          <p style="margin-bottom: 0;">For hands-on tutorials and guides, browse the <a href="https://dataengineerhub.blog/articles">full article library</a>.</p>\n';
  html += '        </div>\n\n';
  html += '        <a href="https://dataengineerhub.blog" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">\u2190 Back to Home</a>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';

  // CollectionPage schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "CollectionPage",\n';
  html += '      "name": "Data Engineering Cheat Sheets",\n';
  html += '      "description": "' + totalSheets + ' quick-reference cheat sheets for data engineers",\n';
  html += '      "url": "https://dataengineerhub.blog/cheatsheets",\n';
  html += '      "numberOfItems": ' + totalSheets + ',\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" }\n';
  html += '    }\n';
  html += '    </script>\n\n';

  // ItemList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "ItemList",\n';
  html += '      "name": "Data Engineering Cheat Sheets",\n';
  html += '      "numberOfItems": ' + totalSheets + ',\n';
  html += '      "itemListElement": [\n';
  for (var ili = 0; ili < allCheatsheets.length; ili++) {
    html += '        { "@type": "ListItem", "position": ' + (ili + 1) + ', "name": "' + escapeJsonLd(allCheatsheets[ili].title) + '", "url": "https://dataengineerhub.blog/cheatsheets/' + allCheatsheets[ili].slug + '" }';
    html += (ili < allCheatsheets.length - 1 ? ',\n' : '\n');
  }
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n\n';

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Cheat Sheets" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n\n';

  html += (productionJsFile ? '    <script type="module" crossorigin src="' + productionJsFile + '"></script>\n' : '');
  html += '\n';
  html += '    <script>\n';
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
  html += '    </script>\n';
  html += '  </body>\n';
  html += '</html>';

  return html;
}

// ============================================================================
// CHEATSHEET PAGE HTML GENERATION - Individual cheat sheet pages for pSEO
// ============================================================================

function generateCheatsheetPageHTML(sheet, allCheatsheets, bundleFiles) {
  var jsFile = bundleFiles.jsFile;
  var cssFile = bundleFiles.cssFile;
  var productionJsFile = jsFile;
  var productionCssFile = cssFile;
  var buildTimestamp = new Date().toISOString();
  var pagePath = '/cheatsheets/' + sheet.slug;

  // Count total content words for thin-content check
  var totalWords = 0;
  var sections = sheet.sections || [];
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    if (sec.type === 'table' && sec.items) {
      for (var ri = 0; ri < sec.items.length; ri++) {
        totalWords += sec.items[ri].join(' ').split(/\s+/).length;
      }
    } else if (sec.type === 'code' && sec.code) {
      totalWords += sec.code.split(/\s+/).length;
    } else if (sec.type === 'tips' && sec.items) {
      for (var ti = 0; ti < sec.items.length; ti++) {
        totalWords += sec.items[ti].split(/\s+/).length;
      }
    } else if (sec.type === 'qna' && sec.items) {
      for (var qi = 0; qi < sec.items.length; qi++) {
        totalWords += (sec.items[qi].question + ' ' + sec.items[qi].answer).split(/\s+/).length;
      }
    }
  }
  if (sheet.faqs) {
    for (var fi = 0; fi < sheet.faqs.length; fi++) {
      totalWords += (sheet.faqs[fi].question + ' ' + sheet.faqs[fi].answer).split(/\s+/).length;
    }
  }

  var robotsDirective = totalWords < 250
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  var descMeta = escapeHtml(sheet.shortDescription || ('Comprehensive ' + sheet.title + ' for data engineers.'));

  // Build section content HTML
  var sectionsHTML = '';
  for (var sIdx = 0; sIdx < sections.length; sIdx++) {
    var section = sections[sIdx];
    sectionsHTML += '<div style="margin-top: 2rem;">';
    sectionsHTML += '<h2 style="color: #93c5fd; font-size: 1.4rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(147,197,253,0.2);">' + escapeHtml(section.title) + '</h2>';

    if (section.type === 'table' && section.columns && section.items) {
      sectionsHTML += '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">';
      sectionsHTML += '<thead><tr>';
      for (var col = 0; col < section.columns.length; col++) {
        sectionsHTML += '<th style="text-align: left; padding: 10px 12px; background: rgba(96,165,250,0.15); color: #93c5fd; border-bottom: 2px solid rgba(96,165,250,0.3); font-weight: 600;">' + escapeHtml(section.columns[col]) + '</th>';
      }
      sectionsHTML += '</tr></thead><tbody>';
      for (var row = 0; row < section.items.length; row++) {
        var bgColor = row % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)';
        sectionsHTML += '<tr style="background: ' + bgColor + ';">';
        for (var cell = 0; cell < section.items[row].length; cell++) {
          sectionsHTML += '<td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e2e8f0;">';
          // Wrap code-like content in <code>
          var cellText = section.items[row][cell];
          if (cell > 0 && /[A-Z_]{2,}|SELECT|CREATE|INSERT|FROM|WHERE|ALTER|DROP|dbt |--/.test(cellText)) {
            sectionsHTML += '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; color: #a5f3fc;">' + escapeHtml(cellText) + '</code>';
          } else {
            sectionsHTML += escapeHtml(cellText);
          }
          sectionsHTML += '</td>';
        }
        sectionsHTML += '</tr>';
      }
      sectionsHTML += '</tbody></table></div>';

    } else if (section.type === 'code' && section.code) {
      sectionsHTML += '<pre style="background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.08);"><code style="color: #a5f3fc; font-size: 0.85rem; line-height: 1.6;">' + escapeHtml(section.code) + '</code></pre>';

    } else if (section.type === 'tips' && section.items) {
      sectionsHTML += '<ul style="list-style: none; padding: 0;">';
      for (var tip = 0; tip < section.items.length; tip++) {
        sectionsHTML += '<li style="padding: 8px 0 8px 24px; position: relative; color: #e2e8f0; line-height: 1.6; border-bottom: 1px solid rgba(255,255,255,0.04);"><span style="position: absolute; left: 0; color: #34d399;">&#10003;</span>' + escapeHtml(section.items[tip]) + '</li>';
      }
      sectionsHTML += '</ul>';

    } else if (section.type === 'qna' && section.items) {
      for (var qn = 0; qn < section.items.length; qn++) {
        var item = section.items[qn];
        sectionsHTML += '<div style="margin-bottom: 1.2rem; padding: 1rem; background: rgba(0,0,0,0.15); border-radius: 8px; border-left: 3px solid #60a5fa;">';
        sectionsHTML += '<p style="color: #93c5fd; font-weight: 600; margin-bottom: 0.5rem;">Q: ' + escapeHtml(item.question) + '</p>';
        sectionsHTML += '<p style="color: #e2e8f0; margin: 0; line-height: 1.7;">' + escapeHtml(item.answer) + '</p>';
        sectionsHTML += '</div>';
      }
    }

    sectionsHTML += '</div>';
  }

  // Build FAQ HTML
  var faqHTML = '';
  if (sheet.faqs && sheet.faqs.length > 0) {
    faqHTML += '<div style="margin-top: 2.5rem;">';
    faqHTML += '<h2 style="color: #93c5fd; font-size: 1.4rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(147,197,253,0.2);">Frequently Asked Questions</h2>';
    for (var fq = 0; fq < sheet.faqs.length; fq++) {
      faqHTML += '<div style="margin-bottom: 1.2rem; padding: 1rem; background: rgba(0,0,0,0.15); border-radius: 8px;">';
      faqHTML += '<h3 style="color: #f1f5f9; font-size: 1.05rem; margin-bottom: 0.5rem;">' + escapeHtml(sheet.faqs[fq].question) + '</h3>';
      faqHTML += '<p style="color: #cbd5e1; margin: 0; line-height: 1.7;">' + escapeHtml(sheet.faqs[fq].answer) + '</p>';
      faqHTML += '</div>';
    }
    faqHTML += '</div>';
  }

  // Related cheat sheets
  var relatedHTML = '';
  if (sheet.relatedSlugs && sheet.relatedSlugs.length > 0) {
    relatedHTML += '<div style="margin-top: 2rem;">';
    relatedHTML += '<h2 style="color: #93c5fd; font-size: 1.3rem; margin-bottom: 1rem;">Related Cheat Sheets</h2>';
    relatedHTML += '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
    for (var rs = 0; rs < sheet.relatedSlugs.length; rs++) {
      var relSlug = sheet.relatedSlugs[rs];
      // Find title from allCheatsheets
      var relTitle = relSlug;
      for (var rl = 0; rl < allCheatsheets.length; rl++) {
        if (allCheatsheets[rl].slug === relSlug) { relTitle = allCheatsheets[rl].title; break; }
      }
      relatedHTML += '<a href="https://dataengineerhub.blog/cheatsheets/' + escapeHtml(relSlug) + '" style="display: inline-block; padding: 6px 14px; background: rgba(96,165,250,0.12); color: #93c5fd; text-decoration: none; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(96,165,250,0.25);">' + escapeHtml(relTitle) + '</a>';
    }
    relatedHTML += '</div></div>';
  }

  // Build full HTML
  var html = '<!doctype html>\n<html lang="en">\n  <head>\n';
  html += '    <meta charset="UTF-8" />\n';
  html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
  html += '    <title>' + escapeHtml(sheet.title) + ' | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + descMeta + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="' + robotsDirective + '" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="article" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + escapeHtml(sheet.title) + '" />\n';
  html += '    <meta property="og:description" content="' + descMeta + '" />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + escapeHtml(sheet.title) + '" />\n';
  html += '    <meta name="twitter:description" content="' + descMeta + '" />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  html += '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUBLISHER_ID + '"\n';
  html += '            crossorigin="anonymous"></script>\n';
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
  html += (productionCssFile ? '    <link rel="stylesheet" crossorigin href="' + productionCssFile + '">\n' : '');
  html += '\n';
  html += '    <style>\n';
  html += '      * { margin: 0; padding: 0; box-sizing: border-box; }\n';
  html += '      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%); color: #f8fafc; line-height: 1.6; min-height: 100vh; }\n';
  html += '      .seo-content { max-width: 900px; margin: 40px auto 0; padding: 40px 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }\n';
  html += '      .seo-content h1 { font-size: 2.2rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }\n';
  html += '      .seo-content h2 { color: #93c5fd; font-size: 1.4rem; margin-top: 2rem; margin-bottom: 0.8rem; }\n';
  html += '      .seo-content p { color: #e2e8f0; font-size: 1.05rem; margin-bottom: 1rem; line-height: 1.8; }\n';
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
  html += '      @media (max-width: 768px) { .seo-content { padding: 20px 15px; margin-top: 20px; } .seo-content h1 { font-size: 1.6rem; } table { font-size: 0.8rem; } }\n';
  html += '    </style>\n';
  html += '  </head>\n';
  html += '  <body>\n';
  html += '    <div id="root">\n';
  html += '      <nav aria-label="Breadcrumb" class="breadcrumb-nav">\n';
  html += '        <ol class="breadcrumb-list">\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog" class="breadcrumb-link">Home</a></li>\n';
  html += '          <li class="breadcrumb-separator">\u203A</li>\n';
  html += '          <li class="breadcrumb-item"><a href="https://dataengineerhub.blog/cheatsheets" class="breadcrumb-link">Cheat Sheets</a></li>\n';
  html += '          <li class="breadcrumb-separator">\u203A</li>\n';
  html += '          <li class="breadcrumb-item breadcrumb-current" aria-current="page"><span>' + escapeHtml(sheet.title) + '</span></li>\n';
  html += '        </ol>\n';
  html += '      </nav>\n\n';
  html += '      <div class="seo-content">\n';
  html += '        <h1>' + escapeHtml(sheet.title) + '</h1>\n';
  html += '        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">';
  html += '<span style="background: rgba(96,165,250,0.15); color: #93c5fd; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">' + escapeHtml(sheet.difficulty || 'Intermediate') + '</span>';
  html += 'Last updated: ' + escapeHtml(sheet.lastUpdated || '') + ' &bull; ' + sections.length + ' sections';
  html += '</p>\n';
  html += '        <p>' + escapeHtml(sheet.shortDescription || '') + '</p>\n\n';
  html += sectionsHTML + '\n';
  html += faqHTML + '\n';
  html += relatedHTML + '\n';
  html += '        <a href="https://dataengineerhub.blog/cheatsheets" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">\u2190 All Cheat Sheets</a>\n';
  html += '      </div>\n';
  html += '    </div>\n\n';

  // Article schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "Article",\n';
  html += '      "headline": "' + escapeJsonLd(sheet.title) + '",\n';
  html += '      "description": "' + escapeJsonLd(sheet.shortDescription || '') + '",\n';
  html += '      "url": "https://dataengineerhub.blog' + pagePath + '",\n';
  html += '      "datePublished": "' + (sheet.lastUpdated || new Date().toISOString().split('T')[0]) + '",\n';
  html += '      "dateModified": "' + (sheet.lastUpdated || new Date().toISOString().split('T')[0]) + '",\n';
  html += '      "author": { "@type": "Person", "name": "Sainath Reddy", "url": "https://dataengineerhub.blog/about" },\n';
  html += '      "publisher": { "@type": "Organization", "name": "DataEngineer Hub", "url": "https://dataengineerhub.blog" }\n';
  html += '    }\n';
  html += '    </script>\n\n';

  // FAQ schema if FAQs exist
  if (sheet.faqs && sheet.faqs.length > 0) {
    html += '    <script type="application/ld+json">\n';
    html += '    {\n';
    html += '      "@context": "https://schema.org",\n';
    html += '      "@type": "FAQPage",\n';
    html += '      "mainEntity": [\n';
    for (var fsi = 0; fsi < sheet.faqs.length; fsi++) {
      html += '        { "@type": "Question", "name": "' + escapeJsonLd(sheet.faqs[fsi].question) + '", "acceptedAnswer": { "@type": "Answer", "text": "' + escapeJsonLd(sheet.faqs[fsi].answer) + '" } }';
      html += (fsi < sheet.faqs.length - 1 ? ',\n' : '\n');
    }
    html += '      ]\n';
    html += '    }\n';
    html += '    </script>\n\n';
  }

  // BreadcrumbList schema
  html += '    <script type="application/ld+json">\n';
  html += '    {\n';
  html += '      "@context": "https://schema.org",\n';
  html += '      "@type": "BreadcrumbList",\n';
  html += '      "itemListElement": [\n';
  html += '        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dataengineerhub.blog" },\n';
  html += '        { "@type": "ListItem", "position": 2, "name": "Cheat Sheets", "item": "https://dataengineerhub.blog/cheatsheets" },\n';
  html += '        { "@type": "ListItem", "position": 3, "name": "' + escapeJsonLd(sheet.title) + '" }\n';
  html += '      ]\n';
  html += '    }\n';
  html += '    </script>\n\n';

  html += (productionJsFile ? '    <script type="module" crossorigin src="' + productionJsFile + '"></script>\n' : '');
  html += '\n';
  html += '    <script>\n';
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
  html += '    </script>\n';
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

  const productionJsFile = jsFile;
  const productionCssFile = cssFile;

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
  html += '    <title>' + escapeHtml(tag.name) + ' - Tagged Articles | DataEngineer Hub</title>\n';
  html += '    <meta name="description" content="' + escapeHtml(descriptionMeta) + '" />\n';
  html += '    <link rel="canonical" href="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta name="robots" content="noindex, follow" />\n\n';
  html += '    <!-- Open Graph -->\n';
  html += '    <meta property="og:type" content="website" />\n';
  html += '    <meta property="og:url" content="https://dataengineerhub.blog' + pagePath + '" />\n';
  html += '    <meta property="og:title" content="' + escapeHtml(tag.name) + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta property="og:description" content="Browse ' + tagArticles.length + ' ' + escapeHtml(tag.name) + ' tutorials and guides for data engineers." />\n';
  html += '    <meta property="og:site_name" content="DataEngineer Hub" />\n';
  html += '    <meta property="og:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta property="og:image:width" content="1200" />\n';
  html += '    <meta property="og:image:height" content="630" />\n';
  html += '    <meta property="og:locale" content="en_US" />\n';
  html += '    <!-- Twitter Card -->\n';
  html += '    <meta name="twitter:card" content="summary_large_image" />\n';
  html += '    <meta name="twitter:site" content="@sainath29" />\n';
  html += '    <meta name="twitter:creator" content="@sainath29" />\n';
  html += '    <meta name="twitter:title" content="' + escapeHtml(tag.name) + ' Articles | DataEngineer Hub" />\n';
  html += '    <meta name="twitter:description" content="Browse ' + tagArticles.length + ' ' + escapeHtml(tag.name) + ' tutorials and guides for data engineers." />\n';
  html += '    <meta name="twitter:image" content="https://dataengineerhub.blog/og-image.jpg" />\n';
  html += '    <meta name="twitter:image:alt" content="' + escapeHtml(tag.name) + ' Articles | DataEngineer Hub" />\n\n';
  html += '    <!-- Build: ' + buildTimestamp + ' -->\n\n';
  html += '    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">\n';
  html += '    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>\n';
  html += '    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">\n';
  html += '    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">\n';
  html += CONSENT_MODE_V2_HTML + '\n';
  // AdSense loader intentionally omitted: tag pages are noindex.
  html += '    <link rel="icon" type="image/png" href="/logo.png" />\n';
  html += '    <link rel="apple-touch-icon" href="/logo.png">\n';
  html += '    <link rel="manifest" href="/manifest.json">\n';
  html += '    <meta name="theme-color" content="#1e293b">\n';
  html += '    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />\n';
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
  html += '      window.addEventListener("react-mounted", function() {\n';
  html += '        document.body.classList.add("react-loaded");\n';
  html += '      }, { once: true });\n';
  html += '      setTimeout(function() {\n';
  html += '        if (!document.body.classList.contains("react-loaded")) {\n';
  html += '          console.log("React not detected - showing static content");\n';
  html += '        }\n';
  html += '      }, 5000);\n';
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

  const productionJsFile = jsFile;
  const productionCssFile = cssFile;

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
    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">
${CONSENT_MODE_V2_HTML}
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}"
            crossorigin="anonymous"></script>
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="apple-touch-icon" href="/logo.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1e293b">
    <link rel="alternate" type="application/rss+xml" title="DataEngineer Hub RSS Feed" href="https://dataengineerhub.blog/rss.xml" />
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

      /* Site Nav */
      .site-nav {
        background: rgba(15, 23, 42, 0.95);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 12px 20px;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .site-nav-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      .site-nav-brand {
        color: #60a5fa;
        font-weight: 700;
        font-size: 1.1rem;
        text-decoration: none;
      }
      .site-nav-links {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .site-nav-links a {
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
      }
      .site-nav-links a:hover { color: #60a5fa; }

      /* Site Footer */
      .site-footer {
        max-width: 900px;
        margin: 3rem auto 0;
        padding: 2rem 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
        text-align: center;
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .site-footer-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px 20px;
        list-style: none;
        padding: 0;
        margin: 0 0 0.75rem;
      }
      .site-footer-links a {
        color: #60a5fa;
        text-decoration: none;
      }
      .site-footer-links a:hover { text-decoration: underline; }

      body.react-loaded .site-nav,
      body.react-loaded .site-footer { display: none; }

      @media (max-width: 768px) {
        .site-nav-links { gap: 4px 12px; }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <nav class="site-nav" aria-label="Site navigation">
        <div class="site-nav-inner">
          <a href="https://dataengineerhub.blog" class="site-nav-brand">DataEngineer Hub</a>
          <ul class="site-nav-links">
            <li><a href="https://dataengineerhub.blog/articles">Articles</a></li>
            <li><a href="https://dataengineerhub.blog/glossary">Glossary</a></li>
            <li><a href="https://dataengineerhub.blog/compare">Compare</a></li>
            <li><a href="https://dataengineerhub.blog/cheatsheets">Cheatsheets</a></li>
            <li><a href="https://dataengineerhub.blog/tools">Tools</a></li>
            <li><a href="https://dataengineerhub.blog/about">About</a></li>
            <li><a href="https://dataengineerhub.blog/contact">Contact</a></li>
          </ul>
        </div>
      </nav>

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

      <footer class="site-footer">
        <ul class="site-footer-links">
          <li><a href="https://dataengineerhub.blog/privacy-policy">Privacy Policy</a></li>
          <li><a href="https://dataengineerhub.blog/terms-of-service">Terms</a></li>
          <li><a href="https://dataengineerhub.blog/disclaimer">Disclaimer</a></li>
          <li><a href="https://dataengineerhub.blog/about">About</a></li>
          <li><a href="https://dataengineerhub.blog/contact">Contact</a></li>
          <li><a href="https://dataengineerhub.blog/rss.xml">RSS</a></li>
        </ul>
        <p>&copy; ${new Date().getFullYear()} DataEngineer Hub. All rights reserved.</p>
      </footer>
    </div>

    <!-- Structured Data - WebPage -->
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

    <!-- Structured Data - BreadcrumbList -->
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
          "name": "${titleJsonLd}",
          "item": "https://dataengineerhub.blog${pagePath}"
        }
      ]
    }
    </script>

    <!-- Structured Data - Organization -->
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
        "https://twitter.com/sainath29",
        "https://www.linkedin.com/in/sainathreddypogaku/",
        "https://github.com/sainath-reddiee/dataengineer"
      ]
    }
    </script>

    ${pagePath.startsWith('/tools/') ? `<!-- Structured Data - SoftwareApplication (Free tool) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${titleJsonLd}",
      "description": "${descriptionJsonLd}",
      "url": "https://dataengineerhub.blog${pagePath}",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Any (Web-based)",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "publisher": {
        "@type": "Organization",
        "name": "DataEngineer Hub",
        "url": "https://dataengineerhub.blog"
      }
    }
    </script>` : ''}

    ${(pagePath.startsWith('/cheatsheets/category/') || pagePath === '/interview-prep' || pagePath === '/cheatsheets' || pagePath === '/tools') ? `<!-- Structured Data - CollectionPage -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${titleJsonLd}",
      "description": "${descriptionJsonLd}",
      "url": "https://dataengineerhub.blog${pagePath}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "DataEngineer Hub",
        "url": "https://dataengineerhub.blog"
      },
      "publisher": {
        "@type": "Organization",
        "name": "DataEngineer Hub",
        "url": "https://dataengineerhub.blog"
      }
    }
    </script>` : ''}

    ${pagePath === '/about' ? `<!-- Structured Data - Person (About page E-E-A-T) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://dataengineerhub.blog/#author",
      "name": "Sainath Reddy",
      "url": "https://dataengineerhub.blog/about",
      "jobTitle": "Data Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "Anblicks"
      },
      "sameAs": [
        "https://www.linkedin.com/in/sainathreddypogaku/",
        "https://twitter.com/sainath29",
        "https://github.com/sainath-reddiee/dataengineer"
      ],
      "knowsAbout": ["Data Engineering", "Snowflake", "AWS", "Azure", "Databricks", "Apache Airflow", "dbt", "ETL/ELT Pipelines", "Data Warehousing", "Cloud Architecture"],
      "description": "Data Engineer with 4+ years of experience specializing in building scalable data pipelines and cloud-native data solutions."
    }
    </script>` : ''}

    ${productionJsFile ? `<script type="module" crossorigin src="${productionJsFile}"></script>` : ''}

    <script>
      window.addEventListener('react-mounted', function() {
        document.body.classList.add('react-loaded');
      }, { once: true });
      setTimeout(function() {
        if (!document.body.classList.contains('react-loaded')) {
          console.log('React not detected - showing static content');
        }
      }, 5000);
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

  // 🔥 Pre-fetch categories for articleSection mapping
  let catIdToName = {};
  try {
    const cats = await fetchFromWP('/categories', 'id,name');
    cats.forEach(c => { catIdToName[c.id] = c.name; });
    console.log(`   Loaded ${cats.length} category names for articleSection mapping`);
  } catch (err) {
    console.warn('   ⚠️  Could not fetch categories for articleSection:', err.message);
  }

  // 🏷️ Pre-fetch tags for article:tag OG meta
  let tagIdToName = {};
  try {
    const tagsData = await fetchFromWP('/tags', 'id,name');
    tagsData.forEach(t => { tagIdToName[t.id] = t.name; });
    console.log(`   Loaded ${tagsData.length} tag names for article:tag mapping`);
  } catch (err) {
    console.warn('   ⚠️  Could not fetch tags for article:tag:', err.message);
  }

  try {
    // 🔥 CRITICAL: Fetch with _embed to get full content + categories + tags for mapping
    const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content,date,modified,categories,tags,jetpack_featured_media_url');
    console.log(`   Found ${posts.length} posts from API`);

    // Build article list for "More Articles" section and listing pages
    allArticleSummaries = posts.map(p => ({
      slug: p.slug,
      title: stripHTML(p.title.rendered),
      excerpt: truncateAtSentence(stripHTML(p.excerpt.rendered), 200),
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
      const rawDescription = truncateAtSentence(stripHTML(post.excerpt.rendered), 160) ||
        'Read this article on DataEngineer Hub';

      // Apply SEO overrides for CTR-optimized titles and descriptions
      const seoOverride = getSEOOverride(post.slug);

      // For articles without SEO overrides, generate CTR-optimized description
      let optimizedDescription = rawDescription;
      if (!seoOverride?.description) {
        try {
          const tagNamesList = (post.tags || []).map(id => tagIdToName[id]).filter(Boolean);
          optimizedDescription = optimizeMetaDescription({
            title: seoOverride?.title || rawTitle,
            excerpt: rawDescription,
            category: (post.categories || []).map(id => catIdToName[id]).filter(Boolean)[0] || '',
            tags: tagNamesList,
            readTime: Math.max(1, Math.ceil((stripHTML(post.content.rendered || '').split(/\s+/).filter(w => w.length > 0).length) / 250))
          }) || rawDescription;
        } catch (e) {
          // Fallback silently to raw description if optimizer fails
          optimizedDescription = rawDescription;
        }
      }

      // 🔥 KEY FIX: Use FULL content, not just 500 chars!
      const fullContent = post.content.rendered; // Complete HTML content

      const pageData = {
        title: seoOverride?.title || rawTitle,
        description: seoOverride?.description || optimizedDescription,
        path: pagePath,
        fullContent: fullContent, // 🔥 FULL content for crawlers
        slug: post.slug,
        date: post.date,
        modified: post.modified,
        featuredImage: post.jetpack_featured_media_url || null,
        categoryNames: (post.categories || []).map(id => catIdToName[id]).filter(Boolean),
        tagNames: (post.tags || []).map(id => tagIdToName[id]).filter(Boolean)
      };

      const contentHash = hashContent(pageData);
      const cachedPage = cache.pages[pagePath];
      const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

      if (needsRebuild) {
        try {
          // 🔥 Use the FULL content generator with image processing
          // Relevance-rank related articles by shared categories/tags
          const postCats = new Set(post.categories || []);
          const postTags = new Set(post.tags || []);
          const relatedArticles = allArticleSummaries
            .filter(a => a.slug !== post.slug)
            .map(a => {
              let score = 0;
              (a.categories || []).forEach(c => { if (postCats.has(c)) score += 3; });
              (a.tags || []).forEach(t => { if (postTags.has(t)) score += 1; });
              return { ...a, _score: score };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 10);
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
            const html = generateGlossaryPageHTML(term, allGlossaryTerms, bundleFiles, allArticleSummaries);
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

    // ============================================================================
    // CHEATSHEET PAGES - Pre-rendered from cheatsheetData.js (pSEO)
    // ============================================================================

    console.log('\n📋 Processing cheatsheet pages from cheatsheetData.js…');
    try {
      // cheatsheetData.js uses ES module exports, so we read & extract via regex
      const cheatsheetDataPath = path.join(__dirname, '..', 'src', 'data', 'cheatsheetData.js');
      const cheatsheetRaw = fs.readFileSync(cheatsheetDataPath, 'utf-8');

      // Extract CHEATSHEET_CATEGORIES array
      var cheatsheetCategories = [];
      var catMatch = cheatsheetRaw.match(/export\s+const\s+CHEATSHEET_CATEGORIES\s*=\s*(\[[\s\S]*?\]);/);
      if (catMatch) {
        try { cheatsheetCategories = eval(catMatch[1]); } catch(e) { console.warn('   ⚠️ Could not parse CHEATSHEET_CATEGORIES'); }
      }

      // Extract cheatsheets array
      var allCheatsheets = [];
      var csMatch = cheatsheetRaw.match(/export\s+const\s+cheatsheets\s*=\s*(\[[\s\S]*?\]);\s*(?=\nexport|\s*$)/m);
      if (csMatch) {
        try { allCheatsheets = eval(csMatch[1]); } catch(e) {
          // Fallback: try Function constructor to avoid strict mode issues
          try {
            var fn = new Function('return ' + csMatch[1]);
            allCheatsheets = fn();
          } catch(e2) {
            console.error('   ❌ Could not parse cheatsheets array:', e2.message);
          }
        }
      }

      console.log(`   Found ${allCheatsheets.length} cheatsheets across ${cheatsheetCategories.length} categories`);

      // Generate individual cheatsheet pages
      for (const sheet of allCheatsheets) {
        const pagePath = '/cheatsheets/' + sheet.slug;
        currentPages.add(pagePath);

        const contentHash = hashContent({ slug: sheet.slug, updated: sheet.lastUpdated, title: sheet.title, sections: (sheet.sections || []).length });
        const cachedPage = cache.pages[pagePath];
        const needsRebuild = force || !cachedPage || cachedPage.hash !== contentHash;

        if (needsRebuild) {
          try {
            const html = generateCheatsheetPageHTML(sheet, allCheatsheets, bundleFiles);
            const outputPath = path.join(distDir, pagePath, 'index.html');
            const dir = path.dirname(outputPath);

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(outputPath, html);

            const fileStats = fs.statSync(outputPath);
            const fileSizeKB = (fileStats.size / 1024).toFixed(2);
            console.log(`   ${cachedPage ? '↻' : '✓'} ${sheet.title} (${fileSizeKB} KB)`);

            if (cachedPage) { stats.updated++; } else { stats.new++; }
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
          type: 'cheatsheet'
        };
      }

      console.log(`   ✅ Cheatsheet pages complete: ${allCheatsheets.length} sheets processed`);

      // Generate cheatsheet hub page (/cheatsheets)
      const csHubPath = '/cheatsheets';
      currentPages.add(csHubPath);
      const csHubHash = hashContent({ type: 'cheatsheet-hub', count: allCheatsheets.length, slugs: allCheatsheets.map(c => c.slug).join(',') });
      const cachedCsHub = cache.pages[csHubPath];
      const needsCsHub = force || !cachedCsHub || cachedCsHub.hash !== csHubHash;

      if (needsCsHub) {
        try {
          const hubHtml = generateCheatsheetHubPageHTML(allCheatsheets, cheatsheetCategories, bundleFiles);
          const hubOutputPath = path.join(distDir, 'cheatsheets', 'index.html');
          const hubDir = path.dirname(hubOutputPath);
          if (!fs.existsSync(hubDir)) {
            fs.mkdirSync(hubDir, { recursive: true });
          }
          fs.writeFileSync(hubOutputPath, hubHtml);
          const hubStats = fs.statSync(hubOutputPath);
          console.log(`   ✓ Cheatsheet hub page (${(hubStats.size / 1024).toFixed(2)} KB)`);
          if (cachedCsHub) { stats.updated++; } else { stats.new++; }
        } catch (err) {
          console.error(`   ❌ Error generating cheatsheet hub page:`, err.message);
          stats.errors++;
        }
      } else {
        stats.unchanged++;
      }
      newCache.pages[csHubPath] = {
        hash: csHubHash,
        built: needsCsHub ? new Date().toISOString() : cachedCsHub.built,
        type: 'cheatsheet-hub'
      };

    } catch (error) {
      console.error('❌ Error processing cheatsheet pages:', error.message);
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
