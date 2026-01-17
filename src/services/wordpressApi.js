// src/services/wordpressApi.js - FIXED READ TIME CALCULATION
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog';
const WP_API_BASE = `${WORDPRESS_API_URL}/wp-json/wp/v2`;

class WordPressAPI {
  constructor() {
    this.baseURL = WP_API_BASE;
    this.cache = new Map();
    this.cacheTimeout = 60 * 1000; // 60 seconds cache
    this.requestQueue = new Map();
    this.prefetchedData = new Map();
  }

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

  async makeRequest(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Cache hit:', endpoint);
      return cached;
    }

    if (this.requestQueue.has(cacheKey)) {
      console.log('⏳ Request already in progress, waiting...');
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        console.log('📡 API Request:', `${this.baseURL}${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
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
      } finally {
        this.requestQueue.delete(cacheKey);
      }
    })();

    this.requestQueue.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async getPostBySlug(slug) {
    try {
      if (!slug || typeof slug !== 'string' || slug.trim() === '') {
        throw new Error('Invalid post slug provided');
      }

      const cleanSlug = slug.trim();
      console.log('🔍 Fetching post by slug:', cleanSlug);

      const result = await this.makeRequest(
        `/posts?slug=${encodeURIComponent(cleanSlug)}&_embed=wp:featuredmedia,wp:term,author&status=publish`
      );

      const posts = result.data;

      if (!Array.isArray(posts)) {
        console.error('❌ Posts response is not an array:', posts);
        throw new Error('Invalid response from server');
      }

      if (posts.length === 0) {
        throw new Error(`Post with slug "${cleanSlug}" not found`);
      }

      const post = this.transformPost(posts[0]);
      console.log('✅ Post loaded successfully with', post.readTime);

      return post;
    } catch (error) {
      console.error('❌ Error in getPostBySlug:', error);
      throw error;
    }
  }

  // 🔥 FIXED: Proper read time calculation
  calculateReadTime(content) {
    try {
      if (!content) {
        console.warn('⚠️ No content provided for read time calculation');
        return '1 min read';
      }

      // Remove all HTML tags to get pure text
      let textContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]+>/g, ' ')                                          // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')                                           // Replace &nbsp;
        .replace(/&[a-z]+;/gi, ' ')                                        // Replace HTML entities
        .replace(/\s+/g, ' ')                                              // Normalize whitespace
        .trim();

      if (textContent.length === 0) {
        console.warn('⚠️ Content has no readable text after HTML removal');
        return '1 min read';
      }

      // Count actual words (split by whitespace and filter empty strings)
      const words = textContent.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;

      // Average reading speed: 200 words per minute
      const readingSpeed = 200;
      const minutes = Math.max(1, Math.ceil(wordCount / readingSpeed));

      console.log(`📚 Read time calculated: ${wordCount} words = ${minutes} min read`);

      return `${minutes} min read`;
    } catch (error) {
      console.error('❌ Error calculating read time:', error);
      return '1 min read';
    }
  }

  transformPost(wpPost) {
    try {
      if (!wpPost || typeof wpPost !== 'object') {
        throw new Error('Invalid post data provided');
      }

      // Fast path for image extraction
      let imageUrl = 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop';

      if (wpPost.featured_image_url) {
        imageUrl = wpPost.featured_image_url;
      } else {
        const featuredMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
        if (featuredMedia?.source_url) {
          imageUrl = featuredMedia.media_details?.sizes?.large?.source_url ||
            featuredMedia.media_details?.sizes?.medium_large?.source_url ||
            featuredMedia.source_url;
        }
      }

      // Fast category extraction
      let primaryCategory = 'Uncategorized';
      const categories = wpPost._embedded?.['wp:term']?.[0];
      if (Array.isArray(categories) && categories.length > 0) {
        const nonUncategorized = categories.find(cat => cat.name !== 'Uncategorized');
        primaryCategory = nonUncategorized?.name || categories[0]?.name || 'Uncategorized';
      }

      // Fast tag extraction
      let tags = [];
      if (wpPost.post_tags && Array.isArray(wpPost.post_tags)) {
        tags = wpPost.post_tags;
      } else if (wpPost._embedded?.['wp:term']?.[1]) {
        tags = wpPost._embedded['wp:term'][1].map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          link: tag.link
        }));
      }

      const author = wpPost._embedded?.author?.[0]?.name || 'DataEngineer Hub';
      const featured = wpPost.meta?.featured === '1' || wpPost.meta?.featured === 1;
      const trending = wpPost.meta?.trending === '1' || wpPost.meta?.trending === 1;

      let excerpt = '';
      if (wpPost.excerpt?.rendered) {
        excerpt = this.cleanExcerpt(wpPost.excerpt.rendered);
      }

      // 🔥 CRITICAL FIX: Handle missing content field gracefully
      let content = '';
      if (wpPost.content?.rendered) {
        content = wpPost.content.rendered;
      } else if (wpPost.content) {
        content = typeof wpPost.content === 'string' ? wpPost.content : '';
      } else {
        // Content field is completely missing - use excerpt as fallback
        console.warn('⚠️ Content field missing from API response, using excerpt as fallback');
        content = wpPost.excerpt?.rendered || wpPost.excerpt || '<p>Content not available. Please contact support.</p>';
      }

      const readTime = this.calculateReadTime(content);

      const transformedPost = {
        id: wpPost.id,
        slug: wpPost.slug || '',
        title: this.decodeHtmlEntities(wpPost.title?.rendered || wpPost.title || 'Untitled'),
        excerpt: excerpt,
        content: content,
        category: primaryCategory,
        tags: tags,
        readTime: readTime,
        date: wpPost.date || new Date().toISOString(),
        modified: wpPost.modified || wpPost.date || new Date().toISOString(),
        image: imageUrl,
        featured: featured,
        trending: trending,
        author: author,
      };

      console.log('✅ Transformed post:', {
        title: transformedPost.title.substring(0, 50),
        readTime: transformedPost.readTime,
        contentLength: content.length,
        hasContent: !!content
      });

      return transformedPost;

    } catch (error) {
      console.error('❌ Error transforming post:', error);

      return {
        id: wpPost?.id || Math.random(),
        slug: wpPost?.slug || '',
        title: wpPost?.title?.rendered || 'Error Loading Post',
        excerpt: 'There was an error loading this post content.',
        content: '<p>There was an error loading this post content.</p>',
        category: 'Uncategorized',
        tags: [],
        readTime: '1 min read',
        date: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop',
        featured: false,
        trending: false,
        author: 'DataEngineer Hub',
      };
    }
  }

  cleanExcerpt(excerpt) {
    try {
      const decoded = this.decodeHtmlEntities(excerpt);
      return decoded
        .replace(/<[^>]*>/g, '')
        .replace(/\[&hellip;\]/g, '...')
        .trim();
    } catch (error) {
      return '';
    }
  }

  async getPosts(options = {}) {
    const {
      page = 1,
      per_page = 10,
      categoryId = null,
      tag = null,
      search = null,
      featured = null,
      trending = null,
      orderby = 'date',
      order = 'desc'
    } = options;

    try {
      const params = new URLSearchParams({
        page: Math.max(1, page).toString(),
        per_page: Math.min(100, Math.max(1, per_page)).toString(),
        _embed: 'wp:featuredmedia,wp:term,author',
        status: 'publish',
        orderby: orderby || 'date',
        order: order || 'desc'
      });

      if (categoryId) params.append('categories', categoryId.toString());
      if (tag) params.append('tags', tag.toString());
      if (search && search.trim()) params.append('search', search.trim());
      if (featured) params.append('is_featured', 'true');
      if (trending) params.append('is_trending', 'true');

      const result = await this.makeRequest(`/posts?${params.toString()}`);

      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid API response structure:', result);
        return { posts: [], totalPages: 1, totalPosts: 0 };
      }

      const posts = result.data;

      if (!Array.isArray(posts)) {
        console.error('❌ Expected array of posts, got:', typeof posts);
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

  async getCategories() {
    try {
      console.log('📂 Fetching categories...');

      const result = await this.makeRequest('/categories?per_page=100&hide_empty=false&_fields=id,name,slug,count,description');
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

  async getTags() {
    try {
      console.log('🏷️ Fetching tags...');

      const result = await this.makeRequest('/tags?per_page=100&hide_empty=false&_fields=id,name,slug,count,description');
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

  async getTagIdBySlug(tagSlug) {
    try {
      if (!tagSlug || typeof tagSlug !== 'string') {
        throw new Error('Invalid tag slug provided');
      }

      console.log('🔍 Looking for tag slug:', tagSlug);

      const tags = await this.getTags();
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

  async getCategoryIdBySlug(categorySlug) {
    try {
      if (!categorySlug || typeof categorySlug !== 'string') {
        throw new Error('Invalid category slug provided');
      }

      console.log('🔍 Looking for category slug:', categorySlug);

      const categories = await this.getCategories();
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

  async getPostsByCategory(categoryId, options = {}) {
    return this.getPosts({ ...options, categoryId });
  }

  async getPostsByTag(tagId, options = {}) {
    return this.getPosts({ ...options, tag: tagId });
  }

  async healthCheck() {
    try {
      console.log('🏥 Performing health check...');
      const result = await this.makeRequest('/posts?per_page=1&_fields=id');
      console.log('✅ API health check passed');
      return true;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }

  async subscribeNewsletter(email) {
    console.log('📧 Newsletter subscription for:', email);
    return { success: true };
  }

  async submitContactForm(formData) {
    console.log('📝 Contact form submission:', formData);
    return { success: true };
  }

  // Helper method for SEO analysis - fetch all posts with full content
  async getAllPosts(page = 1, perPage = 100) {
    try {
      console.log(`📚 Fetching all posts (page ${page}, ${perPage} per page)...`);

      const result = await this.getPosts({
        page,
        per_page: perPage,
        orderby: 'date',
        order: 'desc'
      });

      console.log(`✅ Fetched ${result.posts.length} posts`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching all posts:', error);
      throw error;
    }
  }

  async getRelatedPosts(postId) {
    if (!postId) return [];

    try {
      console.log(`🧠 Fetching related posts for ID: ${postId}`);
      const result = await this.makeRequest(`/posts/${postId}/related?_embed=wp:featuredmedia,wp:term,author`);

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
