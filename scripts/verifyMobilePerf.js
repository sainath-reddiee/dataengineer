// Guardrail: homepage first paint must not pop a cookie banner or 3D hub on phones.
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

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const hero = readFileSync(join(root, 'src/components/Hero.jsx'), 'utf8');
const home = readFileSync(join(root, 'src/pages/HomePage.jsx'), 'utf8');
const consent = readFileSync(join(root, 'src/components/CookieConsent.jsx'), 'utf8');
const stats = readFileSync(join(root, 'src/hooks/useStats.js'), 'utf8');

assert(indexHtml.includes('id="deh-cookie-banner"'), 'index.html must paint the cookie banner outside #root');
assert(indexHtml.includes('deh-consent-ready'), 'first-paint script must hide the banner when consent already exists');
assert(indexHtml.includes('deh-need-consent'), 'head script must opt humans into the banner before first paint');
assert(indexHtml.includes('Master Data Engineering with Expert Tutorials'), 'static H1 must match the React hero');
assert(indexHtml.includes('deh-home-hero'), 'static hero must reserve height for the React swap');
assert(!hero.includes("from 'framer-motion'"), 'Hero must stay off the homepage framer-motion chunk');
assert(hero.includes('React.lazy'), 'HubMotion must load only after a desktop viewport check');
assert(!home.includes("from 'framer-motion'"), 'HomePage section headers must not animate in with framer-motion');
assert(home.includes("import FeaturedToolsRail from"), 'tools rail must be eager so it does not pop in under the hero');
assert(consent.includes("useState(() =>"), 'CookieConsent must decide visibility on the first render');
assert(stats.includes('loading: false'), 'hero stats must not flash a loading row');

console.log('✅ Mobile performance: cookie banner is first-paint, hero stays light on phones');
