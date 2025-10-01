// src/components/TechCategories.jsx - FINAL VERSION with Icon Glow
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, RefreshCw } from 'lucide-react';
import { useCategories } from '@/hooks/useWordPress';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Helper function for providing the production icons
const getCategoryIcon = (category, className = 'h-8 w-8') => {
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

const HolographicCard = ({ category }) => {
  const cardRef = useRef(null);
  const { name, description, color, path, posts } = category;

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [0, 1], [-15, 15]);

  const glareX = useTransform(mouseX, [0, 1], [20, 80]);
  const glareY = useTransform(mouseY, [0, 1], [20, 80]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    animate(mouseX, 0.5, { type: 'spring', stiffness: 300, damping: 20 });
    animate(mouseY, 0.5, { type: 'spring', stiffness: 300, damping: 20 });
  };

  return (
    <Link to={path} className="block h-full group" style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className="tech-card rounded-2xl p-8 relative overflow-hidden h-full min-h-[280px] flex flex-col transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/20"
      >
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(147, 197, 253, 0.35), transparent 40%)`,
          }}
        />
        <div style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }} className="flex flex-col h-full">
          {/* ✅ UPDATED: Added a matching shadow on hover for a glow effect */}
          <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${color} mb-6 self-start shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-shadow duration-300`}>
            {getCategoryIcon(name, 'h-8 w-8')}
          </div>
          <h3 className="text-xl font-bold mb-4 text-white" style={{ transform: 'translateZ(30px)' }}>
            {name}
          </h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow" style={{ transform: 'translateZ(20px)' }}>
            {description}
          </p>
          <div className="flex items-center justify-between mt-auto" style={{ transform: 'translateZ(10px)' }}>
            <span className="text-sm font-medium text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              {posts} articles
            </span>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-white/10">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const TechCategories = () => {
  const { categories: apiCategories, loading, refresh: refreshCategories } = useCategories();
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();

  const categoryConfig = [
    { name: 'AWS', description: 'Cloud data services, S3, Redshift, Glue, and more', color: 'from-orange-500 to-red-500', path: '/category/aws' },
    { name: 'Snowflake', description: 'Modern cloud data warehouse and analytics', color: 'from-blue-500 to-cyan-500', path: '/category/snowflake' },
    { name: 'Azure', description: 'Microsoft cloud data platform and services', color: 'from-blue-600 to-indigo-600', path: '/category/azure' },
    { name: 'SQL', description: 'Advanced queries, optimization, and best practices', color: 'from-green-500 to-emerald-500', path: '/category/sql' },
    { name: 'Airflow', description: 'Workflow orchestration and data pipeline automation', color: 'from-purple-500 to-violet-500', path: '/category/airflow' },
    { name: 'dbt', description: 'Data transformation and analytics engineering', color: 'from-pink-500 to-rose-500', path: '/category/dbt' },
    { name: 'Python', description: 'Data engineering with Python libraries and frameworks', color: 'from-yellow-500 to-orange-500', path: '/category/python' },
    { name: 'Analytics', description: 'Data visualization, BI tools, and reporting', color: 'from-teal-500 to-cyan-500', path: '/category/analytics' }
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
              <HolographicCard category={category} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechCategories;