// src/lib/duckdb.js
// Shared DuckDB-WASM singleton — lazy-initialized, reused across pages.
// WASM binaries are copied from node_modules into /duckdb/ at Vite startup
// so the worker is same-origin and does not 404.

let dbPromise = null;

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

function workerUrl(scriptPath) {
  return new URL(scriptPath, window.location.origin).href;
}

/**
 * Returns a singleton AsyncDuckDB instance.  The first call initialises the
 * WASM engine; subsequent calls return the same promise.
 */
export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    const bundle = await duckdb.selectBundle(SELF_HOSTED_BUNDLES);
    const worker = new Worker(workerUrl(bundle.mainWorker));
    worker.addEventListener('error', (event) => {
      const detail = event.message || event.filename || 'worker failed to start';
      console.warn(`DuckDB worker: ${detail}`);
    });
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
  })().catch((err) => {
    dbPromise = null;
    throw new Error(
      `Failed to load DuckDB: ${err.message || 'unknown error'}. Try refreshing the page.`
    );
  });
  return dbPromise;
}
