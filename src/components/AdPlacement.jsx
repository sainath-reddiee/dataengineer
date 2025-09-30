// src/components/AdPlacement.jsx
// Complete Ezoic ad integration for React SPA
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AdPlacement = ({ position = 'default', placeholder = 102 }) => {
  const location = useLocation();
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Map positions to Ezoic placeholder IDs (update these with your actual IDs from Ezoic dashboard)
  const placeholderIds = {
    'article-top': 102,
    'article-middle': 103,
    'article-bottom': 104,
    'sidebar-top': 105,
    'sidebar-middle': 106,
    'homepage-top': 107,
    'homepage-bottom': 108,
    'default': placeholder
  };

  const placeholderId = placeholderIds[position] || placeholderIds['default'];

  useEffect(() => {
    // Reset state on location change
    setAdLoaded(false);
    setAdError(false);

    // Check if Ezoic is available
    if (typeof window === 'undefined' || !window.ezstandalone) {
      console.warn('⚠️ Ezoic not loaded yet');
      setAdError(true);
      return;
    }

    // Refresh ads on route change for SPA
    const refreshAds = () => {
      try {
        if (window.ezstandalone && window.ezstandalone.cmd) {
          window.ezstandalone.cmd.push(function() {
            window.ezstandalone.refresh();
          });
        }
        setAdLoaded(true);
      } catch (error) {
        console.error('Error refreshing Ezoic ads:', error);
        setAdError(true);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(refreshAds, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Don't show ads in development unless explicitly enabled
  if (import.meta.env.VITE_ADS_ENABLED === 'false' || import.meta.env.VITE_ADS_ENABLED === false) {
    return null; // Don't render anything when ads are disabled
  }

  return (
    <div 
      ref={adRef}
      className="ezoic-ad my-8"
      data-position={position}
    >
      {/* Ezoic Ad Placeholder */}
      <div id={`ezoic-pub-ad-placeholder-${placeholderId}`}></div>
      
      {/* Loading state */}
      {!adLoaded && !adError && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-gray-500">Loading ad...</span>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="text-center py-4 text-xs text-gray-600">
          Ad blocked or failed to load
        </div>
      )}
    </div>
  );
};

export default AdPlacement;