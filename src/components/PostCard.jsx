// src/components/PostCard.jsx - FINAL VERSION with "Top Running Dog" Animation
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

// A small helper component for the dust puffs
const DustParticle = ({ delay }) => {
    const variants = {
        rest: { opacity: 0, scale: 0, y: 0 },
        hover: {
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0],
            y: [0, -5, -10],
            transition: {
                delay,
                duration: 0.8, // Slower puff animation
                ease: 'easeOut',
            }
        },
    };
    return <motion.div variants={variants} className="absolute w-2 h-2 bg-blue-300/30 rounded-full" />;
};

const PostCard = ({ post }) => {
  if (!post) return null;

  const cardVariants = {
    rest: { scale: 1, boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)' },
    hover: { scale: 1.03, boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.3)' },
  };

  const borderVariants = {
    rest: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.4, delay: 0.1 } },
  };

  const dogVariants = {
    rest: { x: '-100%' }, // Start off-screen to the left
    hover: {
      x: '100vw', // Run far off-screen to the right
      transition: {
        x: { 
            duration: 2.5, // Slower run duration
            ease: 'linear',
            delay: 0.1,
            repeat: Infinity,
            repeatDelay: 2
        },
      },
    },
  };
  
  const trailVariants = {
      rest: {},
      hover: { transition: { staggerChildren: 0.08 } }
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
        {/* --- The Running Dog Animation Container --- */}
        {/* This container is now at the top level to span the whole card width */}
        <div className="absolute top-0 -mt-4 left-0 w-full h-8 z-20 pointer-events-none">
            <motion.div 
                variants={dogVariants} 
                className="absolute"
                style={{ width: '40px', left: '-40px' }} // Position the container to start off-screen
            >
                {/* Stylized Dog SVG */}
                <svg viewBox="0 0 50 32" fill="none" className="w-full h-full">
                    <path d="M43.6,18.8c-0.3-0.8-1-1.3-1.8-1.3H26.3c-0.8,0-1.5,0.7-1.5,1.5v0c0,0.8,0.7,1.5,1.5,1.5h15.2l-2.4,4.7c-0.5,1-0.2,2.2,0.8,2.7c0.2,0.1,0.5,0.2,0.7,0.2c0.8,0,1.5-0.5,1.8-1.3L46,21.8c0.5-1-0.2-2.2-1.2-2.7L43.6,18.8z M19.5,14.7c-2.3,0-4.2,1.9-4.2,4.2s1.9,4.2,4.2,4.2s4.2-1.9,4.2-4.2S21.8,14.7,19.5,14.7z M12.3,29.9c0.8,0,1.5-0.7,1.5-1.5V22c0-0.8-0.7-1.5-1.5-1.5s-1.5,0.7-1.5,1.5v6.4C10.8,29.3,11.5,29.9,12.3,29.9z M22.5,29.9c0.8,0,1.5-0.7,1.5-1.5V22c0-0.8-0.7-1.5-1.5-1.5s-1.5,0.7-1.5,1.5v6.4C21,29.3,21.7,29.9,22.5,29.9z M25.4,3.2C24.6,3.2,24,3.8,24,4.6v3c0,0.8,0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5V4.6C26.9,3.8,26.2,3.2,25.4,3.2z" fill="rgba(255,255,255,0.8)"/>
                </svg>
                {/* Dust Trail */}
                <motion.div variants={trailVariants} className="absolute top-full -left-2 mt-1">
                    {Array.from({length: 3}).map((_, i) => <DustParticle key={i} delay={i * 0.1} />)}
                </motion.div>
            </motion.div>
        </div>

      {/* Card Content */}
      <div className="relative h-48 overflow-hidden">
        <LazyImage
          src={post.image}
          alt={post.title}
          width={400}
          quality={80}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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