/**
 * Header / Learn destinations on DataEngineer Hub.
 * Mapped from DataLane's public catalog without copying their theme,
 * Stripe paywall, or problem bank. Glossary and article archives stay ours.
 *
 * DataLane prefix     → DE Hub route
 * /blog               → /articles (existing; not cloned)
 * /start-here         → /start-here
 * /coding             → /coding
 * /interview          → /interview-prep + /interview-questions
 * /certs              → /certs + /practice + /certification
 * /courses            → /courses
 * /cheatsheets        → /cheatsheets
 * /roadmaps           → /roadmaps
 * /saved              → /saved
 * /settings           → /settings
 * /upgrade            → /pricing (Dodo Payments)
 * /glossary /compare  → live but held out of review nav
 */
export const LEARN_NAV = [
  { name: 'Start here', path: '/start-here', group: 'plan' },
  { name: 'SQL coding', path: '/coding', group: 'practice' },
  { name: 'Interview Prep', path: '/interview-prep', group: 'practice' },
  { name: 'Interview bank', path: '/interview-questions', group: 'practice' },
  { name: 'Practice Tests', path: '/practice', group: 'practice' },
  { name: 'Courses', path: '/courses', group: 'plan' },
  { name: 'Certs', path: '/certs', group: 'plan' },
  { name: 'Cheat Sheets', path: '/cheatsheets', group: 'refs' },
  { name: 'Roadmaps', path: '/roadmaps', group: 'plan' },
  { name: 'Progress', path: '/progress', group: 'account' },
  { name: 'Saved', path: '/saved', group: 'account' },
  { name: 'Pricing', path: '/pricing', group: 'account' },
  { name: 'Settings', path: '/settings', group: 'account' },
  { name: 'Glossary', path: '/glossary', group: 'refs', reviewHidden: true },
  { name: 'Compare', path: '/compare', group: 'refs', reviewHidden: true },
  { name: 'Write for us', path: '/contribute', group: 'site' },
  { name: 'Reading list', path: '/reading-list', group: 'account' },
];

export const INDEXABLE_LEARN_PATHS = [
  '/start-here',
  '/coding',
  '/roadmaps',
  '/courses',
  '/certs',
  '/interview-questions',
  '/pricing',
];
