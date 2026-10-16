// scripts/auditEditorialQuality.js
// Ranks published WordPress articles by how much editorial rework they need
// before an AdSense review. AdSense "low value content" is a judgement about
// whether pages read as first-hand, original work, so this flags the signals
// a reviewer notices: thin prose, no original images, templated phrasing,
// stale years in titles, and little first-person practitioner voice.
//
// Usage:
//   node scripts/auditEditorialQuality.js            # writes plans/editorial-worklist.md
//   node scripts/auditEditorialQuality.js --json     # also writes plans/editorial-worklist.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORDPRESS_API_URL } from '../src/apiConfig.js';
import { MIN_INDEXABLE_WORD_COUNT } from '../src/data/thinTags.js';
import { EXCLUDED_ARTICLE_SLUGS } from '../src/data/excludedSlugs.js';
import { countArticleIndexableWords } from '../src/utils/articleIndexableWords.js';
import { measureTextToCodeRatio } from '../src/utils/adsenseCodeRatio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'plans');
const CURRENT_YEAR = new Date().getFullYear();

// Phrases that read as generic or machine-drafted to reviewers.
const STOCK_PHRASES = [
  'leverage', 'seamless', 'game-changer', 'game changer', 'unlock', 'delve',
  'landscape', 'robust', 'dive into', "in today's", 'comprehensive guide',
  'ultimate guide', 'buckle up', 'revolutionize', 'elevate', 'harness',
  'empower', 'supercharge', 'in conclusion', 'look no further',
];

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAllPosts() {
  const posts = [];
  for (let page = 1; ; page += 1) {
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=slug,date,modified,title,content`;
    const res = await fetch(url);
    if (!res.ok) {
      if (page > 1 && res.status === 400) break;
      throw new Error(`WordPress API ${res.status} for ${url}`);
    }
    const batch = await res.json();
    posts.push(...batch);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
  }
  return posts;
}

function analyse(post) {
  const html = post.content?.rendered || '';
  const title = stripHtml(post.title?.rendered || '');
  const text = stripHtml(html);
  const lower = text.toLowerCase();
  const prose = countArticleIndexableWords(html);
  const { codeShare } = measureTextToCodeRatio(html);
  const images = (html.match(/<img\b/gi) || []).length;
  const emDashes = (text.match(/—/g) || []).length;
  const emDashPer1k = prose ? (emDashes * 1000) / prose : 0;
  const hasTldr = /tl;dr/i.test(text);
  const phrases = STOCK_PHRASES.filter((p) => lower.includes(p));
  const firstPerson = (text.match(/\b(I|I've|I'm|I'd|my|we|we've|our)\b/g) || []).length;
  const firstPersonPer1k = prose ? (firstPerson * 1000) / prose : 0;
  const titleYears = (title.match(/\b20\d\d\b/g) || []).map(Number);
  const staleYear = titleYears.some((y) => y < CURRENT_YEAR);

  const issues = [];
  let score = 0;
  if (prose < MIN_INDEXABLE_WORD_COUNT) {
    issues.push(`thin: ${prose} prose words (< ${MIN_INDEXABLE_WORD_COUNT})`);
    score += 4;
  }
  if (images === 0) {
    issues.push('no images: add your own screenshots or diagrams');
    score += 2;
  }
  if (emDashPer1k > 6) {
    issues.push(`${emDashes} em-dashes (${emDashPer1k.toFixed(1)}/1k words)`);
    score += emDashPer1k > 12 ? 3 : 2;
  }
  if (phrases.length >= 3) {
    issues.push(`stock phrases: ${phrases.join(', ')}`);
    score += Math.min(3, phrases.length - 2);
  }
  if (hasTldr) {
    issues.push('templated TL;DR block');
    score += 1;
  }
  if (firstPersonPer1k < 3) {
    issues.push('little first-hand voice (add what you saw, measured, or got wrong)');
    score += 2;
  }
  if (codeShare > 0.4) {
    issues.push(`${Math.round(codeShare * 100)}% code: explain each block in prose`);
    score += 2;
  }
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  if (h2Count < 3 && prose >= 500) {
    issues.push(`${h2Count} H2 headings: turn bold lines into real section headings`);
    score += 2;
  }
  if (staleYear) {
    issues.push(`title says ${titleYears.join('/')}: refresh facts or drop the year`);
    score += 2;
  }

  return {
    slug: post.slug,
    title,
    published: post.date.slice(0, 10),
    modified: post.modified.slice(0, 10),
    prose,
    images,
    emDashes,
    codePct: Math.round(codeShare * 100),
    score,
    issues,
  };
}

function toMarkdown(rows) {
  const needsWork = rows.filter((r) => r.score > 0);
  const count = (fn) => rows.filter(fn).length;
  const lines = [
    '# Editorial worklist',
    '',
    `Generated ${new Date().toISOString().slice(0, 10)} by \`npm run content:audit\` from ${rows.length} published posts.`,
    'Highest score first: rework those posts before the next AdSense application.',
    '',
    `- **Rework first** (score 6+): ${count((r) => r.score >= 6)} posts`,
    `- **Polish** (score 3 to 5): ${count((r) => r.score >= 3 && r.score < 6)} posts`,
    `- **Light touch** (score 1 to 2): ${count((r) => r.score > 0 && r.score < 3)} posts`,
    '',
    '## Site-wide signals',
    '',
    `- Under ${MIN_INDEXABLE_WORD_COUNT} prose words: ${count((r) => r.prose < MIN_INDEXABLE_WORD_COUNT)}`,
    `- No images: ${count((r) => r.images === 0)}`,
    `- Heavy em-dash use (over 6 per 1k words): ${count((r) => r.issues.some((i) => i.includes('em-dashes')))}`,
    `- Templated TL;DR block: ${count((r) => r.issues.includes('templated TL;DR block'))}`,
    `- Little first-hand voice: ${count((r) => r.issues.some((i) => i.startsWith('little first-hand')))}`,
    `- Stale year in title: ${count((r) => r.issues.some((i) => i.startsWith('title says')))}`,
    `- Fewer than 3 H2 section headings: ${count((r) => r.issues.some((i) => i.includes('H2 headings')))}`,
    '',
    '## How to rework a post',
    '',
    '1. Add at least one thing only you have: a screenshot from your own account, a query profile, a cost number you measured, or an error you hit and how you fixed it.',
    '2. Rewrite the intro in your own words. Say who the post is for and what you learned doing it.',
    '3. Replace stock phrases and most em-dashes with plain sentences.',
    '4. Explain every long code block in prose: what it does, what to change, what goes wrong.',
    '5. Update facts and pricing, then update the year in the title or remove it.',
    '6. Merge or delete posts that overlap another post on the same topic.',
    '',
    `## Posts to rework (${needsWork.length})`,
    '',
    '| # | Score | Post | Prose | Imgs | Code | Issues |',
    '|---|---|---|---|---|---|---|',
  ];
  needsWork.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | ${r.score} | [${r.title.replace(/\|/g, '/')}](https://dataengineerhub.blog/articles/${r.slug}) | ${r.prose} | ${r.images} | ${r.codePct}% | ${r.issues.join('; ')} |`
    );
  });
  lines.push('');
  return lines.join('\n');
}

const posts = await fetchAllPosts();
const excluded = new Set(EXCLUDED_ARTICLE_SLUGS || []);
const rows = posts
  .filter((p) => !excluded.has(p.slug))
  .map(analyse)
  .sort((a, b) => b.score - a.score || a.prose - b.prose);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'editorial-worklist.md'), toMarkdown(rows));
if (process.argv.includes('--json')) {
  fs.writeFileSync(path.join(OUT_DIR, 'editorial-worklist.json'), JSON.stringify(rows, null, 2));
}
console.log(`✅ Audited ${rows.length} posts; ${rows.filter((r) => r.score > 0).length} need rework -> plans/editorial-worklist.md`);
