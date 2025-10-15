// src/components/SidebarAd.jsx - NEW FILE
import React, { Suspense } from 'react';
const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const SidebarAd = ({ position }) => {
  return (
    // This ad will only be visible on large screens and up (lg:block)
    // It will be sticky, staying in view as the user scrolls
    <aside className="hidden lg:block sticky top-24 h-screen">
      <Suspense fallback={<div className="w-full h-64 bg-slate-800/50 rounded-lg animate-pulse" />}>
        <AdPlacement 
          position={position}
          format="auto"
          responsive={true}
          className="w-full"
        />
      </Suspense>
    </aside>
  );
};

export default SidebarAd;