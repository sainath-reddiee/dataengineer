import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_TIMESTAMP_KEY = 'cookie_consent_ts';
const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_MAX_AGE_DAYS = 365; // 12 months
const STATIC_BANNER_ID = 'deh-cookie-banner';

function hideStaticBanner() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('deh-consent-ready');
  document.documentElement.classList.remove('deh-need-consent');
  const el = document.getElementById(STATIC_BANNER_ID);
  if (el) el.hidden = true;
}

function showStaticBanner() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('deh-consent-ready');
  document.documentElement.classList.add('deh-need-consent');
  const el = document.getElementById(STATIC_BANNER_ID);
  if (el) el.hidden = false;
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

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied',
      'security_storage': 'granted',
    });
  }

  showStaticBanner();
  window.dispatchEvent(new CustomEvent('consentChanged', { detail: 'revoked' }));
};

/**
 * Footer "Privacy settings". Reopens Google's certified message when that
 * prompt is on the page. Otherwise reopens the one-line site banner.
 * The two prompts are never left on screen together.
 */
export const openPrivacySettings = () => {
  const fc = typeof window !== 'undefined' ? window.googlefc : null;
  if (fc && typeof fc.showRevocationMessage === 'function') {
    try {
      fc.showRevocationMessage();
      hideStaticBanner();
      return;
    } catch {
      // Fall through to the site banner.
    }
  }
  revokeConsent();
};

const CookieConsent = () => {
  // First paint must already include the banner for first-time visitors.
  // A post-mount setState is what Lighthouse scores as ~0.9 CLS.
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !getConsentStatus();
  });

  const saveConsent = useCallback((value) => {
    localStorage.setItem(CONSENT_KEY, value);
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, String(Date.now()));
    setConsentCookie(value);
    hideStaticBanner();
    setVisible(false);

    if (typeof window.gtag === 'function') {
      const granted = value === 'accepted' ? 'granted' : 'denied';
      window.gtag('consent', 'update', {
        'ad_storage': granted,
        'ad_user_data': granted,
        'ad_personalization': granted,
        'analytics_storage': granted,
        'functionality_storage': 'granted',
        'personalization_storage': granted,
        'security_storage': 'granted',
      });
    }

    window.dispatchEvent(new CustomEvent('consentChanged', { detail: value }));
  }, []);

  useEffect(() => {
    if (getConsentStatus()) {
      hideStaticBanner();
      setVisible(false);
    }

    const onChanged = (event) => {
      if (event?.detail === 'revoked') {
        setVisible(true);
        return;
      }
      hideStaticBanner();
      setVisible(false);
    };
    window.addEventListener('consentChanged', onChanged);
    return () => window.removeEventListener('consentChanged', onChanged);
  }, []);

  // Static banner in index.html owns first paint. Do not mount a second copy.
  if (typeof document !== 'undefined' && document.getElementById(STATIC_BANNER_ID)) {
    return null;
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink bg-paper px-4 py-2"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <p className="min-w-[12rem] flex-1 text-[13px] leading-snug text-ink-body">
          Cookies run analytics and ads.{' '}
          <Link to="/privacy-policy#cookies" className="text-rust-600 underline decoration-rust-200 underline-offset-2">
            Privacy Policy
          </Link>
          . Accept to allow them, or decline and keep essential cookies only.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => saveConsent('declined')}
            className="rounded border border-paper-600 px-3 py-1.5 text-sm text-ink-body hover:border-ink"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => saveConsent('accepted')}
            className="rounded bg-ink px-3 py-1.5 text-sm text-paper hover:bg-rust-600"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
