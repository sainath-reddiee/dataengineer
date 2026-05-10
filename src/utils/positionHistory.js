// src/utils/positionHistory.js
// Track GSC positions over time in localStorage to detect trends (improving/declining/stable).
// Stores last 30 daily snapshots per article slug.

const STORAGE_KEY = 'position_history_v1';
const MAX_DAYS = 30;

function loadHistory() {
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveHistory(history) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch { /* quota exceeded */ }
}

function todayStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Record today's position for an article.
 * @param {string} slug
 * @param {number} position
 */
export function recordPosition(slug, position) {
    if (!slug || !Number.isFinite(position)) return;
    const history = loadHistory();
    if (!history[slug]) history[slug] = [];

    const today = todayStr();
    // Don't double-record same day; update if exists
    const existingIdx = history[slug].findIndex(e => e.date === today);
    if (existingIdx >= 0) {
        history[slug][existingIdx].position = position;
    } else {
        history[slug].push({ date: today, position });
    }

    // Trim to last MAX_DAYS
    history[slug] = history[slug].slice(-MAX_DAYS);
    saveHistory(history);
}

/**
 * Get position history for an article.
 * @param {string} slug
 * @returns {Array<{date, position}>}
 */
export function getHistory(slug) {
    const history = loadHistory();
    return history[slug] || [];
}

/**
 * Compute trend over the recorded history.
 * @param {string} slug
 * @returns {Object} { trend: 'improving'|'declining'|'stable'|'new', change, oldest, newest, sparkline }
 */
export function getTrend(slug) {
    const entries = getHistory(slug);
    if (entries.length < 2) {
        return { trend: 'new', change: 0, oldest: null, newest: entries[0]?.position || null, sparkline: entries.map(e => e.position) };
    }
    const oldest = entries[0].position;
    const newest = entries[entries.length - 1].position;
    const change = oldest - newest; // Positive = position number went DOWN = ranking went UP

    let trend = 'stable';
    if (change >= 2) trend = 'improving';
    else if (change <= -2) trend = 'declining';

    return {
        trend,
        change: Number(change.toFixed(1)),
        oldest: Number(oldest.toFixed(1)),
        newest: Number(newest.toFixed(1)),
        sparkline: entries.map(e => e.position),
    };
}

/**
 * Bulk record positions from GSC data.
 * @param {Array<{slug, position}>} entries
 */
export function recordBulk(entries) {
    if (!Array.isArray(entries)) return;
    entries.forEach(e => recordPosition(e.slug, e.position));
}

export default { recordPosition, getHistory, getTrend, recordBulk };
