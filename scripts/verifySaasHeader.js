// Guardrail for the editorial site chrome: header, masthead, homepage.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const hero = readFileSync(join(root, 'src/components/Hero.jsx'), 'utf8');
const home = readFileSync(join(root, 'src/pages/HomePage.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/index.css'), 'utf8');
const tailwind = readFileSync(join(root, 'tailwind.config.js'), 'utf8');

// Every route stays reachable from the header.
const requiredRoutes = [
  '/', '/articles', '/tools', '/advertise', '/about', '/interview-prep', '/practice',
  '/cheatsheets', '/glossary', '/compare', '/contribute', '/reading-list',
];
for (const route of requiredRoutes) {
  assert(header.includes(`'${route}'`) || header.includes(`"${route}"`), `Header must still reach ${route}`);
}
assert(header.includes('Learn'), 'Header should collapse study links into a Learn menu');
assert(header.includes('title="Main"') || header.includes('"Main"'), 'Mobile nav should group Main links');
assert(header.includes('Site'), 'Mobile nav should keep a Site group');
assert(header.includes('h-16'), 'Header should stay 64px to match Layout padding');
assert(header.includes('SearchModal'), 'Search modal must remain wired');
assert(header.includes('aria-label="Search articles"'), 'Mobile header should keep search outside the hamburger');
assert(header.includes('SupportModal'), 'Coffee / support modal must remain wired');
assert(!header.includes('controlHeader') && !header.includes('setIsVisible'), 'Header must stay visible while scrolling');

// Editorial look: serif wordmark, no gradients, glass or glow in the chrome.
assert(header.includes('font-serif'), 'Header wordmark should be set in the serif');
for (const [token, label] of [
  ['bg-gradient', 'gradient fills'],
  ['bg-clip-text', 'gradient text'],
  ['backdrop-blur', 'frosted glass'],
  ['textShadow', 'glowing text'],
]) {
  assert(!header.includes(token), `Header should not use ${label} (${token})`);
  assert(!hero.includes(token), `Masthead should not use ${label} (${token})`);
}

// Masthead: states what the site covers and who writes it.
assert(hero.includes('<h1'), 'Homepage masthead must keep the page h1');
assert(hero.includes('/about') && hero.includes('/editorial-standards'), 'Masthead should credit the author and link editorial standards');
assert(hero.includes('/tools/sql-playground'), 'Masthead should keep a playground link');

// Homepage reads like a publication: lead story first, then the ledger.
assert(home.includes('<LeadStories'), 'Homepage should open with the lead story');
assert(home.includes('<ArticleLedger'), 'Homepage should list more articles as a ledger');
assert(home.indexOf('<LeadStories') < home.indexOf('<FeaturedToolsRail'), 'Articles must come before tools on the homepage');
assert(home.includes('<FeaturedPosts compact') && home.includes('<TrendingPosts compact'), 'Homepage keeps editor picks and trending');

// Design tokens exist and fonts are self-hosted.
for (const token of ['paper', 'ink', 'rust']) {
  assert(tailwind.includes(`const ${token} =`), `Tailwind theme must define the ${token} palette`);
}
for (const font of ['source-serif-4-400.woff2', 'plex-sans-400.woff2', 'plex-mono-400.woff2']) {
  assert(css.includes(font), `index.css must self-host ${font}`);
}
assert(css.includes('prefers-reduced-motion'), 'Motion must respect reduced-motion preferences');

console.log('✅ Header keeps every route in the editorial chrome');
console.log('✅ Masthead and homepage lead with the writing, not the tools');
