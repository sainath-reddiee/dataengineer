// src/services/wordpressApi.js - FIXED READ TIME CALCULATION + GUEST AUTHOR SUPPORT + CORS PROXY SUPPORT
const WORDPRESS_API_URL = import.meta.env.DEV ? '' : 'https://app.dataengineerhub.blog';
const WP_API_BASE = `${WORDPRESS_API_URL}/wp-json/wp/v2`;

// How long a successful newsletter subscription is considered a "known session hit"
// before allowing a network retry (protects against double-click / SPA navigation).
const SESSION_DEDUP_MS = 5 * 60_000; // 5 minutes

class WordPressAPI {
  constructor() {
    this.baseURL = WP_API_BASE;
    this.cache = new Map();
    this.cacheTimeout = 60 * 1000; // 60 seconds cache
    this.cacheMaxEntries = 200; // LRU cap to bound long-running admin sessions
    this.requestQueue = new Map();
    this.prefetchedData = new Map();
    // In-session record of successfully submitted newsletter emails.
    // Keyed by normalised email; value is the timestamp of the last success.
    // This prevents duplicate network POSTs when the user navigates between
    // pages within the same tab session.
    this._sessionNewsletterSuccesses = new Map();
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

    let decoded = text;
    let prev;
    // Loop to resolve any level of nested/double encoding (e.g. &amp;#8217; -> &#8217; -> ’)
    do {
      prev = decoded;
      decoded = decoded
        .replace(/&amp;/g, '&')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&middot;/g, '·')
        .replace(/&bull;/g, '•')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    } while (decoded !== prev);

