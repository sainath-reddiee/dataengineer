/**
 * Some published articles were pasted from markdown drafts in the public GitHub
 * repo, and their links were converted to repository URLs:
 *
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/plans/rework/<slug>.md#<heading>
 *   https://github.com/sainath-reddiee/dataengineer/blob/main/articles/<slug>
 *
 * The first form is a table of contents entry, so it should scroll the page;
 * both forms should stay on the site. This rewrites them to the in-page anchor or
 * the article URL. Static HTML and the React page both call it so crawlers and
 * readers get identical content. Pure string function, no dependencies.
 */
const DRAFT_LINK =
  /href=(["'])https:\/\/github\.com\/sainath-reddiee\/dataengineer\/blob\/main\/(?:plans\/rework\/([a-z0-9-]+)\.md|articles\/([a-z0-9-]+)(?:\.md)?)(#[^"']*)?\1/gi;

export function rewriteRepoDraftLinks(html, currentSlug = '') {
  if (!html || !html.includes('github.com/sainath-reddiee/dataengineer/')) return html;
  return html.replace(DRAFT_LINK, (match, quote, draftSlug, articleSlug, hash = '') => {
    const slug = (draftSlug || articleSlug).toLowerCase();
    // A table-of-contents link to the page it is on stays an in-page anchor.
    if (draftSlug && hash && slug === String(currentSlug).toLowerCase()) {
      return `href=${quote}${hash}${quote}`;
    }
    return `href=${quote}/articles/${slug}/${hash}${quote}`;
  });
}
