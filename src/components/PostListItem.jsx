// src/components/PostListItem.jsx - FINAL VERSION "Data Flow" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostListItem = ({ post }) => {
  if (!post) return null;

  const cardVariants = {
    rest: { 
      scale: 1, 
      boxShadow: '0px 5px 10px rgba(0, 0, 0, 0)',
      backgroundColor: 'rgba(30, 41, 59, 0.5)' // Start with a semi-transparent background
    },
    hover: { 
      scale: 1.015, 
      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
      backgroundColor: 'rgba(30, 41, 59, 0.8)' // Darken on hover
    },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
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
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
        }}
      />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
        {/* Image */}
        <div className="w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg">
          <motion.div variants={imageVariants} className="h-full" transition={{ duration: 0.4, ease: 'easeOut' }}>
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
            <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </MotionLink>
  );
};

export default PostListItem;