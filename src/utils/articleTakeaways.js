/**
 * Extract Key Takeaways / TL;DR from article HTML and optionally remove that
 * section from the body so the React (or SSG) Key Takeaways box is not a
 * duplicate of the same list still sitting in the prose.
 */

function decodeHtmlEntities(str) {
  if (!str) return '';
  let decoded = String(str);
  let prev;
  do {
    prev = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&middot;/g, '·')
      .replace(/&bull;/g, '•')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  } while (decoded !== prev);
  return decoded;
}

function cleanLi(s) {
  const withSpaces = String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/li>/gi, ' ');
  const text = withSpaces.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return decodeHtmlEntities(text);
}

function itemsFromListHtml(sectionHtml) {
  const list = sectionHtml.match(/<(ul|ol)[\s\S]*?<\/\1>/i);
  if (!list) return [];
  const items = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(list[0])) !== null) {
    const t = cleanLi(m[1]);
    if (t.length >= 8 && t.length <= 240) items.push(t);
  }
  return items;
}

function itemsFromParagraphHtml(sectionHtml) {
  const firstP = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!firstP) return [];
  const items = [];
  for (const line of firstP[1].split(/<br\s*\/?>|\n/gi)) {
    const t = cleanLi(line).replace(/^[→•\-\*\s]+/, '').trim();
    if (t.length >= 8 && t.length <= 240) items.push(t);
  }
  return items;
}

/** Heading that is a takeaways / TL;DR / summary label (allows emoji / suffix). */
export const TAKEAWAYS_HEADING_RE =
  /<h([1-3])[^>]*>\s*(?:[^\w<]{1,4}\s*)?(?:Key\s*Takeaways|TL;?DR|Summary|At\s*a\s*Glance)\b[^<]*<\/h\1>/i;

const COMMENT_BLOCK_RE =
  /<!--\s*key-takeaways\s*-->([\s\S]*?)<!--\s*\/?key-takeaways\s*-->/i;

/**
 * Remove an explicit takeaways / TL;DR block from HTML.
 * Safe to call when no block exists (returns input unchanged).
 */
export function stripKeyTakeawaysSection(html) {
  if (!html || typeof html !== 'string') return html || '';

  if (COMMENT_BLOCK_RE.test(html)) {
    return html.replace(COMMENT_BLOCK_RE, '').replace(/^\s+/, '');
  }

  const headingMatch = TAKEAWAYS_HEADING_RE.exec(html);
  if (!headingMatch) return html;

  const start = headingMatch.index;
  const afterHeading = start + headingMatch[0].length;
  const rest = html.slice(afterHeading);
  const nextHeading = rest.search(/<h[1-3][^>]*>/i);
  const end = nextHeading === -1 ? html.length : afterHeading + nextHeading;
  return `${html.slice(0, start)}${html.slice(end)}`.replace(/^\s+/, '');
}

/**
 * @returns {{ items: string[], source: 'comment'|'heading'|'synthetic'|'none', html: string }}
 * `html` is the input with an explicit takeaways section removed when source is
 * comment or heading (so a Key Takeaways UI can render without duplicating it).
 */
export function analyzeKeyTakeaways(html) {
  if (!html || typeof html !== 'string') {
    return { items: [], source: 'none', html: html || '' };
  }

  const comment = html.match(COMMENT_BLOCK_RE);
  if (comment) {
    const items = itemsFromListHtml(comment[1]);
    if (items.length > 0) {
      return {
        items: items.slice(0, 8),
        source: 'comment',
        html: stripKeyTakeawaysSection(html),
      };
    }
  }

  const headingMatch = TAKEAWAYS_HEADING_RE.exec(html);
  if (headingMatch) {
    const afterHeading = headingMatch.index + headingMatch[0].length;
    const rest = html.slice(afterHeading);
    const nextHeading = rest.search(/<h[1-3][^>]*>/i);
    const sectionHtml = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
    let items = itemsFromListHtml(sectionHtml);
    if (items.length === 0) items = itemsFromParagraphHtml(sectionHtml);
    if (items.length > 0) {
      return {
        items: items.slice(0, 8),
        source: 'heading',
        html: stripKeyTakeawaysSection(html),
      };
    }
  }

  // Synthetic: first sentence under each H2 — do not strip body content.
  const takeaways = [];
  const h2Re = /<h2[^>]*>[\s\S]*?<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
  let m;
  while ((m = h2Re.exec(html)) !== null) {
    const sectionHtml = m[1] || '';
    const firstP = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!firstP) continue;
    const text = cleanLi(firstP[1]);
    if (!text) continue;
    const sentenceMatch = text.match(/^[^.!?]{20,240}[.!?]/);
    const sentence = (sentenceMatch ? sentenceMatch[0] : text).trim();
    if (sentence.length >= 30 && sentence.length <= 240) {
      takeaways.push(sentence);
    }
    if (takeaways.length >= 6) break;
  }

  if (takeaways.length > 0) {
    return { items: takeaways, source: 'synthetic', html };
  }

  return { items: [], source: 'none', html };
}

/** Back-compat helper used by callers that only need the bullet list. */
export function extractKeyTakeaways(html) {
  return analyzeKeyTakeaways(html).items;
}
