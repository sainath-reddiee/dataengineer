// src/hooks/useStats.js - OPTIMIZED: 2 API calls (down from 3), localStorage cache
import { useState, useEffect } from 'react';
import wordpressApi from '@/services/wordpressApi';
import { FALLBACK_ARTICLE_COUNT, FALLBACK_CATEGORY_COUNT } from '@/data/siteStats';

const CACHE_KEY = 'deh_stats_cache_v3';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Read cached stats from localStorage (returns null if stale or missing). */
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    if (!data.totalArticles || data.totalArticles < FALLBACK_ARTICLE_COUNT) return null;
    if (!data.totalCategories) return null;
    return data;
  } catch {
    return null;
  }
};

/** Persist stats to localStorage. */
const writeCache = (data) => {
  try {
    if (!data?.totalArticles || data.totalArticles < FALLBACK_ARTICLE_COUNT) return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage full or unavailable — ignore
  }
};

/** Derive update frequency from an array of post dates. */
const frequencyFromDates = (posts) => {
  if (posts.length < 2) return 'New';
  const dates = posts.map((p) => new Date(p.date).getTime());
  let total = 0;
  for (let i = 0; i < dates.length - 1; i++) {
    total += (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
  }
  const avg = total / (dates.length - 1);
  if (avg <= 1) return 'Daily';
  if (avg <= 7) return 'Weekly';
  if (avg <= 14) return 'Bi-weekly';
  if (avg <= 30) return 'Monthly';
  return 'Regular';
};

export const useStats = () => {
  const [stats, setStats] = useState(() => {
    const cached = readCache();
    if (cached) return { ...cached, loading: false, error: null };
    return {
      totalArticles: FALLBACK_ARTICLE_COUNT,
      totalCategories: FALLBACK_CATEGORY_COUNT,
      totalReaders: null,
      updateFrequency: 'Weekly',
      loading: false,
      error: null,
    };
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [countSettled, postsSettled, categoriesSettled] = await Promise.allSettled([
          wordpressApi.getPublishedPostCount(),
          wordpressApi.getPosts({ per_page: 10, orderby: 'date', order: 'desc' }),
          wordpressApi.getCategories(),
        ]);

        const liveCount = countSettled.status === 'fulfilled' ? Number(countSettled.value) : 0;
        const postsResult = postsSettled.status === 'fulfilled' ? postsSettled.value : null;
        const categoriesResult = categoriesSettled.status === 'fulfilled' ? categoriesSettled.value : null;

        const fromList = Number(postsResult?.totalPosts) || 0;
        const totalArticles = Math.max(liveCount, fromList, FALLBACK_ARTICLE_COUNT);
        const totalCategories = Array.isArray(categoriesResult) && categoriesResult.length > 0
          ? categoriesResult.filter((cat) => cat.name !== 'Uncategorized' && cat.count > 0).length
          : FALLBACK_CATEGORY_COUNT;
        const updateFrequency = postsResult?.posts ? frequencyFromDates(postsResult.posts) : 'Weekly';

        const data = {
          totalArticles,
          totalCategories,
          totalReaders: null,
          updateFrequency,
        };

        writeCache(data);
        setStats({ ...data, loading: false, error: null });
      } catch (error) {
        console.warn('Stats API error, applying resilient fallbacks:', error);
        setStats((prev) => ({
          ...prev,
          totalArticles: Math.max(prev.totalArticles || 0, FALLBACK_ARTICLE_COUNT),
          totalCategories: prev.totalCategories || FALLBACK_CATEGORY_COUNT,
          loading: false,
          error: null,
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};

export default useStats;
