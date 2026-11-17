# Technical SEO re-audit: https://dataengineerhub.blog/ (2026-11-17)

Method: curl only (UA Mozilla/5.0), about 64 requests, 1s apart, read-only. No render tool, so JS rendering inferred from raw HTML. Core Web Vitals not measured.

Score: 92/100 (baseline 78, delta +14)

## Baseline findings, re-tested

| # | Baseline finding | Status | Evidence |
|---|---|---|---|
| 1 | Sitemap and canonical URLs 308 to slash form (High) | Fixed | Sitemap (127 URLs, lastmod 2026-11-16) uses slash URLs. 43 sampled URLs (all 22 non-article pages plus 18 articles plus 1 extra) all return 200 with no redirect, canonical equals the requested URL exactly, og:url matches, exactly 1 H1. Non-slash /articles/airflow-vs-prefect still 308 to /articles/airflow-vs-prefect/ (single hop, expected Pages behavior, now consistent with canonical). |
| 2 | www serves 200 (Medium) | Fixed | https://www.dataengineerhub.blog/ returns 301 to https://dataengineerhub.blog/. http://www.dataengineerhub.blog/articles/airflow-vs-prefect/ returns 301 straight to the https apex slash URL (one hop). http://dataengineerhub.blog/ returns 301 to https apex. |
| 3 | Double slash returns 200 (Low) | Not fixed | /articles//airflow-vs-prefect/ returns 200. Mitigated by correct canonical. /Articles/airflow-vs-prefect/ is 404, /articles/airflow-vs-prefect/index.html is 308 to slash form (fine). |
| 4 | Typos in live slugs (Low) | Not fixed (optional) | /articles/2extract-web-scraping-python-mcp still live (308 to slash, then 200). No rename done. I could not test an old renamed slug because I have no list of legacy slugs, so "legacy slugs 301 straight to slash" is unverified beyond the www case. |
| 5 | Duplicate RSS alternate link (Low) | Fixed | 3 sampled articles each have exactly 1 rss+xml alternate link (/rss.xml, title "DataEngineer Hub RSS"). |
| 6 | Sitemap article count, changefreq/priority (Low) | Not fixed | 104 article URLs of 127, all 127 entries still carry changefreq. Harmless, ignored by Google. Missing-article question not re-checked (see new finding N1 for one concrete mismatch). |
| 7 | CSP minimal, no script policy (Info) | Not fixed (accepted) | Article response: content-security-policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'. HSTS max-age=31536000; includeSubDomains, x-frame-options DENY, nosniff, referrer-policy strict-origin-when-cross-origin, permissions-policy all present. |
| 8 | AI crawler / Content-Signal (Info) | Unchanged | robots.txt still Content-Signal search=yes, ai-input=yes, ai-train=yes. The same content-signal is also sent as a response header. Cloudflare-prepended Disallows not visible in the served robots.txt (no GPTBot/ClaudeBot Disallow seen in the first 40 lines; full file not diffed). |

Other baseline positives re-confirmed: robots.txt 200 with Allow: / and sitemap-index.xml plus llm-sitemap.json declared; sitemap-index.xml 200 pointing to sitemap.xml; real 404s (/nope-xyz/ and /articles/this-does-not-exist-xyz/ return 404, title "Page Not Found", robots "noindex, follow"); llms.txt 200 text/plain, rss.xml 200 application/xml; viewport present on prior audit.

## Leaked noindex header check

None of the 43 sampled URLs returned an X-Robots-Tag header. All 8 allowlisted cheat sheets in the sitemap (snowflake-sql, sql-window-functions, dbt-commands, airflow-essentials, python-for-data-engineers, databricks, data-modeling) and all 5 allowlisted tools (snowflake-cost-calculator, cloud-data-warehouse-cost-comparison, sql-playground, databricks-cost-calculator, bigquery-cost-calculator) return 200, self-canonical, robots meta "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1", no X-Robots-Tag. Fixed. Note: 7 cheat sheets are in the sitemap, not 8 (see N1).

## New findings

| ID | Severity | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| N1 | Medium | The allowlisted cheat sheet snowflake-best-practices is NOT indexable and not in the sitemap | https://dataengineerhub.blog/cheatsheets/snowflake-best-practices/ returns 200, canonical self, robots meta "noindex, follow", no X-Robots-Tag, absent from sitemap.xml | If it was meant to be allowlisted, remove its noindex meta (likely a per-slug holdout list or the page component) and add it to the sitemap. If it is intentionally held out, drop it from the allowlist and ignore this item. |
| N2 | Low | Pre-rendered static HTML for tools and cheat sheets carries an index meta while some siblings are held out via meta only | Held-out pages rely on meta noindex plus header rules; allowlist is consistent for the 12 tested pages, so no defect found. Informational check that the two mechanisms stay in sync. | Keep the CI gate that compares the sitemap list with noindex output. |
| N3 | Low | No security.txt | /.well-known/security.txt returns 404 | Optional. Add a minimal security.txt. |
| N4 | Info | Article hero image served from the WordPress origin via Jetpack CDN, with `Link: rel=preload` on it | Link header: https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/... rel=preload as=image; 27 wp-content references in the airflow-vs-prefect page | Fine for LCP (preloaded). Dependency on the WP origin is a single point of failure; consider mirroring hero images to Pages. |
| N5 | Info | Access-Control-Allow-Origin: * and cache-control public max-age=3600 on HTML | Article response headers | Acceptable. Short HTML cache is good for fast updates. |

Internal links: 3 sampled articles (airflow-vs-prefect, dbt-tests-pass-bad-data, snowflake-interactive-tables-guide) contain internal links only in trailing-slash form (every non-asset internal path ends in /); a search for slash-less internal hrefs returned none, so no internal link triggers a 308. Structured data present on articles (Article, BreadcrumbList, WebPage, WebSite, Organization, Person, FAQPage, Speakable), not validated against Google's rich results tool. Agent discovery: llms.txt, llms-full.txt, llm-sitemap.json all 200.

## Category scores

| Category | Score | Note |
|---|---|---|
| Crawlability | 95 | robots, index and sitemap clean, no stale declarations |
| Indexability | 92 | canonical equals served URL everywhere sampled; N1 mismatch |
| Security | 90 | HSTS, XFO, CSP (minimal), nosniff, referrer and permissions policies |
| URL structure | 90 | consistent slash form, single-hop redirects, double slash still 200 |
| Mobile | 95 | unchanged from baseline, not re-tested |
| Core Web Vitals | not measured | hero preload present |
| JS rendering | 95 | static HTML with full content and 1 H1 on every sampled page |
| Structured data | 85 | present, not validated |

Overall: 92/100.

## Top remaining issues
1. N1: snowflake-best-practices cheat sheet is noindex and missing from the sitemap despite being allowlisted.
2. Double-slash paths (/articles//slug/) still return 200 instead of 301 (low, canonical mitigates).
3. Typo slugs and sitemap changefreq/priority unchanged (low); CSP has no script policy (info).
