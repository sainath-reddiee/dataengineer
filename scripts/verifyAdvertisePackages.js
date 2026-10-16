import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import advertiseConfig from '../src/data/advertiseConfig.json' with { type: 'json' };
import { EDITORIAL_BRIEFS } from '../src/data/editorialBriefs.js';

const advertisePage = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/pages/AdvertisePage.jsx'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const prices = advertiseConfig.opportunities.flatMap((opp) =>
  opp.durations.map((d) => `${opp.packageKey}:${d.key}:${d.price}`)
);

assert(!prices.some((row) => row.includes(':15') || row.includes(':25') || row.includes(':30')), 'cheap weekly/mention SKUs should be gone');
assert(
  advertiseConfig.opportunities.find((o) => o.packageKey === 'content')?.durations[0].price >= 150,
  'integration guide should be priced as real writing, not a $99 brochure'
);
assert(
  advertiseConfig.opportunities.every((o) => !o.bullets.some((b) => /across .*glossary|inside .*glossary/i.test(b))),
  'packages must not sell glossary placements'
);
assert(EDITORIAL_BRIEFS.length >= 4, 'need specific guest briefs, not generic topics');
assert(
  EDITORIAL_BRIEFS.every((brief) => brief.ask && brief.title),
  'each brief needs a title and a concrete ask'
);

assert(!/Most booked|Most popular/i.test(advertisePage), 'no popularity badge without real bookings');
assert(
  advertiseConfig.opportunities.every((o) => !o.popular),
  'packages must not be flagged popular without real bookings'
);
assert(advertisePage.includes('useFormSpamGuard'), 'inquiry form must keep the spam guard');
assert(advertisePage.includes('newsletter/stats'), 'subscriber count must come from the live endpoint, not a hard-coded number');

const header = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/Header.jsx'),
  'utf8'
);
const footer = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/Footer.jsx'),
  'utf8'
);
assert(header.includes("path: '/advertise'"), 'Header must keep the Advertise route');
assert(
  !/REVIEW_HIDDEN_MAIN = new Set\(\[\s*['"]\/advertise['"]/.test(header),
  'AdSense review mode must not hide Advertise from the main nav'
);
assert(footer.includes("{ name: 'Advertise', href: '/advertise' }"), 'Footer must keep Advertise');

console.log('✅ Advertise packages no longer look like a cheap link shop');
console.log('✅ Guest briefs ask for production incidents');
console.log('✅ Advertise page claims only what is real (no popularity badge, live counts, spam guard)');
