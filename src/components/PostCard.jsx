// src/components/PostCard.jsx - FINAL VERSION with "Interactive Image Displacement" Animation
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  const ref = useRef(null);

  // --- Mouse position tracking for the interactive effect ---
  const mouseX = useMotionValue(0.5); // Start at center
  const mouseY = useMotionValue(0.5); // Start at center

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    // Normalize mouse position to a 0-1 range
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };
  
  // Smooth out the mouse values with a spring
  const springConfig = { damping: 25, stiffness: 200 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  return (
    <MotionLink
      ref={ref}
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Container for the image and its effects */}
      <div className="relative h-48 overflow-hidden">

        {/* --- The SVG Filter for the displacement/ripple effect --- */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <filter id="displacement-filter">
                {/* Create a turbulence/noise pattern */}
                <motion.feTurbulence 
                    type="fractalNoise" 
                    baseFrequency="0.05 0.5" // Creates a watery/streaky noise
                    numOctaves="2" 
                    result="turbulence"
                />
                {/* Use the noise to displace the image. Animate the scale to turn the effect on/off */}
                <motion.feDisplacementMap 
                    in="SourceGraphic" 
                    in2="turbulence" 
                    scale="0" // Animate this value
                    xChannelSelector="R" 
                    yChannelSelector="G"
                />
            </filter>
          </defs>
        </svg>

        <motion.div
            className="w-full h-full"
            style={{ filter: 'url(#displacement-filter)', scale: 1.1 }} // Apply the filter and a slight zoom
            variants={{
                rest: { scale: 1 },
                hover: { scale: 1.15 } // Zoom in more on hover
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <LazyImage
                src={post.image}
                alt={post.title}
                width={400}
                quality={80}
                className="w-full h-full object-cover"
            />
        </motion.div>

        <div className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {post.category}
          </span>
        </div>
      </div>
      
      {/* Text Content Container (slides up on hover) */}
      <motion.div 
        className="p-6 bg-slate-900/50 backdrop-blur-md absolute bottom-0 left-0 right-0"
        variants={{
            rest: { y: 'calc(100% - 80px)' }, // Show only the title
            hover: { y: '0%' } // Slide up to reveal everything
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-3">
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
      </motion.div>
    </MotionLink>
  );
};

export default PostCard;