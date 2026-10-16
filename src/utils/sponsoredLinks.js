// Mark every outbound link in sponsored content as rel="sponsored nofollow"
// so paid announcements and co-authored guides never pass ranking signals
// (Google's link-spam policy) whatever the submitted HTML contained.
const SITE_HOSTS = ['dataengineerhub.blog', 'www.dataengineerhub.blog', 'app.dataengineerhub.blog'];

function isOutbound(href) {
  if (!href || href.startsWith('#') || href.startsWith('/') || href.startsWith('mailto:')) return false;
  try {
    return !SITE_HOSTS.includes(new URL(href).hostname);
  } catch {
    return false;
  }
}

export function markSponsoredLinks(html) {
  return String(html || '').replace(/<a\b([^>]*)>/gi, (tag, attrs) => {
    const href = (attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!isOutbound(href)) return tag;
    const cleaned = attrs.replace(/\s+rel\s*=\s*(["'])[^"']*\1/i, '');
    return `<a${cleaned} rel="sponsored nofollow noopener" target="_blank">`.replace(/\s+target\s*=\s*(["'])[^"']*\1(?=.*target=)/i, '');
  });
}
