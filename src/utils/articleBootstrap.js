/**
 * Cold article loads embed a small JSON blob (no full HTML — that lives in
 * .seo-content). React reads it before createRoot() wipes #root so the first
 * client paint can be the real article UI instead of a skeleton.
 */

const STORE_KEY = '__DEH_POST_BOOTSTRAP__';

export function normalizeArticleSlug(slug) {
  return String(slug || '')
    .trim()
    .replace(/^\/articles\//, '')
    .replace(/\/+$/, '');
}

export function parkArticleBootstrapFromRoot(rootEl) {
  if (typeof document === 'undefined') return;
  const el =
    document.getElementById('deh-post-bootstrap') ||
    rootEl?.querySelector?.('#deh-post-bootstrap');
  if (!el?.textContent) return;
  try {
    const data = JSON.parse(el.textContent);
    if (data && typeof data === 'object' && data.slug) {
      window[STORE_KEY] = data;
    }
  } catch {
    // ignore malformed bootstrap
  }
}

export function getArticleBootstrap(slug) {
  if (typeof window === 'undefined' || !slug) return null;
  const data = window[STORE_KEY];
  if (!data || typeof data !== 'object') return null;
  if (normalizeArticleSlug(data.slug) !== normalizeArticleSlug(slug)) return null;
  return data;
}

export function extractArticleBodyHtml(seoHtml) {
  if (!seoHtml || typeof seoHtml !== 'string') return '';

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(
        `<div class="seo-wrap">${seoHtml}</div>`,
        'text/html'
      );
      const body = doc.querySelector('.article-body');
      if (body?.innerHTML) return body.innerHTML;
    } catch {
      // fall through
    }
  }

  const open = seoHtml.search(/<div[^>]*class=["'][^"']*article-body/i);
  if (open === -1) return '';
  const start = seoHtml.indexOf('>', open) + 1;
  if (start <= 0) return '';
  let depth = 1;
  const re = /<\/?div\b/gi;
  re.lastIndex = start;
  let match;
  while ((match = re.exec(seoHtml))) {
    if (match[0].toLowerCase() === '<div') {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return seoHtml.slice(start, match.index).trim();
    }
  }
  return seoHtml.slice(start).trim();
}

export function buildBootstrappedPost(slug, parkedSeoHtml) {
  const meta = getArticleBootstrap(slug);
  if (!meta) return null;
  const body = extractArticleBodyHtml(parkedSeoHtml);
  return {
    id: meta.id || slug,
    slug,
    title: meta.title || 'Untitled',
    excerpt: meta.excerpt || '',
    content: body || meta.content || '',
    category: meta.category || 'Uncategorized',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    readTime: meta.readTime || '1 min read',
    date: meta.date || new Date().toISOString(),
    modified: meta.modified || meta.date || new Date().toISOString(),
    image: meta.image || '',
    featured: false,
    trending: false,
    author: meta.author || 'Sainath Reddy',
    authorData: meta.authorData || {
      name: meta.author || 'Sainath Reddy',
      bio: '',
      avatarUrl: '',
      website: '',
      slug: '',
      role: '',
    },
    htmlReady: Boolean(body),
    keyTakeaways: Array.isArray(meta.keyTakeaways) ? meta.keyTakeaways : [],
  };
}
