/**
 * Drop sitemap <url> entries whose generated dist HTML is noindex.
 *
 * Sitemap generation runs before SSG. Even after the sitemap uses the same
 * takeaways+collapse word count as article robots, path holds and later SSG
 * edits can still mark a page noindex. verifyBuild fails if sitemap.xml
 * advertises those URLs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function pageHasNoindex(html) {
  const robots = String(html || '').match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  return Boolean(robots && /noindex/i.test(robots[1]));
}

export function distHtmlPath(distDir, pathname) {
  const clean = String(pathname || '').replace(/\/+$/, '') || '/';
  return clean === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, clean.replace(/^\//, ''), 'index.html');
}

export function filterSitemapXml(xml, distDir, { readFileSync = fs.readFileSync, existsSync = fs.existsSync } = {}) {
  const source = String(xml || '');
  const urlBlocks = source.match(/<url>[\s\S]*?<\/url>/g) || [];
  const kept = [];
  const removed = [];

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>\s*([^<]+)\s*<\/loc>/i);
    if (!locMatch) {
      kept.push(block);
      continue;
    }

    let pathname;
    try {
      pathname = new URL(locMatch[1].trim()).pathname;
    } catch {
      kept.push(block);
      continue;
    }

    const htmlPath = distHtmlPath(distDir, pathname);
    if (!existsSync(htmlPath)) {
      kept.push(block);
      continue;
    }

    const html = readFileSync(htmlPath, 'utf8');
    if (pageHasNoindex(html)) {
      removed.push(pathname);
      continue;
    }
    kept.push(block);
  }

  const openMatch = source.match(/^[\s\S]*?<urlset\b[^>]*>/i);
  const open = openMatch ? openMatch[0] : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset>';
  const next = `${open}\n${kept.join('\n')}\n</urlset>\n`;
  return { xml: next, removed, kept: kept.length };
}

export function pruneSitemapFile(sitemapPath, distDir, io = fs) {
  if (!io.existsSync(sitemapPath) || !io.existsSync(distDir)) {
    return { removed: [], kept: 0, skipped: true, sitemapPath };
  }

  const xml = io.readFileSync(sitemapPath, 'utf8');
  const result = filterSitemapXml(xml, distDir, io);
  if (result.removed.length > 0) {
    io.writeFileSync(sitemapPath, result.xml, 'utf8');
  }
  return { ...result, skipped: false, sitemapPath };
}

export function pruneSitemaps({ rootDir } = {}, io = fs) {
  const root = rootDir || path.join(__dirname, '..');
  const distDir = path.join(root, 'dist');
  return [
    path.join(root, 'public', 'sitemap.xml'),
    path.join(root, 'dist', 'sitemap.xml'),
  ].map((sitemapPath) => pruneSitemapFile(sitemapPath, distDir, io));
}

function isDirectRun() {
  const invoked = process.argv[1] && path.resolve(process.argv[1]);
  return invoked === __filename;
}

if (isDirectRun()) {
  const reports = pruneSitemaps();
  let removed = 0;
  for (const report of reports) {
    const label = path.relative(path.join(__dirname, '..'), report.sitemapPath);
    if (report.skipped) {
      console.log(`🗺️  Skip ${label} (missing sitemap or dist)`);
      continue;
    }
    if (report.removed.length === 0) {
      console.log(`🗺️  ${label}: no noindex URLs to drop (${report.kept} kept)`);
      continue;
    }
    removed += report.removed.length;
    console.log(`🗺️  Pruned ${report.removed.length} noindex URL(s) from ${label}`);
    for (const pathname of report.removed) {
      console.log(`   ⏭️  ${pathname}`);
    }
  }
  if (removed === 0) {
    console.log('✅ Sitemap has no generated noindex URLs');
  }
}
