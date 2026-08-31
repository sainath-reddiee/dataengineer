import { useEffect, useMemo, useState } from 'react';
import { fetchSsgArticleHtml, getParkedSsgArticle } from '@/utils/ssgArticle';

/**
 * Full page loads reuse HTML parked before createRoot(). In-app clicks
 * have no parked snapshot for the new slug, so we fetch the static
 * article document in parallel with WordPress.
 */
export function useSsgArticleFallback(slug, enabled = true) {
  const parked = useMemo(() => getParkedSsgArticle(slug), [slug]);
  const [fetched, setFetched] = useState('');

  useEffect(() => {
    if (!enabled || parked || !slug) {
      setFetched('');
      return undefined;
    }

    let cancelled = false;
    fetchSsgArticleHtml(slug).then((html) => {
      if (!cancelled) setFetched(html || '');
    });

    return () => {
      cancelled = true;
    };
  }, [slug, parked, enabled]);

  return parked || fetched;
}
