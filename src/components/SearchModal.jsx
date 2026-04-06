// src/components/SearchModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, FileText, Command } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { posts } = await wordpressApi.getPosts({
        search: searchQuery.trim(),
        per_page: 8,
        page: 1
      });
      setResults(posts || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigateToResult(results[selectedIndex]);
    }
  };

  const navigateToResult = (post) => {
    onClose();
    navigate(`/articles/${post.slug}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[10001] px-4"
          >
            <div className="bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search articles..."
                  className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-slate-800 border border-slate-700 rounded-md">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-block h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm mt-2">Searching...</p>
                  </div>
                )}

                {!loading && query.trim().length >= 2 && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-400">No articles found for "{query}"</p>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div className="py-2">
                    {results.map((post, index) => (
                      <button
                        key={post.id}
                        onClick={() => navigateToResult(post)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-600/20 border-l-2 border-blue-400'
                            : 'border-l-2 border-transparent hover:bg-slate-800/50'
                        }`}
                      >
                        <FileText className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {post.category && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                                {post.category}
                              </span>
                            )}
                            {post.readTime && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.readTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 shrink-0 mt-1 transition-opacity ${
                          index === selectedIndex ? 'text-blue-400 opacity-100' : 'opacity-0'
                        }`} />
                      </button>
                    ))}
                  </div>
                )}

                {!loading && query.trim().length < 2 && (
                  <div className="px-4 py-8 text-center">
                    <Command className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Type at least 2 characters to search</p>
                    <p className="text-gray-500 text-xs mt-1">Use arrow keys to navigate, Enter to select</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-gray-400">
                  <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">&uarr;&darr;</kbd>
                    <span>navigate</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">&crarr;</kbd>
                    <span>select</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
