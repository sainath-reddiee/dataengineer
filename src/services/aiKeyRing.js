// src/services/aiKeyRing.js
// Multi-key storage with per-key persistence flag + light obfuscation.
//
// STORAGE MODEL:
// - Keys array stored in localStorage (so persistent keys survive tab close).
// - Each entry: { key (obfuscated), persist, addedAt, sessionId }
// - On boot, entries with persist=false AND a sessionId different from the
//   current tab's sessionId are evicted — that gives session-scoped keys
//   the same UX as sessionStorage without splitting between two stores.
// - Cooldowns stay in sessionStorage (per-tab transient state).
//
// SECURITY MODEL:
// - localStorage is per-origin per-browser per-device — never bundled in JS,
//   never visible to other site visitors. Combined with AdminAuth gating
//   /admin/*, only the admin's browser ever stores or reads these keys.
// - Light XOR+base64 obfuscation defeats casual devtools peeks. NOT real
//   encryption — a determined attacker with browser access could still
//   extract keys. For stronger guarantees, move to a server-side proxy.

const KEYS_KEY = (provider) => `${provider}_api_keys`;
const LEGACY_KEY = (provider) => `${provider}_api_key`;
const COOLDOWN_KEY = 'ai_key_cooldowns';
const TAB_SESSION_KEY = 'ai_tab_session_id';
const OBFUSCATION_SEED = 'dehb-seo-toolkit-v2'; // not secret — just defeats plaintext browsing

// ─── Storage helpers ─────────────────────────────────────────────

function localGet(key) {
    if (typeof localStorage === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
}
function localSet(key, value) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(key, value); } catch { /* quota */ }
}
function localRemove(key) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
}
function sessionGet(key) {
    if (typeof sessionStorage === 'undefined') return null;
    try { return sessionStorage.getItem(key); } catch { return null; }
}
function sessionSet(key, value) {
    if (typeof sessionStorage === 'undefined') return;
    try { sessionStorage.setItem(key, value); } catch { /* quota */ }
}

// ─── Tab session id ─────────────────────────────────────────────
// Used to evict non-persistent keys when a new tab opens.

function getTabSessionId() {
    let id = sessionGet(TAB_SESSION_KEY);
    if (!id) {
        id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        sessionSet(TAB_SESSION_KEY, id);
    }
    return id;
}

// ─── Light obfuscation (XOR + base64) ───────────────────────────
// Plain-string-only — works for ASCII API keys.

function obfuscate(str) {
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) ^ OBFUSCATION_SEED.charCodeAt(i % OBFUSCATION_SEED.length));
    }
    try {
        return 'o1:' + btoa(unescape(encodeURIComponent(out)));
    } catch {
        return str; // fallback if btoa unavailable
    }
}

function deobfuscate(value) {
    if (!value) return '';
    if (!value.startsWith('o1:')) return value; // legacy plaintext
    try {
        const decoded = decodeURIComponent(escape(atob(value.slice(3))));
        let out = '';
        for (let i = 0; i < decoded.length; i++) {
            out += String.fromCharCode(decoded.charCodeAt(i) ^ OBFUSCATION_SEED.charCodeAt(i % OBFUSCATION_SEED.length));
        }
        return out;
    } catch {
        return '';
    }
}

// ─── Cooldown map (sessionStorage) ─────────────────────────────

