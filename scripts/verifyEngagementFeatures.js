import { analyzeArticleFaqs, extractArticleFaqs, renderArticleFaqHtml } from '../src/utils/articleFaq.js';
import { getNextSeriesArticle, getSeriesArticles } from '../src/utils/articleSeries.js';
import { getFallbackArticles } from '../src/data/fallbackArticles.js';
import { FALLBACK_ARTICLE_COUNT } from '../src/data/siteStats.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const whyTitle = extractArticleFaqs(`
  <h2>Why Burying LLM Calls in PythonOperator Was Always Wrong</h2>
  <p>The old pattern was a black box: Airflow saw start and fail, not tokens or the model response.</p>
  <h2>The Operator Surface: Five Tools, Clear Boundaries</h2>
  <p>Pick the operator that matches the job instead of wrapping every call in PythonOperator.</p>
`);
assert(whyTitle.length === 0, 'Why + noun-phrase titles must stay section headings, not FAQ rows');

const paragraphFaq = analyzeArticleFaqs(`
  <h2>The Gotchas</h2>
  <p>LLMRetryPolicy requires Airflow 3.3.0 specifically.</p>
  <h2>FAQ</h2>
  <p>What is the Apache Airflow common.ai provider?</p>
  <p>It is a first-party Airflow provider that ships LLM-native operators for Airflow 3.0+ with token budgets and approval built in.</p>
  <p>How does LLMRetryPolicy differ from standard Airflow retries?</p>
  <p>Standard retries wait and try again. LLMRetryPolicy classifies the error and returns RETRY, FAIL, or SKIP for the scheduler.</p>
  <p>How do I add human approval to an Airflow LLM task?</p>
  <p>Set require_approval=True on any @task.llm. The task writes XCom, then waits in awaiting_input until a reviewer decides.</p>
  <p>Can I use the common.ai provider with local models?</p>
  <p>Yes. Point a pydanticai connection at Ollama so exception traces never leave your infrastructure during retries.</p>
  <p>When should I use AgentOperator instead of LLMOperator?</p>
  <p>Use AgentOperator for multi-turn tool loops. Use LLMOperator for one-shot classify, summarize, or extract jobs.</p>
  <p>Does the common.ai provider work with Dynamic Task Mapping?</p>
  <p>Yes. @task.llm and @task.agent support .expand() so each item becomes its own named, independently retryable task.</p>
  <p><strong>Related reading:</strong> <a href="/articles/airflow-ollama-pii-tagging">Ollama inside Airflow</a></p>
`);
assert(paragraphFaq.source === 'section', 'FAQ H2 + paragraph Q&A must elevate into the accordion');
assert(paragraphFaq.items.length === 6, `expected 6 paragraph FAQs, got ${paragraphFaq.items.length}`);
assert(
  paragraphFaq.items[0].question.includes('common.ai provider'),
  'first paragraph FAQ should be the common.ai question'
);
assert(
  paragraphFaq.items[1].answer.includes('RETRY, FAIL, or SKIP'),
  'paragraph FAQ answers should come from the following <p>'
);
assert(
  !paragraphFaq.items.some((item) => /related reading/i.test(item.question) || /related reading/i.test(item.answer)),
  'Related reading must not become an FAQ row'
);
assert(
  paragraphFaq.html.includes('Related reading'),
  'Related reading must stay in the article body after FAQ elevation'
);
assert(!paragraphFaq.html.includes('What is the Apache Airflow'), 'elevated paragraph FAQs must leave the body');

const alreadyRendered = analyzeArticleFaqs(`
  <h2>What Time Travel Actually Stores</h2>
  <p>Time Travel keeps the old micro-partitions, not a nightly dump of every row.</p>
  <section class="article-faq" aria-labelledby="article-faq-heading">
    <h2 id="article-faq-heading">Question this article answers</h2>
    <p class="article-faq-kicker">The short answer first.</p>
    <details class="article-faq-item" open>
      <summary>What Time Travel Actually Stores?</summary>
      <p>Time Travel keeps the old micro-partitions, not a nightly dump of every row.</p>
    </details>
  </section>
`);
assert(alreadyRendered.source === 'rendered', 'SSG FAQ markup must be reused, not extracted again');
assert(alreadyRendered.items.length === 1, `expected 1 rendered FAQ, got ${alreadyRendered.items.length}`);
assert(!alreadyRendered.html.includes('article-faq'), 'rendered FAQ must leave the body so React does not paint it twice');
assert(
  !alreadyRendered.html.includes('Question this article answers'),
  'the accordion heading must not remain in the article body'
);

const tagged = extractArticleFaqs(`
  <h2>FAQ</h2>
  <p>How do I add human approval to an Airflow LLM task?</p>
  <p>Set <code>require_approval=True</code> on any <code>@task.llm</code> or <code>LLMOperator</code>. The task writes XCom, then waits in awaiting_input until a reviewer decides.</p>
`);
assert(
  tagged[0].answer.includes('LLMOperator. The task'),
  'closing code tags must not leave a space before the period'
);

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

assert(FALLBACK_ARTICLE_COUNT >= 115, 'homepage fallback must not flash the old 82 count');
const statsHook = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/hooks/useStats.js'), 'utf8');
assert(!statsHook.includes('totalArticles: 82'), 'useStats must not hardcode 82 articles');
assert(statsHook.includes('getPublishedPostCount'), 'stats should read X-WP-Total from a count request');

const contribute = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/pages/ContributePage.jsx'), 'utf8');
assert(contribute.includes('editorial-standards'), 'Contribute must point at editorial standards');
assert(!/do-follow|dofollow/i.test(contribute), 'Contribute must not sell a dofollow backlink');
assert(contribute.includes('We will not publish'), 'Contribute must say what gets rejected');

console.log('✅ Article FAQ extraction keeps only real questions');
console.log('✅ Series and next-article helpers stay on-topic');
console.log('✅ Homepage counts and Contribute guidelines stay current');
