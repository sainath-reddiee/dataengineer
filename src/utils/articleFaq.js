/**
 * Pull visible Q&A pairs from article HTML so we can render a real
 * FAQ accordion (required if FAQPage schema is also emitted).
 *
 * Prefer an explicit FAQ section. Otherwise only headings that end with
 * "?" count — titles like "How Snowflake stores data" are not questions.
 */

export const FAQ_SECTION_RE =
  /<h([1-3])[^>]*>\s*(?:[^\w<]{1,4}\s*)?(?:FAQ|FAQs|Frequently\s+Asked\s+Questions|Common\s+Questions)\b[^<]*<\/h\1>/i;

function stripTags(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateAnswer(text, max = 520) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastStop = slice.lastIndexOf('. ');
  return (lastStop > 120 ? slice.slice(0, lastStop + 1) : slice).trim();
}

function isQuestionHeading(text) {
  const q = String(text || '').trim();
  if (q.length < 12 || q.length > 180) return false;
  if (q.endsWith('?')) return true;
  if (/^(how)\s+(do|does|can|could|should|to)\b/i.test(q)) return true;
  // "Why burying LLM calls…" is a section title, not a question.
  if (/^why\b/i.test(q) && !/^why\s+(is|are|do|does|did|can|should|would|will|'s)\b/i.test(q)) {
    return false;
  }
  return /^(what|why|when|where|which|who)\b/i.test(q);
}

function isFaqQuestionText(text) {
  const q = String(text || '').trim();
  if (!q || /^related reading\b/i.test(q)) return false;
  return q.endsWith('?') && q.length >= 12 && q.length <= 180;
}

function addPair(pairs, seen, question, answer, limit) {
  const q = stripTags(question);
  const a = truncateAnswer(stripTags(answer));
  if (!q || q.length < 12 || q.length > 180) return false;
  if (a.length < 30) return false;
  const key = q.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  pairs.push({ question: q.endsWith('?') ? q : `${q}?`, answer: a });
  return pairs.length >= limit;
}

function firstParagraphs(html, maxChars = 520) {
  const parts = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const text = stripTags(match[1]);
    if (text.length < 20) continue;
    parts.push(text);
    if (parts.length >= 2 || parts.join(' ').length >= maxChars) break;
  }
  return parts.join(' ');
}

function extractHeadingFaqs(html, limit, seen) {
  const pairs = [];
  const headingRe = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [];
  let match;

  while ((match = headingRe.exec(html)) !== null) {
    matches.push({
      index: match.index,
      end: headingRe.lastIndex,
      question: stripTags(match[2]),
    });
  }

  for (let i = 0; i < matches.length; i += 1) {
    const question = matches[i].question;
    if (!isQuestionHeading(question)) {
      continue;
    }
    const bodyStart = matches[i].end;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const answer = firstParagraphs(html.slice(bodyStart, bodyEnd));
    if (addPair(pairs, seen, question, answer, limit)) break;
  }

  return pairs;
}

function extractInlineQa(html, limit, seen) {
  const pairs = [];
  const blocks = String(html || '').split(/<\/p>/i);
  for (let i = 0; i < blocks.length; i += 1) {
    const text = stripTags(`${blocks[i]}</p>`);
    const qMatch = text.match(/^Q\s*[:\-]\s*(.+)$/i);
    if (!qMatch) continue;
    let answer = '';
    for (let j = i + 1; j < blocks.length && answer.length < 520; j += 1) {
      const next = stripTags(`${blocks[j]}</p>`);
      if (/^Q\s*[:\-]/i.test(next)) break;
      answer += ` ${next.replace(/^A\s*[:\-]\s*/i, '')}`;
    }
    if (addPair(pairs, seen, qMatch[1], answer, limit)) break;
  }
  return pairs;
}

