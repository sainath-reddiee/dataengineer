/**
 * Pure article-to-article keyword linking (no data imports).
 * Used by linkingEngine.js at runtime and by Node verify scripts.
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAlreadyLinked(html, keyword) {
  const anchorRegex = new RegExp(`<a[^>]*>[^<]*${escapeRegex(keyword)}[^<]*</a>`, 'i');
  if (anchorRegex.test(html)) return true;
  const attrRegex = new RegExp(`<[^>]*${escapeRegex(keyword)}[^>]*>`, 'i');
  if (attrRegex.test(html)) return true;
  return false;
}

export function hasLinkToArticle(html, slug) {
  if (!html || !slug) return false;
  return new RegExp(`href=["'][^"']*/articles/${escapeRegex(slug)}/?["']`, 'i').test(html);
}

export const MAX_INTERNAL_LINKS = 8;
export const MIN_KEYWORD_LENGTH = 3;

export function buildLinkCandidates(articles, excludeSlug = '') {
  const candidates = [];

  for (const article of articles || []) {
    if (!article?.slug || article.slug === excludeSlug) continue;
    const keywords = Array.isArray(article.keywords) ? article.keywords : [];
    const seenForArticle = new Set();
    for (const keyword of keywords) {
      const raw = String(keyword || '').trim();
      if (raw.length < MIN_KEYWORD_LENGTH) continue;
      const key = raw.toLowerCase();
      if (seenForArticle.has(key)) continue;
      seenForArticle.add(key);
      candidates.push({
        slug: article.slug,
        title: article.title || article.slug,
        keyword: raw,
      });
    }
  }

  candidates.sort((a, b) => b.keyword.length - a.keyword.length || a.keyword.localeCompare(b.keyword));
  return candidates;
}

function replaceFirstKeywordOutsideHeadings(html, keyword, makeAnchor) {
  const keywordPattern = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, 'i');
  const parts = html.split(/(<[^>]*>)/);
  let inHeading = false;
  let inSkipBlock = false;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (i % 2 === 1) {
      if (/^<(h[1-6])\b/i.test(part)) inHeading = true;
      else if (/^<\/h[1-6]>/i.test(part)) inHeading = false;
      if (/^<(script|style|textarea)\b/i.test(part)) inSkipBlock = true;
      else if (/^<\/(script|style|textarea)>/i.test(part)) inSkipBlock = false;
      continue;
    }
    if (inHeading || inSkipBlock) continue;
    if (!keywordPattern.test(part)) continue;
    const match = part.match(keywordPattern);
    if (!match) continue;
    parts[i] = part.replace(keywordPattern, makeAnchor(match[1]));
    return parts.join('');
  }
  return null;
}

function maskCodeBlocks(html) {
  const blocks = [];
  const token = (i) => `\u0001PSEO_CODE_BLOCK_${i}\u0001`;
  const stripped = html
    .replace(/<pre[\s\S]*?<\/pre>/gi, (match) => {
      const i = blocks.length;
      blocks.push(match);
      return token(i);
    })
    .replace(/<code[\s\S]*?<\/code>/gi, (match) => {
      const i = blocks.length;
      blocks.push(match);
      return token(i);
    });

  const restore = (processed) =>
    processed.replace(/\u0001PSEO_CODE_BLOCK_(\d+)\u0001/g, (_, i) => blocks[Number(i)] || '');

  return { stripped, restore };
}

/**
 * @param {string} htmlContent
 * @param {string} excludeSlug
 * @param {{ articles: Array, maxLinks?: number }} options - articles is required
 */
export function injectArticleLinks(htmlContent, excludeSlug = '', options = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  const articles = options.articles || [];
  const maxLinks = Number.isFinite(options.maxLinks) ? options.maxLinks : MAX_INTERNAL_LINKS;
  const { stripped, restore } = maskCodeBlocks(htmlContent);
  let result = stripped;
  const linkedKeywords = new Set();
  const linkedSlugs = new Set();
  let linkCount = 0;

  for (const candidate of buildLinkCandidates(articles, excludeSlug)) {
    if (linkCount >= maxLinks) break;
    const key = candidate.keyword.toLowerCase();
    if (linkedKeywords.has(key) || linkedSlugs.has(candidate.slug)) continue;
    if (hasLinkToArticle(result, candidate.slug)) {
      linkedSlugs.add(candidate.slug);
      continue;
    }
    if (isAlreadyLinked(result, candidate.keyword)) continue;

    const next = replaceFirstKeywordOutsideHeadings(
      result,
      candidate.keyword,
      (matchedText) =>
        `<a href="/articles/${candidate.slug}" class="internal-link" title="${escapeHtmlAttr(candidate.title)}">${matchedText}</a>`
    );
    if (!next) continue;

    result = next;
    linkedKeywords.add(key);
    linkedSlugs.add(candidate.slug);
    linkCount += 1;
  }

  return restore(result);
}
