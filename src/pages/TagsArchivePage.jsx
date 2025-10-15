// src/pages/TagsArchivePage.jsx - NEW FILE
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tag, Search, ArrowRight, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTags } from '@/hooks/useWordPress';
import MetaTags from '@/components/SEO/MetaTags';

const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: { x: 0, y: 0, scale: 0, opacity: 0 },
    hover: {
      x, y, scale: 1,
      opacity: [0, 1, 0.5, 0],
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] },
    },
  };
  return (
    <motion.div
      variants={variants}
      className="absolute top-1/2 left-1/2 h-[3px] w-[3px] rounded-full"
      style={{ backgroundColor: color, rotate }}
    />
  );
};

const MotionLink = motion(Link);

const TagsArchivePage = () => {
  const { tags, loading, error } = useTags();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sparkContainerVariants = { 
    rest: {}, 
    hover: { transition: { staggerChildren: 0.04 } } 
  };
  
  const sparks = useMemo(() => 
    Array.from({ length: 12 }).map(() => ({ 
      x: Math.random() * 50 - 25, 
      y: Math.random() * 50 - 25, 
      rotate: Math.random() * 360, 
      color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)] 
    })), 
  []);

  return (
    <>
      <MetaTags 
        title="Browse All Tags - DataEngineer Hub"
        description="Explore all tags on DataEngineer Hub. Find articles by topic including data engineering, cloud platforms, databases, and more."
        keywords="tags, topics, data engineering, cloud, databases, tutorials"
        type="website"
      />
      
      <div className="pt-4 pb-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                          bg-gradient-to-br from-blue-600/20 to-purple-600/20 
                          backdrop-blur-sm border border-blue-400/30 mb-6">
              <Tag className="h-10 w-10 text-blue-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Browse by <span className="gradient-text">Tags</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Explore articles organized by topics and technologies. Click any tag to see related content.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 h-12"
                />
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center space-y-4">
                <Loader className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-gray-400">Loading tags...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center max-w-md mx-auto"
            >
              <p className="text-red-400 mb-4">Error loading tags: {error}</p>
            </motion.div>
          )}

          {/* Tags Cloud */}
          {!loading && !error && filteredTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-6 text-center">
                <span className="text-gray-400">
                  Showing {filteredTags.length} {filteredTags.length === 1 ? 'tag' : 'tags'}
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {filteredTags.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <MotionLink
                      to={`/tag/${tag.slug}`}
                      initial="rest"
                      whileHover="hover"
                      className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full
                               bg-gradient-to-r from-blue-500/10 to-purple-500/10
                               border border-blue-400/20 hover:border-blue-400/50
                               hover:from-blue-500/20 hover:to-purple-500/20
                               transition-all duration-300 overflow-hidden"
                      aria-label={`View articles tagged with ${tag.name}`}
                    >
                      {[...Array(4)].map((_, i) => (
                        <motion.div 
                          key={i} 
                          variants={sparkContainerVariants} 
                          className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-12 h-12`}
                        >
                          {sparks.map((spark, j) => <Spark key={j} {...spark} />)}
                        </motion.div>
                      ))}

                      <div className="relative z-10 flex items-center gap-2">
                        <span className="text-blue-300 font-medium">#{tag.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
                          {tag.count}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-500 group-hover:text-blue-400 
                                             group-hover:translate-x-1 transition-all" />
                      </div>
                    </MotionLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {!loading && !error && filteredTags.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 mb-4">
                No tags found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Clear search
              </button>
            </motion.div>
          )}

          {/* CTA Section */}
          {!loading && !error && tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 
                       backdrop-blur-sm border border-blue-400/20 rounded-2xl text-center"
            >
              <h3 className="text-2xl font-bold mb-4 gradient-text">
                Can't Find What You're Looking For?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Browse all articles or explore content by category to discover more data engineering tutorials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/articles"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full
                           bg-gradient-to-r from-blue-600 to-purple-600 
                           hover:from-blue-700 hover:to-purple-700
                           text-white font-semibold transition-all duration-300"
                >
                  Browse All Articles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full
                           border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20
                           font-semibold transition-all duration-300"
                >
                  Explore Categories
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default TagsArchivePage;