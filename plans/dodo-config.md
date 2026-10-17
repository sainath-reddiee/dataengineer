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
| Events | `payment.succeeded`, `payment.failed`, `payment.cancelled`, `refund.succeeded` |
| Signing secret | Developer > Webhooks > this endpoint > Signing secret (reveal, copy) → `DEHUB_DODO_WEBHOOK_SECRET` |

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
- [ ] End-to-end test payment, cancel and refund pass

## Live mode

Not created yet. Live needs business verification first, then the same five products, a live API key and a live webhook endpoint. Test and live ids differ, so the mode, key, secret and all product ids change together.

## GitHub secrets

None of the Dodo values belong in GitHub: the checkout runs entirely in WordPress.

Used by `.github/workflows/deploy.yml` (keep): `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `VITE_ADS_ENABLED`, `VITE_ADSENSE_PUBLISHER_ID`, `VITE_ADSENSE_SLOT_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_ADMIN_USER_HASH`, `VITE_ADMIN_PASS_HASH`, `VITE_GISCUS_REPO`, `VITE_GISCUS_REPO_ID`, `VITE_GISCUS_CATEGORY`, `VITE_GISCUS_CATEGORY_ID`, `VITE_WEB3FORMS_KEY`, `VITE_GSC_CLIENT_ID`. `GITHUB_TOKEN` is built in.

No longer referenced anywhere (they were only used by `.github/workflows/blog-automation.yml`, the Gemini placeholder deleted on 2026-10-17): `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `TAVILY_API_KEY`, `WORDPRESS_URL`, `WORDPRESS_USER`, `WORDPRESS_APP_PASSWORD`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `TOGETHER_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`. Remove them in GitHub > Settings > Secrets and variables > Actions. `WORDPRESS_APP_PASSWORD` is the most sensitive: also revoke it in WordPress > Users > Profile > Application Passwords.
