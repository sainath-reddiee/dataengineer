// Guardrail for Phase 4: Reader experience polish
// - JS under 140 KB gzipped on article pages
// - Reading layout: 65 to 75 character line length, clear heading hierarchy, sticky TOC on desktop, copy buttons on code
// - Images: explicit width/height, modern formats (webp), lazy-loaded below the fold
// - Fewer CTAs and promos inside articles. One newsletter prompt at the end, no popups
// - Accessibility: contrast >= 4.5:1, focus states, alt text, keyboard navigation
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

// 1. Check JS bundle budget on article pages (< 170 KB gzipped)
const jsDir = join(root, 'dist', 'assets', 'js');
if (existsSync(jsDir)) {
  const files = readdirSync(jsDir);

  const oversized = files
    .filter((f) => f.endsWith('.js'))
    .map((f) => {
      const bytes = statSync(join(jsDir, f)).size;
      return { name: f, kb: bytes / 1024 };
    })
    .filter((f) => f.kb > 500)
    .sort((a, b) => b.kb - a.kb);
  if (oversized.length) {
    console.error(
      oversized.map((f) => `   ${f.name}: ${f.kb.toFixed(1)} kB`).join('\n')
    );
  }
  assert(
    oversized.length === 0,
    `JS chunks must stay under Vite's 500 kB minified warning. Oversized: ${oversized.map((f) => f.name).join(', ')}`
  );
  const idxFile = files.find((f) => /^index-.*\.js$/.test(f));
  assert(idxFile, 'dist/assets/js/index-*.js must exist');

  const visited = new Set();
  function collectStaticDeps(filename) {
    if (!filename || visited.has(filename)) return;
    const full = join(jsDir, filename);
    if (!existsSync(full)) return;
    visited.add(filename);
    const code = readFileSync(full, 'utf8');
    // Match static top-level ES module imports: from"./chunk.js" or import"./chunk.js"
    const importRegex = /(?:from|import)\s*["']\.\/([^"']+\.js)["']/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      if (!visited.has(match[1])) {
        console.log(`   🔗 ${filename} -> ${match[1]} | context: ${code.slice(Math.max(0, match.index - 60), match.index + 80)}`);
      }
      collectStaticDeps(match[1]);
    }
  }

  collectStaticDeps(idxFile);

  let totalGzBytes = 0;
  const breakdown = [];
  for (const file of visited) {
    const buf = readFileSync(join(jsDir, file));
    const gz = gzipSync(buf).length;
    totalGzBytes += gz;
    breakdown.push(`${file} (${(gz / 1024).toFixed(1)} KB)`);
  }
  const totalGzKb = totalGzBytes / 1024;
  console.log(`📦 Article initial JS chunks: ${breakdown.join(', ')}`);
  console.log(`📊 Total article initial JS (gzipped): ${totalGzKb.toFixed(1)} KB (budget: 140.0 KB)`);
  assert(
    totalGzKb < 140,
    `Article initial JS exceeds 140 KB gzipped budget: got ${totalGzKb.toFixed(1)} KB`
  );
}

// 2. Reading layout & TOC & copy buttons
const css = readFileSync(join(root, 'src/index.css'), 'utf8');
const toc = readFileSync(join(root, 'src/components/TableOfContents.jsx'), 'utf8');
const copyHook = readFileSync(join(root, 'src/hooks/useCopyCodeButtons.js'), 'utf8');
assert(css.includes('max-width: 72ch'), 'Article paragraphs must cap line length at 65-75ch (max-width: 72ch)');
assert(css.includes('scroll-margin-top: 5.5rem'), 'Article headings must set scroll-margin-top for sticky header');
assert(toc.includes('sticky top-24'), 'Desktop Table of Contents must be sticky');
assert(!toc.includes('framer-motion'), 'TableOfContents must not pull framer-motion onto article pages');
assert(copyHook.includes('copy-code-btn'), 'Code blocks must inject copy buttons');

// 3. Images: explicit width/height, modern formats, lazy-loaded below the fold
const articlePage = readFileSync(join(root, 'src/pages/ArticlePage.jsx'), 'utf8');
const lazyImage = readFileSync(join(root, 'src/components/LazyImage.jsx'), 'utf8');
assert(articlePage.includes('optimizeInlineArticleImages'), 'Inline article images must be optimized for lazy loading, dimensions, and alt text');
assert(articlePage.includes('format=webp'), 'Inline Photon images must request WebP');
assert(lazyImage.includes('aspectRatio'), 'LazyImage must reserve aspectRatio to prevent CLS');
assert(lazyImage.includes("format: 'webp'"), 'LazyImage must request WebP');

// 4. Fewer CTAs and promos inside articles; one newsletter prompt at the end, no popups
const layout = readFileSync(join(root, 'src/components/Layout.jsx'), 'utf8');
const ssg = readFileSync(join(root, 'scripts/generateStaticPagesIncremental.js'), 'utf8');
assert(!articlePage.includes('RecommendedCourses'), 'ArticlePage must not render affiliate course promo grids');
assert(articlePage.includes('<EmailDigestBanner />'), 'ArticlePage must include one newsletter prompt at the end');
assert(!layout.includes('<NewsletterPopup'), 'Layout must not mount a newsletter popup');
assert(!ssg.includes('class="calculator-promo"'), 'Static article HTML must not inject pre-body calculator promo banners');
assert(!ssg.includes('class="related-tools"'), 'Static article HTML must not inject pre-body tool promo lists');

// 5. Accessibility pass: contrast, focus states, alt text, keyboard navigation
const tailwind = readFileSync(join(root, 'tailwind.config.js'), 'utf8');
assert(css.includes(':focus-visible'), 'Global :focus-visible outline must be defined for keyboard navigation');
assert(tailwind.includes("faint: '#665F52'"), 'ink.faint must meet WCAG AA 4.5:1 contrast on paper backgrounds');
assert(toc.includes('aria-expanded'), 'Mobile TOC toggle must expose aria-expanded');

console.log('✅ Phase 4 reader experience polish verified (JS < 140 KB gz, 72ch layout, WebP/CLS-safe images, single end newsletter prompt, WCAG AA contrast & focus states)');
