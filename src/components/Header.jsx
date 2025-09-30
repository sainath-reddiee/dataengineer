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
    { name: 'SQL', path: '/category/sql' },
    { name: 'Airflow', path: '/category/airflow' },
    { name: 'dbt', path: '/category/dbt' },
    { name: 'Analytics', path: '/category/analytics' },
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
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
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
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-semibold"
            >
              <Link to="/newsletter">Subscribe</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
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
                onClick={() => {
                  setIsMenuOpen(false);
                }}
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