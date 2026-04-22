// src/hooks/useStats.js - OPTIMIZED: 2 API calls (down from 3), localStorage cache
import { useState, useEffect } from 'react';
import wordpressApi from '@/services/wordpressApi';

const CACHE_KEY = 'deh_stats_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Read cached stats from localStorage (returns null if stale or missing). */
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
};

/** Persist stats to localStorage. */
const writeCache = (data) => {
  try {
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
    // Hydrate from cache immediately so the UI never shows "0"
    const cached = readCache();
    if (cached) return { ...cached, loading: false, error: null };
    return {
      totalArticles: 0,
      totalCategories: 0,
      totalReaders: null,
      updateFrequency: 'Weekly',
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    // If we served from cache, skip the network round-trip
    const cached = readCache();
    if (cached) return;

    const fetchStats = async () => {
      try {
        // 2 parallel calls (was 3): one getPosts call serves both
        // totalPosts count AND date array for frequency calculation
        const [postsResult, categoriesResult] = await Promise.all([
          wordpressApi.getPosts({ per_page: 10, orderby: 'date', order: 'desc' }),
          wordpressApi.getCategories(),
        ]);

        const totalArticles = postsResult.totalPosts || 0;

        const totalCategories = categoriesResult.filter(
          (cat) => cat.name !== 'Uncategorized' && cat.count > 0
        ).length;

        const updateFrequency = frequencyFromDates(postsResult.posts);

        const data = {
          totalArticles,
          totalCategories,
          totalReaders: null,
          updateFrequency,
        };

        writeCache(data);

        setStats({ ...data, loading: false, error: null });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};

export default useStats;