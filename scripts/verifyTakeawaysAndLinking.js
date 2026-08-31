import { analyzeKeyTakeaways, stripKeyTakeawaysSection } from '../src/utils/articleTakeaways.js';
import {
  buildLinkCandidates,
  hasLinkToArticle,
  injectArticleLinks,
} from '../src/lib/pseo/injectArticleLinks.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const sample = `
<p>Intro paragraph about warehouses.</p>
<h2>⚡ TL;DR (Too Long; Didn't Read)</h2>
<ul>
  <li>→ Cut warehouse size before adding clusters.</li>
  <li>→ Suspend idle warehouses after 60 seconds.</li>
  <li>→ Track credit burn per workload.</li>
</ul>
<h2>How sizing works</h2>
<p>Snowflake warehouses scale independently of storage. Use XS first.</p>
<pre><code>SELECT * FROM snowflake.account_usage.query_history;</code></pre>
<p>Teams often overspend on Snowflake when auto-suspend is off.</p>
`;

const analysis = analyzeKeyTakeaways(sample);
assert(analysis.source === 'heading', `expected heading source, got ${analysis.source}`);
assert(analysis.items.length === 3, `expected 3 takeaways, got ${analysis.items.length}`);
assert(analysis.items[0].includes('warehouse'), 'first takeaway should mention warehouse');
assert(!/TL;?DR/i.test(analysis.html), 'stripped HTML must not keep the TL;DR heading');
assert(!analysis.html.includes('Cut warehouse size'), 'stripped HTML must not keep takeaway bullets');
assert(analysis.html.includes('How sizing works'), 'body sections after TL;DR must remain');

const strippedAgain = stripKeyTakeawaysSection(analysis.html);
assert(strippedAgain === analysis.html, 'second strip should be a no-op');

const noTldr = '<h2>Costs</h2><p>First sentence about cost controls that is long enough to keep.</p>';
const synthetic = analyzeKeyTakeaways(noTldr);
assert(synthetic.source === 'synthetic', 'articles without TL;DR may still analyze synthetic takeaways');
assert(synthetic.html.includes('Costs'), 'synthetic path must not strip body headings');
// UI only elevates comment/heading sources — synthetic is analysis-only.

const articles = [
  {
    slug: 'snowflake-cost-guide',
    title: 'Snowflake Cost Guide',
    keywords: ['Snowflake Cortex', 'snowflake', 'Snowflake', 'dbt'],
  },
  {
    slug: 'dbt-tests-guide',
    title: 'dbt Tests Guide',
    keywords: ['dbt tests', 'dbt'],
  },
];

const candidates = buildLinkCandidates(articles, 'current-slug');
assert(
  candidates[0].keyword === 'Snowflake Cortex',
  `longest keyword should rank first, got ${candidates[0].keyword}`
);
assert(
  candidates.filter((c) => c.slug === 'snowflake-cost-guide' && c.keyword.toLowerCase() === 'snowflake').length === 1,
  'case-duplicate keywords on one article should collapse'
);

const alreadyLinked = '<p>See the <a href="/articles/snowflake-cost-guide">cost guide</a> for Snowflake tips.</p>';
assert(hasLinkToArticle(alreadyLinked, 'snowflake-cost-guide'), 'detect existing article links');

const injected = injectArticleLinks(
  '<h2>Snowflake Cortex tips</h2><p>Snowflake Cortex helps. Later we mention dbt tests in pipelines.</p><pre>snowflake</pre>',
  'other-article',
  { articles, maxLinks: 8 }
);

assert(
  (injected.match(/class="internal-link"/g) || []).length <= 2,
  'should inject a small number of links'
);
assert(
  !/<h2[^>]*>[^<]*<a[^>]*class="internal-link"/i.test(injected),
  'must not wrap heading text in auto links'
);
assert(
  !/<pre[^>]*>[^<]*<a[^>]*class="internal-link"/i.test(injected),
  'must not inject links inside <pre>'
);

const skipExisting = injectArticleLinks(
  '<p>Read the <a href="/articles/snowflake-cost-guide">guide</a>. Also try dbt tests tomorrow.</p>',
  'x',
  { articles, maxLinks: 8 }
);
assert(
  !skipExisting.includes('href="/articles/snowflake-cost-guide" class="internal-link"'),
  'must not add a second auto-link to an already-linked slug'
);
assert(
  skipExisting.includes('/articles/dbt-tests-guide'),
  'should still link a different article via a longer phrase'
);

console.log('✅ TL;DR / Key Takeaways are elevated once and stripped from the body');
console.log('✅ Internal linking prefers longer phrases, skips headings/code, and respects existing links');
