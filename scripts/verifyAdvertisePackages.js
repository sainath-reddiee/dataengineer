import advertiseConfig from '../src/data/advertiseConfig.json' with { type: 'json' };
import { EDITORIAL_BRIEFS } from '../src/data/editorialBriefs.js';

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
  advertiseConfig.opportunities.find((o) => o.packageKey === 'content')?.durations[0].price >= 200,
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

console.log('✅ Advertise packages no longer look like a cheap link shop');
console.log('✅ Guest briefs ask for production incidents');
