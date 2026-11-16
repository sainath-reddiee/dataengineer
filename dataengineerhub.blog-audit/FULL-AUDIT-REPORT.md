# Full SEO Audit: dataengineerhub.blog

Audit date: 2026-11-16. Live site, checked with curl and raw HTML. The plugin render tool was unavailable ("runtime not ready"), so client-side-only content was not inspected. Per-specialist detail is in `findings/`.

## Executive summary

**SEO Health Score: 71/100.** Business type: independent publisher (single-author technical blog) with free calculators, cheat sheets and a sponsorship program.

| Category | Weight | Score | Source |
|---|---|---|---|
| Technical SEO | 22% | 78 | technical.md (measured) |
| Content Quality | 23% | 66 | content.md (8 articles read, 103 checked in bulk) |
| On-Page SEO | 20% | 74 | content.md |
| Schema | 10% | 66 | schema.md (13 pages) |
| Performance (CWV) | 10% | 75 (estimate) | performance.md, no CWV measured |
| AI Search Readiness | 10% | 74 | plans/GEO-ANALYSIS.md |
| Images | 5% | 55 (estimate) | performance.md |

Weighted: 17.2 + 15.2 + 14.8 + 6.6 + 7.5 + 7.4 + 2.8 = 71.4. Performance and Images are estimates; PageSpeed Insights returned 429 on every run and no Lighthouse or CrUX data was available, so no Core Web Vitals pass or fail is claimed.

Not run: seo-visual (no Playwright), seo-sitemap and seo-sxo as separate agents (sitemap covered by technical), seo-backlinks, seo-google (no credentials checked), seo-agentic (discovery files verified present in the GEO pass).

Note on the branch: two findings below (no visible Updated date, schema headline differs from H1) are fixed in commit f330b4c on branch `geo-readiness-fixes`, which is pushed but not merged or deployed. Scores reflect the live site.

### Top 5 critical and high issues

1. **Trailing-slash canonical loop (High).** All 40 sampled sitemap URLs and canonicals are non-slash and 308 to the slash URL, whose canonical points back to the non-slash form. Pick one form.
2. **Legacy 2025 articles are thin, generic, and partly unsourced (High).** 21 articles, median 1,165 words, 16 not edited since 2025; some have "2026" titles with 2025 modified dates.
3. **Possible factual errors (High, verify first).** The content specialist reports the DuckDB article misstates Snowflake's 60-second minimum billing (applies per warehouse resume, not per query) and the Tasks article says failed tasks cannot be retried although `EXECUTE TASK ... RETRY LAST` exists. Check against current Snowflake docs before editing.
4. **Guest post attribution and link hygiene (High).** The guest post's Article schema names Sainath as author, and its link to the guest's product lacks `rel="sponsored"` or `nofollow`.
5. **Hero images are huge (High for performance).** The preloaded article hero is 2.79 MB webp; the same image at `w=800&quality=75` is 117 KB.

### Top 5 quick wins

1. Make the sitemap list URLs that return 200 directly (one config or generator change).
2. Request the hero image with `w=800` or `srcset` sizing (Photon query params).
3. Merge and deploy `geo-readiness-fixes` (Updated byline, schema headline, robots rules).
4. Correct declared image sizes in Article schema (pages declare 1200x630; real files are 491x274, 660x368, 1536x1024; `/og-image.jpg` is actually 1024x1024).
5. 301 `www.dataengineerhub.blog` to the apex.

## Technical SEO (78)

Works: HTTP 301 to HTTPS, HSTS, real 404s with noindex, valid robots.txt, self-canonicals, one server-rendered H1 per page across 51 sampled URLs, viewport meta, no hreflang (correct for a single-language site).

Findings: slash/non-slash 308 loop (High); `www` returns 200 instead of 301 (Medium); double-slash paths return 200, duplicate RSS alternate links in head, slug typos (`2extract`, `augumented`, `brekage`), CSP sets only frame-ancestors/object-src/base-uri (Low). The sitemap lists 103 to 104 articles while the build produces 119 pages; the gap is probably the 9 noindexed pages plus others, so confirm it is intentional. Not verified: IndexNow key file, Cloudflare AI Crawl Control behavior for real bot IPs.

## Content Quality (66) and On-Page SEO (74)

Works: strong first-hand writing and TL;DR blocks in 2026 posts; no templated metadata or duplicate descriptions; every image has alt text; one H1 per article except one sales page; E-E-A-T estimate: Experience 74, Expertise 62, Authoritativeness 48, Trust 62.

Findings beyond the top five: pasted source names and two `#` links in the Tasks article; `/about` lacks a photo, profile links and concrete credentials, and the author box says "5+ years" while schema says "4+ years" (Medium); auto-generated FAQ questions that are really headings, such as "What the MCP Server Actually Is?", on about 30 articles (Medium); the MCP guide title does not match its content and overlaps the FastMCP article (Medium); near-duplicate interview-question pairs; one sales page with 12 H1s; article count shown as 115+, 104 and 103 in different places; homepage meta description is 256 characters; four titles over 60 characters (longest 102); two legacy posts skip heading levels (Low).

## Schema (66)

Works: every JSON-LD block parses, absolute https URLs, valid breadcrumbs, FAQ answers match visible text.

Findings: live Article headline equals the SEO title, not the H1, on all 7 sampled articles (fixed on branch); declared image sizes wrong (Medium); author `@id` mismatch (`about#person` vs `#author`) and publisher Organization has no `@id`, so the entity graph is fragmented (Medium); wrong `articleSection` on delta-lake-vs-iceberg ("Airflow") and keyword typo "perfect" on airflow-vs-prefect (Medium); SoftwareApplication has no rating so no rich result (Low). Info: HowTo and FAQPage rich results are retired or restricted, so treat that markup as context only.

## Performance (75, estimate) and Images (55, estimate)

All figures curl-measured: TTFB 0.30 to 0.56 s; brotli on; `/assets` and `/fonts` immutable with cache HIT; HTML `DYNAMIC` at Cloudflare. Issues: 2.79 MB hero; declared hero 1600x900 vs fetched 3:2 crop; three in-body images with malformed alt (`alt="Mcp architecture class="...`); 182 KB (27.6 KB br) render-blocking CSS on article and calculator pages; Funding Choices loaded twice on the homepage; tool pages send conflicting Cache-Control and x-robots-tag (`noindex` and `index`). Fonts are self-hosted with `font-display: optional`; no CLS risk found.

## AI Search Readiness (74)

See `plans/GEO-ANALYSIS.md`. All search and training bots are allowed, llms.txt and the agent discovery files exist, and article HTML is server-rendered. Gaps are tables, question-form headings, off-site brand presence (unmeasured) and visible update dates.

## What was not covered

Core Web Vitals field data, backlinks, Search Console and GA4 data, visual and mobile screenshots, intent-match analysis (SXO), and any JavaScript-injected markup.
