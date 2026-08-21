/**
 * Patch src/data/seoOverrides.js source text: insert or replace a slug entry.
 * Live SERP titles come from this file (ArticlePage + SSG), not from WordPress H1s.
 */

export function escapeJsSingleQuoted(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/\u2028|\u2029/g, ' ');
}

export function formatSeoOverrideEntry(slug, title, description) {
  return `'${escapeJsSingleQuoted(slug)}': {\n    title: '${escapeJsSingleQuoted(title)}',\n    description: '${escapeJsSingleQuoted(description)}'\n  }`;
}

export function upsertSeoOverrideSource(fileText, slug, title, description) {
  if (!slug || !title) {
    throw new Error('slug and title are required');
  }
  const entry = formatSeoOverrideEntry(slug, title, description);
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = new RegExp(`'${escapedSlug}':\\s*\\{[\\s\\S]*?\\n  \\}`, 'm');
  if (existing.test(fileText)) {
    return fileText.replace(existing, entry);
  }

  const closeIdx = fileText.lastIndexOf('\n};');
  if (closeIdx === -1) {
    throw new Error('Could not find SEO_OVERRIDES closing brace');
  }
  const before = fileText.slice(0, closeIdx);
  const lastObjEnd = before.lastIndexOf('}');
  if (lastObjEnd === -1) {
    throw new Error('Could not find last override object');
  }
  const withComma = `${before.slice(0, lastObjEnd + 1)},${before.slice(lastObjEnd + 1)}`;
  return `${withComma},\n  ${entry}${fileText.slice(closeIdx)}`;
}
