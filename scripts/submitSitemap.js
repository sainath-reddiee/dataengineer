// scripts/submitSitemap.js
// Modern version - Updated for 2025
// Google & Bing no longer support ping endpoints
import https from 'https';
import http from 'http';

const SITE_URL = 'https://dataengineerhub.blog';
const SITEMAP_URL = `${SITE_URL}/sitemap-index.xml`;

// Only search engines that still support ping
// Only search engines that still support ping
// const SEARCH_ENGINES = [
//   {
//     name: 'IndexNow (Bing, Yandex, etc.)',
//     url: null, // Requires API key
//     manual: 'https://www.bing.com/indexnow'
//   }
// ];

// Make HTTP request with timeout
function makeRequest(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const timer = setTimeout(() => {
      reject(new Error('Request timeout after 15 seconds'));
    }, timeout);

    const req = protocol.get(url, (res) => {
      clearTimeout(timer);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            status: res.statusCode,
            data,
            message: `Success (HTTP ${res.statusCode})`
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Network error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(timeout);
  });
}

// Verify sitemap exists and is valid
async function verifySitemap() {
  console.log('🔍 Verifying sitemap accessibility...');
  console.log(`   URL: ${SITEMAP_URL}`);

  try {
    const response = await makeRequest(SITEMAP_URL, 10000);
    console.log('✅ Sitemap is accessible');
    console.log(`   Status: ${response.status}`);
    console.log(`   Size: ${response.data.length} bytes`);

    // Basic XML validation
    if (!response.data.includes('<?xml') || !response.data.includes('<sitemapindex')) {
      console.warn('⚠️  Warning: Sitemap index might not be valid XML');
      return false;
    }

    // Count sitemaps
    const sitemapCount = (response.data.match(/<sitemap>/g) || []).length;
    console.log(`   Sitemaps found: ${sitemapCount}`);

    if (sitemapCount === 0) {
      console.warn('⚠️  Warning: No sitemaps found in sitemap index');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Sitemap is not accessible');
    console.error('   Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. The sitemap has been generated (run: node scripts/generateSitemap.js)');
    console.log('   2. The sitemap is deployed to your website');
    console.log('   3. The sitemap URL is correct');
    return false;
  }
}

// Check robots.txt
async function checkRobotsTxt() {
  console.log('\n🤖 Checking robots.txt...');
  const robotsUrl = `${SITE_URL}/robots.txt`;

  try {
    const response = await makeRequest(robotsUrl, 10000);

    if (response.data.includes('Sitemap:') && response.data.includes(SITEMAP_URL)) {
      console.log('✅ robots.txt correctly references sitemap');
      return true;
    } else if (response.data.includes('Sitemap:')) {
      console.log('⚠️  robots.txt has a Sitemap entry, but URL might not match');
      console.log('   Expected:', SITEMAP_URL);
      return false;
    } else {
      console.log('❌ robots.txt does NOT reference sitemap');
      console.log('\n💡 Add this line to your robots.txt:');
      console.log(`   Sitemap: ${SITEMAP_URL}`);
      return false;
    }
  } catch (error) {
    console.log('❌ robots.txt not found or not accessible');
    console.log('\n💡 Create a robots.txt file with:');
    console.log('   User-agent: *');
    console.log('   Allow: /');
    console.log(`   Sitemap: ${SITEMAP_URL}`);
    return false;
  }
}

// Main submission function
async function submitSitemap() {
  console.log('🚀 Sitemap Submission Tool (2025)');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📍 Sitemap URL: ${SITEMAP_URL}\n`);

  // Verify sitemap
  const sitemapValid = await verifySitemap();
  if (!sitemapValid) {
    console.log('\n❌ Cannot proceed without valid sitemap');
    process.exit(1);
  }

  // Check robots.txt
  await checkRobotsTxt();

  console.log('\n' + '='.repeat(60));
  console.log('📢 IMPORTANT: Automatic Ping is Deprecated!');
  console.log('='.repeat(60));
  console.log('\n❌ Google and Bing NO LONGER support automatic ping URLs');
  console.log('✅ They now discover sitemaps AUTOMATICALLY from robots.txt\n');

  console.log('📋 What Happens Now:\n');
  console.log('1. Google automatically crawls your robots.txt');
  console.log('2. Finds your sitemap URL');
  console.log('3. Discovers and indexes your content');
  console.log('4. No ping needed!\n');

  console.log('='.repeat(60));
  console.log('✅ REQUIRED ONE-TIME SETUP');
  console.log('='.repeat(60));

  console.log('\n📍 Google Search Console (REQUIRED):');
  console.log('   1. Visit: https://search.google.com/search-console');
  console.log('   2. Add property: dataengineerhub.blog');
  console.log('   3. Verify ownership (DNS, HTML file, or Google Analytics)');
  console.log('   4. Go to Sitemaps → Submit sitemap');
  console.log('   5. Enter: sitemap-index.xml');
  console.log('   6. Click Submit\n');

  console.log('📍 Bing Webmaster Tools (RECOMMENDED):');
  console.log('   1. Visit: https://www.bing.com/webmasters');
  console.log('   2. Add your site');
  console.log('   3. Import from Google Search Console (easiest!)');
  console.log('   4. Or verify manually');
  console.log('   5. Submit sitemap: sitemap-index.xml\n');

  console.log('📍 IndexNow API (OPTIONAL - For Instant Indexing):');
  console.log('   1. Generate API key: https://www.bing.com/indexnow');
  console.log('   2. Add key to your site root');
  console.log('   3. Submit URLs instantly when published\n');

  console.log('='.repeat(60));
  console.log('📊 VERIFICATION CHECKLIST');
  console.log('='.repeat(60));
  console.log('✅ Sitemap exists and is accessible');
  if (await checkRobotsTxt()) {
    console.log('✅ robots.txt references sitemap');
  } else {
    console.log('⚠️  robots.txt needs to be updated');
  }
  console.log('⏳ Submit to Google Search Console (do this once)');
  console.log('⏳ Submit to Bing Webmaster Tools (do this once)\n');

  console.log('='.repeat(60));
  console.log('🎯 ONGOING MAINTENANCE');
  console.log('='.repeat(60));
  console.log('\nAfter initial setup, you DON\'T need to resubmit manually!');
  console.log('\n✅ Automatic Discovery:');
  console.log('   - Google checks robots.txt regularly');
  console.log('   - Discovers sitemap updates automatically');
  console.log('   - Indexes new content within hours/days');
  console.log('\n📝 When to Regenerate Sitemap:');
  console.log('   - After publishing new blog posts');
  console.log('   - After updating existing content');
  console.log('   - Weekly/daily for active blogs');
  console.log('\n💡 Best Practice:');
  console.log('   - Regenerate sitemap during deployment');
  console.log('   - Let search engines discover changes automatically');
  console.log('   - Monitor Google Search Console for indexing status\n');

  console.log('='.repeat(60));
  console.log('✅ ALL DONE!');
  console.log('='.repeat(60));
  console.log('\nYour sitemap is ready. Complete the one-time setup above,');
  console.log('then search engines will handle everything automatically!\n');
}

// Run the tool
submitSitemap().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});