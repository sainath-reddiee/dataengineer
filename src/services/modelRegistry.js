// src/services/modelRegistry.js
// Persistent model enable/disable + per-model cooldown + runtime discovery.
//
// STORAGE:
// - Enable map persists in localStorage (`ai_model_registry_v1`).
// - Discovered models persist in localStorage (`ai_discovered_models_v1`)
//   along with last-sync timestamps per provider.
// - Cooldowns live in sessionStorage (transient).
//
// MODEL LIFECYCLE:
// - Static CATALOG seeds the initial set + supplies friendly labels and
//   default-enabled hints.
// - syncDiscoveredModels(provider, modelsFromApi) merges in any models the
//   provider's /models endpoint returned. New models are added with
//   defaultEnabled=false. Models that exist in the registry but are missing
//   from the API are flagged deprecated:true (not removed — user state is
//   preserved). Subsequent syncs that re-list a previously-deprecated model
//   un-deprecate it.

const ENABLED_KEY = 'ai_model_registry_v1';
const COOLDOWN_KEY = 'ai_model_cooldowns';
const DISCOVERED_KEY = 'ai_discovered_models_v1';

// Static catalog — seed defaults. Friendly labels + which to enable on first run.
const CATALOG = [
    // ─── Groq ─────────────────────────────────────────
    { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', defaultEnabled: true },
    { provider: 'groq', model: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant',    defaultEnabled: false },
    { provider: 'groq', model: 'gpt-oss-120b',            label: 'GPT-OSS 120B',            defaultEnabled: false },
    { provider: 'groq', model: 'gpt-oss-20b',             label: 'GPT-OSS 20B',             defaultEnabled: false },
    { provider: 'groq', model: 'kimi-k2-instruct',        label: 'Kimi K2 Instruct',        defaultEnabled: false },
    // ─── Gemini ───────────────────────────────────────
    { provider: 'gemini', model: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash',       defaultEnabled: true },
    { provider: 'gemini', model: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash Lite',  defaultEnabled: true },
    { provider: 'gemini', model: 'gemini-2.0-flash',       label: 'Gemini 2.0 Flash',       defaultEnabled: true },
    { provider: 'gemini', model: 'gemini-2.0-flash-lite',  label: 'Gemini 2.0 Flash Lite',  defaultEnabled: false },
    { provider: 'gemini', model: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro',         defaultEnabled: false },
];

// ─── Storage helpers ────────────────────────────────────────────

function localGetJson(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}
function localSetJson(key, value) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function loadEnabled() { return localGetJson(ENABLED_KEY, null); }
function saveEnabled(map) { localSetJson(ENABLED_KEY, map); }

function loadDiscovered() {
    return localGetJson(DISCOVERED_KEY, { models: [], lastSync: {} });
}
function saveDiscovered(state) { localSetJson(DISCOVERED_KEY, state); }

function loadCooldowns() {
    if (typeof sessionStorage === 'undefined') return {};
    try {
        const raw = sessionStorage.getItem(COOLDOWN_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
function saveCooldowns(map) {
    if (typeof sessionStorage === 'undefined') return;
    try { sessionStorage.setItem(COOLDOWN_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

// ─── Label synthesis ────────────────────────────────────────────
// When a discovered model isn't in the seed catalog we synthesize a friendly
// label from its id (e.g. "llama-3.3-70b-versatile" → "Llama 3.3 70B Versatile").

function prettifyLabel(modelId) {
    if (!modelId) return '';
    return modelId
        .replace(/[-_]/g, ' ')
        .replace(/\b([a-z])(\d)/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bGpt\b/g, 'GPT')
        .replace(/\bLlama\b/g, 'Llama')
        .replace(/\b(\d+)b\b/gi, '$1B');
}

class ModelRegistry {
    constructor() {
        let map = loadEnabled();
        if (!map) {
            map = {};
            CATALOG.forEach(({ provider, model, defaultEnabled }) => {
                map[`${provider}:${model}`] = !!defaultEnabled;
            });
            saveEnabled(map);
        } else {
            // Add any new seed-catalog entries
            let dirty = false;
            CATALOG.forEach(({ provider, model, defaultEnabled }) => {
                const k = `${provider}:${model}`;
                if (!(k in map)) {
                    map[k] = !!defaultEnabled;
                    dirty = true;
                }
            });
            if (dirty) saveEnabled(map);
        }
        this._enabled = map;
    }

    /**
     * Build the full union of seed catalog + discovered models, deduped.
     * Returns array of { provider, model, label, defaultEnabled, enabled,
     *                    cooldownSeconds, deprecated, discovered }.
     */
    getAllModels() {
        const discoveredState = loadDiscovered();
        const discovered = Array.isArray(discoveredState.models) ? discoveredState.models : [];

        // Build a map keyed by provider:model
        const byKey = {};
        for (const c of CATALOG) {
            byKey[`${c.provider}:${c.model}`] = {
                provider: c.provider,
                model: c.model,
                label: c.label,
                defaultEnabled: !!c.defaultEnabled,
                deprecated: false,
                discovered: false,
                inSeed: true,
            };
        }
        for (const d of discovered) {
            const k = `${d.provider}:${d.model}`;
            if (byKey[k]) {
                byKey[k].discovered = true;
                byKey[k].deprecated = !!d.deprecated;
                if (d.label && !byKey[k].label) byKey[k].label = d.label;
            } else {
                byKey[k] = {
                    provider: d.provider,
                    model: d.model,
                    label: d.label || prettifyLabel(d.model),
                    defaultEnabled: false,
                    deprecated: !!d.deprecated,
                    discovered: true,
                    inSeed: false,
                };
            }
        }

        return Object.values(byKey).map(m => ({
            ...m,
            enabled: !!this._enabled[`${m.provider}:${m.model}`],
            cooldownSeconds: this.getModelCooldownSeconds(m.provider, m.model),
        }));
    }

    getProviderModels(provider) {
        return this.getAllModels().filter(m => m.provider === provider);
    }

    /** Models eligible for the round-robin router: enabled, not cooling, not deprecated. */
    getActiveModels(provider) {
        return this.getProviderModels(provider).filter(m =>
            m.enabled && m.cooldownSeconds === 0 && !m.deprecated
        );
    }

    isEnabled(provider, model) {
        return !!this._enabled[`${provider}:${model}`];
    }

    setEnabled(provider, model, enabled) {
        this._enabled[`${provider}:${model}`] = !!enabled;
        saveEnabled(this._enabled);
    }

    markModelCooldown(provider, model, seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        const map = loadCooldowns();
        map[`${provider}:${model}`] = Date.now() + seconds * 1000;
        saveCooldowns(map);
    }

    getModelCooldownSeconds(provider, model) {
        const map = loadCooldowns();
        const until = map[`${provider}:${model}`] || 0;
        return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    }

    clearModelCooldown(provider, model) {
        const map = loadCooldowns();
        if (map[`${provider}:${model}`]) {
            delete map[`${provider}:${model}`];
            saveCooldowns(map);
        }
    }

    /**
     * Sync the registry with what the provider's /models endpoint returned.
     * - Adds new models (discovered=true, deprecated=false, defaultEnabled=false)
     * - Marks any model previously known for this provider but missing from the
     *   API as deprecated=true (preserves the entry so user state isn't lost).
     * - Re-seen models get un-deprecated.
     *
     * @param {string} provider
     * @param {Array<{id: string, label?: string}>} apiModels
     */
    syncDiscoveredModels(provider, apiModels) {
        if (!Array.isArray(apiModels)) return;

        const apiIds = new Set(apiModels.map(m => m.id).filter(Boolean));
        const state = loadDiscovered();
        const existing = Array.isArray(state.models) ? state.models : [];

        // Collect everything currently known for this provider — from seed + previously discovered
        const knownForProvider = new Map();
        CATALOG.filter(c => c.provider === provider).forEach(c => {
            knownForProvider.set(c.model, { provider, model: c.model, label: c.label, deprecated: false });
        });
        existing.filter(m => m.provider === provider).forEach(m => {
            knownForProvider.set(m.model, { ...m });
        });

        // Add new ones from API
        apiModels.forEach(m => {
            if (!m.id) return;
            knownForProvider.set(m.id, {
                provider,
                model: m.id,
                label: m.label || knownForProvider.get(m.id)?.label || prettifyLabel(m.id),
                deprecated: false,
            });
        });

        // Mark anything not in API as deprecated
        knownForProvider.forEach((entry, modelId) => {
            if (!apiIds.has(modelId)) entry.deprecated = true;
        });

        // Build the new "models" array for ALL providers — replace this provider's slice
        const otherProviders = existing.filter(m => m.provider !== provider);
        const next = [...otherProviders, ...Array.from(knownForProvider.values())];
        state.models = next;
        state.lastSync = { ...(state.lastSync || {}), [provider]: Date.now() };
        saveDiscovered(state);
    }

    getLastSync(provider) {
        const state = loadDiscovered();
        return state.lastSync?.[provider] || 0;
    }

    /** Hard-remove deprecated entries (only those that were never enabled). */
    clearDeprecated() {
        const state = loadDiscovered();
        const remaining = (state.models || []).filter(m => {
            if (!m.deprecated) return true;
            // Drop only if user never enabled it
            return !!this._enabled[`${m.provider}:${m.model}`];
        });
        state.models = remaining;
        saveDiscovered(state);
        // Also drop any enable entries for models that no longer exist in the registry
        const stillKnown = new Set([
            ...CATALOG.map(c => `${c.provider}:${c.model}`),
            ...remaining.map(m => `${m.provider}:${m.model}`),
        ]);
        let dirty = false;
        Object.keys(this._enabled).forEach(k => {
            if (!stillKnown.has(k)) { delete this._enabled[k]; dirty = true; }
        });
        if (dirty) saveEnabled(this._enabled);
    }

    getStats() {
        const all = this.getAllModels();
        const enabled = all.filter(m => m.enabled && !m.deprecated);
        const active = enabled.filter(m => m.cooldownSeconds === 0);
        const deprecated = all.filter(m => m.deprecated).length;
        return {
            total: all.length,
            enabled: enabled.length,
            active: active.length,
            cooling: enabled.length - active.length,
            deprecated,
        };
    }
}

export const modelRegistry = new ModelRegistry();
export { CATALOG as MODEL_CATALOG };
export default modelRegistry;
