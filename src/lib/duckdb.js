// src/lib/duckdb.js
// Shared DuckDB-WASM singleton — lazy-initialized, reused across pages.
//
// Vite `?url` imports put wasm + workers on the hashed asset graph so they
// ship even when public/duckdb/ was not uploaded (it is gitignored).
// Same-origin /duckdb/ copies are preferred when present (stable URLs, cache).

import ehWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import mvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import ehWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import mvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

const INIT_TIMEOUT_MS = 90_000;
const SELF_HOSTED = {
  mvp: {
    mainModule: '/duckdb/duckdb-mvp.wasm',
    mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb/duckdb-eh.wasm',
    mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
  },
};
const BUNDLED = {
  mvp: {
    mainModule: mvpWasmUrl,
    mainWorker: mvpWorkerUrl,
  },
  eh: {
    mainModule: ehWasmUrl,
    mainWorker: ehWorkerUrl,
  },
};

let dbPromise = null;
const progressListeners = new Set();

export function onDuckDbProgress(listener) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function resetDb() {
  dbPromise = null;
}

function emitProgress(update) {
  for (const listener of progressListeners) {
    try {
      listener(update);
    } catch {
      /* ignore listener errors */
    }
  }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function assetExists(url) {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    return head.ok;
  } catch {
    return false;
  }
}

function workerHref(scriptPath) {
  if (/^https?:\/\//i.test(scriptPath) || scriptPath.startsWith('blob:')) {
    return scriptPath;
  }
  if (scriptPath.startsWith('/')) {
    return new URL(scriptPath, window.location.origin).href;
  }
  return scriptPath;
}

function describeProgress(progress) {
  const loaded = Number(progress?.bytesLoaded ?? progress?.loaded ?? 0);
  const total = Number(progress?.bytesTotal ?? progress?.total ?? 0);
  if (total > 0) {
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    const mb = (total / (1024 * 1024)).toFixed(0);
    return {
      phase: 'wasm',
      percent: pct,
      message: `Downloading the SQL engine… ${pct}% of ~${mb} MB`,
    };
  }
  return {
    phase: 'wasm',
    percent: null,
    message: 'Downloading the SQL engine… first visit can take up to a minute on mobile.',
  };
}

/**
 * Returns a singleton AsyncDuckDB instance. The first call initialises the
 * WASM engine; subsequent calls return the same promise.
 */
export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    emitProgress({ phase: 'import', percent: null, message: 'Starting the SQL engine…' });
    const duckdb = await import('@duckdb/duckdb-wasm');

    const selfHostedOk = await assetExists(SELF_HOSTED.eh.mainModule);
    const bundles = selfHostedOk ? SELF_HOSTED : BUNDLED;
    const bundle = await duckdb.selectBundle(bundles);

    emitProgress({ phase: 'worker', percent: null, message: 'Starting the SQL worker…' });
    // eh/mvp workers ship as classic IIFE bundles, not ES modules.
    const worker = new Worker(workerHref(bundle.mainWorker));
    worker.addEventListener('error', (event) => {
      const detail = event.message || event.filename || 'worker failed to start';
      console.warn(`DuckDB worker: ${detail}`);
    });

    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    emitProgress({
      phase: 'wasm',
      percent: 0,
      message: 'Downloading the SQL engine… first visit can take up to a minute on mobile.',
    });
    await withTimeout(
      db.instantiate(bundle.mainModule, bundle.pthreadWorker, (progress) => {
        emitProgress(describeProgress(progress));
      }),
      INIT_TIMEOUT_MS,
      'The SQL engine timed out while loading. Check your connection and try again.'
    );
    emitProgress({ phase: 'ready', percent: 100, message: 'SQL engine ready' });
    return db;
  })().catch((err) => {
    dbPromise = null;
    const message = err?.message || 'unknown error';
    emitProgress({ phase: 'error', percent: null, message });
    throw new Error(`Failed to load DuckDB: ${message}`);
  });
  return dbPromise;
}
