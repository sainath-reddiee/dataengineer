// src/components/TechCategories.jsx - FINAL VERSION WITH MOBILE FIXES
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, RefreshCw } from 'lucide-react';
import { useCategories } from '@/hooks/useWordPress';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Icon provider with drop-shadow for visibility
const getCategoryIcon = (category, className = 'h-8 w-8') => {
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
    databricks: 'https://cdn.brandfetch.io/idSUrLOWbH/idEHbzBDZC.svg?c=1dxbfHSJFAPEGdCLU4o5B',
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
  
  // Special handling for logos that need light backgrounds
  const needsLightBg = ['databricks', 'aws', 'dbt', 'salesforce'].includes(lowerCategory);
  
  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt={`${category} logo`} 
        className={`${className} object-contain`}
        style={{ 
          maxWidth: '100%',
          maxHeight: '100%',
          // Add slight drop shadow for better visibility on light backgrounds
          filter: needsLightBg ? 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15))' : 'none'
        }}
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

const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: { x: 0, y: 0, scale: 0, opacity: 0 },
    hover: { x, y, scale: 1, opacity: [0, 1, 0.5, 0], transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] }, },
  };
  return (<motion.div variants={variants} className="absolute top-1/2 left-1/2 h-[3px] w-[3px] rounded-full" style={{ backgroundColor: color, rotate }} />);
};

// Card component with the correct transparent layout and sparks animation
const SparkleCard = ({ category }) => {
  const { name, description, color, path, posts } = category;

  const sparkContainerVariants = {
    rest: {},
    hover: { transition: { staggerChildren: 0.04 } },
  };

  const sparks = useMemo(() => Array.from({ length: 12 }).map(() => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * 60 - 30,
    rotate: Math.random() * 360,
    color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)],
  })), []);

  const MotionLink = motion(Link);

  return (
    <MotionLink to={path} className="block h-full group" initial="rest" whileHover="hover">
      <motion.div
        variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="tech-card rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden h-full flex flex-col min-h-[200px] sm:min-h-[280px]"
      >
        {/* Spark emitters in each corner */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            variants={sparkContainerVariants}
            className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-12 h-12`}
          >
            {sparks.map((spark, j) => <Spark key={j} {...spark} />)}
          </motion.div>
        ))}

        <div className="flex flex-col h-full z-10">
          {/* Small, distinct icon container at the top-left with better visibility */}
          <div className={`inline-flex p-2 sm:p-3 md:p-4 rounded-xl ${
            // Use white/light background for better logo visibility
            name === 'Databricks' ? 'bg-white/95' :
            name === 'AWS' ? 'bg-white/95' :
            name === 'dbt' ? 'bg-white/95' :
            name === 'Salesforce' ? 'bg-white/95' :
            `bg-gradient-to-br ${color}`
          } mb-3 sm:mb-4 md:mb-6 self-start shadow-lg`}>
            {getCategoryIcon(name, 'h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8')}
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-white group-hover:text-blue-400 transition-colors">
            {name}
          </h3>

          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 md:mb-6 leading-relaxed flex-grow line-clamp-3">
            {description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-300 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm border border-white/10">
              {posts} articles
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </motion.div>
    </MotionLink>
  );
};


const TechCategories = () => {
  const { categories: apiCategories, loading, refresh: refreshCategories } = useCategories();
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();

  const categoryConfig = [
  { name: 'AWS', description: 'Cloud data services, S3, Redshift, Glue, and more', color: 'from-orange-500 to-red-500', path: '/category/aws' },
  { name: 'Snowflake', description: 'Modern cloud data warehouse and analytics', color: 'from-blue-500 to-cyan-500', path: '/category/snowflake' },
  { name: 'Azure', description: 'Microsoft cloud data platform and services', color: 'from-blue-600 to-indigo-600', path: '/category/azure' },
  { name: 'SQL', description: 'Advanced queries, optimization, and best practices', color: 'from-sky-500 to-cyan-400', path: '/category/sql' },
  { name: 'Airflow', description: 'Workflow orchestration and data pipeline automation', color: 'from-purple-500 to-violet-500', path: '/category/airflow' },
  { name: 'dbt', description: 'Data transformation and analytics engineering', color: 'from-pink-500 to-rose-500', path: '/category/dbt' },
  { name: 'Python', description: 'Data engineering with Python libraries and frameworks', color: 'from-yellow-500 to-orange-500', path: '/category/python' },
  { name: 'GCP', description: 'Google Cloud Platform services like BigQuery and Dataflow', color: 'from-green-500 to-blue-500', path: '/category/gcp' },
  // ✅ NEW
  { name: 'Databricks', description: 'Unified analytics and lakehouse platform for big data', color: 'from-red-500 to-orange-500', path: '/category/databricks' },
  { name: 'Salesforce', description: 'CRM data integration and Salesforce Data Cloud', color: 'from-blue-600 to-cyan-500', path: '/category/salesforce' }
];

  const categories = categoryConfig.map(config => {
    const apiCategory = apiCategories.find(cat => cat.name === config.name);
    return { ...config, posts: apiCategory ? apiCategory.count : 0 };
  });

  return (
    <section ref={ref} className="py-12 sm:py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent"></div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {hasIntersected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6 flex-wrap">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Explore <span className="gradient-text">Technologies</span></h2>
              {process.env.NODE_ENV === 'development' && (<button onClick={refreshCategories} className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-colors" title="Refresh categories"><RefreshCw className="h-4 w-4 text-blue-400" /></button>)}
            </div>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">Deep dive into the tools and platforms that power modern data engineering</p>
          </motion.div>
        )}
        {loading && (<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div></div>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {hasIntersected && categories.map((category, index) => (
            <motion.div key={category.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
              <SparkleCard category={category} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechCategories;