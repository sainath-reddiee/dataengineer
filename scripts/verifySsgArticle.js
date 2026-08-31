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
