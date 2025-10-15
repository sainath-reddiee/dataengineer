// src/components/AdPlacement.jsx - FIXED VERSION WITH DYNAMIC SIZING
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
  const [adError, setAdError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [adHeight, setAdHeight] = useState(null);
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
    'sidebar-left': '5544332211',
    'sidebar-right': '6677889900',
    'default': '1234567890'
  };

  const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXX';
  const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED;
  const IS_DEV = import.meta.env.DEV;
  const currentSlot = AD_SLOTS[position] || AD_SLOTS['default'];
  const initialMinHeight = '90px'; // Start with a smaller, common ad height

  useEffect(() => {
    // Determine if ads should render at all
    const isAdsActive = ADS_ENABLED !== 'false' && ADS_ENABLED !== false &&
                        !IS_DEV &&
                        window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1' &&
                        PUBLISHER_ID && PUBLISHER_ID !== 'ca-pub-XXXXXXXXXX';
    setShouldRender(isAdsActive);
  }, [ADS_ENABLED, IS_DEV, PUBLISHER_ID]);

  useEffect(() => {
    if (!shouldRender || !adRef.current) return;

    // Reset state on location change
    setAdHeight(null);
    adInitialized.current = false;

    const adContainer = adRef.current;
    let observer;

    const initAd = () => {
      try {
        if (window.adsbygoogle && !adInitialized.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
        }
      } catch (error) {
        console.error('❌ AdSense push error:', error);
        setAdError(true);
        setAdHeight(0); // Collapse if push fails
      }
    };
    
    // Observer to detect when ad is loaded and get its height
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const adIframe = adContainer.querySelector('iframe');
          if (adIframe && adIframe.offsetHeight > 0) {
            setAdHeight(adIframe.offsetHeight);
            observer.disconnect(); // Stop observing once we have the ad
            return;
          }
        }
      }
    });

    observer.observe(adContainer, { childList: true, subtree: true });

    // Fallback timer: if no ad loads in 5s, collapse the container
    const fallbackTimeout = setTimeout(() => {
      if (adHeight === null) {
        setAdHeight(0); // Collapse container
        setAdError(true);
      }
    }, 5000);
    
    // Attempt to push the ad
    initAd();

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [location.pathname, position, shouldRender]);

  if (!shouldRender) {
    if (IS_DEV) {
      return (
        <div className={`dev-ad-placeholder my-8 p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-500/10 ${className}`} style={{ minHeight: '90px' }}>
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
        minHeight: adHeight === null ? initialMinHeight : `${adHeight}px`,
        transition: 'min-height 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={currentSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      
      {adHeight === null && !adError && (
        <div className="flex items-center justify-center py-8 absolute">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading ad...</span>
        </div>
      )}
    </div>
  );
};

export default AdPlacement;