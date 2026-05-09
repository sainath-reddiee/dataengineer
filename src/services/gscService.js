// src/services/gscService.js
// Google Search Console API integration for real rank/impression/click data.
//
// Uses OAuth 2.0 implicit flow (no backend required) — stores access token
// in sessionStorage so it's cleared when the tab closes.
//
// Required setup:
// 1. Go to https://console.cloud.google.com/
// 2. Create OAuth 2.0 Client ID (type: Web application)
// 3. Add authorized JS origin: https://dataengineerhub.blog
// 4. Add authorized redirect URIs for all admin pages (e.g., /admin, /admin/rank-dashboard, etc.)
//    — OAuth is triggered from the sidebar so the redirect lands on whichever page the user was on
// 5. Set VITE_GSC_CLIENT_ID in .env
// 6. In Google Search Console, verify the property and grant the client ID access
//
// Scopes: https://www.googleapis.com/auth/webmasters.readonly

const STORAGE_KEY = 'gsc_access_token';
const PROPERTY_URL = 'https://dataengineerhub.blog/';
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

class GSCService {
    constructor() {
        this.clientId = import.meta.env?.VITE_GSC_CLIENT_ID || '';
    }

    isConfigured() {
        return !!this.clientId;
    }

    getAccessToken() {
        if (typeof sessionStorage === 'undefined') return null;
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            const { token, expiresAt } = JSON.parse(stored);
            if (Date.now() >= expiresAt) {
                sessionStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return token;
        } catch {
            return null;
        }
    }

    setAccessToken(token, expiresInSec = 3600) {
        if (typeof sessionStorage === 'undefined') return;
        const expiresAt = Date.now() + (expiresInSec * 1000);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }));
    }

    clearToken() {
        if (typeof sessionStorage === 'undefined') return;
        sessionStorage.removeItem(STORAGE_KEY);
    }

    isConnected() {
        return !!this.getAccessToken();
    }

    /**
     * Redirect to Google OAuth consent screen.
     * After user approves, they're redirected back with `access_token` in the URL hash.
     * Call handleOAuthCallback() on the redirect page.
     */
    startOAuth() {
        if (!this.isConfigured()) {
            throw new Error('GSC Client ID not configured. Set VITE_GSC_CLIENT_ID in .env');
        }

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: window.location.origin + window.location.pathname,
            response_type: 'token',
            scope: 'https://www.googleapis.com/auth/webmasters.readonly',
            include_granted_scopes: 'true',
            state: 'gsc_connect',
            prompt: 'consent',
        });

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Parse OAuth callback from URL hash fragment.
     * Call this on page load — if access_token is in the hash, store it.
     */
    handleOAuthCallback() {
        if (typeof window === 'undefined') return false;
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token=')) return false;

        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

        if (token) {
            this.setAccessToken(token, expiresIn);
            // Clean the URL
            window.history.replaceState(null, '', window.location.pathname);
            return true;
        }
        return false;
    }

    /**
     * Query Search Console for top pages with impressions, clicks, CTR, position.
     * @param {Object} options - { startDate, endDate, rowLimit }
     * @returns {Promise<Array>} Array of { page, impressions, clicks, ctr, position }
     */
    async queryTopPages({ startDate = null, endDate = null, rowLimit = 100 } = {}) {
        const token = this.getAccessToken();
        if (!token) throw new Error('Not connected to Google Search Console');

        // GSC has a ~3-day data lag — shift endDate back 3 days for accurate data
        const end = endDate || new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0];

        const response = await fetch(
            `${API_BASE}/sites/${encodeURIComponent(PROPERTY_URL)}/searchAnalytics/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startDate: start,
                    endDate: end,
                    dimensions: ['page'],
                    rowLimit,
                }),
            }
        );

        if (response.status === 401) {
            this.clearToken();
            throw new Error('GSC token expired. Please reconnect.');
        }

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`GSC API error: ${response.status} — ${err}`);
        }

        const data = await response.json();
        return (data.rows || []).map(row => ({
            page: row.keys[0],
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
        }));
    }

    /**
     * Query top queries (keywords) for the whole site or specific URL.
     */
    async queryTopKeywords({ startDate = null, endDate = null, rowLimit = 50, url = null } = {}) {
        const token = this.getAccessToken();
        if (!token) throw new Error('Not connected to Google Search Console');

        // GSC has a ~3-day data lag — shift endDate back 3 days for accurate data
        const end = endDate || new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0];

        const body = {
            startDate: start,
            endDate: end,
            dimensions: ['query'],
            rowLimit,
        };

        if (url) {
            body.dimensionFilterGroups = [{
                filters: [{ dimension: 'page', operator: 'equals', expression: url }]
            }];
        }

        const response = await fetch(
            `${API_BASE}/sites/${encodeURIComponent(PROPERTY_URL)}/searchAnalytics/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`GSC API error: ${response.status} — ${err}`);
        }

        const data = await response.json();
        return (data.rows || []).map(row => ({
            query: row.keys[0],
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
        }));
    }
}

export const gscService = new GSCService();
export default gscService;
