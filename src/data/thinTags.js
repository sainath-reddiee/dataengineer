/**
 * Tag slugs that currently have 0–2 published posts.
 * AdSense treats one-card tag archives as low-value / doorway pages.
 * Keep in sync with public/.htaccess 301s.
 * 
 * ADSENSE-PROOFED: Raised thresholds to eliminate thin content risk.
 * - MIN_INDEXABLE_TAG_COUNT: 5 (was 3) - need 5+ articles per tag
 * - MIN_INDEXABLE_CATEGORY_COUNT: 5 (was 3) - need 5+ articles per category
 * - MIN_INDEXABLE_WORD_COUNT: 800 (was 400) - articles need 800+ prose words
 */
export const MIN_INDEXABLE_TAG_COUNT = 5;
export const MIN_INDEXABLE_CATEGORY_COUNT = 5;
export const MIN_INDEXABLE_WORD_COUNT = 800;

export const THIN_TAG_SLUGS = new Set([
  'ai-coding',
  'anthropic',
  'ci-cd',
  'claude-code',
  'claude-md',
  'copilot',
  'delta-lake',
  'developer-tools',
  'duckdb',
  'fusion',
  'gcp',
  'migration',
  'ml',
  'openflow',
  'osi',
  'perfect',
  'prompt-engineering',
  'rag',
  'security',
  'synapse',
  'databricks',
  'llm',
  'optimization',
  'i',
]);

export function isIndexableTag(tag) {
  if (!tag) return false;
  const slug = String(tag.slug || '').toLowerCase();
  if (THIN_TAG_SLUGS.has(slug)) return false;
  if (typeof tag.count === 'number' && tag.count < MIN_INDEXABLE_TAG_COUNT) return false;
  return true;
}
