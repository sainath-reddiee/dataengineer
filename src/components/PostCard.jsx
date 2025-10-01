// src/components/PostCard.jsx - FINAL VERSION with "Focus Target" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Focus Target" effect ---
  const cardVariants = {
    rest: {
      '--x': '0%',
      '--y': '0%',
    },
    hover: {
        // We can add any parent-level changes here if needed
    },
  };

  const contentVariants = {
    rest: { scale: 1 },
    hover: { scale: 0.95 },
  };

  const spotlightVariants = {
    rest: { opacity: 0, scale: 0.8 },
    hover: { opacity: 1, scale: 1 },
  };

  const cornerVariants = {
    rest: {
      width: 0,
      height: 0,
    },
    hover: {
      width: '100%',
      height: '100%',
      transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
    },
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group transition-all duration-300"
      style={{ perspective: 800 }}
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* 1. The Spotlight Glow (at the back) */}
      <motion.div
        variants={spotlightVariants}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"
      />

      {/* 2. The Main Content (shrinks down) */}
      <motion.div
        variants={contentVariants}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="h-full"
      >
        <div className="relative h-48 overflow-hidden">
          <LazyImage
            src={post.image}
            alt={post.title}
            width={400}
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute top-4 left-4">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {post.category}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{post.readTime}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>

      {/* 3. The Corner Targeting Brackets (on top) */}
      <div className="absolute inset-0 p-2 pointer-events-none">
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-8 h-8">
            <motion.div variants={cornerVariants} className="w-full h-full border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
        </div>
        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-8 h-8">
            <motion.div variants={cornerVariants} className="w-full h-full border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
        </div>
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-8 h-8">
            <motion.div variants={cornerVariants} className="w-full h-full border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
        </div>
        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-8 h-8">
            <motion.div variants={cornerVariants} className="w-full h-full border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
        </div>
      </div>
    </MotionLink>
  );
};

export default PostCard;