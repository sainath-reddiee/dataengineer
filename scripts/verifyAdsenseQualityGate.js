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
  console.error('❌ Header must hide glossary/compare/practice and Advertise during review');
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
if (
  !robots.includes('Disallow: /interview-prep')
  || !robots.includes('Disallow: /category/')
  || !robots.includes('Disallow: /news')
  || !robots.includes('Disallow: /newsletter')
  || !robots.includes('Disallow: /reading-list')
) {
  console.error('❌ AdsBot robots must steer off interview-prep, archives, news, newsletter, and reading-list');
  failed += 1;
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
if (!ssg.includes('collapseLongCodeBlocks')) {
  console.error('❌ Article SSG must collapse long code dumps during AdSense review');
  failed += 1;
}
if (!footer.includes('Reading List') || !footer.includes('ADSENSE_REVIEW_MODE')) {
  console.error('❌ Footer must keep reading-list / advertise behind the review flag');
  failed += 1;
}
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
if (!htaccess.includes('interview-prep') || !htaccess.includes('snowflake-sql')) {
  console.error('❌ .htaccess X-Robots-Tag must cover the expanded review hold-outs');
  failed += 1;
}

if (failed > 0) {
  console.error(`\n❌ AdSense quality gate failed (${failed} check(s))`);
  process.exit(1);
}

console.log(`✅ AdSense quality gate: ${mustNoindex.length} held-out paths, ${mustIndex.length} indexable paths`);
