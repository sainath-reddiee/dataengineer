import { analyzeArticleFaqs, extractArticleFaqs, renderArticleFaqHtml } from '../src/utils/articleFaq.js';
import { getNextSeriesArticle, getSeriesArticles } from '../src/utils/articleSeries.js';
import { getFallbackArticles } from '../src/data/fallbackArticles.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const html = `
  <h2>How do I size a Snowflake warehouse?</h2>
  <p>Start with an X-Small warehouse and raise it only after queuing or spill appears in Query History.</p>
  <h2>Warehouse scaling strategy</h2>
  <p>This heading is not a question so it must not become an FAQ item.</p>
  <h3>When should I use multi-cluster warehouses?</h3>
  <p>Use multi-cluster when concurrent users queue on a single cluster during business hours.</p>
`;

const faqs = extractArticleFaqs(html);
assert(faqs.length === 2, `expected 2 FAQ items, got ${faqs.length}`);
assert(faqs[0].question.includes('size a Snowflake warehouse'), 'first FAQ question is wrong');
assert(faqs[0].answer.includes('X-Small'), 'FAQ answer should come from the following paragraph');
assert(
  faqs.every((item) => item.question.endsWith('?')),
  'FAQ items must be real questions'
);
assert(
  !faqs.some((item) => item.question.includes('Warehouse scaling')),
  'noun-phrase How/section titles must not become FAQ items'
);

const implied = extractArticleFaqs(`
  <h2>What the residential product is actually sold for</h2>
  <p>You pay for successful residential requests, not for the proxy remaining idle between jobs.</p>
  <h2>How Snowflake stores data</h2>
  <p>This noun-phrase heading should stay a section title, not an FAQ row.</p>
`);
assert(implied.some((item) => item.question.startsWith('What the residential')), 'What-headings without ? still become FAQ');
assert(!implied.some((item) => item.question.includes('Snowflake stores')), 'How + noun phrase must not become FAQ');

const encoded = extractArticleFaqs(`
  <h2>What 2extract actually is — and the one thing it isn&#8217;t</h2>
  <p>2extract does not scrape websites. It doesn&#8217;t parse HTML.</p>
  <div><strong>Use case</strong><span>Session strategy</span></div>
  <p>Ignore this card grid when building the answer.</p>
`);
assert(encoded[0].question.includes("isn't"), 'FAQ questions must decode HTML entities');
assert(encoded[0].answer.includes('does not scrape'), 'FAQ answers should keep the first paragraph');
assert(!encoded[0].answer.includes('Session strategy'), 'FAQ answers must not swallow nearby card grids');

const tableOnly = extractArticleFaqs(`
  <h2>What the residential product is actually sold for</h2>
  <p></p>
  <table><thead><tr><th>Use case</th><th>Why residential matters here</th></tr></thead></table>
  <h2>Where this actually breaks</h2>
  <p>Country targeting is a request sent to the gateway, not a legal guarantee that every hop lands in that city.</p>
`);
assert(
  !tableOnly.some((item) => item.question.includes('residential product')),
  'a heading followed only by a table must not become a word-salad FAQ'
);

const sectionHtml = `
  <h2>Frequently Asked Questions</h2>
  <h3>Does cloning copy storage?</h3>
  <p>Zero-copy clone shares micro-partitions until one side writes, so you pay for changed partitions only.</p>
  <h3>When should I clone a production database?</h3>
  <p>Clone before a risky backfill or schema change so you can compare results without a second full copy.</p>
  <h2>After the FAQ</h2>
  <p>Continue with the implementation notes.</p>
`;
const section = analyzeArticleFaqs(sectionHtml);
assert(section.source === 'section', 'explicit FAQ headings should elevate into the accordion');
assert(section.items.length === 2, `expected 2 section FAQs, got ${section.items.length}`);
assert(!section.html.includes('Does cloning copy storage'), 'elevated FAQ section must leave the body');
const faqMarkup = renderArticleFaqHtml(section.items);
assert(faqMarkup.includes('<details'), 'FAQ markup must keep answers in HTML for AdsBot');
assert(faqMarkup.includes('open'), 'the first questions stay open so reviewers see answers');

const single = extractArticleFaqs(`
  <h2>How do I size a Snowflake warehouse?</h2>
  <p>Start with an X-Small warehouse and raise it only after queuing or spill appears in Query History.</p>
  <h2>Warehouse scaling strategy</h2>
  <p>This heading is not a question so it must not become an FAQ item.</p>
`);
assert(single.length === 1, `expected a single FAQ, got ${single.length}`);
const singleMarkup = renderArticleFaqHtml(single);
assert(singleMarkup.includes('article-faq'), 'one FAQ still uses the same accordion card');
assert(singleMarkup.includes('Question this article answers'), 'one FAQ keeps the same style, singular heading');

const series = getSeriesArticles('snowflake-cortex-code-dbt-optimization-guide', 'snowflake', 4);
assert(series.length > 0, 'series should find other Snowflake articles');
assert(
  series.every((item) => item.slug !== 'snowflake-cortex-code-dbt-optimization-guide'),
  'series must not include the current article'
);

const next = getNextSeriesArticle('snowflake-cortex-code-dbt-optimization-guide', 'snowflake');
assert(next?.slug && next?.title, 'next article should have a slug and title');

const suggestions = getFallbackArticles(6);
assert(suggestions.length === 6, 'reading list suggestions should list 6 articles');

console.log('✅ Article FAQ extraction keeps only real questions');
console.log('✅ Series and next-article helpers stay on-topic');
