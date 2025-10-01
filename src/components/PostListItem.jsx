// src/components/PostListItem.jsx - FINAL VERSION WITH "CORNER GLOW" ANIMATION
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

// Helper component for the "Corner Burst" sparks
const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: { x: 0, y: 0, scale: 0, opacity: 0 },
    hover: {
      x: x,
      y: y,
      scale: 1,
      opacity: [0, 1, 0.5, 0],
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] },
    },
  };
  return (
    <motion.div
      variants={variants}
      className="absolute top-0 left-0 h-[3px] w-[3px] rounded-full"
      style={{ backgroundColor: color, rotate }}
    />
  );
};

const PostListItem = ({ post }) => {
  if (!post) return null;

  const cardVariants = {
    rest: { 
      scale: 1, 
      boxShadow: '0px 5px 10px rgba(0, 0, 0, 0)',
    },
    hover: { 
      scale: 1.015, 
      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
    },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  };
  
  const sparkContainerVariants = {
    rest: {},
    hover: { transition: { staggerChildren: 0.03 } },
  };

  // Memoize spark particles to prevent recalculation on every render
  const sparks = useMemo(() => Array.from({ length: 12 }, () => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * 60 - 30,
    rotate: Math.random() * 360,
    color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)],
  })), []);

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block w-full p-4 rounded-xl group overflow-hidden"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 1. DATA FLOW: Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 60%)',
          backgroundSize: '200% 200%',
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* 2. CORNER GLOWS: Replaces the "Circuit Trace" */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/50 via-transparent to-transparent rounded-full"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 1, scale: 1.2, transition: { duration: 0.6, ease: 'easeOut' } }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/50 via-transparent to-transparent rounded-full"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 1, scale: 1.2, transition: { duration: 0.6, ease: 'easeOut' } }}
      />
      
      {/* 3. CORNER BURST: Particle Emitters */}
      <motion.div variants={sparkContainerVariants} className="absolute top-0 left-0 w-12 h-12">
        {sparks.map((spark, i) => <Spark key={i} {...spark} />)}
      </motion.div>
      <motion.div variants={sparkContainerVariants} className="absolute top-0 right-0 w-12 h-12">
        {sparks.map((spark, i) => <Spark key={i} {...spark} />)}
      </motion.div>
      <motion.div variants={sparkContainerVariants} className="absolute bottom-0 right-0 w-12 h-12">
        {sparks.map((spark, i) => <Spark key={i} {...spark} />)}
      </motion.div>
      <motion.div variants={sparkContainerVariants} className="absolute bottom-0 left-0 w-12 h-12">
        {sparks.map((spark, i) => <Spark key={i} {...spark} />)}
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 bg-slate-900/60 group-hover:bg-slate-800/60 p-4 rounded-lg transition-colors duration-300">
        <div className="w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg">
          <motion.div variants={imageVariants} className="h-full" transition={{ duration: 0.4, ease: 'easeOut' }}>
            <LazyImage
              src={post.image}
              alt={post.title}
              className="aspect-video sm:aspect-square object-cover"
            />
          </motion.div>
        </div>
        
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

        <div className="hidden sm:block ml-auto self-center">
            <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </MotionLink>
  );
};

export default PostListItem;