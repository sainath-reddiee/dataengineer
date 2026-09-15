/**
 * Dodo Payments catalog for DataEngineer Hub.
 *
 * Product IDs and static payment links come from the live dashboard
 * (https://app.dodopayments.com). They are public, like Stripe price IDs.
 * The API key and webhook secret must NEVER live in VITE_* — they are
 * written to public/api/dodo-secrets.php on Hostinger only.
 *
 * SKU keys are stable. Paste matching pdt_… IDs and checkout links in
 * GitHub Actions / .env — see docs/DODO_PAYMENTS_SETUP.md.
 */

export const DODO_MODE =
  String(import.meta.env.VITE_DODO_MODE || 'live').toLowerCase() === 'test'
    ? 'test'
    : 'live';

export const DODO_CHECKOUT_API_PATH = '/api/dodo-checkout.php';

export const DODO_SKUS = {
  coffee: {
    key: 'coffee',
    name: 'Buy me a coffee',
    kind: 'one_time',
    amountUsd: 5,
    interval: null,
    plan: 'coffee',
    returnPath: '/settings?dodo=success&sku=coffee',
    productEnv: 'VITE_DODO_PRODUCT_COFFEE',
    linkEnv: 'VITE_DODO_LINK_COFFEE',
  },
  pro_monthly: {
    key: 'pro_monthly',
    name: 'Hub Pro — monthly',
    kind: 'subscription',
    amountUsd: 12,
    interval: 'month',
    plan: 'pro',
    returnPath: '/settings?dodo=success&sku=pro_monthly',
    productEnv: 'VITE_DODO_PRODUCT_PRO_MONTHLY',
    linkEnv: 'VITE_DODO_LINK_PRO_MONTHLY',
  },
  pro_annual: {
    key: 'pro_annual',
    name: 'Hub Pro — annual',
    kind: 'subscription',
    amountUsd: 99,
    interval: 'year',
    plan: 'pro',
    returnPath: '/settings?dodo=success&sku=pro_annual',
    productEnv: 'VITE_DODO_PRODUCT_PRO_ANNUAL',
    linkEnv: 'VITE_DODO_LINK_PRO_ANNUAL',
  },
  coaching: {
    key: 'coaching',
    name: '60-minute interview coaching',
    kind: 'one_time',
    amountUsd: 149,
    interval: null,
    plan: 'coaching',
    returnPath: '/settings?dodo=success&sku=coaching',
    productEnv: 'VITE_DODO_PRODUCT_COACHING',
    linkEnv: 'VITE_DODO_LINK_COACHING',
  },
  ad_card_monthly: {
    key: 'ad_card_monthly',
    name: 'Sponsored card — monthly',
    kind: 'one_time',
    amountUsd: 79,
    interval: null,
    plan: null,
    returnPath: '/advertise?dodo=success&sku=ad_card_monthly',
    productEnv: 'VITE_DODO_PRODUCT_AD_CARD_MONTHLY',
    linkEnv: 'VITE_DODO_LINK_AD_CARD_MONTHLY',
  },
  ad_card_yearly: {
    key: 'ad_card_yearly',
    name: 'Sponsored card — yearly',
    kind: 'one_time',
    amountUsd: 699,
    interval: null,
    plan: null,
    returnPath: '/advertise?dodo=success&sku=ad_card_yearly',
    productEnv: 'VITE_DODO_PRODUCT_AD_CARD_YEARLY',
    linkEnv: 'VITE_DODO_LINK_AD_CARD_YEARLY',
  },
  ad_tools: {
    key: 'ad_tools',
    name: 'Tools Hub listing',
    kind: 'one_time',
    amountUsd: 149,
    interval: null,
    plan: null,
    returnPath: '/advertise?dodo=success&sku=ad_tools',
    productEnv: 'VITE_DODO_PRODUCT_AD_TOOLS',
    linkEnv: 'VITE_DODO_LINK_AD_TOOLS',
  },
  ad_guide: {
    key: 'ad_guide',
    name: 'Co-authored integration guide',
    kind: 'one_time',
    amountUsd: 249,
    interval: null,
    plan: null,
    returnPath: '/advertise?dodo=success&sku=ad_guide',
    productEnv: 'VITE_DODO_PRODUCT_AD_GUIDE',
    linkEnv: 'VITE_DODO_LINK_AD_GUIDE',
  },
  ad_newsletter: {
    key: 'ad_newsletter',
    name: 'Newsletter sponsorship',
    kind: 'one_time',
    amountUsd: 79,
    interval: null,
    plan: null,
    returnPath: '/advertise?dodo=success&sku=ad_newsletter',
    productEnv: 'VITE_DODO_PRODUCT_AD_NEWSLETTER',
    linkEnv: 'VITE_DODO_LINK_AD_NEWSLETTER',
  },
};

export const ADVERTISE_SKU_BY_PACKAGE = {
  'resource_reference:monthly': 'ad_card_monthly',
  'resource_reference:yearly': 'ad_card_yearly',
  'directory:one_time': 'ad_tools',
  'content:one_time': 'ad_guide',
  newsletter_sponsorship: 'ad_newsletter',
};

export function envValue(name) {
  if (!name) return '';
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getDodoSku(key) {
  const spec = DODO_SKUS[key];
  if (!spec) return null;
  return {
    ...spec,
    productId: envValue(spec.productEnv),
    paymentLink: envValue(spec.linkEnv),
  };
}

export function dodoSkuConfigured(key) {
  const sku = getDodoSku(key);
  if (!sku) return false;
  return Boolean(sku.productId || sku.paymentLink);
}

export const MEMBERSHIP_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    blurb: 'Tools, starter SQL pads, 12 interview questions, timed quizzes, and every tutorial.',
  },
  pro: {
    id: 'pro',
    name: 'Hub Pro',
    blurb: 'Every SQL pad, the full interview bank, and coaching booking priority — stored on this device after Dodo checkout.',
  },
  coaching: {
    id: 'coaching',
    name: 'Coaching',
    blurb: 'A 60-minute mock plus written notes. We email you to schedule after Dodo confirms payment.',
  },
};