function extractSectionParagraphFaqs(sectionHtml, limit, seen) {
  const pairs = [];
  const paras = [];
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRe.exec(sectionHtml)) !== null) {
    const text = stripTags(match[1]);
    if (text) paras.push(text);
  }

  for (let i = 0; i < paras.length; i += 1) {
    if (!isFaqQuestionText(paras[i])) continue;
    let answer = '';
    for (let j = i + 1; j < paras.length; j += 1) {
      if (isFaqQuestionText(paras[j]) || /^related reading\b/i.test(paras[j])) break;
      answer += ` ${paras[j]}`;
    }
    if (addPair(pairs, seen, paras[i], answer, limit)) break;
  }
  return pairs;
}

const RELATED_READING_RE =
  /<p\b[^>]*>\s*(?:<(?:strong|b|em)[^>]*>\s*)?Related\s+reading\b/i;

function extractFaqSection(html, limit, seen) {
  const pairs = [];
  const marker = FAQ_SECTION_RE.exec(html);
  if (!marker) return { items: pairs, html, start: -1, end: -1 };

  const start = marker.index;
  const after = marker.index + marker[0].length;
  const rest = html.slice(after);
  const headingLevel = Number(marker[1]) || 2;
  const stopRe = new RegExp(`<h[1-${headingLevel}][^>]*>`, 'i');
  const nextSame = rest.search(stopRe);
  let end = nextSame === -1 ? html.length : after + nextSame;
  let section = html.slice(after, end);
  const leftoverIdx = section.search(RELATED_READING_RE);
  if (leftoverIdx >= 0) {
    end = after + leftoverIdx;
    section = html.slice(after, end);
  }

  const headingRe = /<h([3-5])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRe.exec(section)) !== null) {
    headings.push({
      question: stripTags(match[2]),
      end: match.index + match[0].length,
      index: match.index,
    });
  }

  if (headings.length >= 1) {
    for (let i = 0; i < headings.length; i += 1) {
      const bodyEnd = i + 1 < headings.length ? headings[i + 1].index : section.length;
      if (addPair(pairs, seen, headings[i].question, firstParagraphs(section.slice(headings[i].end, bodyEnd)), limit)) {
        break;
      }
    }
  }

  if (pairs.length < 1) {
    extractSectionParagraphFaqs(section, limit, seen).forEach((item) => {
      if (pairs.length < limit) pairs.push(item);
    });
  }

  if (pairs.length < 1) {
    extractInlineQa(section, limit, seen).forEach((item) => {
      if (pairs.length < limit) pairs.push(item);
    });
  }

  return { items: pairs, html, start, end };
}

export function stripArticleFaqSection(html) {
  const analysis = extractFaqSection(html, 8, new Set());
  if (analysis.start < 0 || analysis.items.length < 1) return html || '';
  return `${html.slice(0, analysis.start)}${html.slice(analysis.end)}`.replace(/^\s+/, '');
}

export function analyzeArticleFaqs(html, limit = 6) {
  if (!html || typeof html !== 'string') {
    return { items: [], source: 'none', html: html || '' };
  }

  const seen = new Set();
  const section = extractFaqSection(html, limit, seen);
  if (section.items.length >= 1) {
    return {
      items: section.items,
      source: 'section',
      html: stripArticleFaqSection(html),
    };
  }

  const items = [
    ...extractHeadingFaqs(html, limit, seen),
    ...extractInlineQa(html, limit, seen),
  ].slice(0, limit);

  return { items, source: items.length ? 'headings' : 'none', html };
}

export function extractArticleFaqs(html, limit = 6) {
  return analyzeArticleFaqs(html, limit).items;
}

export function renderArticleFaqHtml(items) {
  if (!Array.isArray(items) || items.length < 1) return '';
  const many = items.length > 1;

  const rows = items.map((item, index) => {
    const open = index < 2 ? ' open' : '';
    return `      <details class="article-faq-item"${open}>
        <summary>${escapeHtml(item.question)}</summary>
        <p>${escapeHtml(item.answer)}</p>
      </details>`;
  }).join('\n');

  return `<section class="article-faq" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading">${many ? 'Questions this article answers' : 'Question this article answers'}</h2>
      <p class="article-faq-kicker">${many
        ? 'Short answers first. Open a question to read the working note.'
        : 'The short answer first. Open it to read the working note.'}</p>
${rows}
    </section>`;
}

export function renderArticleFaqSchema(items) {
  if (!Array.isArray(items) || items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
