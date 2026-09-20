// DodoPayments SDK & Service — Configured to use the local Express backend

export function getDodoPaymentMode() {
  try {
    const savedMode = localStorage.getItem('de_hub_dodo_mode');
    if (savedMode === 'test' || savedMode === 'live') return savedMode;
  } catch { /* ignore */ }
  return import.meta.env.VITE_DODO_MODE || 'live';
}

export function setDodoPaymentMode(mode) {
  if (mode === 'test' || mode === 'live') {
    localStorage.setItem('de_hub_dodo_mode', mode);
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Initiates a DodoPayments checkout session by calling the secure Express backend.
 * @param {Object} params
 * @param {string} params.packageKey - Package identifier ('pro_monthly' | 'pro_annual')
 * @param {string} params.customerEmail - Customer email address
 */
export async function createDodoCheckoutSession({ packageKey = 'pro_monthly', customerEmail = '' }) {
  try {
    // We call our new local backend running on port 3002
    // The backend securely creates the session with Dodo Payments API using the secret key
    const response = await fetch('http://localhost:3002/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageKey, customerEmail })
    });

    if (!response.ok) {
      throw new Error(`Backend checkout API failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.url) {
      return {
        success: true,
        url: data.url
      };
    } else {
      throw new Error('No checkout URL returned from backend');
    }
  } catch (err) {
    console.error('Checkout error:', err);
    throw err;
  }
}
