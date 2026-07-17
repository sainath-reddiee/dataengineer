// scripts/testNewsletterE2E.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const BUTTONDOWN_API_KEY = process.env.VITE_BUTTONDOWN_API_KEY;
const WP_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const RSS_FEED_PATH = path.join(projectRoot, 'public', 'rss.xml');

// Helper for beautiful console logs
const log = {
  info: (msg) => console.log(`\x1b[34mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m✘\x1b[0m ${msg}`),
  header: (msg) => console.log(`\n\x1b[1m\x1b[35m=== ${msg} ===\x1b[0m\n`),
};

async function runTests() {
  log.header('STARTING END-TO-END NEWSLETTER FUNCTIONALITY TEST');

  let successCount = 0;
  let totalCount = 6;

  // Task 1: Test WordPress Connectivity
  try {
    log.info('Test 1: Verifying WordPress API Connectivity...');
    const res = await fetch(`${WP_API_URL}/posts?per_page=3&_fields=id,title,slug,date`);
    if (!res.ok) {
      throw new Error(`WordPress API returned status ${res.status}`);
    }
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('WordPress API returned no posts or invalid format');
    }
    log.success(`WordPress API is online. Retrieved ${posts.length} recent posts:`);
    posts.forEach(p => {
      console.log(`  - [${p.date.split('T')[0]}] ${p.title.rendered} (slug: ${p.slug})`);
    });
    successCount++;
  } catch (err) {
    log.error(`WordPress API test failed: ${err.message}`);
  }

  // Task 2: Generate RSS Feed
  try {
    log.info('Test 2: Generating RSS feed via generateRSSFeed.js...');
    // Execute RSS generator script
    execSync('node scripts/generateRSSFeed.js', { cwd: projectRoot, stdio: 'inherit' });
    if (!fs.existsSync(RSS_FEED_PATH)) {
      throw new Error(`RSS feed was not generated at expected path: ${RSS_FEED_PATH}`);
    }
    const stats = fs.statSync(RSS_FEED_PATH);
    log.success(`RSS feed successfully generated at ${RSS_FEED_PATH} (${stats.size} bytes)`);
    successCount++;
  } catch (err) {
    log.error(`RSS feed generation failed: ${err.message}`);
  }

  // Task 3: Validate RSS Feed XML structure
  try {
    log.info('Test 3: Validating RSS feed XML schema and structure...');
    if (!fs.existsSync(RSS_FEED_PATH)) {
      throw new Error('RSS feed file does not exist');
    }
    const xml = fs.readFileSync(RSS_FEED_PATH, 'utf8');
    
    // Check basic XML/RSS indicators
    if (!xml.includes('<?xml') || !xml.includes('<rss') || !xml.includes('<channel>')) {
      throw new Error('Missing standard XML/RSS outer tags');
    }
    
    // Check namespaces
    if (!xml.includes('xmlns:dc=') || !xml.includes('xmlns:atom=')) {
      log.warn('RSS XML is missing standard namespaces dc or atom');
    }

    // Check items count
    const itemMatches = xml.match(/<item>/g);
    const itemCount = itemMatches ? itemMatches.length : 0;
    if (itemCount === 0) {
      throw new Error('No <item> elements found in RSS feed');
    }

    log.success(`RSS feed is valid XML containing ${itemCount} items.`);
    
    // Show top 2 item details
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;
    log.info('Recent RSS Feed Items:');
    while ((match = itemRegex.exec(xml)) !== null && count < 2) {
      const itemContent = match[1];
      const title = itemContent.match(/<title>(.*?)<\/title>/)?.[1] || 'Unknown';
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || 'Unknown';
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Unknown';
      console.log(`  - Title: ${title}`);
      console.log(`    Link:  ${link}`);
      console.log(`    Date:  ${pubDate}`);
      count++;
    }
    successCount++;
  } catch (err) {
    log.error(`RSS XML validation failed: ${err.message}`);
  }

  // Check Buttondown credentials
  if (!BUTTONDOWN_API_KEY) {
    log.error('Buttondown API Key (VITE_BUTTONDOWN_API_KEY) is missing in .env. Skipping remaining tests.');
    log.header(`SUMMARY: Passed ${successCount} / ${totalCount} tests.`);
    process.exit(1);
  }

  // Task 4: Validate Buttondown API Integration (Newsletters Endpoint)
  try {
    log.info('Test 4: Verifying Buttondown API Authentication & Newsletters Config...');
    const res = await fetch('https://api.buttondown.com/v1/newsletters', {
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Buttondown API returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    log.success('Successfully authenticated with Buttondown!');
    
    const newsletters = Array.isArray(data) ? data : (data.results || []);
    if (newsletters.length > 0) {
      log.info(`Newsletter Configuration details:`);
      newsletters.forEach(n => {
        console.log(`  - Name: ${n.name}`);
        console.log(`    Description: ${n.description || 'N/A'}`);
        console.log(`    Subscribers: ${n.subscribers_count ?? 'N/A'}`);
        console.log(`    Username/Slug: ${n.username}`);
      });
    } else {
      log.warn('No newsletters found or returned in response.');
    }
    successCount++;
  } catch (err) {
    log.error(`Buttondown newsletters config test failed: ${err.message}`);
  }

  // Task 5: Simulate Subscriber Lifecycle (Create, Retrieve, Delete)
  let testSubscriberId = null;
  const testEmail = `dataengineerhub.test+sub${Math.floor(Math.random() * 10000)}@gmail.com`;
  try {
    log.info(`Test 5: Simulating subscriber lifecycle for ${testEmail}...`);
    
    // Create subscriber
    log.info(`  Subscribing test email ${testEmail}...`);
    const createRes = await fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Buttondown-Bypass-Firewall': 'true'
      },
      body: JSON.stringify({
        email_address: testEmail,
        notes: 'End-to-End Test Subscriber'
      })
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}));
      throw new Error(`Create subscriber failed: ${JSON.stringify(errorData)}`);
    }

    const createdSub = await createRes.json();
    testSubscriberId = createdSub.id;
    log.success(`  Subscriber successfully created in Buttondown. ID: ${testSubscriberId}`);

    // Retrieve subscriber
    log.info(`  Verifying subscriber retrieval...`);
    const getRes = await fetch(`https://api.buttondown.com/v1/subscribers/${testSubscriberId}`, {
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getRes.ok) {
      throw new Error(`Could not retrieve subscriber with ID ${testSubscriberId}`);
    }

    const retrievedSub = await getRes.json();
    log.success(`  Retrieved subscriber successfully! Email verified as: ${retrievedSub.email_address}`);

    // Delete subscriber (cleanup)
    log.info(`  Cleaning up: deleting test subscriber ${testEmail}...`);
    const deleteRes = await fetch(`https://api.buttondown.com/v1/subscribers/${testSubscriberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`
      }
    });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      throw new Error(`Failed to delete subscriber. Status: ${deleteRes.status}`);
    }
    log.success(`  Successfully deleted test subscriber.`);
    successCount++;
  } catch (err) {
    log.error(`Subscriber lifecycle test failed: ${err.message}`);
    // Attempt cleanup if ID was generated but delete failed
    if (testSubscriberId) {
      log.info(`  Attempting emergency cleanup for subscriber ID ${testSubscriberId}...`);
      await fetch(`https://api.buttondown.com/v1/subscribers/${testSubscriberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${BUTTONDOWN_API_KEY}` }
      }).catch(() => {});
    }
  }

  // Task 6: Validate Buttondown Email Campaigns history
  try {
    log.info('Test 6: Fetching Buttondown Email Campaigns & automation logs...');
    const res = await fetch('https://api.buttondown.com/v1/emails?limit=5', {
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Emails history API returned status ${res.status}`);
    }

    const data = await res.json();
    const emails = Array.isArray(data) ? data : (data.results || []);
    log.success(`Retrieved ${emails.length} recent newsletter/campaign emails:`);
    
    if (emails.length > 0) {
      emails.forEach(e => {
        console.log(`  - [${e.publish_date ? e.publish_date.split('T')[0] : 'Draft'}] Subject: "${e.subject}" (Status: ${e.status})`);
      });
    } else {
      log.info('  No past emails sent or saved in this account.');
    }
    successCount++;
  } catch (err) {
    log.error(`Email campaigns history test failed: ${err.message}`);
  }

  // Summary
  log.header(`SUMMARY: Passed ${successCount} / ${totalCount} tests.`);
  if (successCount === totalCount) {
    log.success('ALL TESTS PASSED SUCCESSFULLY! The newsletter subscription & publishing pipeline is fully functional.');
  } else {
    log.warn('Some tests failed. Please review the errors above.');
  }
}

runTests();
