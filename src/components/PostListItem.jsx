// src/components/PostListItem.jsx - FINAL VERSION WITH UNIQUE "CIRCUIT TRACE" ANIMATION
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostListItem = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Circuit Trace" effect ---

  const cardVariants = {
    rest: { 
      backgroundColor: 'rgba(30, 41, 59, 0)', // Transparent background initially
      scale: 1 
    },
    hover: { 
      backgroundColor: 'rgba(30, 41, 59, 0.5)', // Glow effect on hover
      scale: 1.015
    },
  };

  // Variants for the 4 border segments
  const borderTopVariants = {
    rest: { pathLength: 0 },
    hover: { pathLength: 1, transition: { duration: 0.2, ease: 'easeInOut' } },
  };
  const borderRightVariants = {
    rest: { pathLength: 0 },
    hover: { pathLength: 1, transition: { duration: 0.2, ease: 'easeInOut', delay: 0.2 } },
  };
  const borderBottomVariants = {
    rest: { pathLength: 0 },
    hover: { pathLength: 1, transition: { duration: 0.2, ease: 'easeInOut', delay: 0.4 } },
  };
  const borderLeftVariants = {
    rest: { pathLength: 0 },
    hover: { pathLength: 1, transition: { duration: 0.2, ease: 'easeInOut', delay: 0.6 } },
  };
  
  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  };
  
  const arrowVariants = {
    rest: { x: 0 },
    hover: { x: 5, transition: { repeat: Infinity, repeatType: 'reverse', duration: 0.4 } },
  };


  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block w-full p-4 rounded-xl group overflow-hidden" // Key classes: relative, overflow-hidden
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* --- Animated Border SVG --- */}
      <svg className="absolute inset-0 w-full h-full" width="100%" height="100%">
        <rect className="stroke-blue-500/80 stroke-2" width="100%" height="100%" rx="12" ry="12" fill="none">
          <motion.path d="M1,1 H calc(100% - 1) V calc(100% - 1) H1 Z" stroke="none" />
          <motion.path d="M1,1 H calc(100% - 1)" variants={borderTopVariants} />
          <motion.path d="M calc(100% - 1),1 V calc(100% - 1)" variants={borderRightVariants} />
          <motion.path d="M calc(100% - 1),calc(100% - 1) H1" variants={borderBottomVariants} />
          <motion.path d="M1,calc(100% - 1) V1" variants={borderLeftVariants} />
        </rect>
      </svg>


      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Image */}
        <div className="w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg">
          <motion.div variants={imageVariants} className="h-full">
            <LazyImage
              src={post.image}
              alt={post.title}
              className="aspect-video sm:aspect-square object-cover"
            />
          </motion.div>
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
            <motion.div variants={arrowVariants}>
                <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
            </motion.div>
        </div>
      </div>
    </MotionLink>
  );
};

export default PostListItem;