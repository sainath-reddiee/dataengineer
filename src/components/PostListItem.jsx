// src/components/PostListItem.jsx - FINAL VERSION WITH "GLITCH & REVEAL" ANIMATION
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostListItem = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Glitch & Reveal" effect ---

  const cardVariants = {
    rest: { 
      scale: 1,
    },
    hover: { 
      scale: 1.015,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
  };

  const glitchContentVariants = {
    rest: {
      filter: 'saturate(0.8) brightness(0.9)',
      x: 0,
      y: 0,
    },
    hover: {
      filter: 'saturate(1) brightness(1)',
      // The Glitch Keyframe Animation
      x: [0, -2, 2, -3, 3, 0],
      y: [0, 1, -1, 2, -2, 0],
      transition: {
        // Apply the glitch only for the first 0.25s of the hover
        x: { duration: 0.25, ease: 'steps(5, end)' },
        y: { duration: 0.25, ease: 'steps(5, end)' },
        // Smoothly transition the filter over a longer period
        filter: { duration: 0.4, delay: 0.2 }
      },
    },
  };
  
  const borderGlowVariants = {
    rest: {
      opacity: 0,
      boxShadow: '0 0 0px 0px rgba(59, 130, 246, 0)',
    },
    hover: {
      opacity: 1,
      boxShadow: '0 0 20px 3px rgba(59, 130, 246, 0.3)',
      transition: {
        // The glow appears after the glitch is over
        opacity: { duration: 0.3, delay: 0.2 },
        boxShadow: { duration: 0.4, delay: 0.2, ease: 'easeOut' }
      },
    },
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block w-full p-4 rounded-xl group overflow-hidden"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Container for all content that will glitch */}
      <motion.div variants={glitchContentVariants}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Image */}
          <div className="w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg">
            <LazyImage
              src={post.image}
              alt={post.title}
              className="aspect-video sm:aspect-square object-cover"
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
      </motion.div>

      {/* The "Reveal" Glowing Border Element */}
      <motion.div
        className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
        variants={borderGlowVariants}
      />
    </MotionLink>
  );
};

export default PostListItem;