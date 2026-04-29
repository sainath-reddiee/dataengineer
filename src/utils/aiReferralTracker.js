// src/utils/aiReferralTracker.js
// Tracks referrals from AI assistants / LLM chat products.
//
// Two signals are combined:
//   1. document.referrer host match against a known AI source map.
//   2. utm_source query param (AI products increasingly tag outbound links).
//
// When a landing is classified as an AI referral, we:
//   - Fire a GA4 `ai_referral` event via trackEvent (GDPR-gated by existing consent).
//   - Write a bounded rolling record to localStorage for the admin panel to read
//     without requiring a backend. Works offline, per-device.

import { trackEvent } from './analytics';
import { getConsentStatus } from '../components/CookieConsent';

const STORAGE_KEY = 'ai_referrals_v1';
const SESSION_FLAG = 'ai_ref_checked';
const MAX_ENTRIES = 1000;
const RETAIN_DAYS = 60;

// Known AI assistant / LLM surfaces. Keep regexes anchored to the host.
// The label on the left is the normalized "source" we bucket in reports.
export const AI_SOURCES = {
  chatgpt:    /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/i,
  perplexity: /(^|\.)perplexity\.ai$/i,
  claude:     /(^|\.)claude\.ai$|(^|\.)claude\.com$/i,
  gemini:     /(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/i,
  copilot:    /(^|\.)copilot\.microsoft\.com$|(^|\.)bing\.com$/i, // bing.com refined by path guard
  you:        /(^|\.)you\.com$/i,
  phind:      /(^|\.)phind\.com$/i,
  ddgchat:    /(^|\.)duck\.ai$|(^|\.)duckduckgo\.com$/i, // duckduckgo.com refined by path guard
  poe:        /(^|\.)poe\.com$/i,
  kagi:       /(^|\.)kagi\.com$/i,       // only /assistant path; refined below
  meta:       /(^|\.)meta\.ai$/i,
};

// Additional path guards — some hosts only count as AI when a chat path is used.
// Keyed by { source, hostRegex } so we only apply the guard to the ambiguous host.
const PATH_GUARDS = [
  { source: 'copilot', host: /(^|\.)bing\.com$/i,       path: /\/(chat|copilotsearch)/i },
  { source: 'ddgchat', host: /(^|\.)duckduckgo\.com$/i, path: /\/chat/i },
  { source: 'kagi',    host: /(^|\.)kagi\.com$/i,       path: /\/assistant/i },
];

// utm_source values that unambiguously signal an LLM-driven click.
// Values are lowercased and matched exactly, so dotted hostnames are omitted.
const UTM_MAP = {
  chatgpt: 'chatgpt',
  openai: 'chatgpt',
  perplexity: 'perplexity',
  claude: 'claude',
  anthropic: 'claude',
  gemini: 'gemini',
  bard: 'gemini',
  copilot: 'copilot',
  bingchat: 'copilot',
  you: 'you',
  phind: 'phind',
  poe: 'poe',
  kagi: 'kagi',
  meta: 'meta',
  metaai: 'meta',
  duckai: 'ddgchat',
};

const todayUtcKey = () => new Date().toISOString().slice(0, 10);

const safeParse = (raw) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const emptyStats = () => ({
  total: 0,
  bySource: {},      // { chatgpt: 12, perplexity: 5 }
  byPage: {},        // { "/compare/mwaa-vs-cloud-composer": 7 }
  byDay: {},         // { "2026-04-29": 3 }
  entries: [],       // bounded list: [{ ts, source, host, page, utm }]
  firstSeen: null,
  lastSeen: null,
});

// Merge a possibly-partial stored object with empty defaults so downstream code
// can safely index bySource / byDay / byPage without null checks.
const normalizeStats = (raw) => {
  if (!raw || typeof raw !== 'object') return emptyStats();
  return {
    total:     typeof raw.total === 'number' ? raw.total : 0,
    bySource:  raw.bySource && typeof raw.bySource === 'object' ? raw.bySource : {},
    byPage:    raw.byPage   && typeof raw.byPage   === 'object' ? raw.byPage   : {},
    byDay:     raw.byDay    && typeof raw.byDay    === 'object' ? raw.byDay    : {},
    entries:   Array.isArray(raw.entries) ? raw.entries : [],
    firstSeen: raw.firstSeen || null,
    lastSeen:  raw.lastSeen  || null,
  };
};

const pruneOldDays = (byDay) => {
  const cutoff = Date.now() - RETAIN_DAYS * 86400000;
  const out = {};
  Object.entries(byDay).forEach(([day, n]) => {
    const t = Date.parse(day + 'T00:00:00Z');
    if (!isNaN(t) && t >= cutoff) out[day] = n;
  });
  return out;
};

/**
 * Inspect document.referrer + location.search and decide whether this landing
 * came from a known AI assistant. Returns { source, host, utm } or null.
 */
export const detectAiReferrer = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  // 1) utm_source wins when explicitly present.
  try {
    const params = new URLSearchParams(window.location.search || '');
    const utm = (params.get('utm_source') || '').toLowerCase().trim();
    if (utm && UTM_MAP[utm]) {
      return { source: UTM_MAP[utm], host: utm, utm };
    }
  } catch { /* ignore */ }

  // 2) document.referrer host match.
  const ref = document.referrer || '';
  if (!ref) return null;

  let host = '';
  let path = '';
  try {
    const u = new URL(ref);
    host = u.hostname;
    path = u.pathname || '';
  } catch {
    return null;
  }

  for (const [source, re] of Object.entries(AI_SOURCES)) {
    if (!re.test(host)) continue;
    // Apply any path guards that target this specific (source, host) pair.
    const guard = PATH_GUARDS.find(g => g.source === source && g.host.test(host));
    if (guard && !guard.path.test(path)) continue;
    return { source, host, utm: null };
  }
  return null;
};

