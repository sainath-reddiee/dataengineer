# DataEngineer Hub: roadmap to AdSense approval and a top-tier site

Last updated 2026-10-17. Work top to bottom; each phase unlocks the next.
"You" means a step only the site owner can do (accounts, writing). "Claude" means code work in this repo.

## Phase 0: Stop the self-inflicted damage (done, on branch `fix/adsense-one-render-noindex`)

- [x] Crawlers and humans get the same page (no user-agent branches, no bot-only code trimming)
- [x] `.htaccess` noindex header uses `SetEnvIf`, which Hostinger's LiteSpeed supports
- [x] robots.txt no longer hides public sections from AdSense crawlers
- [x] TL;DR extractor no longer deletes the body of posts without H2s (3 genuine long posts were noindexed and shown as ~300 words)
- [x] `npm run content:audit` writes `plans/editorial-worklist.md`
- [x] `node scripts/verifyLiveAdsenseReview.js` checks production for all of the above

## Phase 1: Ship it (You, about 30 minutes)

1. Merge the branch to `main` (this triggers the Hostinger deploy).
2. Cloudflare dashboard: Workers & Pages, `dataengineerhub-pseo-router`, Settings, Domains & Routes: delete its routes on `dataengineerhub.blog` (or delete the Worker). It still serves 84 old glossary/compare pages as `index, follow` from R2.
3. Cloudflare: Caching, Purge Everything. Hostinger: purge the LiteSpeed/CDN cache.
4. Run `node scripts/verifyLiveAdsenseReview.js` until it passes.
5. Google Search Console:
   - Resubmit `sitemap-index.xml`.
   - URL Inspection, Request Indexing for the 3 fixed posts: `the-problem-with-data-engineering-certifications-that-nobody-talks-about`, `snowflake-zero-copy-cloning-problems`, `query-snowflake-in-duckdb-cut-costs`.
   - Pages report: watch glossary/compare URLs move to "Excluded by noindex".

## Phase 2: Content, the biggest lever (You, with Claude assisting)

AdSense "low value content" is a judgement on originality and usefulness, not word count.

1. Work through `plans/editorial-worklist.md`, starting with the 57 "Rework first" posts. Target: the top 20 before reapplying.
   - 2026-10-17: copy-edit drafts for the top 20 are in `plans/rework/<slug>.md`. Each keeps your words and claims and fixes headings, filler, em-dashes and unexplained code. For each one: fill every `[ADD YOUR OWN: ...]` marker with your own screenshot, number or error, check the facts listed in its editor notes, then paste it into the WordPress editor (it converts Markdown to blocks) and update the post.
