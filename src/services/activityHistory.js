/**
 * Unified Activity History Service
 * 
 * Logs admin tool activities to localStorage so users can review past actions,
 * compare results over time, and resume previous work.
 * 
 * Pattern follows scanHistory.js — class-based, localStorage, capped entries.
 */

const STORAGE_KEY = 'admin_activity_history_v1';
const MAX_ENTRIES = 200;

class ActivityHistoryService {
    constructor() {
        this.entries = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load activity history', e);
            return [];
        }
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('Activity history: quota exceeded, trimming...');
                this._cleanup();
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
                } catch {
                    console.error('Activity history: still full after cleanup');
                }
            } else {
                console.error('Failed to save activity history', e);
            }
        }
    }

    _cleanup() {
        // Keep only the most recent half
        this.entries = this.entries.slice(0, Math.floor(MAX_ENTRIES / 2));
    }

    _makeId() {
        return `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    /**
     * Log a new activity entry.
     * 
     * @param {string} tool - Tool identifier (e.g., 'smart-linking', 'trend-intelligence')
     * @param {string} action - Action performed (e.g., 'analyzed', 'discovered-trends')
     * @param {Object} details - { slug?, title, data? }
     *   - slug: article slug if applicable
     *   - title: human-readable summary
     *   - data: tool-specific payload (AI response, suggestions, etc.)
     * @returns {Object} The created entry
     */
    addEntry(tool, action, { slug = null, title = '', data = null } = {}) {
        const entry = {
            id: this._makeId(),
            tool,
            action,
            slug,
            title,
            data,
            timestamp: new Date().toISOString(),
        };

        // Prepend (newest first)
        this.entries.unshift(entry);

        // Cap at MAX_ENTRIES
        if (this.entries.length > MAX_ENTRIES) {
            this.entries = this.entries.slice(0, MAX_ENTRIES);
        }

        this._save();
        return entry;
    }

    /**
     * Get all history entries, optionally filtered.
     * 
     * @param {Object} options - { tool?, slug?, limit? }
     * @returns {Array} Filtered entries (newest first)
     */
    getHistory({ tool = null, slug = null, limit = null } = {}) {
        let results = this.entries;

        if (tool) {
            results = results.filter(e => e.tool === tool);
        }
        if (slug) {
            results = results.filter(e => e.slug === slug);
        }
        if (limit && limit > 0) {
            results = results.slice(0, limit);
        }

        return results;
    }

    /**
     * Get entries for a specific tool.
     * @param {string} tool
     * @param {number} limit
     * @returns {Array}
     */
    getByTool(tool, limit = 50) {
        return this.getHistory({ tool, limit });
    }

    /**
     * Get entries for a specific article (cross-tool view).
     * @param {string} slug
     * @param {number} limit
     * @returns {Array}
     */
    getBySlug(slug, limit = 50) {
        return this.getHistory({ slug, limit });
    }

    /**
     * Get a single entry by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getEntry(id) {
        return this.entries.find(e => e.id === id) || null;
    }

    /**
     * Get the most recent entry for a tool (useful for "resume" features).
     * @param {string} tool
     * @returns {Object|null}
     */
    getLatest(tool) {
        return this.entries.find(e => e.tool === tool) || null;
    }

    /**
     * Delete a specific entry.
     * @param {string} id
     */
    deleteEntry(id) {
        this.entries = this.entries.filter(e => e.id !== id);
        this._save();
    }

    /**
     * Clear all history.
     */
    clearHistory() {
        this.entries = [];
        this._save();
    }

    /**
     * Get total count of entries.
     * @returns {number}
     */
    getCount() {
        return this.entries.length;
    }

    /**
     * Get unique tool names that have history entries.
     * @returns {string[]}
     */
    getTools() {
        return [...new Set(this.entries.map(e => e.tool))];
    }
}

export const activityHistory = new ActivityHistoryService();
export default activityHistory;
