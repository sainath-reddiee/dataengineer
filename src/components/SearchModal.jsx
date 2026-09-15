// src/components/SearchModal.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  FileText,
  BookOpen,
  GitCompare,
  Library,
  Terminal,
  GraduationCap,
  Wrench,
  Sparkles,
} from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import searchIndex from '@/data/searchIndex.json';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { toolsForSearchIndex, searchTools, toolHref } from '@/data/toolsCatalog';

const RECENT_KEY = 'deh-search-recent';
const MAX_RECENT = 6;

const JUMP_LINKS = [
  { type: 'tool', id: 'jump-playground', title: 'SQL Playground', href: '/tools/sql-playground', excerpt: 'Run SQL in the browser' },
  { type: 'tool', id: 'jump-tools', title: 'Tools hub', href: '/tools', excerpt: 'Calculators, formatter, converter' },
  { type: 'tool', id: 'jump-cost', title: 'Snowflake Cost Calculator', href: '/tools/snowflake-cost-calculator', excerpt: 'Model the warehouse bill' },
  { type: 'tool', id: 'jump-cron', title: 'Cron builder', href: '/tools/cron-expression-builder', excerpt: 'Airflow and Snowflake TASK' },
  { type: 'cheatsheet', id: 'jump-cheatsheets', title: 'Cheat sheets', href: '/cheatsheets', excerpt: 'SQL, dbt, Airflow, Spark' },
  { type: 'article', id: 'jump-interview', title: 'Interview prep', href: '/interview-prep', excerpt: '14-day plan by stack' },
  { type: 'article', id: 'jump-practice', title: 'Practice tests', href: '/practice', excerpt: 'SnowPro, Databricks, AWS quizzes' },
];

const TOPIC_CHIPS = ['Snowflake', 'dbt', 'Airflow', 'Spark', 'SQL', 'Kafka'];

const TOOL_INDEX = toolsForSearchIndex();

const buildLocalIndex = () => {
  const out = [...JUMP_LINKS, ...TOOL_INDEX];
  if (ADSENSE_REVIEW_MODE) return out;
  for (const g of searchIndex.glossary || []) {
    out.push({
      type: 'glossary',
      id: `glossary-${g.slug}`,
      title: g.term,
      slug: g.slug,
      href: `/glossary/${g.slug}`,
      category: g.category,
      excerpt: g.shortDefinition,
    });
  }
  for (const c of searchIndex.comparisons || []) {
    out.push({
      type: 'comparison',
      id: `comparison-${c.slug}`,
      title: c.title,
      slug: c.slug,
      href: `/compare/${c.slug}`,
      category: c.category,
      excerpt: c.shortVerdict,
    });
  }
  return out;
};

const LOCAL_INDEX = buildLocalIndex();

const scoreLocal = (item, q) => {
  const needle = q.toLowerCase();
  const t = (item.title || '').toLowerCase();
  const e = (item.excerpt || '').toLowerCase();
  const c = (item.category || '').toLowerCase();
  if (t === needle) return 100;
  if (t.startsWith(needle)) return 80;
  if (t.includes(needle)) return 60;
  if (c.includes(needle)) return 30;
  if (e.includes(needle)) return 20;
  return 0;
};

const TypeIcon = ({ type, className }) => {
  if (type === 'glossary') return <Library className={className} />;
  if (type === 'comparison') return <GitCompare className={className} />;
  if (type === 'cheatsheet') return <BookOpen className={className} />;
  if (type === 'tool') return <Terminal className={className} />;
  if (type === 'recent') return <Clock className={className} />;
  return <FileText className={className} />;
};

const typeLabel = (type) => {
  if (type === 'article') return 'Article';
  if (type === 'glossary') return 'Glossary';
  if (type === 'comparison') return 'Comparison';
  if (type === 'cheatsheet') return 'Cheat sheet';
  if (type === 'tool') return 'Tool';
  if (type === 'recent') return 'Recent';
  return type;
};

