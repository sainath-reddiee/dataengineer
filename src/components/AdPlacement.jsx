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
  const adInitialized = useRef(false);

  // Your AdSense slot IDs from AdSense dashboard
  const AD_SLOTS = {
    'article-top': '1234567890',      // Replace with real slot
    'article-middle': '0987654321',   // Replace with real slot
    'article-bottom': '1122334455',   // Replace with real slot
    'sidebar-top': '5544332211',      // Replace with real slot
    'sidebar-middle': '6677889900',   // Replace with real slot
    'homepage-top': '9988776655',     // Replace with real slot
    'homepage-bottom': '4433221100',  // Replace with real slot
    'default': '1234567890'           // Replace with real slot
  };

  const PUBLISHER_ID = 'ca-pub-XXXXXXXXXX'; // Replace with your ID
  const currentSlot = AD_SLOTS[position] || AD_SLOTS['default'];

  useEffect(() => {
    // Don't show ads in development
    if (import.meta.env.VITE_ADS_ENABLED === 'false') {
      return;
    }

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

      return () => clearInterval(checkInterval);
    }
  }, [position]);

  // Reset on route change (important for SPA)
  useEffect(() => {
    adInitialized.current = false;
  }, [location.pathname]);

  // Don't render in development
  if (import.meta.env.VITE_ADS_ENABLED === 'false') {
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
          Ad failed to load
        </div>
      )}
    </div>
  );
};

export default AdPlacement;