import { DodoPayments } from 'dodopayments-checkout';
import { DODO_CHECKOUT_API_PATH, DODO_MODE, getDodoSku } from '../data/dodoCatalog.js';
import { trackEvent } from './analytics.js';

let initialized = false;

function origin() {
  if (typeof window === 'undefined') return 'https://dataengineerhub.blog';
  return window.location.origin;
}

export function initDodoOverlay() {
  if (typeof window === 'undefined' || initialized) return;
  try {
    DodoPayments.Initialize({
      mode: DODO_MODE,
      displayType: 'overlay',
      onEvent: (event) => {
        const type = event?.event_type || 'unknown';
        if (type === 'checkout.error') {
          console.warn('Dodo checkout error', event?.data?.message || event);
        }
        if (type === 'checkout.closed' || type === 'checkout.error' || type === 'checkout.opened') {
          trackEvent({
            action: `dodo_${type.replace('.', '_')}`,
            category: 'monetization',
            label: type,
          });
        }
      },
    });
    initialized = true;
  } catch (error) {
    console.warn('Dodo overlay init skipped', error);
  }
}

async function createCheckoutSession(skuKey) {
  const sku = getDodoSku(skuKey);
  if (!sku) throw new Error(`Unknown Dodo SKU: ${skuKey}`);

  const response = await fetch(DODO_CHECKOUT_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: sku.key,
      return_url: `${origin()}${sku.returnPath}`,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.checkout_url) {
    const err = new Error(
      payload.error ||
        payload.code ||
        'Checkout session is not available yet (need live product IDs and Hostinger PHP secrets).'
    );
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload.checkout_url;
}

async function openOverlay(checkoutUrl) {
  initDodoOverlay();
  await DodoPayments.Checkout.open({
    checkoutUrl,
    options: { showTimer: true, showSecurityBadge: true },
  });
}

/**
 * Open Dodo overlay when we can mint a checkout session.
 * Fall back to the dashboard static payment link (navigate) when PHP is
 * not configured yet — Hostinger still needs dodo-secrets.php.
 */
export async function startDodoCheckout(skuKey, { source = 'checkout' } = {}) {
  const sku = getDodoSku(skuKey);
  if (!sku) {
    throw new Error(`Unknown Dodo SKU: ${skuKey}`);
  }

  trackEvent({
    action: 'dodo_checkout_start',
    category: 'monetization',
    label: `${source}:${skuKey}`,
  });

  try {
    const checkoutUrl = await createCheckoutSession(skuKey);
    try {
      await openOverlay(checkoutUrl);
      return { method: 'overlay', checkoutUrl };
    } catch (overlayError) {
      window.location.assign(checkoutUrl);
      return { method: 'redirect', checkoutUrl };
    }
  } catch (apiError) {
    if (sku.paymentLink) {
      try {
        initDodoOverlay();
        await openOverlay(sku.paymentLink);
        return { method: 'overlay_link', checkoutUrl: sku.paymentLink };
      } catch {
        window.location.assign(sku.paymentLink);
        return { method: 'redirect_link', checkoutUrl: sku.paymentLink };
      }
    }
    const hint = dodoReadyMessage(skuKey);
    throw new Error(hint || apiError.message || 'Dodo checkout is not configured yet.');
  }
}

export function dodoReadyMessage(skuKey) {
  const sku = getDodoSku(skuKey);
  if (!sku) return 'This product is not in the catalog.';
  if (sku.productId || sku.paymentLink) return '';
  return 'Dodo live products are not pasted yet. Add the product ID or payment link in GitHub secrets / .env, then redeploy. UPI and PayPal still work.';
}
