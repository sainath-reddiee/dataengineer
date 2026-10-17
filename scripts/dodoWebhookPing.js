#!/usr/bin/env node
// Sends one signed, harmless event to the live Dodo webhook endpoint so you
// can confirm functions.php is uploaded and DEHUB_DODO_WEBHOOK_SECRET in
// wp-config.php matches the secret in the Dodo dashboard. The event type is
// not a payment, so no order changes and no email is sent.
//
//   DEHUB_DODO_WEBHOOK_SECRET=whsec_... node scripts/dodoWebhookPing.js
//   PowerShell: $env:DEHUB_DODO_WEBHOOK_SECRET='whsec_...'; node scripts/dodoWebhookPing.js
//
// 200 = signature accepted. 401 = secret mismatch (or clock skew over 5 min).
// 404 = the new functions.php is not uploaded yet.
import crypto from 'node:crypto';

const secret = process.env.DEHUB_DODO_WEBHOOK_SECRET || '';
const url = process.env.DEHUB_DODO_WEBHOOK_URL || 'https://app.dataengineerhub.blog/wp-json/dehub/v1/dodo-webhook';

if (!secret) {
  console.error('Set DEHUB_DODO_WEBHOOK_SECRET to the whsec_... signing secret first.');
  process.exit(2);
}

const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
const id = `msg_ping_${crypto.randomBytes(8).toString('hex')}`;
const timestamp = Math.floor(Date.now() / 1000);
const body = JSON.stringify({
  business_id: 'ping',
  type: 'dehub.ping',
  timestamp: new Date(timestamp * 1000).toISOString(),
  data: { note: 'Signature check from scripts/dodoWebhookPing.js' },
});
const signature = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'webhook-id': id,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': `v1,${signature}`,
  },
  body,
});

const hints = {
  200: 'Signature accepted: the webhook endpoint and secret are set up correctly.',
  401: 'Rejected: DEHUB_DODO_WEBHOOK_SECRET in wp-config.php does not match this secret, or the server clock is off.',
  404: 'Not found: upload the latest functions.php to the WordPress theme.',
};
console.log(`${res.status} ${hints[res.status] || (await res.text()).slice(0, 200)}`);
process.exitCode = res.status === 200 ? 0 : 1;
