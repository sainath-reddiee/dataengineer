# WordPress setup: wp-config.php, newsletter, sponsor stats and checkout

One-time setup for the WordPress backend at app.dataengineerhub.blog. Nothing here changes your WordPress admin username or password.

## 1. Add these lines to wp-config.php

Open `wp-config.php` in Hostinger File Manager (`public_html` of the WordPress site). Paste the block **above** the line `/* That's all, stop editing! Happy publishing. */`.

```php
// ── DataEngineer Hub ─────────────────────────────────────────────
// Sponsor dashboard links are signed with this. Set it once, keep a copy
// in your password manager, and never change it (old links stop working).
define('DEHUB_SPONSOR_SECRET', 'paste-a-long-random-string-here');

// Newsletter and site email go out through your Hostinger mailbox.
define('DEHUB_SMTP_USER', 'sainath@dataengineerhub.blog');
define('DEHUB_SMTP_PASS', 'the-mailbox-password');
define('DEHUB_SMTP_HOST', 'smtp.hostinger.com');
define('DEHUB_SMTP_PORT', 465);
define('DEHUB_NEWSLETTER_FROM_NAME', 'Sainath at DataEngineer Hub');

// 'test' emails only the WordPress admin address. Switch to 'live' after
// the test email looks right.
define('DEHUB_NEWSLETTER_MODE', 'test');
define('DEHUB_NEWSLETTER_DAILY_CAP', 250);
```

To make a random secret, run this once on your machine and paste the output:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Common questions

- **Do I enter the sponsor secret every time?** No. It is a constant in wp-config.php: you set it once and WordPress reads it on every request. You only use it again when generating a sponsor's dashboard link on your own machine.
- **Does this change my admin login?** No. The admin username and password are unrelated to these constants.
- **What is DEHUB_SMTP_PASS?** The password of the `sainath@dataengineerhub.blog` mailbox in Hostinger Email, not your WordPress password. wp-config.php is server-side only and is never sent to visitors.
- **Is putting a password in wp-config.php safe?** Yes. It is the standard place for server secrets; the file is not web-readable. Never put secrets in a `VITE_` variable: those end up in public JavaScript.

## 2. Upload the latest functions.php

Upload `functions.php` from this repository to the active theme folder (replace the existing file). It adds:

- newsletter double opt-in, new-article emails and one-click unsubscribe
- sponsor impression and click counting, and the signed stats endpoint
- the login requirement on guest-author create and delete

After upload these should respond (a 404 means the old file is still there):

- `https://app.dataengineerhub.blog/wp-json/dehub/v1/newsletter/stats` returns `{"subscribers": N}`
- `https://app.dataengineerhub.blog/wp-json/dehub/v1/sponsor-stats` returns 403 (not 503) once the secret is set

## 3. Make WordPress cron reliable

New-article emails are sent by WordPress cron. A headless WordPress gets few direct visits, so add a Hostinger cron job (hPanel, Advanced, Cron Jobs), every 5 minutes:

```bash
wget -q -O - "https://app.dataengineerhub.blog/wp-cron.php?doing_wp_cron" >/dev/null 2>&1
```

## 4. Test the newsletter

1. Keep `DEHUB_NEWSLETTER_MODE` as `test`.
2. Subscribe on https://dataengineerhub.blog/newsletter with a second email address, open the confirmation email, click the link. You should land on the newsletter page with "You're subscribed."
3. Publish (or schedule) an article. About 20 minutes later the admin email gets the test send.
4. If the test email looks right and did not land in spam, change the mode to `'live'`.

Notes:

- Existing subscribers stay subscribed and get an unsubscribe link in every email.
- Tag a post `no-newsletter` in WordPress to publish it without emailing anyone.
- Each post is emailed once; editing it later does not resend.
- Sending goes in batches of 40, under `DEHUB_NEWSLETTER_DAILY_CAP` per day. Hostinger mailboxes have a daily limit; check yours in hPanel and keep the cap below it.

## 5. Deliverability (do once)

In Hostinger, open Emails, then your domain, then DNS / authentication, and confirm SPF, DKIM and DMARC are all green for dataengineerhub.blog. Without them, Gmail and Outlook will send the newsletter to spam.

## 6. Sponsor dashboard links

When a sponsor goes live, on your machine run:

```bash
DEHUB_SPONSOR_SECRET=<the same secret> node scripts/sponsorDashboardLink.js <campaign-id>
```

In Windows PowerShell:

```powershell
$env:DEHUB_SPONSOR_SECRET = "<the same secret>"; node scripts/sponsorDashboardLink.js <campaign-id>
```

The campaign id is the sponsor's `token` in `src/data/activeSponsors.json` (the admin Sponsor Manager copies this command for you). Email the printed link to the sponsor.

## 7. Announcements category (press releases)

In WordPress, go to Posts, then Categories, and create a category named **Announcements** with the slug `announcements`. Posts in it are paid press releases: the updated functions.php keeps them out of every public post list, the sitemap, RSS and newsletter emails, and the site shows them only at `/announcements`.

