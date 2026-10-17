# Dodo Payments config tracker

What exists in the Dodo dashboard and where each value goes. Secrets are never written here: copy them from the dashboard straight into `wp-config.php`. Setup steps and the end-to-end test are in [wordpress-setup.md](wordpress-setup.md#9-card-checkout-with-dodo-payments).

## Test mode (created 2026-10-17)

### Products

All one-time, USD, tax category "Digital products", tax exclusive (Dodo adds tax on top of the price).

| wp-config key | Product | Price | Product id |
| --- | --- | --- | --- |
| `resource_reference:monthly` | Sponsored Card, 30 Days | $39 | `pdt_0NpvBmBAGUna8Ox8JeAQF` |
| `resource_reference:yearly` | Sponsored Card, 12 Months | $349 | `pdt_0NpvBqYGmLl5M41qS8gfs` |
| `directory:yearly` | Tools Hub Listing, 12 Months | $79 | `pdt_0NpvBudcV1lWKYwtEvaog` |
| `content:one_time` | Co-Authored Integration Guide | $199 | `pdt_0NpvByWzdrITrGntQ3Tlt` |
| `announcement:one_time` | Sponsored Announcement | $49 | `pdt_0NpvBh3JqReyVliOJrgUC` |

The two older subscription products (DataEngineer Pro Monthly/Annual) are not used by the sponsor checkout.

### Webhook endpoint

| Field | Value |
| --- | --- |
| Endpoint id | `ep_3KoX30SJV8KqnMOZJklXJ49ql5L` |
| URL | `https://app.dataengineerhub.blog/wp-json/dehub/v1/dodo-webhook` |
| Events | `payment.succeeded`, `payment.failed`, `payment.cancelled`, `refund.succeeded` (add `refund.failed` and every `dispute.*` event: the hardened webhook handles them) |
| Signing secret | Developer > Webhooks > this endpoint > Signing secret (reveal, copy) → `DEHUB_DODO_WEBHOOK_SECRET`. **Rotate it**: it was pasted into a chat on 2026-10-17. |

Two other endpoints in the dashboard are not used by this site and can be disabled or deleted: `.../dehub/v1/checkout/options` (wrong route, it is not the webhook) and `https://bright-toes-spend.loca.lt/api/webhook/dodo` (old local tunnel).

### API key

| Field | Value |
| --- | --- |
| Key name | `Test` (created 2026-10-17, expires 2036-10-17) |
| Value | Shown once at creation → `DEHUB_DODO_API_KEY`. If it was not saved, create a new key and delete the old one. |

### wp-config.php block

```php
define('DEHUB_DODO_MODE', 'test');
define('DEHUB_DODO_API_KEY', 'paste-from-dodo');           // Developer > API Keys
define('DEHUB_DODO_WEBHOOK_SECRET', 'whsec_paste-from-dodo'); // endpoint ep_3KoX30SJV8KqnMOZJklXJ49ql5L
define('DEHUB_DODO_PRODUCTS', array(
    'resource_reference:monthly' => 'pdt_0NpvBmBAGUna8Ox8JeAQF',
    'resource_reference:yearly'  => 'pdt_0NpvBqYGmLl5M41qS8gfs',
    'directory:yearly'           => 'pdt_0NpvBudcV1lWKYwtEvaog',
    'content:one_time'           => 'pdt_0NpvByWzdrITrGntQ3Tlt',
    'announcement:one_time'      => 'pdt_0NpvBh3JqReyVliOJrgUC',
));
define('DEHUB_SPONSOR_INBOX', 'sainath@dataengineerhub.blog');
```

### Checklist

- [x] Test products created
- [x] Webhook endpoint created with the four events
- [x] API key value in wp-config.php (`/checkout/options` reports enabled, 2026-10-17)
- [x] Webhook signing secret in wp-config.php
- [x] Latest functions.php uploaded
- [x] `node scripts/dodoWebhookPing.js` returns 200 (2026-10-17)
- [x] End-to-end test payment passes (order `deh_2d8afb21446df80f1e3c43cd`, webhook 200, return page "Payment received", 2026-10-17)
- [x] Hardened functions.php (orders DB v2) uploaded (2026-10-17; webhook events table confirmed by the duplicate-delivery check)
- [x] `node scripts/verifyCheckout.js --live --expect-mode=test` passes with the webhook secret set (2026-10-17, all signed checks green)
- [x] Second payment and webhook pass (order `deh_f983bdbb3f574fd9259b82ff`, webhook 200 in 419 ms); six Dodo sample events (refund, dispute) return 200
- [ ] Real refund not completed in test mode: Dodo pays refunds from the wallet balance ("Insufficient funds in wallet"), and Indian card payments cannot be partly refunded. Covered by the live smoke test (step 11)
- [ ] Test order `deh_899aca8e65969f8ddbde938f` stays `pending` (paid with an India success card that Dodo left in Processing); the daily cron expires it after 48 hours

## Live mode

Business verification approved (Dodo > Verification: "Live payments are active", checked 2026-10-17). Test and live ids differ, so the mode, key, secret and all product ids change together.

### Live products (imported from Test, 2026-10-17)

Same names, prices and tax settings as the test products.

| wp-config key | Product | Price | Product id |
| --- | --- | --- | --- |
| `resource_reference:monthly` | Sponsored Card, 30 Days | $39 | `pdt_0NpvoxmCTKvaqvGrI58kn` |
| `resource_reference:yearly` | Sponsored Card, 12 Months | $349 | `pdt_0Npvoxi4NPUEkec41OxYq` |
| `directory:yearly` | Tools Hub Listing, 12 Months | $79 | `pdt_0Npvoxe1aRfOzZIv0N4TP` |
| `content:one_time` | Co-Authored Integration Guide | $199 | `pdt_0NpvoxZSFXcg47HrfraND` |
| `announcement:one_time` | Sponsored Announcement | $49 | `pdt_0Npvoxq9GYrGHOt1xaKZB` |

### Live webhook endpoint

| Field | Value |
| --- | --- |
| Endpoint id | `ep_3Kovo4BYOtharY9xWM15MXlwJle` (created 2026-10-17) |
| URL | `https://app.dataengineerhub.blog/wp-json/dehub/v1/dodo-webhook` |
| Events | `payment.succeeded`, `payment.failed`, `payment.cancelled`, `refund.succeeded`, `refund.failed`, `dispute.accepted`, `dispute.cancelled`, `dispute.challenged`, `dispute.expired`, `dispute.lost`, `dispute.opened`, `dispute.won` |
| Signing secret | Live mode > Developer > Webhooks > this endpoint > Signing secret (reveal, copy) into `DEHUB_DODO_WEBHOOK_SECRET`. Never paste it into chat. |

### Live API key

Create it in Live mode > Developer > API Keys and paste it straight into wp-config.php as `DEHUB_DODO_API_KEY`. It is shown once.

### Live wp-config.php block

The live block is in [wp-config-dehub-block.php](wp-config-dehub-block.php). Change mode, key, secret and the five product ids in one save.

### Live checklist

- [x] Business verification approved
- [x] Five live products created
- [x] Live webhook endpoint created with 12 events
- [ ] Live API key created and in wp-config.php
- [ ] Live signing secret in wp-config.php, `DEHUB_DODO_MODE` set to `'live'`
- [ ] Latest functions.php (security fixes, commit bf9421b) uploaded, caches purged
- [ ] `node scripts/verifyCheckout.js --live --expect-mode=live` passes
- [ ] Real $39 smoke test paid, then refunded (the wallet must hold at least the refund amount)
- [ ] Test endpoint `ep_3KoX30SJV8KqnMOZJklXJ49ql5L` disabled and its secret rotated; stale live `loca.lt` and `/api/webhook/dodo` endpoints deleted

### Cutover runbook

Run top to bottom. "You" steps need the Dodo dashboard, Hostinger or wp-config.php.

1. **You: test-mode pass.** Upload the hardened `functions.php`, open Tools > Sponsor orders and confirm "Orders DB version 2". Run `node scripts/verifyCheckout.js --live --expect-mode=test`. Then pay, decline a card, fully refund one payment and partly refund another. Each order should end in the right status with one pair of emails, and the "Recent webhook events" table should show no 401 or 500.
2. **You: read real payloads.** In Developer > Webhooks > endpoint > Logs, open a `payment.succeeded` and a `refund.succeeded` delivery and confirm the fields the handler reads exist: `payment_id`, `total_amount`, `tax`, `currency`, `metadata.order_ref`, `checkout_session_id`; for refunds `amount`, `currency`, `is_partial`. Tell Claude about any difference.
3. **You: business verification.** Dodo approves live payments after verifying the business. The Terms, Privacy and Refund Policy pages it looks for are live.
4. **You: live products.** Switch the dashboard to Live mode and create the same five one-time USD products (same names and prices, tax category "Digital products", tax exclusive). Record the ids in a Live table below.
5. **You: live API key.** Create it and paste it straight into wp-config.php. Never into chat or a file in this repo (`npm run test:secrets` fails the build if one appears).
6. **You: live webhook.** Add `https://app.dataengineerhub.blog/wp-json/dehub/v1/dodo-webhook` with `payment.succeeded`, `payment.failed`, `payment.cancelled`, `refund.succeeded`, `refund.failed` and all `dispute.*` events. Copy its signing secret into wp-config.php.
7. **You: retire test endpoints.** Disable `ep_3KoX30SJV8KqnMOZJklXJ49ql5L` (its secret was exposed in chat) and delete the `.../checkout/options` and `loca.lt` endpoints. Test and live share one URL, so a still-active test endpoint would only produce 401s against the live secret.
8. **You: wp-config.php, one edit.** Set `DEHUB_DODO_MODE` to `'live'` together with the live API key, the live webhook secret and all five live product ids. Save once.
9. **You: purge caches.** LiteSpeed Cache > Toolbox > Purge All, the hPanel cache, and Cloudflare if it caches the app hostname.
10. **Verify.** `https://app.dataengineerhub.blog/wp-json/dehub/v1/checkout/options?t=1` shows `"mode":"live"` and five plans; `node scripts/verifyCheckout.js --live --expect-mode=live` passes with the live secret; the checkout page shows no test-mode note.
11. **You: real smoke test.** Buy the $39 sponsored card with your own card, check the return page, the two emails, and the admin row (charged, tax, paid). Then refund it in Dodo and check the order turns `refunded` and no paid email is resent. The processing fee is usually not returned.
12. **Monitor for a week.** Search the PHP error log for `[dehub`, read the daily digest emails, and check the webhook events table.

**Rollback:** `define('DEHUB_DODO_PRODUCTS', array());` hides the card buttons and the checkout returns 503, while the inquiry form and PayPal invoices keep working. Do not switch back to test mode while live orders are pending.

## GitHub secrets

None of the Dodo values belong in GitHub: the checkout runs entirely in WordPress.

Used by `.github/workflows/deploy.yml` (keep): `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `VITE_ADS_ENABLED`, `VITE_ADSENSE_PUBLISHER_ID`, `VITE_ADSENSE_SLOT_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_ADMIN_USER_HASH`, `VITE_ADMIN_PASS_HASH`, `VITE_GISCUS_REPO`, `VITE_GISCUS_REPO_ID`, `VITE_GISCUS_CATEGORY`, `VITE_GISCUS_CATEGORY_ID`, `VITE_WEB3FORMS_KEY`, `VITE_GSC_CLIENT_ID`. `GITHUB_TOKEN` is built in.

No longer referenced anywhere (they were only used by `.github/workflows/blog-automation.yml`, the Gemini placeholder deleted on 2026-10-17): `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `TAVILY_API_KEY`, `WORDPRESS_URL`, `WORDPRESS_USER`, `WORDPRESS_APP_PASSWORD`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `TOGETHER_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`. Remove them in GitHub > Settings > Secrets and variables > Actions. `WORDPRESS_APP_PASSWORD` is the most sensitive: also revoke it in WordPress > Users > Profile > Application Passwords.
