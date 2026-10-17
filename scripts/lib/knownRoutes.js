// URLs that will exist as static files after a build. Hostinger only serves a
// direct load when dist/<path>/index.html exists, so a link to anything else
// 404s for a reader who opens it in a new tab. Used by the community-feature
// verifiers to check every internal link before it ships.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cheatsheets } from '../../src/data/cheatsheetData.js';
import { EXCLUDED_ARTICLE_SLUGS } from '../../src/data/excludedSlugs.js';
import { buildCommunityPages } from './communityPages.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

export function loadKnownRoutes() {
  const known = new Map(); // path -> source
  const add = (p, source) => known.set(p.replace(/\/+$/, '') || '/', source);

  for (const m of read('scripts/generateStaticPagesIncremental.js').matchAll(/^\s*path: '([^']+)'/gm)) add(m[1], 'essential page');
  for (const page of buildCommunityPages()) add(page.path, 'community page');
  for (const hub of ['/', '/articles', '/cheatsheets']) add(hub, 'hub');

  const redirects = JSON.parse(read('src/data/redirects.json'));
  const excluded = new Set(EXCLUDED_ARTICLE_SLUGS);
  const raw = JSON.parse(read('src/data/pseo/articles.json'));
  const articles = Array.isArray(raw) ? raw : raw.articles || Object.values(raw);
  for (const a of articles) {
    const p = `/articles/${a.slug}`;
    if (!excluded.has(a.slug) && !redirects[p]) add(p, 'article');
  }
  for (const sheet of cheatsheets) add(`/cheatsheets/${sheet.slug}`, 'cheat sheet');

  return { known, redirects, excluded };
}

/** @returns {{ok: boolean, reason?: string}} */
export function resolveInternalHref(href, routes = loadKnownRoutes()) {
  if (!href || !href.startsWith('/')) return { ok: false, reason: 'not an internal path' };
  const clean = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (/^\/practice\/[^/]+\/(topics|q)\//.test(clean)) {
    return { ok: false, reason: 'practice topic/question pages have no static file and 404 on a direct load' };
  }
  if (routes.redirects[clean]) return { ok: false, reason: `redirects to ${routes.redirects[clean]}; link the target instead` };
  const slug = clean.startsWith('/articles/') ? clean.slice('/articles/'.length) : null;
  if (slug && routes.excluded.has(slug)) return { ok: false, reason: 'article slug is excluded (301 to a canonical URL)' };
  return routes.known.has(clean) ? { ok: true } : { ok: false, reason: 'no static page is generated for this path' };
}
