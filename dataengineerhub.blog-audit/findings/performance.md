# Performance findings: dataengineerhub.blog (2026-11-16)

Method note: PSI public API (keyless) returned HTTP 429 "Queries per day" quota exceeded for all 6 runs (3 pages x mobile/desktop). Local Lighthouse is not installed (nothing installed, per instructions). CrUX API returned 403 without a key (skipped). So there is NO lab Lighthouse and NO field data. All numbers below are curl-measured (single client location, br encoding) or static HTML inspection. LCP, INP, CLS and TBT could not be measured; statements about them are reasoned from payloads only.

Scores (ESTIMATED, not measured): Performance ~75/100 site-wide (article ~70 mobile because of hero, homepage ~85, calculator ~80). Images ~55/100.

## Curl-measured timings (3 runs each, br)
| Page | TTFB | Total | Transfer (br) | Raw HTML | Notes |
|---|---|---|---|---|---|
| / | 0.36-0.47s | 0.36-0.47s | 13.9 KB | 48 KB | cf-cache-status DYNAMIC |
| /articles/snowflake-mcp-server-guide/ | 0.41-0.48s | 0.42-0.48s | 19.7 KB | 85 KB | no-slash URL 308s first (0.30-0.74s hop) |
| /tools/snowflake-cost-calculator/ | 0.42-0.56s | 0.45-0.68s | 6.7 KB | 22 KB | no-slash URL 308s first; DYNAMIC |

TTFB is under the 0.8s good threshold, but HTML is never edge-cached.

## Findings

### 1. HIGH: Article hero image is about 2.8 MB (curl-measured)
Evidence: `https://i0.wp.com/app.dataengineerhub.blog/.../Snowflake-mcp-server-guide.png?fit=1536,1024` returns 2,790,726 B image/webp when Accept includes webp, 3,462,338 B image/png otherwise (Photon TTFB 1.57s on one fetch). It is the preloaded, fetchpriority=high LCP candidate (also in the Link header). The same asset with `?w=800&quality=75` returned 117,438 B webp.
Recommendation: request a sized, quality-capped Photon URL (for example `?w=1200&quality=75`), add srcset 480/800/1200 with correct sizes, target under 150 KB. Largest expected LCP gain on the article (likely over 4s on mobile 4G; unverified).

### 2. MEDIUM: Hero width/height do not match the requested aspect ratio
Evidence: img width=1600 height=900 (16:9) but the source URL is `fit=1536,1024` (3:2). Risk of crop or distortion, and CLS if CSS does not enforce aspect-ratio.
Recommendation: declare dimensions matching the delivered image and set aspect-ratio.

### 3. MEDIUM: Malformed alt attributes on 3 in-body article images
Evidence: `alt="Mcp architecture class="wp-image-3257" loading="lazy"` (missing closing quote). The parsed alt becomes "Mcp architecture class=" plus a junk attribute. Affects mcp_architecture, mcp_before_after, mcp_rbac_oauth. Alt text is also filename-derived, not descriptive.
Recommendation: fix the content pipeline so the quote closes; write descriptive alts. Accessibility and image-SEO issue.

### 4. MEDIUM: In-body image src asks for format=webp but Photon served PNG
Evidence: the three content images returned image/png at 35.6 KB, 36.9 KB, 56.4 KB (curl, no webp Accept). They are lazy, have width/height 943x504 and a srcset (943/300/768): good. Browsers sending Accept webp probably get webp (not verified).
Recommendation: confirm webp/AVIF delivery; acceptable sizes otherwise.

### 5. MEDIUM: AdSense loaded in head on article and calculator pages
Evidence: article line 66 and calculator line 54 have `<script async src=".../adsbygoogle.js?client=ca-pub-8624144810216728">` in head. The homepage instead defers adsbygoogle and Funding Choices via requestIdleCallback (timeout 2500ms), and also carries a head `async` fundingchoicesmessages.google.com script. Strategy is inconsistent. Third-party main-thread cost is not measurable here (no Lighthouse).
Recommendation: reuse the homepage idle/consent-gated loader on all templates; load Funding Choices once; reserve ad slot heights to prevent CLS.

