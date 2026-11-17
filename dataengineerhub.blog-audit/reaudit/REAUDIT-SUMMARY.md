# Re-audit summary: dataengineerhub.blog

Re-audit run 2026-11-17 against the live site after the fixes in commits fb46d40 through c0fbe19. Five specialists re-tested the baseline findings (curl and raw HTML only; the plugin render tool and PageSpeed Insights were unavailable, so no Core Web Vitals were measured). Detail per area is in the sibling files: `technical.md`, `content.md`, `schema.md`, `performance.md`, `geo.md`.

## Scores

| Category | Weight | Baseline | Now | Change | Basis |
|---|---|---|---|---|---|
| Technical SEO | 22% | 78 | 92 | +14 | measured |
| Content Quality | 23% | 66 | 68 | +2 | 103 articles crawled |
| On-Page SEO | 20% | 74 | 76 | +2 | 103 articles crawled |
| Schema | 10% | 66 | 80 | +14 | 12 pages |
| Performance | 10% | about 75 | about 82 | +7 | estimated (no CWV data) |
| AI Search Readiness | 10% | 74 | 78 | +4 | measured checklist |
| Images | 5% | about 55 | about 80 | +25 | estimated |

**SEO Health Score: 79/100 (was 71).** Weighted: 20.2 + 15.6 + 15.2 + 8.0 + 8.2 + 7.8 + 4.0. Performance and Images are estimates, so treat the total as about 79.

## Confirmed fixed on the live site

- Trailing-slash loop: all sampled sitemap URLs return 200 directly with a self canonical; no leaked `noindex` header.
- www and http://www redirect to the apex in one hop; legacy slugs reach their target without a chain.
- Indexable tools and cheat sheets send no noindex header; held-out pages send noindex on the URL that returns 200.
- Article schema headline equals the H1; one shared `#author`, `#organization`, `#website` id; no false image sizes; guest authors credited correctly; sponsored links marked.
- Hero image 2.79 MB to 271 KB; default share image is a real 1200x630; one H1 per article; broken alt quotes fixed.
- Visible "Updated" dates match `dateModified` on every article that has a real revision.

## Fixed after the specialists ran (verify live after the final deploy)

- Double-slash URLs: now 301 to the single clean URL in at most 3 hops, query preserved (Cloudflare rule "collapse double slashes", uses the raw path because Cloudflare normalizes the ordinary one).
- `/contributors` redirect loop (found by this re-audit): `_redirects` wildcard also matched `/contributors/`; now `/contributors/:slug`.
- 305 links to draft files in the public GitHub repo (found by this re-audit) rewritten to in-page anchors and `/articles/` URLs; 3 unrelated links remain.

## Still open

| Item | Severity | Who |
|---|---|---|
| `/cheatsheets/snowflake-best-practices/` is allowlisted but has only 563 prose words (rule: 800), so it is noindex and not in the sitemap | Medium | decide: add content or drop from allowlist |
| 21 thin 2025 articles; factual errors in the DuckDB and Snowflake Tasks posts; pasted source names and `#` links in the Tasks post | High | owner (WordPress) |
| 3 articles dated 2025 carry "2026" in the title and "2025" in the H1 | High | owner (WordPress) |
| Two commercial guest posts have no disclosure line | High | owner (WordPress) |
| About half of 250 body images use filename-style alt text | Medium | owner (WordPress) |
| Auto-generated FAQ questions on about 31 pages (kept, your tests require it) | Medium | owner decision |
| Openers are not answer-first; 11 of 20 sampled articles have no table; title and H1 differ on 17 of 20 | Medium | owner (WordPress) |
| Featured images under 1200px wide; wrong articleSection on delta-lake-vs-iceberg; tag "perfect" on airflow-vs-prefect | Medium | owner (WordPress) |
| llms.txt says "SnowPro certified"; /about and the schema never mention it | Medium | owner to align |
| 182 KB render-blocking CSS and about 129 KB compressed JS on article pages | Medium | engineering |
| AdSense and Funding Choices scripts load in the head | Low | kept on purpose (crawler visibility) |
| Typo slugs (2extract, augumented, brekage), sitemap changefreq, minimal CSP | Low | owner / later |
| HowTo markup on two articles; no per-article `@id` or `@graph`; /about is a generic WebPage | Low | optional |

## Not measured

Core Web Vitals (no field data, PSI rate-limited), client-injected structured data, backlinks, Search Console numbers since the fixes deployed.
