// scripts/verify-pseo-live.js
import nodeFetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap-pseo-1.xml');

async function verify() {
    console.log('🌐 Starting Live pSEO Verification...\n');

    if (!fs.existsSync(SITEMAP_PATH)) {
        console.error("❌ Sitemap not found at public/sitemap-pseo-1.xml");
        console.log("   Run 'npm run pseo:deploy' first to generate sitemaps.");
        return;
    }

    const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const urls = content.match(/<loc>(.*?)<\/loc>/g)?.map(u => u.replace(/<\/?loc>/g, '')) || [];

    if (urls.length === 0) {
        console.error("❌ No URLs found in sitemap.");
        return;
    }

    console.log(`🔍 Found ${urls.length} URLs in sitemap. Checking status codes...\n`);

    let successes = 0;
    let failures = 0;
    const batchSize = 5; // Check 5 at a time to be polite

    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
            try {
                // Use a short timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await nodeFetch(url, {
                    method: 'GET', // GET instead of HEAD because some workers/CDNs treat them differently
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'DataEngineerHub-Validator/1.0'
                    }
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    console.log(`   ✅ 200 OK  - ${url}`);
                    successes++;
                } else {
                    console.error(`   ❌ ${res.status} ${res.statusText} - ${url}`);
                    failures++;

                    // If we get an R2 specific error, log the key info
                    const r2Key = res.headers.get('x-r2-key');
                    if (r2Key) console.log(`      (R2 Key: ${r2Key})`);
                }
            } catch (e) {
                console.error(`   ❌ ERROR   - ${url} (${e.message})`);
                failures++;
            }
        }));
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 FINAL VERIFICATION SUMMARY`);
    console.log(`   Total URLs Checked: ${urls.length}`);
    console.log(`   ✅ Success (200 OK): ${successes}`);
    console.log(`   ❌ Failures (404/Err): ${failures}`);
    console.log('═'.repeat(50));

    if (failures === 0) {
        console.log('\n🚀 ALL GOOD! You are safe to click "Validate Fix" in Google Search Console.');
    } else {
        console.log('\n⚠️  ACTION REQUIRED: Some pages are still 404ing. Check your R2 bucket.');
    }
}

verify();
