import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'AWS', path: '/category/aws' },
    { name: 'Snowflake', path: '/category/snowflake' },
    { name: 'Azure', path: '/category/azure' },
    { name: 'GCP', path: '/category/gcp' },
    { name: 'Airflow', path: '/category/airflow' },
    { name: 'dbt', path: '/category/dbt' },
    { name: 'Python', path: '/category/python' },
    { name: 'SQL', path: '/category/sql' },
    { name: 'Tags', path: '/tag' },
    { name: 'About', path: '/about' }
  ];

  // Group navigation items for better organization
  const mainNavItems = navItems.slice(0, 1); // Home
  const categoryItems = navItems.slice(1, -2); // Categories
  const utilityItems = navItems.slice(-2); // Tags, About

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

          {/* Desktop Navigation - Hidden on smaller screens, visible on xl+ */}
          <div className="hidden xl:flex items-center space-x-7">
            {/* Home */}
            {mainNavItems.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-semibold text-base"
                >
                  {item.name}
                </NavLink>
              </motion.div>
            ))}
            
            {/* Visual separator */}
            <div className="w-px h-7 bg-gray-600" />
            
            {/* Categories with better spacing */}
            {categoryItems.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NavLink
                  to={item.path}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-medium text-base"
                >
                  {item.name}
                </NavLink>
              </motion.div>
            ))}
            
            {/* Visual separator */}
            <div className="w-px h-7 bg-gray-600" />
            
            {/* Utility items (Tags, About) */}
            {utilityItems.map((item) => (
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
            
            {/* Subscribe Button */}
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-7 py-2.5 rounded-full font-semibold text-base ml-3"
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
            className="xl:hidden mt-6 pb-6 border-t border-gray-700 pt-6"
          >
            <div className="flex flex-col space-y-4">
              {/* Main Section */}
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Main</div>
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMenuOpen(false)}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-medium text-left py-2 pl-2"
                >
                  {item.name}
                </NavLink>
              ))}
              
              {/* Categories Section */}
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-4">Categories</div>
              <div className="grid grid-cols-2 gap-3">
                {categoryItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                    className="text-gray-300 hover:text-blue-400 transition-colors font-medium text-left py-2 pl-2 text-sm"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
              
              {/* More Section */}
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-4">More</div>
              {utilityItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  className="text-gray-300 hover:text-blue-400 transition-colors font-medium text-left py-2 pl-2"
                >
                  {item.name}
                </NavLink>
              ))}
              
              {/* Subscribe Button */}
              <Button
                onClick={() => setIsMenuOpen(false)}
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full mt-4"
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