/**
 * PSEO Deploy Script - Build & Upload to Cloudflare R2
 * 
 * This script:
 * 1. Reads category JSON files from src/data/pseo/
 * 2. Generates static HTML for each glossary term and comparison
 * 3. Injects internal links for SEO
 * 4. Uploads directly to Cloudflare R2 (bypassing Hostinger)
 * 5. Generates chunked sitemaps (25k URLs per file)
 * 
 * Usage:
 *   npm run pseo:deploy           # Full deploy
 *   npm run pseo:deploy:dry-run   # Generate HTML without uploading
 * 
 * Environment Variables Required:
 *   R2_ENDPOINT          - Cloudflare R2 endpoint URL
 *   R2_ACCESS_KEY_ID     - R2 access key
 *   R2_SECRET_ACCESS_KEY - R2 secret key
 *   R2_BUCKET_NAME       - R2 bucket name (default: dataengineerhub-pseo)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PSEO_DIR = path.join(DATA_DIR, 'pseo');
const CACHE_FILE = path.join(__dirname, '..', '.pseo-cache.json');

// Configuration
const SITE_URL = 'https://dataengineerhub.blog';
const MAX_URLS_PER_SITEMAP = 25000;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_ALL = process.argv.includes('--force');

// AdSense Configuration (set in .env or leave empty to disable ads)
const ADSENSE_PUB_ID = process.env.ADSENSE_PUBLISHER_ID || '';
const ENABLE_ADS = ADSENSE_PUB_ID.length > 0;

// =============================================================================
// INCREMENTAL CACHE MANAGEMENT
// =============================================================================

let contentCache = {};
let cacheStats = { skipped: 0, uploaded: 0 };
let uploadedKeys = new Set(); // Track all keys in current build for orphan cleanup

function loadCache() {
    if (FORCE_ALL) {
        console.log('🔄 Force mode - ignoring cache\n');
        return {};
    }
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            console.log(`📦 Loaded cache with ${Object.keys(cache.hashes || {}).length} entries\n`);
            return cache.hashes || {};
        }
    } catch (e) {
        console.warn('⚠️  Could not load cache:', e.message);
    }
    return {};
}

function saveCache(hashes) {
    try {
        const cache = {
            lastBuild: new Date().toISOString(),
            version: '1.0',
            hashes: hashes
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log('💾 Cache saved successfully');
    } catch (e) {
        console.error('❌ Failed to save cache:', e.message);
    }
}

function hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function shouldUpload(key, content) {
    const newHash = hashContent(content);
    const oldHash = contentCache[key];

    if (oldHash === newHash && !FORCE_ALL) {
        cacheStats.skipped++;
        return { upload: false, hash: newHash };
    }

    cacheStats.uploaded++;
    return { upload: true, hash: newHash };
}

// =============================================================================
// R2 CLIENT SETUP
// =============================================================================

let r2Client = null;

function initR2Client() {
    if (DRY_RUN) {
        console.log('🔄 Dry run mode - R2 client not initialized\n');
        return null;
    }

    let endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    // Strip trailing bucket name if user included it in endpoint
    const bucketInEnv = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';
    if (endpoint && endpoint.endsWith(`/${bucketInEnv}`)) {
        endpoint = endpoint.replace(`/${bucketInEnv}`, '');
    }

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        console.error('❌ Missing R2 credentials!');
        console.error('   Required environment variables:');
        console.error('   - R2_ENDPOINT');
        console.error('   - R2_ACCESS_KEY_ID');
        console.error('   - R2_SECRET_ACCESS_KEY');
        console.error('\n   Set these in .env or run with --dry-run');
        process.exit(1);
    }

    return new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });
}

// Store new hashes for cache update
const newHashes = {};

async function uploadToR2(key, content, contentType = 'text/html', forceUpload = false) {
    // Track this key as part of current build
    uploadedKeys.add(key);

    // Check if content changed (incremental upload)
    if (!forceUpload) {
        const { upload, hash } = shouldUpload(key, content);
        newHashes[key] = hash;

        if (!upload) {
            return { success: true, skipped: true };
        }
    } else {
        newHashes[key] = hashContent(content);
    }

    if (DRY_RUN) {
        console.log(`   📄 [DRY RUN] Would upload: ${key}`);
        return { success: true, skipped: false };
    }

    const bucketName = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';

    try {
        // Use no-cache for sitemaps so they update immediately
        const cacheControl = key.includes('sitemap')
            ? 'public, max-age=0, must-revalidate'
            : 'public, max-age=86400';

        await r2Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
            ContentType: contentType,
            CacheControl: cacheControl,
        }));
        return { success: true, skipped: false };
    } catch (error) {
        console.error(`   ❌ Failed to upload ${key}:`, error.message);
        return { success: false, skipped: false };
    }
}

// =============================================================================
// R2 CLEANUP - Delete orphaned files
// =============================================================================

async function listR2Objects() {
    if (DRY_RUN || !r2Client) return [];

    const bucketName = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';
    const allObjects = [];
    let continuationToken = undefined;

    try {
        do {
            const response = await r2Client.send(new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            }));

            if (response.Contents) {
                allObjects.push(...response.Contents.map(obj => obj.Key));
            }

            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        return allObjects;
    } catch (error) {
        console.error('   ⚠️  Failed to list R2 objects:', error.message);
        return [];
    }
}

async function cleanupOrphanedFiles() {
    if (DRY_RUN) {
        console.log('\n🧹 [DRY RUN] Would check for orphaned files...');
        return { deleted: 0 };
    }

    console.log('\n🧹 Checking for orphaned files in R2...');

    const existingKeys = await listR2Objects();
    const orphanedKeys = existingKeys.filter(key => !uploadedKeys.has(key));

    if (orphanedKeys.length === 0) {
        console.log('   ✅ No orphaned files found');
        return { deleted: 0 };
    }

    console.log(`   Found ${orphanedKeys.length} orphaned files to delete:`);
    orphanedKeys.slice(0, 10).forEach(key => console.log(`      - ${key}`));
    if (orphanedKeys.length > 10) {
        console.log(`      ... and ${orphanedKeys.length - 10} more`);
    }

    const bucketName = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';

    try {
        // Delete in batches of 1000 (S3/R2 limit)
        const batchSize = 1000;
        for (let i = 0; i < orphanedKeys.length; i += batchSize) {
            const batch = orphanedKeys.slice(i, i + batchSize);
            await r2Client.send(new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: batch.map(Key => ({ Key })),
                    Quiet: true,
                },
            }));
        }

        console.log(`   🗑️  Deleted ${orphanedKeys.length} orphaned files`);
        return { deleted: orphanedKeys.length };
    } catch (error) {
        console.error('   ❌ Failed to delete orphaned files:', error.message);
        return { deleted: 0, error: error.message };
    }
}

// =============================================================================
// HTML TEMPLATE (Template Literals approach - simple and fast)
// =============================================================================

function generateGlossaryHTML(term, categories) {
    const category = categories.find(c => c.id === term.category);
    const categoryName = category?.name || term.category;
    const categoryIcon = category?.icon || '📚';

    // Convert markdown-like content to HTML
    const fullDefinitionHTML = term.fullDefinition
        ? term.fullDefinition
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
        : '';

    const keyPointsHTML = term.keyPoints?.length
        ? `<ul class="key-points">${term.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>`
        : '';

    const faqsHTML = term.faqs?.length
        ? term.faqs.map(faq => `
            <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                <h3 itemprop="name">${faq.question}</h3>
                <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">${faq.answer}</p>
                </div>
            </div>
        `).join('')
        : '';

    const relatedTermsHTML = term.relatedTerms?.length
        ? `<div class="related-terms">
            <h3>Related Terms</h3>
            <div class="term-links">
                ${term.relatedTerms.map(slug =>
            `<a href="/glossary/${slug}" class="related-link">${slug}</a>`
        ).join('')}
            </div>
        </div>`
        : '';

    const externalLinksHTML = term.externalLinks?.length
        ? `<div class="external-links">
            <h3>Learn More</h3>
            <ul>
                ${term.externalLinks.map(link =>
            `<li><a href="${link.url}" target="_blank" rel="noopener">${link.title}</a></li>`
        ).join('')}
            </ul>
        </div>`
        : '';

    // Generate FAQ Schema JSON-LD
    const faqSchema = term.faqs?.length
        ? JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": term.faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        })
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${term.term} - Data Engineering Glossary | DataEngineer Hub</title>
    <meta name="description" content="${term.shortDefinition}">
    <link rel="canonical" href="${SITE_URL}/glossary/${term.slug}">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${term.term} - Data Engineering Glossary">
    <meta property="og:description" content="${term.shortDefinition}">
    <meta property="og:url" content="${SITE_URL}/glossary/${term.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="DataEngineer Hub">
    <meta property="og:image" content="${SITE_URL}/og-glossary.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${term.term} - Data Engineering Glossary">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${term.term} - Data Engineering Glossary">
    <meta name="twitter:description" content="${term.shortDefinition}">
    <meta name="twitter:image" content="${SITE_URL}/og-glossary.png">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": "${term.term}",
        "description": "${term.shortDefinition}",
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "Data Engineering Glossary",
            "url": "${SITE_URL}/glossary"
        }
    }
    </script>
    ${faqSchema ? `<script type="application/ld+json">${faqSchema}</script>` : ''}
    
    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}"},
            {"@type": "ListItem", "position": 2, "name": "Glossary", "item": "${SITE_URL}/glossary"},
            {"@type": "ListItem", "position": 3, "name": "${term.term}", "item": "${SITE_URL}/glossary/${term.slug}"}
        ]
    }
    </script>
    
    ${ENABLE_ADS ? `<!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}" crossorigin="anonymous"></script>` : ''}
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
            color: #f8fafc;
            line-height: 1.6;
            min-height: 100vh;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        .breadcrumb { margin-bottom: 20px; font-size: 0.9rem; }
        .breadcrumb a { color: #60a5fa; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .category-badge {
            display: inline-block;
            background: rgba(99, 102, 241, 0.3);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            margin-bottom: 16px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .short-definition {
            font-size: 1.25rem;
            color: #cbd5e1;
            margin-bottom: 32px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border-left: 4px solid #60a5fa;
        }
        .content { margin-bottom: 40px; }
        .content h2 { color: #60a5fa; font-size: 1.5rem; margin: 24px 0 12px; }
        .content h3 { color: #a78bfa; font-size: 1.25rem; margin: 20px 0 10px; }
        .content p { color: #e2e8f0; margin-bottom: 16px; }
        .content code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        .content pre { background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
        .key-points { list-style: none; margin: 20px 0; }
        .key-points li { padding: 8px 0 8px 24px; position: relative; }
        .key-points li::before { content: "✓"; position: absolute; left: 0; color: #10b981; }
        .faq-item { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 16px 0; }
        .faq-item h3 { color: #f8fafc; font-size: 1.1rem; margin-bottom: 10px; }
        .related-terms { margin: 32px 0; }
        .term-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .related-link {
            background: rgba(99, 102, 241, 0.2);
            padding: 6px 14px;
            border-radius: 20px;
            color: #a5b4fc;
            text-decoration: none;
            font-size: 0.9rem;
            transition: background 0.2s;
        }
        .related-link:hover { background: rgba(99, 102, 241, 0.4); }
        .external-links ul { list-style: none; margin-top: 12px; }
        .external-links a { color: #60a5fa; text-decoration: none; }
        .external-links a:hover { text-decoration: underline; }
        .internal-link { color: #f472b6; font-weight: 500; text-decoration: underline; }
        .glossary-link { color: #a78bfa; text-decoration: underline dotted; }
        .back-link { display: inline-block; margin-top: 40px; color: #60a5fa; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
        .last-updated { font-size: 0.85rem; color: #94a3b8; margin-top: 40px; }
        /* Ad Container Styles */
        .ad-container { margin: 24px 0; padding: 16px 0; min-height: 100px; text-align: center; }
        .ad-container ins { display: block; }
        /* Footer Styles */
        .site-footer { 
            margin-top: 60px; 
            padding: 24px 0; 
            border-top: 1px solid rgba(255,255,255,0.1); 
            text-align: center; 
            font-size: 0.85rem; 
            color: #94a3b8; 
        }
        .site-footer a { color: #60a5fa; text-decoration: none; margin: 0 12px; }
        .site-footer a:hover { text-decoration: underline; }
        .footer-links { margin-bottom: 12px; }
        .footer-copy { color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="/">Home</a> → <a href="/glossary">Glossary</a> → ${term.term}
        </nav>
        
        <span class="category-badge">${categoryIcon} ${categoryName}</span>
        
        <h1>${term.term}</h1>
        
        <div class="short-definition">
            ${term.shortDefinition}
        </div>
        
        ${ENABLE_ADS ? `<!-- Ad Slot 1: After Definition -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        <div class="content">
            <p>${fullDefinitionHTML}</p>
        </div>
        
        ${keyPointsHTML ? `<section><h2>Key Points</h2>${keyPointsHTML}</section>` : ''}
        
        ${ENABLE_ADS ? `<!-- Ad Slot 2: After Key Points -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        ${faqsHTML ? `<section itemscope itemtype="https://schema.org/FAQPage"><h2>Frequently Asked Questions</h2>${faqsHTML}</section>` : ''}
        
        ${relatedTermsHTML}
        
        ${externalLinksHTML}
        
        ${ENABLE_ADS ? `<!-- Ad Slot 3: Before Related Links -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        <a href="/glossary" class="back-link">← Back to Glossary</a>
        
        ${term.lastUpdated ? `<p class="last-updated">Last updated: ${term.lastUpdated}</p>` : ''}
        
        <!-- Site Footer -->
        <footer class="site-footer">
            <div class="footer-links">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/privacy-policy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
            </div>
            <div class="footer-copy">© ${new Date().getFullYear()} DataEngineer Hub. All rights reserved.</div>
        </footer>
    </div>
</body>
</html>`;
}

function generateComparisonHTML(comparison) {
    const featuresHTML = comparison.features?.map(f => `
        <tr>
            <td>${f.name}</td>
            <td>${f.toolAValue}</td>
            <td>${f.toolBValue}</td>
            <td class="winner-${f.winner?.toLowerCase().replace(/\s+/g, '-') || 'tie'}">${f.winner || 'Tie'}</td>
        </tr>
    `).join('') || '';

    const prosConsHTML = `
        <div class="pros-cons">
            <div class="pros">
                <h3>✅ ${comparison.toolA} Pros</h3>
                <ul>${comparison.pros?.toolA?.map(p => `<li>${p}</li>`).join('') || ''}</ul>
            </div>
            <div class="cons">
                <h3>⚠️ ${comparison.toolA} Cons</h3>
                <ul>${comparison.cons?.toolA?.map(c => `<li>${c}</li>`).join('') || ''}</ul>
            </div>
            <div class="pros">
                <h3>✅ ${comparison.toolB} Pros</h3>
                <ul>${comparison.pros?.toolB?.map(p => `<li>${p}</li>`).join('') || ''}</ul>
            </div>
            <div class="cons">
                <h3>⚠️ ${comparison.toolB} Cons</h3>
                <ul>${comparison.cons?.toolB?.map(c => `<li>${c}</li>`).join('') || ''}</ul>
            </div>
        </div>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${comparison.toolA} vs ${comparison.toolB} - Comparison | DataEngineer Hub</title>
    <meta name="description" content="${comparison.shortVerdict}">
    <link rel="canonical" href="${SITE_URL}/compare/${comparison.slug}">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${comparison.toolA} vs ${comparison.toolB} - Comparison">
    <meta property="og:description" content="${comparison.shortVerdict}">
    <meta property="og:url" content="${SITE_URL}/compare/${comparison.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="DataEngineer Hub">
    <meta property="og:image" content="${SITE_URL}/og-comparison.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${comparison.toolA} vs ${comparison.toolB}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${comparison.toolA} vs ${comparison.toolB}">
    <meta name="twitter:description" content="${comparison.shortVerdict}">
    <meta name="twitter:image" content="${SITE_URL}/og-comparison.png">
    
    <!-- Article Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${comparison.toolA} vs ${comparison.toolB}: Complete Comparison",
        "description": "${comparison.shortVerdict}",
        "author": {"@type": "Organization", "name": "DataEngineer Hub", "url": "${SITE_URL}"},
        "publisher": {
            "@type": "Organization",
            "name": "DataEngineer Hub",
            "url": "${SITE_URL}",
            "logo": {"@type": "ImageObject", "url": "${SITE_URL}/logo.png"}
        },
        "datePublished": "${new Date().toISOString().split('T')[0]}",
        "dateModified": "${new Date().toISOString().split('T')[0]}",
        "mainEntityOfPage": {"@type": "WebPage", "@id": "${SITE_URL}/compare/${comparison.slug}"}
    }
    </script>
    
    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}"},
            {"@type": "ListItem", "position": 2, "name": "Comparisons", "item": "${SITE_URL}/compare"},
            {"@type": "ListItem", "position": 3, "name": "${comparison.toolA} vs ${comparison.toolB}", "item": "${SITE_URL}/compare/${comparison.slug}"}
        ]
    }
    </script>
    
    ${ENABLE_ADS ? `<!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}" crossorigin="anonymous"></script>` : ''}
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
            color: #f8fafc;
            line-height: 1.6;
            min-height: 100vh;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        .breadcrumb { margin-bottom: 20px; font-size: 0.9rem; }
        .breadcrumb a { color: #60a5fa; text-decoration: none; }
        h1 {
            font-size: 2.2rem;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .verdict-box {
            background: rgba(99, 102, 241, 0.2);
            border: 1px solid rgba(99, 102, 241, 0.4);
            padding: 20px;
            border-radius: 12px;
            margin: 24px 0;
        }
        .verdict-label { font-size: 0.9rem; color: #a5b4fc; margin-bottom: 8px; }
        .winner { font-size: 1.25rem; font-weight: 600; color: #f472b6; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { background: rgba(0,0,0,0.2); color: #a5b4fc; }
        .winner-tie { color: #94a3b8; }
        .winner-${comparison.toolA?.toLowerCase().replace(/\s+/g, '-')} { color: #10b981; }
        .winner-${comparison.toolB?.toLowerCase().replace(/\s+/g, '-')} { color: #f472b6; }
        .pros-cons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
        .pros, .cons { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; }
        .pros h3 { color: #10b981; }
        .cons h3 { color: #f59e0b; }
        .verdict { background: rgba(0,0,0,0.2); padding: 24px; border-radius: 12px; margin: 32px 0; }
        .back-link { display: inline-block; margin-top: 40px; color: #60a5fa; text-decoration: none; }
        /* Ad Container Styles */
        .ad-container { margin: 24px 0; padding: 16px 0; min-height: 100px; text-align: center; }
        .ad-container ins { display: block; }
        /* Footer Styles */
        .site-footer { 
            margin-top: 60px; 
            padding: 24px 0; 
            border-top: 1px solid rgba(255,255,255,0.1); 
            text-align: center; 
            font-size: 0.85rem; 
            color: #94a3b8; 
        }
        .site-footer a { color: #60a5fa; text-decoration: none; margin: 0 12px; }
        .site-footer a:hover { text-decoration: underline; }
        .footer-links { margin-bottom: 12px; }
        .footer-copy { color: #64748b; }
        @media (max-width: 768px) { .pros-cons { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="/">Home</a> → <a href="/compare">Comparisons</a> → ${comparison.toolA} vs ${comparison.toolB}
        </nav>
        
        <h1>${comparison.toolA} vs ${comparison.toolB}</h1>
        
        <div class="verdict-box">
            <div class="verdict-label">Quick Verdict</div>
            <div class="winner">Winner: ${comparison.winner || 'It Depends'}</div>
            <p style="margin-top: 8px; color: #cbd5e1;">${comparison.shortVerdict}</p>
        </div>
        
        ${ENABLE_ADS ? `<!-- Ad Slot 1: After Verdict -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        <section>
            <h2>Introduction</h2>
            <p>${comparison.intro || ''}</p>
        </section>
        
        ${featuresHTML ? `
        <section>
            <h2>Feature Comparison</h2>
            <table>
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>${comparison.toolA}</th>
                        <th>${comparison.toolB}</th>
                        <th>Winner</th>
                    </tr>
                </thead>
                <tbody>${featuresHTML}</tbody>
            </table>
        </section>
        ` : ''}
        
        ${ENABLE_ADS ? `<!-- Ad Slot 2: After Feature Table -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        ${prosConsHTML}
        
        <section class="verdict">
            <h2>Final Verdict</h2>
            <div style="white-space: pre-line; color: #e2e8f0;">${comparison.finalVerdict || ''}</div>
        </section>
        
        ${ENABLE_ADS ? `<!-- Ad Slot 3: After Verdict -->
        <div class="ad-container">
            <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>` : ''}
        
        <a href="/compare" class="back-link">← Back to Comparisons</a>
        
        <!-- Site Footer -->
        <footer class="site-footer">
            <div class="footer-links">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/privacy-policy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
            </div>
            <div class="footer-copy">© ${new Date().getFullYear()} DataEngineer Hub. All rights reserved.</div>
        </footer>
    </div>
</body>
</html>`;
}

// =============================================================================
// SITEMAP GENERATION (25k URL Chunking)
// =============================================================================

function generateSitemapXML(urls) {
    const today = new Date().toISOString().split('T')[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
}

function generateSitemapIndex(sitemapCount) {
    const today = new Date().toISOString().split('T')[0];

    let sitemaps = '';
    for (let i = 1; i <= sitemapCount; i++) {
        sitemaps += `  <sitemap>
    <loc>${SITE_URL}/sitemap-pseo-${i}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}</sitemapindex>`;
}

// =============================================================================
// MAIN BUILD PROCESS
// =============================================================================

async function buildGlossary(categories) {
    console.log('\n📚 Building Glossary Pages...\n');

    const glossaryDir = path.join(PSEO_DIR, 'glossary');
    if (!fs.existsSync(glossaryDir)) {
        console.log('   ⚠️  No glossary data found. Run pseo:migrate first.');
        return { urls: [], uploaded: 0, skipped: 0, failed: 0 };
    }

    const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
    const urls = [];
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const file of files) {
        const terms = JSON.parse(fs.readFileSync(path.join(glossaryDir, file), 'utf-8'));
        console.log(`   Processing ${file} (${terms.length} terms)...`);

        for (const term of terms) {
            const html = generateGlossaryHTML(term, categories);
            const key = `glossary/${term.slug}/index.html`;

            const result = await uploadToR2(key, html);
            if (result.success) {
                urls.push(`${SITE_URL}/glossary/${term.slug}`);
                if (result.skipped) {
                    totalSkipped++;
                } else {
                    totalUploaded++;
                }
            } else {
                totalFailed++;
            }
        }
    }

    console.log(`\n   ✅ Glossary: ${totalUploaded} uploaded, ${totalSkipped} skipped (unchanged), ${totalFailed} failed`);
    return { urls, uploaded: totalUploaded, skipped: totalSkipped, failed: totalFailed };
}

async function buildComparisons() {
    console.log('\n⚖️  Building Comparison Pages...\n');

    const comparisonsDir = path.join(PSEO_DIR, 'comparisons');
    if (!fs.existsSync(comparisonsDir)) {
        console.log('   ⚠️  No comparison data found. Run pseo:migrate first.');
        return { urls: [], uploaded: 0, skipped: 0, failed: 0 };
    }

    const files = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
    const urls = [];
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const file of files) {
        const comparisons = JSON.parse(fs.readFileSync(path.join(comparisonsDir, file), 'utf-8'));
        console.log(`   Processing ${file} (${comparisons.length} comparisons)...`);

        for (const comparison of comparisons) {
            const html = generateComparisonHTML(comparison);
            const key = `compare/${comparison.slug}/index.html`;

            const result = await uploadToR2(key, html);
            if (result.success) {
                urls.push(`${SITE_URL}/compare/${comparison.slug}`);
                if (result.skipped) {
                    totalSkipped++;
                } else {
                    totalUploaded++;
                }
            } else {
                totalFailed++;
            }
        }
    }

    console.log(`\n   ✅ Comparisons: ${totalUploaded} uploaded, ${totalSkipped} skipped (unchanged), ${totalFailed} failed`);
    return { urls, uploaded: totalUploaded, skipped: totalSkipped, failed: totalFailed };
}

async function buildSitemaps(glossaryUrls, comparisonUrls) {
    console.log('\n🗺️  Generating Sitemaps (Chunked)...\n');

    // Combine all pSEO URLs + hub pages
    const allPseoUrls = [
        `${SITE_URL}/glossary`,
        `${SITE_URL}/compare`,
        ...glossaryUrls,
        ...comparisonUrls
    ];

    // Chunk URLs based on MAX_URLS_PER_SITEMAP (25,000)
    const chunks = [];
    for (let i = 0; i < allPseoUrls.length; i += MAX_URLS_PER_SITEMAP) {
        chunks.push(allPseoUrls.slice(i, i + MAX_URLS_PER_SITEMAP));
    }

    console.log(`   Total pSEO URLs: ${allPseoUrls.length}`);
    console.log(`   Sitemaps needed: ${chunks.length}`);

    // Generate and upload each pSEO chunk
    for (let i = 0; i < chunks.length; i++) {
        const sitemapXML = generateSitemapXML(chunks[i]);
        const filename = `sitemap-pseo-${i + 1}.xml`;

        // 1. Upload to R2
        await uploadToR2(filename, sitemapXML, 'application/xml');

        // 2. Save locally for Git/Hostinger deployment
        const chunkPublicPath = path.join(__dirname, '..', 'public', filename);
        fs.writeFileSync(chunkPublicPath, sitemapXML, 'utf-8');

        console.log(`   ✅ ${filename} (${chunks[i].length} URLs) saved locally and to R2`);
    }

    // GENERATE MASTER SITEMAP INDEX
    const today = new Date().toISOString().split('T')[0];
    let sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- WordPress Main Sitemap (Dynamically managed by API) -->
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`;

    // Append pSEO chunks to the index
    for (let i = 0; i < chunks.length; i++) {
        sitemapIndexXML += `
  <sitemap>
    <loc>${SITE_URL}/sitemap-pseo-${i + 1}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`;
    }

    sitemapIndexXML += `\n</sitemapindex>`;

    // 1. Upload Master Index to R2
    await uploadToR2('sitemap-index.xml', sitemapIndexXML, 'application/xml');

    // 2. ALSO save to local public/ directory for Git/Hostinger deployment
    const publicPath = path.join(__dirname, '..', 'public', 'sitemap-index.xml');
    fs.writeFileSync(publicPath, sitemapIndexXML, 'utf-8');

    console.log(`   ✅ sitemap-index.xml (Master) updated in R2 and locally at ${publicPath}`);

    return chunks.length;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           PSEO Deploy Script - Build & Upload to R2          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    if (DRY_RUN) {
        console.log('\n🔄 DRY RUN MODE - No files will be uploaded\n');
    }
    if (FORCE_ALL) {
        console.log('\n🔄 FORCE MODE - All files will be uploaded (ignoring cache)\n');
    }

    try {
        // Initialize R2 client
        r2Client = initR2Client();

        // Load cache for incremental builds
        contentCache = loadCache();

        // Check if migration has been run
        if (!fs.existsSync(PSEO_DIR)) {
            console.error('❌ PSEO data directory not found!');
            console.error('   Run "npm run pseo:migrate" first.');
            process.exit(1);
        }

        // Load categories
        const categoriesPath = path.join(PSEO_DIR, 'categories.json');
        const categories = fs.existsSync(categoriesPath)
            ? JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'))
            : [];

        // Build all pages
        const startTime = Date.now();
        const glossaryResult = await buildGlossary(categories);
        const comparisonResult = await buildComparisons();

        // Build sitemaps (always force upload - they change every build)
        const sitemapCount = await buildSitemaps(glossaryResult.urls, comparisonResult.urls);

        // Calculate totals
        const totalUploaded = glossaryResult.uploaded + comparisonResult.uploaded;
        const totalSkipped = glossaryResult.skipped + comparisonResult.skipped;
        const totalFailed = glossaryResult.failed + comparisonResult.failed;
        const totalPages = glossaryResult.urls.length + comparisonResult.urls.length;

        // Cleanup orphaned files (run after all uploads tracked)
        const cleanupResult = await cleanupOrphanedFiles();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);


        // Summary
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                      DEPLOY SUMMARY                          ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Glossary Pages:       ${String(glossaryResult.urls.length).padStart(6)}                           ║`);
        console.log(`║  Comparison Pages:     ${String(comparisonResult.urls.length).padStart(6)}                           ║`);
        console.log(`║  Total Pages:          ${String(totalPages).padStart(6)}                           ║`);
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  ⬆️  Uploaded (changed): ${String(totalUploaded).padStart(5)}                           ║`);
        console.log(`║  ⏭️  Skipped (same):     ${String(totalSkipped).padStart(5)}                           ║`);
        console.log(`║  🗑️  Deleted (orphan):   ${String(cleanupResult.deleted).padStart(5)}                           ║`);
        console.log(`║  ❌ Failed:             ${String(totalFailed).padStart(5)}                           ║`);
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Sitemap Files:        ${String(sitemapCount).padStart(6)}                           ║`);
        console.log(`║  Duration:             ${String(duration + 's').padStart(8)}                         ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');

        // Save updated cache (after successful build)
        if (!DRY_RUN) {
            saveCache(newHashes);
        }

        if (DRY_RUN) {
            console.log('\n🔄 Dry run complete. No files were uploaded.');
            console.log('   Run without --dry-run to deploy to R2.');
        } else {
            console.log('\n🎉 Deploy complete!');
            if (totalSkipped > 0) {
                console.log(`\n💡 Incremental deploy: ${totalSkipped} unchanged files were skipped.`);
                console.log('   Use --force to re-upload all files.');
            }
            if (cleanupResult.deleted > 0) {
                console.log(`\n🧹 Cleaned up ${cleanupResult.deleted} orphaned files from R2.`);
            }
        }

    } catch (error) {
        console.error('\n❌ Deploy failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
