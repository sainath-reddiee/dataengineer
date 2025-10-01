// src/components/PostCard.jsx - FINAL VERSION with "Magnetic Spotlight" Animation
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostCard = ({ post }) => {
  if (!post) return null;

  const ref = useRef(null);

  // --- Mouse position tracking and spring animations ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Smooth out the mouse values with a spring for a more natural feel
  const springConfig = { damping: 20, stiffness: 150, mass: 0.1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // --- Transformations based on mouse position ---
  // Create a 3D tilt effect for the card
  const rotateX = useTransform(smoothMouseY, [0, 320], [10, -10]); // A card height of ~320px
  const rotateY = useTransform(smoothMouseX, [0, 400], [-10, 10]); // A card width of ~400px

  // Create the magnetic pull for the image
  const imageX = useTransform(smoothMouseX, [0, 400], [20, -20]);
  const imageY = useTransform(smoothMouseY, [0, 320], [20, -20]);

  // Create the parallax for the text content
  const textX = useTransform(smoothMouseX, [0, 400], [-10, 10]);
  const textY = useTransform(smoothMouseY, [0, 320], [-10, 10]);
  
  // Create dynamic opacity for the edge glows
  const opacityTop = useTransform(smoothMouseY, [0, 50], [1, 0]);
  const opacityBottom = useTransform(smoothMouseY, [270, 320], [0, 1]);
  const opacityLeft = useTransform(smoothMouseX, [0, 50], [1, 0]);
  const opacityRight = useTransform(smoothMouseX, [350, 400], [0, 1]);

  return (
    <MotionLink
      ref={ref}
      to={`/articles/${post.slug}`}
      className="relative block blog-card rounded-xl overflow-hidden group h-full"
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="w-full h-full"
        style={{ rotateX, rotateY }}
      >
        {/* Main Content Container */}
        <div className="relative h-48 overflow-hidden">
          {/* Spotlight Effect that follows the mouse */}
          <motion.div
            className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100"
            style={{
              background: useTransform(
                [smoothMouseX, smoothMouseY],
                ([x, y]) => `radial-gradient(200px at ${x}px ${y}px, rgba(59, 130, 246, 0.2), transparent 80%)`
              ),
            }}
          />
          
          <motion.div style={{ x: imageX, y: imageY, scale: 1.15 }} className="w-full h-full">
            <LazyImage
              src={post.image}
              alt={post.title}
              width={400}
              quality={80}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {post.category}
            </span>
          </div>
        </div>
        
        <motion.div className="p-6" style={{ x: textX, y: textY }}>
          <h3 className="text-lg font-bold mb-3 text-white transition-colors duration-300 line-clamp-2">
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
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Dynamic Edge Glows */}
        <motion.div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-400" style={{ opacity: opacityTop }} />
        <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-400" style={{ opacity: opacityBottom }} />
        <motion.div className="absolute top-0 bottom-0 left-0 w-[2px] bg-blue-400" style={{ opacity: opacityLeft }} />
        <motion.div className="absolute top-0 bottom-0 right-0 w-[2px] bg-purple-400" style={{ opacity: opacityRight }} />
      </motion.div>
    </MotionLink>
  );
};

export default PostCard;