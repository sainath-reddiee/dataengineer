import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Database, ChevronDown, Home, Wrench, Info, Search, BookOpen, GitCompareArrows, FileText, GraduationCap, Newspaper, Target } from 'lucide-react';
import SearchModal from '@/components/SearchModal';

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
    databricks: 'https://cdn.brandfetch.io/idSUrLOWbH/idEHbzBDZC.svg?c=1dxbfHSJFAPEGdCLU4o5B',
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
          width={24}
          height={24}
          loading="lazy"
        />
      </div>
    );
  }
  
  // Emoji-based icons for topic categories (no brand logo)
  if (lowerCategory === 'developer productivity') {
    return (
      <div className={`${className} bg-emerald-500/20 rounded-lg flex items-center justify-center text-lg`}>⚡</div>
    );
  }
  if (iconUrl) {
    return (
      <span className={`${className} relative inline-flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full" fill="currentColor">
          <path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <img 
          src={iconUrl} 
          alt={`${category} logo`} 
          className="relative w-full h-full object-contain"
          width={24}
          height={24}
          loading="lazy"
          style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.4))' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </span>
    );
  }
  
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
};

const Header = ({ topOffset = 0 }) => {
  const [isMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = React.useRef(0);
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownTimeout = React.useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    };
  }, []);

  const openDropdownWithCancel = (key) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = null;
    // Hover-intent: only open after a brief dwell so fast cross-overs don't trigger
    dropdownTimeout.current = setTimeout(() => {
      dropdownTimeout.current = null;
      setOpenDropdown(key);
    }, 120);
  };

  const closeDropdownWithDelay = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      dropdownTimeout.current = null;
      setOpenDropdown(null);
    }, 120);
  };

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if a category group is active
  const isCategoryActive = (categoryKey) => {
    const path = currentPath.toLowerCase();

    if (categoryKey === 'articles') {
      return path.startsWith('/category/');
    }

    if (categoryKey === 'resources') {
      return path.startsWith('/glossary') ||
             path.startsWith('/compare') ||
             path.startsWith('/news');
    }

    if (categoryKey === 'study') {
      return path.startsWith('/interview-prep') ||
             path.startsWith('/practice') ||
             path.startsWith('/cheatsheet');
    }

    return false;
  };

  const isHomeActive = currentPath === '/';
  const isAboutActive = currentPath.includes('/about');
  const isToolsActive = currentPath.startsWith('/tools');
  // Grouped category structure (3 mega-menu groups)
  const categories = {
  articles: {
    title: 'Articles',
    shortTitle: 'Articles',
    icon: BookOpen,
    sections: [
      {
        title: 'Cloud & Data Platforms',
        items: [
          { name: 'AWS', path: '/category/aws', color: 'from-orange-500 to-red-500', desc: 'Amazon Web Services' },
          { name: 'Azure', path: '/category/azure', color: 'from-blue-500 to-indigo-600', desc: 'Microsoft Azure' },
          { name: 'GCP', path: '/category/gcp', color: 'from-green-500 to-blue-500', desc: 'Google Cloud' },
          { name: 'Snowflake', path: '/category/snowflake', color: 'from-cyan-400 to-blue-500', desc: 'Cloud Data Warehouse' },
          { name: 'Databricks', path: '/category/databricks', color: 'from-red-500 to-orange-500', desc: 'Lakehouse Platform' },
          { name: 'Salesforce', path: '/category/salesforce', color: 'from-blue-600 to-cyan-500', desc: 'CRM & Data Cloud' }
        ]
      },
      {
        title: 'Languages',
        items: [
          { name: 'Python', path: '/category/python', color: 'from-yellow-400 to-orange-500', desc: 'Data Processing' },
          { name: 'SQL', path: '/category/sql', color: 'from-blue-400 to-indigo-500', desc: 'Query Language' }
        ]
      },
      {
        title: 'Orchestration & Transform',
        items: [
          { name: 'Airflow', path: '/category/airflow', color: 'from-teal-500 to-cyan-500', desc: 'Workflow Orchestration' },
          { name: 'dbt', path: '/category/dbt', color: 'from-orange-500 to-red-500', desc: 'Data Transformation' }
        ]
      },
      {
        title: 'Developer Productivity',
        items: [
          { name: 'Developer Productivity', path: '/category/developer-productivity', color: 'from-emerald-500 to-teal-500', desc: 'AI Tools & Workflows' }
        ]
      }
    ]
  },
  resources: {
    title: 'Resources',
    shortTitle: 'Resources',
    icon: FileText,
    items: [
      { name: 'Glossary', path: '/glossary', color: 'from-purple-500 to-pink-500', desc: 'Data Engineering Terms', lucide: BookOpen },
      { name: 'Comparisons', path: '/compare', color: 'from-amber-500 to-orange-500', desc: 'Tool & Tech Face-offs', lucide: GitCompareArrows },
      { name: 'News', path: '/news', color: 'from-blue-500 to-cyan-500', desc: 'Latest Industry Updates', lucide: Newspaper }
    ]
  },
  study: {
    title: 'Study',
    shortTitle: 'Study',
    icon: GraduationCap,
    items: [
      { name: 'Interview Prep', path: '/interview-prep', color: 'from-indigo-500 to-purple-500', desc: 'Q&A + Mock Sessions', lucide: GraduationCap },
      { name: 'Practice Tests', path: '/practice', color: 'from-pink-500 to-rose-500', desc: 'SnowPro & Databricks Quizzes', lucide: Target },
      { name: 'Cheat Sheets', path: '/cheatsheets', color: 'from-green-500 to-emerald-500', desc: 'Quick Reference Guides', lucide: FileText }
    ]
  },
};

  // 🔥 FIX 1: Close dropdown on scroll with passive listener
  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
        // 🔥 CRITICAL: Close any open dropdown when scrolling down
        setOpenDropdown(null);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => window.removeEventListener('scroll', controlHeader);
  }, []);

  // 🔥 FIX 2: Close dropdown on click outside (e.g., clicking article content)
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking inside the header or its dropdowns
      const header = document.querySelector('header');
      if (header && !header.contains(e.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside, { passive: true });
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Close dropdown AND mobile menu on route change (e.g., clicking a link inside the menu)
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
  }, [currentPath]);

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
      if (categoryKey === 'articles') {
        return 'Explore all articles';
      }
      if (categoryKey === 'resources') {
        return 'Browse all resources';
      }
      if (categoryKey === 'study') {
        return 'Start studying now';
      }
      return 'View all articles';
    };

    // Build filtered URL with categories
    const getCtaUrl = () => {
      if (categoryKey === 'articles') return '/articles';
      if (categoryKey === 'resources') return '/articles';
      if (categoryKey === 'study') return '/practice';
      return '/articles';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        onMouseEnter={() => openDropdownWithCancel(categoryKey)}
        onMouseLeave={closeDropdownWithDelay}
        className={`fixed right-4 w-[640px] max-w-[calc(100vw-2rem)] bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 z-[99999]`}
        style={{ 
          top: `calc(${topOffset}px + 4.5rem)`,
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

        {/* Item renderer (shared between flat & sectioned layouts) */}
        {(() => {
          const renderItem = (item) => {
            const LucideIcon = item.lucide;
            return (
              <motion.div
                key={item.name}
                initial="rest"
                whileHover="hover"
                className="group relative"
              >
                <Link
                  to={item.path}
                  className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 overflow-hidden relative"
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
                    <div className="flex-shrink-0 mt-1">
                      {LucideIcon ? (
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-20`}>
                          <LucideIcon className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        getCategoryIcon(item.name, 'h-8 w-8')
                      )}
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
                </Link>
              </motion.div>
            );
          };

          // Sectioned layout (for Learn group)
          if (Array.isArray(category.sections)) {
            return (
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                {category.sections.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300/80 mb-2 pl-1">
                      {section.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {section.items.map(renderItem)}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          // Flat layout (for Resources / Prep)
          return (
            <div className="grid grid-cols-2 gap-3">
              {category.items.map(renderItem)}
            </div>
          );
        })()}

        {/* Smart Footer CTA */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <Link 
            to={getCtaUrl()}
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
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed w-full z-[9999]"
      style={{
        top: topOffset,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'auto'
      }}
    >
      <nav className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1.5 lg:space-x-2 2xl:space-x-3 z-10 min-w-0 shrink">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <Database className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400 shrink-0" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
              </div>
            </motion.div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
              DataEngineer Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 2xl:gap-4 flex-nowrap shrink-0">
            {/* Home */}
            <motion.div whileHover={{ y: -2 }}>
              <Link 
                to="/" 
                className={`whitespace-nowrap font-semibold text-xs 2xl:text-base transition-all duration-200 flex items-center gap-2 px-1.5 2xl:px-0 ${
                  isHomeActive 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isHomeActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Home className="w-4 h-4 hidden 2xl:inline-block" />
                Home
              </Link>
            </motion.div>

            {/* Mega Menus */}
            {Object.entries(categories).map(([key, category]) => {
              const isActive = isCategoryActive(key);
              return (
                <div key={key} className="relative">
                  <motion.button
                    whileHover={{ y: -2 }}
                    onMouseEnter={() => {
                      openDropdownWithCancel(key);
                      if (key === 'study') {
                        import('@/pages/PracticeHubPage');
                      }
                    }}
                    onMouseLeave={closeDropdownWithDelay}
                    className={`whitespace-nowrap flex items-center gap-1 2xl:gap-1.5 font-medium text-xs 2xl:text-base px-1.5 2xl:px-0 transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-400' 
                        : 'text-gray-300 hover:text-blue-400'
                    }`}
                    style={isActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                  >
                    <category.icon className="w-4 h-4 hidden 2xl:inline-block" />
                    <span className="2xl:hidden">{category.shortTitle}</span>
                    <span className="hidden 2xl:inline">{category.title.split(' ')[0]}</span>
                    <ChevronDown className={`w-3 h-3 2xl:w-4 2xl:h-4 transition-transform duration-300 ${openDropdown === key ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {openDropdown === key && (
                      <div
                        onMouseEnter={() => openDropdownWithCancel(key)}
                        onMouseLeave={closeDropdownWithDelay}
                        className={`absolute top-full left-0 right-0 h-3`}
                      >
                        <MegaMenu category={category} categoryKey={key} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Tools */}
            <motion.div whileHover={{ y: -2 }}>
              <Link
                to="/tools"
                onMouseEnter={() => { import('@/pages/ToolsHubPage'); }}
                onFocus={() => { import('@/pages/ToolsHubPage'); }}
                className={`whitespace-nowrap font-semibold text-xs 2xl:text-base transition-all duration-200 flex items-center gap-2 px-1.5 2xl:px-0 ${
                  isToolsActive
                    ? 'text-blue-400'
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isToolsActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Wrench className="w-4 h-4 hidden 2xl:inline-block" />
                Tools
              </Link>
            </motion.div>
            {/* About */}
            <motion.div whileHover={{ y: -2 }}>
              <Link 
                to="/about" 
                className={`whitespace-nowrap font-semibold text-xs 2xl:text-base transition-all duration-200 flex items-center gap-2 px-1.5 2xl:px-0 ${
                  isAboutActive 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-blue-400'
                }`}
                style={isAboutActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
              >
                <Info className="w-4 h-4 hidden 2xl:inline-block" />
                About
              </Link>
            </motion.div>

            {/* Search Button */}
            <motion.div whileHover={{ y: -2 }}>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 text-gray-300 hover:text-blue-400 transition-all duration-200 font-medium text-xs 2xl:text-base px-1.5 2xl:px-0"
                title="Search (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden 2xl:inline text-sm text-gray-400 bg-slate-800/60 border border-slate-700/50 rounded-md px-2 py-0.5">
                  Ctrl+K
                </span>
              </button>
            </motion.div>

            {/* Explore Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/articles"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-3 2xl:px-8 py-1.5 2xl:py-2.5 rounded-full font-bold text-xs 2xl:text-base shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
              >
                Explore
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button - FIXED WITH ACCESSIBILITY */}
          <div className="lg:hidden">
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
              className="lg:hidden mt-4 pb-4 border-t border-slate-700/50 pt-4 bg-slate-900/95 backdrop-blur-xl rounded-xl px-4 shadow-2xl overflow-y-auto overscroll-contain"
              style={{ maxHeight: `calc(100vh - ${topOffset}px - 5rem)` }}
            >
              <div className="flex flex-col space-y-3">
                <Link to="/" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]" onClick={() => setMobileMenuOpen(false)}>
                  <Home className="w-5 h-5" />
                  Home
                </Link>

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
                          {Array.isArray(category.sections) ? (
                            category.sections.map((section) => (
                              <div key={section.title} className="mb-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70 px-3 pt-2 pb-1">
                                  {section.title}
                                </div>
                                {section.items.map(item => (
                                  <Link
                                    key={item.name}
                                    to={item.path}
                                    className="block text-gray-300 hover:text-white py-3 pl-3 rounded hover:bg-slate-700/50 transition-colors min-h-[48px] flex items-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            ))
                          ) : (
                            category.items.map(item => (
                              <Link
                                key={item.name}
                                to={item.path}
                                className="block text-gray-300 hover:text-white py-3 pl-3 rounded hover:bg-slate-700/50 transition-colors min-h-[48px] flex items-center"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <Link to="/tools" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]" onClick={() => setMobileMenuOpen(false)}>
                  <Wrench className="w-5 h-5" />
                  Tools
                </Link>
                <Link to="/about" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]" onClick={() => setMobileMenuOpen(false)}>
                  <Info className="w-5 h-5" />
                  About
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); setIsSearchOpen(true); }}
                  className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px] w-full text-left"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
                <Link
                  to="/articles"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4 py-3 text-base font-bold shadow-lg rounded-full text-center min-h-[48px] flex items-center justify-center"
                 onClick={() => setMobileMenuOpen(false)}>
                  Explore Articles
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.header>
  );
};

export default Header;
