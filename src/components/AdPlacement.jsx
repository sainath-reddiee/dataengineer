// src/components/AdPlacement.jsx - Auto Ads only (no individual slot IDs)
import React, { useEffect, useRef, useState } from 'react';
import { getConsentStatus } from '@/components/CookieConsent';

const AdPlacement = ({ 
  className = ''
}) => {
  const adRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID;
  const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED;
  const IS_DEV = import.meta.env.DEV;

  useEffect(() => {
    if (ADS_ENABLED === 'false' || ADS_ENABLED === false) {
      setShouldRender(false);
      return;
    }

    if (IS_DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setShouldRender(false);
      return;
    }

    if (!PUBLISHER_ID) {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);
  }, [ADS_ENABLED, IS_DEV, PUBLISHER_ID]);

  useEffect(() => {
    if (!shouldRender || !PUBLISHER_ID) return;

    const pushAd = () => {
      if (!getConsentStatus()) return;
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    pushAd();

    const onConsentChanged = () => pushAd();
    window.addEventListener('consentChanged', onConsentChanged);
    return () => window.removeEventListener('consentChanged', onConsentChanged);
  }, [shouldRender, PUBLISHER_ID]);

  if (!shouldRender) {
    if (IS_DEV) {
      return (
        <div className={`dev-ad-placeholder my-8 p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-500/10 ${className}`}>
          <div className="text-center text-yellow-300 text-sm">
            <p className="font-semibold mb-1">Ad Placeholder (Auto Ads)</p>
            <p className="text-xs">Ads will appear here in production when VITE_ADSENSE_PUBLISHER_ID is set</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={`adsense-ad my-8 ${className}`}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdPlacement;
