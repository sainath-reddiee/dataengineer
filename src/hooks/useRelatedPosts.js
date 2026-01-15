// src/hooks/useRelatedPosts.js
import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

/**
 * Hook to fetch related posts based on category and tags
 * @param {Object} options - Options for fetching related posts
 * @param {string} options.category - Category slug
 * @param {Array} options.tags - Array of tag objects or slugs
 * @param {string} options.excludeId - Post ID to exclude (current post)
 * @param {number} options.limit - Number of posts to fetch (default: 6)
 */
export function useRelatedPosts({ category, tags = [], excludeId, limit = 6 }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchRelatedPosts() {
            if (!category && tags.length === 0) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Extract tag slugs if tags are objects
                const tagSlugs = tags.map(tag =>
                    typeof tag === 'string' ? tag : tag.slug || tag.name
                ).filter(Boolean);

                // Strategy 1: Try to find posts with matching tags AND same category
                let relatedPosts = [];

                if (tagSlugs.length > 0 && category) {
                    // Fetch posts with same category
                    const categoryResponse = await fetch(
                        `${API_BASE_URL}/wp/v2/posts?categories=${category}&per_page=${limit * 2}&_embed`
                    );

                    if (categoryResponse.ok) {
                        const categoryPosts = await categoryResponse.json();

                        // Filter posts that share tags
                        relatedPosts = categoryPosts.filter(post => {
                            if (post.id === parseInt(excludeId)) return false;

                            const postTags = post._embedded?.['wp:term']?.[1] || [];
                            const postTagSlugs = postTags.map(t => t.slug);

                            // Check if post has any matching tags
                            return tagSlugs.some(tag => postTagSlugs.includes(tag));
                        });
                    }
                }

                // Strategy 2: If not enough posts, get more from same category
                if (relatedPosts.length < limit && category) {
                    const categoryResponse = await fetch(
                        `${API_BASE_URL}/wp/v2/posts?categories=${category}&per_page=${limit}&_embed&exclude=${excludeId}`
                    );

                    if (categoryResponse.ok) {
                        const categoryPosts = await categoryResponse.json();

                        // Add posts that aren't already in relatedPosts
                        categoryPosts.forEach(post => {
                            if (!relatedPosts.find(p => p.id === post.id)) {
                                relatedPosts.push(post);
                            }
                        });
                    }
                }

                // Strategy 3: If still not enough, get recent posts
                if (relatedPosts.length < 3) {
                    const recentResponse = await fetch(
                        `${API_BASE_URL}/wp/v2/posts?per_page=${limit}&_embed&exclude=${excludeId}`
                    );

                    if (recentResponse.ok) {
                        const recentPosts = await recentResponse.json();

                        recentPosts.forEach(post => {
                            if (!relatedPosts.find(p => p.id === post.id)) {
                                relatedPosts.push(post);
                            }
                        });
                    }
                }

                // Limit to requested number
                relatedPosts = relatedPosts.slice(0, limit);

                // Transform posts to match expected format
                const transformedPosts = relatedPosts.map(post => ({
                    id: post.id,
                    title: post.title?.rendered || 'Untitled',
                    excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 150) || '',
                    slug: post.slug,
                    date: post.date,
                    category: post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Uncategorized',
                    categorySlug: post._embedded?.['wp:term']?.[0]?.[0]?.slug || 'uncategorized',
                    tags: post._embedded?.['wp:term']?.[1]?.map(t => ({ name: t.name, slug: t.slug })) || [],
                    image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
                        'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop',
                    readTime: `${Math.max(1, Math.ceil((post.content?.rendered?.length || 0) / 1000))} min read`,
                }));

                if (isMounted) {
                    setPosts(transformedPosts);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching related posts:', err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        fetchRelatedPosts();

        return () => {
            isMounted = false;
        };
    }, [category, tags, excludeId, limit]);

    return { posts, loading, error };
}
