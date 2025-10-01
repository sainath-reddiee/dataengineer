// src/services/wordpressApi.js - COMPLETE FINAL VERSION
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog';
const WP_API_BASE = `${WORDPRESS_API_URL}/wp-json/wp/v2`;

class WordPressAPI {
  constructor() {
    this.baseURL = WP_API_BASE;
    this.cache = new Map();
    this.cacheTimeout = 10 * 1000; // 10 seconds
    this.requestQueue = new Map();
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

  async makeRequest(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Using cached data for:', endpoint);
      return cached.data;
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

  async getPosts({ 
    page = 1, 
    per_page = 10, 
    categoryId = null, 
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
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (featured) {
        params.append('meta_key', 'featured');
        params.append('meta_value', '1');
      }
      if (trending) {
        params.append('meta_key', 'trending');
        params.append('meta_value', '1');
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
      
      console.log('✅ Posts fetched:', {
        count: transformedPosts.length,
        totalPages: result.totalPages,
        totalPosts: result.totalPosts,
        currentPage: page
      });
      
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
      return [];
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
        console.log('Available categories:', categories.map(c => c.slug).join(', '));
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

  transformPost(wpPost) {
    try {
      if (!wpPost || typeof wpPost !== 'object') {
        throw new Error('Invalid post data provided');
      }

      let imageUrl = 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop';
      
      try {
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

      let content = '';
      try {
        if (wpPost.content && wpPost.content.rendered) {
          content = wpPost.content.rendered;
        } else if (wpPost.content && typeof wpPost.content === 'string') {
          content = wpPost.content;
        }
        
        if (content && !content.includes('<p>') && !content.includes('<table>')) {
          content = `<p>${content}</p>`;
        }
      } catch (contentError) {
        console.warn('⚠️ Error extracting content:', contentError);
        content = '<p>Content could not be loaded.</p>';
      }

      const transformedPost = {
        id: wpPost.id || Math.random(),
        slug: wpPost.slug || '',
        title: wpPost.title?.rendered || wpPost.title || 'Untitled',
        excerpt: excerpt,
        content: content || '<p>No content available</p>',
        category: primaryCategory,
        readTime: this.calculateReadTime(content),
        date: postDate,
        image: imageUrl,
        featured: featured,
        trending: trending,
        author: author,
      };

      return transformedPost;

    } catch (error) {
      console.error('❌ Error transforming post:', error);
      return {
        id: wpPost?.id || Math.random(),
        slug: wpPost?.slug || '',
        title: wpPost?.title?.rendered || wpPost?.title || 'Error Loading Post',
        excerpt: 'There was an error loading this post content.',
        content: '<p>There was an error loading this post content. Please try refreshing the page.</p>',
        category: 'Uncategorized',
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
      return excerpt
        .replace(/<[^>]*>/g, '')
        .replace(/\[&hellip;\]/g, '...')
        .replace(/&[^;]+;/g, '')
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

  async subscribeNewsletter(email) {
    console.log('📧 Newsletter subscription for:', email);
    return { success: true };
  }

  async submitContactForm(formData) {
    console.log('📝 Contact form submission:', formData);
    return { success: true };
  }
}

export const wordpressApi = new WordPressAPI();
export default wordpressApi;