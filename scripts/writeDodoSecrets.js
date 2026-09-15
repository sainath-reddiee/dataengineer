/**
 * Write Hostinger PHP secrets from GitHub Actions env.
 * Never print the API key. Product IDs are public.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'dist/api/dodo-secrets.php');

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value).trim();
  }
  return '';
}

function phpString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const apiKey = env('DODO_PAYMENTS_API_KEY');
const webhook = env('DODO_WEBHOOK_SECRET');
const mode = env('DODO_MODE', 'VITE_DODO_MODE') || 'live';

const php = `<?php
define('DODO_API_KEY', '${phpString(apiKey)}');
define('DODO_WEBHOOK_SECRET', '${phpString(webhook)}');
define('DODO_MODE', '${phpString(mode === 'test' ? 'test' : 'live')}');
define('DODO_PRODUCT_COFFEE', '${phpString(env('DODO_PRODUCT_COFFEE', 'VITE_DODO_PRODUCT_COFFEE'))}');
define('DODO_PRODUCT_PRO_MONTHLY', '${phpString(env('DODO_PRODUCT_PRO_MONTHLY', 'VITE_DODO_PRODUCT_PRO_MONTHLY'))}');
define('DODO_PRODUCT_PRO_ANNUAL', '${phpString(env('DODO_PRODUCT_PRO_ANNUAL', 'VITE_DODO_PRODUCT_PRO_ANNUAL'))}');
define('DODO_PRODUCT_COACHING', '${phpString(env('DODO_PRODUCT_COACHING', 'VITE_DODO_PRODUCT_COACHING'))}');
define('DODO_PRODUCT_AD_CARD_MONTHLY', '${phpString(env('DODO_PRODUCT_AD_CARD_MONTHLY', 'VITE_DODO_PRODUCT_AD_CARD_MONTHLY'))}');
define('DODO_PRODUCT_AD_CARD_YEARLY', '${phpString(env('DODO_PRODUCT_AD_CARD_YEARLY', 'VITE_DODO_PRODUCT_AD_CARD_YEARLY'))}');
define('DODO_PRODUCT_AD_TOOLS', '${phpString(env('DODO_PRODUCT_AD_TOOLS', 'VITE_DODO_PRODUCT_AD_TOOLS'))}');
define('DODO_PRODUCT_AD_GUIDE', '${phpString(env('DODO_PRODUCT_AD_GUIDE', 'VITE_DODO_PRODUCT_AD_GUIDE'))}');
define('DODO_PRODUCT_AD_NEWSLETTER', '${phpString(env('DODO_PRODUCT_AD_NEWSLETTER', 'VITE_DODO_PRODUCT_AD_NEWSLETTER'))}');
`;

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, php);
const ready = Boolean(apiKey) && !apiKey.startsWith('REPLACE_ME');
console.log(ready ? '✅ Wrote dist/api/dodo-secrets.php (API key present)' : '⚠️ Wrote dist/api/dodo-secrets.php without API key — overlay falls back to payment links');
