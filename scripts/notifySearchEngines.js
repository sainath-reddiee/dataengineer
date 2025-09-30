// scripts/notifySearchEngines.js
// Notify search engines of sitemap updates using IndexNow
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://dataengineerhub.blog';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const NOTIFICATION_CACHE = path.join(__dirname, '..', '.notification-cache.json');

// Generate or load IndexNow API key
function getOrCreateApiKey() {
  const keyFile = path.join(__dirname, '..', 'public', 'indexnow-key.txt');
  
  if (fs.existsSync(keyFile)) {
    const key = fs.readFileSync(keyFile, 'utf8').trim();
    console.log('✅ Using existing IndexNow key');
    return key;
  }
  
  // Generate new key
  const key = crypto.randomBytes(16).toString('hex');
  
  // Save to public directory
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(keyFile, key, 'utf8');
  console.log('🔑 Generated new IndexNow key');
  console.log(`📝 Key saved to: ${keyFile}`);
  console.log(`🌐 Make sure to deploy: ${SITE_URL}/${key}.txt`);
  
  // Also create the verification file with the key as filename
  const verificationFile = path.join(publicDir, `${key}.txt`);
  fs.writeFileSync(verificationFile, key, 'utf8');
  
  return key;
}

// Load notification cache
function loadNotificationCache() {
  try {
    if (fs.existsSync(NOTIFICATION_CACHE)) {
      return JSON.parse(fs.readFileSync(NOTIFICATION_CACHE, 'utf8'));
    }
  } catch (error) {
    console.log('⚠️  Notification cache corrupted');
  }
  return { lastNotified: 0, notifiedUrls: [] };
}

// Save notification cache
function saveNotificationCache(data) {
  try {
    fs.writeFileSync(NOTIFICATION_CACHE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('⚠️  Failed to save notification cache:', error.message);
  }
}

// Make HTTPS request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Submit to IndexNow
async function submitToIndexNow(urls, apiKey) {
  const host = new URL(SITE_URL).hostname;
  
  const payload = {
    host,
    key: apiKey,
    keyLocation: `${SITE_URL}/${apiKey}.txt`,
    urlList: urls.slice(0, 10000) // IndexNow limit
  };

  const jsonPayload = JSON.stringify(payload);
  const contentLength = Buffer.byteLength(jsonPayload);

  console.log('\n📡 Submitting to IndexNow API via Bing...');
  console.log(`   Host: ${host}`);
  console.log(`   URLs: ${urls.length}`);
  console.log(`   Payload size: ${contentLength} bytes`);


  try {
    const response = await makeRequest('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': contentLength,
        'User-Agent': 'DataEngineerHub-IndexNow/1.0'
      },
      body: jsonPayload
    });

    console.log(`✅ IndexNow: Success (HTTP ${response.status})`);
    console.log('   Notified: Bing (and other IndexNow search engines)');
    return true;
  } catch (error) {
    console.error(`❌ IndexNow failed: ${error.message}`);
    return false;
  }
}

// Verify sitemap is accessible
async function verifySitemap() {
  console.log('🔍 Verifying sitemap...');
  console.log(`   URL: ${SITEMAP_URL}`);

  try {
    const response = await makeRequest(SITEMAP_URL);
    
    if (!response.data.includes('<?xml') || !response.data.includes('<urlset')) {
      throw new Error('Invalid sitemap format');
    }

    const urlCount = (response.data.match(/<url>/g) || []).length;
    console.log(`✅ Sitemap verified: ${urlCount} URLs`);
    
    return { valid: true, urlCount, content: response.data };
  } catch (error) {
    console.error('❌ Sitemap verification failed:', error.message);
    return { valid: false };
  }
}

// Extract URLs from sitemap
function extractUrls(sitemapXml) {
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

// Get new URLs that haven't been notified
function getNewUrls(allUrls, cache) {
  const notifiedSet = new Set(cache.notifiedUrls || []);
  return allUrls.filter(url => !notifiedSet.has(url));
}

// Main notification function
async function notifySearchEngines(options = {}) {
  const { force = false, all = false } = options;

  console.log('🚀 Search Engine Notification Tool');
  console.log('='.repeat(60));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 Site: ${SITE_URL}`);
  console.log(`🔄 Force notification: ${force}`);
  console.log(`📢 Notify all URLs: ${all}\n`);

  try {
    // Verify sitemap
    const sitemapCheck = await verifySitemap();
    if (!sitemapCheck.valid) {
      console.error('❌ Cannot proceed without valid sitemap');
      process.exit(1);
    }

    // Extract URLs
    const allUrls = extractUrls(sitemapCheck.content);
    console.log(`\n📊 Found ${allUrls.length} URLs in sitemap`);

    // Get or create API key
    const apiKey = getOrCreateApiKey();

    // Load cache
    const cache = loadNotificationCache();
    const timeSinceLastNotification = Date.now() - cache.lastNotified;
    const hoursSinceLastNotification = Math.round(timeSinceLastNotification / 1000 / 60 / 60);

    // Determine which URLs to notify
    let urlsToNotify;
    
    if (force || all) {
      urlsToNotify = allUrls;
      console.log(`\n📢 Notifying ALL URLs (${force ? 'forced' : 'requested'})`);
    } else if (hoursSinceLastNotification < 24) {
      console.log(`\n⏰ Last notification was ${hoursSinceLastNotification}h ago`);
      console.log('💡 Skipping notification (wait 24h between notifications)');
      console.log('   Use --force to override');
      return { skipped: true, reason: 'rate_limit' };
    } else {
      urlsToNotify = getNewUrls(allUrls, cache);
      
      if (urlsToNotify.length === 0) {
        console.log('\n✅ No new URLs to notify');
        console.log('   All URLs have been notified previously');
        return { skipped: true, reason: 'no_new_urls' };
      }
      
      console.log(`\n🆕 Found ${urlsToNotify.length} new URLs to notify`);
    }

    // Submit to IndexNow
    const success = await submitToIndexNow(urlsToNotify, apiKey);

    if (success) {
      // Update cache
      const newCache = {
        lastNotified: Date.now(),
        notifiedUrls: all || force ? allUrls : [...new Set([...cache.notifiedUrls, ...urlsToNotify])],
        lastNotificationCount: urlsToNotify.length
      };
      
      saveNotificationCache(newCache);

      console.log('\n' + '='.repeat(60));
      console.log('✅ NOTIFICATION SUCCESSFUL!');
      console.log('='.repeat(60));
      console.log(`📢 Notified ${urlsToNotify.length} URLs`);
      console.log('🔍 Search engines notified:');
      console.log('   - Bing');
      console.log('   - Yandex');
      console.log('   - Seznam.cz');
      console.log('   - Naver');
      console.log('\n💡 Next steps:');
      console.log('   1. URLs will be crawled within hours');
      console.log('   2. Check indexing status in 24-48 hours');
      console.log('   3. Monitor Google Search Console separately');
      console.log('=' .repeat(60) + '\n');

      return {
        success: true,
        notifiedCount: urlsToNotify.length,
        totalUrls: allUrls.length
      };
    } else {
      throw new Error('IndexNow submission failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');
const all = args.includes('--all') || args.includes('-a');

notifySearchEngines({ force, all });