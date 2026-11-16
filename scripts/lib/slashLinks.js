// Cloudflare Pages serves each directory page at its trailing-slash URL and
// 308s the bare form. Internal <a href> links that point at the bare form cost
// every crawler and visitor an extra hop, so the Pages bundle rewrites them to
// the slash form. A link is only rewritten when dist-pages/<path>/index.html
// exists, so SPA-only routes, rewrites (/admin, /.well-known) and files are left
// alone.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://dataengineerhub.blog';

export function slashInternalLinks(html, distDir) {
  let changed = 0;
  const out = html.replace(/<a\b[^>]*?\bhref=(["'])([^"']+)\1/gi, (match, q, href) => {
    let rest = '';
    let target = href;
    const cut = target.search(/[?#]/);
    if (cut >= 0) {
      rest = target.slice(cut);
      target = target.slice(0, cut);
    }
    if (target.startsWith(SITE)) target = target.slice(SITE.length);
    if (!target.startsWith('/') || target.startsWith('//')) return match;
    if (target === '/' || target.endsWith('/') || /\.[a-z0-9]+$/i.test(target)) return match;
    const dir = path.join(distDir, ...target.split('/').filter(Boolean));
    if (!fs.existsSync(path.join(dir, 'index.html'))) return match;
    const prefix = href.startsWith(SITE) ? SITE : '';
    changed += 1;
    return match.replace(`${q}${href}${q}`, `${q}${prefix}${target}/${rest}${q}`);
  });
  return { html: out, changed };
}

export function slashLinksInDirectory(distDir, files) {
  let pages = 0;
  let links = 0;
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const source = fs.readFileSync(file, 'utf8');
    const { html, changed } = slashInternalLinks(source, distDir);
    if (changed > 0) {
      fs.writeFileSync(file, html);
      pages += 1;
      links += changed;
    }
  }
  return { pages, links };
}
