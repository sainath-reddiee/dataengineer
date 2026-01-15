// src/components/RelatedArticles.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { useRelatedPosts } from '@/hooks/useRelatedPosts';
import LazyImage from '@/components/LazyImage';

/**
 * Related Articles Component
 * Shows related articles based on category and tags
 * Improves internal linking for SEO
 */
const RelatedArticles = ({ currentPost, limit = 6 }) => {
    const { posts, loading, error } = useRelatedPosts({
        category: currentPost.categorySlug,
        tags: currentPost.tags,
        excludeId: currentPost.id,
        limit,
    });

    if (loading) {
        return (
            <div className="mt-16 p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-400/20 rounded-2xl">
                <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-400">Loading related articles...</span>
                </div>
            </div>
        );
    }

    if (error || posts.length === 0) {
        return null; // Don't show if no related posts
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                        Related Articles
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Continue your learning journey with these related topics
                    </p>
                </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                        <Link to={`/articles/${post.slug}`} className="block">
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <LazyImage
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60"></div>

                                {/* Category Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white backdrop-blur-sm">
                                        {post.category}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {/* Title */}
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                    {post.title}
                                </h3>

                                {/* Excerpt */}
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                    {post.excerpt}
                                </p>

                                {/* Meta Info */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{post.readTime}</span>
                                    </div>

                                    {post.tags.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            <span>{post.tags.length} tags</span>
                                        </div>
                                    )}
                                </div>

                                {/* Read More Link */}
                                <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold group-hover:text-blue-300">
                                    <span>Read Article</span>
                                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>

            {/* View All Link */}
            {posts.length >= limit && (
                <div className="mt-8 text-center">
                    <Link
                        to="/articles"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                        <span>Explore All Articles</span>
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                </div>
            )}
        </motion.section>
    );
};

export default RelatedArticles;
