// src/components/PostCard.jsx - FINAL VERSION with "Liquid Reveal" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Liquid Reveal" effect ---
  const cardVariants = {
    rest: {
      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
    },
    hover: {
      boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.3)',
    },
  };

  const imageMaskVariants = {
    rest: {
      scale: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    hover: {
      scale: 4, // Expand to cover the entire card
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    },
  };
  
  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
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
      <div className="relative h-48 overflow-hidden">
        {/* --- The Liquid Reveal SVG Filter --- */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <filter id="liquid-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="contrast" />
              <feComposite in="SourceGraphic" in2="contrast" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Base Image (dimmed and desaturated) */}
        <div className="w-full h-full filter saturate-[0.7] brightness-[0.8]">
          <LazyImage
            src={post.image}
            alt={post.title}
            width={400}
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover"
          />
        </div>

        {/* The Revealing Image Container (clipped by the liquid mask) */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'url(#liquid-mask)' }}
        >
          <motion.div variants={imageVariants} className="w-full h-full">
            <LazyImage
              src={post.image}
              alt={post.title}
              width={400}
              quality={90} // Higher quality for the revealed image
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* The Liquid Mask itself (two expanding blobs) */}
        <svg width="0" height="0" className="absolute">
          <clipPath id="liquid-mask">
            <g style={{ filter: 'url(#liquid-filter)' }}>
              <motion.circle
                cx="50%"
                cy="50%"
                r="80"
                variants={imageMaskVariants}
              />
              <motion.circle
                cx="20%"
                cy="40%"
                r="60"
                variants={{
                    rest: imageMaskVariants.rest,
                    hover: {...imageMaskVariants.hover, transition: {...imageMaskVariants.hover.transition, delay: 0.1}}
                }}
              />
            </g>
          </clipPath>
        </svg>

        {/* Static background gradient and category */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {post.category}
          </span>
        </div>
      </div>
      
      {/* Text Content */}
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