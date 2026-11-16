# Cloudflare hardening checklist (post-migration)

Written 2026-11-16 after the SEO audit. Items 1 to 4 need the Cloudflare dashboard; the repo already handles everything else.

## What the repo now handles

- Canonicals, og:url, schema URLs and sitemap entries use the trailing-slash URL that Pages serves with 200 (Pages 308s the bare form).
- Internal `<a href>` links in the Pages bundle are rewritten to the slash form at `pages:prepare` time (`scripts/lib/slashLinks.js`), only when `dist-pages/<path>/index.html` exists.
- `_redirects`: every 301 target is the slash form (no 301 then 308 chain) and both the bare and slash source are listed, so an old URL with a trailing slash does not 404.
- `_headers`: Pages MERGES headers from every matching rule, it does not let a specific rule override a wildcard. The old `/tools/*` and `/cheatsheets/*` noindex wildcards were therefore sending `x-robots-tag: noindex` on the pages that are meant to be indexed. Held-out slugs are now listed one by one. When you add a new tool or cheat sheet, it is indexable by header by default; add an explicit noindex block here if it should be held out.
- `node scripts/verifyLiveMigration.js` (npm run test:live-migration) checks all of this against the live site.

## 1. www to apex redirect (High) - DONE 2026-11-16

Done through the dashboard: `www` removed from the Pages custom domains and two redirect rules created (`www to apex` for `https://www.dataengineerhub.blog/*`, `www http to apex` for `http://www.dataengineerhub.blog/*`, both 301 to `https://dataengineerhub.blog/${1}` with query preserved). Verified with curl for http and https. The original instructions are kept below for reference.


`https://www.dataengineerhub.blog/` currently returns 200, so every URL exists twice. Canonicals soften it, but fix it at the edge.

Cloudflare dashboard, the dataengineerhub.blog zone: Rules, Redirect Rules, Create rule.

- Name: www to apex
- When: Hostname equals `www.dataengineerhub.blog`
- Then: Dynamic, expression `concat("https://dataengineerhub.blog", http.request.uri.path)`, status 301, tick "Preserve query string"

Make sure the www DNS record is proxied (orange cloud), otherwise the rule never sees the request.

## 2. Double-slash paths (Low)

`/articles//x/` returns 200, which creates duplicate URLs. Free plans can use `wildcard_replace`:

- When: URI Path contains `//`
- Then: Dynamic, `wildcard_replace(http.request.uri.path, "*//*", "${1}/${2}")`, 301

It collapses one pair per hop and the browser repeats, which is fine for a rare case. Skip it if you would rather not maintain it.

## 3. Check bot and AI-crawler settings (High, 2 minutes)

- Security, Bots: Bot Fight Mode must not challenge Googlebot, AdSense (Mediapartners-Google) or Bingbot. Verified bots are allowed by default; confirm nothing custom overrides this.
- Security, Settings (or AI Crawl Control): robots.txt asks AI search bots to be allowed. If Cloudflare is set to block AI crawlers or to manage robots.txt, it prepends Disallow rules that override `public/robots.txt`. Compare `https://dataengineerhub.blog/robots.txt` live against the repo file; the live one should start with `# robots.txt - DataEngineer Hub`.
- Scrape Shield: turn off Email Address Obfuscation if it rewrites mailto links. Speed: leave Rocket Loader off (it delays module scripts and AdSense).

## 4. Caching (Info)

HTML shows `cf-cache-status: DYNAMIC`, which is normal for Pages. Do not add a Cache Everything rule for HTML: deploys would serve stale pages. Assets under `/assets` and `/fonts` are already immutable with cache HITs.

## 5. After you deploy

1. `npm run test:live-migration` should print "Live migration checks passed". Before the deploy it reports the 308 hops, which is expected.
2. Search Console: resubmit `https://dataengineerhub.blog/sitemap.xml`. Use URL Inspection, then Request Indexing, on `/tools/snowflake-cost-calculator/`, `/tools/sql-playground/` and `/cheatsheets/snowflake-sql/`. They were being served with a noindex header and need a recrawl.
3. Watch Pages, Indexing for "Alternate page with proper canonical" and "Page with redirect" counts falling over the next 2 to 4 weeks.

## Not changed on purpose

- CSP stays `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`. A script-src policy would have to allow AdSense, Funding Choices, Giscus and inline bootstraps; introduce it as `Content-Security-Policy-Report-Only` with a report endpoint first.
- RSS and `llm-sitemap.json` keep their existing non-slash article URLs. Changing feed item URLs can republish items in readers; the links redirect correctly.
- Slug typos (`2extract`, `augumented`, `brekage`) need the WordPress slug changed, then a new `_redirects` line from the old slug.
