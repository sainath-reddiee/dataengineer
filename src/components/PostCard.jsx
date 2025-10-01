// src/components/PostCard.jsx - FINAL VERSION with "Image Reveal & Slide-Up" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Image Reveal & Slide-Up" effect ---
  const cardVariants = {
    rest: {
      boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      boxShadow: '0px 20px 30px rgba(0, 0, 0, 0.3)',
    },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  };

  const contentVariants = {
    rest: { y: '100%', opacity: 0 },
    hover: { y: '0%', opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const categoryVariants = {
    rest: { y: 0, opacity: 1 },
    hover: { y: -50, opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group h-full"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.4 }}
    >
      {/* Image Container */}
      <div className="relative h-full">
        <motion.div variants={imageVariants} className="w-full h-full">
          <LazyImage
            src={post.image}
            alt={post.title}
            width={400}
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Static background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Category Badge (animates out on hover) */}
        <motion.div variants={categoryVariants} className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {post.category}
          </span>
        </motion.div>

        {/* Title (Always Visible) */}
        <div className="absolute bottom-0 left-0 p-6">
           <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
            {post.title}
          </h3>
        </div>

        {/* Sliding Content Panel (Revealed on Hover) */}
        <motion.div
          variants={contentVariants}
          className="absolute inset-0 p-6 flex flex-col justify-end bg-slate-900/50 backdrop-blur-md"
        >
          <h3 className="text-lg font-bold text-blue-300 line-clamp-2 leading-tight">
            {post.title}
          </h3>
          <p className="text-gray-300 text-sm my-3 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-3">
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
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>
    </MotionLink>
  );
};

export default PostCard;