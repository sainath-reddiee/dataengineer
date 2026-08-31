/**
 * Park pre-rendered article HTML before React createRoot() wipes #root.
 *
 * AdSense human reviewers use regular Chrome, so they are not treated as
 * crawlers. createRoot() replaces the 2,000-word SSG article with a
 * skeleton while WordPress loads. If that API is slow or 522s, the
 * reviewer snapshots an empty page and flags low-value content.
 *
 * Only reuse parked HTML when the path still matches the current slug
 * so a homepage listing is never painted onto the wrong article.
 */
const STORE_KEY = '__DEH_SSG_ARTICLE__';

export function parkSsgArticleFromRoot(rootEl) {
  if (typeof window === 'undefined' || !rootEl) return;
  const ssg = rootEl.querySelector('.seo-content');
  if (!ssg) return;
  const path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (!path.startsWith('/articles/')) return;
  window[STORE_KEY] = {
    path,
    html: ssg.innerHTML,
  };
}

export function getParkedSsgArticle(slug) {
  if (typeof window === 'undefined' || !slug) return '';
  const parked = window[STORE_KEY];
  if (!parked?.html) return '';
  const expected = `/articles/${slug}`;
  if (parked.path !== expected) return '';
  return parked.html;
}
