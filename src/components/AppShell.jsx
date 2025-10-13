// src/components/AppShell.jsx - LIGHTWEIGHT LOADING SHELL
import React from 'react';

const AppShell = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Minimal header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg 
                className="h-8 w-8 text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" 
                />
              </svg>
              <span className="text-xl font-bold text-white">DataEngineer Hub</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Loading spinner */}
      <main className="pt-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-400 border-b-transparent rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1s' }}>
            </div>
          </div>
          <p className="text-blue-300 font-medium text-lg">Loading DataEngineer Hub...</p>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;