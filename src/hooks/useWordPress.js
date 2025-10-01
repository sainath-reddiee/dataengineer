// src/hooks/useWordPress.js - COMPLETE FINAL VERSION WITH ALL FIXES
import { useState, useEffect, useCallback } from 'react';
import wordpressApi from '@/services/wordpressApi';

// Hook for fetching posts with proper sorting and pagination
export const usePosts = ({ 
  page = 1, 
  per_page = 10, 
  categorySlug = null,
  search = null, 
  featured = null,
  trending = null,
  orderby = 'date',
  order = 'desc',
  enabled = true 
} = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryId, setCategoryId] = useState(null);

  // FIXED: Reset categoryId whenever categorySlug changes
  useEffect(() => {
    setCategoryId(null);
  }, [categorySlug]);

  const resolveCategoryId = useCallback(async () => {
    if (!categorySlug) {
      return null;
    }

    // Check if we already have the ID for this slug
    if (categoryId !== null) {
      return categoryId;
    }

    try {
      console.log('🔍 Resolving category ID for:', categorySlug);
      const id = await wordpressApi.getCategoryIdBySlug(categorySlug);
      setCategoryId(id);
      return id;
    } catch (error) {
      console.error('❌ Failed to resolve category ID:', error);
      throw error;
    }
  }, [categorySlug, categoryId]);

  const fetchPosts = useCallback(async (forceRefresh = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('🔄 usePosts: Fetching posts with params:', { 
        page, per_page, categorySlug, search, featured, trending, orderby, order, forceRefresh 
      });

      let resolvedCategoryId = null;
      
      // Always resolve category if we have a slug
      if (categorySlug) {
        resolvedCategoryId = await resolveCategoryId();
      }

      if (forceRefresh) {
        console.log('🧹 Force refresh - clearing cache');
        wordpressApi.clearCache();
      }

      const result = await wordpressApi.getPosts({ 
        page, 
        per_page, 
        categoryId: resolvedCategoryId,
        search, 
        featured,
        trending,
        orderby,
        order
      });

      setPosts(result.posts);
      setTotalPages(result.totalPages);
      setTotalPosts(result.totalPosts);
      setHasMore(page < result.totalPages);

      console.log('✅ usePosts: Posts loaded successfully:', {
        postsCount: result.posts.length,
        totalPages: result.totalPages,
        totalPosts: result.totalPosts,
        hasMore: page < result.totalPages,
        currentPage: page,
        categoryId: resolvedCategoryId
      });
    } catch (err) {
      console.error('❌ usePosts: Error fetching posts:', err);
      setError(err.message);
      setPosts([]);
      setTotalPages(1);
      setTotalPosts(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, per_page, categorySlug, search, featured, trending, orderby, order, enabled, refreshKey, resolveCategoryId]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered - incrementing refresh key');
    setCategoryId(null); // Reset category ID
    setRefreshKey(prev => prev + 1);
    await fetchPosts(true);
  }, [fetchPosts]);

  // Load more function with proper category handling
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      
      let resolvedCategoryId = null;
      if (categorySlug) {
        resolvedCategoryId = await resolveCategoryId();
      }
      
      const nextPage = page + 1;
      const result = await wordpressApi.getPosts({
        page: nextPage,
        per_page,
        categoryId: resolvedCategoryId,
        search,
        featured,
        trending,
        orderby,
        order
      });

      setPosts(prev => [...prev, ...result.posts]);
      setHasMore(nextPage < result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, per_page, categorySlug, search, featured, trending, orderby, order, loading, hasMore, resolveCategoryId]);

  useEffect(() => {
    console.log('📡 usePosts useEffect triggered, refreshKey:', refreshKey);
    fetchPosts(refreshKey > 0);
  }, [fetchPosts, refreshKey]);

  return { 
    posts, 
    loading, 
    error, 
    totalPages, 
    totalPosts,
    hasMore,
    refresh,
    loadMore,
    refetch: fetchPosts
  };
};

// Hook for fetching a single post
export const usePost = (slug, enabled = true) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async (forceRefresh = false) => {
    if (!enabled || !slug) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('📄 usePost: Fetching post with slug:', slug);

      if (forceRefresh) {
        wordpressApi.clearCache(`posts?slug=${slug}`);
      }

      const postData = await wordpressApi.getPostBySlug(slug);
      setPost(postData);

      console.log('✅ usePost: Post loaded successfully:', postData.title);
    } catch (err) {
      console.error('❌ usePost: Error fetching post:', err);
      setError(err.message);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [slug, enabled]);

  const refresh = useCallback(async () => {
    await fetchPost(true);
  }, [fetchPost]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refresh, refetch: fetchPost };
};

// Hook for fetching categories
export const useCategories = (enabled = true) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('📂 useCategories: Fetching categories with forceRefresh:', forceRefresh);

      if (forceRefresh) {
        wordpressApi.clearCache('categories');
      }

      const categoriesData = await wordpressApi.getCategories();
      setCategories(categoriesData);

      console.log('✅ useCategories: Categories loaded successfully:', categoriesData.length);
    } catch (err) {
      console.error('❌ useCategories: Error fetching categories:', err);
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const refresh = useCallback(async () => {
    await fetchCategories(true);
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refresh };
};

// Simplified hook for posts by category
export const usePostsByCategory = (categorySlug, { page = 1, per_page = 10, orderby = 'date', order = 'desc', enabled = true } = {}) => {
  return usePosts({ 
    page, 
    per_page, 
    categorySlug,
    orderby,
    order,
    enabled 
  });
};

// Hook for newsletter subscription
export const useNewsletter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const subscribe = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await wordpressApi.subscribeNewsletter(email);
      setSuccess(true);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { subscribe, loading, error, success, reset };
};

// Hook for contact form
export const useContact = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitForm = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await wordpressApi.submitContactForm(formData);
      setSuccess(true);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { submitForm, loading, error, success, reset };
};