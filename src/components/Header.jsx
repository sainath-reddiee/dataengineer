import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  Menu,
  Search,
  X,
  Zap,
  User,
  Sparkles,
  BookOpen,
  Award,
  Terminal,
  Lock,
  ArrowRight,
  Layers,
  Compass,
  Code2,
  BrainCircuit,
  Flame,
} from 'lucide-react';
import SearchModal from '@/components/SearchModal';
import SupportModal from '@/components/Support/SupportModal';
import LoginModal from '@/components/LoginModal';

// ─── Practice Dropdown Catalog (Hands-On Coding & Pads) ─────────────────────────

const PRACTICE_CATALOG = {
  beginner: [
    { name: 'Introduction to SQL & Queries Pad', path: '/coding', level: 'BEGINNER', desc: 'SELECT, WHERE, GROUP BY, aggregations & joins', aiTutor: true },
    { name: 'Python Basics for Data Engineers', path: '/coding', level: 'BEGINNER', desc: 'Variables, loops, dataframes & script basics' },
    { name: 'SQL Joins & Group By Exercises', path: '/coding', level: 'BEGINNER', desc: 'INNER, LEFT, RIGHT & FULL OUTER joins', isNew: true },
    { name: 'Interactive SQL Sandbox', path: '/tools/sql-playground', level: 'BEGINNER', desc: 'Browser-based DuckDB SQL execution' },
  ],
  intermediate: [
    { name: 'Warehouse SQL & Window Functions', path: '/coding', level: 'INTERMEDIATE', desc: 'ROW_NUMBER, LAG, LEAD & cumulative sums', aiTutor: true },
    { name: 'Airflow Pipeline Debugging Pad', path: '/tools/sql-playground', level: 'INTERMEDIATE', desc: 'DAGs, operators, retries & sensors' },
    { name: 'dbt Model & Test Drills', path: '/coding', level: 'INTERMEDIATE', desc: 'Models, tests, docs & incremental strategy', isNew: true },
    { name: 'PySpark DataFrame Processing', path: '/coding', level: 'INTERMEDIATE', desc: 'DataFrames, transformations & schemas' },
  ],
  advanced: [
    { name: 'Hard SQL & Sessionization Pads', path: '/coding', level: 'ADVANCED', pro: true, desc: 'Gaps & islands, pivots & session IDs', aiTutor: true },
    { name: 'PySpark Performance & Salting', path: '/coding', level: 'ADVANCED', pro: true, desc: 'Data skew, salting & executor memory optimization' },
    { name: 'Kafka & Real-Time Streaming Pad', path: '/coding', level: 'ADVANCED', pro: true, desc: 'Exactly-once semantics & watermarking' },
    { name: 'Vector DBs & RAG Indexing Pad', path: '/coding', level: 'ADVANCED', pro: true, desc: 'Embeddings, Pinecone, Chunking & RAG pipelines', isNew: true },
  ],
  'sql-tracks': [
    { name: 'SQL Window Functions Track', path: '/coding', level: 'INTERMEDIATE', desc: 'ROW_NUMBER, RANK, DENSE_RANK, NTILE & LAG/LEAD', aiTutor: true },
    { name: 'SQL Aggregations & Pivot Track', path: '/coding', level: 'INTERMEDIATE', desc: 'CUBE, ROLLUP, GROUPING SETS & FILTER clauses' },
  ],
  'python-tracks': [
    { name: 'Python Data Manipulation Track', path: '/coding', level: 'BEGINNER', desc: 'Pandas, NumPy arrays & data cleaning scripts' },
    { name: 'Python Algorithms for DE Track', path: '/coding', level: 'INTERMEDIATE', desc: 'Hash maps, graph traversal & queue workers' },
  ],
};

// ─── Learn Dropdown Catalog (Roadmaps, Concepts & Guides) ──────────────────────

