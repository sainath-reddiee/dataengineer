#!/usr/bin/env node
// Role roadmaps: structure, unique ids, and every resource link resolves to a
// page that exists as a static file (no redirects, no excluded slugs).
//
//   node scripts/verifyRoadmaps.js            default checks (part of test:community)
//   node scripts/verifyRoadmaps.js --strict   before opening indexing: owner intros
//                                              written, every roadmap published
//   node scripts/verifyRoadmaps.js --live     also checks article slugs on WordPress
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resourceHref, validateRoadmap } from '../src/lib/roadmaps/resourceHref.js';
import { loadKnownRoutes, resolveInternalHref } from './lib/knownRoutes.js';
import { buildRoadmapPages } from './lib/communityPages.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dir = path.join(root, 'src/data/roadmaps');
const roadmaps = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const routes = loadKnownRoutes();
let failed = 0;
const check = (ok, msg) => {
  if (!ok) {
    console.error(`❌ ${msg}`);
    failed += 1;
  }
};

check(roadmaps.length >= 1, 'at least one roadmap');
const articleSlugs = new Set();
let links = 0;
for (const roadmap of roadmaps) {
  for (const problem of validateRoadmap(roadmap)) check(false, `${roadmap.slug}: ${problem}`);
  for (const stage of roadmap.stages || []) {
    for (const skill of stage.skills || []) {
      for (const resource of skill.resources || []) {
        const href = resourceHref(resource);
        const result = resolveInternalHref(href, routes);
        check(result.ok, `${roadmap.slug} / ${skill.id}: ${href} (${result.reason})`);
        if (resource.type === 'article') articleSlugs.add(resource.ref);
        links += 1;
      }
    }
  }
  if (args.includes('--strict')) {
    check(roadmap.published === true, `${roadmap.slug}: not published`);
    check(typeof roadmap.intro === 'string' && roadmap.intro.trim().split(/\s+/).length >= 80, `${roadmap.slug}: owner intro missing or under 80 words`);
    check(!/TODO|OWNER|lorem/i.test(JSON.stringify(roadmap)), `${roadmap.slug}: placeholder text left in the data`);
  }
}

// Wiring: lazy routes, noindex while held out, static pages, nav held back.
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
check(app.includes("lazy(() => import('./pages/RoadmapsHubPage'))") && app.includes("lazy(() => import('./pages/RoadmapPage'))"), 'roadmap routes are lazy-loaded');
check(app.includes('path="roadmaps"') && app.includes('path="roadmaps/:slug"'), 'roadmap routes are registered');
const pages = buildRoadmapPages();
check(pages.length === roadmaps.filter((r) => r.published).length + 1, 'static pages exist for the hub and every published roadmap');
const header = fs.readFileSync(path.join(root, 'src/components/Header.jsx'), 'utf8');
check(/REVIEW_HIDDEN_LEARN = new Set\(\[[^\]]*'\/roadmaps'/.test(header), 'Roadmaps stay out of the Learn menu during AdSense review');

if (args.includes('--live')) {
  const wp = process.env.DEHUB_WP_URL || 'https://app.dataengineerhub.blog';
  for (const slug of articleSlugs) {
    const res = await fetch(`${wp}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id`);
    const body = await res.json().catch(() => []);
    check(Array.isArray(body) && body.length === 1, `WordPress has a published post for ${slug}`);
  }
}

if (failed) {
  console.error(`\n❌ ${failed} roadmap check(s) failed`);
  process.exit(1);
}
console.log(`✅ Roadmaps: ${roadmaps.length} roadmaps, ${links} links all resolve${args.includes('--strict') ? ', intros written' : ''}`);
