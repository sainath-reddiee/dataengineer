// src/components/AdPlacement.jsx
// Auto-Ads-only placeholder. We intentionally do NOT render an <ins class="adsbygoogle">
// because we don't have a real numeric ad slot ID yet. Shipping data-ad-slot="auto"
// (a string, not a number) is INVALID AdSense markup and fails AdSense review.
//
// AdSense loader script (in <head> of every page) + "Auto Ads" enabled in the
// AdSense UI is sufficient for:
//   1. AdSense crawler verification during approval
//   2. Automatic ad placement after approval
//
// When you have a real ad unit (numeric slot from AdSense UI), replace this
// component with a proper <ins> that uses that slot ID.
import React from 'react';

const AdPlacement = ({ className = '' }) => {
  const IS_DEV = import.meta.env.DEV;

  if (IS_DEV) {
    return (
      <div className={`dev-ad-placeholder my-8 p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-500/10 ${className}`}>
        <div className="text-center text-yellow-300 text-sm">
          <p className="font-semibold mb-1">Ad Placeholder (Auto Ads)</p>
          <p className="text-xs">
            Auto Ads handles placement in production. Enable Auto Ads in your
            AdSense UI after approval. No manual ad unit needed.
          </p>
        </div>
      </div>
    );
  }

  // Production: Auto Ads handles placement automatically via the script
  // in index.html. No need to render empty placeholder divs that create
  // blank 280px gaps on every page. Once you have a real ad unit (numeric
  // slot ID from AdSense UI), replace this with a proper <ins> element.
  return null;
};

export default AdPlacement;
