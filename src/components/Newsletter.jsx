import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ArrowRight, Sparkles, BookOpen, Rss } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const Newsletter = () => {
  const [ref, , hasIntersected] = useIntersectionObserver();

  return (
    <section ref={ref} className="py-16 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <AnimatePresence>
          {hasIntersected && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-effect rounded-2xl p-8 md:p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl"
                >
                  <Bookmark className="h-8 w-8 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold mb-4"
                >
                  Stay Ahead of the <span className="gradient-text">Data Curve</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
                >
                  Bookmark this site and check back regularly for new tutorials, guides, and insights on AWS, Snowflake, dbt, Airflow, and the modern data stack.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
                >
                  <Link
                    to="/articles"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse All Articles
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/glossary"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Explore Glossary
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
                >
                  <div className="flex items-center space-x-2">
                    <Rss className="h-4 w-4 text-orange-400" />
                    <span>New articles weekly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>In-depth tutorials</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-green-400" />
                    <span>Free and open</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Newsletter;