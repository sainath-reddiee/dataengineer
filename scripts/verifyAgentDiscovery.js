// Validates public agent-discovery files without needing a full Vite build.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
let failed = 0;

function ok(message) {
  console.log(`  ✅ ${message}`);
}

function fail(message) {
  failed += 1;
  console.log(`  ❌ ${message}`);
}

const authMd = fs.readFileSync(path.join(publicDir, 'auth.md'), 'utf8');
if (/^#\s+.*auth\.md/im.test(authMd)) ok('auth.md H1 contains auth.md');
else fail('auth.md H1 must contain "auth.md"');
if (/do \*\*not\*\* `POST`/i.test(authMd) || /Do \*\*not\*\* `POST`/i.test(authMd)) {
  ok('auth.md tells agents not to POST registration endpoints');
} else {
  fail('auth.md should warn agents not to POST registration endpoints');
}

const catalog = JSON.parse(fs.readFileSync(path.join(publicDir, 'well-known', 'api-catalog'), 'utf8'));
if (Array.isArray(catalog.linkset) && catalog.linkset.length >= 2) {
  ok(`api-catalog linkset has ${catalog.linkset.length} entries`);
} else {
  fail('api-catalog must be application/linkset+json with a linkset array');
}
for (const entry of catalog.linkset) {
  if (!entry.anchor || !entry['service-desc']) {
    fail(`catalog entry missing anchor or service-desc: ${JSON.stringify(entry).slice(0, 80)}`);
  }
}

const spec = JSON.parse(fs.readFileSync(path.join(publicDir, 'openapi.json'), 'utf8'));
if (spec.openapi && spec.paths['/llm-sitemap.json'] && spec.paths['/.well-known/api-catalog']) {
  ok('openapi.json describes the public read-only catalogs');
} else {
  fail('openapi.json must describe /llm-sitemap.json and /.well-known/api-catalog');
}

const htaccess = fs.readFileSync(path.join(publicDir, '.htaccess'), 'utf8');
if (htaccess.includes('rel=\\"api-catalog\\"') && htaccess.includes('rel=\\"service-desc\\"')
  && htaccess.includes('rel=\\"service-doc\\"') && htaccess.includes('rel=\\"describedby\\"')) {
  ok('.htaccess Link header has api-catalog, service-desc, service-doc, describedby');
} else {
  fail('.htaccess Link header is missing a required registered relation');
}
if (/RewriteRule \^\\\.well-known\//.test(htaccess)) {
  ok('.htaccess rewrites /.well-known/ to /well-known/');
} else {
  fail('.htaccess must rewrite /.well-known/ for Hostinger-safe deploy');
}
if (!/Header always set Link/.test(htaccess) || !/DEH_AGENT_LINKS/.test(htaccess)) {
  fail('.htaccess must set Link headers only via DEH_AGENT_LINKS (homepage + catalog)');
} else {
  ok('Link headers are scoped to the homepage and api-catalog');
}

const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
if (robots.includes('Allow: /auth.md') && robots.includes('Allow: /.well-known/')) {
  ok('robots.txt allows auth.md and /.well-known/');
} else {
  fail('robots.txt must Allow /auth.md and /.well-known/');
}

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (/rel="api-catalog"/.test(homepage) && /rel="describedby"/.test(homepage)) {
  ok('index.html has HTML discovery link relations');
} else {
  fail('index.html must include api-catalog and describedby link tags');
}

if (failed) {
  console.error(`\nAgent discovery checks failed: ${failed}`);
  process.exit(1);
}
console.log('\n✅ Agent discovery files look valid.');
