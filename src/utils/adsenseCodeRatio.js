/**
 * Text-to-code helpers for programming tutorials: language detection and
 * prose vs code word measurement.
 *
 * Code blocks are never rewritten for crawlers. Static HTML and React show
 * the same full snippets to every visitor.
 */

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
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<\/?p\b[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  );
}

export function detectCodeLanguage(markup, text) {
  const classMatch = String(markup || '').match(/language-([a-z0-9+#]+)/i);
  if (classMatch) {
    const mapped = LANG_LABELS[classMatch[1].toLowerCase()];
    if (mapped) return mapped;
  }

  const sample = String(text || '').slice(0, 800);
  if (/\b(from pyspark|import pyspark|spark\.|DataFrame)\b/i.test(sample)) return 'PySpark';
  if (/(?:^|\n)\s*(?:\$|#!\/bin\/(?:bash|sh)|cd\s|snow\s|dbt\s|pip\s|npm\s|npx\s|docker\s|git\s|curl\s|export\s|kubectl\s)/m.test(sample)) {
    return 'shell';
  }
  if (/\b(def\s+\w+\s*\(|class\s+\w+|import\s+\w+|from\s+[\w.]+\s+import|@dataclass|None\s*=|True\s*=|False\s*=)\b/.test(sample)) return 'Python';
  if (/^\s*[{[]/.test(sample)) return 'JSON';
  if (/\b(SELECT|WITH|CREATE|INSERT|UPDATE|MERGE|COPY INTO|QUALIFY)\b/i.test(sample)) return 'SQL';
  const yamlKeys = sample.match(/^\s*[A-Za-z0-9_-]+:\s+\S+/gm) || [];
  if (/^\s*---\s*$/m.test(sample) || (yamlKeys.length >= 2 && !/\b(SELECT|def |class |import )\b/i.test(sample))) {
    return 'YAML';
  }
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
