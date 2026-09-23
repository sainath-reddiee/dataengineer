/**
 * Floor for public article / category counts when WordPress is slow or
 * the X-WP-Total header is missing. Bump when the library grows a lot
 * so the homepage never flashes an old 82 again.
 */
export const FALLBACK_ARTICLE_COUNT = 115;
export const FALLBACK_CATEGORY_COUNT = 15;
