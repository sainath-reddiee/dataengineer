import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Database, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const activeLinkStyle = {
    color: '#60a5fa',
    textShadow: '0 0 5px #60a5fa'
  };

  const toggleMobileDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
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
          <Link to="/" className="flex items-center space-x-3 z-10">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <Database className="h-9 w-9 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              DataEngineer Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-8">
            
            {/* Home */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/"
                end
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200"
              >
                Home
              </NavLink>
            </motion.div>

            {/* Cloud Dropdown */}
            <div className="relative group">
              <motion.button 
                whileHover={{ y: -2 }}
                className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 font-medium text-base transition-all duration-200"
              >
                Cloud
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </motion.button>
              <div 
                className="absolute left-0 mt-3 w-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2"
                style={{ zIndex: 99999 }}
              >
                <NavLink 
                  to="/category/aws" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    AWS
                  </span>
                </NavLink>
                <NavLink 
                  to="/category/azure" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Azure
                  </span>
                </NavLink>
                <NavLink 
                  to="/category/gcp" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    GCP
                  </span>
                </NavLink>
              </div>
            </div>

            {/* Data Tools Dropdown */}
            <div className="relative group">
              <motion.button 
                whileHover={{ y: -2 }}
                className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 font-medium text-base transition-all duration-200"
              >
                Data Tools
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </motion.button>
              <div 
                className="absolute left-0 mt-3 w-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2"
                style={{ zIndex: 99999 }}
              >
                <NavLink 
                  to="/category/snowflake" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    Snowflake
                  </span>
                </NavLink>
                <NavLink 
                  to="/category/airflow" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Airflow
                  </span>
                </NavLink>
                <NavLink 
                  to="/category/dbt" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                    dbt
                  </span>
                </NavLink>
              </div>
            </div>

            {/* Languages Dropdown */}
            <div className="relative group">
              <motion.button 
                whileHover={{ y: -2 }}
                className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 font-medium text-base transition-all duration-200"
              >
                Languages
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </motion.button>
              <div 
                className="absolute left-0 mt-3 w-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2"
                style={{ zIndex: 99999 }}
              >
                <NavLink 
                  to="/category/python" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                    Python
                  </span>
                </NavLink>
                <NavLink 
                  to="/category/sql" 
                  className="block px-5 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 hover:translate-x-1 transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    SQL
                  </span>
                </NavLink>
              </div>
            </div>

            {/* Tags */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/tag"
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200"
              >
                Tags
              </NavLink>
            </motion.div>

            {/* About */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/about"
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-all duration-200"
              >
                About
              </NavLink>
            </motion.div>

            {/* Subscribe Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-2.5 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link to="/newsletter">Subscribe</Link>
              </Button>
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
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden mt-6 pb-6 border-t border-slate-700/50 pt-6 bg-slate-900/95 backdrop-blur-xl rounded-xl px-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-3">
              
              <NavLink
                to="/"
                end
                onClick={() => setIsMenuOpen(false)}
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50"
              >
                Home
              </NavLink>

              {/* Cloud Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('cloud')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-lg hover:bg-slate-800/50"
                >
                  Cloud
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'cloud' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'cloud' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    <NavLink to="/category/aws" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">AWS</NavLink>
                    <NavLink to="/category/azure" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">Azure</NavLink>
                    <NavLink to="/category/gcp" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">GCP</NavLink>
                  </div>
                )}
              </div>

              {/* Data Tools Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('tools')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-lg hover:bg-slate-800/50"
                >
                  Data Tools
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'tools' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    <NavLink to="/category/snowflake" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">Snowflake</NavLink>
                    <NavLink to="/category/airflow" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">Airflow</NavLink>
                    <NavLink to="/category/dbt" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">dbt</NavLink>
                  </div>
                )}
              </div>

              {/* Languages Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('languages')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-lg hover:bg-slate-800/50"
                >
                  Languages
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'languages' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'languages' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    <NavLink to="/category/python" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">Python</NavLink>
                    <NavLink to="/category/sql" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 pl-3 rounded hover:bg-slate-700/50">SQL</NavLink>
                  </div>
                )}
              </div>

              <NavLink to="/tag" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50">Tags</NavLink>
              <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-blue-400 transition-colors font-semibold py-2 pl-3 rounded-lg hover:bg-slate-800/50">About</NavLink>

              <Button
                onClick={() => setIsMenuOpen(false)}
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4 py-3 text-base font-bold shadow-lg rounded-full"
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