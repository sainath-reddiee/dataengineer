// Card checkout for advertise packages. The browser only talks to WordPress;
// WordPress holds the Dodo Payments key and creates the hosted checkout.
import { WORDPRESS_API_URL } from '@/apiConfig';

const BASE = `${WORDPRESS_API_URL}/wp-json/dehub/v1`;

export async function getCheckoutOptions() {
  try {
    const res = await fetch(`${BASE}/checkout/options`);
    if (!res.ok) return { enabled: false, plans: [] };
    const data = await res.json();
    return { enabled: Boolean(data.enabled), mode: data.mode, plans: Array.isArray(data.plans) ? data.plans : [] };
  } catch {
    return { enabled: false, plans: [] };
  }
}

export async function startCheckout(payload) {
  const res = await fetch(`${BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.checkout_url) {
    throw new Error(data.message || 'Checkout could not be started. Please try again or email me.');
  }
  return data;
}

// The host's LiteSpeed cache keeps REST responses, so a fixed URL would keep
// returning the first "pending" answer; a fresh `t` reaches PHP every poll.
export async function getOrderStatus(order) {
  const res = await fetch(`${BASE}/checkout/status?order=${encodeURIComponent(order)}&t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

// Only send buyers to Dodo's hosted checkout, never to a URL from elsewhere.
export function isDodoCheckoutUrl(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && (hostname === 'dodopayments.com' || hostname.endsWith('.dodopayments.com'));
  } catch {
    return false;
  }
}
