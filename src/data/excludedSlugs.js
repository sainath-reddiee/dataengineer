/**
 * Article slugs that 301 to a canonical URL via public/.htaccess.
 * Listing them in sitemaps, RSS, or LLM indexes is a duplicate-URL
 * signal AdSense and citation crawlers treat as low-value.
 */
export const EXCLUDED_ARTICLE_SLUGS = [
  'snowflake-query-optimization-2025',
  'building-snowflake-agents-in-10-minutes',
  'build-a-snowflake-agent-in-10-minutes',
  'snowflake-unique-aggregation-hidden-functions',
  'snowflake-options-automate-query-optimization-guide',
  'build-a-simple-rag-application-in-snowflake-using-streamlit-and-snowflake-cortex',
  'build-rag-snowflake-documentation',
  'snowflake-openflow-tutorial',
  'snowflake-performance',
  'snowflake-performance-tuning-techniques',
  'loading-data-from-s3-to-snowflake',
];

export function isExcludedArticleSlug(slug) {
  return EXCLUDED_ARTICLE_SLUGS.includes(slug);
}
