/**
 * Reader-facing article code blocks.
 *
 * Every article <pre> is wrapped the same way (React + SSG). Long dumps are
 * still collapsed for AdsBot by collapseLongCodeBlocks; this helper skips
 * those preview figures and only styles what humans (and leftover short
 * snippets) actually read.
 */
import { detectCodeLanguage } from './adsenseCodeRatio.js';

export const CODE_EXPAND_LINE_THRESHOLD = 16;

const LEDES = {
  SQL: 'SQL example — read the query, then copy it into your warehouse.',
  Python: 'Python example — skim the functions, then copy what you need.',
  PySpark: 'PySpark example — check the DataFrame steps, then rename catalogs.',
  YAML: 'YAML example — confirm the keys before you paste this into config.',
  JSON: 'JSON example — use this payload as a starting point.',
  JavaScript: 'JavaScript example — copy the helper, then wire your inputs.',
  TypeScript: 'TypeScript example — copy the helper, then wire your inputs.',
  shell: 'Shell commands — run these in your terminal or CI/CD pipeline.',
  Snippet: 'Code example — copy the snippet, then match it to your project.',
};

const KEYWORDS = {
  SQL: /\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|BY|ORDER|LIMIT|WITH|AS|INSERT|INTO|VALUES|CREATE|TABLE|VIEW|QUALIFY|HAVING|UNION|CASE|WHEN|THEN|ELSE|END|NOT|NULL|IN|EXISTS|DISTINCT|OVER|PARTITION|COPY|MERGE|UPDATE|DELETE|SET|USING)\b/gi,
  Python: /\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|None|True|False|yield|async|await|try|except|finally|with|as|lambda|pass|raise|self)\b/g,
  PySpark: /\b(def|class|import|from|return|if|else|for|in|None|True|False|with|as|spark|DataFrame)\b/g,
  JavaScript: /\b(const|let|var|function|return|if|else|for|while|of|in|await|async|import|from|export|class|new|this)\b/g,
  TypeScript: /\b(const|let|var|function|return|if|else|for|while|of|in|await|async|import|from|export|class|new|this|type|interface)\b/g,
  shell: /\b(cd|snow|dbt|git|docker|pip|npm|npx|curl|export|source|echo|cat|grep|mkdir|rm|chmod|sudo|aws|gcloud|az|kubectl|terraform|python|python3|pytest)\b/g,
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function preText(block) {
  let text = String(block || '')
    .replace(/^<pre\b[^>]*>/i, '')
    .replace(/<\/pre>$/i, '')
    .replace(/<\/?code\b[^>]*>/gi, '')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/?p\b[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function alreadyWrapped(html, offset) {
  const before = html.slice(0, offset);
  const start = before.lastIndexOf('<figure');
  if (start === -1) return false;
  const window = before.slice(start);
  if (window.includes('</figure>')) return false;
  return /article-code|adsense-code-preview/.test(window);
}

function highlightLine(escaped, language) {
  // 1. Full-line comment (starts with # or --)
  if (/^\s*(?:#|--)/.test(escaped)) {
    return `<span class="tok-comment">${escaped}</span>`;
  }

  let line = escaped;

  // 2. Trailing comments
  const commentMatch = line.match(/^([\s\S]*?)(\s+#\s+[\s\S]*|\s+--\s+[\s\S]*)$/);
  let trailingComment = '';
  if (commentMatch) {
    line = commentMatch[1];
    trailingComment = `<span class="tok-comment">${commentMatch[2]}</span>`;
  }

  // 3. Quoted strings ("..." or '...')
  line = line.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, '<span class="tok-str">$&</span>');

  // 4. CLI flags (--target, --save-output, -v)
  if (language === 'shell' || language === 'Snippet') {
    line = line.replace(/\b(--[a-zA-Z0-9_-]+|-[a-zA-Z0-9])\b/g, '<span class="tok-flag">$&</span>');
  }

  // 5. Language keywords
  const pattern = KEYWORDS[language];
  if (pattern) {
    pattern.lastIndex = 0;
    line = line.replace(pattern, (match) => `<span class="tok-kw">${match}</span>`);
  }

  return line + trailingComment;
}

export function renderHighlightedCode(text, language) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  return lines.map((line, index) => {
    const highlighted = highlightLine(escapeHtml(line), language);
    return `<span class="article-code-line"><span class="article-code-gutter" aria-hidden="true">${index + 1}</span><span class="article-code-src">${highlighted || ' '}</span></span>`;
  }).join('');
}

export function enhanceArticleCodeBlocks(html) {
  const source = String(html || '');
  if (!source) return source;

  return source.replace(/<pre\b[\s\S]*?<\/pre>/gi, (block, offset) => {
    if (alreadyWrapped(source, offset)) return block;
    if (/adsense-code-preview|article-code/.test(block)) return block;

    const text = preText(block);
    if (!text.trim()) return block;

    const detected = detectCodeLanguage(block, text);
    const language = detected === 'code' ? 'Snippet' : detected;
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const lineCount = lines.length;
    const longClass = lineCount >= CODE_EXPAND_LINE_THRESHOLD ? ' is-long' : '';
    const lede = LEDES[language] || LEDES.Snippet;
    const highlighted = renderHighlightedCode(text, language);

    return `<figure class="article-code${longClass}" data-lang="${escapeHtml(language)}" data-lines="${lineCount}">
      <figcaption class="article-code-bar">
        <span class="article-code-lang">${escapeHtml(language)}</span>
        <span class="article-code-meta">${lineCount} line${lineCount === 1 ? '' : 's'}</span>
        <span class="article-code-actions"></span>
      </figcaption>
      <p class="article-code-lede">${escapeHtml(lede)}</p>
      <pre class="article-code-pre"><code class="language-${escapeHtml(String(language).toLowerCase())}">${highlighted}</code></pre>
      ${lineCount >= CODE_EXPAND_LINE_THRESHOLD
        ? `<button type="button" class="article-code-expand compact-control">Show all ${lineCount} lines</button>`
        : ''}
    </figure>`;
  });
}
