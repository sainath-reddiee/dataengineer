// src/components/AdPlacement.jsx
// Renders a Google AdSense Display Ad unit.
//
// Environment variables (set in Vercel / GitHub secrets, NOT in .env):
//   VITE_ADS_ENABLED=true          — must be "true" to render ads in production
//   VITE_ADSENSE_SLOT_ID=<number>  — numeric slot ID from AdSense UI → Ads → By Ad Unit
//
// How to get your slot ID:
//   1. AdSense UI → Ads → By Ad Unit → Create a "Display" ad unit
//   2. Copy the numeric data-ad-slot value (e.g. "1234567890")
//   3. Add VITE_ADSENSE_SLOT_ID as a Vercel environment variable (Production only)
//   4. Add VITE_ADS_ENABLED=true as a Vercel environment variable
//   5. Redeploy → this component renders the real <ins> unit
//
// Without both vars set in production, falls back to Auto Ads via index.html script.
import React, { useEffect, useRef } from 'react';
import { isAdSenseNoindexPath } from '@/data/adsenseQualityGate';

const CLIENT_ID   = 'ca-pub-8624144810216728';
const SLOT_ID     = import.meta.env.VITE_ADSENSE_SLOT_ID;
const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';
const IS_DEV      = import.meta.env.DEV;

const AdPlacement = ({ className = '', format = 'auto', style = {} }) => {
  const pushed = useRef(false);
  const heldOut = typeof window !== 'undefined' && isAdSenseNoindexPath(window.location.pathname);

  useEffect(() => {
    // Push to adsbygoogle once per mount — only when fully configured
    if (heldOut || !ADS_ENABLED || !SLOT_ID || IS_DEV || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (_) {
      // adsbygoogle not yet loaded — Auto Ads covers it
    }
  }, []);

  if (heldOut) return null;

  // ── Development placeholder ──────────────────────────────────
  if (IS_DEV) {
    const fullyConfigured = ADS_ENABLED && !!SLOT_ID;
    return (
      <div
        className={`my-8 p-4 border-2 border-dashed rounded-lg ${
          fullyConfigured
            ? 'border-green-500 bg-green-500/10'
            : 'border-yellow-500 bg-yellow-500/10'
        } ${className}`}
      >
        <div className={`text-center text-sm ${fullyConfigured ? 'text-green-300' : 'text-yellow-300'}`}>
          <p className="font-semibold mb-1">
            {fullyConfigured
              ? `✅ Ad Unit ready (slot: ${SLOT_ID})`
              : '⚠️ Ad Placeholder — configure via Vercel env vars'}
          </p>
          <p className="text-xs opacity-75">
            {fullyConfigured
              ? 'Real <ins> ad unit will render in production.'
              : 'Set VITE_ADS_ENABLED=true and VITE_ADSENSE_SLOT_ID in Vercel → Settings → Environment Variables.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Production: only render when both flags are set ──────────
  if (ADS_ENABLED && SLOT_ID) {
    return (
      <div className={`text-center overflow-hidden ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', ...style }}
          data-ad-client={CLIENT_ID}
          data-ad-slot={SLOT_ID}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // ── Fallback: Auto Ads via index.html script ─────────────────
  // Neither flag is set → Auto Ads handles placement automatically.
  // Return null to avoid blank gap divs on every page.
  return null;
};

export default AdPlacement;
