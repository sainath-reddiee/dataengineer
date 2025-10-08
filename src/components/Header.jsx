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
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700"
      style={{ overflow: 'visible' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - Left Side */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <Database className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white hidden sm:block">DataEngineer Hub</span>
          </Link>

          {/* Desktop Navigation - Center/Right */}
          <div className="hidden lg:flex items-center gap-8">
            
            {/* Home */}
            <NavLink
              to="/"
              end
              style={({ isActive }) => isActive ? activeLinkStyle : undefined}
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors"
            >
              Home
            </NavLink>

            {/* Cloud Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 font-medium transition-colors">
                Cloud
                <ChevronDown className="w-4 h-4" />
              </button>
              <div 
                className="absolute top-full left-0 mt-2 w-40 bg-slate-800 rounded-md shadow-xl border border-slate-600 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
                style={{ zIndex: 9999 }}
              >
                <NavLink to="/category/aws" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">AWS</NavLink>
                <NavLink to="/category/azure" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">Azure</NavLink>
                <NavLink to="/category/gcp" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">GCP</NavLink>
              </div>
            </div>

            {/* Data Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 font-medium transition-colors">
                Data Tools
                <ChevronDown className="w-4 h-4" />
              </button>
              <div 
                className="absolute top-full left-0 mt-2 w-40 bg-slate-800 rounded-md shadow-xl border border-slate-600 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
                style={{ zIndex: 9999 }}
              >
                <NavLink to="/category/snowflake" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">Snowflake</NavLink>
                <NavLink to="/category/airflow" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">Airflow</NavLink>
                <NavLink to="/category/dbt" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">dbt</NavLink>
              </div>
            </div>

            {/* Languages Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 font-medium transition-colors">
                Languages
                <ChevronDown className="w-4 h-4" />
              </button>
              <div 
                className="absolute top-full left-0 mt-2 w-40 bg-slate-800 rounded-md shadow-xl border border-slate-600 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
                style={{ zIndex: 9999 }}
              >
                <NavLink to="/category/python" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">Python</NavLink>
                <NavLink to="/category/sql" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white">SQL</NavLink>
              </div>
            </div>

            {/* Tags */}
            <NavLink
              to="/tag"
              style={({ isActive }) => isActive ? activeLinkStyle : undefined}
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors"
            >
              Tags
            </NavLink>

            {/* About */}
            <NavLink
              to="/about"
              style={({ isActive }) => isActive ? activeLinkStyle : undefined}
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors"
            >
              About
            </NavLink>

            {/* Subscribe Button */}
            <Link 
              to="/newsletter"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold transition-all"
            >
              Subscribe
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 py-4 space-y-2">
            
            <NavLink
              to="/"
              end
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded"
            >
              Home
            </NavLink>

            {/* Cloud Mobile */}
            <div>
              <button
                onClick={() => toggleMobileDropdown('cloud')}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-slate-800 rounded"
              >
                Cloud
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'cloud' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'cloud' && (
                <div className="ml-4 mt-1 space-y-1">
                  <NavLink to="/category/aws" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">AWS</NavLink>
                  <NavLink to="/category/azure" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Azure</NavLink>
                  <NavLink to="/category/gcp" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">GCP</NavLink>
                </div>
              )}
            </div>

            {/* Data Tools Mobile */}
            <div>
              <button
                onClick={() => toggleMobileDropdown('tools')}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-slate-800 rounded"
              >
                Data Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'tools' && (
                <div className="ml-4 mt-1 space-y-1">
                  <NavLink to="/category/snowflake" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Snowflake</NavLink>
                  <NavLink to="/category/airflow" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Airflow</NavLink>
                  <NavLink to="/category/dbt" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">dbt</NavLink>
                </div>
              )}
            </div>

            {/* Languages Mobile */}
            <div>
              <button
                onClick={() => toggleMobileDropdown('languages')}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-slate-800 rounded"
              >
                Languages
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'languages' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'languages' && (
                <div className="ml-4 mt-1 space-y-1">
                  <NavLink to="/category/python" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Python</NavLink>
                  <NavLink to="/category/sql" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white">SQL</NavLink>
                </div>
              )}
            </div>

            <NavLink to="/tag" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded">Tags</NavLink>
            <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded">About</NavLink>

            <Link 
              to="/newsletter"
              onClick={() => setIsMenuOpen(false)}
              className="block mx-4 mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center rounded-full font-semibold"
            >
              Subscribe
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;