// src/utils/rankTracker.js
// LocalStorage-backed rank position tracker for blog articles.
// Lets the admin manually log Google rank positions for target keywords
// over time and see trends without any external API.

const STORAGE_KEY = 'rank_tracker_v1';

function readStore() {
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeStore(data) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded */ }
}

/**
 * Get all tracked articles.
 * Shape: { slug: { targetKeyword, history: [{ date, position }], currentPosition, bestPosition, trend } }
 */
export function getAllRanks() {
    return readStore();
}

/**
 * Get rank data for a specific article.
 */
export function getRank(slug) {
    const store = readStore();
    return store[slug] || null;
}

/**
 * Set target keyword for an article.
 */
export function setTargetKeyword(slug, keyword) {
    const store = readStore();
    if (!store[slug]) {
        store[slug] = {
            targetKeyword: keyword,
            history: [],
            currentPosition: null,
            bestPosition: null,
            trend: 'stable',
        };
    } else {
        store[slug].targetKeyword = keyword;
    }
    writeStore(store);
    return store[slug];
}

/**
 * Log a new rank position. Pass position as a number (1-100+).
 * Pass null to remove tracking for this slug.
 */
export function logRank(slug, position, date = null) {
    const store = readStore();
    const dateStr = date || new Date().toISOString().split('T')[0];

    if (!store[slug]) {
        store[slug] = {
            targetKeyword: '',
            history: [],
            currentPosition: position,
            bestPosition: position,
            trend: 'stable',
        };
    }

    const entry = store[slug];
    // Dedupe by date (replace existing entry for the same day)
    entry.history = entry.history.filter(h => h.date !== dateStr);
    entry.history.push({ date: dateStr, position });
    entry.history.sort((a, b) => a.date.localeCompare(b.date));

    // Keep last 90 data points
    if (entry.history.length > 90) {
        entry.history = entry.history.slice(-90);
    }

    entry.currentPosition = position;
    entry.bestPosition = entry.history.reduce(
        (best, h) => h.position && h.position < best ? h.position : best,
        position
    );

    // Compute trend from last 2 entries
    const recent = entry.history.slice(-2);
    if (recent.length >= 2) {
        const delta = recent[1].position - recent[0].position;
        entry.trend = delta < -1 ? 'up' : delta > 1 ? 'down' : 'stable';
    }

    writeStore(store);
    return entry;
}

/**
 * Remove tracking for an article.
 */
export function removeRank(slug) {
    const store = readStore();
    delete store[slug];
    writeStore(store);
}

/**
 * Export all data as JSON for backup.
 */
export function exportRanks() {
    return JSON.stringify(readStore(), null, 2);
}

/**
 * Import rank data from JSON (overwrites existing).
 */
export function importRanks(json) {
    try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') {
            writeStore(parsed);
            return true;
        }
    } catch { /* invalid JSON */ }
    return false;
}

/**
 * Get aggregate stats across all tracked articles.
 */
export function getAggregateStats() {
    const store = readStore();
    const entries = Object.values(store);
    const tracked = entries.length;
    const onPage1 = entries.filter(e => e.currentPosition && e.currentPosition <= 10).length;
    const onPage2 = entries.filter(e => e.currentPosition && e.currentPosition > 10 && e.currentPosition <= 20).length;
    const notRanking = entries.filter(e => !e.currentPosition || e.currentPosition > 100).length;
    const improving = entries.filter(e => e.trend === 'up').length;
    const declining = entries.filter(e => e.trend === 'down').length;

    return { tracked, onPage1, onPage2, notRanking, improving, declining };
}
