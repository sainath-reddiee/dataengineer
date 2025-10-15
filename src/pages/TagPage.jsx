// src/pages/TagPage.jsx - COMPLETE NEW FILE
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecentPosts from '@/components/RecentPosts';
import MetaTags from '@/components/SEO/MetaTags';
import SidebarAd from '@/components/SidebarAd';

const TagPage = () => {
  const { tagSlug } = useParams();
  
  // Convert slug to readable name (e.g., "data-engineering" -> "Data Engineering")
  const tagName = tagSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      <MetaTags 
        title={`${tagName} Articles`}
        description={`Browse all articles tagged with ${tagName}. Expert data engineering tutorials and guides on ${tagName}.`}
        keywords={`${tagName}, data engineering, tutorials, ${tagSlug}`}
        type="website"
      />
      
      <div className="pt-4 pb-12">
        <div className="container mx-auto px-6 grid lg:grid-cols-[240px_1fr_240px] gap-8">
            <SidebarAd position="sidebar-left" />

            <main className="lg:col-span-1">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <Button 
                    asChild 
                    variant="outline" 
                    className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
                    >
                    <Link to="/articles">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        All Articles
                    </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                                bg-gradient-to-br from-blue-600/20 to-purple-600/20 
                                backdrop-blur-sm border border-blue-400/30 mb-6">
                    <Tag className="h-10 w-10 text-blue-400" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4">
                    <span className="gradient-text">#{tagName}</span>
                    </h1>

                    <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Explore articles and tutorials tagged with <strong>{tagName}</strong>
                    </p>

                    <div className="flex items-center justify-center mt-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-400 
                                    bg-gray-800/30 px-4 py-2 rounded-full border border-blue-400/20">
                        <Tag className="h-4 w-4 text-blue-400" />
                        <span>Tag: {tagName}</span>
                    </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <RecentPosts 
                    tag={tagSlug}
                    initialLimit={12}
                    showLoadMore={true}
                    showViewToggle={true}
                    title={`Articles tagged "${tagName}"`}
                    showCategoryError={true}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-16 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 
                            backdrop-blur-sm border border-blue-400/20 rounded-2xl text-center"
                >
                    <h3 className="text-xl font-bold mb-4 gradient-text">
                    Explore More Content
                    </h3>
                    <p className="text-gray-300 mb-6">
                    Can't find what you're looking for? Browse all articles or explore by category.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                        asChild 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Link to="/articles">
                        Browse All Articles
                        </Link>
                    </Button>
                    <Button 
                        asChild 
                        variant="outline"
                        className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                    >
                        <Link to="/">
                        Explore Categories
                        </Link>
                    </Button>
                    </div>
                </motion.div>
            </main>

            <SidebarAd position="sidebar-right" />
        </div>
      </div>
    </>
  );
};

export default TagPage;