const LEARN_CATALOG = {
  beginner: [
    { name: 'Data Engineering Fundamentals', path: '/start-here', level: 'BEGINNER', desc: 'Pipelines, warehouses & cloud architecture', isNew: true },
    { name: 'Role Roadmaps & Career Paths', path: '/roadmaps', level: 'BEGINNER', desc: 'Step-by-step career graphs for 9 data roles' },
    { name: 'Introduction to Cloud Architecture', path: '/roadmaps', level: 'BEGINNER', desc: 'Snowflake, BigQuery & AWS S3/Redshift concepts' },
    { name: 'Understanding Dimensional Modeling', path: '/tools', level: 'BEGINNER', desc: 'Star schemas, fact tables & dimension modeling' },
  ],
  intermediate: [
    { name: 'dbt Data Modeling & Marts', path: '/articles/dbt-projects-snowflake-structure', level: 'INTERMEDIATE', desc: 'Models, tests, docs & incremental strategy', isNew: true },
    { name: 'Airflow Pipeline Best Practices', path: '/articles/airflow-dbt-snowflake-orchestration-guide', level: 'INTERMEDIATE', desc: 'DAG design, idempotency & failure handling' },
    { name: 'Snowflake Cost Optimization Guide', path: '/articles/snowflake-cost-optimization-techniques-2026', level: 'INTERMEDIATE', desc: 'Credit calculators, auto-suspend & query profiles' },
    { name: 'Databricks Delta Lake Deep-Dive', path: '/articles/databricks-unity-catalog-iceberg-2026', level: 'INTERMEDIATE', desc: 'ACID transactions, time travel & OPTIMIZE Z-ORDER' },
  ],
  advanced: [
    { name: '10TB/Day Log Ingestion System Design', path: '/articles/mastering-real-time-etl-with-google-cloud-dataflow', level: 'ADVANCED', pro: true, desc: 'High-throughput lakehouse architecture & partitioning' },
    { name: 'Distributed Systems & Raft Consensus', path: '/articles/data-contracts-schema-brekage-guide', level: 'ADVANCED', pro: true, desc: 'Leader election, log replication & CAP theorem' },
    { name: 'CDC with Debezium & Kafka', path: '/articles/automated-etl-airflow-python', level: 'ADVANCED', pro: true, desc: 'Database change data capture & stream processing' },
    { name: 'LLM Fine-Tuning & Vector Infrastructure', path: '/articles/build-rag-snowflake-cortex-search-guide', level: 'ADVANCED', pro: true, desc: 'Embeddings, vector databases & RAG system architecture', isNew: true },
  ],
  'cloud-snowflake': [
    { name: 'Snowflake Architecture & Billing', path: '/articles/snowflake-query-execution-architecture', level: 'BEGINNER', desc: 'Virtual warehouses, micro-partitions & zero-copy clone' },
    { name: 'Cloud Data Warehouse Comparison', path: '/articles/delta-lake-vs-iceberg', level: 'INTERMEDIATE', desc: 'Snowflake vs BigQuery vs Databricks cost analysis' },
  ],
  'airflow-dbt': [
    { name: 'dbt Schema & Model Generator', path: '/tools/dbt-schema-generator', level: 'INTERMEDIATE', desc: 'Generate YAML schemas & tests instantly' },
    { name: 'Cron Expression & Schedule Builder', path: '/tools/cron-job-builder', level: 'BEGINNER', desc: 'Build & test Airflow cron schedules visually' },
  ],
};

const PRACTICE_LINKS = [
  { name: 'Coding hub',        path: '/coding',        desc: 'SQL & Python practice pads & tracks' },
  { name: 'SQL sandbox',       path: '/tools/sql-playground', desc: 'Run SQL in the browser' },
  { name: 'Interview prep',    path: '/interview',      desc: '340+ question bank & drill mode' },
  { name: 'Practice tests',    path: '/certs',          desc: 'Snowflake, AWS, dbt exams' },
];

const LEARN_LINKS = [
  { name: 'Start here',        path: '/start-here',     desc: 'Pick a role, then five steps' },
  { name: 'Role roadmaps',     path: '/roadmaps',       desc: 'Career paths by data role' },
  { name: 'All stacks',        path: '/articles',       desc: 'Filter by technology' },
  { name: 'Resources',         path: '/tools',          desc: 'Calculators & tools' },
];

