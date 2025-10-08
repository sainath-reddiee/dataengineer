// src/components/Header.jsx - CORRECTED VERSION

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Database, ChevronDown } from 'lucide-react'; // This was the missing import
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);

  const topics = [
    { name: 'AWS', path: '/category/aws' },
    { name: 'Snowflake', path: '/category/snowflake' },
    { name: 'Azure', path: '/category/azure' },
    { name: 'SQL', path: '/category/sql' },
    { name: 'Airflow', path: '/category/airflow' },
    { name: 'dbt', path: '/category/dbt' },
    { name: 'Python', path: '/category/python' },
    { name: 'GCP', path: '/category/gcp' },
  ];

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Articles', path: '/articles' },
    { name: 'About', path: '/about' }
  ];

  const activeLinkStyle = {
    color: '#60a5fa',
    textShadow: '0 0 5px #60a5fa'
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full z-[9999] glass-effect"
    >
      <nav className="container mx-auto px-6 py-4 relative z-[9999]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }}>
              <div className="relative">
                <Database className="h-8 w-8 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
            <span className="text-2xl font-bold gradient-text">DataEngineer Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6"> {/* Reduced space from space-x-8 */}
            {navItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-medium"
                >
                  {item.name}
                </NavLink>
              </motion.div>
            ))}

            {/* Topics Dropdown */}
            <motion.div 
              className="relative"
              onHoverStart={() => setIsTopicsOpen(true)}
              onHoverEnd={() => setIsTopicsOpen(false)}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center cursor-pointer text-gray-300 hover:text-blue-400 transition-colors font-medium"
              >
                Topics <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isTopicsOpen ? 'rotate-180' : ''}`} />
              </motion.div>
              <AnimatePresence>
                {isTopicsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-lg"
                  >
                    <div className="p-2">
                      {topics.map(topic => (
                        <NavLink
                          key={topic.name}
                          to={topic.path}
                          style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-blue-400 rounded-md"
                          onClick={() => setIsTopicsOpen(false)}
                        >
                          {topic.name}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-semibold"
            >
              <Link to="/newsletter">Subscribe</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-4">
              {[...navItems, ...topics].map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMenuOpen(false)}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-medium text-left py-2"
                >
                  {item.name}
                </NavLink>
              ))}
              <Button
                onClick={() => setIsMenuOpen(false)}
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full"
              >
                <Link to="/newsletter">Subscribe</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
};

export default Header;