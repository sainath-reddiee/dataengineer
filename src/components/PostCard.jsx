// src/components/PostCard.jsx - FINAL VERSION with "Glyph Reveal" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Glyph Reveal" effect ---
  const cardVariants = {
    rest: { scale: 1, boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)' },
    hover: { scale: 1.05, boxShadow: '0px 20px 30px rgba(0, 0, 0, 0.2)' },
  };

  const imageContainerVariants = {
    rest: { filter: 'saturate(0.7) brightness(0.8)' },
    hover: { filter: 'saturate(1) brightness(1)' },
  };

  const glyphVariants = {
    rest: { pathLength: 0, opacity: 0.5 },
    hover: { 
      pathLength: 1, 
      opacity: [0.5, 1, 0],
      transition: { duration: 0.6, ease: 'easeInOut' }
    },
  };
  
  const borderVariants = {
      rest: { opacity: 0 },
      hover: { opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group transition-all duration-300"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <div className="relative h-48 overflow-hidden">
        <motion.div variants={imageContainerVariants} className="w-full h-full">
            <LazyImage
            src={post.image}
            alt={post.title}
            width={400}
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full"
            />
        </motion.div>
        
        {/* The Glyph SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full" fill="none">
            <motion.path 
                d="M10 10 L40 10 L40 40 M100 100 L100 70 L70 70 M-10 80 L20 110 M120 20 L150 -10"
                stroke="rgba(0, 190, 255, 0.7)"
                strokeWidth="1.5"
                variants={glyphVariants}
            />
            <motion.path 
                d="M50 120 L50 90 L80 90 M150 50 L120 50 L120 80 M20 -10 L-10 20"
                stroke="rgba(168, 85, 247, 0.7)"
                strokeWidth="1.5"
                variants={glyphVariants}
                transition={{ ...glyphVariants.hover.transition, delay: 0.1 }} // Staggered delay
            />
        </svg>

        {/* The Reveal Border */}
        <motion.div 
            className="absolute inset-0 border-2 border-blue-400 rounded-xl"
            variants={borderVariants}
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
    </MotionLink>
  );
};

export default PostCard;