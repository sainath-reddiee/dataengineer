// src/components/PostCard.jsx - FINAL VERSION with "Running Dog" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

// A small helper component for the dust particles
const DustParticle = ({ delay }) => {
    const variants = {
        rest: { opacity: 0, scale: 0 },
        hover: {
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0],
            x: [0, -10, -20],
            y: [0, 5, 0],
            transition: {
                delay,
                duration: 0.6,
                ease: 'easeOut',
            }
        },
    };
    return <motion.div variants={variants} className="absolute w-1 h-1 bg-blue-300/50 rounded-full" />;
};

const PostCard = ({ post }) => {
  if (!post) return null;

  // --- Animation Variants for the "Running Dog" effect ---
  const cardVariants = {
    rest: { scale: 1, boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)' },
    hover: { scale: 1.03, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.3)' },
  };

  const borderVariants = {
    rest: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.4 } },
  };

  const dogVariants = {
    rest: { x: '-110%', opacity: 0 },
    hover: {
      x: '110%',
      opacity: 1,
      transition: {
        x: { duration: 0.8, ease: 'linear' },
        opacity: { duration: 0.1 }
      },
    },
  };
  
  const trailVariants = {
      rest: {},
      hover: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  return (
    <MotionLink
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group h-full"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative h-48 overflow-hidden">
        <LazyImage
          src={post.image}
          alt={post.title}
          width={400}
          quality={80}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* --- The Running Dog Animation --- */}
        <div className="absolute top-2 left-0 w-full h-8 overflow-hidden">
            <motion.div variants={dogVariants}>
                {/* SVG Dog Silhouette */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
                    <path d="M12.2,2.8c-0.5,0-0.9,0.4-0.9,0.9v1.8c0,0.5,0.4,0.9,0.9,0.9s0.9-0.4,0.9-0.9V3.7C13.1,3.2,12.7,2.8,12.2,2.8z M19,10.3c-0.2-0.4-0.7-0.5-1.1-0.3c-0.4,0.2-0.5,0.7-0.3,1.1l1.1,2.1H13V9.7c0-0.5-0.4-0.9-0.9-0.9s-0.9,0.4-0.9,0.9v4.5c0,0.5,0.4,0.9,0.9,0.9h6.8l-1.1,2.1c-0.2,0.4-0.1,0.9,0.3,1.1c0.1,0.1,0.3,0.1,0.4,0.1c0.3,0,0.6-0.2,0.8-0.5l2.7-5c0.2-0.4,0.1-0.9-0.3-1.1L19,10.3z M8.5,8.8C7.1,8.8,6,9.9,6,11.3s1.1,2.5,2.5,2.5s2.5-1.1,2.5-2.5S9.9,8.8,8.5,8.8z M4.5,21.2c0.5,0,0.9-0.4,0.9-0.9v-2.7c0-0.5-0.4-0.9-0.9-0.9S3.6,17,3.6,17.5v2.7C3.6,20.8,4,21.2,4.5,21.2z M9.9,21.2c0.5,0,0.9-0.4,0.9-0.9v-2.7c0-0.5-0.4-0.9-0.9-0.9s-0.9,0.4-0.9,0.9v2.7C9,20.8,9.4,21.2,9.9,21.2z"/>
                </svg>
                {/* Dust Trail */}
                <motion.div variants={trailVariants} className="absolute top-1/2 -left-2">
                    {Array.from({length: 3}).map((_, i) => <DustParticle key={i} delay={i * 0.05} />)}
                </motion.div>
            </motion.div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <motion.div 
            className="absolute inset-0 border-2 border-blue-400 rounded-xl pointer-events-none"
            variants={borderVariants}
        />
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {post.category}
          </span>
        </div>
      </div>
      
      {/* Text Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
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