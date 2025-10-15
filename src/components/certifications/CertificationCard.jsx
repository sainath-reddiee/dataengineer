// src/components/certifications/CertificationCard.jsx - FINAL VERSION WITH MULTIPLE RESOURCE TYPES
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const CertificationCard = ({ certification }) => {
  if (!certification) return null;

  // ====================================================================
  // START OF FIX: Logic to handle and display multiple resource types
  // ====================================================================
  const resourceTypes = certification.resource_types || [];
  const displayLimit = 2; // Show up to 2 tags on the card
  const displayedTypes = resourceTypes.slice(0, displayLimit);
  const remainingCount = resourceTypes.length - displayedTypes.length;
  // ====================================================================
  // END OF FIX
  // ====================================================================

  return (
    <motion.div 
      className="group relative flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {certification.featured && ( // Note: API sends '1' as a string for true
        <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Star className="h-3 w-3" />
          Featured
        </div>
      )}
      
      <div className="relative h-40 flex items-center justify-center p-4 bg-slate-900 overflow-hidden">
        {certification.featured_image && (
          <motion.img 
            src={certification.featured_image} 
            alt={`${certification.title} logo`} 
            className="max-h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
          />
        )}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {certification.provider && (
          <span className="text-sm font-semibold text-blue-400 mb-1">{certification.provider.name}</span>
        )}
        <h3 className="text-lg font-bold text-white mb-2 flex-grow group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
          {certification.title}
        </h3>
        
        {/* Excerpt now has more space if needed */}
        <p className="text-gray-400 text-xs line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: certification.excerpt }} />

        <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
                {/* ✅ NEW: Loop through and display resource types */}
                {displayedTypes.map(rt => (
                    <span key={rt.slug} className="text-xs font-medium text-green-300 bg-green-900/50 px-2 py-1 rounded">
                        {rt.name}
                    </span>
                ))}
                
                {certification.level && (
                    <span className="text-xs font-medium text-gray-300 bg-slate-700 px-2 py-1 rounded">
                        {certification.level.name}
                    </span>
                )}

                {/* ✅ NEW: Show a "+ more" indicator if needed */}
                {remainingCount > 0 && (
                  <span className="text-xs font-medium text-gray-400">
                    +{remainingCount} more
                  </span>
                )}
            </div>
            <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </motion.div>
  );
};

export default CertificationCard;