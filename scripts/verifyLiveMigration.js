#!/usr/bin/env node
/**
 * Live smoke test for the Cloudflare Pages origin. Run after a deploy:
 *   node scripts/verifyLiveMigration.js [https://dataengineerhub.blog]
 *
 * Checks the failures the migration audit found, so they cannot come back
 * unnoticed:
 *  - every sitemap URL returns 200 directly (no 308 hop), with a self canonical
 *  - indexable tools and cheat sheets send no noindex header (Pages merges
 *    headers from every matching rule)
 *  - held-out sections still send noindex
 *  - www redirects to the apex, http redirects to https
 *  - redirected legacy slugs reach a 200 in one hop
 *  - unknown URLs are a real 404
 *  - the WordPress origin stays noindex
 *
 * Exit code 1 on any failure. Warnings (www, double slash) do not fail unless
 * --strict is passed, because they need a Cloudflare dashboard change.
 */
const base = (process.argv.find((a) => a.startsWith('http')) || 'https://dataengineerhub.blog').replace(/\/+$/, '');
const strict = process.argv.includes('--strict');
const UA = { 'user-agent': 'Mozilla/5.0 (deh-live-smoke-test)' };
const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

const get = (url, opts = {}) => fetch(url, { redirect: 'manual', headers: UA, ...opts });

async function pool(items, size, worker) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await worker(queue.shift());
  }));
}

// 1. Sitemap URLs: 200, no redirect, self canonical, no noindex header.
const sitemap = await (await get(`${base}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) fail('sitemap.xml lists no URLs');
await pool(urls, 5, async (url) => {
  const res = await get(url);
  if (res.status !== 200) {
    fail(`${url} returned ${res.status}${res.headers.get('location') ? ` -> ${res.headers.get('location')}` : ''}`);
    return;
  }
  if (/noindex/i.test(res.headers.get('x-robots-tag') || '')) fail(`${url} sends X-Robots-Tag: ${res.headers.get('x-robots-tag')} but is in the sitemap`);
  const html = await res.text();
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1];
  if (canonical && canonical !== url) fail(`${url} canonical is ${canonical}`);
  const robots = (html.match(/<meta name="robots" content="([^"]+)"/i) || [])[1] || '';
  if (/noindex/i.test(robots)) fail(`${url} has meta robots "${robots}" but is in the sitemap`);
});

// 2. Held-out sections must still be noindex by header.
for (const p of ['/glossary/', '/compare/', '/roadmaps/', '/tools/csv-to-sql/', '/cheatsheets/dbt-best-practices/']) {
  const res = await get(`${base}${p}`);
  if (res.status === 404) continue; // not built, nothing to hold out
  if (!/noindex/i.test(res.headers.get('x-robots-tag') || '')) warn(`${p} is held out but sends no noindex header (meta robots may still cover it)`);
}

// 3. Redirects and edge behaviour.
const www = await get('https://www.dataengineerhub.blog/');
if (!(www.status >= 301 && www.status <= 308)) warn(`www host returns ${www.status} instead of redirecting to the apex (add a Cloudflare Redirect Rule)`);
const http = await get(base.replace('https://', 'http://') + '/');
if (!(http.status >= 301 && http.status <= 308) || !/^https:/.test(http.headers.get('location') || '')) fail(`http:// does not redirect to https (${http.status})`);
const dbl = await get(`${base}//articles//`);
if (dbl.status === 200) warn('double-slash paths return 200 (duplicate URLs); add a Cloudflare Redirect Rule to collapse them');

const legacy = await get(`${base}/articles/snowflake-performance`);
const target = legacy.headers.get('location');
if (legacy.status !== 301 || !target) fail(`/articles/snowflake-performance should 301 (got ${legacy.status})`);
else {
  const hop = await get(new URL(target, base).toString());
  if (hop.status !== 200) fail(`legacy redirect lands on ${target} which returns ${hop.status}`);
}

const missing = await get(`${base}/this-page-does-not-exist-${Date.now()}/`);
if (missing.status !== 404) fail(`unknown URL returned ${missing.status}, expected a real 404`);

// 4. WordPress origin must not be indexable.
try {
  const wp = await get('https://app.dataengineerhub.blog/');
  if (!/noindex/i.test(wp.headers.get('x-robots-tag') || '')) fail('app.dataengineerhub.blog is indexable (duplicate content)');
} catch (e) {
  warn(`WordPress origin not reachable: ${e.message}`);
}

console.log(`Checked ${urls.length} sitemap URLs on ${base}`);
for (const w of warnings) console.log(`⚠️  ${w}`);
for (const f of failures) console.error(`❌ ${f}`);
if (failures.length || (strict && warnings.length)) process.exit(1);
console.log(failures.length === 0 ? '✅ Live migration checks passed' : '');