function loadCooldowns() {
    try {
        const raw = sessionGet(COOLDOWN_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
function saveCooldowns(map) {
    sessionSet(COOLDOWN_KEY, JSON.stringify(map));
}

// ─── Internal: load + normalize the key array ──────────────────
// Returns array of { key (plaintext), persist, addedAt, sessionId }

function loadEntries(provider) {
    const raw = localGet(KEYS_KEY(provider));
    if (!raw) {
        // Try legacy single-key migration from either storage
        const legacy = localGet(LEGACY_KEY(provider)) || sessionGet(LEGACY_KEY(provider));
        if (legacy) {
            const entries = [{
                key: legacy,
                persist: true,
                addedAt: Date.now(),
                sessionId: getTabSessionId(),
            }];
            saveEntries(provider, entries);
            return entries;
        }
        return [];
    }
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return []; }
    if (!Array.isArray(parsed)) return [];

    const tabId = getTabSessionId();
    // Backward compat + eviction:
    // - String entries → wrap as { key, persist:true, addedAt, sessionId }
    // - Non-persistent entries from a previous tab session → drop
    const entries = [];
    let mutated = false;
    for (const item of parsed) {
        if (item == null) { mutated = true; continue; }
        if (typeof item === 'string') {
            entries.push({ key: item, persist: true, addedAt: Date.now(), sessionId: tabId });
            mutated = true;
            continue;
        }
        if (typeof item !== 'object') { mutated = true; continue; }
        const plain = deobfuscate(item.key);
        if (!plain) { mutated = true; continue; }
        if (item.persist === false && item.sessionId && item.sessionId !== tabId) {
            mutated = true; // evict
            continue;
        }
        entries.push({
            key: plain,
            persist: item.persist !== false,
            addedAt: item.addedAt || Date.now(),
            sessionId: item.sessionId || tabId,
        });
    }
    if (mutated) saveEntries(provider, entries);
    return entries;
}

function saveEntries(provider, entries) {
    const serialized = entries.map(e => ({
        key: obfuscate(e.key),
        persist: !!e.persist,
        addedAt: e.addedAt || Date.now(),
        sessionId: e.sessionId || getTabSessionId(),
    }));
    localSet(KEYS_KEY(provider), JSON.stringify(serialized));
    // Maintain legacy single-key slot for any straggler code paths
    if (entries.length > 0) localSet(LEGACY_KEY(provider), entries[0].key);
    else localRemove(LEGACY_KEY(provider));
}

class AIKeyRing {
    constructor() {
        // Trigger eviction-on-boot for both providers
        ['gemini', 'groq'].forEach(p => loadEntries(p));
    }

    /** Plaintext key strings array. */
    getKeys(provider) {
        return loadEntries(provider).map(e => e.key);
    }

    getKeyAt(provider, index) {
        return loadEntries(provider)[index]?.key;
    }

    getKeyCount(provider) {
        return loadEntries(provider).length;
    }

    /**
     * Add a key. Defaults to persist=true (saved across sessions in localStorage).
     * Pass { persist: false } to scope to current tab only.
     */
    addKey(provider, key, { persist = true } = {}) {
        if (!key) return -1;
        const entries = loadEntries(provider);
        const existing = entries.findIndex(e => e.key === key);
        if (existing >= 0) {
            // Update persistence if it changed
            if (entries[existing].persist !== persist) {
                entries[existing].persist = persist;
                entries[existing].sessionId = getTabSessionId();
                saveEntries(provider, entries);
            }
            return existing;
        }
        entries.push({
            key,
            persist,
            addedAt: Date.now(),
            sessionId: getTabSessionId(),
        });
        saveEntries(provider, entries);
        return entries.length - 1;
    }

    removeKey(provider, index) {
        const entries = loadEntries(provider);
        if (index < 0 || index >= entries.length) return false;
        entries.splice(index, 1);
        saveEntries(provider, entries);
        // Shift cooldown indices
        const map = loadCooldowns();
        const next = {};
        Object.entries(map).forEach(([k, ts]) => {
            const m = k.match(/^([^:]+):(\d+)$/);
            if (!m) return;
            const [, p, iStr] = m;
            const i = parseInt(iStr, 10);
            if (p !== provider) { next[k] = ts; return; }
            if (i === index) return;
            if (i > index) next[`${p}:${i - 1}`] = ts;
            else next[k] = ts;
        });
        saveCooldowns(next);
        return true;
    }

    /** Toggle persist flag for an existing key. */
    setPersist(provider, index, persist) {
        const entries = loadEntries(provider);
        if (index < 0 || index >= entries.length) return false;
        entries[index].persist = !!persist;
        entries[index].sessionId = getTabSessionId();
        saveEntries(provider, entries);
        return true;
    }

    markKeyCooldown(provider, keyIndex, seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        const map = loadCooldowns();
        map[`${provider}:${keyIndex}`] = Date.now() + seconds * 1000;
        saveCooldowns(map);
    }

    getKeyCooldownSeconds(provider, keyIndex) {
        const map = loadCooldowns();
        const until = map[`${provider}:${keyIndex}`] || 0;
        return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    }

    isKeyRateLimited(provider, keyIndex) {
        return this.getKeyCooldownSeconds(provider, keyIndex) > 0;
    }

    clearKeyCooldown(provider, keyIndex) {
        const map = loadCooldowns();
        if (map[`${provider}:${keyIndex}`]) {
            delete map[`${provider}:${keyIndex}`];
            saveCooldowns(map);
        }
    }

    getMinCooldownSeconds(provider) {
        const count = this.getKeyCount(provider);
        if (count === 0) return 0;
        let min = Infinity;
        for (let i = 0; i < count; i++) {
            const wait = this.getKeyCooldownSeconds(provider, i);
            if (wait === 0) return 0;
            if (wait < min) min = wait;
        }
        return min === Infinity ? 0 : min;
    }

    /** Snapshot for UI: [{ index, masked, persist, cooldownSeconds }] */
    listKeys(provider) {
        return loadEntries(provider).map((e, index) => ({
            index,
            masked: e.key.length > 4 ? `••••${e.key.slice(-4)}` : '••••',
            persist: e.persist,
            addedAt: e.addedAt,
            cooldownSeconds: this.getKeyCooldownSeconds(provider, index),
        }));
    }
}

export const aiKeyRing = new AIKeyRing();
export default aiKeyRing;
