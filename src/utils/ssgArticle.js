/**
 * Park pre-rendered HTML before React createRoot() wipes #root.
 *
 * AdSense human reviewers use regular Chrome, so they are not treated as
 * crawlers. createRoot() replaces the 2,000-word SSG article with a
 * skeleton while WordPress loads. If that API is slow or 522s, the
 * reviewer snapshots an empty page and flags low-value content.
 *
 * Only reuse parked HTML when the path still matches the current page
 * so a homepage listing is never painted onto the wrong article.
 */

const STORE_KEY = '__DEH_SSG_ARTICLE__';
const fetchCache = new Map();

export function normalizePath(pathname) {
  return String(pathname || '').replace(/\/+$/, '') || '/';
}

export function parkSsgArticleFromRoot(rootEl) {
  if (typeof window === 'undefined' || !rootEl) return;
  const ssg = rootEl.querySelector('.seo-content');
  if (!ssg) return;
  const path = normalizePath(window.location.pathname);
  window[STORE_KEY] = {
    path,
    html: ssg.innerHTML,
  };
}

export function getParkedSsgContent(pathname) {
  if (typeof window === 'undefined' || !pathname) return '';
  const parked = window[STORE_KEY];
  if (!parked?.html) return '';
  if (parked.path !== normalizePath(pathname)) return '';
  return parked.html;
}

export function getParkedSsgArticle(slug) {
  if (!slug) return '';
  return getParkedSsgContent(`/articles/${slug}`);
}

/**
 * Pull the pre-rendered article body out of a static HTML document.
 * Browser uses DOMParser; Node tests fall back to the <article> slice.
 */
export function extractSeoContent(html) {
  if (!html || typeof html !== 'string') return '';

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const el = doc.querySelector('.seo-content');
      if (el?.innerHTML) return el.innerHTML;
    } catch {
      // fall through to the article-tag slice
    }
  }

  const articleStart = html.search(/<article[\s>]/i);
  const articleEnd = html.toLowerCase().lastIndexOf('</article>');
  if (articleStart === -1 || articleEnd <= articleStart) return '';
  return html.slice(articleStart, articleEnd + '</article>'.length);
}

/**
 * Client-side article navigation has no parked HTML (that snapshot
 * belonged to the previous route). Fetch the static /articles/{slug}/
 * document and reuse its .seo-content while WordPress loads.
 */
export async function fetchSsgArticleHtml(slug) {
  if (!slug || typeof fetch !== 'function') return '';

  const parked = getParkedSsgArticle(slug);
  if (parked) return parked;

  if (fetchCache.has(slug)) return fetchCache.get(slug);

  const request = (async () => {
    try {
      const res = await fetch(`/articles/${encodeURIComponent(slug)}/`, {
        credentials: 'same-origin',
        headers: { Accept: 'text/html' },
      });
      if (!res.ok) return '';
      const html = await res.text();
      const extracted = extractSeoContent(html);
      if (extracted && typeof window !== 'undefined') {
        window[STORE_KEY] = {
          path: `/articles/${slug}`,
          html: extracted,
        };
      }
      return extracted;
    } catch {
      return '';
    }
  })();

  fetchCache.set(slug, request);
  const result = await request;
  fetchCache.set(slug, Promise.resolve(result));
  return result;
}
