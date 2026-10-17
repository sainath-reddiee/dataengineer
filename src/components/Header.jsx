import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  Coffee,
  FileText,
  GitCompare,
  GraduationCap,
  Home,
  Info,
  Library,
  Megaphone,
  Menu,
  Milestone,
  PenLine,
  Search,
  Target,
  Wrench,
  X,
} from 'lucide-react';
const SearchModal = lazy(() => import('@/components/SearchModal'));
const SupportModal = lazy(() => import('@/components/Support/SupportModal'));
import { useReadingList } from '@/hooks/useReadingList';
import { ADSENSE_REVIEW_MODE, isReviewAllowlistedTool } from '@/data/adsenseQualityGate';
import { FEATURED_TOOLS, toolHref } from '@/data/toolsCatalog';

const REVIEW_HIDDEN_MAIN = new Set([
  // Commercial placements stay in the main nav. AdsBot still noindexes that URL.
]);
const REVIEW_HIDDEN_LEARN = new Set([
  '/roadmaps',
  '/glossary',
  '/compare',
  '/interview-prep',
  '/practice',
  '/contribute',
  '/reading-list',
]);

const MAIN_LINKS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Articles', path: '/articles', icon: BookOpen },
  { name: 'Tools', path: '/tools', icon: Wrench },
  { name: 'Advertise', path: '/advertise', icon: Megaphone },
  { name: 'About', path: '/about', icon: Info },
];

const LEARN_LINKS = [
  { name: 'Roadmaps', path: '/roadmaps', icon: Milestone },
  { name: 'Interview Prep', path: '/interview-prep', icon: GraduationCap },
  { name: 'Practice Tests', path: '/practice', icon: Target },
  { name: 'Cheat Sheets', path: '/cheatsheets', icon: FileText },
  { name: 'Glossary', path: '/glossary', icon: Library },
  { name: 'Compare', path: '/compare', icon: GitCompare },
  { name: 'Write for us', path: '/contribute', icon: PenLine },
  { name: 'Reading list', path: '/reading-list', icon: Bookmark },
];

const LEARN_PATHS = [
  '/roadmaps',
  '/interview-prep',
  '/practice',
  '/cheatsheets',
  '/glossary',
  '/compare',
  '/contribute',
  '/reading-list',
];

// Editorial nav: plain text links; the current page gets a rust underline.
const pillClass = (active) =>
  `relative inline-flex items-center gap-1 min-h-10 px-2.5 text-[15px] transition-colors ${
    active
      ? 'text-ink after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:bg-rust-500'
      : 'text-ink-muted hover:text-ink'
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
  const visibleMainLinks = MAIN_LINKS.filter(
    (item) => !ADSENSE_REVIEW_MODE || !REVIEW_HIDDEN_MAIN.has(item.path)
  );
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
  };

  return (
    <header
      className="fixed left-0 right-0 z-[9999] border-b border-ink bg-paper"
      style={{ top: topOffset }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:gap-6">
        <Link to="/" className="z-10 flex min-w-0 shrink-0 items-baseline gap-2" aria-label="DataEngineer Hub home">
          <span className="font-serif text-[21px] font-semibold leading-none tracking-tight text-ink sm:text-[23px]">
            DataEngineer Hub
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="lg:hidden ml-auto inline-flex h-10 w-10 items-center justify-center text-ink-muted transition-colors hover:text-ink"
          aria-label="Search articles"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center justify-end gap-1 lg:flex">
          {visibleMainLinks
            .filter((item) => item.path !== '/about')
            .map((item) => (
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

            {isLearnOpen && (
                <div
                  id="learn-menu"
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-paper-500 bg-paper-50 p-1.5 shadow-lg"
                >
                  {visibleLearnLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        className={`flex min-h-10 items-center gap-2.5 rounded px-3 text-sm transition-colors ${
                          isPathActive(currentPath, item.path)
                            ? 'bg-rust-50 text-rust-600'
                            : 'text-ink-soft hover:bg-paper-300 hover:text-ink'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {item.path === '/reading-list' && readingListCount > 0 && (
                          <span className="min-w-[1.15rem] rounded-full bg-rust-500 px-1 text-center font-mono text-[10px] text-paper">
                            {readingListCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
            )}
          </div>

          {visibleMainLinks
            .filter((item) => item.path === '/about')
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={pillClass(isPathActive(currentPath, item.path))}
              >
                {item.name}
              </Link>
            ))}
        </div>

        <div className="hidden items-center gap-1 border-l border-paper-500 pl-4 lg:flex">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 px-2 text-[15px] text-ink-muted transition-colors hover:text-ink"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="hidden rounded border border-paper-500 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint xl:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-ink-faint transition-colors hover:text-rust-500"
            title="Support DataEngineer Hub"
            aria-label="Buy me a coffee"
          >
            <Coffee className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
          <Link
            to="/tools"
            className="inline-flex h-10 items-center gap-1 px-2 text-sm text-ink-muted transition-colors hover:text-ink"
            aria-label="Free tools"
            title="Free tools"
          >
            <Wrench className="h-4 w-4" />
            <span>Tools</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="hidden h-11 w-11 items-center justify-center text-ink-faint transition-colors hover:text-rust-500 min-[400px]:inline-flex"
            aria-label="Buy me a coffee"
            title="Buy me a coffee"
          >
            <Coffee className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-rust-500"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-paper-500 bg-paper lg:hidden"
            style={{ maxHeight: `calc(100vh - ${topOffset}px - 4rem)` }}
          >
            <div className="mx-auto max-w-7xl space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              <div>
                <p className="kicker mb-2 px-1">
                  Free tools
                </p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {visibleFeaturedTools.map((tool) => {
                    const className =
                      'shrink-0 rounded border border-paper-500 bg-paper-50 px-3 py-2 text-xs text-ink-soft';
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
                {visibleMainLinks.map((item) => (
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
                {!ADSENSE_REVIEW_MODE && (
                  <MobileLink
                    item={{ name: 'Write for us', path: '/contribute', icon: PenLine }}
                    active={isPathActive(currentPath, '/contribute')}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                )}
                {!ADSENSE_REVIEW_MODE && (
                  <MobileLink
                    item={{
                      name: readingListCount > 0 ? `Reading list (${readingListCount})` : 'Reading list',
                      path: '/reading-list',
                      icon: Bookmark,
                    }}
                    active={isPathActive(currentPath, '/reading-list')}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSupportOpen(true);
                  }}
                  className="flex min-h-11 items-center gap-2 rounded px-3 text-sm text-ink-soft hover:bg-paper-300"
                >
                  <Coffee className="h-4 w-4" />
                  Buy me a coffee
                </button>
              </MobileGroup>

              <Link
                to="/articles"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center justify-center rounded bg-ink text-sm font-medium text-paper"
              >
                Explore articles
              </Link>
            </div>
          </div>
      )}

      {(isSearchOpen || isSupportOpen) && (
        <Suspense fallback={null}>
          {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
          {isSupportOpen && <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />}
        </Suspense>
      )}
    </header>
  );
};

const MobileGroup = ({ title, children }) => (
  <div>
    <p className="kicker mb-2 px-1">
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
      className={`flex min-h-11 items-center gap-2 rounded px-3 text-sm ${
        active ? 'bg-rust-50 text-rust-600' : 'text-ink-soft hover:bg-paper-300 hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.name}
    </Link>
  );
};

export default Header;
