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
