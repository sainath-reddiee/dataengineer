import React, { useState } from 'react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-blue-800/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16M15 4v16M4 9h16M4 15h16" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DataEngineer Hub
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <a href="#" className="px-3 py-2 rounded-lg text-blue-300 hover:bg-blue-800/30 transition-all duration-200 font-medium">
              Home
            </a>

            {/* Cloud Platforms Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-all duration-200 flex items-center space-x-1">
                <span>Cloud</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-blue-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-t-lg transition-colors">AWS</a>
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white transition-colors">Azure</a>
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-b-lg transition-colors">GCP</a>
              </div>
            </div>

            {/* Data Warehouse/Tools Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-all duration-200 flex items-center space-x-1">
                <span>Data Tools</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-blue-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-t-lg transition-colors">Snowflake</a>
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white transition-colors">Airflow</a>
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-b-lg transition-colors">dbt</a>
              </div>
            </div>

            {/* Programming Languages Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-all duration-200 flex items-center space-x-1">
                <span>Languages</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-blue-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-t-lg transition-colors">Python</a>
                <a href="#" className="block px-4 py-2.5 text-gray-300 hover:bg-blue-800/40 hover:text-white rounded-b-lg transition-colors">SQL</a>
              </div>
            </div>

            <a href="#" className="px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-all duration-200">
              Tags
            </a>
            <a href="#" className="px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-all duration-200">
              About
            </a>

            {/* Subscribe Button - Now Always Visible! */}
            <button className="ml-3 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
              Subscribe
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-blue-800/30 pt-4 mt-2">
            <a href="#" className="block px-3 py-2 rounded-lg text-blue-300 hover:bg-blue-800/30 transition-colors font-medium">
              Home
            </a>
            
            {/* Cloud Dropdown - Mobile */}
            <div>
              <button
                onClick={() => toggleDropdown('cloud')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors"
              >
                <span>Cloud</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${openDropdown === 'cloud' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'cloud' && (
                <div className="ml-4 mt-1 space-y-1 bg-slate-800/50 rounded-lg p-2">
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">AWS</a>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">Azure</a>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">GCP</a>
                </div>
              )}
            </div>

            {/* Data Tools Dropdown - Mobile */}
            <div>
              <button
                onClick={() => toggleDropdown('tools')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors"
              >
                <span>Data Tools</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'tools' && (
                <div className="ml-4 mt-1 space-y-1 bg-slate-800/50 rounded-lg p-2">
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">Snowflake</a>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">Airflow</a>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">dbt</a>
                </div>
              )}
            </div>

            {/* Languages Dropdown - Mobile */}
            <div>
              <button
                onClick={() => toggleDropdown('languages')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors"
              >
                <span>Languages</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${openDropdown === 'languages' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'languages' && (
                <div className="ml-4 mt-1 space-y-1 bg-slate-800/50 rounded-lg p-2">
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">Python</a>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-blue-800/30 rounded transition-colors">SQL</a>
                </div>
              )}
            </div>

            <a href="#" className="block px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors">
              Tags
            </a>
            <a href="#" className="block px-3 py-2 rounded-lg text-gray-300 hover:bg-blue-800/30 transition-colors">
              About
            </a>
            
            {/* Subscribe Button - Mobile */}
            <button className="w-full mt-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
              Subscribe
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;