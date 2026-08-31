// Guardrail for the AdSense review quality gate.
import { ADSENSE_REVIEW_MODE, isAdSenseNoindexPath } from '../src/data/adsenseQualityGate.js';

const mustNoindex = [
  '/glossary',
  '/glossary/snowflake',
  '/compare',
  '/compare/airflow-vs-prefect',
  '/tag/snowflake',
  '/tags',
  '/cheatsheets/category/sql',
];

const mustIndex = [
  '/',
  '/articles',
  '/articles/from-etl-pipelines-to-reusable-data-products',
  '/about',
  '/editorial-standards',
  '/cheatsheets',
  '/cheatsheets/snowflake-sql',
  '/tools',
  '/tools/snowflake-cost-calculator',
  '/practice',
  '/category/snowflake',
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

if (failed > 0) {
  console.error(`\n❌ AdSense quality gate failed (${failed} path(s))`);
  process.exit(1);
}

console.log(`✅ AdSense quality gate: ${mustNoindex.length} held-out paths, ${mustIndex.length} indexable paths`);
