import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Bookmark,
  BookOpen,
  ChevronDown,
  Coffee,
  Compass,
  Code2,
  CreditCard,
  FileText,
  GitCompare,
  GraduationCap,
  Home,
  Info,
  Library,
  Map,
  Megaphone,
  Menu,
  PenLine,
  Search,
  Settings,
  Target,
  Activity,
  Wrench,
  X,
} from 'lucide-react';
import SearchModal from '@/components/SearchModal';
import SupportModal from '@/components/Support/SupportModal';
import { useReadingList } from '@/hooks/useReadingList';
import { ADSENSE_REVIEW_MODE, isReviewAllowlistedTool } from '@/data/adsenseQualityGate';
import { FEATURED_TOOLS, toolHref } from '@/data/toolsCatalog';

const REVIEW_HIDDEN_LEARN = new Set(['/glossary', '/compare']);

const MAIN_LINKS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Articles', path: '/articles', icon: BookOpen },
  { name: 'Tools', path: '/tools', icon: Wrench },
  { name: 'Advertise', path: '/advertise', icon: Megaphone },
  { name: 'About', path: '/about', icon: Info },
];

const LEARN_LINKS = [
  { name: 'Start here', path: '/start-here', icon: Compass },
  { name: 'SQL coding', path: '/coding', icon: Code2 },
  { name: 'Interview Prep', path: '/interview-prep', icon: GraduationCap },
  { name: 'Interview bank', path: '/interview-questions', icon: GraduationCap },
  { name: 'Practice Tests', path: '/practice', icon: Target },
  { name: 'Courses', path: '/courses', icon: BookOpen },
  { name: 'Certs', path: '/certs', icon: Award },
  { name: 'Cheat Sheets', path: '/cheatsheets', icon: FileText },
  { name: 'Roadmaps', path: '/roadmaps', icon: Map },
  { name: 'Progress', path: '/progress', icon: Activity },
  { name: 'Saved', path: '/saved', icon: Bookmark },
  { name: 'Pricing', path: '/pricing', icon: CreditCard },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Glossary', path: '/glossary', icon: Library },
  { name: 'Compare', path: '/compare', icon: GitCompare },
  { name: 'Write for us', path: '/contribute', icon: PenLine },
  { name: 'Reading list', path: '/reading-list', icon: Bookmark },
];

const LEARN_PATHS = LEARN_LINKS.map((item) => item.path);

