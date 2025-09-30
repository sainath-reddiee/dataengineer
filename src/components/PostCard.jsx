import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const PostCard = ({ post }) => {
  if (!post) {
    return null;
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link 
        to={`/articles/${post.slug}`} 
        className="block blog-card rounded-2xl overflow-hidden group h-full flex flex-col"
      >
        <div className="relative flex-shrink-0">
          {/* Image container with a slightly reduced height */}
          <div className="w-full h-44 overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit-crop';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {post.category}
            </span>
          </div>
          
          {/* Featured/Trending Badges */}
          <div className="absolute top-3 right-3 flex space-x-2">
            {post.featured && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-full shadow-lg">
                <Star className="h-3 w-3" />
              </div>
            )}
            {post.trending && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2 rounded-full shadow-lg">
                <TrendingUp className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
        
        {/* Content area with reduced padding and optimized layout */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-3 border-t border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-blue-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;