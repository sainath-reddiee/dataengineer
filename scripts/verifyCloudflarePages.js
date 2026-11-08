import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADSENSE_REVIEW_CHEATSHEETS,
  ADSENSE_REVIEW_TOOLS,
} from '../src/data/adsenseQualityGate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const redirectsJson = JSON.parse(readFileSync(join(root, 'src/data/redirects.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const headers = readFileSync(join(root, 'public/_headers'), 'utf8');
const redirects = readFileSync(join(root, 'public/_redirects'), 'utf8');
const duckdb = readFileSync(join(root, 'src/lib/duckdb.js'), 'utf8');
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8');
const workflow = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
const duckdbVersion = String(pkg.dependencies['@duckdb/duckdb-wasm'] || '').replace(/^\^/, '');

assert(!/^\s*\/\* \/index\.html 200\s*$/m.test(redirects), '_redirects must not SPA-fallback every unknown URL');
assert(redirects.includes('/.well-known/* /well-known/:splat 200'), '_redirects must rewrite /.well-known/');
assert(redirects.includes('/playground /tools/sql-playground 301'), '_redirects must keep the short playground URL');
assert(redirects.includes('/cookie-policy /privacy-policy 301'), '_redirects must keep the cookie-policy alias');
assert(!/^\s*\/\*\/ \/\:splat 301\s*$/m.test(redirects), '_redirects must not strip trailing slashes (loops with Pages 308)');
assert(redirects.includes('/admin /index.html 200'), '_redirects must still serve private app shells');

for (const [from, to] of Object.entries(redirectsJson)) {
  assert(
    redirects.includes(`${from} ${to} 301`),
    `_redirects is missing the ${from} → ${to} merge`
  );
}

const thinTags = htaccess.match(
  /RewriteRule \^tag\/\(([^)]+)\)\/\?\$ \/articles/
);
assert(thinTags, '.htaccess thin-tag list should exist so Pages can mirror it');
for (const slug of thinTags[1].split('|')) {
  assert(redirects.includes(`/tag/${slug} /articles 301`), `_redirects missing thin tag /tag/${slug}`);
}

assert(headers.includes('https://:project.pages.dev/*'), '_headers must noindex pages.dev');
assert(headers.includes('X-Robots-Tag: noindex, follow'), '_headers must send review-mode X-Robots-Tag');
assert(headers.includes('/assets/*'), '_headers must long-cache hashed /assets/*');
assert(headers.includes('stale-while-revalidate=86400'), '_headers should keep HTML revalidation cheap');
assert(headers.includes('rel=api-catalog'), '_headers must advertise the agent catalog on /');

for (const slug of ADSENSE_REVIEW_CHEATSHEETS) {
  assert(
    headers.includes(`/cheatsheets/${slug}`),
    `_headers cheat-sheet allowlist is missing ${slug}`
  );
}
for (const slug of ADSENSE_REVIEW_TOOLS) {
  assert(headers.includes(`/tools/${slug}`), `_headers tool allowlist is missing ${slug}`);
}

assert(duckdb.includes('DUCKDB_NPM_VERSION'), 'DuckDB must pin the npm version used on the CDN fallback');
assert(duckdb.includes(duckdbVersion), `DuckDB CDN pin must match package.json (${duckdbVersion})`);
assert(duckdb.includes('cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@'), 'Pages 25 MiB cap: wasm must fall back to jsDelivr');
assert(duckdb.includes('bundledWasmOk'), 'CDN wasm is last resort after HEAD of the hashed Vite copy');
assert(duckdb.includes('createWorker'), 'Cross-origin DuckDB workers must load through a blob URL');

assert(wrangler.includes('pages_build_output_dir = "dist-pages"'), 'wrangler.toml must point at the stripped Pages bundle');
assert(workflow.includes('deploy_cloudflare'), 'Hostinger workflow must expose an opt-in Cloudflare Pages deploy');
assert(workflow.includes('prepareCloudflarePages.js'), 'Cloudflare deploy must strip 25 MiB wasm before upload');

console.log('✅ Cloudflare Pages headers, redirects, DuckDB fallback, and deploy wiring match Hostinger rules');