Upload the new functions.php **before** publishing the first announcement; with the old file, an announcement would appear in article feeds.

## 8. Clean-up

Delete `public_html/assets/js/index-DDFF6wS3.js` on the main site in Hostinger File Manager. It is an old bundle that contained the revoked WordPress password. The password no longer works, but the file has no reason to stay.

## 9. Card checkout with Dodo Payments

The browser never holds a Dodo key. The advertise page asks WordPress for a checkout session, WordPress calls Dodo with the secret key from wp-config.php, and the buyer pays on Dodo's hosted page. Dodo then calls a signed webhook that marks the order paid and emails both of you. Card buttons stay hidden until this is configured, so nothing breaks in the meantime.

**Step 1: create the products in Dodo (Test mode first).** In the Dodo dashboard, switch to Test mode, then Products, and create five one-time products in USD:

| Product | Price | wp-config key |
| --- | --- | --- |
| Sponsored card, 30 days | $39 | `resource_reference:monthly` |
| Sponsored card, 12 months | $349 | `resource_reference:yearly` |
| Tools Hub listing, 12 months | $79 | `directory:yearly` |
| Co-authored integration guide | $199 | `content:one_time` |
| Sponsored announcement | $49 | `announcement:one_time` |

Use one-time payments, not subscriptions: the advertise page promises monthly cards do not auto-renew. Copy each product id (`pdt_...`).

**Step 2: API key and webhook.** In Developer, then API Keys, create a key. In Developer, then Webhooks, add the endpoint `https://app.dataengineerhub.blog/wp-json/dehub/v1/dodo-webhook`, subscribe to `payment.succeeded`, `payment.failed`, `payment.cancelled`, `refund.succeeded`, `refund.failed` and every `dispute.*` event, and copy its signing secret (`whsec_...`).

**Step 3: wp-config.php** (above "That's all, stop editing!"):

```php
define('DEHUB_DODO_MODE', 'test');               // 'live' once tested
define('DEHUB_DODO_API_KEY', 'paste-test-api-key');
define('DEHUB_DODO_WEBHOOK_SECRET', 'whsec_paste-secret');
define('DEHUB_DODO_PRODUCTS', array(
    'resource_reference:monthly' => 'pdt_...',
    'resource_reference:yearly'  => 'pdt_...',
    'directory:yearly'           => 'pdt_...',
    'content:one_time'           => 'pdt_...',
    'announcement:one_time'      => 'pdt_...',
));
define('DEHUB_SPONSOR_INBOX', 'sainath@dataengineerhub.blog'); // paid-order emails
```

Leave out any package you do not want to sell by card; its button simply will not show.

**Step 4: upload functions.php and test end to end (Test mode).** After uploading, open Tools, then Sponsor orders: it should say "Orders DB version 2" (the table upgrades itself on the first request). Then run `node scripts/verifyCheckout.js --live --expect-mode=test` with `DEHUB_DODO_WEBHOOK_SECRET` set; it creates no order and sends no email.

1. Endpoint check: `https://app.dataengineerhub.blog/wp-json/dehub/v1/checkout/options` should show `"enabled":true`, `"mode":"test"` and your five plans.
2. Webhook secret check, no payment needed. In PowerShell: `$env:DEHUB_DODO_WEBHOOK_SECRET='whsec_...'; node scripts/dodoWebhookPing.js`. Expect `200 Signature accepted`. A 401 means the secret in wp-config.php differs from Dodo's.
3. Buyer flow: on `/advertise`, click "Pay now by card" under Sponsored announcement. Fill the form with your own email, tick the house rules, and continue. You should land on Dodo's hosted page in test mode.
4. Pay with a Dodo test card from the Dodo docs (Testing section). You return to `/advertise/checkout?order=...`, which shows "Confirming your payment…" for a few seconds, then "Payment received".
5. Confirm the four outcomes: the buyer email arrives (with next steps), the owner email arrives at DEHUB_SPONSOR_INBOX, the order is `paid` under Tools, then Sponsor orders, and the payment appears in the Dodo dashboard with the order reference in its metadata.
6. Unhappy paths: start another checkout and close or cancel on Dodo's page. The return page should say "The payment did not go through" with a "try again" link that keeps the package. Then refund the first test payment in Dodo and check the order turns `refunded`.
7. Repeat step 3 once on a phone to check the layout.

If checkout shows "The payment provider did not respond", the PHP error log has a `[dehub checkout]` line with Dodo's reason.

**Step 5: go live.** Follow the cutover runbook in [dodo-config.md](dodo-config.md#cutover-runbook). Dodo needs your business verified before live payments, and the mode, API key, webhook secret and all five product ids must change together.

If checkout says "The payment provider did not respond", the reason is in the PHP error log as `[dehub checkout]`, usually a test key used with live mode or a product id from the other mode.
