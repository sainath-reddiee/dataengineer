// Live production check after an AdSense-review deploy.
// Usage: node scripts/verifyLiveAdsenseReview.js
import { ADSENSE_REVIEW_CHEATSHEETS, ADSENSE_REVIEW_TOOLS } from '../src/data/adsenseQualityGate.js';

const SITE = 'https://dataengineerhub.blog';

async function fetchText(path) {
  const res = await fetch(`${SITE}${path}`, { redirect: 'follow' });
  const html = await res.text();
  return { status: res.status, html, headers: res.headers };
}

function robots(html) {
  const match = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  return match ? match[1] : '';
}

function isNoindex(value) {
  return /noindex/i.test(value);
}

const mustNoindex = [
  '/glossary/snowflake',
  '/glossary/data-lake',
  '/compare/airflow-vs-prefect',
  '/compare/snowflake-vs-databricks',
  '/practice',
  '/practice/snowpro-core/mock-exam',
  '/roadmaps',
  '/roadmaps/data-engineer',
  '/interview-prep',
  '/category/snowflake',
  '/cheatsheets/snowflake-interview-questions',
  '/tools/cron-expression-builder',
];

const mustIndex = [
  '/',
  '/articles/from-etl-pipelines-to-reusable-data-products',
  '/about',
  '/editorial-standards',
  '/certification',
  '/refund-policy',
  ...ADSENSE_REVIEW_CHEATSHEETS.slice(0, 3).map((slug) => `/cheatsheets/${slug}`),
  ...ADSENSE_REVIEW_TOOLS.slice(0, 3).map((slug) => `/tools/${slug}`),
];

let failed = 0;

const sitemap = await fetchText('/sitemap.xml');
if (sitemap.status !== 200) {
  console.error('❌ sitemap.xml missing');
  failed += 1;
} else {
  const banned = [
    '/glossary/',
    '/compare/',
    '/practice',
    '/roadmaps',
    '/interview-prep',
    '/category/',
    '/advertise',
    '/contribute',
    '/tools/cron',
    '/cheatsheets/snowflake-interview',
  ];
  for (const token of banned) {
    if (sitemap.html.includes(token)) {
      console.error(`❌ sitemap still lists ${token}`);
      failed += 1;
    }
  }
  console.log(`sitemap locs ≈ ${(sitemap.html.match(/<loc>/g) || []).length}`);
}

const robotsTxt = await fetchText('/robots.txt');
if (/^Disallow: \/(glossary|compare|category|interview-prep)(\/|$)/m.test(robotsTxt.html)) {
  console.error('❌ live robots.txt still hides public sections from ad crawlers');
  failed += 1;
}

for (const path of mustNoindex) {
  const page = await fetchText(path);
  const value = robots(page.html);
  const header = page.headers.get('x-robots-tag') || '';
  // The retired Cloudflare Worker served /glossary/* and /compare/* from R2,
  // bypassing Hostinger, the current SSG output, and .htaccess entirely.
  if (page.headers.get('x-r2-key')) {
    console.error(`❌ ${path} is served from Cloudflare R2 (x-r2-key), not Hostinger: remove the Worker route`);
    failed += 1;
  }
  if (!isNoindex(value)) {
    console.error(`❌ ${path} robots="${value || '(missing)'}" (expected noindex)`);
    failed += 1;
  } else if (!isNoindex(header)) {
    console.error(`❌ ${path} meta is noindex but X-Robots-Tag header is missing (.htaccess safety net not firing)`);
    failed += 1;
  } else {
    console.log(`✅ ${path} ${value} (header: ${header})`);
  }
}

for (const path of mustIndex) {
  const page = await fetchText(path);
  const value = robots(page.html);
  if (isNoindex(value)) {
    console.error(`❌ ${path} unexpectedly noindex (${value})`);
    failed += 1;
  } else {
    console.log(`✅ ${path} ${value || 'indexable'}`);
  }
}

if (failed > 0) {
  console.error(`\n❌ Live AdSense review check failed (${failed})`);
  process.exit(1);
}

console.log('\n✅ Live AdSense review surfaces match the hold-out allowlist');
