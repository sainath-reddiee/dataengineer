/**
 * Gemini AI Service for SEO Toolkit
 *
 * Multi-key + multi-model: every call accepts explicit { keyIndex, model } from
 * the round-robin router (aiService). Keys are fetched on demand from aiKeyRing
 * and cooldowns are tracked per-key (via aiKeyRing) and per-model (via modelRegistry).
 *
 * Model line-up (https://ai.google.dev/gemini-api/docs/models):
 *  - gemini-2.5-flash       : balanced quality + speed
 *  - gemini-2.5-flash-lite  : cheapest/fastest, highest daily quota on free tier
 *  - gemini-2.0-flash       : stable older model, 1M TPM context window
 *  - gemini-2.0-flash-lite  : 30 RPM, lower quality
 *  - gemini-2.5-pro         : highest quality, slow, mostly paid tier
 */

import aiKeyRing from './aiKeyRing';
import modelRegistry from './modelRegistry';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 60000;
const PROVIDER = 'gemini';

const SUPPORTED_MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recommended)' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (fastest)' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (large context)' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (highest quality)' },
];

class GeminiService {
    get isEnabled() {
        return aiKeyRing.getKeyCount(PROVIDER) > 0;
    }

    static get supportedModels() {
        return SUPPORTED_MODELS;
    }

    /** Default-preferred model (router uses as tie-breaker). */
    get model() {
        return DEFAULT_MODEL;
    }

    /** Aggregate cooldown across all keys — UI uses this for status badge. */
    getCooldownSeconds() {
        return aiKeyRing.getMinCooldownSeconds(PROVIDER);
    }

    isRateLimited() {
        return this.getCooldownSeconds() > 0;
    }

    // ─── Legacy single-key facade (so older code paths still work) ────
    setApiKey(key) {
        // Replace whole ring with this single key (called from one-shot UI)
        const existing = aiKeyRing.getKeys(PROVIDER);
        existing.forEach((_, i) => aiKeyRing.removeKey(PROVIDER, 0));
        if (key) aiKeyRing.addKey(PROVIDER, key);
    }
    setModel(/* modelId */) { /* no-op — model now comes per-call from registry */ }

    /**
     * Discover what models the API key can access right now.
     * Hits GET https://generativelanguage.googleapis.com/v1beta/models
     * Returns normalized [{ id, label }] for modelRegistry.syncDiscoveredModels().
     */
    async listAvailableModels({ keyIndex = 0 } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) throw new Error('No Gemini API key configured');
        const response = await fetch(`${API_BASE}models`, {
            method: 'GET',
            headers: { 'x-goog-api-key': key },
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(this._parseError(response.status, data, 'list'));
        }
        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models : [];
        return models
            .filter(m => Array.isArray(m.supportedGenerationMethods)
                && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({
                id: (m.name || '').replace(/^models\//, ''),
                label: m.displayName || undefined,
            }))
            .filter(m => m.id);
    }

    /**
     * Lightweight connectivity test against a specific (keyIndex, model).
     * Used by the AdminLayout Test button.
     */
    async testConnection({ keyIndex = 0, model = DEFAULT_MODEL } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) return { ok: false, error: 'No API key at index ' + keyIndex };
        const start = Date.now();
        try {
            const text = await this._rawCall(model, key, 'Reply with just the word "ok".', { maxTokens: 8, timeoutMs: 15000 });
            return { ok: !!text, model, latencyMs: Date.now() - start, response: text?.slice(0, 40) };
        } catch (e) {
            return { ok: false, model, latencyMs: Date.now() - start, error: e.message };
        }
    }

    /** Main entry point used by aiService router. */
    async generateSuggestion(prompt, context = '', { keyIndex = 0, model = DEFAULT_MODEL } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) throw new Error('No API key at index ' + keyIndex);

        const fullPrompt = `Role: Senior SEO Expert
Task: ${prompt}

Context/Content to Analyze:
"${(context || '').substring(0, 10000)}"

Output: Provide a concise, actionable, and direct answer. No fluff.`;

        try {
            const text = await this._rawCall(model, key, fullPrompt);
            aiKeyRing.clearKeyCooldown(PROVIDER, keyIndex);
            modelRegistry.clearModelCooldown(PROVIDER, model);
            return text;
        } catch (error) {
            this._classifyAndMark(error, keyIndex, model);
            throw error;
        }
    }

    async getQuickFix(issueLabel, currentContent, opts) {
        return this.generateSuggestion(
            `Fix this SEO issue: "${issueLabel}". Provide ONLY the corrected version/text.`,
            currentContent,
            opts
        );
    }

    async generateMetaDescription(articleContent, opts) {
        return this.generateSuggestion(
            'Generate a compelling, SEO-optimized meta description (max 160 chars).',
            articleContent,
            opts
        );
    }

    /** Inspect cooldown source from error message and apply correct cooldown. */
    _classifyAndMark(error, keyIndex, model) {
        const msg = error?.message || '';
        // Rate limit — applies to this specific key
        const rateMatch = msg.match(/wait\s+(\d+)s|retry.*?in\s+(\d+(?:\.\d+)?)s/i);
        if (/rate.?limit|429|quota/i.test(msg)) {
            const sec = rateMatch ? Math.ceil(parseFloat(rateMatch[1] || rateMatch[2])) : 60;
            aiKeyRing.markKeyCooldown(PROVIDER, keyIndex, sec);
            return;
        }
        // Model not found — applies to this specific model (10 min cooldown)
        if (/not found|404/i.test(msg)) {
            modelRegistry.markModelCooldown(PROVIDER, model, 600);
            return;
        }
        // Auth errors — likely a bad key, mark long cooldown so router stops trying it
        if (/API key|401|403|invalid/i.test(msg)) {
            aiKeyRing.markKeyCooldown(PROVIDER, keyIndex, 3600);
        }
    }

    /** Low-level fetch — fully stateless, takes key + model directly. */
    async _rawCall(model, apiKey, prompt, { maxTokens, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const body = { contents: [{ parts: [{ text: prompt }] }] };
            if (maxTokens) body.generationConfig = { maxOutputTokens: maxTokens };

            const response = await fetch(`${API_BASE}models/${model}:generateContent`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                if (response.status === 429) {
                    const retrySec = this._extractRetryDelay(data) || 30;
                    throw new Error(`Rate limited — wait ${retrySec}s. ${data?.error?.message || ''}`.trim());
                }
                throw new Error(this._parseError(response.status, data, model));
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                const reason = data?.candidates?.[0]?.finishReason || 'empty response';
                throw new Error(`Empty response (${reason}). Try rephrasing.`);
            }
            return text;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${timeoutMs / 1000}s. Try a faster model (e.g. gemini-2.5-flash-lite) or a shorter prompt.`);
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    _parseError(status, data, model) {
        const msg = data?.error?.message || '';
        if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(msg)) {
            return 'API key invalid. Get a new one at aistudio.google.com/apikey.';
        }
        if (status === 403) return 'Access denied. Enable Generative Language API in your Google Cloud project.';
        if (status === 404) return `Model "${model}" not found for this API key.`;
        return msg || `HTTP ${status}`;
    }

    _extractRetryDelay(data) {
        const details = data?.error?.details || [];
        for (const d of details) {
            const delay = d?.retryDelay;
            if (typeof delay === 'string') {
                const m = delay.match(/^(\d+(?:\.\d+)?)s$/);
                if (m) return Math.ceil(parseFloat(m[1]));
            }
        }
        return null;
    }
}

export const geminiService = new GeminiService();
export default geminiService;
