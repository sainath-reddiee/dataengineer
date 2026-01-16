/**
 * Service to manage SEO scan history using localStorage
 * tracks scores over time to show trends (improvement/decline)
 */

const STORAGE_KEY = 'seo_toolkit_history_v1';

class ScanHistoryService {
    constructor() {
        this.history = this._load();
    }

    _load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load SEO history', e);
            return {};
        }
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save SEO history', e);
        }
    }

    /**
     * Record a new scan result
     * @param {string} slug - Article slug or URL identifier
     * @param {number} score - Overall SEO score
     * @param {object} details - Optional details (pseo, aeo, geo scores)
     */
    addScan(slug, score, details = {}) {
        if (!slug) return;

        if (!this.history[slug]) {
            this.history[slug] = [];
        }

        const entry = {
            timestamp: Date.now(),
            score,
            ...details
        };

        // Keep only last 10 scans per article to save space
        this.history[slug].unshift(entry);
        this.history[slug] = this.history[slug].slice(0, 10);

        this._save();
        return entry;
    }

    /**
     * Get history for a specific article
     */
    getHistory(slug) {
        return this.history[slug] || [];
    }

    /**
     * Get the latest scan for an article
     */
    getLatest(slug) {
        const history = this.getHistory(slug);
        return history.length > 0 ? history[0] : null;
    }

    /**
     * Get the trend (difference between latest and previous score)
     * returns null if only 1 or 0 scans exist
     */
    getTrend(slug, currentScore) {
        const history = this.getHistory(slug);

        // If no history, or current score matches latest history (just saved), look at the one before
        // This handles cases where we might or might not have saved the current scan yet

        if (history.length === 0) return 0;

        const latest = history[0];

        // If we just saved the current score, compare with the one before it
        if (latest.score === currentScore && Math.abs(latest.timestamp - Date.now()) < 5000) {
            return history.length > 1 ? currentScore - history[1].score : 0;
        }

        // otherwise compare current live score with stored latest
        return currentScore - latest.score;
    }

    /**
     * Get all scans across all URLs, sorted by date (newest first)
     */
    getAllScans() {
        let allScans = [];
        Object.entries(this.history).forEach(([slug, scans]) => {
            scans.forEach(scan => {
                allScans.push({
                    ...scan,
                    url: slug // Ensure URL is attached to the entry
                });
            });
        });
        return allScans.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = {};
        this._save();
    }
}

export const scanHistory = new ScanHistoryService();
export default scanHistory;
