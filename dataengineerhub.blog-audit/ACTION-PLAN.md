# Action Plan: dataengineerhub.blog

Health score 71/100 (live site, 2026-11-16). Items marked [branch] are already fixed on `geo-readiness-fixes` and need merge and deploy.

## Critical

None found. Nothing blocks indexing.

## High (within 1 week)

1. Resolve the trailing-slash loop: make sitemap and canonicals use the form that returns 200 (or make the canonical match the form Cloudflare serves). Re-verify with curl on 10 URLs. Effort: low.
2. Resize the article hero: serve `w=800` (or a `srcset`) instead of the 2.79 MB original; fix declared width/height to the real aspect ratio. Effort: low to medium.
3. Verify and correct the two reported factual errors (DuckDB billing example, Tasks retry claim) against current Snowflake docs. Remove or source the unlinked "80%", "70%", "58%/35%" statistics. Effort: medium.
4. Guest post: set the Article author to the real guest author, and mark links to the guest's product `rel="sponsored nofollow"`. Effort: low.
5. Merge and deploy `geo-readiness-fixes` [branch]: visible Updated date, schema headline equals H1, Claude-SearchBot and Applebot rules.

## Medium (within 1 month)

6. Triage the 21 legacy 2025 articles: rewrite with sources and first-hand detail, merge near-duplicates (interview-question pairs), or noindex. Fix "2026" titles whose content last changed in 2025.
7. Fix schema entity graph: one author `@id`, give the publisher Organization an `@id`, correct `articleSection` (delta-lake-vs-iceberg) and the "perfect" keyword typo, and declare real image dimensions. Replace `/og-image.jpg` with a true 1200x630 file.
8. Rework `/about`: photo, profile links, concrete credentials (certification names and dates only if true), and reconcile "5+ years" vs "4+ years".
9. Rewrite auto-generated FAQ questions that are headings; keep only real questions. Effort: medium (generator in `scripts/generateFAQSchema.js`).
10. `www` to apex 301 at Cloudflare. Remove duplicate RSS alternate links and the duplicate Funding Choices load.
11. Fix the Tasks article: pasted source names, two `#` links. Fix three malformed image alt attributes.
12. Retitle the MCP guide so title, H1 and content agree, and differentiate it from the FastMCP article.
13. Add tables and question-form headings to the articles in `plans/geo-worklist.json` (WordPress edit).

## Low (backlog)

14. Trim homepage meta description (256 characters) and four titles over 60 characters.
15. Fix slug typos (`2extract`, `augumented`, `brekage`) with 301s and updated internal links.
16. Normalize the article count shown on site (115+, 104, 103) to one generated figure.
17. Collapse the 12 H1s on the sales page; fix skipped heading levels on two legacy posts.
18. Tighten CSP; resolve conflicting Cache-Control and x-robots-tag headers on tool pages; double-slash paths should 404 or redirect.
19. Avoid indexed articles linking to noindexed pages.

## Ongoing

- Re-run PageSpeed Insights with an API key to get real LCP, INP and CLS, then re-score Performance.
- Connect Search Console and GA4 to replace estimates with field data.
- Off-site presence (YouTube, Reddit, community answers) is the main unmeasured authority lever.
- Re-run `node scripts/auditGeoReadiness.js` after each content batch.

## Status after code fixes (branch geo-readiness-fixes, not yet deployed)

Fixed in code: X-Robots-Tag noindex leaking onto the allowed tool and cheat-sheet pages (found after the audit, see below); trailing-slash canonicals, og:url, schema URLs and sitemap now use the slash form that returns 200; hero image resized; guest author in byline, schema and bio; rel="sponsored nofollow" on sponsored and guest-product links; schema ids unified (#author, #organization); declared image sizes corrected and a real 1200x630 default share image; duplicate RSS link; auto-generated FAQ questions tightened; body H1 demoted to H2; broken alt quote; homepage description shortened; article count fallback synced.

Still needs you: WordPress content edits (factual checks, tables, question headings, legacy 2025 articles, Tasks article pasted names and "#" links, wrong articleSection and tag typo), /about credentials, slug typo renames with 301s, www to apex 301 and double-slash handling at Cloudflare, CSP tightening, and merge and deploy.

Late finding (High, now fixed in public/_headers): Cloudflare Pages merges headers from every matching rule, so the /tools/* and /cheatsheets/* noindex wildcards combined with the per-page "index" rules and the live allowed pages (snowflake-cost-calculator, snowflake-sql and similar) were served with x-robots-tag: noindex, follow. Held-out slugs are now listed one by one.
