// src/utils/engagementTracker.js
// Per-landing engagement funnel. Builds on the same pattern as aiReferralTracker:
// SSR-safe, session-guarded, bounded localStorage, consent-gated GA4 mirror.
//
// Signals captured per landing (session-scoped):
//   - referral source bucket (ai | organic | direct | other)
//   - entry path
//   - max scroll depth reached before next navigation / unload
//   - whether a 2nd route was visited (internal-click aka "click inside")
//   - whether newsletter was submitted (read via window event from the form)
//
// Exposed aggregate shape (for the admin panel):
//   byEntry:   { "/articles/x": { landings, secondClicks, scrollSum, landingsWithScroll } }
//   bySource:  { ai: {...}, organic: {...}, direct: {...}, other: {...} }
//
// Nothing PII is stored. First-party only. No new third-party scripts.

import { trackEvent } from './analytics';
import { getConsentStatus } from '../components/CookieConsent';
import { detectAiReferrer } from './aiReferralTracker';

const STORAGE_KEY = 'engagement_v1';
const LANDING_FLAG = 'engagement_landing_v1';
const MAX_ENTRIES = 500;
const RETAIN_DAYS = 60;

const safeParse = (raw) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
};

const empty = () => ({
    byEntry: {},    // { path: { landings, secondClicks, newsletter, scrollSum, landingsWithScroll } }
    bySource: {},   // { ai|organic|direct|other: same shape }
    byDay: {},      // { YYYY-MM-DD: landings }
    totals: { landings: 0, secondClicks: 0, newsletter: 0 },
    firstSeen: null,
    lastSeen: null,
});

const normalize = (raw) => {
    if (!raw || typeof raw !== 'object') return empty();
    return {
        byEntry:   raw.byEntry   && typeof raw.byEntry   === 'object' ? raw.byEntry   : {},
        bySource:  raw.bySource  && typeof raw.bySource  === 'object' ? raw.bySource  : {},
        byDay:     raw.byDay     && typeof raw.byDay     === 'object' ? raw.byDay     : {},
        totals:    raw.totals    && typeof raw.totals    === 'object' ? raw.totals    : empty().totals,
        firstSeen: raw.firstSeen || null,
        lastSeen:  raw.lastSeen  || null,
    };
};

const todayUtcKey = () => new Date().toISOString().slice(0, 10);

const pruneOldDays = (byDay) => {
    const cutoff = Date.now() - RETAIN_DAYS * 86400000;
    const out = {};
    Object.entries(byDay).forEach(([day, n]) => {
        const t = Date.parse(day + 'T00:00:00Z');
        if (!isNaN(t) && t >= cutoff) out[day] = n;
    });
    return out;
};

const classifySource = () => {
    if (typeof document === 'undefined') return 'direct';
    const ai = detectAiReferrer();
    if (ai) return 'ai';
    const ref = document.referrer || '';
    if (!ref) return 'direct';
    try {
        const u = new URL(ref);
        const host = u.hostname;
        if (typeof window !== 'undefined' && host === window.location.hostname) return 'internal';
        if (/google|bing|duckduckgo|yandex|baidu|ecosia|yahoo/i.test(host)) return 'organic';
        return 'other';
    } catch {
        return 'other';
    }
};

const bumpBucket = (bucket, field, by = 1) => {
    bucket[field] = (bucket[field] || 0) + by;
};

const readStats = () => {
    if (typeof window === 'undefined') return empty();
    try { return normalize(safeParse(window.localStorage.getItem(STORAGE_KEY))); }
    catch { return empty(); }
};

const writeStats = (stats) => {
    if (typeof window === 'undefined') return;
    try {
        stats.byDay = pruneOldDays(stats.byDay);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch { /* quota — ignore */ }
};

/* ---------- landing state (in-memory + sessionStorage) ---------- */

let currentLanding = null; // { path, source, maxScroll, secondClick, started }

const readLandingFlag = () => {
    if (typeof window === 'undefined') return null;
    try { return safeParse(window.sessionStorage.getItem(LANDING_FLAG)); }
    catch { return null; }
};

const writeLandingFlag = (v) => {
    if (typeof window === 'undefined') return;
    try {
        if (v === null) window.sessionStorage.removeItem(LANDING_FLAG);
        else window.sessionStorage.setItem(LANDING_FLAG, JSON.stringify(v));
    } catch { /* ignore */ }
};

/**
 * Must be called from RouteChangeTracker on every route change.
 * First call in a tab = the landing. Subsequent calls = a "second click"
 * that we credit back to the original landing before rotating.
 */
export const recordEngagementRoute = () => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname || '/';

    if (!currentLanding) {
        // Attempt to restore from sessionStorage (e.g. after reload on same tab)
        const saved = readLandingFlag();
        if (saved && saved.path && saved.started) {
            currentLanding = {
                path: saved.path,
                source: saved.source || 'direct',
                maxScroll: saved.maxScroll || 0,
                secondClick: !!saved.secondClick,
                started: saved.started,
            };
        } else {
            // New landing
            const source = classifySource();
            currentLanding = { path, source, maxScroll: 0, secondClick: false, started: Date.now() };
            writeLandingFlag(currentLanding);

            const stats = readStats();
            const nowIso = new Date().toISOString();
            const day = todayUtcKey();

            if (!stats.byEntry[path])   stats.byEntry[path]   = { landings: 0, secondClicks: 0, newsletter: 0, scrollSum: 0, landingsWithScroll: 0 };
            if (!stats.bySource[source]) stats.bySource[source] = { landings: 0, secondClicks: 0, newsletter: 0, scrollSum: 0, landingsWithScroll: 0 };
            bumpBucket(stats.byEntry[path], 'landings');
            bumpBucket(stats.bySource[source], 'landings');
            bumpBucket(stats.totals, 'landings');
            bumpBucket(stats.byDay, day);
            stats.firstSeen = stats.firstSeen || nowIso;
            stats.lastSeen = nowIso;
            writeStats(stats);

            try {
                if (getConsentStatus() === 'accepted') {
                    trackEvent({
                        action: 'engagement_landing',
                        category: 'acquisition',
                        label: `${source}|${path}`,
                        value: 1,
                    });
                }
            } catch { /* ignore */ }

            return;
        }
    }

    // A second (or later) route change => credit a second-click to the landing.
    if (!currentLanding.secondClick && path !== currentLanding.path) {
        currentLanding.secondClick = true;
        writeLandingFlag(currentLanding);

        const stats = readStats();
        const landingPath = currentLanding.path;
        const source = currentLanding.source;
        if (stats.byEntry[landingPath])  bumpBucket(stats.byEntry[landingPath], 'secondClicks');
        if (stats.bySource[source])      bumpBucket(stats.bySource[source], 'secondClicks');
        bumpBucket(stats.totals, 'secondClicks');
        writeStats(stats);

        try {
            if (getConsentStatus() === 'accepted') {
                trackEvent({
                    action: 'engagement_second_click',
                    category: 'engagement',
                    label: `${source}|${landingPath}`,
                    value: 1,
                });
            }
        } catch { /* ignore */ }
    }
};

