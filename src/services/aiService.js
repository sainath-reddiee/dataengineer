/**
 * Unified AI Service — lane-based round-robin router.
 *
 * A "lane" = (provider, model, keyIndex). Every request picks the next
 * available lane in round-robin order, distributing load across:
 *   - all configured API keys per provider (multi-key rotation)
 *   - all enabled models in the registry
 *   - all providers (Gemini + Groq)
 *
 * On per-lane rate limit, the bad lane is auto-marked in cooldown and the
 * router retries the next lane once before surfacing an error.
 *
 * Backward-compatible: pages calling aiService.generateSuggestion() see no
 * behavior change — the round-robin is fully transparent.
 */

import { geminiService } from './geminiService';
import { groqService } from './groqService';
import aiKeyRing from './aiKeyRing';
import modelRegistry from './modelRegistry';

const PREFERRED_KEY = 'ai_provider'; // sessionStorage — used as tie-breaker only

class AIService {
    constructor() {
        this._preferred = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PREFERRED_KEY)) || 'gemini';
        this._laneIndex = 0; // round-robin counter
    }

    get isEnabled() {
        return aiKeyRing.getKeyCount('gemini') > 0 || aiKeyRing.getKeyCount('groq') > 0;
    }

    get provider() {
        // Best-effort: provider of the next lane that would be picked
        const lanes = this._buildLanes();
        return lanes[0]?.provider || this._preferred;
    }

    setProvider(name) {
        this._preferred = name === 'groq' ? 'groq' : 'gemini';
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(PREFERRED_KEY, this._preferred);
        }
    }

    /** Legacy: set a single key for the preferred provider. Replaces existing keys. */
    setApiKey(key) {
        const svc = this._preferred === 'groq' ? groqService : geminiService;
        svc.setApiKey(key);
    }

    /**
     * Build the list of currently available lanes.
     * Each lane = { provider, model, keyIndex }
     * Lanes are sorted with the preferred provider first as a stable tie-breaker.
     */
    _buildLanes({ includeCoolingDown = false } = {}) {
        const lanes = [];
        for (const provider of ['gemini', 'groq']) {
            const keys = aiKeyRing.getKeys(provider);
            if (keys.length === 0) continue;
            const models = modelRegistry.getProviderModels(provider).filter(m => m.enabled);
            for (const m of models) {
                if (!includeCoolingDown && m.cooldownSeconds > 0) continue;
                for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                    if (!includeCoolingDown && aiKeyRing.isKeyRateLimited(provider, keyIndex)) continue;
                    lanes.push({ provider, model: m.model, keyIndex });
                }
            }
        }
        // Stable sort: preferred provider first
        lanes.sort((a, b) => {
            if (a.provider === b.provider) return 0;
            if (a.provider === this._preferred) return -1;
            if (b.provider === this._preferred) return 1;
            return 0;
        });
        return lanes;
    }

    /**
     * UI status snapshot.
     */
    getStatus() {
        const all = this._buildLanes({ includeCoolingDown: true });
        const ready = this._buildLanes({ includeCoolingDown: false });
        const stats = modelRegistry.getStats();
        const minWait = ready.length === 0
            ? Math.min(
                aiKeyRing.getMinCooldownSeconds('gemini') || Infinity,
                aiKeyRing.getMinCooldownSeconds('groq') || Infinity
            )
            : 0;

        // Backwards compat: surface single "active provider" + per-provider cooldown for older UI
        const active = ready[0]?.provider || all[0]?.provider || this._preferred;
        return {
            provider: active,
            enabled: all.length > 0,
            isRateLimited: ready.length === 0 && all.length > 0,
            cooldownSeconds: Number.isFinite(minWait) ? minWait : 0,
            totalLanes: all.length,
            availableLanes: ready.length,
            modelStats: stats,
        };
    }

    /**
     * Round-robin caller. Builds available lanes, picks the next one, calls
     * the underlying service. On per-lane rate-limit, the per-key/per-model
     * cooldowns are set inside the service itself, then we retry once with
     * the next lane.
     */
    async _call(method, args) {
        if (!this.isEnabled) {
            throw new Error('No AI API keys configured. Add at least one key in the admin sidebar.');
        }

        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        let lastError;

        while (attempts < MAX_ATTEMPTS) {
            const lanes = this._buildLanes();
            if (lanes.length === 0) {
                const allLanes = this._buildLanes({ includeCoolingDown: true });
                if (allLanes.length === 0) {
                    const stats = modelRegistry.getStats();
                    if (stats.enabled === 0) {
                        throw new Error('No AI models enabled. Toggle at least one model on in the admin sidebar.');
                    }
                    throw new Error('No AI API keys configured. Add at least one key in the admin sidebar.');
                }
                // Everything is in cooldown
                const wait = Math.min(
                    aiKeyRing.getMinCooldownSeconds('gemini') || Infinity,
                    aiKeyRing.getMinCooldownSeconds('groq') || Infinity
                );
                throw new Error(`All AI lanes rate-limited — wait ${Number.isFinite(wait) ? wait : 60}s before retrying.`);
            }

            const lane = lanes[this._laneIndex % lanes.length];
            this._laneIndex = (this._laneIndex + 1) % 1000000;
            const svc = lane.provider === 'groq' ? groqService : geminiService;
            const label = lane.provider === 'groq' ? 'Groq' : 'Gemini';

            try {
                // Append { keyIndex, model } as the final positional arg.
                // All service methods accept this signature.
                return await svc[method](...args, { keyIndex: lane.keyIndex, model: lane.model });
            } catch (err) {
                lastError = err;
                const msg = err?.message || String(err);
                const tagged = msg.startsWith('[') ? msg : `[${label}/${lane.model}] ${msg}`;
                lastError = new Error(tagged);

                // Retry on rate-limit / model-not-found — those just disable the
                // bad lane (already marked in service) and let us try another.
                if (/rate.?limit|429|quota|not found|404|tokens? per minute/i.test(msg)) {
                    attempts++;
                    continue;
                }
                // Other errors (bad request, content policy, etc.) — surface immediately
                throw lastError;
            }
        }
        throw lastError || new Error('All retries exhausted.');
    }

    async generateSuggestion(prompt, context = '') {
        return this._call('generateSuggestion', [prompt, context]);
    }

    async getQuickFix(issueLabel, currentContent) {
        return this._call('getQuickFix', [issueLabel, currentContent]);
    }

    async generateMetaDescription(articleContent) {
        return this._call('generateMetaDescription', [articleContent]);
    }

    /**
     * Discover available models from each provider's /models endpoint and
     * sync the registry. Skips providers with no key. Failures are isolated:
     * one provider's error doesn't block the other.
     *
     * Returns { gemini: { ok, count, error? }, groq: { ok, count, error? } }
     */
    async refreshAvailableModels() {
        const out = { gemini: { ok: false, skipped: true }, groq: { ok: false, skipped: true } };

        const tasks = [];
        if (aiKeyRing.getKeyCount('gemini') > 0) {
            tasks.push((async () => {
                try {
                    const models = await geminiService.listAvailableModels();
                    modelRegistry.syncDiscoveredModels('gemini', models);
                    out.gemini = { ok: true, count: models.length };
                } catch (e) {
                    out.gemini = { ok: false, error: e.message || String(e) };
                }
            })());
        }
        if (aiKeyRing.getKeyCount('groq') > 0) {
            tasks.push((async () => {
                try {
                    const models = await groqService.listAvailableModels();
                    modelRegistry.syncDiscoveredModels('groq', models);
                    out.groq = { ok: true, count: models.length };
                } catch (e) {
                    out.groq = { ok: false, error: e.message || String(e) };
                }
            })());
        }
        await Promise.all(tasks);
        return out;
    }
}

export const aiService = new AIService();
export default aiService;
