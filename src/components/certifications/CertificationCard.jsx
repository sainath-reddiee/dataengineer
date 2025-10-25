// src/components/certifications/CertificationCard.jsx - ENHANCED VERSION
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Download, ExternalLink } from 'lucide-react';

const CertificationCard = ({ certification }) => {
  if (!certification) return null;

  const resourceTypes = certification.resource_types || [];
  const displayLimit = 3;
  const displayedTypes = resourceTypes.slice(0, displayLimit);
  const remainingCount = resourceTypes.length - displayedTypes.length;

  // Resource type color mapping
  const getResourceTypeColor = (typeName) => {
  const colors = {
    'Cheat Sheet': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Practice Questions': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Study Guide': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Exam Tips': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Video Course': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Flashcards': 'bg-pink-500/20 text-pink-300 border-pink-500/30', // ADD THIS
  };
  return colors[typeName] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
};

  return (
    <motion.div 
      className="group relative flex flex-col h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Featured Badge */}
      {certification.featured && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-sm text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 border border-yellow-500/30">
          <Star className="h-3 w-3 fill-yellow-300" />
          Featured
        </div>
      )}
      
      {/* Provider Logo Section */}
      <div className="relative h-48 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        {certification.featured_image && (
          <motion.img 
            src={certification.featured_image} 
            alt={`${certification.title} logo`} 
            className="max-h-32 w-auto object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 relative z-10"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Provider Badge */}
        {certification.provider && (
          <div className="mb-3">
            <span className="inline-block text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              {certification.provider.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 flex-grow group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-tight">
          {certification.title}
        </h3>
        
        {/* Excerpt */}
        <p 
          className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: certification.excerpt }} 
        />

        {/* Resource Types Section */}
        {resourceTypes.length > 0 && (
          <div className="mb-4 pb-4 border-b border-slate-700/50">
            <div className="flex flex-wrap items-center gap-2">
              {displayedTypes.map(rt => (
                <span 
                  key={rt.slug} 
                  className={`text-xs font-medium px-2.5 py-1 rounded-md border ${getResourceTypeColor(rt.name)}`}
                >
                  {rt.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-xs font-medium text-gray-400 bg-slate-700/30 px-2.5 py-1 rounded-md">
                  +{remainingCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom Section: Level & Action */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {certification.level && (
              <span className="text-xs font-medium text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/20">
                {certification.level.name}
              </span>
            )}
          </div>
          
          {/* Action Icon */}
          <div className="flex items-center gap-2">
            {certification.download_url && (
              <Download className="h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
            <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
    </motion.div>
  );
};

export default CertificationCard;