/**
 * Header / Learn destinations on DataEngineer Hub.
 * Mapped from DataLane's public catalog (search.json + llms.txt) without
 * copying their theme, Stripe Pro paywall, or problem bank.
 *
 * DataLane prefix     → DE Hub route
 * /blog               → /articles
 * /start-here         → /start-here
 * /coding             → /coding  (SQL pads in DuckDB playground)
 * /interview          → /interview-prep
 * /certs              → /practice + /certification
 * /cheatsheets        → /cheatsheets
 * /roadmaps           → /roadmaps
 * /saved + /settings  → /progress (localStorage; this browser only)
 * /upgrade + /signin  → not cloned (coffee/support + advertise)
 * /categories         → /articles + existing category pages
 * /glossary /compare  → live but held out of review nav
 */
export const LEARN_NAV = [
  { name: 'Start here', path: '/start-here', group: 'plan' },
  { name: 'SQL coding', path: '/coding', group: 'practice' },
  { name: 'Interview Prep', path: '/interview-prep', group: 'practice' },
  { name: 'Practice Tests', path: '/practice', group: 'practice' },
  { name: 'Cheat Sheets', path: '/cheatsheets', group: 'refs' },
  { name: 'Roadmaps', path: '/roadmaps', group: 'plan' },
  { name: 'Progress', path: '/progress', group: 'account' },
  { name: 'Glossary', path: '/glossary', group: 'refs', reviewHidden: true },
  { name: 'Compare', path: '/compare', group: 'refs', reviewHidden: true },
  { name: 'Write for us', path: '/contribute', group: 'site' },
  { name: 'Reading list', path: '/reading-list', group: 'account' },
];

export const INDEXABLE_LEARN_PATHS = ['/start-here', '/coding', '/roadmaps'];
