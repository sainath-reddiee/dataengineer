import {
  parkSsgArticleFromRoot,
  getParkedSsgArticle,
  getParkedSsgContent,
  extractSeoContent,
  fetchSsgArticleHtml,
  normalizePath,
} from '../src/utils/ssgArticle.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

globalThis.window = { location: { pathname: '/articles/foo/' } };

assert(normalizePath('/articles/foo/') === '/articles/foo', 'normalizePath should strip trailing slashes');
assert(normalizePath('/') === '/', 'normalizePath should keep the homepage');

const root = {
  querySelector(sel) {
    if (sel !== '.seo-content') return null;
    return { innerHTML: '<article><h1>Foo</h1><p>Body</p></article>' };
  },
};

parkSsgArticleFromRoot(root);

assert(
  getParkedSsgArticle('foo') === '<article><h1>Foo</h1><p>Body</p></article>',
  'parked HTML was not returned for the matching slug'
);
assert(getParkedSsgArticle('other') === '', 'parked HTML leaked onto a different slug');
assert(
  getParkedSsgContent('/glossary/snowflake') === '',
  'article HTML must not paint onto a glossary path'
);

window.location.pathname = '/glossary/snowflake/';
window.__DEH_SSG_ARTICLE__ = undefined;
parkSsgArticleFromRoot(root);
assert(
  getParkedSsgContent('/glossary/snowflake') === '<article><h1>Foo</h1><p>Body</p></article>',
  'glossary SSG should park against the current path'
);
assert(getParkedSsgArticle('snowflake') === '', 'glossary HTML must not be reused as an article');

const extracted = extractSeoContent(
  '<html><body><nav>Nav</nav><div class="seo-content"><article><h1>Bar</h1></article></div></body></html>'
);
assert(extracted.includes('<h1>Bar</h1>'), 'extractSeoContent should find .seo-content');
assert(!extracted.includes('<nav>Nav</nav>'), 'extractSeoContent should not include the chrome');

const fromArticleTag = extractSeoContent('<html><article><h1>Only Article</h1></article></html>');
assert(fromArticleTag.includes('Only Article'), 'extractSeoContent should fall back to <article>');

window.__DEH_SSG_ARTICLE__ = undefined;
window.location.pathname = '/';
let fetchCalls = 0;
globalThis.fetch = async (url) => {
  fetchCalls += 1;
  assert(String(url).includes('/articles/client-nav/'), `unexpected SSG fetch URL: ${url}`);
  return {
    ok: true,
    text: async () =>
      '<html><div class="seo-content"><article><h1>Client Nav</h1><p>Full body</p></article></div></html>',
  };
};

const fetched = await fetchSsgArticleHtml('client-nav');
assert(fetched.includes('Client Nav'), 'fetchSsgArticleHtml should extract the static article');
assert(getParkedSsgArticle('client-nav').includes('Client Nav'), 'fetched HTML should be parked for the slug');

await fetchSsgArticleHtml('client-nav');
assert(fetchCalls === 1, 'repeat fetches for the same slug should use the cache');

console.log('✅ SSG article parking keeps content for the matching path only');
console.log('✅ Static article HTML can be fetched for in-app navigation');

const {
  extractArticleBodyHtml,
  buildBootstrappedPost,
  parkArticleBootstrapFromRoot,
  getArticleBootstrap,
} = await import('../src/utils/articleBootstrap.js');

const parkedSeo = `
  <article>
    <h1>Title</h1>
    <div class="article-body"><p>First para</p><div class="note">inner</div><p>Last</p></div>
    <div class="auto-ads-placement"></div>
  </article>
`;
const body = extractArticleBodyHtml(parkedSeo);
assert(body.includes('First para'), 'extractArticleBodyHtml should keep the article body');
assert(body.includes('inner'), 'extractArticleBodyHtml should keep nested divs');
assert(!body.includes('auto-ads-placement'), 'extractArticleBodyHtml should stop at article-body');

window.__DEH_POST_BOOTSTRAP__ = {
  slug: 'foo',
  title: 'Foo title',
  excerpt: 'Foo excerpt',
  category: 'Snowflake',
  tags: [{ name: 'dbt', slug: 'dbt' }],
  readTime: '4 min read',
  date: '2026-01-01',
  image: 'https://example.com/hero.jpg',
  author: 'Sainath Reddy',
  keyTakeaways: ['One'],
};
const boot = buildBootstrappedPost('foo', parkedSeo);
assert(boot?.htmlReady === true, 'bootstrap + parked body should mark htmlReady');
assert(boot.content.includes('First para'), 'bootstrapped post should reuse parked body HTML');
assert(boot.title === 'Foo title', 'bootstrapped title should come from JSON');
assert(buildBootstrappedPost('other', parkedSeo) === null, 'bootstrap must not leak to another slug');

window.__DEH_POST_BOOTSTRAP__ = undefined;
const fakeDoc = {
  getElementById(id) {
    if (id !== 'deh-post-bootstrap') return null;
    return { textContent: JSON.stringify({ slug: 'parked-slug', title: 'Parked' }) };
  },
};
globalThis.document = fakeDoc;
parkArticleBootstrapFromRoot(null);
assert(getArticleBootstrap('parked-slug')?.title === 'Parked', 'parkArticleBootstrapFromRoot should store JSON');

const generator = await import('node:fs').then((fs) =>
  fs.readFileSync(new URL('../scripts/generateStaticPagesIncremental.js', import.meta.url), 'utf8')
);
assert(generator.includes('deh-post-bootstrap'), 'SSG articles must embed post bootstrap JSON');
assert(generator.includes('article-hero'), 'SSG articles should paint the hero before React mounts');
assert(generator.includes('source-serif-4-400.woff2'), 'SSG articles should preload the article serif like the React app');

const app = await import('node:fs').then((fs) =>
  fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
);
assert(app.includes("import ArticlePage from './pages/ArticlePage'"), 'ArticlePage must be eager, not a lazy chunk gap');
assert(app.includes('isFirstLoad'), 'first React mount must not scroll away from static reading position');

const articlePage = await import('node:fs').then((fs) =>
  fs.readFileSync(new URL('../src/pages/ArticlePage.jsx', import.meta.url), 'utf8')
);
assert(articlePage.includes('htmlReady'), 'ArticlePage should reuse SSG HTML on first paint');
assert(articlePage.includes('initial={false}'), 'ArticlePage must skip fade-in on first paint');

console.log('✅ Article bootstrap reuses parked body without a WordPress wait');
console.log('✅ Cold article loads skip lazy-chunk and fade-in flashes');
