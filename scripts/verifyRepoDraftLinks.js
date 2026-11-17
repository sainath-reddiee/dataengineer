// Guards against article links that point at draft files in the public GitHub repo.
//   node scripts/verifyRepoDraftLinks.js
// 1. unit-tests rewriteRepoDraftLinks()
// 2. when dist/ exists, fails if any built article still links to a draft path
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteRepoDraftLinks } from '../src/utils/repoDraftLinks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/sainath-reddiee/dataengineer/blob/main/';
let failed = 0;
const check = (ok, message) => {
  if (!ok) {
    console.error(`❌ ${message}`);
    failed += 1;
  }
};

const cases = [
  ['table of contents link to the same page becomes an in-page anchor', `<a href="${REPO}plans/rework/my-post.md#why">x</a>`, 'my-post', '<a href="#why">x</a>'],
  ['table of contents link to another article keeps the anchor', `<a href="${REPO}plans/rework/other.md#sec">x</a>`, 'my-post', '<a href="/articles/other/#sec">x</a>'],
  ['draft link without an anchor', `<a href="${REPO}plans/rework/other.md">x</a>`, 'my-post', '<a href="/articles/other/">x</a>'],
  ['articles/<slug> link', `<a href="${REPO}articles/dbt-tests-pass-bad-data">x</a>`, 'p', '<a href="/articles/dbt-tests-pass-bad-data/">x</a>'],
  ['single-quoted href', `<a href='${REPO}articles/abc'>x</a>`, 'p', "<a href='/articles/abc/'>x</a>"],
  ['article slug at the repo root', `<a href="${REPO}snowflake-cortex-aisql-query-optimization-guide">x</a>`, 'p', '<a href="/articles/snowflake-cortex-aisql-query-optimization-guide/">x</a>'],
  ['glossary term', `<a href="${REPO}glossary/data-quality">x</a>`, 'p', '<a href="/glossary/data-quality/">x</a>'],
  ['another repository is left alone', '<a href="https://github.com/sainath-reddiee/dataengineer_blog/blob/main/meeting_rag.sql">x</a>', 'p', '<a href="https://github.com/sainath-reddiee/dataengineer_blog/blob/main/meeting_rag.sql">x</a>'],
  ['a project repository is left alone', '<a href="https://github.com/sainath-reddiee/2extract">x</a>', 'p', '<a href="https://github.com/sainath-reddiee/2extract">x</a>'],
  ['repo files such as README.md are left alone', `<a href="${REPO}README.md">x</a>`, 'p', `<a href="${REPO}README.md">x</a>`],
  ['html without github is unchanged', '<p>hello</p>', 'p', '<p>hello</p>'],
];
for (const [name, input, slug, want] of cases) {
  check(rewriteRepoDraftLinks(input, slug) === want, `rewriteRepoDraftLinks: ${name}`);
}

const articlesDir = join(root, 'dist', 'articles');
if (existsSync(articlesDir)) {
  const offenders = [];
  for (const slug of readdirSync(articlesDir)) {
    const file = join(articlesDir, slug, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const hits = html.match(/href="https:\/\/github\.com\/sainath-reddiee\/dataengineer\/blob\/main\/(?:plans\/rework|articles|glossary)\/[^"]*"/g);
    if (hits) offenders.push(`${slug} (${hits.length})`);
  }
  check(offenders.length === 0, `built articles still link to draft files in the GitHub repo: ${offenders.slice(0, 8).join(', ')}`);
}

if (failed > 0) {
  console.error(`\n❌ Repo draft link check failed (${failed})`);
  process.exit(1);
}
console.log('✅ Article links never point at draft files in the public GitHub repo');
