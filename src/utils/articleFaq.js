/**
 * Pull visible Q&A pairs from article HTML so we can render a real
 * FAQ accordion (required if FAQPage schema is also emitted).
 *
 * Only headings that end with "?" count — section titles like
 * "How Snowflake stores data" are not questions.
 */

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

function truncateAnswer(text, max = 420) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastStop = slice.lastIndexOf('. ');
  return (lastStop > 120 ? slice.slice(0, lastStop + 1) : slice).trim();
}

export function extractArticleFaqs(html, limit = 6) {
  if (!html || typeof html !== 'string') return [];

  const headingRe = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const pairs = [];
  const seen = new Set();
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

    const key = question.toLowerCase();
    if (seen.has(key)) continue;

    const bodyStart = matches[i].end;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const answer = truncateAnswer(stripTags(html.slice(bodyStart, bodyEnd)));
    if (answer.length < 30) continue;

    seen.add(key);
    pairs.push({ question, answer });
    if (pairs.length >= limit) break;
  }

  return pairs;
}
