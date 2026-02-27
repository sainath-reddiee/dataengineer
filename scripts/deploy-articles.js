// Deploy Articles to R2 - Upload pre-rendered static HTML to Cloudflare R2
//
// This fixes the canonical issue: Hostinger returns the generic SPA shell
// for all article URLs, but with this script, the Cloudflare Worker
// will serve unique static HTML from R2 with correct canonical, title,
// meta description, and full article content.
//
// Prerequisites:
//   Run "npm run build" first to generate static article HTML in dist/articles/
//
// Usage:
//   node scripts/deploy-articles.js              (Upload changed articles)
//   node scripts/deploy-articles.js --force       (Upload all articles)
//   node scripts/deploy-articles.js --dry-run     (Preview without uploading)
//
// Environment Variables (same as deploy-pseo.js):
//   R2_ENDPOINT          - Cloudflare R2 endpoint URL
//   R2_ACCESS_KEY_ID     - R2 access key
//   R2_SECRET_ACCESS_KEY - R2 secret key
//   R2_BUCKET_NAME       - R2 bucket name (default: dataengineerhub-pseo)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ARTICLES_DIR = path.join(DIST_DIR, 'articles');
const CACHE_FILE = path.join(__dirname, '..', '.articles-cache.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_ALL = process.argv.includes('--force');

// =============================================================================
// CACHE MANAGEMENT (same pattern as deploy-pseo.js)
// =============================================================================

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        }
    } catch { /* ignore */ }
    return {};
}

function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// =============================================================================
// R2 CLIENT (reuses same .env vars as deploy-pseo.js)
// =============================================================================

function initR2Client() {
    if (DRY_RUN) {
        console.log('🔄 Dry run mode - R2 client not initialized\n');
        return null;
    }

    let endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    const bucketName = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';
    if (endpoint && endpoint.endsWith(`/${bucketName}`)) {
        endpoint = endpoint.replace(`/${bucketName}`, '');
    }

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        console.error('❌ Missing R2 credentials!');
        console.error('   Required: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
        console.error('   Set these in .env or run with --dry-run');
        process.exit(1);
    }

    return new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
}

// =============================================================================
// MAIN
// =============================================================================

async function deployArticles() {
    console.log('📄 Deploy Articles to R2');
    console.log('========================\n');

    // Check dist/articles exists
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error('❌ dist/articles/ not found. Run "npm run build" first.');
        process.exit(1);
    }

    // Get all article slugs
    const slugs = fs.readdirSync(ARTICLES_DIR)
        .filter(f => fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory());

    console.log(`📦 Found ${slugs.length} article pages\n`);

    if (slugs.length === 0) {
        console.log('⚠️  No articles found. Nothing to deploy.');
        return;
    }

    // Init R2
    const r2Client = initR2Client();
    const cache = loadCache();
    const newCache = {};
    const bucketName = process.env.R2_BUCKET_NAME || 'dataengineerhub-pseo';

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const slug of slugs) {
        const htmlPath = path.join(ARTICLES_DIR, slug, 'index.html');

        if (!fs.existsSync(htmlPath)) {
            console.log(`   ⚠️  Skipping ${slug} (no index.html)`);
            continue;
        }

        const content = fs.readFileSync(htmlPath, 'utf-8');
        const hash = hashContent(content);
        const key = `articles/${slug}/index.html`;

        newCache[key] = hash;

        // Skip if unchanged
        if (!FORCE_ALL && cache[key] === hash) {
            skipped++;
            continue;
        }

        if (DRY_RUN) {
            console.log(`   📄 [DRY RUN] Would upload: ${key} (${(content.length / 1024).toFixed(1)} KB)`);
            uploaded++;
            continue;
        }

        try {
            await r2Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: content,
                ContentType: 'text/html',
                CacheControl: 'public, max-age=86400',
            }));
            console.log(`   ✅ ${slug} (${(content.length / 1024).toFixed(1)} KB)`);
            uploaded++;
        } catch (error) {
            console.error(`   ❌ Failed: ${slug} - ${error.message}`);
            failed++;
        }
    }

    // Save cache (only if we actually uploaded)
    if (!DRY_RUN) {
        saveCache(newCache);
    }

    // Upload redirects.json to R2 (for dynamic 301 redirects in Cloudflare Worker)
    const redirectsPath = path.join(__dirname, '..', 'src', 'data', 'redirects.json');
    if (fs.existsSync(redirectsPath)) {
        const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
        const redirectCount = Object.keys(JSON.parse(redirectsContent)).length;

        if (DRY_RUN) {
            console.log(`\n🔀 [DRY RUN] Would upload _redirects.json (${redirectCount} redirects)`);
        } else {
            try {
                await r2Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: '_redirects.json',
                    Body: redirectsContent,
                    ContentType: 'application/json',
                    CacheControl: 'public, max-age=300',
                }));
                console.log(`\n🔀 Uploaded _redirects.json (${redirectCount} redirects)`);
            } catch (error) {
                console.error(`\n❌ Failed to upload _redirects.json: ${error.message}`);
            }
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ⏭️  Skipped (unchanged): ${skipped}`);
    if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${slugs.length}\n`);

    if (!DRY_RUN && uploaded > 0) {
        console.log('🎉 Articles deployed! The Cloudflare Worker will now serve these');
        console.log('   with unique canonical tags, fixing the GSC canonical issue.\n');
    }
}

deployArticles().catch(error => {
    console.error('❌ Deploy failed:', error);
    process.exit(1);
});
