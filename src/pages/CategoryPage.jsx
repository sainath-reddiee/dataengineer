// src/pages/CategoryPage.jsx
// FIXED: Added key prop to force component re-mount on category change
import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RecentPosts from '@/components/RecentPosts';
import MetaTags from '@/components/SEO/MetaTags';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  // Category descriptions
  const categoryDescriptions = {
    snowflake: "Master Snowflake with comprehensive tutorials on data warehousing, analytics, and cloud data platform features.",
    aws: "Learn AWS data services: S3, Redshift, Glue, Lambda. Master cloud data engineering with Amazon Web Services.",
    azure: "Explore Azure data services from Data Factory to Synapse Analytics. Complete guide for data engineers.",
    sql: "Master SQL with advanced queries, optimization techniques, and best practices for data transformation.",
    airflow: "Apache Airflow tutorials for workflow orchestration. Build, schedule, and monitor data pipelines effectively.",
    dbt: "Data Build Tool (dbt) tutorials for modern data transformation and analytics engineering best practices.",
    python: "Python for data engineering with pandas, NumPy, and more. Master data processing with Python libraries.",
    analytics: "Data analytics, visualization, and BI tools. Create insightful reports and dashboards for business."
  };

  // Category icon URLs
  const getCategoryIcon = (category) => {
    const lowerCategory = category.toLowerCase();
    
    const iconUrls = {
      snowflake: 'https://cdn.brandfetch.io/idJz-fGD_q/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B',
      aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
      azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      airflow: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/apacheairflow/apacheairflow-original.svg',
      dbt: 'https://seeklogo.com/images/D/dbt-logo-500AB0BAA7-seeklogo.com.png',
      python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      analytics: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg'
    };
    
    const iconUrl = iconUrls[lowerCategory];
    
    if (iconUrl) {
      return (
        <img 
          src={iconUrl} 
          alt={`${category} logo`}
          className="w-10 h-10 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '<div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📁</div>';
          }}
        />
      );
    }
    
    return (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
        <path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
    );
  };

  const categoryDescription = categoryDescriptions[categoryName.toLowerCase()] || 
    `Discover articles and tutorials about ${formattedCategoryName} technology and best practices.`;

  const metaDescription = categoryDescriptions[categoryName.toLowerCase()] || 
    `Browse ${formattedCategoryName} articles on DataEngineer Hub. Learn best practices and advanced techniques.`;

  const pageTitle = `${formattedCategoryName} Tutorials`;

  return (
    <>
      <MetaTags 
        title={pageTitle}
        description={metaDescription}
        keywords={`${categoryName.toLowerCase()}, data engineering, ${formattedCategoryName} tutorials, ${formattedCategoryName} guides, ${formattedCategoryName} best practices`}
        type="website"
      />
      
      <div className="pt-1 pb-8">
        <div className="container mx-auto px-6">
          {/* Navigation */}
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
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Header - FIXED: Animation resets on category change */}
          <motion.div
            key={`header-${categoryName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 mb-6">
              <span role="img" aria-label={formattedCategoryName}>
                {getCategoryIcon(categoryName)}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black mb-4">
              <span className="gradient-text">{formattedCategoryName} Tutorials & Articles</span>
            </h1>
            
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {categoryDescription}
            </p>
            
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
                <Folder className="h-4 w-4" />
                <span>Category: {formattedCategoryName}</span>
              </div>
            </div>
          </motion.div>
          
          {/* CRITICAL FIX: Key prop forces complete re-mount when category changes */}
          <motion.div
            key={`posts-wrapper-${categoryName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RecentPosts 
              key={`posts-${categoryName}`}
              category={categoryName.toLowerCase()} 
              showCategoryError={true}
              initialLimit={9}
              title={`All ${formattedCategoryName} Articles`}
              showLoadMore={true}
              showViewToggle={true}
            />
          </motion.div>

          {/* Explore Other Categories */}
          <motion.div
            key={`explore-${categoryName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-400/20 rounded-2xl"
          >
            <div className="text-xl font-bold mb-4 text-center gradient-text">
              Explore Other Categories
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(categoryDescriptions).map(([slug, description]) => (
                <Link
                  key={slug}
                  to={`/category/${slug}`}
                  className={`p-3 rounded-lg text-center transition-all duration-300 ${
                    slug === categoryName.toLowerCase()
                      ? 'bg-blue-600/30 border border-blue-400/50'
                      : 'bg-gray-800/30 hover:bg-gray-700/50 border border-transparent hover:border-gray-600/50'
                  }`}
                  aria-label={`View ${slug} articles`}
                >
                  <div className="flex justify-center mb-2">
                    {getCategoryIcon(slug)}
                  </div>
                  <div className={`text-sm font-medium ${
                    slug === categoryName.toLowerCase()
                      ? 'text-blue-300'
                      : 'text-gray-300'
                  }`}>
                    {slug.charAt(0).toUpperCase() + slug.slice(1)}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <Button 
                asChild 
                variant="outline" 
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to="/articles">
                  View All Articles
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;