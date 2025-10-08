// src/components/TagsList.jsx - NEW FILE
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

const TagsList = ({ tags, limit = null, showIcon = true, size = 'default' }) => {
  if (!tags || tags.length === 0) return null;

  const displayTags = limit ? tags.slice(0, limit) : tags;

  // Size variants
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-xs',
    large: 'px-4 py-1.5 text-sm'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showIcon && (
        <Tag className={`${iconSizes[size]} text-gray-400 flex-shrink-0`} />
      )}
      {displayTags.map((tag, index) => (
        <motion.div
          key={tag.id || tag.slug}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Link
            to={`/tag/${tag.slug}`}
            className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium 
                     bg-blue-500/10 text-blue-300 border border-blue-500/20
                     hover:bg-blue-500/20 hover:border-blue-400/40 hover:scale-105
                     transition-all duration-200`}
          >
            #{tag.name}
          </Link>
        </motion.div>
      ))}
      {limit && tags.length > limit && (
        <span className="text-xs text-gray-500 italic">
          +{tags.length - limit} more
        </span>
      )}
    </div>
  );
};

export default TagsList;