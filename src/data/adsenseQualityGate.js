/**
 * AdSense review quality gate.
 *
 * Adding more original articles did not clear the 7-month "low value content"
 * rejection because reviewers sample the whole URL set. 108 practitioner
 * tutorials were diluted by 50+ templated glossary pages, 35 comparison pages,
 * and tag / cheat-sheet-category archives. Google's thin-content guidelines
 * treat scaled, near-identical pages as low-value even when each page is
 * 400+ words.
 *
 * While ADSENSE_REVIEW_MODE is true:
 * - glossary, compare, tag, and cheat-sheet category URLs are noindexed
 * - they are omitted from sitemap.xml
 * - AdsBot / Mediapartners-Google are disallowed from those paths
 *
 * Pages stay live for human visitors. Flip the flag after AdSense approval
 * to reopen those sections for organic search.
 */
export const ADSENSE_REVIEW_MODE = true;

export function isAdSenseNoindexPath(pathname) {
  if (!ADSENSE_REVIEW_MODE) return false;
  const path = String(pathname || '')
    .toLowerCase()
    .replace(/\/+$/, '') || '/';

  if (path === '/glossary' || path.startsWith('/glossary/')) return true;
  if (path === '/compare' || path.startsWith('/compare/')) return true;
  if (path === '/tags' || path === '/tag' || path.startsWith('/tag/')) return true;
  if (path.startsWith('/cheatsheets/category/')) return true;
  return false;
}

export const ADSENSE_REVIEW_ROBOTS = 'noindex, follow';
export const ADSENSE_INDEX_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
