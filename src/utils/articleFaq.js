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
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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
    if (!question.endsWith('?') || question.length < 12 || question.length > 180) {
      continue;
    }
    const bodyStart = matches[i].end;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : html.length;
    if (addPair(pairs, seen, question, html.slice(bodyStart, bodyEnd), limit)) break;
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
  const end = nextSame === -1 ? html.length : after + nextSame;
  const section = html.slice(after, end);

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

  if (headings.length >= 2) {
    for (let i = 0; i < headings.length; i += 1) {
      const bodyEnd = i + 1 < headings.length ? headings[i + 1].index : section.length;
      if (addPair(pairs, seen, headings[i].question, section.slice(headings[i].end, bodyEnd), limit)) {
        break;
      }
    }
  } else {
    extractInlineQa(section, limit, seen).forEach((item) => {
      if (pairs.length < limit) pairs.push(item);
    });
  }

  return { items: pairs, html, start, end };
}

export function stripArticleFaqSection(html) {
  const analysis = extractFaqSection(html, 8, new Set());
  if (analysis.start < 0 || analysis.items.length < 2) return html || '';
  return `${html.slice(0, analysis.start)}${html.slice(analysis.end)}`.replace(/^\s+/, '');
}

export function analyzeArticleFaqs(html, limit = 6) {
  if (!html || typeof html !== 'string') {
    return { items: [], source: 'none', html: html || '' };
  }

  const seen = new Set();
  const section = extractFaqSection(html, limit, seen);
  if (section.items.length >= 2) {
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
  if (!Array.isArray(items) || items.length < 2) return '';

  const rows = items.map((item, index) => {
    const open = index < 2 ? ' open' : '';
    return `      <details class="article-faq-item"${open}>
        <summary>${escapeHtml(item.question)}</summary>
        <p>${escapeHtml(item.answer)}</p>
      </details>`;
  }).join('\n');

  return `<section class="article-faq" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading">Questions this article answers</h2>
      <p class="article-faq-kicker">Short answers first. Open a question to read the working note.</p>
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