const pillClass = (active) =>
  `inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/25'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

const isPathActive = (pathname, path) => {
  if (path === '/') return pathname === '/';
  if (path === '/articles') {
    return (
      pathname.startsWith('/articles') ||
      pathname.startsWith('/category/') ||
      pathname.startsWith('/tag/')
    );
  }
  return pathname === path || pathname.startsWith(`${path}/`);
};

const Header = ({ topOffset = 0 }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { count: readingListCount } = useReadingList();

  const [isMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLearnOpen, setLearnOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const learnRef = useRef(null);
  const learnTimeout = useRef(null);
  const visibleLearnLinks = LEARN_LINKS.filter(
    (item) => !ADSENSE_REVIEW_MODE || !REVIEW_HIDDEN_LEARN.has(item.path)
  );
  const visibleFeaturedTools = ADSENSE_REVIEW_MODE
    ? FEATURED_TOOLS.filter((tool) => isReviewAllowlistedTool(tool.slug))
    : FEATURED_TOOLS;
  const isLearnActive = visibleLearnLinks.some((item) => isPathActive(currentPath, item.path));

  useEffect(() => {
    return () => {
      if (learnTimeout.current) clearTimeout(learnTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (learnRef.current && !learnRef.current.contains(event.target)) {
        setLearnOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setLearnOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setLearnOpen(false);
    setMobileMenuOpen(false);
    if (learnTimeout.current) clearTimeout(learnTimeout.current);
  }, [currentPath]);

  const openLearn = () => {
    if (learnTimeout.current) clearTimeout(learnTimeout.current);
    learnTimeout.current = setTimeout(() => {
      learnTimeout.current = null;
      setLearnOpen(true);
    }, 80);
  };

  const closeLearn = () => {
    if (learnTimeout.current) clearTimeout(learnTimeout.current);
    learnTimeout.current = setTimeout(() => {
      learnTimeout.current = null;
      setLearnOpen(false);
    }, 120);
  };

  const prefetchLearn = () => {
    import('@/pages/PracticeHubPage');
    import('@/pages/InterviewPrepHubPage');
    import('@/pages/CodingHubPage');
    import('@/pages/StartHerePage');
    import('@/pages/CoursesPage');
    import('@/pages/PricingPage');
  };

  return (
    <header
      className="fixed left-0 right-0 z-[9999] border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
      style={{ top: topOffset }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:gap-4">
        <Link to="/" className="group z-10 flex min-w-0 shrink items-center gap-2">
          <span className="relative shrink-0">
            <DatabaseMark />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
          </span>
          <span className="hidden min-[420px]:inline truncate text-[15px] font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent sm:text-lg max-w-[9rem] min-[480px]:max-w-none">
            DataEngineer Hub
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="lg:hidden flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-sm text-slate-400 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-slate-200"
          aria-label="Search articles"
          title="Search"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-300" />
          <span className="truncate">Search</span>
        </button>

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {MAIN_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => {
                if (item.path === '/tools') import('@/pages/ToolsHubPage');
              }}
              className={pillClass(isPathActive(currentPath, item.path))}
            >
              {item.name}
            </Link>
          ))}

          <div
            ref={learnRef}
            className="relative"
            onMouseEnter={() => {
              prefetchLearn();
              openLearn();
            }}
            onMouseLeave={closeLearn}
          >
            <button
              type="button"
              aria-expanded={isLearnOpen}
              aria-haspopup="true"
              aria-controls="learn-menu"
              onClick={() => setLearnOpen((open) => !open)}
              className={pillClass(isLearnActive || isLearnOpen)}
            >
              Learn
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLearnOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLearnOpen && (
                <motion.div
                  id="learn-menu"
                  role="menu"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full z-50 mt-2 w-72 max-h-[min(28rem,70vh)] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  {visibleLearnLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors ${
                          isPathActive(currentPath, item.path)
                            ? 'bg-blue-500/20 text-blue-200'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {item.path === '/reading-list' && readingListCount > 0 && (
                          <span className="min-w-[1.15rem] rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold text-slate-950">
                            {readingListCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex min-h-10 w-56 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-slate-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4 text-slate-300" />
            <span className="flex-1 text-left">Search articles…</span>
            <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 xl:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
            title="Support DataEngineer Hub"
            aria-label="Buy me a coffee"
          >
            <Coffee className="h-4 w-4" />
          </button>

          <Link
            to="/pricing"
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Pro
          </Link>
          <Link
            to="/articles"
            className="inline-flex min-h-10 items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-colors hover:from-blue-500 hover:to-indigo-500"
          >
            Explore
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
          <Link
            to="/tools"
            className="inline-flex h-10 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
            aria-label="Free tools"
            title="Free tools"
          >
            <Wrench className="h-4 w-4" />
            <span>Tools</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
            aria-label="Buy me a coffee"
            title="Buy me a coffee"
          >
            <Coffee className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl lg:hidden"
            style={{ maxHeight: `calc(100vh - ${topOffset}px - 4rem)` }}
          >
            <div className="mx-auto max-w-7xl space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Free tools
                </p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {visibleFeaturedTools.map((tool) => {
                    const className =
                      'shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200';
                    return tool.external ? (
                      <a key={tool.slug} href={tool.url} className={className} onClick={() => setMobileMenuOpen(false)}>
                        {tool.title}
                      </a>
                    ) : (
                      <Link
                        key={tool.slug}
                        to={toolHref(tool)}
                        className={className}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tool.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <MobileGroup title="Main">
                {MAIN_LINKS.map((item) => (
                  <MobileLink
                    key={item.path}
                    item={item}
                    active={isPathActive(currentPath, item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </MobileGroup>

              <MobileGroup title="Learn">
                {visibleLearnLinks.filter((item) => item.path !== '/contribute' && item.path !== '/reading-list').map((item) => (
                  <MobileLink
                    key={item.path}
                    item={item}
                    active={isPathActive(currentPath, item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </MobileGroup>

              <MobileGroup title="Site">
                <MobileLink
                  item={{ name: 'Write for us', path: '/contribute', icon: PenLine }}
                  active={isPathActive(currentPath, '/contribute')}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileLink
                  item={{
                    name: readingListCount > 0 ? `Reading list (${readingListCount})` : 'Reading list',
                    path: '/reading-list',
                    icon: Bookmark,
                  }}
                  active={isPathActive(currentPath, '/reading-list')}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSupportOpen(true);
                  }}
                  className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-amber-300 hover:bg-white/5"
                >
                  <Coffee className="h-4 w-4" />
                  Buy me a coffee
                </button>
              </MobileGroup>

              <Link
                to="/articles"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white"
              >
                Explore articles
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </header>
  );
};

const DatabaseMark = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-7 w-7 text-blue-400 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const MobileGroup = ({ title, children }) => (
  <div>
    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
      {title}
    </p>
    <div className="grid grid-cols-2 gap-1">{children}</div>
  </div>
);

const MobileLink = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
        active ? 'bg-blue-500/20 text-blue-200' : 'text-slate-200 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.name}
    </Link>
  );
};

export default Header;
