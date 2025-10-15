import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Award, BookOpen } from 'lucide-react';

const CertificationCard = ({ certification }) => {
  if (!certification) return null;

  return (
    <motion.div 
      className="group relative flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {/* Featured Badge */}
      {certification.featured === '1' && (
        <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Star className="h-3 w-3" />
          Featured
        </div>
      )}
      
      {/* Image Container */}
      <div className="relative h-36 flex items-center justify-center p-4 bg-slate-900 overflow-hidden">
        {certification.featured_image ? (
          <motion.img 
            src={certification.featured_image} 
            alt={`${certification.title} logo`} 
            className="max-h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Award className="h-16 w-16 text-slate-600" />
        )}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {certification.provider && (
          <span className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">{certification.provider.name}</span>
        )}
        <h3 className="text-md font-bold text-white mb-2 flex-grow group-hover:text-purple-400 transition-colors duration-300">
          {certification.title}
        </h3>
        <p className="text-gray-400 text-xs line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: certification.excerpt }} />

        <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                {certification.level && (
                    <span className="text-xs font-medium text-gray-300 bg-slate-700 px-2 py-1 rounded">
                        {certification.level.name}
                    </span>
                )}
                 {certification.difficulty && (
                    <span className="text-xs font-medium text-gray-300 bg-slate-700 px-2 py-1 rounded">
                        {certification.difficulty}
                    </span>
                 )}
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 group-hover:bg-blue-500/20 transition-colors duration-300">
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CertificationCard;