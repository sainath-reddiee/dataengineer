# Performance and Images re-audit: dataengineerhub.blog (2026-11-17)

## Method and limits
- PSI public API (keyless): HTTP 429 on all 6 runs (3 pages x mobile/desktop). No lab Lighthouse data.
- Lighthouse CLI: not installed, nothing installed.
- CrUX: not queried (no key). No field data.
- Everything below is curl-measured (single location, brotli) or static HTML/CSS inspection. LCP, INP, CLS, TBT were NOT measured. No Core Web Vitals pass or fail is claimed.

## Curl-measured timings (3 runs each, br, HTML)
| Page | TTFB | Total | Transfer | Raw HTML | cf-cache-status |
|---|---|---|---|---|---|
| / | 0.27s | 0.27-0.33s | 13.8 KB | 48.4 KB | DYNAMIC |
| /articles/snowflake-mcp-server-guide/ | 0.27-0.30s | 0.27-0.30s | 19.7 KB | 85.0 KB | DYNAMIC |
| /tools/snowflake-cost-calculator/ | 0.24-0.26s | 0.25-0.26s | 6.7 KB | 22.1 KB | DYNAMIC |
Baseline TTFB was 0.36-0.56s, so TTFB improved about 30-45% (likely network variance as much as change; single client).

## Baseline findings re-tested
| # | Baseline finding | Status | Evidence (curl-measured unless noted) |
|---|---|---|---|
| 1 | Hero image 2.79 MB | Fixed | Hero now `?w=1200&quality=80`: 271,726 B image/webp with Accept webp (and with avif Accept, still webp); 287,317 B image/jpeg with no Accept; fetched in 0.39s; Cache-Control max-age=63115200. Reduction about 90%. Still preloaded (head and Link header) with fetchpriority=high. Remaining: 272 KB is above the ~150 KB target; no srcset on hero. |
| 2 | Hero width/height vs aspect ratio | Fixed (minor residue) | img is 1200x675 inside `.article-hero` (aspect-ratio 16/9, max-height 400px, object-fit cover), so no CLS from the hero (static CSS reading, not measured). Delivered file is 1200x800 (3:2), so about 1/3 of pixels are cropped away. Request `resize=1200,675` to save bytes. |
| 3 | Malformed alt on 3 body images | Fixed | alts now parse cleanly ("Mcp architecture", "Mcp before after", "Mcp rbac oauth"), class attribute separate. Hero alt is descriptive. Residual: the 3 body alts are still filename-derived, not descriptive. |
| 4 | Body images: webp vs PNG | Fixed / verified | With Accept webp: 59,400 B, 35,454 B, 71,126 B image/webp (943x504), lazy, width/height and srcset present. Baseline PNG was 35-56 KB, so webp is not smaller for the first and third (diagrams); acceptable, AVIF not served. |
| 5 | AdSense in head on article and calc; inconsistent with home | Not fixed | article line 65 and calc line 54 still have head `<script async ...adsbygoogle.js>`. Home still defers via requestIdleCallback (2500ms timeout) but also keeps a head `async` fundingchoicesmessages script (line 363), so the deferral on home is partly negated. Third-party cost not measurable here. |
| 6 | Large CSS, blocking on article/calc; big JS | Not fixed | `/assets/index-pfY-aIQv.css` 27,594 B br (182 KB raw), still a blocking `<link rel=stylesheet>` on article and calc; home uses media=print swap plus noscript. JS br: index 58,413, react-vendor 58,987, dompurify 11,650 (about 129 KB on the article). Unchanged. |
| 7 | Relative `../../` preload paths | Fixed | article: `href="/fonts/source-serif-4-400.woff2"`, modulepreload `/assets/js/react-vendor-rzpelnZc.js` and dompurify, both root-absolute (also in Link header). |
| 8 | No font preload on home/calc | Partly | Home now preloads source-serif-4-600 and plex-sans-400 (crossorigin, root-absolute); fonts HIT, immutable, 21.5 KB and 19.2 KB. Calculator still has no font preload. Home has 0 img. |
| 9 | Conflicting Cache-Control and x-robots-tag on tool page | Fixed | Calc now returns a single `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` and no x-robots-tag header; meta robots is `index, follow...`. Note this means the page is now indexable; confirm that matches the noindex-until-approval plan in project notes. |
| 10 | Canonical vs served URL (308) | Fixed | Canonicals are trailing-slash on all 3 pages. The no-slash article URL still 308s (expected), but internal links no longer use it (not exhaustively crawled; only the 3 pages' heads checked). |
| 11 | HTML not edge cached | Not fixed | cf-cache-status DYNAMIC on all 3 pages. |
| Pass | Compression, asset caching | Still pass | br on HTML/CSS/JS; /assets and /fonts immutable 1 year. One asset showed MISS (index JS) on first fetch, then edge-cached. |
| Pass | logo.png 48.6 KB, max-age 14400 | Not fixed (low) | Still 48,577 B used as favicon and apple-touch-icon. |

## New findings
| Severity | Finding | Evidence |
|---|---|---|
| Low | Default share image fixed but cache short | `/og-image.jpg` is a real JPEG, 1200x630, 61,650 B (verified by file header). Cache-Control max-age=14400 only. This is a fix, not a defect; short TTL is minor. |
| Low | Article og:image is 3:2 and uses the full original | `og:image` = `...Snowflake-mcp-server-guide.png?fit=1536%2C1024`, not 1.91:1 and not size-capped (social crawler may fetch the multi-MB original). Use `?resize=1200,630`. |
| Low | Hero image not responsive | Single 1200w URL, no srcset. Mobile fetches 272 KB for a frame of about 360-400 CSS px. Add 480/800/1200 srcset with sizes. |
| Low | Duplicate Funding Choices loading on home | Head `async` script plus idle loader checks for existing script, so only one loads; but the head tag removes the idle benefit. |
| Info | Home has a no-JS stylesheet duplicate only in noscript | Intended pattern, not an issue. |

## Core Web Vitals
LCP, INP, CLS: NOT MEASURED (PSI 429, no Lighthouse, no CrUX key). No pass/fail claimed. Reasoned only: article LCP candidate dropped from 2.79 MB to 272 KB, which should help materially; the AdSense head script and blocking 27.6 KB br CSS remain risks. Verify with PSI web UI, a keyed PSI call, or Search Console CWV.

## Scores (ESTIMATED, not measured)
- Performance: about 82/100 (baseline estimate 75, +7). Gains: hero payload, absolute preloads, home font preload, single clean headers, trailing-slash links. Held back by blocking CSS/JS bundle on article and calc, head AdSense, uncached HTML.
- Images: about 80/100 (baseline estimate 55, +25). Gains: hero -90%, webp delivery, valid alts, correct hero dimensions, real 1200x630 OG JPEG. Held back by no hero srcset, 3:2 crop waste, 3:2 article og:image, filename-style alts, 48 KB logo icon.

## Top remaining issues
1. Blocking 182 KB raw CSS plus about 129 KB br JS on article/calc; apply the home's non-blocking CSS pattern and split per route.
2. AdSense loaded in head on article/calc (and Funding Choices head tag on home); use the idle/consent-gated loader everywhere.
3. Hero still 272 KB, non-responsive, 3:2 file in 16:9 frame; use srcset and `resize=1200,675`; also fix article og:image size and cache HTML at the edge.
