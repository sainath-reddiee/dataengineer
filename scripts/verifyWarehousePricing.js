#!/usr/bin/env node
// Warehouse cost estimator v2: sourced and dated prices, sane maths, the same
// numbers as the existing calculators (no drift), and no recommendation copy.
//
//   node scripts/verifyWarehousePricing.js           (part of test:community)
//   node scripts/verifyWarehousePricing.js --fresh   fail when any price was
//                                                    checked over 120 days ago
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLATFORM_ORDER, WAREHOUSE_PRICING as P } from '../src/data/warehousePricing.js';
import { estimateAll, SHAPES } from '../src/lib/estimator/warehouseEstimate.js';
import { EDITIONS, REGIONS } from '../src/data/snowflakePricing.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const fresh = process.argv.includes('--fresh');
let failed = 0;
const check = (ok, msg) => {
  if (!ok) {
    console.error(`❌ ${msg}`);
    failed += 1;
  }
};

// Every price is positive, sourced and dated.
const MAX_AGE_DAYS = 120;
for (const id of PLATFORM_ORDER) {
  const p = P[id];
  check(p.source?.url?.startsWith('https://'), `${id}: https source link`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedOn || ''), `${id}: verifiedOn is an ISO date`);
  for (const [key, value] of Object.entries(p)) {
    if (/Price|PerGB|PerTB|PerSlotHour|Share$/.test(key)) check(typeof value === 'number' && value > 0, `${id}.${key} is a positive number`);
  }
  const age = (Date.now() - Date.parse(p.verifiedOn)) / 86400000;
  if (age > MAX_AGE_DAYS) {
    if (fresh) check(false, `${id}: prices last checked ${Math.round(age)} days ago; re-check ${p.source.url}`);
    else console.log(`⚠️  ${id}: prices last checked ${Math.round(age)} days ago (run with --fresh before opening indexing)`);
  }
}

// Maths: defaults equal the original comparison calculator, zero is zero,
// cost never falls as usage grows, bad input never produces NaN.
const totals = Object.fromEntries(estimateAll({}).results.map((r) => [r.id, r.total]));
const near = (a, b) => Math.abs(a - b) < 0.005;
check(near(totals.snowflake, 1969.9) && near(totals.databricks, 363.5) && near(totals.bigquery, 322.5), `defaults match the original calculator (${JSON.stringify(totals)})`);
check(estimateAll({ tb: 0, hours: 0, storageGB: 0 }).results.every((r) => r.total === 0), 'zero workload costs nothing');
for (const key of ['tb', 'hours', 'storageGB']) {
  const low = estimateAll({ [key]: 10 }).results;
  const high = estimateAll({ [key]: 1000 }).results;
  check(low.every((r, i) => high[i].total >= r.total), `cost never falls as ${key} grows`);
}
check(estimateAll({ tb: 'abc', hours: -5, storageGB: null, shape: 'nope', bqSlots: 'x' }).results.every((r) => Number.isFinite(r.total)), 'bad input never produces NaN');

// No drift from the existing calculators (they keep their own copies).
const v1 = read('src/pages/WarehouseComparisonCalculatorPage.jsx');
const v1num = (key) => Number((v1.match(new RegExp(`${key}:\\s*([\\d.]+)`)) || [])[1]);
check(v1num('creditPrice') === P.snowflake.creditPrice, 'comparison page: Snowflake credit price');
check(v1num('dbuPrice') === P.databricks.dbuPrice, 'comparison page: Databricks DBU price');
check(v1num('onDemandPerTB') === P.bigquery.onDemandPerTB && v1num('editionsPerSlotHour') === P.bigquery.editionsPerSlotHour, 'comparison page: BigQuery prices');
for (const [shape, f] of Object.entries(SHAPES)) {
  const m = v1.match(new RegExp(`${shape}:\\s*\\{\\s*sfCreditsPerHour:\\s*(\\d+),\\s*dbxDBUsPerHour:\\s*(\\d+),\\s*bqSlotsEquiv:\\s*(\\d+)`));
  check(m && +m[1] === f.sfCreditsPerHour && +m[2] === f.dbxDBUsPerHour && +m[3] === f.bqSlots, `comparison page: ${shape} workload shape`);
}
const usEast = REGIONS.find((r) => r.id === 'aws-us-east');
const enterprise = EDITIONS.find((e) => e.id === 'enterprise');
check(usEast && enterprise && usEast.creditPrice * enterprise.multiplier === P.snowflake.creditPrice && usEast.storagePerTB / 1000 === P.snowflake.storagePerGB, 'Snowflake calculator: US East Enterprise credit and storage');
check(/id: 'sql-pro',[^}]*dbuRate: 0\.55/.test(read('src/pages/DatabricksCostPage.jsx')) && P.databricks.dbuPrice === 0.55, 'Databricks calculator: SQL Pro DBU rate');
const bq = read('src/pages/BigQueryCostPage.jsx');
check(bq.includes(`billableTb * ${P.bigquery.onDemandPerTB}`) && bq.includes(`edition === 'enterprise' ? ${P.bigquery.editionsPerSlotHour}`) && bq.includes(`activeGb * ${P.bigquery.storagePerGB}`), 'BigQuery calculator: on-demand, Enterprise slot and storage prices');

// Neutral copy and wiring.
// Visible copy only: drop // comment lines before checking the wording.
const page = read('src/pages/WarehouseCostEstimatorPage.jsx').replace(/^\s*\/\/.*$/gm, '');
check(!/recommend|best choice|winner|you should|go with/i.test(page), 'estimator describes the lowest estimate and never recommends a platform');
check(read('src/App.jsx').includes("lazy(() => import('./pages/WarehouseCostEstimatorPage'))"), 'estimator route is lazy-loaded');
check(/slug: 'warehouse-cost-estimator',[\s\S]{0,700}featured: false/.test(read('src/data/toolsCatalog.js')), 'estimator is in the tools catalog, not featured');
check(!read('src/data/articleToolMap.js').includes('warehouse-cost-estimator'), 'estimator is not linked from articles during review');

if (failed) {
  console.error(`\n❌ ${failed} pricing check(s) failed`);
  process.exit(1);
}
console.log('✅ Warehouse estimator: sourced prices, maths, no drift from the existing calculators, neutral copy');
