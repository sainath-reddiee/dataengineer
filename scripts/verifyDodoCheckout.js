import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAdSenseNoindexPath } from '../src/data/adsenseQualityGate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const catalog = read('src/data/dodoCatalog.js');
const checkout = read('src/utils/dodoCheckout.js');
const phpCheckout = read('public/api/dodo-checkout.php');
const phpWebhook = read('public/api/dodo-webhook.php');
const example = read('public/api/dodo-secrets.example.php');
const gitignore = read('.gitignore');
const envExample = read('.env.example');
const deploy = read('.github/workflows/deploy.yml');
const app = read('src/App.jsx');
const header = read('src/components/Header.jsx');
const advertise = read('src/pages/AdvertisePage.jsx');
const support = read('src/components/Support/SupportPanel.jsx');

const skus = [
  'coffee',
  'pro_monthly',
  'pro_annual',
  'coaching',
  'ad_card_monthly',
  'ad_card_yearly',
  'ad_tools',
  'ad_guide',
  'ad_newsletter',
];

for (const sku of skus) {
  assert(catalog.includes(`key: '${sku}'`), `Catalog must define SKU ${sku}`);
}

assert(!envExample.includes('VITE_DODO_PAYMENTS_API_KEY'), 'API key must never be a VITE_ secret');
assert(envExample.includes('DODO_PAYMENTS_API_KEY='), 'Example should mention server API key as a comment');
assert(gitignore.includes('public/api/dodo-secrets.php'), 'Secrets PHP must be gitignored');
assert(phpCheckout.includes('live.dodopayments.com'), 'Checkout PHP must call live API by default');
assert(phpCheckout.includes('product_cart'), 'Checkout PHP must send product_cart');
assert(phpWebhook.includes('webhook-signature') || phpWebhook.includes('WEBHOOK_SIGNATURE'), 'Webhook must read Standard Webhooks signature');
assert(phpWebhook.includes('hash_hmac'), 'Webhook must HMAC-verify');
assert(example.includes("define('DODO_API_KEY'"), 'Example secrets must define API key');
assert(checkout.includes('dodopayments-checkout'), 'Frontend overlay uses official checkout SDK');
assert(catalog.includes('/api/dodo-checkout.php'), 'Catalog must point checkout at Hostinger PHP');
assert(checkout.includes('DODO_CHECKOUT_API_PATH'), 'Frontend must POST to the PHP checkout path');
assert(deploy.includes('DODO_PAYMENTS_API_KEY'), 'Deploy must pass server API key');
assert(deploy.includes('writeDodoSecrets.js'), 'Deploy must write PHP secrets after Vite');
assert(app.includes('PricingPage'), 'App must mount pricing');
assert(app.includes('SettingsPage'), 'App must mount settings');
assert(app.includes('path="upgrade"'), 'App must alias /upgrade to pricing');
assert(header.includes("path: '/pricing'"), 'Header Learn must include pricing');
assert(advertise.includes('Pay with Dodo'), 'Advertise packages must offer Dodo checkout');
assert(support.includes('sku="coffee"'), 'Coffee modal must offer Dodo');
assert(existsSync(join(root, 'docs/DODO_PAYMENTS_SETUP.md')), 'Dashboard setup guide must exist');
assert(existsSync(join(root, 'public/api/.htaccess')), 'API htaccess must deny secrets');
assert(isAdSenseNoindexPath('/settings'), '/settings must stay noindex');
assert(isAdSenseNoindexPath('/saved'), '/saved must stay noindex');
assert(!isAdSenseNoindexPath('/pricing'), '/pricing should stay indexable');
assert(!isAdSenseNoindexPath('/courses'), '/courses should stay indexable');
assert(!isAdSenseNoindexPath('/certs'), '/certs should stay indexable');
assert(!isAdSenseNoindexPath('/interview-questions'), '/interview-questions should stay indexable');

const srcTree = read('src/utils/dodoCheckout.js') + read('src/data/dodoCatalog.js');
assert(!/sk_live_|sk_test_|whsec_[A-Za-z0-9]{8,}/.test(srcTree), 'No live secrets in frontend source');

console.log(`✅ Dodo checkout: ${skus.length} SKUs, PHP session+webhook, overlay fallback, setup guide`);
