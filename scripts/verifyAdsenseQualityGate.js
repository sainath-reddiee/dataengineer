// Guardrail for the AdSense review quality gate.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADSENSE_REVIEW_MODE,
  isAdSenseNoindexPath,
  ADSENSE_REVIEW_CHEATSHEETS,
  ADSENSE_REVIEW_TOOLS,
  ADSENSE_GATE_VERSION,
} from '../src/data/adsenseQualityGate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const mustNoindex = [
  '/glossary',
  '/glossary/snowflake',
  '/compare',
  '/compare/airflow-vs-prefect',
  '/tag/snowflake',
  '/tags',
  '/cheatsheets/category/sql',
  '/category/snowflake',
  '/interview-prep',
  '/practice',
  '/practice/snowpro-core',
  '/advertise',
  '/contribute',
  '/contributors',
  '/contributors/sainath',
  '/news',
  '/newsletter',
  '/reading-list',
  '/cheatsheets/snowflake-interview-questions',
  '/cheatsheets/snowflake-cortex-ai-interview',
  '/tools/cron-expression-builder',
  '/tools/sql-formatter',
  '/tools/unix-timestamp-converter',
];

const mustIndex = [
  '/',
  '/articles',
  '/articles/from-etl-pipelines-to-reusable-data-products',
  '/about',
  '/editorial-standards',
  '/contact',
  '/privacy-policy',
  '/refund-policy',
  '/cheatsheets',
  '/tools',
  '/certification',
  ...ADSENSE_REVIEW_CHEATSHEETS.map((slug) => `/cheatsheets/${slug}`),
  ...ADSENSE_REVIEW_TOOLS.map((slug) => `/tools/${slug}`),
];

let failed = 0;

if (!ADSENSE_REVIEW_MODE) {
  console.log('ℹ️  ADSENSE_REVIEW_MODE is off — path checks are skipped.');
  process.exit(0);
}

for (const path of mustNoindex) {
  if (!isAdSenseNoindexPath(path)) {
    console.error(`❌ expected noindex: ${path}`);
    failed += 1;
  }
}

for (const path of mustIndex) {
  if (isAdSenseNoindexPath(path)) {
    console.error(`❌ expected indexable: ${path}`);
    failed += 1;
  }
}

const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const footer = readFileSync(join(root, 'src/components/Footer.jsx'), 'utf8');
const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
const shell = readFileSync(join(root, 'index.html'), 'utf8');
const cta = readFileSync(join(root, 'src/components/InArticleCTA.jsx'), 'utf8');
const meta = readFileSync(join(root, 'src/components/SEO/MetaTags.jsx'), 'utf8');

