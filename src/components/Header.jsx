import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Database, ChevronDown, Home, Cloud, Wrench, Code, Tags, Info, Sparkles } from 'lucide-react';

// Helper component for the "Corner Burst" sparks animation
const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: { x: 0, y: 0, scale: 0, opacity: 0 },
    hover: {
      x: x,
      y: y,
      scale: 1,
      opacity: [0, 1, 0.5, 0],
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] },
    },
  };
  return (
    <motion.div
      variants={variants}
      className="absolute top-0 left-0 h-[3px] w-[3px] rounded-full"
      style={{ backgroundColor: color, rotate }}
    />
  );
};

// Category icon provider with original icons
const getCategoryIcon = (category, className = 'h-8 w-8') => {
  const lowerCategory = category.toLowerCase();
  const iconUrls = {
    aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
    gcp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg',
    snowflake: 'https://cdn.brandfetch.io/idJz-fGD_q/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    airflow: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/apacheairflow/apacheairflow-original.svg',
    dbt: 'https://docs.getdbt.com/img/dbt-logo.svg',
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    // ✅ NEW: Databricks
    databricks: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png',
    // ✅ NEW: Salesforce  
    salesforce: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/salesforce/salesforce-original.svg'
  };
  
  const iconUrl = iconUrls[lowerCategory];
  
  // Special case for SQL to ensure visibility
  if (lowerCategory === 'sql') {
    return (
      <div className={`${className} bg-slate-200 rounded-full p-1.5 flex items-center justify-center`}>
        <img 
          src={iconUrls.sql} 
          alt={`${category} logo`} 
          className="h-full w-full object-contain" 
        />
      </div>
    );
  }
  
  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt={`${category} logo`} 
        className={`${className} object-contain`}
        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.4))' }}
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

