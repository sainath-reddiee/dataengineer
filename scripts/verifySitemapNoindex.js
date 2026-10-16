// Guardrail: sitemap must not advertise pages SSG marks noindex.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_INDEXABLE_WORD_COUNT } from '../src/data/thinTags.js';
import { countIndexableWords } from '../src/data/adsenseQualityGate.js';
import { countArticleIndexableWords } from '../src/utils/articleIndexableWords.js';
import { filterSitemapXml, pageHasNoindex, pruneSitemaps } from './pruneSitemapNoindex.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

// Sized just under the threshold so only the TL;DR words push the raw HTML
// over it (tracks MIN_INDEXABLE_WORD_COUNT instead of a hard-coded 400).
const filler = 'word '.repeat(MIN_INDEXABLE_WORD_COUNT - 20);
const tldrHtml = `
  <p class="wp-block-paragraph"><strong>TL;DR</strong></p>
  <p>Certifications rarely prove you can ship a pipeline that survives Monday morning.</p>
  <p>Hiring managers still ask for the badge because it is an easy filter.</p>
  <p>Build a public project instead of stacking another exam.</p>
  <h2>The rest of the article</h2>
  <p>${filler}</p>
`;

const rawCount = countIndexableWords(tldrHtml);
const articleCount = countArticleIndexableWords(tldrHtml, { title: 'Certifications' });
assert(rawCount > articleCount, `takeaways strip must lower the count (raw=${rawCount} article=${articleCount})`);
assert(
  articleCount < MIN_INDEXABLE_WORD_COUNT,
  `stripped TL;DR article must fall under ${MIN_INDEXABLE_WORD_COUNT} (got ${articleCount})`
);
assert(
  rawCount >= MIN_INDEXABLE_WORD_COUNT,
  'control: raw WordPress HTML still looks indexable before the SSG pipeline'
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dataengineerhub.blog/articles/thin-after-ssg</loc>
    <lastmod>2026-09-23</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://dataengineerhub.blog/articles/indexable-guide</loc>
    <lastmod>2026-09-23</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

const workspace = mkdtempSync(join(tmpdir(), 'sitemap-noindex-'));
const distDir = join(workspace, 'dist');
mkdirSync(join(distDir, 'articles', 'thin-after-ssg'), { recursive: true });
mkdirSync(join(distDir, 'articles', 'indexable-guide'), { recursive: true });
writeFileSync(
  join(distDir, 'articles', 'thin-after-ssg', 'index.html'),
  '<html><head><meta name="robots" content="noindex, follow" /></head></html>'
);
writeFileSync(
  join(distDir, 'articles', 'indexable-guide', 'index.html'),
  '<html><head><meta name="robots" content="index, follow" /></head></html>'
);

const filtered = filterSitemapXml(sitemap, distDir);
assert(filtered.removed.includes('/articles/thin-after-ssg'), 'noindex article must drop from sitemap');
assert(!filtered.xml.includes('/articles/thin-after-ssg'), 'pruned xml must omit the noindex loc');
assert(filtered.xml.includes('/articles/indexable-guide'), 'indexable loc must stay');
assert(pageHasNoindex('<meta name="robots" content="noindex, follow" />'), 'pageHasNoindex must detect noindex');
assert(!pageHasNoindex('<meta name="robots" content="index, follow" />'), 'index,follow is not noindex');

mkdirSync(join(workspace, 'public'), { recursive: true });
writeFileSync(join(workspace, 'public', 'sitemap.xml'), sitemap);
writeFileSync(join(workspace, 'dist', 'sitemap.xml'), sitemap);
const reports = pruneSitemaps({ rootDir: workspace });
assert(reports.every((report) => report.removed.includes('/articles/thin-after-ssg')), 'both sitemaps must prune');
assert(
  !readFileSync(join(workspace, 'public', 'sitemap.xml'), 'utf8').includes('thin-after-ssg'),
  'public/sitemap.xml must be rewritten'
);
assert(
  !readFileSync(join(workspace, 'dist', 'sitemap.xml'), 'utf8').includes('thin-after-ssg'),
  'dist/sitemap.xml must be rewritten'
);
rmSync(workspace, { recursive: true, force: true });

const sitemapGen = readFileSync(join(root, 'scripts/generateSitemap.js'), 'utf8');
assert(sitemapGen.includes('countArticleIndexableWords'), 'sitemap must use the SSG article word-count pipeline');

const llm = readFileSync(join(root, 'scripts/generateLLMSitemap.js'), 'utf8');
assert(llm.includes('countArticleIndexableWords'), 'LLM sitemap must skip thin-after-SSG articles');

const rss = readFileSync(join(root, 'scripts/generateRSSFeed.js'), 'utf8');
assert(rss.includes('countArticleIndexableWords'), 'RSS must skip thin-after-SSG articles');

const llmsFull = readFileSync(join(root, 'scripts/generateLLMSFull.js'), 'utf8');
assert(llmsFull.includes('countArticleIndexableWords'), 'llms-full must skip thin-after-SSG articles');

const ssg = readFileSync(join(root, 'scripts/generateStaticPagesIncremental.js'), 'utf8');
assert(ssg.includes('pruneSitemaps'), 'SSG must prune noindex URLs after stamping robots');

const workflow = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
assert(workflow.includes('pruneSitemapNoindex.js'), 'deploy must prune sitemap after SSG and before verify');

console.log('✅ Sitemap drops noindex articles and uses the SSG word-count pipeline');
