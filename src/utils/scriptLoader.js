// src/utils/scriptLoader.js
// Load third-party scripts efficiently with environment awareness

import { getConsentStatus } from '../components/CookieConsent';

/**
 * Check if ads are enabled based on environment
 */
function areAdsEnabled() {
  // Check environment variable (string comparison needed for Vite)
  const adsEnabled = import.meta.env.VITE_ADS_ENABLED;
  
  // Convert to boolean - handle string values from env
  if (adsEnabled === 'false' || adsEnabled === false) {
    console.log('🚫 Ads disabled via environment variable');
    return false;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    console.log('🚫 Ads disabled in development mode');
    return false;
  }
  
  // Check for localhost
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')) {
    console.log('🚫 Ads disabled on localhost');
    return false;
  }
  
  console.log('✅ Ads enabled');
  return true;
}

/**
 * Get AdSense Publisher ID from environment
 */
function getAdSensePublisherId() {
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID;
  
  if (!publisherId || publisherId === 'ca-pub-XXXXXXXXXX') {
    console.warn('⚠️ AdSense Publisher ID not configured or using placeholder');
    return null;
  }
  
  return publisherId;
}

/**
 * Load script after user interaction or timeout
 * Prevents blocking initial render
 */
export function loadScriptDelayed(src, options = {}) {
  const {
    timeout = 5000,
    waitForInteraction = true,
    async = true,
    defer = false,
    id = null
  } = options;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (id && document.getElementById(id)) {
      console.log(`✅ Script already loaded: ${id}`);
      resolve();
      return;
    }

    const loadScript = () => {
      console.log(`📥 Loading script: ${src}`);
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;
      if (id) script.id = id;
      
      script.onload = () => {
        console.log(`✅ Script loaded: ${id || src}`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ Failed to load: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
      
      document.head.appendChild(script);
    };

    if (waitForInteraction) {
      // Wait for user interaction
      const events = ['mousedown', 'touchstart', 'scroll', 'keydown'];
      
      const handleInteraction = () => {
        loadScript();
        events.forEach(event => 
          document.removeEventListener(event, handleInteraction)
        );
      };

      events.forEach(event => 
        document.addEventListener(event, handleInteraction, { once: true, passive: true })
      );

      // Fallback timeout
      setTimeout(loadScript, timeout);
    } else {
      // Just delay by timeout
      setTimeout(loadScript, timeout);
    }
  });
}

/**
 * Initialize AdSense ad queue.
 * The adsbygoogle.js script is loaded statically in <head> (with Consent Mode v2
 * defaulting ad_storage to 'denied'). This function only ensures the push queue
 * exists so AdPlacement components can call adsbygoogle.push({}).
 */
export function loadAdSense() {
  if (!areAdsEnabled()) {
    console.log('🚫 AdSense skipped - ads disabled');
    return Promise.resolve();
  }

  const publisherId = getAdSensePublisherId();
  if (!publisherId) {
    console.error('❌ Cannot init AdSense - Publisher ID not configured');
    return Promise.reject(new Error('AdSense Publisher ID not configured'));
  }

  window.adsbygoogle = window.adsbygoogle || [];
  console.log('✅ AdSense queue initialized (script loaded statically)');
  return Promise.resolve();
}

/**
 * Load Google Analytics after interaction
 */
export function loadGoogleAnalytics(measurementId) {
  // GDPR: Only load if user has accepted cookies
  if (getConsentStatus() !== 'accepted') {
    console.log('⏸️ GA loading deferred — waiting for cookie consent');
    return Promise.resolve();
  }

  if (!measurementId) {
    console.warn('⚠️ Google Analytics Measurement ID not provided');
    return Promise.resolve();
  }
  
  if (window.gtag) {
    console.log('✅ Google Analytics already initialized');
    return Promise.resolve();
  }

  console.log('📊 Loading Google Analytics:', measurementId);

  return loadScriptDelayed(
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    {
      id: 'ga-script',
      timeout: 2000,
      waitForInteraction: true
    }
  ).then(() => {
    window.dataLayer = window.dataLayer || [];
    // gtag may already be defined by Consent Mode v2 snippet in index.html — don't overwrite
    if (typeof window.gtag !== 'function') {
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true
    });
    console.log('✅ Google Analytics loaded');
  });
}

/**
 * Prefetch critical resources
 */
export function prefetchResource(url, as = 'script') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnectDomain(domain) {
  // Check if already exists
  if (document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
    return;
  }
  
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  console.log(`🔗 Preconnecting to: ${domain}`);
}

/**
 * Initialize all third-party scripts with delay
 */
export function initThirdPartyScripts() {
  console.log('🚀 Initializing third-party scripts...');
  console.log('Environment:', {
    DEV: import.meta.env.DEV,
    VITE_ADS_ENABLED: import.meta.env.VITE_ADS_ENABLED,
    VITE_ADSENSE_PUBLISHER_ID: import.meta.env.VITE_ADSENSE_PUBLISHER_ID ? '✅ Set' : '❌ Not set',
    VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID ? '✅ Set' : '❌ Not set'
  });
  
  if (typeof window !== 'undefined') {
    // AdSense script is loaded statically in <head> with Consent Mode v2.
    // Just init the push queue immediately — no consent gate needed here.
    if (areAdsEnabled()) {
      loadAdSense().catch(err =>
        console.error('Failed to init AdSense:', err)
      );
    }

    const loadConsentedScripts = () => {
      if (getConsentStatus() !== 'accepted') {
        console.log('⏸️ Third-party scripts deferred — waiting for cookie consent');
        return;
      }

      preconnectDomain('https://www.googletagmanager.com');
      
      const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (gaId) {
        loadGoogleAnalytics(gaId).catch(err => 
          console.error('Failed to load Google Analytics:', err)
        );
      }
    };

    // Attempt now (skips if no consent yet)
    loadConsentedScripts();

    // Re-attempt when user grants consent
    window.addEventListener('consentChanged', (e) => {
      if (e.detail === 'accepted') {
        loadConsentedScripts();
      } else if (e.detail === 'revoked') {
        console.log('⚠️ Cookie consent revoked — third-party scripts will not load on next page.');
        // Note: Already-loaded scripts (GA, AdSense) cannot be fully unloaded at runtime.
        // They will not re-initialize on the next navigation or page load.
      }
    });
  }
}

/**
 * Export environment check for use in components
 */
export { areAdsEnabled, getAdSensePublisherId };