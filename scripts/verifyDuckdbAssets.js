import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDuckdbAssets } from './copyDuckdbAssets.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const duckdb = readFileSync(join(root, 'src/lib/duckdb.js'), 'utf8');
const vite = readFileSync(join(root, 'vite.config.js'), 'utf8');

assert(
  duckdb.includes("from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'"),
  'DuckDB should ship the worker on the Vite asset graph'
);
assert(
  duckdb.includes("from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'"),
  'DuckDB should ship the wasm module on the Vite asset graph'
);
assert(duckdb.includes('/duckdb/duckdb-eh.wasm'), 'DuckDB should still prefer same-origin /duckdb/ copies when present');
assert(!duckdb.includes('jsdelivr'), 'DuckDB must not depend on jsDelivr at runtime');
assert(vite.includes('copyDuckdbAssets'), 'Vite must copy DuckDB assets for local /duckdb/ fallback');
assert(duckdb.includes('INIT_TIMEOUT_MS'), 'DuckDB init must time out instead of hanging forever');

const copied = copyDuckdbAssets();
for (const file of copied) {
  assert(existsSync(file), `expected copied DuckDB file ${file}`);
}

console.log('✅ DuckDB worker and wasm assets are copied locally');
