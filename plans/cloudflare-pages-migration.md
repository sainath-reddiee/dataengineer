# Cloudflare Pages migration — DataEngineer Hub

Last updated 8 Nov 2026 after the production Pages deploy and custom-domain attach.

WordPress stays on Hostinger at `app.dataengineerhub.blog` forever.

## What is already true

| Piece | Status |
|---|---|
| Cloudflare proxy on `dataengineerhub.blog` | On (`Server: cloudflare`, `CF-RAY`). HTML is `cf-cache-status: DYNAMIC` — proxy only, origin still Hostinger. |
| Hostinger origin | Live. Headers include `platform: hostinger`, `x-turbo-charged-by: LiteSpeed`. |
| Workers & Pages project `dataengineerhub` | Created. Preview host: `https://dataengineerhub.pages.dev` (noindexed in `public/_headers`). |
| Worker routes on the zone | **None.** The old `dataengineerhub-pseo-router` is not intercepting. R2 bucket `dataengineerhub-pseo` still exists; leave it. |
| Wrangler CLI | Needs `npx wrangler login` once (Allow in the browser). |
| GitHub Actions | Hostinger FTP still default. Opt in with workflow input **deploy_cloudflare** or repo variable `ENABLE_CLOUDFLARE_PAGES=true`. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. |
| Account ID | `3734dc24feea2731e5f52e0e769d0deb` (also shown on Workers & Pages). |

## What Pages fixes vs what it does not

Fixes: TTFB (edge HTML, no India/Hostinger origin hop), atomic deploys (no FTP half-uploads), `_headers` cache (`/assets/*` 1 year, HTML 1 hour + SWR), consistent 404s.

Does not fix: AdSense in-page Auto ads CLS, React article JS weight, DuckDB’s 32 MB first download.

## Architecture after cutover

```
Visitor
  → Cloudflare edge (Pages: HTML + hashed assets)
  → app.dataengineerhub.blog  (Hostinger WordPress, unpublished API)
  → pagead2 / giscus / jsDelivr (DuckDB wasm only)
```

Build still happens in GitHub Actions (`npm run build` then `npm run pages:prepare`). Cloudflare does **not** run the Vite/SSG build — the SSG needs WordPress and is too large for Pages’ native build.

## One-time dashboard (done / remaining)

1. [x] Workers & Pages → Create → Continue to Pages → Direct Upload → project name `dataengineerhub` → Create project.
2. [x] Do **not** drag the full `dist/` in the dashboard (DuckDB wasm > 25 MiB; upload will fail). Deploy with Wrangler / Actions.
3. [x] GitHub secret `CLOUDFLARE_API_TOKEN` added (Pages write).
4. [x] GitHub secret `CLOUDFLARE_ACCOUNT_ID` = `3734dc24feea2731e5f52e0e769d0deb`.
5. [ ] GitHub → Settings → Variables → `ENABLE_CLOUDFLARE_PAGES` = `true` so every `main` deploy also uploads `dist-pages`.

## First deploy (preview only)

On a machine that is wrangler-logged-in:

```powershell
npx wrangler login
npm run build:force
npm run pages:prepare
npx wrangler pages deploy dist-pages --project-name=dataengineerhub --branch=main
```

Or GitHub Actions → **Build and Deploy to Hostinger** → **deploy_cloudflare** = true (still uploads FTP as well until you skip it).

Check:

- `https://dataengineerhub.pages.dev` homepage H1
- `/articles/incremental-data-processing-vs-full-refresh` full HTML, not a spinner
- A missing slug `/articles/this-does-not-exist` returns **404**, not the homepage
- `/glossary/snowflake` is `noindex`
- `/tools/sql-playground` loads (wasm from jsDelivr)

## DNS cutover

1. [x] Pages project `dataengineerhub` custom domains: `dataengineerhub.blog` and `www.dataengineerhub.blog` (added 8 Nov 2026; status starts at initializing).
2. [ ] SSL/TLS on the zone: **Full (strict)** — Wrangler OAuth cannot patch this (`zone:read` only). Set it in the dashboard if it is not already Strict.
3. Caching → keep orange-cloud. Pages is now origin once domain status is `active`.
4. Caching → Purge Everything after the domains go active.
5. Run `node scripts/verifyLiveAdsenseReview.js` against the apex.
6. Keep Hostinger FTP for a week as rollback. Then stop deploying `public_html`.
7. Set GitHub variable `ENABLE_CLOUDFLARE_PAGES=true`.

Rollback: remove the Pages custom domain. Cloudflare will proxy Hostinger again if the A/CNAME still points at Hostinger origin.

## AdSense / SEO rules that must survive

- No `/* /index.html 200`. Unknown URLs 404.
- Review-mode `X-Robots-Tag: noindex, follow` on glossary, compare, tags, most tools (see `public/_headers`).
- `*.pages.dev` is noindexed so the preview cannot become a duplicate site.
- `app.dataengineerhub.blog` stays Hostinger. Do not put WordPress on Pages.

## Files in this repo

- `public/_headers`, `public/_redirects` — Pages only. Hostinger still uses `.htaccess`.
- `scripts/prepareCloudflarePages.js` — copies `dist/` → `dist-pages/`, strips `.htaccess` and files ≥ 25 MiB.
- `src/lib/duckdb.js` — Hostinger uses local/hashed wasm; Pages falls back to jsDelivr.
- `wrangler.toml` — `pages_build_output_dir = "dist-pages"`.
- `.github/workflows/deploy.yml` — optional Pages deploy after the Hostinger build.
