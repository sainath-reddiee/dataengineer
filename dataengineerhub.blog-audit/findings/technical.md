# Technical SEO findings: https://dataengineerhub.blog/ (2026-11-16)

Method: curl (UA Mozilla/5.0), about 60 requests, read-only. render_page.py was unavailable, so JS rendering was inferred from raw HTML only.
Score: 78/100

## What works
- HTTPS enforced: http:// returns 301 to https://. HSTS max-age=31536000; includeSubDomains.
- Headers present on HTML and sitemaps: x-frame-options DENY, CSP (frame-ancestors 'none'; object-src 'none'; base-uri 'self'), nosniff, referrer-policy strict-origin-when-cross-origin, permissions-policy.
- Real 404s: /articles/this-does-not-exist-xyz and /nope-xyz return HTTP 404 with "Page Not Found" title and robots noindex, follow.
- robots.txt is valid, declares allow-all, blocks only /api/, /admin/, /debug, /practice/*/q/ etc. Held-out sections stay crawlable so noindex can be seen (correct).
- sitemap-index.xml (200) points to sitemap.xml (200, 127 URLs, lastmod 2026-11-15). 103 image entries. No hreflang (correct for single-language site).
- Sample of 51 sitemap URLs: all end at 200, all have self-referencing canonical, robots "index, follow, max-image-preview:large", exactly 1 H1, and substantial server-rendered body text (40-117 <p> tags per article in raw HTML). Pre-rendering works; key content is not JS-dependent.
- Viewport meta present (width=device-width, initial-scale=1.0). html lang="en".
- Clean lowercase hyphenated URL structure, no query params, flat /articles/slug.
- llms.txt, rss.xml reachable (200).

## Findings

### 1. High: canonical and sitemap URLs 308-redirect to a different (trailing-slash) URL
- Evidence: https://dataengineerhub.blog/articles/delta-lake-vs-iceberg returns 308 Location /articles/delta-lake-vs-iceberg/ (200 at the slash form). That slash page declares canonical https://dataengineerhub.blog/articles/delta-lake-vs-iceberg (no slash). Same for /contact, /cheatsheets, /tools/*, all 40 sampled non-homepage sitemap URLs.
- Impact: every sitemap URL is a redirect; the canonical points at a URL that redirects to the page declaring it. This is a redirect/canonical loop signal. Google usually resolves it but it wastes crawl budget, triggers "Page with redirect" reports in Search Console, and can weaken canonical trust.
- Recommendation: pick one form. Easiest on Cloudflare Pages: emit pre-rendered files as /slug.html (or flatten to non-directory output) so non-slash URLs serve 200 directly, or add a _redirects/rule that serves non-slash with 200. Alternative: switch sitemap, canonical, og:url, internal links and JSON-LD to the trailing-slash form. Verify afterwards that the sitemap URL returns 200 with no redirect.

### 2. Medium: www host serves 200 instead of redirecting to apex
- Evidence: https://www.dataengineerhub.blog/ returns 200; canonical points to apex https://dataengineerhub.blog/.
- Recommendation: add a 301 www to apex (Cloudflare Redirect Rule) to consolidate signals and avoid duplicate hosts.

### 3. Low: duplicate-path variants return 200 / unusual handling
- Evidence: /articles//delta-lake-vs-iceberg/ returns 200 (double slash, no redirect). /articles/delta-lake-vs-iceberg/index.html returns 308 to slash form (fine). /Articles/... returns 404 (acceptable).
- Recommendation: normalize double slashes with a 301; canonical already mitigates.

### 4. Low: typos in live slugs
- Evidence: /articles/2extract-web-scraping-python-mcp, rag-retrieval-augumented-generation-production-guide, data-contracts-schema-brekage-guide.
- Recommendation: optional. Only rename with 301s from the old slug; keyword value is minor, so avoid if backlinks exist.

### 5. Low: duplicate RSS alternate links in head
- Evidence: article head has two rel="alternate" application/rss+xml links to the same /rss.xml with different titles.
- Recommendation: remove one.

### 6. Low: sitemap changefreq/priority and article count
- Evidence: sitemap has 104 articles (127 URLs total) versus roughly 119 expected; changefreq/priority are ignored by Google.
- Recommendation: confirm the 15 missing articles are intentionally excluded (held-out or noindexed) and not an omission; drop changefreq/priority.

### 7. Info: CSP is minimal and lacks a script policy
- Evidence: CSP only sets frame-ancestors, object-src, base-uri. No script-src/default-src.
- Recommendation: optional hardening; adding script-src is risky with AdSense, so apply Report-Only first. Also x-frame-options and CSP were absent on the Link-bearing www response sample output only partially; full headers were present on www.

### 8. Info: robots.txt AI crawler note
- Content-Signal allows ai-train=yes. Confirm Cloudflare AI Crawl Control is not prepending Disallows (the file warns about this); not verified from here.

### Not verified
- Core Web Vitals (no lab tooling), JS-rendered hydration behavior, IndexNow key file, structured data validity (JSON-LD present on articles, 5 script blocks, not validated), hreflang (absent, as intended).
- Held-out sections (glossary, compare, roadmaps, practice) intentionally excluded from defects. /glossary/ returns 200 as expected.

## Scoring
Crawlability 90, Indexability 70 (redirect/canonical conflict), Security 90, URL structure 65, Mobile 95, Rendering 95, Structured data/IndexNow not scored fully. Overall 78/100.
