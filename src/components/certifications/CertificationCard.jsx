// src/components/certifications/CertificationCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CertificationCard = ({ certification }) => {
  return (
    <motion.div 
      className="blog-card rounded-xl overflow-hidden h-full group"
      whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {certification.featured_image && (
        <div className="h-48 overflow-hidden">
          <img 
            src={certification.featured_image} 
            alt={certification.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        {certification.provider && (
          <span className="text-sm font-bold text-blue-400 mb-2">{certification.provider.name}</span>
        )}
        <h3 className="text-xl font-bold mb-3 flex-grow group-hover:text-purple-400 transition-colors">
          {certification.title}
        </h3>
        <div className="text-gray-400 text-sm line-clamp-3" dangerouslySetInnerHTML={{ __html: certification.excerpt }} />
      </div>
    </motion.div>
  );
};

export default CertificationCard;