if (!header.includes('REVIEW_HIDDEN_LEARN') || !header.includes('REVIEW_HIDDEN_MAIN')) {
  console.error('❌ Header must hide glossary/compare/practice during review');
  failed += 1;
}
if (/REVIEW_HIDDEN_MAIN = new Set\(\[\s*['"]\/advertise['"]/.test(header)) {
  console.error('❌ Header must keep Advertise in the main nav during review');
  failed += 1;
}
if (header.includes('=> (}')) {
  console.error('❌ Header.jsx has a broken JSX map callback (=> (})');
  failed += 1;
}
if (!footer.includes('ADSENSE_REVIEW_MODE')) {
  console.error('❌ Footer must keep glossary behind the review flag');
  failed += 1;
}
// Held-out sections are noindexed, not hidden. Ad crawlers must be able to
// see everything humans and Googlebot can, so no public section is disallowed.
for (const section of ['/glossary', '/compare', '/category', '/interview-prep', '/news', '/newsletter', '/reading-list', '/advertise']) {
  if (new RegExp(`^Disallow: ${section}(/|$)`, 'm').test(robots)) {
    console.error(`❌ robots.txt must not hide public section ${section} from any crawler`);
    failed += 1;
  }
}
if (!shell.includes('cheatOk') || !shell.includes('toolOk')) {
  console.error('❌ index.html must noindex non-allowlisted cheat sheets and tools');
  failed += 1;
}

const reviewBlock = cta.slice(cta.indexOf('reviewLinks'), cta.indexOf('const InArticleCTA'));
if (reviewBlock.includes('/interview-prep') || reviewBlock.includes('/glossary') || reviewBlock.includes('/compare')) {
  console.error('❌ In-article review CTAs must not walk reviewers into held-out hubs');
  failed += 1;
}
if (!meta.includes('isAdSenseNoindexPath')) {
  console.error('❌ MetaTags must apply the review-mode path gate');
  failed += 1;
}
const ssg = readFileSync(join(root, 'scripts/generateStaticPagesIncremental.js'), 'utf8');
if (!ssg.includes('ADSENSE_GATE_VERSION') || !Number.isInteger(ADSENSE_GATE_VERSION)) {
  console.error('❌ Incremental SSG must invalidate cache when the AdSense gate version changes');
  failed += 1;
}
if (!ssg.includes('robotsForWordCount(totalWords, pagePath)')) {
  console.error('❌ Cheat-sheet SSG must pass the URL into the robots gate');
  failed += 1;
}
if (!ssg.includes('isAdSenseNoindexPath(pagePath)') || !ssg.includes('categoryArticles.length')) {
  console.error('❌ Category SSG must noindex archives during review');
  failed += 1;
}
if (!ssg.includes('function stampHeldOutRobots')) {
  console.error('❌ Incremental SSG must stamp leftover held-out HTML as noindex');
  failed += 1;
}
if (!ssg.includes('pruneSitemaps')) {
  console.error('❌ Incremental SSG must prune noindex URLs from sitemap.xml');
  failed += 1;
}
// Crawlers and humans must get the same page. Trimming code only in the
// static HTML that bots keep, or branching on user agent at boot, is cloaking.
if (ssg.includes('collapseLongCodeBlocks') || ssg.includes('adsense-code-preview')) {
  console.error('❌ Article SSG must not rewrite code blocks for crawlers');
  failed += 1;
}
const mainEntry = readFileSync(join(root, 'src/main.jsx'), 'utf8');
if (mainEntry.includes('isCrawlerUserAgent')) {
  console.error('❌ main.jsx must render React for every visitor, not branch on crawler user agents');
  failed += 1;
}
if (/googlebot|adsbot-google|mediapartners-google/i.test(shell.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\/[^\n]*/g, ''))) {
  console.error('❌ index.html scripts must not branch on Google crawler user agents');
  failed += 1;
}
if (!ssg.includes('renderArticleFaqHtml') || !ssg.includes('enhanceArticleCodeBlocks')) {
  console.error('❌ Article SSG must render visible FAQ and wrap code blocks');
  failed += 1;
}
if (!footer.includes('Reading List') || !footer.includes('ADSENSE_REVIEW_MODE')) {
  console.error('❌ Footer must keep reading-list behind the review flag');
  failed += 1;
}
if (!footer.includes("{ name: 'Advertise', href: '/advertise' }")) {
  console.error('❌ Footer must keep Advertise visible during review');
  failed += 1;
}
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
if (!htaccess.includes('interview-prep') || !htaccess.includes('snowflake-sql')) {
  console.error('❌ .htaccess X-Robots-Tag must cover the expanded review hold-outs');
  failed += 1;
}
// Hostinger's LiteSpeed ignores SetEnvIfExpr, which silently disabled the
// X-Robots-Tag safety net in production. Only plain SetEnvIf works there.
if (/^\s*SetEnvIfExpr\b/m.test(htaccess)) {
  console.error('❌ .htaccess must use SetEnvIf, not SetEnvIfExpr (unsupported on Hostinger LiteSpeed)');
  failed += 1;
}
const reviewEnvLines = htaccess
  .split('\n')
  .filter((line) => /^\s*SetEnvIf Request_URI .* ADSENSE_REVIEW_PATH\s*$/.test(line));
const cheatsheetLine = reviewEnvLines.find((line) => line.includes('^/cheatsheets/(?!')) || '';
const toolLine = reviewEnvLines.find((line) => line.includes('^/tools/(?!')) || '';
for (const slug of ADSENSE_REVIEW_CHEATSHEETS) {
  if (!cheatsheetLine.includes(slug)) {
    console.error(`❌ .htaccess cheat-sheet allowlist is missing ${slug}`);
    failed += 1;
  }
}
for (const slug of ADSENSE_REVIEW_TOOLS) {
  if (!toolLine.includes(slug)) {
    console.error(`❌ .htaccess tool allowlist is missing ${slug}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n❌ AdSense quality gate failed (${failed} check(s))`);
  process.exit(1);
}

console.log(`✅ AdSense quality gate: ${mustNoindex.length} held-out paths, ${mustIndex.length} indexable paths`);
