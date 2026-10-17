// Standard Webhooks signing, as Dodo Payments does it:
// base64(HMAC-SHA256("{id}.{timestamp}.{body}")) keyed with the base64-decoded
// part of the whsec_ secret. Shared by dodoWebhookPing.js and verifyCheckout.js.
import crypto from 'node:crypto';

export function signWebhook(secret, id, timestamp, body) {
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
  return `v1,${crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')}`;
}

export function webhookHeaders(secret, body, { id, timestamp } = {}) {
  const msgId = id || `msg_verify_${crypto.randomBytes(8).toString('hex')}`;
  const ts = timestamp || Math.floor(Date.now() / 1000);
  return {
    'Content-Type': 'application/json',
    'webhook-id': msgId,
    'webhook-timestamp': String(ts),
    'webhook-signature': signWebhook(secret, msgId, ts, body),
  };
}
