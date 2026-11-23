import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
// Cloudflare Pages silently ignores header rules past the first 100.
const headerRuleCount = headers.split(/\r?\n/).filter((line) => line && !/^[\s#]/.test(line)).length;
assert(
  headerRuleCount <= 100,
  `public/_headers has ${headerRuleCount} rules; Cloudflare Pages ignores everything past 100, so later noindex rules would not apply`
);
const redirects = readFileSync(join(root, 'public/_redirects'), 'utf8');
const duckdb = readFileSync(join(root, 'src/lib/duckdb.js'), 'utf8');
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8');
const workflow = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
const duckdbVersion = String(pkg.dependencies['@duckdb/duckdb-wasm'] || '').replace(/^\^/, '');

assert(!/^\s*\/\* \/index\.html 200\s*$/m.test(redirects), '_redirects must not SPA-fallback every unknown URL');
assert(redirects.includes('/.well-known/* /well-known/:splat 200'), '_redirects must rewrite /.well-known/');
assert(redirects.includes('/playground /tools/sql-playground/ 301'), '_redirects must keep the short playground URL');
assert(redirects.includes('/cookie-policy /privacy-policy/ 301'), '_redirects must keep the cookie-policy alias');
assert(!/^\s*\/\*\/ \/:splat 301\s*$/m.test(redirects), '_redirects must not strip trailing slashes (loops with Pages 308)');
assert(redirects.includes('/admin /app-shell/ 200'), '_redirects must still serve private app shells');
assert(!/^\S+ \/index\.html 200\s*$/m.test(redirects), '_redirects must not rewrite to /index.html (Pages 308s it to /)');
assert(headers.includes('/app-shell/'), '_headers must noindex the /app-shell/ copy of the SPA shell');

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
  assert(redirects.includes(`/tag/${slug} /articles/ 301`), `_redirects missing thin tag /tag/${slug}`);
}

assert(headers.includes('https://:project.pages.dev/*'), '_headers must noindex pages.dev');
assert(headers.includes('X-Robots-Tag: noindex, follow'), '_headers must send review-mode X-Robots-Tag');
assert(headers.includes('/assets/*'), '_headers must long-cache hashed /assets/*');
assert(headers.includes('stale-while-revalidate=86400'), '_headers should keep HTML revalidation cheap');
assert(headers.includes('rel=api-catalog'), '_headers must advertise the agent catalog on /');

// Pages merges every matching rule, so an allowlisted (indexable) page must have NO noindex
// rule at all. Held-out pages carry exactly one rule on their trailing-slash URL.
const headerBlocks = headers.split(/\r?\n\s*\r?\n/).map((block) =>
  block.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'))
);
const noindexRuleFor = (path) => headerBlocks.some(
  (lines) => [path, `${path}/`].includes((lines[0] || '').trim()) && /noindex/i.test(lines.slice(1).join('\n'))
);
for (const slug of ADSENSE_REVIEW_CHEATSHEETS) {
  assert(!noindexRuleFor(`/cheatsheets/${slug}`), `_headers sends noindex for the allowlisted cheat sheet ${slug}`);
}
for (const slug of ADSENSE_REVIEW_TOOLS) {
  assert(!noindexRuleFor(`/tools/${slug}`), `_headers sends noindex for the allowlisted tool ${slug}`);
}
// Pages applies a per-page rule only to the exact URL, and the page that returns 200 is the
// trailing-slash one. A bare-path rule only ever matches the 308 redirect and wastes a rule slot.
const noindexRuleOnSlash = (path) => headerBlocks.some(
  (lines) => (lines[0] || '').trim() === `${path}/` && /noindex/i.test(lines.slice(1).join('\n'))
);
assert(
  noindexRuleOnSlash('/tools/csv-to-sql') && noindexRuleOnSlash('/cheatsheets/dbt-best-practices'),
  '_headers must keep a noindex rule on the trailing-slash URL of held-out tools and cheat sheets'
);
const bareRules = headers.match(/^\/(tools|cheatsheets)\/[a-z0-9-]+\r?$/gm) || [];
assert(
  bareRules.length === 0,
  `_headers has bare-path rules that never match the live page (use the trailing-slash form): ${bareRules.join(', ')}`
);
// Every built tool / cheat-sheet page that is not allowlisted must carry a noindex rule, so a
// newly added page is never indexable by header by accident. Needs a build, so skip without dist.
for (const [section, allowed] of [['tools', ADSENSE_REVIEW_TOOLS], ['cheatsheets', ADSENSE_REVIEW_CHEATSHEETS]]) {
  const dir = join(root, 'dist', section);
  if (!existsSync(dir)) continue;
  const uncovered = readdirSync(dir).filter((slug) =>
    slug !== 'category' &&
    !allowed.includes(slug) &&
    existsSync(join(dir, slug, 'index.html')) &&
    !noindexRuleOnSlash(`/${section}/${slug}`)
  );
  assert(
    uncovered.length === 0,
    `_headers has no noindex rule for held-out /${section}/ pages: ${uncovered.join(', ')}`
  );
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
