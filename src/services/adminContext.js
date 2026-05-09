// src/services/adminContext.js
// Lightweight shared context for passing article state between admin tools.
//
// When a user clicks an action in one tool (e.g., Rank Dashboard → CTR Lab),
// this service stores the article context so the target tool can pre-fill/auto-select.
//
// Uses sessionStorage (cleared on tab close) + URL search params for deep-linking.
// No Redux/Zustand needed — this is intentionally simple.

const CONTEXT_KEY = 'admin_article_context';

class AdminContextService {
    /**
     * Set the current article context (call before navigating to another tool).
     * Also copies the article URL to clipboard for convenience.
     *
     * @param {Object} article - { slug, title, url, id? }
     * @param {Object} options - { copyToClipboard: boolean }
     */
    setArticle(article, { copyToClipboard = true } = {}) {
        if (!article?.slug) return;

        const ctx = {
            slug: article.slug,
            title: article.title || '',
            url: article.url || `https://dataengineerhub.blog/articles/${article.slug}`,
            id: article.id || null,
            setAt: Date.now(),
        };

        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
        }

        // Auto-copy article URL to clipboard
        if (copyToClipboard && navigator.clipboard) {
            navigator.clipboard.writeText(ctx.url).catch(() => {});
        }

        return ctx;
    }

    /**
     * Get the current article context.
     * Returns null if no context is set or if it's stale (> 30 min old).
     *
     * @returns {{ slug: string, title: string, url: string, id: string|null } | null}
     */
    getArticle() {
        if (typeof sessionStorage === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(CONTEXT_KEY);
            if (!raw) return null;

            const ctx = JSON.parse(raw);
            // Expire after 30 minutes of inactivity
            if (Date.now() - ctx.setAt > 30 * 60 * 1000) {
                this.clear();
                return null;
            }
            return ctx;
        } catch {
            return null;
        }
    }

    /**
     * Get article context from URL search params (for deep-linking).
     * Supports: ?slug=xxx or ?article=xxx or ?url=xxx
     *
     * @returns {{ slug: string, url: string } | null}
     */
    getFromURL() {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);

        const slug = params.get('slug') || params.get('article');
        if (slug) {
            return {
                slug,
                url: `https://dataengineerhub.blog/articles/${slug}`,
                title: params.get('title') || '',
            };
        }

        const url = params.get('url');
        if (url) {
            const slugMatch = url.match(/\/articles\/([^/?#]+)/);
            return {
                slug: slugMatch?.[1] || '',
                url,
                title: params.get('title') || '',
            };
        }

        return null;
    }

    /**
     * Get article context from either URL params or session storage.
     * URL params take priority (deep-link wins over stale session).
     *
     * @returns {{ slug: string, url: string, title: string } | null}
     */
    getContext() {
        return this.getFromURL() || this.getArticle();
    }

    /**
     * Build a navigation path with article context as query params.
     * Use this instead of raw paths when navigating between admin tools.
     *
     * @param {string} basePath - e.g., '/admin/ctr-lab'
     * @param {Object} article - { slug, title? }
     * @returns {string} Path with query params
     */
    buildLink(basePath, article) {
        if (!article?.slug) return basePath;
        const params = new URLSearchParams();
        params.set('slug', article.slug);
        if (article.title) params.set('title', article.title.substring(0, 80));
        return `${basePath}?${params.toString()}`;
    }

    /**
     * Clear the stored context.
     */
    clear() {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(CONTEXT_KEY);
        }
    }
}

export const adminContext = new AdminContextService();
export default adminContext;
