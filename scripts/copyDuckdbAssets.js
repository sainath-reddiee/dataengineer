import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const DUCKDB_FILES = [
  'duckdb-mvp.wasm',
  'duckdb-eh.wasm',
  'duckdb-browser-mvp.worker.js',
  'duckdb-browser-eh.worker.js',
];

export function copyDuckdbAssets() {
  const src = path.join(root, 'node_modules/@duckdb/duckdb-wasm/dist');
  const dest = path.join(root, 'public/duckdb');

  if (!fs.existsSync(src)) {
    throw new Error('DuckDB package is missing. Run npm install.');
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const file of DUCKDB_FILES) {
    const from = path.join(src, file);
    if (!fs.existsSync(from)) {
      throw new Error(`Missing DuckDB asset: ${file}`);
    }
    fs.copyFileSync(from, path.join(dest, file));
  }

  return DUCKDB_FILES.map((file) => path.join(dest, file));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const copied = copyDuckdbAssets();
  console.log(`✅ Copied ${copied.length} DuckDB assets into public/duckdb`);
}
