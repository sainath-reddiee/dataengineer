/**
 * Which posts appear in article lists (archive, home, category, tag, author,
 * related, search) on both the React site and the static HTML.
 *
 * Held out of lists, while their own URLs keep working:
 * - merged posts: they 301 to the post that absorbed them (excludedSlugs.js)
 * - thin posts: under MIN_INDEXABLE_WORD_COUNT prose words. They are already
 *   noindexed; keeping them out of lists means a reviewer browsing the site
 *   meets the full articles first. A post returns to lists on its own once it
 *   is expanded past the threshold, because the count runs on live content.
 *
 * Same word count as the sitemap (countArticleIndexableWords), so a post is
 * listed exactly when it is in the sitemap.
 */
import { isExcludedArticleSlug } from './excludedSlugs.js';
import { MIN_INDEXABLE_WORD_COUNT } from './thinTags.js';
import { countArticleIndexableWords } from '../utils/articleIndexableWords.js';

// html is the post's full content.rendered. Pass nothing when the source has
// no full content (the related-posts endpoint only returns excerpts): the
// thin check is then skipped instead of hiding every post.
export function isListableArticle(slug, html) {
  if (!slug || isExcludedArticleSlug(slug)) return false;
  if (typeof html !== 'string' || html.length === 0) return true;
  return countArticleIndexableWords(html) >= MIN_INDEXABLE_WORD_COUNT;
}
