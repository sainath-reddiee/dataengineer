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

const forbidden = [
  ['Spark', 'mega-menu spark particles'],
  ['w-[640px]', '640px articles mega-menu'],
  ['controlHeader', 'hide-on-scroll header'],
  ['setIsVisible', 'hide-on-scroll header state'],
  ['textShadow', 'glowing nav text'],
  ['text-xs 2xl:text-base', 'squeezed desktop nav type'],
];

for (const [token, label] of forbidden) {
  assert(!header.includes(token), `Header should not keep ${label} (${token})`);
}

const requiredRoutes = [
  '/',
  '/articles',
  '/tools',
  '/advertise',
  '/about',
  '/interview-prep',
  '/practice',
  '/cheatsheets',
  '/glossary',
  '/compare',
  '/contribute',
  '/reading-list',
];

for (const route of requiredRoutes) {
  assert(header.includes(`'${route}'`) || header.includes(`"${route}"`), `Header must still reach ${route}`);
}

assert(header.includes('Learn'), 'Header should collapse study links into a Learn menu');
assert(header.includes('title="Main"') || header.includes('>Main<') || header.includes('"Main"'), 'Mobile nav should group Main links');
assert(header.includes('Learn'), 'Mobile nav should keep a Learn group');
assert(header.includes('Site'), 'Mobile nav should keep a Site group');
assert(
  header.includes('bg-blue-500/20 text-blue-200') || header.includes('bg-blue-500/10 text-blue-300'),
  'Active links should use a pill, not squeezed text'
);
assert(header.includes('backdrop-blur-xl'), 'Header should stay frosted and sticky');
assert(header.includes('h-16'), 'Header should stay 64px to match Layout padding');
assert(header.includes('SearchModal'), 'Search modal must remain wired');
assert(header.includes('SupportModal'), 'Coffee / support modal must remain wired');
assert(!header.includes("animate={{ y: isVisible"), 'Header must stay visible while scrolling');

assert(hero.includes('DataEngineer Hub · production tutorials'), 'Hero should use a SaaS-style eyebrow');
assert(hero.includes('card-3d'), 'Hero stats should lift like cards');
assert(hero.includes('/tools/sql-playground'), 'Hero should keep a third CTA into tools');
assert(hero.includes('rounded-lg'), 'Hero CTAs should use SaaS rounded-lg buttons');

assert(home.includes('max-w-6xl'), 'Homepage should tighten to a SaaS content width');
assert(home.includes('card-3d'), 'Homepage cards should use the lift hover');
assert(css.includes('.card-3d'), 'Global card-3d hover must exist');
assert(css.includes('prefers-reduced-motion'), 'card-3d must respect reduced motion');

console.log('✅ SaaS header keeps every route without the old mega-menu');
console.log('✅ Hero and homepage use quieter SaaS chrome');
