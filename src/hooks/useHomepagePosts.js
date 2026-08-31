import { usePosts } from '@/hooks/useWordPress';

/**
 * Featured/trending filters can return an empty set (or 522) even when
 * the site has 100+ articles. Fall back to the latest posts so the
 * homepage never looks like an empty brochure.
 *
 * After the primary request settles, do not flip back into a loading
 * skeleton while the latest-posts retry runs — callers already paint
 * bundled titles in that gap.
 */
export function useHomepagePosts({
  per_page = 3,
  featured = null,
  trending = null,
} = {}) {
  const primary = usePosts({ per_page, featured, trending });
  const needsLatest = !primary.loading && (Boolean(primary.error) || primary.posts.length === 0);
  const latest = usePosts({
    per_page,
    enabled: needsLatest,
  });

  if (primary.posts.length > 0) {
    return { posts: primary.posts, loading: false, error: null };
  }

  if (primary.loading) {
    return { posts: [], loading: true, error: null };
  }

  if (latest.posts.length > 0) {
    return { posts: latest.posts, loading: false, error: null };
  }

  return {
    posts: [],
    loading: false,
    error: primary.error || latest.error || null,
  };
}
