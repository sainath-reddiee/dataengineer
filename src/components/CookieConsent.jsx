import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_TIMESTAMP_KEY = 'cookie_consent_ts';
const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_MAX_AGE_DAYS = 365; // 12 months

// Common crawler/bot user-agent patterns
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|baiduspider|yandex|duckduckbot|googlebot|bingbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|archive\.org_bot|applebot|petalbot|gptbot|claudebot|bytespider|ia_archiver/i;

/**
 * Detect if the current user-agent is a known crawler/bot.
 */
function isBot() {
  if (typeof navigator === 'undefined') return false;
  return BOT_UA_PATTERN.test(navigator.userAgent);
}

/**
 * Set a first-party cookie so the consent decision is readable server-side
 * (e.g. by edge middleware or pre-rendering scripts).
 */
function setConsentCookie(value) {
  if (typeof document === 'undefined') return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
}

/**
 * Returns 'accepted', 'declined', or null (not yet decided).
 * Also checks whether the stored consent has expired (older than CONSENT_MAX_AGE_DAYS).
 */
export const getConsentStatus = () => {
  if (typeof window === 'undefined') return null;

  const consent = localStorage.getItem(CONSENT_KEY);
  if (!consent) return null;

  // Check expiration
  const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
  if (timestamp) {
    const ageMs = Date.now() - Number(timestamp);
    const maxAgeMs = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      // Consent expired — clear it so the banner re-appears
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
      setConsentCookie(''); // clear cookie
      return null;
    }
  }

  return consent;
};

/**
 * Programmatically revoke consent. Clears stored consent and notifies listeners.
 * Can be called from a "Manage cookies" link in a footer/privacy page.
 */
export const revokeConsent = () => {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
  setConsentCookie('');

  // Revoke Google Consent Mode v2 permissions
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
    });
  }

  window.dispatchEvent(new CustomEvent('consentChanged', { detail: 'revoked' }));
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show the consent banner to bots — they can't interact with it,
    // and it blocks crawlers from seeing the actual page content.
    if (isBot()) return;

    const consent = getConsentStatus();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const saveConsent = useCallback((value) => {
    localStorage.setItem(CONSENT_KEY, value);
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, String(Date.now()));
    setConsentCookie(value);
    setVisible(false);

    // Update Google Consent Mode v2 based on user choice
    if (typeof window.gtag === 'function') {
      const granted = value === 'accepted' ? 'granted' : 'denied';
      window.gtag('consent', 'update', {
        'ad_storage': granted,
        'ad_user_data': granted,
        'ad_personalization': granted,
        'analytics_storage': granted,
      });
    }

    window.dispatchEvent(new CustomEvent('consentChanged', { detail: value }));
  }, []);

  const handleAccept = useCallback(() => saveConsent('accepted'), [saveConsent]);
  const handleDecline = useCallback(() => saveConsent('declined'), [saveConsent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto bg-slate-800 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          We use cookies and similar technologies to enhance your experience, analyze site traffic, and serve relevant ads.
          By clicking "Accept", you consent to the use of cookies. Read our{' '}
          <Link to="/privacy-policy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>{' '}
          for more information.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
