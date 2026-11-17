/**
 * A guest post that links to the guest's own website is promotional for that author,
 * so readers get a disclosure line above the body. Returns the host the post links to
 * (for example "samta.ai"), or an empty string when no note is needed:
 *   - the site owner's own posts never get one
 *   - a guest post that does not link to the author's site does not either
 *
 * The static generator and the React article page both call this, so the static HTML and
 * the hydrated page say the same thing. Pure function, no dependencies.
 */
export function guestPromoHost({ isOwner, authorWebsite, html }) {
  if (isOwner || !authorWebsite || !html) return '';
  let host = '';
  try {
    host = new URL(authorWebsite).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
  if (!host || host.endsWith('dataengineerhub.blog')) return '';
  const escaped = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const link = new RegExp(`href=["']https?://(?:[a-z0-9-]+\\.)*${escaped}(?:[/"'?#:])`, 'i');
  return link.test(html) ? host : '';
}
