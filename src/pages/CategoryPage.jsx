// src/pages/CategoryPage.jsx - COMPLETE FINAL VERSION WITH ADSENSE & MOBILE FIXES
import React, { useMemo, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RecentPosts from '@/components/RecentPosts';
import MetaTags from '@/components/SEO/MetaTags';

// Lazy load AdPlacement
const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Spark component for animation
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

const categoryConfig = {
  snowflake: { 
    name: 'Snowflake', 
    color: 'from-blue-500 to-cyan-500', 
    path: '/category/snowflake', 
    description: "Master Snowflake with comprehensive tutorials on data warehousing, analytics, and cloud data platform features." 
  },
  aws: { 
    name: 'AWS', 
    color: 'from-orange-500 to-red-500', 
    path: '/category/aws', 
    description: "Learn AWS data services: S3, Redshift, Glue, Lambda. Master cloud data engineering with Amazon Web Services." 
  },
  azure: { 
    name: 'Azure', 
    color: 'from-blue-600 to-indigo-600', 
    path: '/category/azure', 
    description: "Explore Azure data services from Data Factory to Synapse Analytics. Complete guide for data engineers." 
  },
  sql: { 
    name: 'SQL', 
    color: 'from-slate-400 to-gray-500', 
    path: '/category/sql', 
    description: "Master SQL with advanced queries, optimization techniques, and best practices for data transformation." 
  },
  airflow: { 
    name: 'Airflow', 
    color: 'from-purple-500 to-violet-500', 
    path: '/category/airflow', 
    description: "Apache Airflow tutorials for workflow orchestration. Build, schedule, and monitor data pipelines effectively." 
  },
  dbt: { 
    name: 'dbt', 
    color: 'from-pink-500 to-rose-500', 
    path: '/category/dbt', 
    description: "Data Build Tool (dbt) tutorials for modern data transformation and analytics engineering best practices." 
  },
  python: { 
    name: 'Python', 
    color: 'from-yellow-500 to-orange-500', 
    path: '/category/python', 
    description: "Python for data engineering with pandas, NumPy, and more. Master data processing with Python libraries." 
  },
  gcp: { 
    name: 'GCP', 
    color: 'from-green-500 to-blue-500', 
    path: '/category/gcp', 
    description: "Explore Google Cloud Platform services for data engineers, including BigQuery, Dataflow, and Dataproc."
  },
  // ✅ NEW
  databricks: {
    name: 'Databricks',
    color: 'from-red-500 to-orange-500',
    path: '/category/databricks',
    description: "Databricks lakehouse platform tutorials: Delta Lake, Apache Spark, Unity Catalog, and MLflow for data engineering."
  },
  // ✅ NEW
  salesforce: {
    name: 'Salesforce',
    color: 'from-blue-600 to-cyan-500',
    path: '/category/salesforce',
    description: "Salesforce data integration tutorials: CRM data, Apex, SOQL, MuleSoft, and Salesforce Data Cloud."
  }
};

const getCategoryIcon = (category, className = 'h-10 w-10') => {
  const lowerCategory = category.toLowerCase();
  const iconUrls = {
    snowflake: 'https://cdn.brandfetch.io/idJz-fGD_q/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    airflow: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/apacheairflow/apacheairflow-original.svg',
    dbt: 'https://docs.getdbt.com/img/dbt-logo.svg',
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    gcp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg',
    // ✅ NEW: Databricks
    databricks: 'https://cdn.brandfetch.io/idSUrLOWbH/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    // ✅ NEW: Salesforce  
    salesforce: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/salesforce/salesforce-original.svg'
  };
  
  const iconUrl = iconUrls[lowerCategory];

  // Special case for SQL to ensure visibility
  if (lowerCategory === 'sql') {
    return (
      <div className={`${className} bg-slate-200 rounded-full p-1.5 flex items-center justify-center`}>
        <img src={iconUrls.sql} alt="SQL logo" className="h-full w-full object-contain" />
      </div>
    );
  }
  
  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt={`${category} logo`} 
        className={`${className} object-contain`} 
        onError={(e) => { 
          e.target.style.display = 'none'; 
          e.target.parentNode.innerHTML = `<div class="${className} bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📁</div>`; 
        }} 
      />
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
};

const CategoryPage = () => {
  const { categoryName } = useParams();
  const lowerCategoryName = categoryName.toLowerCase();
  const currentCategory = categoryConfig[lowerCategoryName] || { 
    name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1), 
    description: `Discover articles and tutorials about ${categoryName}.` 
  };

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
  
  const MotionLink = motion(Link);

  return (
    <>
      <MetaTags 
        title={`${currentCategory.name} Tutorials`}
        description={currentCategory.description}
        keywords={`${lowerCategoryName}, data engineering, ${currentCategory.name} tutorials`}
        type="website"
      />
      
      <div className="pt-1 pb-8">
        <div className="container mx-auto px-6">
          {/* Back Button */}
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

          {/* Category Header */}
          <motion.div 
            key={`header-${categoryName}`} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 mb-6">
              {getCategoryIcon(categoryName, 'h-8 w-8 md:h-10 md:w-10')}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">
              <span className="gradient-text">{currentCategory.name} Tutorials & Articles</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {currentCategory.description}
            </p>
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
                <Folder className="h-4 w-4" />
                <span>Category: {currentCategory.name}</span>
              </div>
            </div>
          </motion.div>
          
          {/* Ad after header, before posts */}
          <Suspense fallback={null}>
            <AdPlacement position="category-top" format="auto" responsive={true} />
          </Suspense>
          
          {/* Posts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RecentPosts 
              category={lowerCategoryName} 
              showCategoryError={true} 
              initialLimit={9} 
              title={`All ${currentCategory.name} Articles`} 
              showLoadMore={true} 
              showViewToggle={true} 
            />
          </motion.div>

          {/* Ad after posts section */}
          <Suspense fallback={null}>
            <AdPlacement position="category-middle" format="auto" responsive={true} />
          </Suspense>

          {/* Explore Other Categories Section */}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(categoryConfig).map(([slug, config]) => {
                const isActive = slug === lowerCategoryName;
                return (
                  <MotionLink
                    key={slug}
                    to={config.path}
                    initial="rest"
                    whileHover="hover"
                    className={`relative p-4 rounded-xl text-center transition-all duration-300 overflow-hidden group ${
                      isActive
                        ? 'border-2 border-blue-400 shadow-lg shadow-blue-500/30'
                        : 'border border-gray-700 hover:border-blue-400/50'
                    }`}
                    aria-label={`View ${config.name} articles`}
                  >
                    {/* Spark emitters in corners */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        variants={sparkContainerVariants} 
                        className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-12 h-12`}
                      >
                        {sparks.map((spark, j) => <Spark key={j} {...spark} />)}
                      </motion.div>
                    ))}

                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="flex justify-center mb-2">
                        {getCategoryIcon(slug, 'h-8 w-8 md:h-10 md:w-10')}
                      </div>
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-gray-300'}`}>
                        {config.name}
                      </div>
                    </div>
                  </MotionLink>
                );
              })}
            </div>
            
            {/* View All Articles Button */}
            <div className="text-center mt-6">
              <Button 
                asChild 
                variant="outline" 
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to="/articles">View All Articles</Link>
              </Button>
            </div>
          </motion.div>

          {/* Ad at bottom of page */}
          <Suspense fallback={null}>
            <div className="mt-8">
              <AdPlacement position="category-bottom" format="auto" responsive={true} />
            </div>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;