const Header = () => {
  const [isMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentPath, setCurrentPath] = useState('/');

  // Track current path for active states
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Check if a category group is active
  const isCategoryActive = (categoryKey) => {
    const path = currentPath.toLowerCase();
    
    if (categoryKey === 'platforms') {
      return path.includes('/category/aws') || 
             path.includes('/category/azure') || 
             path.includes('/category/gcp') || 
             path.includes('/category/snowflake');
    }
    
    if (categoryKey === 'tools') {
      return path.includes('/category/airflow') || 
             path.includes('/category/dbt');
    }
    
    if (categoryKey === 'languages') {
      return path.includes('/category/python') || 
             path.includes('/category/sql');
    }
    
    return false;
  };

  const isHomeActive = currentPath === '/';
  const isTagsActive = currentPath.includes('/tag');
  const isAboutActive = currentPath.includes('/about');

  // Enhanced category structure
  const categories = {
  platforms: {
    title: 'Cloud & Data Platforms',
    icon: Cloud,
    items: [
      { name: 'AWS', path: '/category/aws', color: 'from-orange-500 to-red-500', desc: 'Amazon Web Services' },
      { name: 'Azure', path: '/category/azure', color: 'from-blue-500 to-indigo-600', desc: 'Microsoft Azure' },
      { name: 'GCP', path: '/category/gcp', color: 'from-green-500 to-blue-500', desc: 'Google Cloud' },
      { name: 'Snowflake', path: '/category/snowflake', color: 'from-cyan-400 to-blue-500', desc: 'Cloud Data Warehouse' },
      // ✅ NEW
      { name: 'Databricks', path: '/category/databricks', color: 'from-red-500 to-orange-500', desc: 'Lakehouse Platform' },
      { name: 'Salesforce', path: '/category/salesforce', color: 'from-blue-600 to-cyan-500', desc: 'CRM & Data Cloud' }
    ]
  },
  tools: {
    title: 'Orchestration & Transform',
    icon: Wrench,
    items: [
      { name: 'Airflow', path: '/category/airflow', color: 'from-teal-500 to-cyan-500', desc: 'Workflow Orchestration' },
      { name: 'dbt', path: '/category/dbt', color: 'from-orange-500 to-red-500', desc: 'Data Transformation' }
    ]
  },
  languages: {
    title: 'Languages',
    icon: Code,
    items: [
      { name: 'Python', path: '/category/python', color: 'from-yellow-400 to-orange-500', desc: 'Data Processing' },
      { name: 'SQL', path: '/category/sql', color: 'from-blue-400 to-indigo-500', desc: 'Query Language' }
    ]
  }
};

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

  const MegaMenu = ({ category, categoryKey }) => {
    // Generate sparks for animation
    const sparks = useMemo(() => 
      Array.from({ length: 12 }).map(() => ({
        x: Math.random() * 60 - 30,
        y: Math.random() * 60 - 30,
        rotate: Math.random() * 360,
        color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)],
      })), 
    []);

    const sparkContainerVariants = {
      rest: {},
      hover: { transition: { staggerChildren: 0.04 } },
    };

    // Smart CTA text based on category
    const getCtaText = () => {
      if (categoryKey === 'platforms') {
        return 'View all Cloud & Platform articles';
      }
      if (categoryKey === 'tools') {
        return 'View all Orchestration & Transform articles';
      }
      if (categoryKey === 'languages') {
        return 'View all Language articles';
      }
      return 'View all articles';
    };

    // Build filtered URL with categories
    const getCtaUrl = () => {
      const categoryNames = category.items.map(item => item.name.toLowerCase()).join(',');
      // For now, just go to /articles - you can enhance this with query params later
      return '/articles';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute left-0 top-full mt-2 w-[600px] bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 z-[99999]"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.1)'
        }}
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <category.icon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{category.title}</h3>
            <p className="text-xs text-gray-400">Click to explore</p>
          </div>
        </div>

        {/* Grid Layout with Spark Animation */}
        <div className="grid grid-cols-2 gap-3">
          {category.items.map((item, idx) => (
            <motion.a
              key={item.name}
              href={item.path}
              initial="rest"
              whileHover="hover"
              className="group relative p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 overflow-hidden"
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

              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10 flex items-start gap-3">
                {/* Original Category Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getCategoryIcon(item.name, 'h-8 w-8')}
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                    {item.name}
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
            </motion.a>
          ))}
        </div>

        {/* Smart Footer CTA */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <a 
            href={getCtaUrl()}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-2 group"
          >
            {getCtaText()}
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </a>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 w-full z-[9999]"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 sm:space-x-3 z-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <Database className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
              </div>
            </motion.div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DataEngineer Hub
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-6 lg:space-x-8">
            {/* Home */}
            <motion.div whileHover={{ y: -2 }}>
              <a 
                href="/" 
                className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${
                  isHomeActive 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isHomeActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            </motion.div>

            {/* Mega Menus */}
            {Object.entries(categories).map(([key, category]) => {
              const isActive = isCategoryActive(key);
              return (
                <div key={key} className="relative group">
                  <motion.button
                    whileHover={{ y: -2 }}
                    onMouseEnter={() => setOpenDropdown(key)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className={`flex items-center gap-1.5 font-medium text-base transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-400' 
                        : 'text-gray-300 hover:text-blue-400'
                    }`}
                    style={isActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.title.split(' ')[0]}
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  </motion.button>

                  <AnimatePresence>
                    {openDropdown === key && (
                      <div onMouseEnter={() => setOpenDropdown(key)} onMouseLeave={() => setOpenDropdown(null)}>
                        <MegaMenu category={category} categoryKey={key} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Tags */}
            <motion.div whileHover={{ y: -2 }}>
              <a 
                href="/tag" 
                className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${
                  isTagsActive 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isTagsActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Tags className="w-4 h-4" />
                Tags
              </a>
            </motion.div>

            {/* About */}
            <motion.div whileHover={{ y: -2 }}>
              <a 
                href="/about" 
                className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${
                  isAboutActive 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isAboutActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Info className="w-4 h-4" />
                About
              </a>
            </motion.div>

            {/* Subscribe Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="/newsletter"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 lg:px-8 py-2.5 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
              >
                Subscribe
              </a>
            </motion.div>
          </div>

          {/* Mobile Menu Button - FIXED WITH ACCESSIBILITY */}
          <div className="xl:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation - FIXED WITH ID */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden mt-4 pb-4 border-t border-slate-700/50 pt-4 bg-slate-900/95 backdrop-blur-xl rounded-xl px-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-3">
                <a href="/" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Home className="w-5 h-5" />
                  Home
                </a>

                {/* Mobile Dropdowns */}
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                      className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-3 pl-3 rounded-lg hover:bg-slate-800/50 min-h-[48px]"
                    >
                      <span className="flex items-center gap-2">
                        <category.icon className="w-5 h-5" />
                        {category.title}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {openDropdown === key && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2"
                        >
                          {category.items.map(item => (
                            <a
                              key={item.name}
                              href={item.path}
                              className="block text-gray-300 hover:text-white py-3 pl-3 rounded hover:bg-slate-700/50 transition-colors min-h-[48px] flex items-center"
                            >
                              {item.name}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <a href="/tag" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Tags className="w-5 h-5" />
                  Tags
                </a>
                <a href="/about" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Info className="w-5 h-5" />
                  About
                </a>

                <a
                  href="/newsletter"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4 py-3 text-base font-bold shadow-lg rounded-full text-center min-h-[48px] flex items-center justify-center"
                >
                  Subscribe
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Header;