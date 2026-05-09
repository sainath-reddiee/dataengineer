/**
 * Gemini AI Service for SEO Toolkit
 * Uses Google Generative AI REST API to avoid dependency issues
 *
 * API key is NOT bundled - admin enters it at runtime via setApiKey().
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SESSION_KEY = 'gemini_api_key';
const REQUEST_TIMEOUT_MS = 30000;

const safeSession = {
    get(key) {
        if (typeof sessionStorage === 'undefined') return '';
        try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
    },
    set(key, value) {
        if (typeof sessionStorage === 'undefined') return;
        try { sessionStorage.setItem(key, value); } catch { /* quota or disabled */ }
    },
    remove(key) {
        if (typeof sessionStorage === 'undefined') return;
        try { sessionStorage.removeItem(key); } catch { /* ignore */ }
    },
};

class GeminiService {
    constructor() {
        // Restore from sessionStorage if the admin already entered it this session
        this._apiKey = safeSession.get(SESSION_KEY);
    }

    get isEnabled() {
        return !!this._apiKey;
    }

    /** Let the admin provide the key at runtime (stored only in sessionStorage). */
    setApiKey(key) {
        this._apiKey = key || '';
        if (key) {
            safeSession.set(SESSION_KEY, key);
        } else {
            safeSession.remove(SESSION_KEY);
        }
    }

    /**
     * Generate content/suggestions using Gemini
     * @param {string} prompt - The user prompt or instruction
     * @param {string} context - The article content or data to analyze
     */
    async generateSuggestion(prompt, context = '') {
        if (!this.isEnabled) {
            throw new Error('Gemini API Key is missing. Use the API key input in the admin panel to configure it.');
        }

        const fullPrompt = `
            Role: Senior SEO Expert
            Task: ${prompt}
            
            Context/Content to Analyze:
            "${context.substring(0, 10000)}" 
            
            Output: Provide a concise, actionable, and direct answer. No fluff.
        `;

        const body = JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
        });

        // Single 429 retry with backoff. Pass key via header (not URL) so it does not leak via referrers/logs.
        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this._apiKey,
                    },
                    body,
                });

                if (response.status === 429 && attempt === 0) {
                    const retryAfter = parseFloat(response.headers.get('Retry-After')) || 1.5;
                    await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
                    continue;
                }

                if (!response.ok) {
                    let message = `Gemini API error (HTTP ${response.status})`;
                    try {
                        const errorData = await response.json();
                        if (errorData?.error?.message) message = errorData.error.message;
                    } catch { /* non-JSON error body */ }
                    throw new Error(message);
                }

                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    const reason = data?.candidates?.[0]?.finishReason || 'empty response';
                    throw new Error(`Gemini returned no content (${reason}). Try rephrasing your prompt.`);
                }
                return text;
            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
                }
                if (attempt === 1) throw error;
            } finally {
                clearTimeout(timer);
            }
        }
        throw lastError || new Error('Gemini request failed.');
    }

    /**
     * Fix a specific SEO issue
     */
    async getQuickFix(issueLabel, currentContent) {
        return this.generateSuggestion(
            `Fix this SEO issue: "${issueLabel}". Provide ONLY the corrected version/text.`,
            currentContent
        );
    }

    /**
     * Generate a Meta Description
     */
    async generateMetaDescription(articleContent) {
        return this.generateSuggestion(
            'Generate a compelling, SEO-optimized meta description (max 160 chars).',
            articleContent
        );
    }
}

export const geminiService = new GeminiService();
export default geminiService;
