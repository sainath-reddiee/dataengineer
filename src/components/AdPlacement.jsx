// src/components/AdPlacement.jsx - FIXED VERSION WITH RESERVED SPACE
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

  // ✅ CRITICAL FIX: Reserve space to prevent layout shift
  const AD_HEIGHTS = {
    'auto': '250px',
    'horizontal': '90px',
    'vertical': '600px',
    'rectangle': '250px'
  };

  const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXX';
  const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED;
  const IS_DEV = import.meta.env.DEV;
  const currentSlot = AD_SLOTS[position] || AD_SLOTS['default'];
  const reservedHeight = AD_HEIGHTS[format] || AD_HEIGHTS['auto'];

  useEffect(() => {
    if (ADS_ENABLED === 'false' || ADS_ENABLED === false) {
      setShouldRender(false);
      return;
    }

    if (IS_DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setShouldRender(false);
      return;
    }

    if (!PUBLISHER_ID || PUBLISHER_ID === 'ca-pub-XXXXXXXXXX') {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);
  }, [ADS_ENABLED, IS_DEV, PUBLISHER_ID]);

  useEffect(() => {
    if (!shouldRender) return;

    const initAd = () => {
      try {
        if (window.adsbygoogle && !adInitialized.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
          setAdLoaded(true);
        }
      } catch (error) {
        console.error('❌ AdSense error:', error);
        setAdError(true);
      }
    };

    if (window.adsbygoogle) {
      initAd();
    } else {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkInterval);
          initAd();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!adInitialized.current) {
          setAdError(true);
        }
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [position, shouldRender]);

  useEffect(() => {
    adInitialized.current = false;
  }, [location.pathname]);

  if (!shouldRender) {
    if (IS_DEV) {
      return (
        <div className={`dev-ad-placeholder my-8 p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-500/10 ${className}`} style={{ minHeight: reservedHeight }}>
          <div className="text-center text-yellow-300 text-sm">
            <p className="font-semibold mb-1">📢 Ad Placeholder</p>
            <p className="text-xs">Position: {position}</p>
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
      style={{ 
        minHeight: reservedHeight, // ✅ CRITICAL: Reserve space
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', minHeight: reservedHeight }}
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
    </div>
  );
};

export default AdPlacement;