// src/utils/scriptLoader.js
// Load third-party scripts efficiently

/**
 * Load script after user interaction or timeout
 * Prevents blocking initial render
 */
export function loadScriptDelayed(src, options = {}) {
  const {
    timeout = 3000,
    waitForInteraction = true,
    async = true,
    defer = false,
    id = null
  } = options;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }

    const loadScript = () => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;
      if (id) script.id = id;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      
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
 * Load Ezoic ads after interaction
 */
export function loadAdSense(publisherId) {
  if (window.adsbygoogle) return Promise.resolve();

  return loadScriptDelayed(
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`,
    {
      id: 'adsense-script',
      timeout: 2000,
      waitForInteraction: true,
      async: true
    }
  ).then(() => {
    window.adsbygoogle = window.adsbygoogle || [];
    console.log('✅ AdSense loaded');
  });
}

/**
 * Load Google Analytics after interaction
 */
export function loadGoogleAnalytics(measurementId) {
  if (window.gtag) return Promise.resolve();

  return loadScriptDelayed(
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    {
      id: 'ga-script',
      timeout: 2000,
      waitForInteraction: true
    }
  ).then(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false
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
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Initialize all third-party scripts with delay
 */
export function initThirdPartyScripts() {
  preconnectDomain('https://www.googletagmanager.com');
  preconnectDomain('https://pagead2.googlesyndication.com');
  preconnectDomain('https://googleads.g.doubleclick.net');
  
  if (typeof window !== 'undefined') {
    loadGoogleAnalytics('G-MTMNP6EV9C');
    loadAdSense('ca-pub-XXXXXXXXXX'); // Your AdSense ID
  }
}