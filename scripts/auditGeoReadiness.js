#!/usr/bin/env node
/**
 * GEO readiness audit for built article pages (dist/articles/<slug>/index.html).
 *
 * Article text lives in WordPress, so these gaps are fixed there. This script
 * lists them per article and writes plans/geo-worklist.json. It never fails the
 * build; pass --strict to exit 1 when any article has a gap.
 *
 * Checks per article:
 *  - title/H1 drift: low word overlap between <title> and the visible H1
 *  - no table in the body (comparison data reads best as a table)
 *  - no question-form H2/H3 (query-shaped headings)
 *  - no direct-answer opener (first paragraph under 15 words)
 *  - stale: no visible "Updated" line and modified within a day of publish
 *    (informational only; only a real revision should change it)
 *  - schema headline differs from the visible H1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, process.env.GEO_AUDIT_DIST || 'dist', 'articles');
const strict = process.argv.includes('--strict');

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'how', 'why', 'what', 'your', 'you', 'vs', 'guide', 'complete', 'tutorial']);
const tokens = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));
const overlap = (a, b) => {
  const A = tokens(a); const B = tokens(b);
  if (!A.size || !B.size) return 1;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit += 1;
  return hit / Math.min(A.size, B.size);
};

if (!fs.existsSync(dist)) {
  console.log(`GEO audit: ${path.relative(root, dist)} not found, run a build first.`);
  process.exit(0);
}

const rows = [];
for (const slug of fs.readdirSync(dist)) {
  const file = path.join(dist, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const title = text((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const h1 = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const body = (html.match(/<div class="article-body">([\s\S]*?)<\/article>/i) || [])[1] || html;
  const issues = [];

  if (title && h1 && overlap(title, h1) < 0.5) issues.push('title-h1-drift');
  if (!/<table[\s>]/i.test(body)) issues.push('no-table');
  const heads = [...body.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map((m) => text(m[1]));
  if (!heads.some((h) => /\?\s*$/.test(h))) issues.push('no-question-heading');
  const firstP = (body.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '';
  if (text(firstP).split(' ').filter(Boolean).length < 15) issues.push('weak-opener');
  const hasUpdated = />Updated\s*<time/i.test(html);
  const pub = (html.match(/property="article:published_time" content="([^"]+)"/) || [])[1];
  const mod = (html.match(/property="article:modified_time" content="([^"]+)"/) || [])[1];
  if (!hasUpdated && pub && mod && Math.abs(new Date(mod) - new Date(pub)) < 864e5) issues.push('never-revised');
  const ldHeadline = (html.match(/"@type":\s*"Article"[\s\S]*?"headline":\s*"([^"]*)"/) || [])[1];
  if (ldHeadline && h1 && decode(ldHeadline.replace(/\\"/g, '"')) !== h1) issues.push('schema-headline-differs');

  rows.push({ slug, title, h1, published: pub || null, modified: mod || null, issues });
}

const counts = {};
for (const r of rows) for (const i of r.issues) counts[i] = (counts[i] || 0) + 1;
const flagged = rows.filter((r) => r.issues.length);

console.log(`GEO audit: ${rows.length} articles, ${flagged.length} with at least one gap`);
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);

const out = path.join(root, 'plans', 'geo-worklist.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ total: rows.length, counts, articles: flagged }, null, 2));
console.log(`Worklist: ${path.relative(root, out)}`);
if (strict && flagged.length) process.exit(1);
