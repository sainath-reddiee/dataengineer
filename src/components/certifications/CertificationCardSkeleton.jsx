// src/components/certifications/CertificationCardSkeleton.jsx - NEW FILE
import React from 'react';

const CertificationCardSkeleton = () => {
  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden animate-pulse">
      {/* Image Container */}
      <div className="relative h-40 flex items-center justify-center p-4 bg-slate-900">
        <div className="w-24 h-24 bg-slate-700 rounded-lg"></div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-slate-600 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-700 rounded w-full mb-1"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6 mb-4"></div>

        <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-slate-700 rounded"></div>
                <div className="h-6 w-24 bg-slate-700 rounded"></div>
            </div>
            <div className="h-5 w-5 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default CertificationCardSkeleton;