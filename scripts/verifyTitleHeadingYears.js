// A page <title> must not claim a newer year than the page's own H1.
//   node scripts/verifyTitleHeadingYears.js
// SEO overrides once promised "2026" in titles of articles whose heading and body still
// said 2025, so the search result and the page contradicted each other.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = join(root, 'dist', 'articles');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"');
const years = (s) => (s.match(/\b20\d\d\b/g) || []).map(Number);

if (!existsSync(articlesDir)) {
  console.log('dist/articles not built, skipping title/heading year check');
  process.exit(0);
}

const offenders = [];
for (const slug of readdirSync(articlesDir)) {
  const file = join(articlesDir, slug, 'index.html');
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '');
  const h1 = decode(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ''));
  const titleYears = years(title);
  const h1Years = years(h1);
  if (!titleYears.length || !h1Years.length) continue; // only compare when both name a year
  if (Math.max(...titleYears) > Math.max(...h1Years)) offenders.push(`${slug}: title "${title}" vs H1 "${h1}"`);
}

if (offenders.length) {
  console.error(`❌ ${offenders.length} page(s) whose title names a newer year than their H1:`);
  for (const o of offenders.slice(0, 10)) console.error(`   ${o}`);
  process.exit(1);
}
console.log('✅ No page title claims a newer year than its H1');
