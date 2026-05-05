// src/utils/contentCalendar.js
// LocalStorage-backed content calendar + AI-free auto-suggestion engine.

const STORAGE_KEY = 'content_calendar_v1';

function readStore() {
    if (typeof localStorage === 'undefined') return { tasks: [] };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { tasks: [] };
    } catch {
        return { tasks: [] };
    }
}

function writeStore(data) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota */ }
}

/** Generate a simple ID. */
function makeId() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Task shape:
 * {
 *   id: string,
 *   title: string,
 *   targetDate: 'YYYY-MM-DD',
 *   type: 'new' | 'update' | 'optimize',
 *   targetKeyword: string,
 *   priority: 'low' | 'medium' | 'high',
 *   status: 'pending' | 'in-progress' | 'done',
 *   articleSlug?: string,
 *   notes?: string,
 *   createdAt: ISO string,
 * }
 */

export function getTasks() {
    return readStore().tasks || [];
}

export function addTask(task) {
    const store = readStore();
    const newTask = {
        id: makeId(),
        status: 'pending',
        priority: 'medium',
        type: 'new',
        createdAt: new Date().toISOString(),
        ...task,
    };
    store.tasks = [...(store.tasks || []), newTask];
    writeStore(store);
    return newTask;
}

export function updateTask(id, patch) {
    const store = readStore();
    store.tasks = (store.tasks || []).map(t => (t.id === id ? { ...t, ...patch } : t));
    writeStore(store);
    return store.tasks.find(t => t.id === id);
}

export function removeTask(id) {
    const store = readStore();
    store.tasks = (store.tasks || []).filter(t => t.id !== id);
    writeStore(store);
}

export function getUpcoming(days = 7) {
    const now = Date.now();
    const cutoff = now + days * 86400000;
    return getTasks().filter(t => {
        if (t.status === 'done' || !t.targetDate) return false;
        const taskTime = new Date(t.targetDate).getTime();
        return taskTime >= now - 86400000 && taskTime <= cutoff;
    }).sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
}

export function getOverdue() {
    const today = new Date().toISOString().split('T')[0];
    return getTasks().filter(
        t => t.status !== 'done' && t.targetDate < today
    );
}

/**
 * Auto-generate calendar suggestions based on article analysis.
 * Returns array of { title, reason, priority, type, articleSlug, targetKeyword }
 */
export function generateSuggestions(scoredArticles, clusters, rankData, limit = 10) {
    const suggestions = [];

    // 1. Stale high-performing articles need updates (freshness < 40, health > 60)
    scoredArticles
        .filter(a => a.pillarScores?.freshness < 40 && a.articleHealth >= 60)
        .slice(0, 3)
        .forEach(a => {
            suggestions.push({
                title: `Update: ${a.title}`,
                reason: `Stale content (freshness score ${a.pillarScores.freshness}), but has good health — refresh for rank boost`,
                priority: 'high',
                type: 'update',
                articleSlug: a.slug,
                projectedLift: '+15-25% rank signal',
            });
        });

    // 2. Low-CTR articles need title rewrites
    scoredArticles
        .filter(a => a.pillarScores?.ctr < 50 && a.articleHealth >= 55)
        .slice(0, 2)
        .forEach(a => {
            suggestions.push({
                title: `Rewrite title: ${a.title}`,
                reason: `CTR score ${a.pillarScores.ctr} — title is costing you clicks`,
                priority: 'high',
                type: 'optimize',
                articleSlug: a.slug,
                projectedLift: '+10-20% CTR',
            });
        });

    // 3. Articles close to page 1 — push with content expansion
    scoredArticles
        .filter(a => a.currentPosition && a.currentPosition > 10 && a.currentPosition <= 20)
        .slice(0, 2)
        .forEach(a => {
            suggestions.push({
                title: `Push to page 1: ${a.title}`,
                reason: `Currently ranking #${a.currentPosition} — small push could land page 1`,
                priority: 'high',
                type: 'optimize',
                articleSlug: a.slug,
                projectedLift: '+300% traffic (page 2→1)',
            });
        });

    // 4. Missing cluster topics — new articles to write
    if (clusters && clusters.length > 0) {
        clusters.slice(0, 2).forEach(cluster => {
            const topic = cluster.dominantTopics[0];
            suggestions.push({
                title: `New article: Deep dive on ${topic}`,
                reason: `Expand your "${cluster.name}" pillar — ${cluster.size} related articles`,
                priority: 'medium',
                type: 'new',
                targetKeyword: topic,
                projectedLift: 'Topic authority boost',
            });
        });
    }

    // 5. Articles with no FAQ — AEO opportunity
    scoredArticles
        .filter(a => a.pillarScores?.aeo < 50 && a.articleHealth >= 60)
        .slice(0, 2)
        .forEach(a => {
            suggestions.push({
                title: `Add FAQ section: ${a.title}`,
                reason: `AEO score ${a.pillarScores.aeo} — missing FAQ schema costs AI citations`,
                priority: 'medium',
                type: 'optimize',
                articleSlug: a.slug,
                projectedLift: '+30% AI citations',
            });
        });

    // Sort: high priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, limit);
}

export function exportCalendar() {
    return JSON.stringify(readStore(), null, 2);
}

export function importCalendar(json) {
    try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') {
            writeStore(parsed);
            return true;
        }
    } catch { /* invalid */ }
    return false;
}
