import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Database, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Organized navigation with dropdowns
  const navigationStructure = {
    main: { name: 'Home', path: '/' },
    cloud: {
      label: 'Cloud',
      items: [
        { name: 'AWS', path: '/category/aws' },
        { name: 'Azure', path: '/category/azure' },
        { name: 'GCP', path: '/category/gcp' }
      ]
    },
    tools: {
      label: 'Data Tools',
      items: [
        { name: 'Snowflake', path: '/category/snowflake' },
        { name: 'Airflow', path: '/category/airflow' },
        { name: 'dbt', path: '/category/dbt' }
      ]
    },
    languages: {
      label: 'Languages',
      items: [
        { name: 'Python', path: '/category/python' },
        { name: 'SQL', path: '/category/sql' }
      ]
    },
    utility: [
      { name: 'Tags', path: '/tag' },
      { name: 'About', path: '/about' }
    ]
  };

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
      className="fixed top-0 w-full z-[9999] glass-effect"
    >
      <nav className="container mx-auto px-6 py-6 relative z-[9999]">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }}>
              <div className="relative">
                <Database className="h-10 w-10 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
            <span className="text-2xl md:text-3xl font-bold gradient-text whitespace-nowrap">DataEngineer Hub</span>
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <div className="hidden xl:flex items-center space-x-6">
            {/* Home */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to={navigationStructure.main.path}
                end
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-300 hover:text-blue-400 transition-colors font-semibold text-base"
              >
                {navigationStructure.main.name}
              </NavLink>
            </motion.div>

            {/* Cloud Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors font-medium text-base">
                {navigationStructure.cloud.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navigationStructure.cloud.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-blue-400 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Data Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors font-medium text-base">
                {navigationStructure.tools.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navigationStructure.tools.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-blue-400 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Languages Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors font-medium text-base">
                {navigationStructure.languages.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navigationStructure.languages.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-slate-700/50 hover:text-blue-400 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Utility Links */}
            {navigationStructure.utility.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NavLink
                  to={item.path}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-semibold text-base"
                >
                  {item.name}
                </NavLink>
              </motion.div>
            ))}

            {/* Subscribe Button - Always Visible */}
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-7 py-2.5 rounded-full font-semibold text-base ml-2"
            >
              <Link to="/newsletter">Subscribe</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
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
            className="xl:hidden mt-6 pb-6 border-t border-gray-700 pt-6 bg-slate-900/95 backdrop-blur-xl rounded-lg px-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-3">
              {/* Home */}
              <NavLink
                to={navigationStructure.main.path}
                end
                onClick={() => setIsMenuOpen(false)}
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-white hover:text-blue-400 transition-colors font-semibold text-left py-2 pl-3 rounded-md hover:bg-slate-800/50"
              >
                {navigationStructure.main.name}
              </NavLink>

              {/* Cloud Dropdown Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('cloud')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-md hover:bg-slate-800/50"
                >
                  {navigationStructure.cloud.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'cloud' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'cloud' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    {navigationStructure.cloud.items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                        className="block text-gray-300 hover:text-blue-400 transition-colors py-2 pl-3 rounded-md hover:bg-slate-700/50"
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Tools Dropdown Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('tools')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-md hover:bg-slate-800/50"
                >
                  {navigationStructure.tools.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'tools' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    {navigationStructure.tools.items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                        className="block text-gray-300 hover:text-blue-400 transition-colors py-2 pl-3 rounded-md hover:bg-slate-700/50"
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages Dropdown Mobile */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('languages')}
                  className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors font-medium py-2 pl-3 rounded-md hover:bg-slate-800/50"
                >
                  {navigationStructure.languages.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'languages' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'languages' && (
                  <div className="ml-4 mt-2 space-y-1 bg-slate-800/50 rounded-lg p-2">
                    {navigationStructure.languages.items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                        className="block text-gray-300 hover:text-blue-400 transition-colors py-2 pl-3 rounded-md hover:bg-slate-700/50"
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Utility Links */}
              {navigationStructure.utility.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-white hover:text-blue-400 transition-colors font-semibold text-left py-2 pl-3 rounded-md hover:bg-slate-800/50"
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Subscribe Button */}
              <Button
                onClick={() => setIsMenuOpen(false)}
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4 py-3 text-base font-bold shadow-lg"
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