/**
 * Some published articles were pasted from markdown drafts in the public GitHub
 * repo, and their links were converted to repository URLs:
 *
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/plans/rework/<slug>.md#<heading>
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/articles/<slug>
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/<article-slug>
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/glossary/<term>
 *
 * The first form is a table of contents entry, so it should scroll the page; all
 * of them should stay on the site. This rewrites them to the in-page anchor, the
 * article URL or the glossary URL. Links to other repositories (a project's own
 * repo, a code sample) are left alone. Static HTML and the React page both call
 * this so crawlers and readers get identical content. Pure string function.
 */
const REPO = 'https:\\/\\/github\\.com\\/sainath-reddiee\\/dataengineer\\/blob\\/main\\/';
const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
const DRAFT_LINK = new RegExp(
  'href=(["\'])' + REPO +
    '(?:plans\\/rework\\/(' + SLUG + ')\\.md' + // 2: table of contents draft
    '|articles\\/(' + SLUG + ')(?:\\.md)?' + // 3: article
    '|glossary\\/(' + SLUG + ')' + // 4: glossary term
    '|([a-z0-9]+(?:-[a-z0-9]+)+))' + // 5: article slug at the repo root (needs a hyphen)
    '(#[^"\']*)?\\1',
  'gi'
);

export function rewriteRepoDraftLinks(html, currentSlug = '') {
  if (!html || !html.includes('github.com/sainath-reddiee/dataengineer/')) return html;
  return html.replace(DRAFT_LINK, (match, quote, draft, article, glossary, rootSlug, hash = '') => {
    if (glossary) return `href=${quote}/glossary/${glossary.toLowerCase()}/${hash}${quote}`;
    const slug = (draft || article || rootSlug).toLowerCase();
    // A table-of-contents link to the page it is on stays an in-page anchor.
    if (draft && hash && slug === String(currentSlug).toLowerCase()) {
      return `href=${quote}${hash}${quote}`;
    }
    return `href=${quote}/articles/${slug}/${hash}${quote}`;
  });
}
