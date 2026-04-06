import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'cookie_consent';

/**
 * Returns 'accepted', 'declined', or null (not yet decided)
 */
export const getConsentStatus = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONSENT_KEY);
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('consentChanged', { detail: 'accepted' }));
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('consentChanged', { detail: 'declined' }));
  };

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
