// src/components/PostListItem.jsx - FINAL VERSION WITH "3D TILT" ANIMATION
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LazyImage from './LazyImage';

const MotionLink = motion(Link);

const PostListItem = ({ post }) => {
  if (!post) return null;

  const ref = useRef(null);

  // --- Logic for tracking mouse position and creating the 3D tilt effect ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / 20; // Divide to reduce sensitivity
    const y = (clientY - top - height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Add a spring for a smooth, natural return animation
  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-20, 20], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-20, 20], [-10, 10]), springConfig);
  const spotlightX = useTransform(mouseX, [-40, 40], ['30%', '70%']);
  const spotlightY = useTransform(mouseY, [-40, 40], ['30%', '70%']);

  return (
    <MotionLink
      ref={ref}
      to={`/articles/${post.slug}`}
      className="relative block w-full p-1 rounded-2xl group overflow-hidden"
      style={{ perspective: 800 }} // Set perspective for 3D effect
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="w-full h-full p-4 rounded-xl relative overflow-hidden bg-slate-900/50"
        style={{ rotateX, rotateY }} // Apply the 3D rotation
      >
        {/* Glossy Spotlight Effect */}
        <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
                background: useTransform(
                    [spotlightX, spotlightY],
                    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(147, 197, 253, 0.15), transparent 40%)`
                ),
            }}
        />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Image */}
          <motion.div 
            className="w-full sm:w-48 flex-shrink-0 rounded-lg overflow-hidden"
            style={{ transform: 'translateZ(20px)' }} // Lift the image forward
          >
            <LazyImage
              src={post.image}
              alt={post.title}
              className="aspect-video sm:aspect-square object-cover"
            />
          </motion.div>
          
          {/* Content */}
          <motion.div 
            className="flex-1"
            style={{ transform: 'translateZ(10px)' }} // Lift the content slightly
          >
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
          </motion.div>

          {/* Arrow */}
          <motion.div 
            className="hidden sm:block ml-auto self-center"
            style={{ transform: 'translateZ(30px)' }} // Lift the arrow the most
          >
              <ArrowRight className="h-6 w-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </motion.div>
        </div>
      </motion.div>
    </MotionLink>
  );
};

export default PostListItem;