# Dodo Payments live setup — DataEngineer Hub

Live mode is already verified on your Dodo account. This file is the remaining dashboard
work so checkout works on `/pricing`, `/coding`, `/settings`, `/advertise`, and the coffee
modal. Docs: https://docs.dodopayments.com/introduction

The site is a **static Vite SPA on Hostinger**. Checkout sessions are created by PHP:

- `POST https://dataengineerhub.blog/api/dodo-checkout.php`
- Webhook: `POST https://dataengineerhub.blog/api/dodo-webhook.php`

**Never put the API key or webhook secret in `VITE_*`.** Those values are bundled into
every visitor's JavaScript. Product IDs (`pdt_…`) and static payment links are public and
belong in Vite env / GitHub Actions.

## 1. Products to create (live mode)

Dashboard → Products. Use USD. For **subscriptions**, set the **subscription period longer
than the billing frequency** (Dodo gotcha: period = frequency expires after one cycle).
Example: monthly Pro → payment frequency 1 month, subscription period 20 years.

| Hub SKU | Type | Price | Dashboard name |
| --- | --- | --- | --- |
| `coffee` | One-time (optional Pay What You Want, default $5) | $5 | Buy me a coffee |
| `pro_monthly` | Subscription | $12 / month | Hub Pro monthly |
| `pro_annual` | Subscription | $99 / year | Hub Pro annual |
| `coaching` | One-time | $149 | 60-minute interview coaching |
| `ad_card_monthly` | One-time | $79 | Sponsored card monthly |
| `ad_card_yearly` | One-time | $699 | Sponsored card yearly |
| `ad_tools` | One-time | $149 | Tools Hub listing |
| `ad_guide` | One-time | $249 | Co-authored guide |
| `ad_newsletter` | One-time | $79 | Newsletter sponsorship |

Copy each **product ID** (`pdt_…`).

## 2. Payment links (fallback)

Dashboard → Payment links (or product → create link). Success / return URL:

- Membership SKUs: `https://dataengineerhub.blog/settings?dodo=success&sku=SKU`
  (replace `SKU` with `pro_monthly`, `pro_annual`, `coaching`, `coffee`)
- Advertise SKUs: `https://dataengineerhub.blog/advertise?dodo=success&sku=SKU`

Cancel URL can be the same page without query params.

These links are the overlay fallback until PHP has an API key.

## 3. API key (secret)

Dashboard → Developer → API keys → **live**. Paste into GitHub Actions secret
`DODO_PAYMENTS_API_KEY` (repository secret, not `VITE_`). Deploy writes
`dist/api/dodo-secrets.php` on Hostinger.

## 4. Webhook

Dashboard → Developer → Webhooks:

- Endpoint: `https://dataengineerhub.blog/api/dodo-webhook.php`
- Secret: copy `whsec_…` into GitHub secret `DODO_WEBHOOK_SECRET`
- Events (minimum):
  - `payment.succeeded`
  - `subscription.active`
  - `subscription.renewed`
  - `subscription.on_hold`
  - `subscription.failed`
  - `subscription.updated`

Verified events append to `api/dodo-events.jsonl` (blocked from HTTP by `api/.htaccess`).

## 5. GitHub Actions secrets to add

Public (safe in the Vite bundle):

- `VITE_DODO_MODE` = `live`
- `VITE_DODO_PRODUCT_COFFEE` / `_PRO_MONTHLY` / `_PRO_ANNUAL` / `_COACHING`
- `VITE_DODO_PRODUCT_AD_CARD_MONTHLY` / `_AD_CARD_YEARLY` / `_AD_TOOLS` / `_AD_GUIDE` / `_AD_NEWSLETTER`
- `VITE_DODO_LINK_*` matching the same SKUs (full `https://checkout.dodopayments.com/...` URLs)

Server only:

- `DODO_PAYMENTS_API_KEY`
- `DODO_WEBHOOK_SECRET`
- `DODO_MODE` = `live` (optional; defaults live)

After saving secrets, run a deploy so PHP and the frontend pick them up.

## 6. Brand / return URLs in Dodo

- Business / brand name: **DataEngineer Hub**
- Website: `https://dataengineerhub.blog`
- Support email: `sainath@dataengineerhub.blog`

## 7. What I do **not** need (and must not receive in chat)

Do not paste the live API key or webhook secret into GitHub issues, PR comments, or chat.
Put them only in GitHub Actions secrets (or Hostinger `dodo-secrets.php` if you upload by hand).

## Local / Hostinger manual file

```bash
cp public/api/dodo-secrets.example.php public/api/dodo-secrets.php
```

Fill keys. `dodo-secrets.php` is gitignored.

## Verify

```bash
npm run test:dodo
```

Then click Pro on `/pricing`. Overlay should open when PHP returns `checkout_url`; otherwise
the static link navigates to Dodo hosted checkout.
