// scripts/notifySearchEngines.js
// Fixed version with proper IndexNow API submission
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
          resolve({ status: res.statusCode, data, headers: res.headers });
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

// Submit to IndexNow with multiple endpoint support
async function submitToIndexNow(urls, apiKey) {
  const urlObj = new URL(SITE_URL);
  const host = urlObj.hostname; // Just the hostname, no protocol
  
  const payload = {
    host: host, // MUST NOT include https://
    key: apiKey,
    keyLocation: `${SITE_URL}/${apiKey}.txt`,
    urlList: urls.slice(0, 10000) // IndexNow limit
  };

  const jsonPayload = JSON.stringify(payload);
  const contentLength = Buffer.byteLength(jsonPayload);

  console.log('\n📡 Submitting to IndexNow API...');
  console.log(`   Host: ${host}`);
  console.log(`   Key Location: ${payload.keyLocation}`);
  console.log(`   Total URLs: ${urls.length}`);
  console.log(`   Payload size: ${contentLength} bytes`);
  
  console.log('\n📋 Complete URL List Being Submitted:');
  console.log('='.repeat(60));
  urls.forEach((url, index) => {
    console.log(`${(index + 1).toString().padStart(3, ' ')}. ${url}`);
  });
  console.log('='.repeat(60));

  // Try multiple endpoints for redundancy
  const endpoints = [
    { name: 'IndexNow.org API', url: 'https://api.indexnow.org/indexnow' },
    { name: 'Bing', url: 'https://www.bing.com/indexnow' },
    { name: 'Yandex', url: 'https://yandex.com/indexnow' }
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🎯 Trying: ${endpoint.name} (${endpoint.url})`);
      
      const response = await makeRequest(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': contentLength.toString(),
          'User-Agent': 'DataEngineerHub-IndexNow/1.0'
        },
        body: jsonPayload
      });

      console.log(`✅ ${endpoint.name}: Success (HTTP ${response.status})`);
      
      if (response.status === 200) {
        console.log('   ✓ URLs submitted successfully');
      } else if (response.status === 202) {
        console.log('   ✓ Request accepted, will be processed');
      }
      
      // Success! No need to try other endpoints
      console.log('\n🎉 IndexNow submission successful!');
      console.log('   Notified search engines: Bing, Yandex, Seznam.cz, Naver');
      return true;
      
    } catch (error) {
      console.error(`❌ ${endpoint.name} failed: ${error.message}`);
      lastError = error;
      // Continue to next endpoint
    }
  }

  // All endpoints failed
  console.error('\n❌ All IndexNow endpoints failed');
  console.error('Last error:', lastError?.message);
  return false;
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

// Verify IndexNow key is accessible
async function verifyIndexNowKey(apiKey) {
  console.log('\n🔐 Verifying IndexNow key accessibility...');
  
  try {
    // Check key file
    const keyUrl = `${SITE_URL}/indexnow-key.txt`;
    const keyResponse = await makeRequest(keyUrl);
    
    if (keyResponse.data.trim() !== apiKey) {
      console.error('❌ Key file content does not match!');
      return false;
    }
    console.log(`✅ indexnow-key.txt: Accessible`);
    
    // Check verification file
    const verifyUrl = `${SITE_URL}/${apiKey}.txt`;
    const verifyResponse = await makeRequest(verifyUrl);
    
    if (verifyResponse.data.trim() !== apiKey) {
      console.error('❌ Verification file content does not match!');
      return false;
    }
    console.log(`✅ ${apiKey}.txt: Accessible`);
    
    return true;
  } catch (error) {
    console.error('❌ Key verification failed:', error.message);
    console.error('\n💡 Make sure these files are deployed:');
    console.error(`   - ${SITE_URL}/indexnow-key.txt`);
    console.error(`   - ${SITE_URL}/${apiKey}.txt`);
    return false;
  }
}

// Main notification function
async function notifySearchEngines(options = {}) {
  const { force = false, all = false } = options;

  console.log('🚀 Search Engine Notification Tool (IndexNow)');
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
    
    // Verify key is accessible
    const keyValid = await verifyIndexNowKey(apiKey);
    if (!keyValid) {
      console.error('\n❌ IndexNow key verification failed!');
      console.error('Please ensure the key files are deployed and try again.');
      process.exit(1);
    }

    // Load cache
    const cache = loadNotificationCache();
    const timeSinceLastNotification = Date.now() - cache.lastNotified;
    const hoursSinceLastNotification = Math.round(timeSinceLastNotification / 1000 / 60 / 60);

    // *** CORRECTED LOGIC: CHECK FOR NEW URLS FIRST ***
    const newUrls = getNewUrls(allUrls, cache);

    let urlsToNotify = [];

    if (force || all) {
      urlsToNotify = allUrls;
      console.log(`\n📢 Notifying ALL URLs (${force ? 'forced' : 'requested'})`);
    } else if (newUrls.length > 0) {
      urlsToNotify = newUrls;
      console.log(`\n🆕 Found ${newUrls.length} new URLs to notify. Submitting immediately.`);
    } else if (hoursSinceLastNotification < 24 && cache.lastNotified > 0) {
      console.log(`\n⏰ Last notification was ${hoursSinceLastNotification}h ago`);
      console.log('💡 No new URLs found. Skipping notification (wait 24h between notifications).');
      console.log('   Use --force to override');
      return { skipped: true, reason: 'rate_limit' };
    } else {
        console.log('\n✅ No new URLs to notify');
        console.log('   All URLs have been notified previously');
        console.log('   Use --all to resubmit all URLs');
        return { skipped: true, reason: 'no_new_urls' };
    }


    // Submit to IndexNow
    const success = await submitToIndexNow(urlsToNotify, apiKey);

    if (success) {
      // Update cache
      const newCache = {
        lastNotified: Date.now(),
        notifiedUrls: all || force ? allUrls : [...new Set([...cache.notifiedUrls, ...urlsToNotify])],
        lastNotificationCount: urlsToNotify.length,
        lastNotificationDate: new Date().toISOString()
      };
      
      saveNotificationCache(newCache);

      console.log('\n' + '='.repeat(60));
      console.log('✅ NOTIFICATION SUCCESSFUL!');
      console.log('='.repeat(60));
      console.log(`📢 Notified ${urlsToNotify.length} URLs`);
      console.log(`📊 Total URLs in cache: ${newCache.notifiedUrls.length}`);
      console.log('\n💡 Next steps:');
      console.log('   1. URLs will be crawled within hours');
      console.log('   2. Check indexing status in 24-48 hours');
      console.log('   3. Monitor Bing Webmaster Tools for indexing progress');
      console.log('   4. Use URL Inspection tool to check individual pages');
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
