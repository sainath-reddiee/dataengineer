# WordPress setup: wp-config.php, newsletter and sponsor stats

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

## 7. Clean-up

Delete `public_html/assets/js/index-DDFF6wS3.js` on the main site in Hostinger File Manager. It is an old bundle that contained the revoked WordPress password. The password no longer works, but the file has no reason to stay.
