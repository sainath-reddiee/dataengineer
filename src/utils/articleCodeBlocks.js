/**
 * Wrap article <pre> blocks in a language bar + caption so readers can
 * copy a snippet without a wall of SQL, and AdsBot sees a prose label
 * next to (not instead of) short examples.
 *
 * Long dumps stay collapsed by collapseLongCodeBlocks for crawlers.
 * This helper skips those preview figures.
 */
import { detectCodeLanguage } from './adsenseCodeRatio.js';

const HINTS = {
  SQL: 'Read the query, then copy it into your warehouse.',
  Python: 'Skim the script, then copy the functions you need.',
  PySpark: 'Check the DataFrame steps, then adapt the names to your catalog.',
  YAML: 'Confirm the keys, then paste the block into your config.',
  JSON: 'Use this payload as a starting point, not a dump to publish.',
  JavaScript: 'Copy the helper, then wire it to your own inputs.',
  TypeScript: 'Copy the helper, then wire it to your own inputs.',
  shell: 'Run the command in a scratch session before you change production.',
  code: 'Copy the snippet, then change names to match your project.',
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
  return decodeEntities(
    String(block || '')
      .replace(/^<pre\b[^>]*>/i, '')
      .replace(/<\/pre>$/i, '')
      .replace(/<\/?code\b[^>]*>/gi, '')
  );
}

function alreadyWrapped(html, offset) {
  const before = html.slice(0, offset);
  const start = Math.max(before.lastIndexOf('<figure'), before.lastIndexOf('<div'));
  if (start === -1) return false;
  const window = before.slice(start);
  if (window.includes('</figure>') || window.includes('</div>')) return false;
  return /article-code|adsense-code-preview/.test(window);
}

function lineCount(text) {
  return String(text || '').replace(/\r\n/g, '\n').split('\n').length;
}

export function enhanceArticleCodeBlocks(html) {
  const source = String(html || '');
  if (!source) return source;

  return source.replace(/<pre\b[\s\S]*?<\/pre>/gi, (block, offset) => {
    if (alreadyWrapped(source, offset)) return block;
    if (/adsense-code-preview|article-code/.test(block)) return block;

    const text = preText(block);
    if (!text.trim()) return block;

    const language = detectCodeLanguage(block, text);
    const hint = HINTS[language] || HINTS.code;
    const lines = lineCount(text);
    const longClass = lines >= 16 ? ' is-long' : '';

    return `<figure class="article-code${longClass}" data-lang="${escapeHtml(language)}">
      <figcaption class="article-code-bar">
        <span class="article-code-lang">${escapeHtml(language)}</span>
        <span class="article-code-hint">${escapeHtml(hint)}</span>
        <span class="article-code-actions"></span>
      </figcaption>
      ${block}
    </figure>`;
  });
}
