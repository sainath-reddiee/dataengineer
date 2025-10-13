// src/hooks/useStats.js - SIMPLIFIED VERSION
import { useState, useEffect } from 'react';
import wordpressApi from '@/services/wordpressApi';

export const useStats = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 0,
    totalReaders: '10K+', // Static placeholder - change this value anytime!
    updateFrequency: 'Weekly',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Fetch real data from WordPress API
        const [postsResult, categoriesResult] = await Promise.all([
          wordpressApi.getPosts({ per_page: 1 }), // Just need total count
          wordpressApi.getCategories()
        ]);

        // Calculate total articles (DYNAMIC)
        const totalArticles = postsResult.totalPosts || 0;

        // Count non-"Uncategorized" categories (DYNAMIC)
        const totalCategories = categoriesResult.filter(
          cat => cat.name !== 'Uncategorized' && cat.count > 0
        ).length;

        // Static reader count (MANUAL - update this value whenever you want!)
        // Examples: '5K+', '10K+', '25K+', '50K+', '100K+', '1M+'
        const totalReaders = '10K+'; // ← CHANGE THIS VALUE TO UPDATE READER COUNT

        // Determine update frequency based on recent posts (DYNAMIC)
        const updateFrequency = await determineUpdateFrequency();

        setStats({
          totalArticles,
          totalCategories,
          totalReaders,
          updateFrequency,
          loading: false,
          error: null
        });

        console.log('✅ Stats loaded:', {
          totalArticles,
          totalCategories,
          totalReaders,
          updateFrequency
        });

      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};

// Determine update frequency based on recent posts
const determineUpdateFrequency = async () => {
  try {
    const result = await wordpressApi.getPosts({ 
      per_page: 10,
      orderby: 'date',
      order: 'desc'
    });

    if (result.posts.length < 2) return 'New';

    // Calculate average days between posts
    const dates = result.posts.map(post => new Date(post.date).getTime());
    const daysBetween = [];

    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
      daysBetween.push(diff);
    }

    const avgDays = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;

    // Determine frequency based on average
    if (avgDays <= 1) return 'Daily';
    if (avgDays <= 7) return 'Weekly';
    if (avgDays <= 14) return 'Bi-weekly';
    if (avgDays <= 30) return 'Monthly';
    return 'Regular';

  } catch (error) {
    console.error('Error determining update frequency:', error);
    return 'Regular';
  }
};

export default useStats;