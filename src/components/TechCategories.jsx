// src/components/TechCategories.jsx - FINAL VERSION with Transparent Cards & Sparks
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap,
  RefreshCw
} from 'lucide-react';
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
      dbt: 'https://images.seeklogo.com/logo-png/43/1/dbt-logo-png_seeklogo-431111.png',
      python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      gcp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg'
    };
    const iconUrl = iconUrls[lowerCategory];
    if (iconUrl) {
      return (<img src={iconUrl} alt={`${category} logo`} className={`${className} object-contain`} style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.4))' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<div class="${className} bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📁</div>`; }} />);
    }
    return (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>);
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
        className="tech-card rounded-2xl p-8 relative overflow-hidden h-full flex flex-col"
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
          {/* ✅ UPDATED: Small, distinct icon container at the top-left */}
          <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${color} mb-6 self-start shadow-lg`}>
            {getCategoryIcon(name, 'h-8 w-8')}
          </div>

          <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
            {name}
          </h3>

          <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
            {description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm font-medium text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              {posts} articles
            </span>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="h-5 w-5 text-blue-400" />
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
    { name: 'GCP', description: 'Google Cloud Platform services like BigQuery and Dataflow', color: 'from-green-500 to-blue-500', path: '/category/gcp' }
  ];

  const categories = categoryConfig.map(config => {
    const apiCategory = apiCategories.find(cat => cat.name === config.name);
    return { ...config, posts: apiCategory ? apiCategory.count : 0 };
  });

  return (
    <section ref={ref} className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent"></div>
      <div className="container mx-auto px-6 relative z-10">
        {hasIntersected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <h2 className="text-3xl md:text-4xl font-bold">Explore <span className="gradient-text">Technologies</span></h2>
              {process.env.NODE_ENV === 'development' && (<button onClick={refreshCategories} className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-colors" title="Refresh categories"><RefreshCw className="h-4 w-4 text-blue-400" /></button>)}
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">Deep dive into the tools and platforms that power modern data engineering</p>
          </motion.div>
        )}
        {loading && (<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div></div>)}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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