/**
 * Call once on bootstrap. Wires a scroll listener that records the max scroll
 * depth for the current landing into the aggregate stats on unload.
 */
let bootstrapped = false;
export const bootstrapEngagementListeners = () => {
    if (typeof window === 'undefined' || bootstrapped) return;
    bootstrapped = true;

    const onScroll = () => {
        if (!currentLanding) return;
        const h = document.documentElement;
        const scrolled = (h.scrollTop + window.innerHeight) / Math.max(1, h.scrollHeight);
        const pct = Math.min(100, Math.round(scrolled * 100));
        if (pct > currentLanding.maxScroll) {
            currentLanding.maxScroll = pct;
            writeLandingFlag(currentLanding);
        }
    };

    const flush = () => {
        if (!currentLanding) return;
        const stats = readStats();
        const landingPath = currentLanding.path;
        const source = currentLanding.source;
        const scroll = currentLanding.maxScroll || 0;
        if (scroll > 0) {
            if (stats.byEntry[landingPath]) {
                stats.byEntry[landingPath].scrollSum = (stats.byEntry[landingPath].scrollSum || 0) + scroll;
                stats.byEntry[landingPath].landingsWithScroll = (stats.byEntry[landingPath].landingsWithScroll || 0) + 1;
            }
            if (stats.bySource[source]) {
                stats.bySource[source].scrollSum = (stats.bySource[source].scrollSum || 0) + scroll;
                stats.bySource[source].landingsWithScroll = (stats.bySource[source].landingsWithScroll || 0) + 1;
            }
        }
        writeStats(stats);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    // Newsletter submission signal — listens for a custom event the newsletter
    // form can dispatch. Also updates stats if the form uses gtag directly.
    window.addEventListener('newsletterSignup', () => {
        if (!currentLanding) return;
        const stats = readStats();
        const landingPath = currentLanding.path;
        const source = currentLanding.source;
        if (stats.byEntry[landingPath])  bumpBucket(stats.byEntry[landingPath], 'newsletter');
        if (stats.bySource[source])      bumpBucket(stats.bySource[source], 'newsletter');
        bumpBucket(stats.totals, 'newsletter');
        writeStats(stats);
    });
};

/** Read aggregate stats for admin panel. Never throws. */
export const getEngagementStats = () => readStats();

/** Admin reset. Clears local stats + session landing flag so next route = fresh landing. */
export const clearEngagementStats = () => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    try { window.sessionStorage.removeItem(LANDING_FLAG); } catch { /* ignore */ }
    currentLanding = null;
};

/** Top N entries by landings, with derived CTR-inside and avg scroll. */
export const getTopEntries = (n = 10) => {
    const stats = readStats();
    const list = Object.entries(stats.byEntry).map(([path, v]) => {
        const avgScroll = v.landingsWithScroll > 0
            ? Math.round(v.scrollSum / v.landingsWithScroll)
            : 0;
        const clickRate = v.landings > 0
            ? Math.round((v.secondClicks / v.landings) * 100)
            : 0;
        return { path, ...v, avgScroll, clickRate };
    });
    list.sort((a, b) => b.landings - a.landings);
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    return list.slice(0, n);
};

/** Breakdown per source with derived engagement metrics. */
export const getSourceBreakdown = () => {
    const stats = readStats();
    return Object.entries(stats.bySource).map(([source, v]) => {
        const avgScroll = v.landingsWithScroll > 0
            ? Math.round(v.scrollSum / v.landingsWithScroll)
            : 0;
        const clickRate = v.landings > 0
            ? Math.round((v.secondClicks / v.landings) * 100)
            : 0;
        const newsletterRate = v.landings > 0
            ? Math.round((v.newsletter / v.landings) * 1000) / 10
            : 0;
        return { source, ...v, avgScroll, clickRate, newsletterRate };
    }).sort((a, b) => b.landings - a.landings);
};
