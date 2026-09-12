import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const search = readFileSync(join(root, 'src/components/SearchModal.jsx'), 'utf8');
const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const duckdb = readFileSync(join(root, 'src/lib/duckdb.js'), 'utf8');
const playground = readFileSync(join(root, 'src/pages/SqlPlaygroundPage.jsx'), 'utf8');
const contribute = readFileSync(join(root, 'src/pages/ContributePage.jsx'), 'utf8');
const contact = readFileSync(join(root, 'src/pages/ContactPage.jsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');

assert(search.includes('createPortal'), 'Search modal must portal to document.body');
assert(search.includes('fixed inset-0'), 'Search overlay must be viewport-fixed, not header-relative');
assert(search.includes('flex items-start justify-center'), 'Search card must flex-center (no left-1/2 transform clash)');
assert(!search.includes('left-1/2'), 'Search modal must not use left-1/2 (Framer overwrites Tailwind translate)');
assert(search.includes('Type at least 2 characters to search'), 'Empty-state helper copy must stay readable');
assert(search.includes('text-pretty'), 'Search helper copy should wrap instead of jam on mobile');
assert(search.includes('aria-label="Close search"'), 'Search must expose a close control on mobile');
assert(search.includes("body.style.overflow = 'hidden'"), 'Search must lock background scroll');

assert(header.includes('aria-label="Search articles"'), 'Mobile header should expose a search icon like the desktop chrome');

assert(duckdb.includes("from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'"), 'DuckDB wasm must ride the Vite asset graph');
assert(duckdb.includes("from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'"), 'DuckDB worker must ride the Vite asset graph');
assert(duckdb.includes('/duckdb/duckdb-eh.wasm'), 'DuckDB should still prefer same-origin /duckdb/ copies when present');
assert(!duckdb.includes('jsdelivr'), 'DuckDB must not depend on jsDelivr at runtime');
assert(duckdb.includes('INIT_TIMEOUT_MS'), 'DuckDB init must time out instead of spinning forever');
assert(duckdb.includes('onDuckDbProgress'), 'Playground needs a progress hook so the first 32 MB download is visible');
assert(duckdb.includes('resetDb'), 'Failed DuckDB inits must be retryable');

assert(!playground.includes('~2 MB'), 'Playground must not advertise a 2 MB engine');
assert(playground.includes('Try again'), 'Playground must offer a retry after a failed engine load');
assert(playground.includes('onDuckDbProgress'), 'Playground should show download progress');
assert(playground.includes('resetPlaygroundDb'), 'Playground retry must clear the stuck promise');

assert(contribute.includes('SupportButton'), 'Write for us should open the coffee modal');
assert(contribute.includes('source="contribute_page"'), 'Contribute coffee CTA should be tracked separately');
assert(contact.includes('SupportButton'), 'Contact should also offer a coffee thank-you');

assert(app.includes('path="playground"'), 'Short /playground URL should redirect to the SQL playground');
assert(htaccess.includes('RewriteRule ^playground'), '.htaccess should 301 /playground before the SPA fallback');
assert(htaccess.includes('AddType application/wasm .wasm'), 'Hostinger must serve wasm with the correct MIME type');

console.log('✅ Search sheet, playground engine, and Write-for-us coffee note are wired');
