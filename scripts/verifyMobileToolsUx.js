import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { looksLikeSql, playgroundSqlHref } from '../src/utils/looksLikeSql.js';
import { filterTools } from '../src/data/toolsCatalog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const catalog = readFileSync(join(root, 'src/data/toolsCatalog.js'), 'utf8');
const hub = readFileSync(join(root, 'src/pages/ToolsHubPage.jsx'), 'utf8');
const search = readFileSync(join(root, 'src/components/SearchModal.jsx'), 'utf8');
const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const home = readFileSync(join(root, 'src/pages/HomePage.jsx'), 'utf8');
const footer = readFileSync(join(root, 'src/components/Footer.jsx'), 'utf8');
const widget = readFileSync(join(root, 'src/components/InlineToolWidget.jsx'), 'utf8');
const articleMap = readFileSync(join(root, 'src/data/articleToolMap.js'), 'utf8');
const article = readFileSync(join(root, 'src/pages/ArticlePage.jsx'), 'utf8');
const playground = readFileSync(join(root, 'src/pages/SqlPlaygroundPage.jsx'), 'utf8');
const motion = readFileSync(join(root, 'src/components/HubMotion.jsx'), 'utf8');
const cta = readFileSync(join(root, 'src/components/InArticleCTA.jsx'), 'utf8');

assert(catalog.includes("slug: 'sql-playground'"), 'Catalog must include the playground');
assert(catalog.includes("slug: 'snowflake-cost-calculator'"), 'Catalog must include Snowflake cost');
assert(catalog.includes('Epoch ↔ date'), 'Unix converter tagline must not be mojibake');
assert(hub.includes('from \'@/data/toolsCatalog\''), 'Tools hub should use the shared catalog');
assert(hub.includes('TOOL_CATEGORIES'), 'Tools hub should filter by category on mobile');
assert(hub.includes("params.get('stack')"), 'Tools hub should honor pipeline-stage deep links');
assert(search.includes('searchTools'), 'Search must rank local tools before WP articles');
assert(header.includes('aria-label="Free tools"'), 'Mobile header should expose a tools shortcut');
assert(home.includes('FeaturedToolsRail'), 'Home should show a tools rail above the article feed');
assert(footer.includes('Free tools'), 'Footer should list calculators, not only categories');
assert(footer.includes('/tools/sql-playground'), 'Footer should deep-link the playground');
assert(widget.includes('/tools/snowflake-cost-calculator'), 'Article widgets should open a real calculator');
assert(!widget.includes("to: '/compare'"), 'Article widgets should not dump people on Compare');
assert(articleMap.includes('calculators:'), 'Related tools map should include calculators');
assert(article.includes('Interactive tools'), 'Articles should list interactive tools on mobile');
assert(playground.includes("searchParams.get('sql')"), 'Playground should accept ?sql= deep links');
assert(playground.includes("pane === 'editor'"), 'Playground should tab Editor/Results on phones');
assert(motion.includes('/tools?stack='), 'Homepage stages should jump into a filtered tools hub');
assert(cta.includes("to: '/tools'"), 'In-article explore rail should keep Free Tools');
assert(header.includes('<span>Tools</span>'), 'Mobile header Tools shortcut must be labeled, not icon-only');
assert(header.includes('FEATURED_TOOLS'), 'Mobile menu should list featured tools');
assert(hub.includes('py-8 sm:py-12'), 'Tools hub hero should stay short on phones');
assert(readFileSync(join(root, 'src/hooks/useCopyCodeButtons.js'), 'utf8').includes('playgroundSqlHref'), 'Article SQL blocks should deep-link the playground');
assert(readFileSync(join(root, 'src/pages/CostCalculatorPage.jsx'), 'utf8').includes('StickyToolTotal'), 'Snowflake calculator should keep the monthly total on screen');
assert(readFileSync(join(root, 'src/pages/DatabricksCostPage.jsx'), 'utf8').includes('StickyToolTotal'), 'Databricks calculator should keep the monthly total on screen');
assert(readFileSync(join(root, 'src/pages/BigQueryCostPage.jsx'), 'utf8').includes('StickyToolTotal'), 'BigQuery calculator should keep the monthly total on screen');
assert(looksLikeSql('SELECT department, COUNT(*) FROM employees GROUP BY department', 'language-sql'), 'SQL highlighter class should count as SQL');
assert(looksLikeSql('{"name":"Alice"}', 'language-json') === false, 'JSON samples must not get a Run button');
assert(playgroundSqlHref('SELECT 1').includes('/tools/sql-playground?sql='), 'Playground deep links must encode SQL');

const transformTools = filterTools({ stage: 'transform' });
assert(transformTools.length > 0, 'Transform filter must return tools');
assert(
  transformTools.every((tool) => tool.primaryStage === 'transform'),
  'Transform filter must only return primary transform tools (dbt / Airflow)'
);
assert(
  !transformTools.some((tool) => tool.slug === 'sql-formatter' || tool.slug === 'json-to-sql-ddl'),
  'SQL Formatter and JSON DDL must not appear under Transform'
);
assert(
  transformTools.some((tool) => tool.slug === 'dbt-schema-generator'),
  'dbt schema generator must stay on the Transform stack'
);
assert(
  transformTools.some((tool) => tool.slug === 'cron-expression-builder'),
  'Cron builder must stay on the Transform stack'
);

assert(motion.includes("to: '/interview-prep'"), 'Homepage interview card must keep /interview-prep');
assert(motion.includes("to: '/practice'"), 'Homepage practice card must keep /practice');
assert(!motion.includes('reviewTo'), 'Interview and practice must not collapse onto one review URL');
assert(home.includes("to=\"/interview-prep\""), 'Home lower section must link interview prep');
assert(home.includes("to=\"/practice\""), 'Home lower section must link practice tests');
assert(home.includes('StartHerePaths'), 'Home should show the free start-here plan');

console.log('✅ Mobile tools discovery and unique playground/stage hooks are wired');