const MORE_LINKS = [
  { name: 'About',             path: '/about',          desc: 'Who writes this' },
  { name: 'Advertise',         path: '/advertise',      desc: 'Reach DE practitioners' },
  { name: 'Write for us',      path: '/contribute',     desc: 'Submit a technical brief' },
  { name: 'Contributors',      path: '/contributors',   desc: 'Guest author profiles' },
  { name: 'Contact',           path: '/contact',        desc: 'Get in touch' },
];

const isPathActive = (pathname, path) => {
  if (!path || path.includes('#')) return false;
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

const navItemClass = (active) =>
  `inline-flex items-center gap-1 h-10 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
    active
      ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

const DatabaseMark = () => (
  <motion.svg
    whileHover={{ rotate: 10, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    viewBox="0 0 24 24"
    className="h-7 w-7 text-blue-400"
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
  </motion.svg>
);

const Header = ({ topOffset = 0 }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'practice' | 'learn' | 'more' | null
  const [activeCourseLevel, setActiveCourseLevel] = useState('beginner'); // 'beginner' | 'intermediate' | 'advanced' | 'data-engineering' | 'cloud-infra'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);

  const dropdownRef = useRef(null);
  const dropdownTimeout = useRef(null);

  // Check user authentication session in localStorage
  useEffect(() => {
    const checkUser = () => {
      try {
        const stored = localStorage.getItem('de_hub_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) setUser(parsed);
          else setUser(null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [isLoginOpen]);

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close dropdown on outside click / escape
  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [currentPath]);

  const openMenu = (name) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(name), 60);
  };

  const closeMenu = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 100);
  };

  const keepOpen = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
  };

  return (
    <header
      className="fixed left-0 right-0 z-[9999] border-b border-white/8 bg-slate-950/90 backdrop-blur-xl"
      style={{ top: topOffset }}
    >
      <nav
        ref={dropdownRef}
        className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4 sm:px-6"
      >
        {/* ── Logo ── */}
        <Link to="/" className="group flex shrink-0 items-center gap-2 mr-3">
          <DatabaseMark />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            DataEngineer Hub
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden flex-1 items-center gap-0.5 lg:flex">

          {/* Practice Mega-Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openMenu('practice')}
            onMouseLeave={closeMenu}
          >
            <button
              type="button"
              aria-expanded={openDropdown === 'practice'}
              onClick={() => setOpenDropdown(openDropdown === 'practice' ? null : 'practice')}
              className={navItemClass(openDropdown === 'practice')}
            >
              Practice
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === 'practice' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openDropdown === 'practice' && (
                <SaaSMegaMenuDropdown
                  catalogData={PRACTICE_CATALOG}
                  activeLevel={activeCourseLevel}
                  onLevelSelect={setActiveCourseLevel}
                  links={PRACTICE_LINKS}
                  currentPath={currentPath}
                  onMouseEnter={keepOpen}
                  onMouseLeave={closeMenu}
                  title="PRACTICE PADS"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Learn Mega-Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openMenu('learn')}
            onMouseLeave={closeMenu}
          >
            <button
              type="button"
              aria-expanded={openDropdown === 'learn'}
              onClick={() => setOpenDropdown(openDropdown === 'learn' ? null : 'learn')}
              className={navItemClass(openDropdown === 'learn')}
            >
              Learn
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === 'learn' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openDropdown === 'learn' && (
                <SaaSMegaMenuDropdown
                  catalogData={LEARN_CATALOG}
                  activeLevel={activeCourseLevel}
                  onLevelSelect={setActiveCourseLevel}
                  links={LEARN_LINKS}
                  currentPath={currentPath}
                  onMouseEnter={keepOpen}
                  onMouseLeave={closeMenu}
                  title="LEARNING MODULES"
                />
              )}
            </AnimatePresence>
          </div>

          {/* More dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openMenu('more')}
            onMouseLeave={closeMenu}
          >
            <button
              type="button"
              aria-expanded={openDropdown === 'more'}
              onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
              className={navItemClass(openDropdown === 'more')}
            >
              More
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === 'more' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openDropdown === 'more' && (
                <SimpleDropdownPanel links={MORE_LINKS} currentPath={currentPath} onMouseEnter={keepOpen} onMouseLeave={closeMenu} />
              )}
            </AnimatePresence>
          </div>

          {/* Blog link */}
          <Link to="/articles" className={navItemClass(isPathActive(currentPath, '/articles'))}>
            Blog
          </Link>

          {/* Advertise link */}
          <Link to="/advertise" className={navItemClass(isPathActive(currentPath, '/advertise'))}>
            Advertise
          </Link>
        </div>

        {/* ── Right side controls ── */}
        <div className="hidden items-center gap-2 lg:flex ml-auto">
          {/* Coffee Support */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="group inline-flex h-9 items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-3 text-xs font-semibold text-amber-300 transition-colors shrink-0"
            title="Support DataEngineer Hub"
          >
            <motion.div whileHover={{ rotate: 15 }} className="flex items-center justify-center">
              <Coffee className="h-3.5 w-3.5" />
            </motion.div>
            <span>Coffee</span>
          </motion.button>

          {/* Upgrade CTA */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/upgrade"
              className="group inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors shrink-0 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]"
            >
              <Zap className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-110 group-hover:text-amber-300" />
              Upgrade
            </Link>
          </motion.div>

          {/* Search */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="group inline-flex h-9 w-44 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-400 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white"
            title="Search (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform group-hover:rotate-90 group-hover:text-emerald-400" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 xl:inline">
              Ctrl K
            </kbd>
          </motion.button>

          {/* Account Login / Profile Button */}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors shrink-0"
              title={`Signed in as ${user.email}`}
            >
              <div className="h-5 w-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shadow-inner">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="max-w-[80px] truncate">{user.name?.split(' ')[0] || 'Account'}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="group inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3.5 text-sm font-medium text-slate-200 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 shrink-0"
              title="Login to DataEngineer Hub"
            >
              <User className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              Login
            </motion.button>
          )}
        </div>

        {/* ── Mobile right area ── */}
        <div className="flex shrink-0 items-center gap-1 lg:hidden ml-auto">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            to="/upgrade"
            className="inline-flex h-9 items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 text-xs font-bold text-white transition-colors"
          >
            <Zap className="h-3 w-3 fill-current" />
            Pro
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/8 bg-slate-950/95 backdrop-blur-xl lg:hidden"
            style={{ maxHeight: `calc(100vh - ${topOffset}px - 3.5rem)`, overflowY: 'auto' }}
          >
            <div className="mx-auto max-w-7xl space-y-5 px-4 py-5">
              <MobileSection title="Practice">
                {PRACTICE_LINKS.map((item) => (
                  <MobileLink key={item.path + item.name} item={item} active={isPathActive(currentPath, item.path)} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </MobileSection>

              <MobileSection title="Learn">
                {LEARN_LINKS.map((item) => (
                  <MobileLink key={item.path + item.name} item={item} active={isPathActive(currentPath, item.path)} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </MobileSection>

              <MobileSection title="More">
                {MORE_LINKS.map((item) => (
                  <MobileLink key={item.path + item.name} item={item} active={isPathActive(currentPath, item.path)} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </MobileSection>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); setIsLoginOpen(true); }}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white"
                >
                  <User className="h-4 w-4" />
                  {user ? `Account (${user.name})` : 'Login / Sign in'}
                </button>

                <Link
                  to="/upgrade"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-colors"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  Upgrade to Pro — $12/mo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
};

// ─── SaaS-Style Interactive Mega Menu Dropdown Component ───────────────────────

const SaaSMegaMenuDropdown = ({ catalogData = PRACTICE_CATALOG, activeLevel, onLevelSelect, links, currentPath, onMouseEnter, onMouseLeave, title = 'COURSES' }) => {
  const currentCourses = catalogData[activeLevel] || catalogData.beginner || Object.values(catalogData)[0] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className="absolute left-0 top-full z-[100000] mt-2 w-[760px] rounded-2xl border border-slate-700/80 bg-[#0f172a]/95 backdrop-blur-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grid grid-cols-12 gap-4">

        {/* Column 1: Main Destinations */}
        <div className="col-span-4 border-r border-slate-800/80 pr-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
            <Compass className="h-3 w-3" /> DESTINATIONS
          </p>
          {links.map((item) => {
            const active = isPathActive(currentPath, item.path);
            return (
              <Link
                key={item.path + item.name}
                to={item.path}
                className={`flex flex-col rounded-lg px-3 py-2 text-xs transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="font-semibold text-sm">{item.name}</span>
                {item.desc && <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>}
              </Link>
            );
          })}
        </div>

        {/* Column 2: Level & Topic Selection (SaaS mouse-hover reactive) */}
        <div className="col-span-3 border-r border-slate-800/80 pr-3 space-y-2">
          <div>
            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1.5 flex items-center gap-1">
              <Layers className="h-3 w-3" /> LEVEL
            </p>
            <div className="space-y-1">
              {[
                { id: 'beginner', label: 'Beginner', color: 'bg-emerald-500' },
                { id: 'intermediate', label: 'Intermediate', color: 'bg-blue-500' },
                { id: 'advanced', label: 'Advanced', color: 'bg-purple-500' },
              ].map((lvl) => {
                const isSelected = activeLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onMouseEnter={() => onLevelSelect(lvl.id)}
                    onClick={() => onLevelSelect(lvl.id)}
                    className={`w-full text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500/20 to-emerald-500/10 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${lvl.color}`} />
                      <span>{lvl.label}</span>
                    </div>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render extra topic categories present in catalogData */}
          {Object.keys(catalogData).filter((k) => !['beginner', 'intermediate', 'advanced'].includes(k)).length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> TRACKS
              </p>
              <div className="space-y-1">
                {Object.keys(catalogData)
                  .filter((k) => !['beginner', 'intermediate', 'advanced'].includes(k))
                  .map((topicKey) => {
                    const isSelected = activeLevel === topicKey;
                    const formattedLabel = topicKey.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    return (
                      <button
                        key={topicKey}
                        type="button"
                        onMouseEnter={() => onLevelSelect(topicKey)}
                        onClick={() => onLevelSelect(topicKey)}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <span>{formattedLabel}</span>
                        <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'opacity-40'}`} />
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Level Courses List */}
        <div className="col-span-5 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {activeLevel.replace('-', ' ').toUpperCase()} {title}
            </p>
            <Link to="/coding" className="text-[10px] font-bold text-emerald-400 hover:underline">
              See all →
            </Link>
          </div>

          {currentCourses.map((c) => (
            <Link
              key={c.name}
              to={c.path}
              className="group block rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {c.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {c.aiTutor && (
                    <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[8px] font-extrabold text-purple-300 border border-purple-500/30">
                      AI TUTOR
                    </span>
                  )}
                  {c.isNew && (
                    <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-extrabold text-amber-300 border border-amber-500/30">
                      NEW
                    </span>
                  )}
                  {c.pro ? (
                    <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                      <Lock className="h-2 w-2" /> PRO
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                      FREE
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{c.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

// ─── Simple Dropdown Panel ───────────────────────────────────────────────────

const SimpleDropdownPanel = ({ links, currentPath, onMouseEnter, onMouseLeave }) => (
  <motion.div
    initial={{ opacity: 0, y: 4, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 4, scale: 0.98 }}
    transition={{ duration: 0.12 }}
    className="absolute left-0 top-full z-[100000] mt-2 w-64 rounded-xl border border-slate-700/80 bg-[#0f172a] p-2 shadow-2xl shadow-black/90"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {links.map((item) => {
      const active = isPathActive(currentPath, item.path);
      return (
        <Link
          key={item.path + item.name}
          to={item.path}
          className={`flex flex-col rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
            active
              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
              : 'text-slate-200 hover:bg-slate-800/90 hover:text-white'
          }`}
        >
          <span className="font-medium text-sm text-slate-100">{item.name}</span>
          {item.desc && <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</span>}
        </Link>
      );
    })}
  </motion.div>
);

const MobileSection = ({ title, children }) => (
  <div>
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      {title}
    </p>
    <div className="grid grid-cols-2 gap-1">{children}</div>
  </div>
);

const MobileLink = ({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-emerald-500/15 text-emerald-300'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`}
  >
    {item.name}
  </Link>
);


export default Header;

