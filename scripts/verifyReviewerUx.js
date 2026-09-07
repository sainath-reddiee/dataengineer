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

const articles = JSON.parse(readFileSync(join(root, 'src/data/pseo/articles.json'), 'utf8'));
const featured = articles.slice(0, 6);
const recent = articles.slice(6, 12);

assert(featured.length === 6, 'featured fallback should list 6 articles');
assert(recent.length === 6, 'recent fallback should list 6 articles');
assert(
  featured.every((article) => article.slug && article.title),
  'fallback articles need a slug and title'
);
assert(
  featured.every((article) => !recent.some((other) => other.slug === article.slug)),
  'featured and recent fallback lists must not repeat titles'
);

const featuredSource = readFileSync(join(root, 'src/components/FeaturedPosts.jsx'), 'utf8');
assert(!featuredSource.includes('Refresh'), 'FeaturedPosts still exposes a public Refresh control');
assert(featuredSource.includes('FallbackArticleList'), 'FeaturedPosts should keep titles when WordPress is empty');
assert(featuredSource.includes('useHomepagePosts'), 'FeaturedPosts should fall back to latest posts');

const recentSource = readFileSync(join(root, 'src/components/RecentPosts.jsx'), 'utf8');
assert(recentSource.includes('showRefresh = false'), 'RecentPosts Refresh should stay off by default');
assert(recentSource.includes('FallbackArticleList'), 'RecentPosts should keep titles when WordPress fails');

const newsSource = readFileSync(join(root, 'src/components/NewsPosts.jsx'), 'utf8');
assert(!newsSource.includes('Error loading news'), 'NewsPosts should hide, not show, a WordPress error');

const postCard = readFileSync(join(root, 'src/components/PostCard.jsx'), 'utf8');
assert(postCard.includes('reloadDocument'), 'article cards should full-load during review mode');

const articlePage = readFileSync(join(root, 'src/pages/ArticlePage.jsx'), 'utf8');
assert(articlePage.includes('useSsgArticleFallback'), 'ArticlePage should fetch SSG HTML for in-app clicks');
assert(articlePage.includes('htmlReady'), 'cold article loads should reuse SSG HTML instead of refetching');

console.log('✅ Reviewer UX fallbacks keep article titles on the homepage');
console.log('✅ Public Refresh / news-error chrome is not shown to reviewers');
