#!/usr/bin/env node
// Guardrails for the Dodo Payments sponsor checkout.
//
// Offline (default): checks functions.php and the frontend for the properties
// that make live mode safe (idempotent webhook, emails off the request path,
// no refund-to-paid flip, disputes handled, honest tax copy, legal pages).
//
//   npm run test:checkout
//
// Live (opt-in): harmless requests against the real WordPress backend. Creates
// no order and sends no email. Signed checks need the webhook secret:
//
//   node scripts/verifyCheckout.js --live [--expect-mode=test|live]
//   PowerShell: $env:DEHUB_DODO_WEBHOOK_SECRET='whsec_...'; node scripts/verifyCheckout.js --live
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { signWebhook, webhookHeaders } from './lib/dodoSign.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
let failed = 0;
const check = (condition, message) => {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ${message}`);
    failed += 1;
  }
};

// Body of a named PHP function: from its signature to the next top-level
// function or section divider.
const phpFunction = (source, name) => {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(function |add_action\(|add_filter\(|\/\/ ----)/);
  return next < 0 ? rest : rest.slice(0, next);
};

// ---- functions.php ----
const php = read('functions.php');
const section = php.slice(php.indexOf('// SPONSOR CHECKOUT: Dodo Payments'), php.indexOf('// END OF FILE'));
check(section.length > 1000, 'checkout section found in functions.php');

const dbVersion = (section.match(/define\('DEHUB_ORDERS_DB_VERSION', '(\d+)'\)/) || [])[1];
check(Number(dbVersion) >= 2, `orders schema is v2 or later (found ${dbVersion})`);
for (const column of ['refunded_amount', 'emails_sent_at', 'dispute_status', 'paid_at', 'tax int']) {
  check(section.includes(column), `orders table has ${column.split(' ')[0]}`);
}
check(/CREATE TABLE \{\$events\}[\s\S]*PRIMARY KEY {2}\(id\)/.test(section), 'webhook events table keyed by webhook-id');

const handler = phpFunction(section, 'dehub_dodo_webhook_handler');
check(handler.includes('INSERT IGNORE'), 'webhook claims each delivery before acting (INSERT IGNORE)');
check(!/wp_mail\(|dehub_order_paid_emails\(/.test(handler), 'webhook handler sends no email itself');
check(/error_log\('\[dehub webhook\] 401/.test(handler), 'rejected signatures are logged');

const events = phpFunction(section, 'dehub_dodo_handle_event');
check(!/wp_mail\(/.test(events), 'event handling queues emails instead of sending them');
check(!/wp_json_encode\(\$data/.test(section), 'no raw webhook payload is emailed');
const paidFrom = (events.match(/dehub_order_transition\(\$order\['id'\], 'paid', array\(([^)]*)\)/) || [])[1] || '';
check(paidFrom.includes("'pending'") && !paidFrom.includes('refunded'), 'payment.succeeded never moves a refunded order back to paid');
check(events.includes("'refund.succeeded'") && events.includes('partially_refunded'), 'full and partial refunds are recorded');
check(events.includes("strpos($type, 'dispute.')"), 'dispute events are handled');
check(events.includes('ignored_unrelated'), 'payments for unrelated Dodo products are ignored');

check(/emails_sent_at IS NULL/.test(section) && section.includes("'dehub_order_paid_emails_event'"), 'paid emails are claimed once and sent by cron');
check(/get_method\(\) === 'GET'/.test(section), 'CORS * is limited to the GET routes');
check(section.includes("array('http', 'https')"), 'website must be http or https');
check(/mb_strlen\(\$raw_email\) > 190/.test(section), 'email length fits the column');
check(section.includes('dehub_client_ip()') && section.includes("'dehub_co_e_'"), 'rate limits use the real client IP and the email');
check(section.includes("wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'dehub_checkout_daily')"), 'daily expiry and digest cron is scheduled');
check(/'callback' => 'dehub_dodo_webhook_handler'/.test(section), 'webhook route uses the named handler');

const php8 = spawnSync('php', ['-l', path.join(root, 'functions.php')], { encoding: 'utf8' });
if (php8.error) {
  console.log('ℹ️  php not installed here; skipped php -l');
} else {
  check(php8.status === 0, `php -l functions.php (${(php8.stdout || php8.stderr).trim().split('\n')[0]})`);
}

// ---- Webhook signing (Standard Webhooks published test vector) ----
check(
  signWebhook('whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw', 'msg_p5jXN8AQM9LWM0D4loKWxJek', 1614265330, '{"test": 2432232314}')
    === 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
  'webhook signer matches the Standard Webhooks test vector',
);

// ---- Frontend ----
const service = read('src/services/checkoutService.js');
const options = service.slice(service.indexOf('export async function getCheckoutOptions'), service.indexOf('export async function startCheckout'));
check(options.includes('t=${Date.now()}') && options.includes("'no-store'"), 'checkout options request is cache-busted');
check(service.includes('notFound: true'), 'unknown orders are reported as not found');
check(/hostname\.endsWith\('\.dodopayments\.com'\)/.test(service), 'buyers are only sent to Dodo-hosted checkout URLs');

const page = read('src/pages/AdvertiseCheckoutPage.jsx');
check(!page.includes('Total (USD)'), 'order summary does not present the pre-tax price as the total');
check(page.includes('+ tax') && page.includes('local currency'), 'checkout says tax is added and currency may differ');
check(page.includes('Check again') && page.includes("'not_found'"), 'return page can re-check and explains unknown orders');
check(page.includes('/refund-policy') && page.includes('/terms-of-service'), 'consent line links the terms and refund policy');
check(!read('src/data/advertiseConfig.json').includes('No extra fees'), 'no "No extra fees" claim');
check(page.includes("next.delete('email')"), 'return page removes the buyer email Dodo appends to the URL');
check(page.includes("providerStatus === 'processing'"), 'return page explains a payment Dodo is still processing');
const analytics = read('src/utils/analytics.js');
check(/page_path: redactUrl\(url\)/.test(analytics) && /page_location: redactUrl\(window\.location\.href\)/.test(analytics) && analytics.includes("'email'"), 'page views sent to Google Analytics have email params removed');

// ---- Legal pages ----
const statics = read('scripts/generateStaticPagesIncremental.js');
check(fs.existsSync(path.join(root, 'src/pages/RefundPolicyPage.jsx')), 'refund policy page exists');
for (const [file, label] of [['src/pages/TermsOfServicePage.jsx', 'Terms'], ['src/pages/PrivacyPolicyPage.jsx', 'Privacy']]) {
  check(read(file).includes('Dodo Payments'), `${label} page names Dodo Payments`);
}
check(statics.includes("path: '/refund-policy'"), 'refund policy has static HTML');
check((statics.match(/Dodo Payments/g) || []).length >= 3, 'static Terms, Privacy and Refund pages name Dodo Payments');
for (const file of ['src/App.jsx', 'scripts/generateSitemap.js', 'src/components/Footer.jsx']) {
  check(read(file).includes('refund-policy'), `${file} includes /refund-policy`);
}

// ---- Live backend (opt-in) ----
const args = process.argv.slice(2);
if (args.includes('--live')) {
  const base = process.env.DEHUB_WP_URL || 'https://app.dataengineerhub.blog';
  const api = `${base}/wp-json/dehub/v1`;
  const expectMode = (args.find((a) => a.startsWith('--expect-mode=')) || '').split('=')[1];
  console.log(`\nLive checks against ${base}`);

  const opts = await fetch(`${api}/checkout/options?t=${Date.now()}`);
  const optsBody = await opts.json().catch(() => ({}));
  check(opts.status === 200 && optsBody.enabled === true, `options: 200 and enabled (got ${opts.status}, enabled=${optsBody.enabled})`);
  check(opts.headers.get('access-control-allow-origin') === '*', 'options: CORS * so cached copies work');
  check(Array.isArray(optsBody.plans) && optsBody.plans.length === 5, `options: 5 plans (got ${optsBody.plans?.length})`);
  if (expectMode) check(optsBody.mode === expectMode, `options: mode is ${expectMode} (got ${optsBody.mode})`);

  const status = await fetch(`${api}/checkout/status?order=deh_${'0'.repeat(24)}&t=${Date.now()}`);
  check(status.status === 404, `status: unknown order is 404 (got ${status.status})`);

  const honeypot = await fetch(`${api}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://dataengineerhub.blog' },
    body: JSON.stringify({ package: 'announcement', plan: 'one_time', email: 'verify@example.com', name: 'Verify', company_url: 'x' }),
  });
  check(honeypot.status === 400, `checkout POST: honeypot rejected without creating an order (got ${honeypot.status})`);
  check(honeypot.headers.get('access-control-allow-origin') !== '*', 'checkout POST: keeps the origin allowlist, not CORS *');

  const secret = process.env.DEHUB_DODO_WEBHOOK_SECRET || '';
  if (!secret) {
    console.log('ℹ️  DEHUB_DODO_WEBHOOK_SECRET not set; skipped signed webhook checks');
  } else {
    const hook = `${api}/dodo-webhook`;
    const body = JSON.stringify({
      business_id: 'verify',
      type: 'payment.succeeded',
      timestamp: new Date().toISOString(),
      data: { payment_id: 'pay_verify_unrelated', total_amount: 100, currency: 'USD', product_cart: [{ product_id: 'pdt_verify_unrelated', quantity: 1 }] },
    });
    const headers = webhookHeaders(secret, body);
    const first = await fetch(hook, { method: 'POST', headers, body });
    const firstBody = await first.json().catch(() => ({}));
    check(first.status === 200 && firstBody.result === 'ignored_unrelated', `webhook: unrelated payment ignored (got ${first.status} ${firstBody.result})`);
    const replay = await fetch(hook, { method: 'POST', headers, body });
    const replayBody = await replay.json().catch(() => ({}));
    check(replay.status === 200 && replayBody.duplicate === true, 'webhook: replayed delivery is recognised as a duplicate');
    const forged = await fetch(hook, { method: 'POST', headers: { ...webhookHeaders(secret, body), 'webhook-signature': 'v1,Zm9yZ2Vk' }, body });
    check(forged.status === 401, `webhook: bad signature is 401 (got ${forged.status})`);
    const stale = await fetch(hook, { method: 'POST', headers: webhookHeaders(secret, body, { timestamp: Math.floor(Date.now() / 1000) - 600 }), body });
    check(stale.status === 401, `webhook: 10-minute-old timestamp is 401 (got ${stale.status})`);
  }
}

if (failed) {
  console.error(`\n❌ ${failed} checkout check(s) failed`);
  process.exit(1);
}
console.log('\n✅ Checkout checks passed');
