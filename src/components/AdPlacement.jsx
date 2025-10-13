// src/components/AdPlacement.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AdPlacement = ({ 
  position = 'default', 
  format = 'auto',
  responsive = true,
  className = ''
}) => {
  const location = useLocation();
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const adInitialized = useRef(false);

  // Your AdSense slot IDs from AdSense dashboard
  const AD_SLOTS = {
    'article-top': '1234567890',
    'article-middle': '0987654321',
    'article-bottom': '1122334455',
    'article-list-top': '2233445566',
    'article-list-bottom': '3344556677',
    'category-top': '4455667788',
    'category-middle': '5566778899',
    'category-bottom': '6677889900',
    'homepage-top': '7788990011',
    'homepage-middle': '8899001122',
    'homepage-bottom': '9900112233',
    'sidebar-top': '5544332211',
    'sidebar-middle': '6677889900',
    'default': '1234567890'
  };

  const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXX';
  const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED;
  const IS_DEV = import.meta.env.DEV;
  const currentSlot = AD_SLOTS[position] || AD_SLOTS['default'];

  // Check if ads should be rendered
  useEffect(() => {
    // Check environment variable (handle string values)
    if (ADS_ENABLED === 'false' || ADS_ENABLED === false) {
      console.log('🚫 Ads disabled via VITE_ADS_ENABLED');
      setShouldRender(false);
      return;
    }

    // Check development mode
    if (IS_DEV) {
      console.log('🚫 Ads disabled in development mode');
      setShouldRender(false);
      return;
    }

    // Check localhost
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1')) {
      console.log('🚫 Ads disabled on localhost');
      setShouldRender(false);
      return;
    }

    // Check if publisher ID is valid
    if (!PUBLISHER_ID || PUBLISHER_ID === 'ca-pub-XXXXXXXXXX') {
      console.warn('⚠️ AdSense Publisher ID not configured');
      setShouldRender(false);
      return;
    }

    console.log('✅ Ads enabled, will render ad:', position);
    setShouldRender(true);
  }, [ADS_ENABLED, IS_DEV, PUBLISHER_ID, position]);

  useEffect(() => {
    if (!shouldRender) return;

    // Initialize ad
    const initAd = () => {
      try {
        if (window.adsbygoogle && !adInitialized.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
          setAdLoaded(true);
          console.log('✅ AdSense ad loaded:', position);
        }
      } catch (error) {
        console.error('❌ AdSense error:', error);
        setAdError(true);
      }
    };

    // Wait for AdSense script to load
    if (window.adsbygoogle) {
      initAd();
    } else {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkInterval);
          initAd();
        }
      }, 100);

      // Clear interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!adInitialized.current) {
          console.warn('⚠️ AdSense script not loaded after 10s');
          setAdError(true);
        }
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [position, shouldRender]);

  // Reset on route change (important for SPA)
  useEffect(() => {
    adInitialized.current = false;
  }, [location.pathname]);

  // Don't render if ads are disabled
  if (!shouldRender) {
    if (IS_DEV) {
      // Show placeholder in development
      return (
        <div className={`dev-ad-placeholder my-8 p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-500/10 ${className}`}>
          <div className="text-center text-yellow-300 text-sm">
            <p className="font-semibold mb-1">📢 Ad Placeholder</p>
            <p className="text-xs">Position: {position}</p>
            <p className="text-xs opacity-75">Ads disabled in development</p>
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
      data-position={position}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={currentSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      
      {!adLoaded && !adError && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading ad...</span>
        </div>
      )}
      
      {adError && (
        <div className="text-center py-4 text-xs text-gray-600">
          <p>Ad failed to load</p>
          {IS_DEV && (
            <p className="mt-1 text-yellow-500">
              Check console for details
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdPlacement;