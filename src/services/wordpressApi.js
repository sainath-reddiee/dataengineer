// src/services/wordpressApi.js - COMPLETE VERSION WITH TAGS SUPPORT AND FEATURED IMAGE FIX
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog';
const WP_API_BASE = `${WORDPRESS_API_URL}/wp-json/wp/v2`;

class WordPressAPI {
  constructor() {
    this.baseURL = WP_API_BASE;
    this.cache = new Map();
    this.cacheTimeout = 10 * 1000; // 10 seconds for faster development updates
    this.requestQueue = new Map();
  }

  // Simple cache management
  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.cache.entries()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log('🧹 Cache cleared:', pattern || 'all');
  }

  // Helper function to decode HTML entities
  decodeHtmlEntities(text) {
    if (!text || typeof text !== 'string') return '';
    
    if (typeof window !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }
    
    return text
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  // Enhanced request method with better error handling
  async makeRequest(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Using cached data for:', endpoint);
      return cached;
    }

    try {
      console.log('📡 API Request:', `${this.baseURL}${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ API Error Response:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Content not found');
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again later');
        } else {
          throw new Error(`Request failed (${response.status})`);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }
      
      if (data === null || data === undefined) {
        console.error('❌ Received null/undefined data from API');
        throw new Error('No data received from server');
      }
      
      const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      
      const result = {
        data,
        totalPosts,
        totalPages,
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ API Request failed:', endpoint, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - please check your connection');
      }
      
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      
      throw error;
    }
  }

  // Get posts with all filters
  async getPosts({ 
    page = 1, 
    per_page = 10, 
    categoryId = null,
    tag = null,
    search = null,
    featured = null,
    trending = null,
    orderby = 'date',
    order = 'desc'
  } = {}) {
    try {
      const params = new URLSearchParams({
        page: Math.max(1, page).toString(),
        per_page: Math.min(100, Math.max(1, per_page)).toString(),
        _embed: 'true',
        status: 'publish',
        orderby: orderby || 'date',
        order: order || 'desc'
      });

      if (categoryId && !isNaN(categoryId)) {
        params.append('categories', categoryId.toString());
      }
      if (tag) {
        params.append('tags', tag.toString());
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (featured) {
        params.append('is_featured', 'true');
      }
      if (trending) {
        params.append('is_trending', 'true');
      }

      console.log('📋 Fetching posts with params:', Object.fromEntries(params));
      
      const result = await this.makeRequest(`/posts?${params.toString()}`);
      
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid API response structure:', result);
        return { posts: [], totalPages: 1, totalPosts: 0 };
      }
      
      const posts = result.data;
      
      if (!Array.isArray(posts)) {
        console.error('❌ Expected array of posts, got:', typeof posts, posts);
        if (posts && typeof posts === 'object' && Array.isArray(posts.posts)) {
          const transformedPosts = this.transformPosts(posts.posts);
          return {
            posts: transformedPosts,
            totalPages: posts.totalPages || 1,
            totalPosts: posts.totalPosts || 0
          };
        }
        return { posts: [], totalPages: 1, totalPosts: 0 };
      }

      const transformedPosts = this.transformPosts(posts);
      
      return {
        posts: transformedPosts,
        totalPages: result.totalPages || 1,
        totalPosts: result.totalPosts || 0
      };
    } catch (error) {
      console.error('❌ Error in getPosts:', error);
      throw error;
    }
  }

  // Get categories with validation
  async getCategories() {
    try {
      console.log('📂 Fetching categories...');
      
      const result = await this.makeRequest('/categories?per_page=100&hide_empty=false');
      const categories = result.data;
      
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', categories);
        return [];
      }

      return categories.map(category => ({
        id: category.id || 0,
        name: category.name || 'Unnamed Category',
        slug: category.slug || '',
        count: category.count || 0,
        description: category.description || '',
      }));
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }

  // Get tags (NEW)
  async getTags() {
    try {
      console.log('🏷️ Fetching tags...');
      
      const result = await this.makeRequest('/tags?per_page=100&hide_empty=false');
      const tags = result.data;
      
      if (!Array.isArray(tags)) {
        console.warn('Tags response is not an array:', tags);
        return [];
      }

      return tags.map(tag => ({
        id: tag.id || 0,
        name: tag.name || 'Unnamed Tag',
        slug: tag.slug || '',
        count: tag.count || 0,
        description: tag.description || '',
      }));
    } catch (error) {
      console.error('❌ Error fetching tags:', error);
      throw error;
    }
  }

  // Get tag ID by slug (NEW)
  async getTagIdBySlug(tagSlug) {
    try {
      if (!tagSlug || typeof tagSlug !== 'string') {
        throw new Error('Invalid tag slug provided');
      }

      console.log('🔍 Looking for tag slug:', tagSlug);
      
      const tags = await this.getTags();
      
      console.log('📋 Available tags:', tags.map(t => `${t.slug} (${t.name})`).join(', '));
      
      const tag = tags.find(t => 
        t.slug.toLowerCase() === tagSlug.toLowerCase() || 
        t.name.toLowerCase() === tagSlug.toLowerCase()
      );

      if (tag) {
        console.log('✅ Tag found:', tag.name, 'ID:', tag.id);
        return tag.id;
      } else {
        console.error('❌ Tag not found:', tagSlug);
        throw new Error(`Tag "${tagSlug}" not found`);
      }
    } catch (error) {
      console.error('❌ Error getting tag ID:', error);
      throw error;
    }
  }

  // Get category ID by slug with better error handling
  async getCategoryIdBySlug(categorySlug) {
    try {
      if (!categorySlug || typeof categorySlug !== 'string') {
        throw new Error('Invalid category slug provided');
      }

      console.log('🔍 Looking for category slug:', categorySlug);
      
      const categories = await this.getCategories();
      
      console.log('📋 Available categories:', categories.map(c => `${c.slug} (${c.name})`).join(', '));
      
      const category = categories.find(cat => 
        cat.slug.toLowerCase() === categorySlug.toLowerCase() || 
        cat.name.toLowerCase() === categorySlug.toLowerCase()
      );

      if (category) {
        console.log('✅ Category found:', category.name, 'ID:', category.id);
        return category.id;
      } else {
        console.error('❌ Category not found:', categorySlug);
        throw new Error(`Category "${categorySlug}" not found`);
      }
    } catch (error) {
      console.error('❌ Error getting category ID:', error);
      throw error;
    }
  }

  // Get posts by category
  async getPostsByCategory(categoryId, options = {}) {
    return this.getPosts({ ...options, categoryId });
  }

  // Get posts by tag (NEW)
  async getPostsByTag(tagId, options = {}) {
    return this.getPosts({ ...options, tag: tagId });
  }

  // Enhanced getPostBySlug with better validation
  async getPostBySlug(slug) {
    try {
      if (!slug || typeof slug !== 'string' || slug.trim() === '') {
        throw new Error('Invalid post slug provided');
      }

      const cleanSlug = slug.trim();
      console.log('🔍 Fetching post by slug:', cleanSlug);

      const result = await this.makeRequest(`/posts?slug=${encodeURIComponent(cleanSlug)}&_embed=true&status=publish`);
      const posts = result.data;
      
      if (!Array.isArray(posts)) {
        console.error('❌ Posts response is not an array:', posts);
        throw new Error('Invalid response from server');
      }

      if (posts.length === 0) {
        throw new Error(`Post with slug "${cleanSlug}" not found`);
      }

      const post = this.transformPost(posts[0]);
      console.log('✅ Post transformed successfully:', post.title);
      
      return post;
    } catch (error) {
      console.error('❌ Error in getPostBySlug:', error);
      throw error;
    }
  }

  // Enhanced transformPost with comprehensive validation INCLUDING TAGS AND FEATURED IMAGE FIX
  transformPost(wpPost) {
    try {
      if (!wpPost || typeof wpPost !== 'object') {
        throw new Error('Invalid post data provided');
      }

      let imageUrl = 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop';
      
      try {
        // *** START OF FIX ***
        // 1. Check for the custom 'featured_image_url' field first. This is the most reliable method.
        if (wpPost.featured_image_url) {
            imageUrl = wpPost.featured_image_url;
        } 
        // 2. Fallback to existing methods if the custom field isn't there.
        else {
            const featuredMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
            
            if (featuredMedia && featuredMedia.source_url) {
              if (featuredMedia.media_details?.sizes?.large?.source_url) {
                imageUrl = featuredMedia.media_details.sizes.large.source_url;
              } else if (featuredMedia.media_details?.sizes?.medium_large?.source_url) {
                imageUrl = featuredMedia.media_details.sizes.medium_large.source_url;
              } else {
                imageUrl = featuredMedia.source_url;
              }
            } else if (wpPost.jetpack_featured_media_url) {
              imageUrl = wpPost.jetpack_featured_media_url;
            } else if (wpPost.featured_media_src_url) {
              imageUrl = wpPost.featured_media_src_url;
            }
        }
        // *** END OF FIX ***

      } catch (imgError) {
        console.warn('⚠️ Error extracting image, using fallback:', imgError);
      }

      let primaryCategory = 'Uncategorized';
      try {
        const categories = wpPost._embedded?.['wp:term']?.[0] || [];
        if (Array.isArray(categories) && categories.length > 0) {
          const nonUncategorized = categories.find(cat => cat.name !== 'Uncategorized');
          primaryCategory = nonUncategorized?.name || categories[0]?.name || 'Uncategorized';
        }
      } catch (catError) {
        console.warn('⚠️ Error extracting category, using fallback:', catError);
      }

      // ✅ EXTRACT TAGS (NEW)
      let tags = [];
      try {
        // Try post_tags field first (if added via functions.php)
        if (wpPost.post_tags && Array.isArray(wpPost.post_tags)) {
          tags = wpPost.post_tags;
          console.log('✅ Tags from post_tags:', tags.length);
        } 
        // Fallback: Try _embedded wp:term array
        else if (wpPost._embedded?.['wp:term']) {
          // Tags are usually at index 1 (categories at 0, tags at 1)
          const tagTerms = wpPost._embedded['wp:term'][1] || [];
          if (Array.isArray(tagTerms)) {
            tags = tagTerms.map(tag => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              link: tag.link
            }));
            console.log('✅ Tags from _embedded:', tags.length);
          }
        }
      } catch (tagError) {
        console.warn('⚠️ Error extracting tags, using empty array:', tagError);
      }

      let author = 'DataEngineer Hub';
      try {
        const authorData = wpPost._embedded?.author?.[0];
        if (authorData && authorData.name) {
          author = authorData.name;
        }
      } catch (authorError) {
        console.warn('⚠️ Error extracting author, using fallback:', authorError);
      }

      let featured = false;
      let trending = false;
      try {
        if (wpPost.meta && typeof wpPost.meta === 'object') {
          featured = wpPost.meta.featured === '1' || wpPost.meta.featured === 1 || wpPost.meta.featured === true;
          trending = wpPost.meta.trending === '1' || wpPost.meta.trending === 1 || wpPost.meta.trending === true;
        }
      } catch (metaError) {
        console.warn('⚠️ Error extracting meta, using defaults:', metaError);
      }

      let excerpt = '';
      try {
        if (wpPost.excerpt && wpPost.excerpt.rendered) {
          excerpt = this.cleanExcerpt(wpPost.excerpt.rendered);
        }
      } catch (excerptError) {
        console.warn('⚠️ Error extracting excerpt:', excerptError);
      }

      let postDate = new Date().toISOString();
      try {
        if (wpPost.date && wpPost.date !== '0000-00-00 00:00:00') {
          const parsedDate = new Date(wpPost.date);
          if (!isNaN(parsedDate.getTime())) {
            postDate = wpPost.date;
          }
        } else if (wpPost.date_gmt && wpPost.date_gmt !== '0000-00-00 00:00:00') {
          const parsedDate = new Date(wpPost.date_gmt);
          if (!isNaN(parsedDate.getTime())) {
            postDate = wpPost.date_gmt;
          }
        } else if (wpPost.modified && wpPost.modified !== '0000-00-00 00:00:00') {
          const parsedDate = new Date(wpPost.modified);
          if (!isNaN(parsedDate.getTime())) {
            postDate = wpPost.modified;
          }
        }
      } catch (dateError) {
        console.warn('⚠️ Error parsing date, using current date:', dateError);
      }

      const transformedPost = {
        id: wpPost.id || Math.random(),
        slug: wpPost.slug || '',
        title: this.decodeHtmlEntities(wpPost.title?.rendered || wpPost.title || 'Untitled'),
        excerpt: excerpt,
        content: wpPost.content?.rendered || wpPost.content || '',
        category: primaryCategory,
        tags: tags, // ✅ ADD TAGS
        readTime: this.calculateReadTime(wpPost.content?.rendered || wpPost.content || ''),
        date: postDate,
        image: imageUrl,
        featured: featured,
        trending: trending,
        author: author,
      };

      console.log('✅ Post transformed:', transformedPost.title, 'Tags:', transformedPost.tags.length);
      return transformedPost;

    } catch (error) {
      console.error('❌ Error transforming post:', error);
      console.error('Raw post data:', wpPost);
      
      return {
        id: wpPost?.id || Math.random(),
        slug: wpPost?.slug || '',
        title: wpPost?.title?.rendered || wpPost?.title || 'Error Loading Post',
        excerpt: 'There was an error loading this post content.',
        content: '<p>There was an error loading this post content. Please try refreshing the page.</p>',
        category: 'Uncategorized',
        tags: [], // ✅ Empty tags array for fallback
        readTime: '1 min read',
        date: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop',
        featured: false,
        trending: false,
        author: 'DataEngineer Hub',
      };
    }
  }

  transformPosts(wpPosts) {
    if (!Array.isArray(wpPosts)) {
      console.error('❌ transformPosts received non-array:', wpPosts);
      return [];
    }

    return wpPosts
      .map(post => {
        try {
          return this.transformPost(post);
        } catch (error) {
          console.error('❌ Error transforming individual post:', error);
          return null;
        }
      })
      .filter(post => post !== null);
  }

  cleanExcerpt(excerpt) {
    try {
      const decoded = this.decodeHtmlEntities(excerpt);
      return decoded
        .replace(/<[^>]*>/g, '')
        .replace(/\[&hellip;\]/g, '...')
        .trim();
    } catch (error) {
      console.warn('⚠️ Error cleaning excerpt:', error);
      return '';
    }
  }

  calculateReadTime(content) {
    try {
      if (!content) return '1 min read';
      
      const wordsPerMinute = 200;
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      
      if (textContent.length === 0) return '1 min read';
      
      const wordCount = textContent.split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
      
      return `${minutes} min read`;
    } catch (error) {
      console.warn('⚠️ Error calculating read time:', error);
      return '1 min read';
    }
  }

  // Health check method
  async healthCheck() {
    try {
      console.log('🏥 Performing health check...');
      const result = await this.makeRequest('/posts?per_page=1');
      console.log('✅ API health check passed');
      return true;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }

  // Newsletter and contact form methods
  async subscribeNewsletter(email) {
    console.log('📧 Newsletter subscription for:', email);
    return { success: true };
  }

  async submitContactForm(formData) {
    console.log('📝 Contact form submission:', formData);
    return { success: true };
  }

  async getRelatedPosts(postId) {
    if (!postId) return [];
    
    try {
      console.log(`🧠 Fetching related posts for ID: ${postId}`);
      const result = await this.makeRequest(`/posts/${postId}/related`);
      
      if (!result || !Array.isArray(result.data)) {
        console.warn('⚠️ Related posts response was not an array:', result);
        return [];
      }

      const rawPosts = result.data.map(item => item.data || item);
      return this.transformPosts(rawPosts);

    } catch (error) {
      console.error('❌ Could not fetch related posts:', error.message);
      return [];
    }
  }
}

export const wordpressApi = new WordPressAPI();
export default wordpressApi;
