// src/hooks/useFormSpamGuard.js
// Client-side spam protection for public forms.
// Layers:
//   1. Honeypot — hidden field that bots fill; humans don't
//   2. Min-time — rejects submissions faster than SUBMIT_MIN_MS (bots are instant)
//   3. Rate limit — sliding-window counter (MAX_ATTEMPTS per WINDOW_MS) in localStorage
//   4. Duplicate suppression — same normalised payload blocked for DEDUP_TTL_MS
//
// Usage:
//   const { checkSpam, recordSuccess, cooldownSecs, honeypotProps } = useFormSpamGuard('newsletter');
//   // In form JSX:  <input {...honeypotProps} />
//   // Before API:   const { blocked, reason } = await checkSpam({ email });
//   // After success: recordSuccess({ email });

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Tuneable constants ────────────────────────────────────────────────────────
const MAX_ATTEMPTS   = 3;            // allowed submissions per window
const WINDOW_MS      = 10 * 60_000; // 10-minute sliding window
const DEDUP_TTL_MS   = 24 * 3_600_000; // 24-hour duplicate block
const SUBMIT_MIN_MS  = 1500;         // minimum ms from mount to submit
const COOLDOWN_TICK  = 1000;         // countdown UI refresh interval (ms)

// ── localStorage key helpers ──────────────────────────────────────────────────
const rateLimitKey  = (id) => `formGuard_rl_${id}`;
const dedupKey      = (id) => `formGuard_dedup_${id}`;
const honeypotName  = (id) => `hp_${id}_website`; // innocuous-looking field name

// ── Payload fingerprint (simple, no crypto needed) ───────────────────────────
function fingerprint(payload) {
  const str = JSON.stringify(
    Object.fromEntries(
      Object.entries(payload)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, String(v || '').toLowerCase().trim()])
    )
  );
  // djb2-style hash, good enough for dedup
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h >>>= 0; // keep unsigned 32-bit
  }
  return h.toString(36);
}

// ── Persistent storage helpers ────────────────────────────────────────────────
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or private mode — degrade gracefully
  }
}

// ── Rate-limit helpers ────────────────────────────────────────────────────────
/**
 * Returns { allowed, cooldownMs } for the given formId.
 * Does NOT mutate state — call recordAttempt() separately.
 */
function checkRateLimit(formId) {
  const now   = Date.now();
  const store = readLS(rateLimitKey(formId), { attempts: [] });
  const valid = (store.attempts || []).filter(ts => now - ts < WINDOW_MS);

  if (valid.length >= MAX_ATTEMPTS) {
    // oldest attempt + window = when the user will be unblocked
    const unblockAt  = Math.min(...valid) + WINDOW_MS;
    const cooldownMs = Math.max(0, unblockAt - now);
    return { allowed: false, cooldownMs };
  }
  return { allowed: true, cooldownMs: 0 };
}

function recordAttempt(formId) {
  const now   = Date.now();
  const store = readLS(rateLimitKey(formId), { attempts: [] });
  const valid = (store.attempts || []).filter(ts => now - ts < WINDOW_MS);
  valid.push(now);
  writeLS(rateLimitKey(formId), { attempts: valid });
}

// ── Dedup helpers ─────────────────────────────────────────────────────────────
function isKnownSuccess(formId, payload) {
  const store = readLS(dedupKey(formId), {});
  const fp    = fingerprint(payload);
  const entry = store[fp];
  if (!entry) return false;
  if (Date.now() - entry.ts > DEDUP_TTL_MS) return false; // expired
  return true;
}

function recordSuccess(formId, payload) {
  const store = readLS(dedupKey(formId), {});
  const fp    = fingerprint(payload);
  // Prune old entries to keep localStorage tidy
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (now - store[key].ts > DEDUP_TTL_MS) delete store[key];
  }
  store[fp] = { ts: now };
  writeLS(dedupKey(formId), store);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * @param {string} formId  Unique identifier for the form, e.g. 'newsletter' or 'contact'
 */
export function useFormSpamGuard(formId) {
  const mountTimeRef   = useRef(Date.now());
  const [honeypotVal, setHoneypotVal] = useState('');
  const [cooldownSecs, setCooldownSecs] = useState(0);

  // Initialise cooldown UI from persisted rate-limit state
  useEffect(() => {
    const { allowed, cooldownMs } = checkRateLimit(formId);
    if (!allowed) {
      setCooldownSecs(Math.ceil(cooldownMs / 1000));
    }
  }, [formId]);

  // Countdown ticker
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const id = setInterval(() => {
      setCooldownSecs(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, COOLDOWN_TICK);
    return () => clearInterval(id);
  }, [cooldownSecs]);

  /**
   * Check all spam layers before allowing a submission.
   * Returns { blocked: boolean, reason: string }.
   * When not blocked, records the attempt in the rate-limit counter.
   */
  const checkSpam = useCallback((payload = {}) => {
    // 1. Honeypot — if filled, silently block
    if (honeypotVal) {
      return { blocked: true, reason: 'honeypot' };
    }

    // 2. Min-time — reject if too fast
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < SUBMIT_MIN_MS) {
      return { blocked: true, reason: 'too_fast' };
    }

    // 3. Duplicate suppression
    if (isKnownSuccess(formId, payload)) {
      return { blocked: true, reason: 'duplicate' };
    }

    // 4. Rate limit
    const { allowed, cooldownMs } = checkRateLimit(formId);
    if (!allowed) {
      const secs = Math.ceil(cooldownMs / 1000);
      setCooldownSecs(secs);
      return { blocked: true, reason: 'rate_limit', cooldownSecs: secs };
    }

    // All checks passed — record the attempt
    recordAttempt(formId);
    return { blocked: false, reason: null };
  }, [formId, honeypotVal]);

  /**
   * Call after a confirmed successful API response to record the dedup fingerprint.
   */
  const markSuccess = useCallback((payload = {}) => {
    recordSuccess(formId, payload);
    // Reset the honeypot value (field stays hidden, just safety)
    setHoneypotVal('');
    // Reset mountTime so the user can re-submit after 5 s (changed payload)
    mountTimeRef.current = Date.now() - SUBMIT_MIN_MS;
  }, [formId]);

  /** Spread these props onto a hidden <input> inside your form. */
  const honeypotProps = {
    name: honeypotName(formId),
    value: honeypotVal,
    onChange: (e) => setHoneypotVal(e.target.value),
    // Visually and semantically hidden — not accessible to screen-readers
    style: {
      position: 'absolute',
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: 0,
      pointerEvents: 'none',
    },
    tabIndex: -1,
    'aria-hidden': 'true',
    autoComplete: 'off',
  };

  return {
    checkSpam,
    recordSuccess: markSuccess,
    cooldownSecs,
    honeypotProps,
  };
}

export default useFormSpamGuard;
