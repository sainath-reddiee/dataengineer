import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildEmailDigest, buildLinkedInPost, selectRecentPosts } from '../src/utils/weeklyDigest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const now = Date.now();
const posts = [
  {
    title: 'We cut a Snowflake bill by 40%',
    slug: 'snowflake-bill-cut',
    excerpt: 'Warehouse auto-suspend was off for 11 days.',
    date: new Date(now - 2 * 86400000).toISOString(),
  },
  {
    title: 'Old tutorial from last month',
    slug: 'old-tutorial',
    date: new Date(now - 30 * 86400000).toISOString(),
  },
];

const recent = selectRecentPosts(posts, 7, 6);
assert(recent.length === 1, `expected 1 recent post, got ${recent.length}`);
assert(recent[0].slug === 'snowflake-bill-cut', 'weekly window should drop older posts');

const empty = selectRecentPosts([], 7, 6);
assert(empty.length === 0, 'empty input should stay empty');

const email = buildEmailDigest(recent);
assert(email.includes('Weekly Data Digest'), 'email draft needs a title');
assert(email.includes('snowflake-bill-cut'), 'email draft must link the new article');
assert(email.includes('Unsubscribe'), 'email draft must mention unsubscribe');

const archiveEmail = buildEmailDigest([]);
assert(archiveEmail.includes('/articles'), 'empty week should point at the archive');

const linkedIn = buildLinkedInPost(recent);
assert(linkedIn.includes('snowflake-bill-cut'), 'LinkedIn draft must include article URLs');
assert(linkedIn.includes('/newsletter'), 'LinkedIn draft should invite inbox signup');
assert(linkedIn.includes('#dataengineering'), 'LinkedIn draft should include DE hashtags');

const api = read('src/services/wordpressApi.js');
assert(api.includes("/newsletter/subscribe"), 'frontend must POST to WordPress subscribe');
assert(!/api\.brevo\.com/.test(api), 'browser must not call Brevo');
assert(!/api\.buttondown\.com/.test(api), 'browser must not call Buttondown');
assert(!/VITE_BREVO_API_KEY/.test(api), 'Brevo keys must not be read in the browser');

const php = read('functions.php');
assert(php.includes('dehub_newsletter_table'), 'WordPress must create the subscriber table');
assert(php.includes('dehub_forward_newsletter_subscriber'), 'WordPress may forward to an ESP');
assert(php.includes('DEHUB_BUTTONDOWN_API_KEY'), 'ESP keys belong in wp-config constants');
assert(php.includes('Already subscribed') || php.includes('already'), 'duplicates must not 500');

const app = read('src/App.jsx');
assert(app.includes('weekly-digest'), 'admin route /admin/weekly-digest must exist');

const nav = read('src/components/admin/AdminLayout.jsx');
assert(nav.includes('/admin/weekly-digest'), 'admin nav must link Weekly Digest');

const envExample = read('.env.example');
assert(!/VITE_BREVO_API_KEY=your-brevo-api-key/.test(envExample), '.env.example must not recommend a public Brevo key');
assert(envExample.includes('DEHUB_BUTTONDOWN_API_KEY') || envExample.includes('wp-config'), '.env.example should point ESP keys at wp-config');

console.log('✅ Weekly digest drafts stay on recent articles');
console.log('✅ Signup goes to WordPress, not a public ESP key');
console.log('✅ Admin weekly-digest route is wired');
