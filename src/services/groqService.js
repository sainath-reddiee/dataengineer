/**
 * Groq AI Service for SEO Toolkit
 *
 * Multi-key + multi-model. Each call accepts { keyIndex, model } from the
 * round-robin router (aiService). Per-key cooldowns live in aiKeyRing,
 * per-model cooldowns live in modelRegistry.
 *
 * Free tier: ~30 RPM, 12K TPM per key. Multi-key rotation is the highest-leverage
 * way to increase throughput without paying.
 */

import aiKeyRing from './aiKeyRing';
import modelRegistry from './modelRegistry';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 30000;
const PROVIDER = 'groq';

const SUPPORTED_MODELS = [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (recommended)' },
    { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant (fastest)' },
    { id: 'gpt-oss-120b',            label: 'GPT-OSS 120B' },
    { id: 'gpt-oss-20b',             label: 'GPT-OSS 20B' },
    { id: 'kimi-k2-instruct',        label: 'Kimi K2 Instruct' },
];

class GroqService {
    get isEnabled() {
        return aiKeyRing.getKeyCount(PROVIDER) > 0;
    }

    get model() {
        return DEFAULT_MODEL;
    }

    static get supportedModels() {
        return SUPPORTED_MODELS;
    }

    getCooldownSeconds() {
        return aiKeyRing.getMinCooldownSeconds(PROVIDER);
    }

    isRateLimited() {
        return this.getCooldownSeconds() > 0;
    }

    // Legacy single-key facade
    setApiKey(key) {
        const existing = aiKeyRing.getKeys(PROVIDER);
        existing.forEach((_, i) => aiKeyRing.removeKey(PROVIDER, 0));
        if (key) aiKeyRing.addKey(PROVIDER, key);
    }

    /**
     * Discover what models the API key can access right now.
     * Hits GET https://api.groq.com/openai/v1/models (OpenAI-compatible).
     * Returns normalized [{ id, label }] for modelRegistry.syncDiscoveredModels().
     */
    async listAvailableModels({ keyIndex = 0 } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) throw new Error('No Groq API key configured');
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${key}` },
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const models = Array.isArray(data.data) ? data.data : [];
        return models
            // Filter to chat/completion-capable models — exclude embeddings, tts, whisper, etc.
            .filter(m => m.id && !/whisper|embed|tts|guard|prompt-guard/i.test(m.id))
            .map(m => ({ id: m.id, label: undefined })); // label synthesized by registry
    }

    /**
     * Tiny connectivity test for a specific (keyIndex, model).
     */
    async testConnection({ keyIndex = 0, model = DEFAULT_MODEL } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) return { ok: false, error: 'No API key at index ' + keyIndex };
        const start = Date.now();
        try {
            const text = await this._rawCall(model, key, 'Reply with just "ok".', { maxTokens: 8, timeoutMs: 15000 });
            return { ok: !!text, model, latencyMs: Date.now() - start, response: text?.slice(0, 40) };
        } catch (e) {
            return { ok: false, model, latencyMs: Date.now() - start, error: e.message };
        }
    }

    async generateSuggestion(prompt, context = '', { keyIndex = 0, model = DEFAULT_MODEL } = {}) {
        const key = aiKeyRing.getKeyAt(PROVIDER, keyIndex);
        if (!key) throw new Error('No API key at index ' + keyIndex);

        // Groq free tier ~12K TPM per key — cap context tightly
        const maxContext = 4000;
        const userMessage = context
            ? `${prompt}\n\nContext/Content to Analyze:\n"${context.substring(0, maxContext)}"`
            : prompt;

        try {
            const text = await this._rawCall(model, key, userMessage);
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

    _classifyAndMark(error, keyIndex, model) {
        const msg = error?.message || '';
        const rateMatch = msg.match(/wait\s+(\d+)s|in\s+(\d+(?:\.\d+)?)s/i);
        if (/rate.?limit|429|quota|tokens? per minute|TPM/i.test(msg)) {
            const sec = rateMatch ? Math.ceil(parseFloat(rateMatch[1] || rateMatch[2])) : 30;
            aiKeyRing.markKeyCooldown(PROVIDER, keyIndex, sec);
            return;
        }
        if (/not found|404|model.*does not exist/i.test(msg)) {
            modelRegistry.markModelCooldown(PROVIDER, model, 600);
            return;
        }
        if (/401|403|invalid.*key|unauthorized/i.test(msg)) {
            aiKeyRing.markKeyCooldown(PROVIDER, keyIndex, 3600);
        }
    }

    /** Stateless fetch — explicit key + model. */
    async _rawCall(model, apiKey, userMessage, { maxTokens = 4096, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
        const body = JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are an expert content writer and SEO strategist. Write human-quality content that is specific, opinionated, and technically accurate. Never use AI-sounding filler phrases. Follow all instructions precisely.' },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.4,
            max_tokens: maxTokens,
        });

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body,
            });

            if (response.status === 429) {
                const retryAfter = parseFloat(response.headers.get('Retry-After')) || 60;
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Rate limited. Try again in ${Math.ceil(retryAfter)}s.`);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('Groq returned an empty response. Try rephrasing your prompt.');
            }
            return content;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Groq request timed out after ${timeoutMs / 1000}s.`);
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }
}

export const groqService = new GroqService();
export default groqService;
