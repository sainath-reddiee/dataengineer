// src/components/PostListItem.jsx - FINAL VERSION WITH HOVER ANIMATION
import React from 'react';
import { Link } from 'react-router-dom';
// 1. Import motion from framer-motion
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

// 2. Create a motion-compatible version of the Link component
const MotionLink = motion(Link);

const PostListItem = ({ post }) => {
  if (!post) return null;

  // 3. Define animation variants for the hover effect
  const cardVariants = {
    rest: {
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  const shineVariants = {
    rest: {
      x: '-150%',
    },
    hover: {
      x: '150%',
      transition: { duration: 0.7, ease: 'easeInOut' },
    },
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block w-full p-4 rounded-xl group transition-colors duration-300 hover:bg-slate-800/50 overflow-hidden" // Added relative and overflow-hidden
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* 4. Add the Shine/Glare Animation Element */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ transform: 'skewX(-25deg)' }}
        variants={shineVariants}
      />

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Image */}
        <div className="w-full sm:w-48 flex-shrink-0">
          <LazyImage
            src={post.image}
            alt={post.title}
            className="aspect-video sm:aspect-square rounded-lg object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3 inline-block">
            {post.category}
          </span>
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:block ml-auto self-center">
            <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </MotionLink>
  );
};

export default PostListItem;