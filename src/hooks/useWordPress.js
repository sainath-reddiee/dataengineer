import { useState, useEffect, useCallback } from 'react';
import wordpressApi from '@/services/wordpressApi';

// Hook for fetching posts - ENHANCED & FIXED
export const usePosts = ({ 
  page = 1, 
  per_page = 10, 
  categorySlug = null,
  search = null, 
  featured = null,
  enabled = true 
} = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPosts = useCallback(async (forceRefresh = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (!forceRefresh) {
        setLoading(true);
      }

      console.log('🔄 usePosts: Fetching posts with params:', { 
        page, per_page, categorySlug, search, featured, forceRefresh 
      });

      let categoryId = null;
      
      // Convert category slug to ID if provided
      if (categorySlug) {
        console.log('🏷️ Converting category slug to ID:', categorySlug);
        try {
          categoryId = await wordpressApi.getCategoryIdBySlug(categorySlug);
          console.log('✅ Category ID resolved:', categoryId);
        } catch (categoryError) {
          console.error('❌ Category resolution failed:', categoryError);
          throw new Error(`Category "${categorySlug}" not found. Please check if the category exists.`);
        }
      }

      // Clear cache if force refresh
      if (forceRefresh) {
        wordpressApi.clearCache();
      }

      const result = await wordpressApi.getPosts({ 
        page, 
        per_page, 
        categoryId,
        search, 
        featured
      });

      setPosts(result.posts);
      setTotalPages(result.totalPages);
      setTotalPosts(result.totalPosts);
      setHasMore(page < result.totalPages);

      console.log('✅ usePosts: Posts loaded successfully:', {
        postsCount: result.posts.length,
        totalPages: result.totalPages,
        totalPosts: result.totalPosts,
        hasMore: page < result.totalPages
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
  }, [page, per_page, categorySlug, search, featured, enabled]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchPosts(true);
  }, [fetchPosts]);

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      
      let categoryId = null;
      if (categorySlug) {
        categoryId = await wordpressApi.getCategoryIdBySlug(categorySlug);
      }
      
      const nextPage = page + 1;
      const result = await wordpressApi.getPosts({
        page: nextPage,
        per_page,
        categoryId,
        search,
        featured
      });

      setPosts(prev => [...prev, ...result.posts]);
      setHasMore(nextPage < result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, per_page, categorySlug, search, featured, loading, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

// Hook for fetching a single post - ENHANCED
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
      if (!forceRefresh) {
        setLoading(true);
      }

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

  return { post, loading, error, refresh };
};

// Hook for fetching categories - ENHANCED
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
      if (!forceRefresh) {
        setLoading(true);
      }

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
export const usePostsByCategory = (categorySlug, { page = 1, per_page = 10, enabled = true } = {}) => {
  return usePosts({ 
    page, 
    per_page, 
    categorySlug, 
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