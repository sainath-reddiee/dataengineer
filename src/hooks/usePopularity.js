// src/hooks/usePopularity.js - localStorage-based view count tracking for popular badge
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'deh_views';
const POPULAR_THRESHOLD = 10;

const getStoredViews = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveViews = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — silently ignore */ }
};

/**
 * Track a page view for the given slug and return view count + popular flag.
 * Deduplicates within the same session via sessionStorage.
 * @param {string} slug
 * @returns {{ views: number, isPopular: boolean }}
 */
export default function usePopularity(slug) {
  const [views, setViews] = useState(0);

  useEffect(() => {
    if (!slug) return;

    const allViews = getStoredViews();
    const sessionKey = `deh_seen_${slug}`;
    const alreadyCounted = sessionStorage.getItem(sessionKey);

    let count = allViews[slug] || 0;

    if (!alreadyCounted) {
      count += 1;
      allViews[slug] = count;
      saveViews(allViews);
      sessionStorage.setItem(sessionKey, '1');
    }

    setViews(count);
  }, [slug]);

  return { views, isPopular: views >= POPULAR_THRESHOLD };
}

/**
 * Read-only: get view count for a slug without incrementing.
 * Use this on listing pages (PostCard) to show counts without inflating them.
 * @param {string} slug
 * @returns {{ views: number, isPopular: boolean }}
 */
export function useViewCount(slug) {
  const [views] = useState(() => {
    if (!slug) return 0;
    const allViews = getStoredViews();
    return allViews[slug] || 0;
  });

  return { views, isPopular: views >= POPULAR_THRESHOLD };
}
