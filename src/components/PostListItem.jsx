// src/components/PostListItem.jsx - FINAL VERSION WITH "CORNER BURST" ANIMATION
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

// A small helper component for the spark particles
const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: {
      x: 0,
      y: 0,
      scale: 0,
      opacity: 0,
    },
    hover: {
      x: x,
      y: y,
      scale: 1,
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        ease: [0.25, 1, 0.5, 1], // A nice ease-out curve
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      className="absolute top-0 left-0 h-1 w-1 rounded-full"
      style={{ backgroundColor: color, rotate }}
    />
  );
};

const PostListItem = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Corner Burst" effect ---
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

  const containerVariants = {
    rest: {},
    hover: {
      transition: {
        staggerChildren: 0.04, // Stagger the animation of each spark
      },
    },
  };

  // Pre-calculate random values for the sparks for better performance
  const sparks = useMemo(() => {
    const sparks = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * 90; // Emit sparks within a 90-degree corner arc
      const distance = 40 + Math.random() * 30;
      sparks.push({
        x: Math.cos(angle * (Math.PI / 180)) * distance,
        y: Math.sin(angle * (Math.PI / 180)) * distance,
        rotate: Math.random() * 360,
        color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)],
      });
    }
    return sparks;
  }, []);

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block w-full p-4 rounded-xl group overflow-hidden bg-slate-800/20"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* --- Spark Containers for each corner --- */}
      <motion.div variants={containerVariants} className="absolute top-0 left-0">
        {sparks.map((spark, i) => <Spark key={i} x={spark.x} y={spark.y} rotate={spark.rotate} color={spark.color} />)}
      </motion.div>
      <motion.div variants={containerVariants} className="absolute top-0 right-0" style={{ transform: 'rotate(90deg)' }}>
        {sparks.map((spark, i) => <Spark key={i} x={spark.x} y={spark.y} rotate={spark.rotate} color={spark.color} />)}
      </motion.div>
      <motion.div variants={containerVariants} className="absolute bottom-0 right-0" style={{ transform: 'rotate(180deg)' }}>
        {sparks.map((spark, i) => <Spark key={i} x={spark.x} y={spark.y} rotate={spark.rotate} color={spark.color} />)}
      </motion.div>
      <motion.div variants={containerVariants} className="absolute bottom-0 left-0" style={{ transform: 'rotate(270deg)' }}>
        {sparks.map((spark, i) => <Spark key={i} x={spark.x} y={spark.y} rotate={spark.rotate} color={spark.color} />)}
      </motion.div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 bg-slate-900/50 group-hover:bg-slate-800/50 p-4 rounded-lg transition-colors duration-300">
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
          <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </MotionLink>
  );
};

export default PostListItem;