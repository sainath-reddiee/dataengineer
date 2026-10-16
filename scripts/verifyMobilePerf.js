// Guardrail: homepage first paint must not pop a cookie banner or 3D hub on phones.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanHomepagePaintHtml, deferRenderBlockingStylesheets } from './deferRenderBlockingCss.js';

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
const heroH1 = (hero.match(/<h1[^>]*>\s*([^<]+?)\s*<\/h1>/) || [])[1] || '';
assert(heroH1 && indexHtml.includes(heroH1), 'static H1 in index.html must match the React masthead H1');
assert(indexHtml.includes('deh-home-hero'), 'static hero must reserve height for the React swap');
assert(!hero.includes("from 'framer-motion'"), 'Hero must stay off the homepage framer-motion chunk');
assert(!hero.includes('HubMotion'), 'Hero must stay a text-only masthead with no animated scene');
assert(!home.includes("from 'framer-motion'"), 'HomePage section headers must not animate in with framer-motion');
assert(home.includes("import FeaturedToolsRail from"), 'tools rail must be eager so it does not pop in under the hero');
assert(consent.includes("useState(() =>"), 'CookieConsent must decide visibility on the first render');
assert(stats.includes('loading: false'), 'hero stats must not flash a loading row');

const vite = readFileSync(join(root, 'vite.config.js'), 'utf8');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const footer = readFileSync(join(root, 'src/components/Footer.jsx'), 'utf8');
const scroll = readFileSync(join(root, 'src/components/ScrollToTop.jsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
const deferCss = readFileSync(join(root, 'scripts/deferRenderBlockingCss.js'), 'utf8');
assert(vite.includes('defer-render-blocking-css'), 'Vite must defer the Tailwind stylesheet off first paint');
assert(vite.includes('restore-deferred-css'), 'prerender must not put homepage CSS back on the critical path');
assert(deferCss.includes('export function deferRenderBlockingStylesheets'), 'shared CSS defer helper must exist');
assert(main.includes('requestIdleCallback'), 'React must hydrate after the static hero can paint');
assert(
  indexHtml.includes('adsbygoogle.js?client=ca-pub-') && indexHtml.includes('setTimeout(inject, 2500)'),
  'AdSense must stay in HTML but load after first paint for humans'
);
assert(!indexHtml.includes('rel="preload" as="font"'), 'do not preload Inter ahead of first paint on mobile');
assert(!indexHtml.includes('pagead2.googlesyndication.com" crossorigin'), 'do not preconnect AdSense on the homepage critical path');
assert(!indexHtml.includes('@font-face'), 'do not download Inter before first paint');
assert(!header.includes("from 'framer-motion'"), 'Header chrome must stay off the homepage framer-motion chunk');
assert(!footer.includes("from 'framer-motion'"), 'Footer must stay off the homepage framer-motion chunk');
assert(!scroll.includes("from 'framer-motion'"), 'ScrollToTop must stay off the homepage framer-motion chunk');
assert(app.includes("lazy(() => import('./pages/ArticlePage'))"), 'ArticlePage must not ride along on the homepage bundle');
assert(app.includes('!isMobile'), 'do not prefetch article/tool hubs during a mobile PSI run');

const deferred = deferRenderBlockingStylesheets('<link rel="stylesheet" crossorigin href="/assets/index-abc.css">');
assert(deferred.includes('media="print"') && deferred.includes("this.media='all'"), 'CSS defer helper must flip stylesheets to print/onload');
assert(
  deferRenderBlockingStylesheets(deferred) === deferred,
  'CSS defer helper must be idempotent'
);
assert(
  deferRenderBlockingStylesheets('<link rel="stylesheet" href="/assets/x.css" media="all" onload="this.media=\'all\'">').includes('media="print"'),
  'CSS defer helper must undo prerender media=all'
);
const prerendered = cleanHomepagePaintHtml(
  '<link rel="stylesheet" href="/assets/x.css" media="all" onload="this.media=\'all\'">'
  + '<link rel="modulepreload" href="/assets/js/framer-motion-abc.js">'
  + '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1"></script>'
  + '<script>var src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1";</script>'
);
assert(prerendered.includes('media="print"'), 'homepage cleaner must defer CSS after prerender');
assert(!prerendered.includes('framer-motion-abc.js'), 'homepage cleaner must drop framer-motion preloads');
assert(!prerendered.includes('<script async src="https://pagead2'), 'homepage cleaner must drop the injected ads tag');
assert(prerendered.includes('var src = "https://pagead2'), 'delayed AdSense loader string must stay in HTML');

console.log('✅ Mobile performance: cookie banner is first-paint, hero stays light on phones');
