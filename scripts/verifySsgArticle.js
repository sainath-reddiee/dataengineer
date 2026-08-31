import { parkSsgArticleFromRoot, getParkedSsgArticle } from '../src/utils/ssgArticle.js';

globalThis.window = { location: { pathname: '/articles/foo/' } };

const root = {
  querySelector(sel) {
    if (sel !== '.seo-content') return null;
    return { innerHTML: '<article><h1>Foo</h1><p>Body</p></article>' };
  },
};

parkSsgArticleFromRoot(root);

if (getParkedSsgArticle('foo') !== '<article><h1>Foo</h1><p>Body</p></article>') {
  console.error('❌ parked HTML was not returned for the matching slug');
  process.exit(1);
}
if (getParkedSsgArticle('other') !== '') {
  console.error('❌ parked HTML leaked onto a different slug');
  process.exit(1);
}

console.log('✅ SSG article parking keeps content for the matching slug only');