    return decoded;
  }

  async makeRequest(endpoint, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const useCache = method === 'GET';

    const cached = useCache ? this.cache.get(cacheKey) : null;
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
        const timeoutId = setTimeout(() => controller.abort(), 15000);

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

        if (useCache) {
          this.cache.set(cacheKey, result);
          // Simple LRU eviction: drop oldest entries when over the cap.
          // Map preserves insertion order, so the first key is the oldest.
          while (this.cache.size > this.cacheMaxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey === undefined) break;
            this.cache.delete(oldestKey);
          }
        }
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
      const storageKey = `deh_cached_post_${cleanSlug}`;

      // Check persistent browser storage (instant 0ms response)
      if (typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.post && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
              console.log('⚡ Loaded post instantly from browser cache:', cleanSlug);
              return parsed.post;
            }
          }
        } catch {
          // ignore storage parse errors
        }
      }

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

      // Save to browser cache for instant repeat loads
      if (typeof window !== 'undefined') {
        try {
          const payload = JSON.stringify({ post, timestamp: Date.now() });
          sessionStorage.setItem(storageKey, payload);
          localStorage.setItem(storageKey, payload);
        } catch {
          // ignore quota errors
        }
      }

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

      // Keep author as a plain string for backward compatibility with list
      // components (PostCard, PostListItem, RecentPosts, etc.) that render
      // {post.author} directly. Rich data lives in authorData, consumed only
      // by ArticlePage's AuthorBioCard.
      // Support Non-WP Guest Authors (from guest_author_details post meta filter)
      const guestDetails = wpPost.guest_author_details;
      const authorEmbed = wpPost._embedded?.author?.[0] || {};
      
      const authorName = guestDetails?.name || authorEmbed.name || 'DataEngineer Hub';
      const author = authorName; // string — DO NOT change to object
      
      const authorData = guestDetails ? {
        name: guestDetails.name,
        bio: guestDetails.description || guestDetails.bio || '',
        avatarUrl: guestDetails.meta?.author_avatar_url
          || guestDetails.avatar_urls?.['96']
          || guestDetails.avatar_url
          || '',
        website: guestDetails.url || guestDetails.website || '',
        slug: guestDetails.slug || '',
        linkedin: guestDetails.meta?.linkedin_url || guestDetails.linkedin || '',
        twitter: guestDetails.meta?.twitter_url || guestDetails.twitter || '',
        github: guestDetails.meta?.github_url || guestDetails.github || '',
        role: guestDetails.meta?.job_title || guestDetails.job_title || 'Guest Author',
        isGuest: true,
        id: guestDetails.id,
      } : {
        name: authorName,
        bio: authorEmbed.description || '',
        avatarUrl: authorEmbed.meta?.author_avatar_url
          || authorEmbed.acf?.author_avatar_url
          || authorEmbed.avatar_urls?.['96']
          || authorEmbed.avatar_urls?.['48']
          || '',
        website: authorEmbed.url || '',
        slug: authorEmbed.slug || '',
        linkedin: authorEmbed.meta?.linkedin_url || authorEmbed.acf?.linkedin_url || '',
        twitter: authorEmbed.meta?.twitter_url || authorEmbed.acf?.twitter_url
          || authorEmbed.meta?.['wpseo_profile_twitter'] || '',
        github: authorEmbed.meta?.github_url || authorEmbed.acf?.github_url || '',
        role: authorEmbed.meta?.job_title || authorEmbed.acf?.job_title || '',
        id: authorEmbed.id,
      };
      const featured = wpPost.meta?.featured === '1' || wpPost.meta?.featured === 1;
      const trending = wpPost.meta?.trending === '1' || wpPost.meta?.trending === 1;

      let excerpt = '';
      if (wpPost.excerpt?.rendered) {
        excerpt = this.cleanExcerpt(wpPost.excerpt.rendered);
      }

      // Pull Yoast SEO meta description (preferred over excerpt for CTR scoring)
      const metaDescription = wpPost.yoast_head_json?.description || '';

      // 🔥 CRITICAL FIX: Handle missing content field gracefully
      let content = '';
      if (wpPost.content?.rendered) {
        content = wpPost.content.rendered;
      } else if (wpPost.content) {
        content = typeof wpPost.content === 'string' ? wpPost.content : '';
      } else {
        // Content field is completely missing - use excerpt as fallback
        // This is normal for related posts endpoint which returns a subset of fields
        console.debug('ℹ️ Content field missing from API response, using excerpt as fallback');
        content = wpPost.excerpt?.rendered || wpPost.excerpt || '<p>Content not available. Please contact support.</p>';
      }

      const readTime = this.calculateReadTime(content);

      const transformedPost = {
        id: wpPost.id,
        slug: wpPost.slug || '',
        title: this.decodeHtmlEntities(wpPost.title?.rendered || wpPost.title || 'Untitled'),
        excerpt: excerpt,
        metaDescription: metaDescription,
        content: content,
        category: primaryCategory,
        tags: tags,
        readTime: readTime,
        date: wpPost.date || new Date().toISOString(),
        modified: wpPost.modified || wpPost.date || new Date().toISOString(),
        image: imageUrl,
        featured: featured,
        trending: trending,
        author: author,       // string — safe to render in any component
        authorData: authorData, // object — used only by ArticlePage AuthorBioCard
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
        authorData: { name: 'DataEngineer Hub', bio: '', avatarUrl: '', website: '', linkedin: '', twitter: '', role: '' },
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

  async getPublishedPostCount() {
    const result = await this.makeRequest('/posts?per_page=1&status=publish&_fields=id');
    const total = Number(result?.totalPosts) || 0;
    return total > 0 ? total : 0;
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
    const trimmed = String(email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error('Enter a valid email address');
    }

    // ── Session-level dedup ──────────────────────────────────────────────────
    // Prevent duplicate network hits when the user submits the same email
    // multiple times within the same tab session (e.g. SPA navigation between
    // Newsletter component mounts).
    const normEmail = trimmed.toLowerCase();
    const lastSuccess = this._sessionNewsletterSuccesses.get(normEmail);
    if (lastSuccess && Date.now() - lastSuccess < SESSION_DEDUP_MS) {
      console.log('📦 Newsletter session dedup hit for:', normEmail);
      return { success: true, already: true };
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Store of record is WordPress (wp_newsletter_subscribers).
    // Do not call Brevo/Buttondown from the browser — visitor IPs then hit
    // Brevo's API allowlist and every reader gets blocked.
    try {
      const result = await this.makeRequest('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });

      const payload = result?.data || {};
      const leaked = [payload.message, ...(Array.isArray(payload.forward_errors) ? payload.forward_errors : [])]
        .filter(Boolean)
        .join(' ');

      // WordPress already accepted the address. ESP IP-allowlist noise must
      // never fail (or be shown to) the subscriber.
      if (payload.success !== false || this.isEspIpRestrictionError(leaked)) {
        // Record the session success so subsequent calls return immediately
        this._sessionNewsletterSuccesses.set(normEmail, Date.now());
        return { success: true, already: Boolean(payload.already) };
      }

      throw new Error(this.publicNewsletterError(payload.message));
    } catch (error) {
      const message = String(error?.message || '');
      if (this.isEspIpRestrictionError(message)) {
        this._sessionNewsletterSuccesses.set(normEmail, Date.now());
        return { success: true };
      }
      if (message === 'Content not found' || message.includes('404')) {
        throw new Error('Signup is temporarily unavailable. Use the RSS feed until it is back.');
      }
      throw new Error(this.publicNewsletterError(message));
    }
  }

  isEspIpRestrictionError(message) {
    return /authorised_ips|authorized_ips|unrecognised ip|unrecognized ip|ip not authorized|unauthorized:\s*not verified/i.test(
      String(message || '')
    );
  }

  publicNewsletterError(message) {
    const text = String(message || '').trim();
    if (!text || this.isEspIpRestrictionError(text) || /brevo|buttondown|api-key|wp-config/i.test(text)) {
      return 'Could not reach signup just now. Please try again in a moment.';
    }
    if (text.startsWith('Request failed') || text.includes('Server error')) {
      return 'Could not reach signup just now. Please try again in a moment.';
    }
    return text;
  }

  async getNewsletterSubscribers(token) {
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    const result = await this.makeRequest(`/newsletter/subscribers${qs}`);
    return result?.data || null;
  }

  // Contact form now handled directly by Web3Forms in ContactPage.jsx
  // submitContactForm() stub removed — was a no-op

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

  // ─── Contributors (read-only) ──────────────────────────────────────────────
  // Writes to WordPress users/posts must never run from the public bundle: any
  // credential shipped to the browser is readable by every visitor.

  /**
   * List all WordPress users with contributor / author / editor roles.
   * Requires Application Password.
   */
  async getUsers(roles = 'author,contributor,editor,administrator') {
    try {
      const res = await fetch(
        `${this.baseURL.replace('/wp/v2', '/dehub/v1')}/contributors?roles=${roles}`
      );
      if (!res.ok) throw new Error(`Failed to list users (${res.status})`);
      return await res.json();
    } catch (error) {
      console.error('❌ getUsers failed:', error);
      throw error;
    }
  }

  /**
   * Fetch a single WordPress user by their numeric ID.
   */
  async getUserById(id) {
    try {
      const res = await fetch(
        `${this.baseURL.replace('/wp/v2', '/dehub/v1')}/contributors?slug=${id}`
      );
      if (!res.ok) throw new Error(`User ${id} not found (${res.status})`);
      return await res.json();
    } catch (error) {
      console.error(`❌ getUserById(${id}) failed:`, error);
      throw error;
    }
  }

  /**
   * Fetch published posts by a specific author (WP user ID).
   */
  async getPostsByAuthor(authorId, page = 1, perPage = 12) {
    try {
      // Published posts are public: never send credentials from the browser.
      const res = await fetch(
        `${this.baseURL}/posts?author=${authorId}&per_page=${perPage}&page=${page}&status=publish&_embed=wp:featuredmedia,wp:term,author`
      );
      if (!res.ok) throw new Error(`Failed to fetch posts for author ${authorId} (${res.status})`);
      const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      const totalPosts = parseInt(res.headers.get('X-WP-Total') || '0');
      const raw = await res.json();
      return { posts: this.transformPosts(raw), totalPages, totalPosts };
    } catch (error) {
      console.error(`❌ getPostsByAuthor(${authorId}) failed:`, error);
      throw error;
    }
  }

}

export const wordpressApi = new WordPressAPI();
export default wordpressApi;