2. For every reworked post, add first-hand evidence: your own screenshots, query profiles, measured costs, and errors you hit.
3. Rewrite in your own voice. Cut stock phrases, most em-dashes, and templated TL;DR blocks.
4. Give posts real H2 section headings (24 posts have fewer than 3).
5. Merge overlapping posts on the same topic and 301 the weaker URL.
   - Done 2026-10-17 (301 in `.htaccess`, `redirects.json`, `excludedSlugs.js`):
     - `dbt-state-skip-unchanged-nodes` to `dbt-state-skip-unchanged-models`
     - `snowflake-mcp-server-agentic-ai-guide-2025` to `snowflake-mcp-server-guide`
     - `advanced-snowflake-interview-questions-experienced` to `snowflake-expert-interview-questions`
     - `snowflake-aiceberg-v3-migration-guide` to `native-tables-to-dynamic-iceberg-v3-snowflake`
     - `airflow-dbt-snowflake-orchestration-guide` to `snowflake-dbt-projects-airflow-orchestration`
     - `snowflake-cortex-token-usage-monitoring` to `snowflake-cortex-ai-hidden-token-costs`
   - You: once the keeper drafts are pasted in (two of them already fold in the merged post's unique section), set the six merged posts to Draft in WordPress. The redirects keep working either way.
   - Still overlapping, left as separate posts for now: the two Time Travel posts, the two zero-copy cloning posts, the two SQL interview posts.
5a. Thin posts (under 800 prose words) are noindexed and, since 2026-10-17, left out of every article list on the site (`src/data/listingHoldouts.js`). A post comes back to the lists by itself once you expand it past 800 words. Currently 9: `snowflake-unique-aggregations-hidden-functions`, `mastering-real-time-etl-with-google-cloud-dataflow`, `snowflake-streams-tasks-pipeline-guide`, `data-pipelines-python`, `snowpro-specialty-gen-ai-practice-exams`, `automated-etl-airflow-python`, `build-databricks-ai-agent-gpt5-guide`, `querying-data-in-snowflake`, `snowflake-intelligence-guide-setup-optimization`. Expand the ones you care about; unpublish the rest.
6. Decide the future of the glossary/compare/quiz/calculator inventory: keep only what you would personally vouch for, and delete the rest (410) instead of hiding it.
7. Strengthen the About page: real photo, LinkedIn, employer history or projects, and why you write.
8. Done (2026-10-17): deleted `.github/workflows/blog-automation.yml`, the unused Gemini placeholder; articles are written by hand. Its 15 GitHub secrets can now be removed in the repo settings (list in [dodo-config.md](dodo-config.md#github-secrets)).

## Phase 3: One render path and better hosting (Claude)

1. Migrate to React Router v7 framework mode with `prerender`, so the same React components build the HTML and hydrate it. Articles first, then home/listings, then tools and cheat sheets.
2. Move WordPress fetches from `useEffect` hooks to route loaders (build-time data).
3. Retire `generateStaticPagesIncremental.js`, the Puppeteer prerender plugin, and the HTML-parking utilities.
4. Move the public site to Cloudflare Pages (free, commercial use allowed; confirm current terms): atomic deploys and preview URLs, with no FTP half-uploads.
   - Load the DuckDB `.wasm` files (34 MB and 39 MB) from jsDelivr: Pages caps files at 25 MiB.
   - Port `api/og-practice-result.js` to a Pages Function.
   - Replace `.htaccess` with `_redirects` and `_headers`.
   - WordPress stays on Hostinger at `app.dataengineerhub.blog`.

## Phase 4: Reader experience polish (Claude)

- Performance budget: LCP under 2.5 s on 4G, CLS under 0.1, INP under 200 ms, JS under 170 KB gzipped on article pages.
- Reading layout: 65 to 75 character line length, clear heading hierarchy, sticky table of contents on desktop, copy buttons on code.
- Images: explicit width/height, modern formats, lazy-loaded below the fold.
- Fewer CTAs and promos inside articles. One newsletter prompt at the end, no popups.
- Accessibility pass: contrast, focus states, alt text, keyboard navigation.

## Phase 5: Compliance, then reapply (You and Claude)

1. Replace the custom cookie banner with AdSense's own "Privacy & messaging" GDPR message (a Google-certified consent platform, required for EEA/UK/Switzerland traffic).
   - You, in AdSense: Privacy & messaging > European regulations > Create message. Select dataengineerhub.blog, language English, privacy policy URL `https://dataengineerhub.blog/privacy-policy`, user choices "Consent" and "Manage options" (add "Do not consent" too), then Publish. If the site cannot be selected yet because it is not approved, do this right after approval: ads do not serve before then anyway.
   - Optional: Privacy & messaging > US state regulations, same site.
   - Claude, the same day: remove the custom banner (`#deh-cookie-banner` in `index.html` and `src/components/CookieConsent.jsx`), keep the Consent Mode defaults, add a footer "Privacy settings" link that reopens Google's message, and update the cookie section of the Privacy Policy. Two banners must never show together.
   - The consent banner is a compliance requirement for serving ads in Europe. It is not why the site was rejected for low value content.
2. Make sure the AdSense code is present on the homepage as Google's standard tag (Claude).
3. Code freeze from 2026-10-17: no new features, layout changes, URL changes or redirects until the decision. Only post edits in WordPress, the consent cutover and fixes for anything broken. Earliest sensible reapply: 2026-11-07 to 2026-11-14, if the top 20 are done.
4. Reapply only when all of these are true:
   - The live check passes.
   - Search Console shows the template pages excluded.
   - The top 20 posts are reworked.
   - The site has been stable for 2 to 4 weeks.

Approval is Google's decision and nothing here guarantees it. These steps remove every problem found in the codebase audit.