### 6. MEDIUM: Large CSS bundle, blocking on article and calculator
Evidence: one CSS file `/assets/index-pfY-aIQv.css` is 182,707 B raw / 27,594 B br. Homepage loads it non-blocking (media=print onload swap plus noscript); article and calculator use a blocking `<link rel="stylesheet">`. JS (all module, so deferred): index 192,602 raw / 58,245 br, react-vendor 177,322 / 58,987 br, dompurify 30,296 / 11,650 br. About 129 KB br JS on the article (curl-measured); parse/execute raises TBT/INP risk on low-end mobile.
Recommendation: inline critical CSS and swap the rest on article/calculator as on home; split CSS per route (182 KB raw is likely mostly unused); lazy-load dompurify where not needed.

### 7. LOW: Relative `../../` paths in preloads on the article
Evidence: `modulepreload href="../../assets/js/react-vendor-rzpelnZc.js"` and `preload font href="../../fonts/source-serif-4-400.woff2"` on `/articles/slug/`. They resolve correctly today but are fragile.
Recommendation: use root-absolute paths.

### 8. LOW: No font preload on home and calculator
Evidence: homepage declares 4 @font-face (Source Serif 600, Plex Sans 400/500, Plex Mono 400), all `font-display: optional`, self-hosted woff2 (14.8-21.5 KB each). Only the article preloads a font. With `optional`, an uncached first view may keep the fallback font (no CLS).
Recommendation: preload the one or two above-the-fold fonts on home and tool pages. No Google Fonts requests, no FOIT.

### 9. LOW: Conflicting headers on the tool page
Evidence: `/tools/snowflake-cost-calculator/` returns `Cache-Control: public, max-age=3600, stale-while-revalidate=86400, no-store, max-age=0, must-revalidate` and two x-robots-tag headers (`noindex, follow` and `index, follow, max-snippet:-1...`). The 308 response carried three concatenated Cache-Control policies. noindex would win. Project notes say community features are noindexed until AdSense approval; confirm that is intended for this page.
Recommendation: emit one Cache-Control and one x-robots-tag per response (likely header layering between WordPress/Worker/Pages).

### 10. LOW: Canonical vs served URL mismatch (308)
Evidence: canonicals are no-slash, but both pages 308 to the trailing-slash URL. Extra round trip for any no-slash link.
Recommendation: align canonical, internal links and sitemap with the served form.

### 11. LOW: HTML not edge cached
Evidence: cf-cache-status DYNAMIC on all three pages (Cache-Control max-age=3600 with swr). Assets are HIT.
Recommendation: add a Cloudflare Cache Rule for HTML to cut TTFB.

## Passes
- Compression: brotli on HTML, CSS, JS; woff2 fonts.
- /assets and /fonts: `Cache-Control: public, max-age=31536000, stale-while-revalidate=86400, immutable`, cf-cache-status HIT, hashed filenames (curl-measured). Exception: `/logo.png` 48.6 KB, max-age=14400, used as favicon and apple-touch-icon (use a smaller icon).
- Homepage has 0 img; nav and hero are static HTML outside #root, so LCP is text (likely good; unverified).
- Article images: 5 img, all have alt (3 malformed), all have width/height, 4 of 5 lazy; hero eager with fetchpriority=high. Gravatar 1,387 B.
- Resource hints present (preconnect app.dataengineerhub.blog, dns-prefetch ad domains). Consent Mode defaults set before ad scripts.
- No gtag.js (googletagmanager) tag in static HTML; analytics loader is presumably injected by the JS bundle, so analytics impact was not assessed.

## Core Web Vitals status
LCP, INP, CLS: NOT MEASURED. No pass/fail claimed. Re-run PSI with an API key (or the PSI web UI) and check Search Console's CWV report.