/**
 * Call once per landing (guarded by sessionStorage). Records the AI referral
 * into localStorage + emits a GA4 event if consent has been granted.
 */
export const recordReferralIfAny = () => {
  if (typeof window === 'undefined') return null;

  // Session guard — only inspect once per tab session.
  try {
    if (window.sessionStorage.getItem(SESSION_FLAG) === '1') return null;
    window.sessionStorage.setItem(SESSION_FLAG, '1');
  } catch { /* sessionStorage may be unavailable; continue */ }

  const hit = detectAiReferrer();
  if (!hit) return null;

  const page = (window.location && window.location.pathname) || '/';
  const day = todayUtcKey();
  const nowIso = new Date().toISOString();

  // GA4 event — only if user has granted consent (otherwise trackEvent no-ops
  // because gtag isn't loaded, but we also respect the explicit gate).
  try {
    if (getConsentStatus() === 'accepted') {
      trackEvent({
        action: 'ai_referral',
        category: 'acquisition',
        label: `${hit.source}|${page}`,
        value: 1,
      });
    }
  } catch { /* ignore */ }

  // localStorage rolling record — always written (no PII, first-party, no cookies).
  try {
    const stats = normalizeStats(safeParse(window.localStorage.getItem(STORAGE_KEY)));
    stats.total = (stats.total || 0) + 1;
    stats.bySource[hit.source] = (stats.bySource[hit.source] || 0) + 1;
    stats.byPage[page] = (stats.byPage[page] || 0) + 1;
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    stats.byDay = pruneOldDays(stats.byDay);
    stats.entries.push({
      ts: nowIso,
      source: hit.source,
      host: hit.host,
      page,
      utm: hit.utm || null,
    });
    if (stats.entries.length > MAX_ENTRIES) {
      stats.entries = stats.entries.slice(-MAX_ENTRIES);
    }
    stats.firstSeen = stats.firstSeen || nowIso;
    stats.lastSeen = nowIso;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* quota / disabled storage — ignore */ }

  return hit;
};

/** Reader for the admin panel. Always returns a stats object (never null). */
export const getLocalReferralStats = () => {
  if (typeof window === 'undefined') return emptyStats();
  try {
    return normalizeStats(safeParse(window.localStorage.getItem(STORAGE_KEY)));
  } catch {
    return emptyStats();
  }
};

/** Admin reset button. */
export const clearLocalReferralStats = () => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};

/** Helper used by the admin panel sparkline. Returns [{day, count}] for last N days. */
export const getLastNDays = (n = 30) => {
  const stats = getLocalReferralStats();
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: stats.byDay[key] || 0 });
  }
  return out;
};
