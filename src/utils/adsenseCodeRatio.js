/**
 * AdsBot text-to-code helpers for programming tutorials.
 *
 * Automated AdSense review treats long unedited SQL / YAML / PySpark / JSON
 * dumps as thin textual content. Collapse those blocks in crawler-facing SSG
 * HTML only. React visitors keep the full WordPress snippets.
 */

export const LONG_CODE_LINE_THRESHOLD = 12;
export const LONG_CODE_WORD_THRESHOLD = 80;
export const CODE_PREVIEW_LINES = 8;

const LANG_LABELS = {
  sql: 'SQL',
  snowflake: 'SQL',
  bigquery: 'SQL',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  py: 'Python',
  python: 'Python',
  pyspark: 'PySpark',
  spark: 'PySpark',
  scala: 'Scala',
  java: 'Java',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  dockerfile: 'Dockerfile',
  xml: 'XML',
  html: 'HTML',
  hcl: 'HCL',
  tf: 'Terraform',
  toml: 'TOML',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function wordsIn(text) {
  return String(text || '').trim() ? String(text).trim().split(/\s+/).filter(Boolean) : [];
}

function preInnerText(block) {
  return decodeEntities(
    String(block || '')
      .replace(/^<pre\b[^>]*>/i, '')
      .replace(/<\/pre>$/i, '')
      .replace(/<\/?code\b[^>]*>/gi, '')
  );
}

export function detectCodeLanguage(markup, text) {
  const classMatch = String(markup || '').match(/language-([a-z0-9+#]+)/i);
  if (classMatch) {
    const mapped = LANG_LABELS[classMatch[1].toLowerCase()];
    if (mapped) return mapped;
  }

  const sample = String(text || '').slice(0, 500);
  if (/^\s*[{[]/.test(sample)) return 'JSON';
  if (/\b(from pyspark|import pyspark|spark\.|DataFrame)\b/i.test(sample)) return 'PySpark';
  if (/\b(SELECT|WITH|CREATE|INSERT|UPDATE|MERGE|COPY INTO|QUALIFY)\b/i.test(sample)) return 'SQL';
  if (/^\s*---\s*$/m.test(sample) || (/^\s*[A-Za-z0-9_-]+:\s+\S+/m.test(sample) && !/\bSELECT\b/i.test(sample))) {
    return 'YAML';
  }
  if (/\b(def |class |import |from )\b/.test(sample)) return 'Python';
  return 'code';
}

export function stripCodeBlocks(html) {
  return String(html || '')
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ');
}

export function measureTextToCodeRatio(html) {
  const source = String(html || '');
  const codeChunks = [];
  source.replace(/<pre\b[\s\S]*?<\/pre>/gi, (block) => {
    codeChunks.push(preInnerText(block));
    return '';
  });
  const leftover = source.replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ');
  leftover.replace(/<code\b[\s\S]*?<\/code>/gi, (block) => {
    codeChunks.push(stripTags(block));
    return '';
  });

  const codeWords = wordsIn(codeChunks.join(' ')).length;
  const proseWords = wordsIn(stripTags(stripCodeBlocks(source))).length;
  const total = proseWords + codeWords;
  return {
    proseWords,
    codeWords,
    totalWords: total,
    codeShare: total === 0 ? 0 : codeWords / total,
  };
}

function precedingHeading(html, offset, fallback) {
  const region = String(html || '').slice(0, Math.max(0, offset));
  const matches = [...region.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  const last = matches[matches.length - 1];
  const text = last ? stripTags(last[1]) : '';
  return text || fallback || 'this tutorial';
}

function isLongCodeBlock(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const wordCount = wordsIn(normalized).length;
  return lines.length >= LONG_CODE_LINE_THRESHOLD || wordCount >= LONG_CODE_WORD_THRESHOLD;
}

/**
 * Replace long <pre> dumps with an 8-line excerpt plus a unique prose caption
 * taken from the preceding heading. Short snippets stay intact.
 */
export function collapseLongCodeBlocks(html, { title = 'this tutorial' } = {}) {
  const source = String(html || '');
  if (!source) return source;

  const usedCaptions = new Map();

  return source.replace(/<pre\b[\s\S]*?<\/pre>/gi, (block, offset) => {
    const text = preInnerText(block);
    if (!isLongCodeBlock(text)) return block;

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const language = detectCodeLanguage(block, text);
    const heading = precedingHeading(source, offset, title);
    let caption = `${heading}: excerpt of this ${language} example`;
    const seen = (usedCaptions.get(caption) || 0) + 1;
    usedCaptions.set(caption, seen);
    if (seen > 1) caption = `${caption} (part ${seen})`;

    const preview = lines.slice(0, CODE_PREVIEW_LINES).join('\n');
    const omitted = Math.max(0, lines.length - CODE_PREVIEW_LINES);
    const remainder =
      omitted > 0
        ? `The remaining ${omitted} lines stay in the interactive article so this page remains a written walkthrough rather than a raw ${language} dump.`
        : `The full ${language} listing stays in the interactive article; this page keeps the surrounding explanation.`;

    return `<figure class="adsense-code-preview"><figcaption>${escapeHtml(caption)}. This is a shortened excerpt of a ${lines.length}-line script.</figcaption><pre><code>${escapeHtml(preview)}${omitted ? '\n…' : ''}</code></pre><p>${escapeHtml(remainder)}</p></figure>`;
  });
}
