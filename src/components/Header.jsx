import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Database, ChevronDown, Home, Cloud, Wrench, Code, Tags, Info, Sparkles } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Enhanced category structure
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

  const MegaMenu = ({ category }) => (
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

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {category.items.map((item, idx) => (
          <motion.a
            key={item.name}
            href={item.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300"
          >
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {item.name}
                </span>
                <Sparkles className="h-4 w-4 text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                {item.desc}
              </p>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 rounded-xl" />
          </motion.a>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
        <a 
          href="/articles" 
          className="text-sm text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-2 group"
        >
          View all articles
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
      <nav className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 z-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <Database className="h-9 w-9 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
              </div>
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DataEngineer Hub
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-8">
            {/* Home */}
            <motion.div whileHover={{ y: -2 }}>
              <a href="/" className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </a>
            </motion.div>

            {/* Mega Menus */}
            {Object.entries(categories).map(([key, category]) => (
              <div key={key} className="relative group">
                <motion.button
                  whileHover={{ y: -2 }}
                  onMouseEnter={() => setOpenDropdown(key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 font-medium text-base transition-all duration-200"
                >
                  <category.icon className="w-4 h-4" />
                  {category.title.split(' ')[0]}
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                </motion.button>

                <AnimatePresence>
                  {openDropdown === key && (
                    <div onMouseEnter={() => setOpenDropdown(key)} onMouseLeave={() => setOpenDropdown(null)}>
                      <MegaMenu category={category} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Tags */}
            <motion.div whileHover={{ y: -2 }}>
              <a href="/tag" className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200 flex items-center gap-2">
                <Tags className="w-4 h-4" />
                Tags
              </a>
            </motion.div>

            {/* About */}
            <motion.div whileHover={{ y: -2 }}>
              <a href="/about" className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200 flex items-center gap-2">
                <Info className="w-4 h-4" />
                About
              </a>
            </motion.div>

            {/* Subscribe Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="/newsletter"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-2.5 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
              >
                Subscribe
              </a>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden mt-6 pb-6 border-t border-slate-700/50 pt-6 bg-slate-900/95 backdrop-blur-xl rounded-xl px-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-4">
                <a href="/" className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </a>

                {/* Mobile Dropdowns */}
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                      className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-lg hover:bg-slate-800/50"
                    >
                      <span className="flex items-center gap-2">
                        <category.icon className="w-4 h-4" />
                        {category.title}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
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
                              className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50 transition-colors"
                            >
                              {item.name}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <a href="/tag" className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Tags
                </a>
                <a href="/about" className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  About
                </a>

                <a
                  href="/newsletter"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4 py-3 text-base font-bold shadow-lg rounded-full text-center"
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