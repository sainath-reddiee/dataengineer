// src/components/Header.jsx - FIXED VERSION (Ghost Hover Issue Resolved)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Database, ChevronDown, Home, Cloud, Wrench, Code, Tags, Info, Sparkles, ChefHat, FileText, FileSpreadsheet, ClipboardList, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useResourceTypes } from '@/hooks/useCertifications';

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
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg'
  };
  
  const iconUrl = iconUrls[lowerCategory];
  
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

const getResourceIcon = (name, className = 'h-8 w-8 text-yellow-400') => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('sheet')) return <FileSpreadsheet className={className} />;
  if (lowerName.includes('guide')) return <ClipboardList className={className} />;
  if (lowerName.includes('question')) return <HelpCircle className={className} />;
  if (lowerName.includes('tip')) return <Sparkles className={className} />;
  return <FileText className={className} />;
};

const Header = () => {
  const [isMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;
  
  // FIX: Add refs to track hover state properly
  const dropdownTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);

  const { resourceTypes } = useResourceTypes();

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
    
    if (categoryKey === 'certifications') {
        return path.includes('/certifications');
    }

    return false;
  };

  const isHomeActive = currentPath === '/';
  const isTagsActive = currentPath.includes('/tag');
  const isAboutActive = currentPath.includes('/about');

  // FIX: Better hover handlers with timeout
  const handleMouseEnter = (key) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    isHoveringRef.current = true;
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    dropdownTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setOpenDropdown(null);
      }
    }, 150); // Small delay to prevent flickering
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const categories = {
    platforms: {
      title: 'Cloud & Data Platforms',
      icon: Cloud,
      items: [
        { name: 'AWS', path: '/category/aws', color: 'from-orange-500 to-red-500', desc: 'Amazon Web Services' },
        { name: 'Azure', path: '/category/azure', color: 'from-blue-500 to-indigo-600', desc: 'Microsoft Azure' },
        { name: 'GCP', path: '/category/gcp', color: 'from-green-500 to-blue-500', desc: 'Google Cloud' },
        { name: 'Snowflake', path: '/category/snowflake', color: 'from-cyan-400 to-blue-500', desc: 'Cloud Data Warehouse' }
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
  
  const certificationsMenu = {
    title: 'Certification Hub',
    icon: Sparkles,
    items: resourceTypes.map(rt => ({
        name: rt.name,
        path: `/certifications/resource/${rt.slug}`,
        color: 'from-yellow-500 to-amber-500',
        desc: rt.description || `${rt.count}+ resources available.`,
        isResourceType: true,
    })),
  };

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
        setOpenDropdown(null); // Close dropdowns when scrolling down
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

  const MegaMenu = ({ category, categoryKey }) => {
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

    const getCtaText = () => {
      if (categoryKey === 'certifications') return 'View All Certifications';
      return 'View all articles';
    };

    const getCtaUrl = () => {
      if (categoryKey === 'certifications') return '/certifications';
      return '/articles';
    }

    const hasItems = category.items && category.items.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => handleMouseEnter(categoryKey)}
        onMouseLeave={handleMouseLeave}
        className="absolute left-0 top-full mt-2 w-[550px] bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 z-[99999]"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.1)' }}
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <category.icon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{category.title}</h3>
            <p className="text-xs text-gray-400">Click to explore</p>
          </div>
        </div>

        {hasItems ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item, idx) => (
                <motion.a
                  key={item.name}
                  href={item.path}
                  initial="rest"
                  whileHover="hover"
                  className="group relative p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 overflow-hidden"
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
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {item.iconOverride ? item.iconOverride : 
                       item.isResourceType ? getResourceIcon(item.name) : 
                       getCategoryIcon(item.name, 'h-8 w-8')}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
                </motion.a>
              ))}
            </div>
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
          </>
        ) : (
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <p className="font-semibold text-lg text-gray-300">Still Cooking!</p>
            <p className="text-sm text-gray-400">No resources available yet.</p>
          </div>
        )}
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
            <a href="/" className="flex items-center space-x-2 sm:space-x-3 z-10 flex-shrink-0 mr-6">
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
            <div className="hidden xl:flex items-center justify-start flex-grow">
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <motion.div whileHover={{ y: -2 }}>
                      <Link 
                        to="/" 
                        className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${isHomeActive ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`} 
                        style={isHomeActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </Link>
                    </motion.div>
                    
                    <div 
                      className="relative"
                      onMouseEnter={() => handleMouseEnter('certifications')}
                      onMouseLeave={handleMouseLeave}
                    >
                        <motion.button
                            whileHover={{ y: -2 }}
                            className={`flex items-center gap-1.5 font-medium text-base transition-all duration-200 ${isCategoryActive('certifications') ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                            style={isCategoryActive('certifications') ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                        >
                            <Sparkles className="w-4 h-4" />
                            Certifications
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === 'certifications' ? 'rotate-180' : ''}`} />
                        </motion.button>
                        <AnimatePresence>
                            {openDropdown === 'certifications' && (
                                <MegaMenu category={certificationsMenu} categoryKey="certifications" />
                            )}
                        </AnimatePresence>
                    </div>

                    {Object.entries(categories).map(([key, category]) => {
                      const isActive = isCategoryActive(key);
                      return (
                        <div 
                          key={key} 
                          className="relative"
                          onMouseEnter={() => handleMouseEnter(key)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <motion.button
                              whileHover={{ y: -2 }}
                              className={`flex items-center gap-1.5 font-medium text-base transition-all duration-200 ${isActive ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                              style={isActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                          >
                              <category.icon className="w-4 h-4" />
                              {category.title.split(' ')[0]}
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === key ? 'rotate-180' : ''}`} />
                          </motion.button>
                          <AnimatePresence>
                              {openDropdown === key && (
                                <MegaMenu category={category} categoryKey={key} />
                              )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    
                    <motion.div whileHover={{ y: -2 }}>
                      <Link 
                        to="/tag" 
                        className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${isTagsActive ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`} 
                        style={isTagsActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                      >
                        <Tags className="w-4 h-4" />
                        Tags
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }}>
                      <Link 
                        to="/about" 
                        className={`font-semibold text-base transition-all duration-200 flex items-center gap-2 ${isAboutActive ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`} 
                        style={isAboutActive ? { textShadow: '0 0 5px #60a5fa' } : undefined}
                      >
                        <Info className="w-4 h-4" />
                        About
                      </Link>
                    </motion.div>
                </div>
            </div>

          {/* Mobile Menu Button */}
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
                <Link to="/" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                
                <div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'certifications' ? null : 'certifications')}
                    className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-3 pl-3 rounded-lg hover:bg-slate-800/50 min-h-[48px]"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Certifications
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'certifications' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openDropdown === 'certifications' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2"
                      >
                        {certificationsMenu.items.map(item => (
                          <Link key={item.name} to={item.path} className="block text-gray-300 hover:text-white py-3 pl-3 rounded hover:bg-slate-700/50 transition-colors min-h-[48px] flex items-center">
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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
                          {category.items.length > 0 ? category.items.map(item => (
                            <Link
                              key={item.name}
                              to={item.path}
                              className="block text-gray-300 hover:text-white py-3 pl-3 rounded hover:bg-slate-700/50 transition-colors min-h-[48px] flex items-center"
                            >
                              {item.name}
                            </Link>
                          )) : (
                            <div className="text-gray-400 text-sm p-3 text-center">
                              <ChefHat className="h-6 w-6 mx-auto mb-2" />
                              Content coming soon!
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <Link to="/tag" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Tags className="w-5 h-5" />
                  Tags
                </Link>
                <Link to="/about" className="text-white hover:text-blue-400 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px]">
                  <Info className="w-5 h-5" />
                  About
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Header;