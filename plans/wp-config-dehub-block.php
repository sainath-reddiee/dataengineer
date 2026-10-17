<?php
// Paste-ready block for wp-config.php on app.dataengineerhub.blog.
// This is NOT a whole wp-config.php: keep the database settings, salts and
// everything else in the server file as they are. Replace any existing
// GITHUB_PAT / DEHUB_* lines with this block (defining a constant twice
// leaves the first value in place), placed above:
//   /* That's all, stop editing! Happy publishing. */
// Keep the values you already have for anything marked KEEP.

// ── DataEngineer Hub ─────────────────────────────────────────────

// Publishing a post triggers the deploy workflow (repository_dispatch
// "post-published"). Fine-grained token with Contents: read & write on
// sainath-reddiee/dataengineer. KEEP the current value.
define('GITHUB_PAT', 'KEEP-existing-value');

// Signs sponsor dashboard links. KEEP: changing it breaks every link sent so far.
define('DEHUB_SPONSOR_SECRET', 'KEEP-existing-value');

// Site and newsletter email via the Hostinger mailbox.
define('DEHUB_SMTP_USER', 'sainath@dataengineerhub.blog');
define('DEHUB_SMTP_PASS', 'KEEP-existing-mailbox-password');
define('DEHUB_SMTP_HOST', 'smtp.hostinger.com');
define('DEHUB_SMTP_PORT', 465);
define('DEHUB_NEWSLETTER_FROM_NAME', 'Sainath at DataEngineer Hub');
define('DEHUB_NEWSLETTER_MODE', 'test');      // 'live' after the test email looks right
define('DEHUB_NEWSLETTER_DAILY_CAP', 250);

// Optional: Brevo list sync. Leave out if you do not use Brevo.
// define('DEHUB_BREVO_API_KEY', 'KEEP-existing-value');
// define('DEHUB_BREVO_LIST_ID', 0);

// Optional: token for the subscriber CSV export, and temporary debug logging.
// define('DEHUB_NEWSLETTER_EXPORT_TOKEN', 'long-random-string');
// define('DEHUB_NEWSLETTER_DEBUG', true);

// Sponsor card checkout, Dodo Payments TEST mode (see plans/dodo-config.md).
define('DEHUB_DODO_MODE', 'test');
define('DEHUB_DODO_API_KEY', 'paste-from-Dodo-Developer-API-Keys');
define('DEHUB_DODO_WEBHOOK_SECRET', 'whsec_paste-from-endpoint-ep_3KoX30SJV8KqnMOZJklXJ49ql5L');
define('DEHUB_DODO_PRODUCTS', array(
    'resource_reference:monthly' => 'pdt_0NpvBmBAGUna8Ox8JeAQF', // Sponsored card, 30 days, $39
    'resource_reference:yearly'  => 'pdt_0NpvBqYGmLl5M41qS8gfs', // Sponsored card, 12 months, $349
    'directory:yearly'           => 'pdt_0NpvBudcV1lWKYwtEvaog', // Tools Hub listing, $79
    'content:one_time'           => 'pdt_0NpvByWzdrITrGntQ3Tlt', // Co-authored guide, $199
    'announcement:one_time'      => 'pdt_0NpvBh3JqReyVliOJrgUC', // Sponsored announcement, $49
));
define('DEHUB_SPONSOR_INBOX', 'sainath@dataengineerhub.blog'); // paid-order emails

// ── End DataEngineer Hub ─────────────────────────────────────────
