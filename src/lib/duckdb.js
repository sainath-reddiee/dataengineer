// src/lib/duckdb.js
// Shared DuckDB-WASM singleton — lazy-initialized, reused across pages.
// WASM binaries are self-hosted under /duckdb/ to avoid jsDelivr CDN CORS
// failures with dev-tagged releases.

let dbPromise = null;

/**
 * Self-hosted bundles — files are copied from
 * node_modules/@duckdb/duckdb-wasm/dist/ into public/duckdb/ at build time.
 */
const SELF_HOSTED_BUNDLES = {
  mvp: {
    mainModule: '/duckdb/duckdb-mvp.wasm',
    mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb/duckdb-eh.wasm',
    mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
  },
};

/**
 * Returns a singleton AsyncDuckDB instance.  The first call initialises the
 * WASM engine; subsequent calls return the same promise.
 */
export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    const bundle = await duckdb.selectBundle(SELF_HOSTED_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
  })().catch((err) => {
    // Reset so the next call retries instead of returning a rejected promise
    dbPromise = null;
    throw new Error(
      `Failed to load DuckDB: ${err.message}. Try refreshing the page.`
    );
  });
  return dbPromise;
}
