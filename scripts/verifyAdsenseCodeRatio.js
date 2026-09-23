// Guardrail: AdsBot must see editorial prose, not raw SQL / YAML dumps.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countIndexableWords } from '../src/data/adsenseQualityGate.js';
import {
  CODE_PREVIEW_LINES,
  collapseLongCodeBlocks,
  detectCodeLanguage,
  measureTextToCodeRatio,
  stripCodeBlocks,
} from '../src/utils/adsenseCodeRatio.js';
import { enhanceArticleCodeBlocks } from '../src/utils/articleCodeBlocks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const longSql = Array.from({ length: 20 }, (_, i) => `SELECT col_${i} FROM warehouse.fact_orders WHERE dt = '2026-01-01'`).join('\n');
const articleHtml = `
  <h2>Warehouse cost walkthrough</h2>
  <p>Start by clustering the fact table on the date key so pruning actually fires.</p>
  <pre class="language-sql"><code>${longSql}</code></pre>
  <p>After clustering, re-check bytes scanned in QUERY_HISTORY before you resize the warehouse.</p>
`;

const proseOnly = stripCodeBlocks(articleHtml);
assert(!proseOnly.includes('SELECT col_0'), 'stripCodeBlocks must drop SQL tokens');
assert(proseOnly.includes('clustering the fact table'), 'stripCodeBlocks must keep surrounding prose');

const rawRatio = measureTextToCodeRatio(articleHtml);
assert(rawRatio.codeWords > rawRatio.proseWords, 'uncollapsed tutorial should be code-heavy');
const indexable = countIndexableWords(articleHtml);
assert(indexable <= rawRatio.proseWords + 2, 'indexable words must ignore <pre> SQL');
assert(indexable < rawRatio.codeWords, 'prose-only count must stay far below the SQL dump');

const collapsed = collapseLongCodeBlocks(articleHtml, { title: 'Snowflake cost guide' });
assert(collapsed.includes('adsense-code-preview'), 'long SQL must collapse to a preview figure');
assert(collapsed.includes('Warehouse cost walkthrough'), 'caption must reuse the preceding heading');
assert((collapsed.match(/SELECT col_/g) || []).length <= CODE_PREVIEW_LINES, 'preview must keep only the first lines');
assert(!collapsed.includes('SELECT col_19'), 'collapsed preview must omit the tail of the script');
assert(collapsed.includes('written walkthrough'), 'collapsed block must add unique editorial copy');

const shortHtml = '<h2>Tiny example</h2><pre><code>SELECT 1;</code></pre><p>Keep short snippets.</p>';
assert(
  collapseLongCodeBlocks(shortHtml) === shortHtml,
  'short snippets must stay intact'
);

const twoBlocks = `
  <h2>Shared heading</h2>
  <pre><code>${longSql}</code></pre>
  <pre><code>${longSql.replaceAll('fact_orders', 'dim_customer')}</code></pre>
`;
const twoCollapsed = collapseLongCodeBlocks(twoBlocks, { title: 'Shared heading' });
assert(twoCollapsed.includes('(part 2)'), 'two dumps under one heading need distinct captions');

const afterCollapse = measureTextToCodeRatio(collapsed);
assert(
  afterCollapse.proseWords > afterCollapse.codeWords,
  `collapsed page must be prose-led (prose=${afterCollapse.proseWords} code=${afterCollapse.codeWords})`
);

const pyDataclass = `@dataclass
class Targeting:
    country: str | None = None
    state: str | None = None`;
assert(
  detectCodeLanguage('<pre>', pyDataclass) === 'Python',
  'Python dataclasses must not be labeled YAML'
);
assert(detectCodeLanguage('<pre class="language-sql">', 'SELECT 1') === 'SQL', 'language- class must win');

const enhanced = enhanceArticleCodeBlocks(shortHtml);
assert(enhanced.includes('article-code'), 'short snippets get a language bar for readers');
assert(enhanced.includes('article-code-lede') || enhanced.includes('SQL example'), 'code block must keep a prose caption for AdsBot');
assert(enhanced.includes('article-code-gutter'), 'reader blocks must show line numbers');
assert(enhanced.includes('tok-kw'), 'SQL keywords should be highlighted');
const collapsedThenEnhanced = enhanceArticleCodeBlocks(collapsed);
assert(collapsedThenEnhanced.includes('adsense-code-preview'), 'collapsed preview figure must remain');
assert(!collapsedThenEnhanced.includes('article-code'), 'collapsed AdsBot previews must not be wrapped again');

const ssg = readFileSync(join(root, 'scripts/generateStaticPagesIncremental.js'), 'utf8');
assert(ssg.includes('collapseLongCodeBlocks'), 'article SSG must collapse long code during review');
assert(
  ssg.includes('countIndexableWords(') && ssg.includes('crawlerBody'),
  'article robots must use prose-only word counts'
);
assert(ssg.includes('ADSENSE_REVIEW_MODE ? \'\' : \'<li><a href="https://dataengineerhub.blog/advertise"')
  || ssg.includes('advertiseLink'), 'SSG nav must hide Advertise during review');

const gate = readFileSync(join(root, 'src/data/adsenseQualityGate.js'), 'utf8');
assert(gate.includes('<pre\\b') || gate.includes('<pre\\b[\\s\\S]*?<\\/pre>'), 'countIndexableWords must strip <pre> before counting');

console.log('✅ AdSense text-to-code ratio: long SQL collapses, prose-only word counts hold');
