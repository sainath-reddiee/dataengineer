// Copy dist/ into dist-pages/ and strip files Cloudflare Pages will reject.
// Hostinger FTP still deploys dist/ (including .htaccess and DuckDB wasm).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_ASSET_BYTES = 25 * 1024 * 1024;
const FREE_FILE_LIMIT = 20_000;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'dist');
const dest = path.join(root, 'dist-pages');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

if (!fs.existsSync(path.join(src, 'index.html'))) {
  fail('dist/index.html is missing. Run the site build before pages:prepare.');
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

// Vite copies these into dist, but an SSG-only rebuild leaves stale copies.
// Pages must always ship the current public/_headers and public/_redirects.
for (const name of ['_headers', '_redirects']) {
  const from = path.join(root, 'public', name);
  if (!fs.existsSync(from)) fail(`public/${name} is missing`);
  fs.copyFileSync(from, path.join(dest, name));
}

const removed = [];
for (const file of walk(dest)) {
  const base = path.basename(file);
  if (base === '.htaccess' || base === '.ftp-deploy-sync-state.json') {
    fs.unlinkSync(file);
    removed.push(`${path.relative(dest, file)} (host-only)`);
    continue;
  }
  const size = fs.statSync(file).size;
  if (size >= MAX_ASSET_BYTES) {
    fs.unlinkSync(file);
    removed.push(`${path.relative(dest, file)} (${(size / (1024 * 1024)).toFixed(1)} MiB)`);
  }
}

const remaining = walk(dest);
const oversized = remaining.filter((file) => fs.statSync(file).size >= MAX_ASSET_BYTES);
if (oversized.length) {
  fail(`still over 25 MiB after strip: ${oversized.map((file) => path.relative(dest, file)).join(', ')}`);
}

for (const required of ['_headers', '_redirects', '404.html', 'index.html']) {
  if (!fs.existsSync(path.join(dest, required))) {
    fail(`dist-pages/${required} is missing`);
  }
}

const redirects = fs.readFileSync(path.join(dest, '_redirects'), 'utf8');
if (/^\s*\/\* \/index\.html 200\s*$/m.test(redirects)) {
  fail('SPA catch-all /* /index.html 200 would duplicate the homepage onto unknown URLs');
}
if (!redirects.includes('/.well-known/* /well-known/:splat 200')) {
  fail('_redirects must map /.well-known/* onto /well-known/');
}
if (/^\s*\/\*\/ \/\:splat 301\s*$/m.test(redirects)) {
  fail('_redirects must not strip trailing slashes; Pages 308s directories onto a slash and the pair loops');
}

const headers = fs.readFileSync(path.join(dest, '_headers'), 'utf8');
if (!headers.includes('https://:project.pages.dev/*')) {
  fail('_headers must noindex the *.pages.dev preview host');
}

if (remaining.length > FREE_FILE_LIMIT) {
  console.warn(
    `⚠️  ${remaining.length} files exceeds the Cloudflare Pages Free limit of ${FREE_FILE_LIMIT}. Prune glossary/compare HTML or set PAGES_WRANGLER_MAJOR_VERSION=4 on a paid plan.`
  );
}

const bytes = remaining.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(`✅ Cloudflare Pages bundle: ${remaining.length} files, ${(bytes / (1024 * 1024)).toFixed(1)} MiB in dist-pages/`);
if (removed.length) {
  console.log(`   stripped ${removed.length} Hostinger-only/oversize file(s):`);
  for (const item of removed.slice(0, 12)) console.log(`   - ${item}`);
  if (removed.length > 12) console.log(`   - … ${removed.length - 12} more`);
}
