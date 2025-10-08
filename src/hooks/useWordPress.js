// src/hooks/useWordPress.js - COMPLETE FINAL VERSION WITH TAG SUPPORT
import { useState, useEffect, useCallback, useRef } from 'react';
import wordpressApi from '@/services/wordpressApi';

// Hook for fetching posts with proper sorting and pagination
export const usePosts = ({
  page = 1,
  per_page = 10,
  categorySlug = null,
  tag = null,
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

  // Track the current request to prevent race conditions
  const currentRequestRef = useRef(0);

  // CRITICAL FIX: Reset posts immediately when categorySlug changes
  useEffect(() => {
    console.log('🔄 Category/search/tag changed, resetting state:', { categorySlug, search, tag });
    setPosts([]);
    setError(null);
    setLoading(true);
    setTotalPages(1);
    setTotalPosts(0);
    setHasMore(false);
  }, [categorySlug, search, tag]);

  // Fetch posts with race condition protection
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Increment request counter to track this specific request
    const requestId = ++currentRequestRef.current;
    let isCancelled = false;

    const fetchPosts = async () => {
      try {
        setError(null);
        setLoading(true);

        console.log(`🔄 [Request #${requestId}] usePosts: Fetching posts with params:`, {
          page, per_page, categorySlug, tag, search, featured, trending, orderby, order
        });

        if (refreshKey > 0) {
          console.log('🧹 Force refresh - clearing cache');
          wordpressApi.clearCache();
        }

        // Get category ID fresh every time if needed
        let categoryId = null;
        if (categorySlug) {
          try {
            categoryId = await wordpressApi.getCategoryIdBySlug(categorySlug);

            // Check if this request is still valid
            if (isCancelled || requestId !== currentRequestRef.current) {
              console.log(`⚠️ [Request #${requestId}] Cancelled - newer request exists`);
              return;
            }

            console.log(`✅ [Request #${requestId}] Category resolved:`, categorySlug, '→', categoryId);
          } catch (catError) {
            if (isCancelled || requestId !== currentRequestRef.current) {
              console.log(`⚠️ [Request #${requestId}] Cancelled during category resolution`);
              return;
            }
            console.error(`❌ [Request #${requestId}] Category resolution failed:`, catError);
            throw new Error(`Category "${categorySlug}" not found. Please check if it exists.`);
          }
        }

        // Get tag ID if needed (NEW)
        let tagId = tag;
        if (typeof tag === 'string') {
          try {
            tagId = await wordpressApi.getTagIdBySlug(tag);

            if (isCancelled || requestId !== currentRequestRef.current) {
              console.log(`⚠️ [Request #${requestId}] Cancelled during tag resolution`);
              return;
            }

            console.log(`✅ [Request #${requestId}] Tag resolved:`, tag, '→', tagId);
          } catch (tagError) {
            if (isCancelled || requestId !== currentRequestRef.current) {
              console.log(`⚠️ [Request #${requestId}] Cancelled during tag resolution`);
              return;
            }
            console.error(`❌ [Request #${requestId}] Tag resolution failed:`, tagError);
            throw new Error(`Tag "${tag}" not found. Please check if it exists.`);
          }
        }

        const result = await wordpressApi.getPosts({
          page,
          per_page,
          categoryId,
          tag: tagId,
          search,
          featured,
          trending,
          orderby,
          order
        });

        // Final check before updating state
        if (isCancelled || requestId !== currentRequestRef.current) {
          console.log(`⚠️ [Request #${requestId}] Cancelled - not updating state`);
          return;
        }

        // Handle pagination - append or replace
        if (page === 1) {
          setPosts(result.posts);
        } else {
          setPosts(prev => [...prev, ...result.posts]);
        }

        setTotalPages(result.totalPages);
        setTotalPosts(result.totalPosts);
        setHasMore(page < result.totalPages);

        console.log(`✅ [Request #${requestId}] Posts loaded successfully:`, {
          postsCount: result.posts.length,
          totalPages: result.totalPages,
          totalPosts: result.totalPosts,
          hasMore: page < result.totalPages,
          currentPage: page,
          categoryId,
          tagId
        });
      } catch (err) {
        // Only update error state if this request is still current
        if (!isCancelled && requestId === currentRequestRef.current) {
          console.error(`❌ [Request #${requestId}] Error fetching posts:`, err);
          setError(err.message);
          setPosts([]);
          setTotalPages(1);
          setTotalPosts(0);
          setHasMore(false);
        }
      } finally {
        // Only update loading state if this request is still current
        if (!isCancelled && requestId === currentRequestRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    // Cleanup function to cancel this request if component unmounts or deps change
    return () => {
      isCancelled = true;
      console.log(`🧹 [Request #${requestId}] Cleanup - marking as cancelled`);
    };
  }, [page, per_page, categorySlug, tag, search, featured, trending, orderby, order, enabled, refreshKey]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered - incrementing refresh key');
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load more function with proper category handling
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    const requestId = ++currentRequestRef.current;

    try {
      setLoading(true);

      let categoryId = null;
      if (categorySlug) {
        categoryId = await wordpressApi.getCategoryIdBySlug(categorySlug);

        // Check if request is still valid
        if (requestId !== currentRequestRef.current) {
          console.log(`⚠️ [LoadMore #${requestId}] Cancelled`);
          return;
        }
      }

      let tagId = tag;
      if (typeof tag === 'string') {
        tagId = await wordpressApi.getTagIdBySlug(tag);

        if (requestId !== currentRequestRef.current) {
          console.log(`⚠️ [LoadMore #${requestId}] Cancelled`);
          return;
        }
      }

      const nextPage = page + 1;
      const result = await wordpressApi.getPosts({
        page: nextPage,
        per_page,
        categoryId,
        tag: tagId,
        search,
        featured,
        trending,
        orderby,
        order
      });

      // Only update if still the current request
      if (requestId === currentRequestRef.current) {
        setPosts(prev => [...prev, ...result.posts]);
        setHasMore(nextPage < result.totalPages);
      }
    } catch (err) {
      if (requestId === currentRequestRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, [page, per_page, categorySlug, tag, search, featured, trending, orderby, order, loading, hasMore]);

  return {
    posts,
    loading,
    error,
    totalPages,
    totalPosts,
    hasMore,
    refresh,
    loadMore
  };
};

// Hook for fetching a single post
export const usePost = (slug, enabled = true) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentRequestRef = useRef(0);

  useEffect(() => {
    if (!enabled || !slug) {
      setLoading(false);
      return;
    }

    const requestId = ++currentRequestRef.current;
    let isCancelled = false;

    const fetchPost = async () => {
      try {
        setError(null);
        setLoading(true);

        console.log(`📄 [Request #${requestId}] usePost: Fetching post with slug:`, slug);

        const postData = await wordpressApi.getPostBySlug(slug);

        if (!isCancelled && requestId === currentRequestRef.current) {
          setPost(postData);
          console.log(`✅ [Request #${requestId}] Post loaded successfully:`, postData.title);
        }
      } catch (err) {
        if (!isCancelled && requestId === currentRequestRef.current) {
          console.error(`❌ [Request #${requestId}] Error fetching post:`, err);
          setError(err.message);
          setPost(null);
        }
      } finally {
        if (!isCancelled && requestId === currentRequestRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      isCancelled = true;
      console.log(`🧹 [Request #${requestId}] usePost cleanup`);
    };
  }, [slug, enabled]);

  const refresh = useCallback(async () => {
    if (!slug) return;

    wordpressApi.clearCache(`posts?slug=${slug}`);
    const requestId = ++currentRequestRef.current;

    try {
      setLoading(true);
      const postData = await wordpressApi.getPostBySlug(slug);

      if (requestId === currentRequestRef.current) {
        setPost(postData);
      }
    } catch (err) {
      if (requestId === currentRequestRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, [slug]);

  return { post, loading, error, refresh };
};

// Hook for fetching categories
export const useCategories = (enabled = true) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentRequestRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const requestId = ++currentRequestRef.current;
    let isCancelled = false;

    const fetchCategories = async () => {
      try {
        setError(null);
        setLoading(true);

        console.log(`📂 [Request #${requestId}] useCategories: Fetching categories`);

        const categoriesData = await wordpressApi.getCategories();

        if (!isCancelled && requestId === currentRequestRef.current) {
          setCategories(categoriesData);
          console.log(`✅ [Request #${requestId}] Categories loaded:`, categoriesData.length);
        }
      } catch (err) {
        if (!isCancelled && requestId === currentRequestRef.current) {
          console.error(`❌ [Request #${requestId}] Error fetching categories:`, err);
          setError(err.message);
          setCategories([]);
        }
      } finally {
        if (!isCancelled && requestId === currentRequestRef.current) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isCancelled = true;
      console.log(`🧹 [Request #${requestId}] useCategories cleanup`);
    };
  }, [enabled]);

  const refresh = useCallback(async () => {
    wordpressApi.clearCache('categories');
    const requestId = ++currentRequestRef.current;

    try {
      setLoading(true);
      const categoriesData = await wordpressApi.getCategories();

      if (requestId === currentRequestRef.current) {
        setCategories(categoriesData);
      }
    } catch (err) {
      if (requestId === currentRequestRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { categories, loading, error, refresh };
};

// Hook for fetching tags (NEW)
export const useTags = (enabled = true) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentRequestRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const requestId = ++currentRequestRef.current;
    let isCancelled = false;

    const fetchTags = async () => {
      try {
        setError(null);
        setLoading(true);

        console.log(`🏷️ [Request #${requestId}] useTags: Fetching tags`);

        const tagsData = await wordpressApi.getTags();

        if (!isCancelled && requestId === currentRequestRef.current) {
          setTags(tagsData);
          console.log(`✅ [Request #${requestId}] Tags loaded:`, tagsData.length);
        }
      } catch (err) {
        if (!isCancelled && requestId === currentRequestRef.current) {
          console.error(`❌ [Request #${requestId}] Error fetching tags:`, err);
          setError(err.message);
          setTags([]);
        }
      } finally {
        if (!isCancelled && requestId === currentRequestRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTags();

    return () => {
      isCancelled = true;
      console.log(`🧹 [Request #${requestId}] useTags cleanup`);
    };
  }, [enabled]);

  const refresh = useCallback(async () => {
    wordpressApi.clearCache('tags');
    const requestId = ++currentRequestRef.current;

    try {
      setLoading(true);
      const tagsData = await wordpressApi.getTags();

      if (requestId === currentRequestRef.current) {
        setTags(tagsData);
      }
    } catch (err) {
      if (requestId === currentRequestRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { tags, loading, error, refresh };
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

// Hook for posts by tag (NEW)
export const usePostsByTag = (tagSlug, { page = 1, per_page = 10, orderby = 'date', order = 'desc', enabled = true } = {}) => {
  return usePosts({
    page,
    per_page,
    tag: tagSlug,
    orderby,
    order,
    enabled
  });
};

// Hook for fetching related posts
export const useRelatedPosts = (postId, enabled = true) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !postId) {
      setLoading(false);
      return;
    }

    const fetchRelated = async () => {
      setLoading(true);
      const relatedData = await wordpressApi.getRelatedPosts(postId);
      setPosts(relatedData);
      setLoading(false);
    };

    fetchRelated();
  }, [postId, enabled]);

  return { posts, loading };
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