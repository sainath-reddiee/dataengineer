// src/lib/duckdb.js
// Shared DuckDB-WASM singleton — lazy-initialized, reused across pages.
// WASM binary loads from jsDelivr CDN; only the JS bindings are bundled.

let dbPromise = null;

/**
 * Returns a singleton AsyncDuckDB instance.  The first call initialises the
 * WASM engine; subsequent calls return the same promise.
 */
export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
  })();
  return dbPromise;
}
