import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagnoseCtr, getExpectedCTR, summarizeCtrMix } from './expectedCtr.js';
import { upsertSeoOverrideSource, formatSeoOverrideEntry } from './seoOverrideFile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('position 1 expected CTR is about 28%', () => {
  assert.ok(Math.abs(getExpectedCTR(1) - 0.28) < 0.001);
});

test('page-2 high impressions is a ranking problem, not a snippet gap', () => {
  const d = diagnoseCtr({ impressions: 8000, clicks: 40, ctr: 0.005, position: 18, title: 'Good Title With Numbers 2026' });
  assert.equal(d.kind, 'rank');
});

test('page-1 position 8 with weak CTR is still a snippet gap', () => {
  const d = diagnoseCtr({ impressions: 800, clicks: 6, ctr: 0.0075, position: 8, title: 'A title' });
  assert.equal(d.kind, 'snippet');
});

test('site mix attributes most impressions to page 2+', () => {
  const mix = summarizeCtrMix([
    { impressions: 100, clicks: 28, position: 1 },
    { impressions: 900, clicks: 6, position: 22 },
  ]);
  assert.equal(mix.page1Share, 0.1);
  assert.ok(mix.overallCtr < 0.04);
});

test('upsert replaces an existing slug and inserts a new one', () => {
  const file = fs.readFileSync(path.join(__dirname, '../data/seoOverrides.js'), 'utf8');
  const updated = upsertSeoOverrideSource(
    file,
    'delta-lake-vs-iceberg',
    "Delta Lake vs Iceberg: Don't Guess",
    'Updated description for tests.'
  );
  assert.match(updated, /'delta-lake-vs-iceberg': \{\n {4}title: 'Delta Lake vs Iceberg: Don\\'t Guess'/);
  assert.doesNotMatch(updated, /Delta Lake vs Apache Iceberg: Honest Comparison 2026/);

  const inserted = upsertSeoOverrideSource(
    updated,
    'brand-new-ctr-test-slug',
    'Brand New CTR Test Title 2026',
    "It's a description."
  );
  assert.match(inserted, /'brand-new-ctr-test-slug': \{/);
  assert.match(inserted, /It\\'s a description/);
  assert.match(inserted, /'delta-lake-vs-iceberg':/);

  const entry = formatSeoOverrideEntry('x', "Don't", "It's fine");
  assert.equal(entry.includes("Don\\'t"), true);
});