const loadRecent = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const persistRecent = (entry) => {
  const next = [entry, ...loadRecent().filter((item) => item.id !== entry.id && item.href !== entry.href)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
};

const Highlight = ({ text, query }) => {
  if (!text) return null;
  const needle = query.trim();
  if (needle.length < 2) return text;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-blue-500/30 px-0.5 text-white">{text.slice(idx, idx + needle.length)}</mark>
      {text.slice(idx + needle.length)}
    </>
  );
};

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const { body, documentElement } = document;
    const previousBody = body.style.overflow;
    const previousHtml = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousBody;
      documentElement.style.overflow = previousHtml;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  const idleItems = useMemo(
    () => [
      ...recent.map((item) => ({ ...item, id: item.id || `recent-${item.href}` })),
      ...JUMP_LINKS.filter((link) => !recent.some((item) => item.href === link.href)),
    ],
    [recent]
  );

  const visibleItems = query.trim().length >= 2 ? results : idleItems;

  const performSearch = useCallback(async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const toolMatches = searchTools(q).slice(0, 6).map((tool) => ({
      type: 'tool',
      id: `tool-${tool.slug}`,
      title: tool.title,
      href: toolHref(tool),
      category: tool.category,
      excerpt: tool.tagline,
    }));

    const localMatches = LOCAL_INDEX
      .map((item) => ({ item, score: scoreLocal(item, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item);

    let wpMatches = [];
    try {
      const { posts } = await wordpressApi.getPosts({ search: q, per_page: 8, page: 1 });
      wpMatches = (posts || []).map((p) => ({
        type: 'article',
        id: `article-${p.id}`,
        title: p.title,
        slug: p.slug,
        href: `/articles/${p.slug}`,
        category: p.category,
        readTime: p.readTime,
        excerpt: p.excerpt,
      }));
    } catch {
      wpMatches = [];
    }

    const seen = new Set();
    const merged = [];
    for (const r of [...toolMatches, ...wpMatches, ...localMatches]) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      merged.push(r);
    }

    setResults(merged);
    setSelectedIndex(0);
    setLoading(false);
  }, []);

  const runQuery = useCallback((value) => {
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
    }, 220);
  }, [performSearch]);

  const handleInputChange = (e) => {
    runQuery(e.target.value);
  };

  const navigateToResult = (result) => {
    if (!result?.href) return;
    setRecent(persistRecent({
      id: result.id,
      type: result.type,
      title: result.title,
      href: result.href,
      excerpt: result.excerpt,
    }));
    onClose();
    navigate(result.href);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(visibleItems.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && visibleItems[selectedIndex]) {
      navigateToResult(visibleItems[selectedIndex]);
    }
  };

  const clearRecent = () => {
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  };

  const resultHint = useMemo(() => {
    if (results.length === 1) return '1 result';
    return `${results.length} results`;
  }, [results.length]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const showIdle = !loading && query.trim().length < 2;
  const showEmpty = !loading && query.trim().length >= 2 && results.length === 0;
  const showResults = !loading && results.length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[10000]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-heading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[10001] flex items-start justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-[12vh]"
            onClick={onClose}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="flex w-full max-w-2xl max-h-[min(88dvh,40rem)] flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl"
            >
              <h2 id="search-modal-heading" className="sr-only">Search articles</h2>
              <div className="flex items-center gap-3 px-3 py-3 sm:px-4 border-b border-slate-700/50">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search articles, tools, or a topic…"
                  autoComplete="off"
                  autoCorrect="off"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 bg-transparent text-white text-base sm:text-lg placeholder-gray-500 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => runQuery('')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-slate-800 border border-slate-700 rounded-md">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loading && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-block h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm mt-2">Searching…</p>
                  </div>
                )}

                {showEmpty && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-gray-300 text-pretty">No results for “{query}”</p>
                    <p className="text-gray-500 text-xs mt-2 text-pretty">
                      Try a tool, a stack name, or one of the shortcuts below.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {TOPIC_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => runQuery(chip)}
                          className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-200 hover:border-blue-400/40 hover:text-white"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showResults && (
                  <div className="py-2">
                    {results.map((r, index) => (
                      <ResultRow
                        key={r.id}
                        item={r}
                        query={query}
                        active={index === selectedIndex}
                        onClick={() => navigateToResult(r)}
                        onHover={() => setSelectedIndex(index)}
                      />
                    ))}
                  </div>
                )}

                {showIdle && (
                  <div className="px-4 py-4 space-y-5">
                    <div>
                      <p className="text-gray-300 text-sm text-pretty">
                        Type at least 2 characters to search
                      </p>
                      <p className="text-gray-500 text-xs mt-1 text-pretty leading-relaxed">
                        Articles, glossary, comparisons, and tools. Or tap a shortcut.
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Popular topics
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TOPIC_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => runQuery(chip)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-200 hover:border-blue-400/40 hover:text-white"
                          >
                            <Sparkles className="h-3 w-3 text-blue-300" />
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {recent.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Recent
                          </p>
                          <button
                            type="button"
                            onClick={clearRecent}
                            className="text-[11px] text-slate-500 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="-mx-1">
                          {recent.map((item, index) => (
                            <ResultRow
                              key={item.id || item.href}
                              item={{ ...item, type: item.type || 'recent' }}
                              query=""
                              active={index === selectedIndex}
                              onClick={() => navigateToResult(item)}
                              onHover={() => setSelectedIndex(index)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Jump to
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {JUMP_LINKS.map((link) => {
                          const Icon = link.href.includes('playground')
                            ? Terminal
                            : link.href.includes('interview')
                              ? GraduationCap
                              : link.href.includes('tools')
                                ? Wrench
                                : link.href.includes('glossary')
                                  ? Library
                                  : BookOpen;
                          return (
                            <button
                              key={link.id}
                              type="button"
                              onClick={() => navigateToResult(link)}
                              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-3 text-left hover:border-blue-400/30 hover:bg-slate-800/80"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                              <span>
                                <span className="block text-sm font-medium text-white">{link.title}</span>
                                <span className="block text-xs text-slate-400">{link.excerpt}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showResults && (
                <div className="px-4 py-2 border-t border-slate-700/50 flex items-center justify-between gap-3 text-xs text-gray-400">
                  <span>{resultHint}</span>
                  <div className="hidden sm:flex items-center gap-2">
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
    </AnimatePresence>,
    document.body
  );
};

const ResultRow = ({ item, query, active, onClick, onHover }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onHover}
    className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors ${
      active
        ? 'bg-blue-600/20 border-l-2 border-blue-400'
        : 'border-l-2 border-transparent hover:bg-slate-800/50'
    }`}
  >
    <TypeIcon type={item.type} className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium break-words">
        <Highlight text={item.title} query={query} />
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-slate-700/60 text-gray-300 rounded-full">
          {typeLabel(item.type)}
        </span>
        {item.category && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
            {item.category}
          </span>
        )}
        {item.readTime && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.readTime}
          </span>
        )}
      </div>
      {item.excerpt && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 break-words">
          <Highlight text={item.excerpt} query={query} />
        </p>
      )}
    </div>
    <ArrowRight className={`h-4 w-4 shrink-0 mt-1 transition-opacity ${
      active ? 'text-blue-400 opacity-100' : 'opacity-0'
    }`} />
  </button>
);

export default SearchModal;
