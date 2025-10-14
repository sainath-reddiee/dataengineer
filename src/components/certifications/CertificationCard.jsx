import React, { useState } from 'react';
import { Award, Clock, DollarSign, Download, BookOpen, Star, ChevronRight } from 'lucide-react';

/**
 * CertificationCard Component
 * Reusable card for displaying certification information
 * File: src/components/certifications/CertificationCard.jsx
 */

const CertificationCard = ({ cert, viewMode = 'grid', featured = false }) => {
  const [downloading, setDownloading] = useState(false);

  const API_BASE = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

  const getProviderColor = (provider) => {
    const colors = {
      'aws': 'bg-orange-500',
      'azure': 'bg-blue-500',
      'snowflake': 'bg-cyan-500',
      'gcp': 'bg-red-500',
      'dbt': 'bg-orange-600',
      'databricks': 'bg-red-600',
      'apache': 'bg-purple-600'
    };
    return colors[provider?.toLowerCase()] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'text-green-600 bg-green-50',
      'Intermediate': 'text-orange-600 bg-orange-50',
      'Advanced': 'text-red-600 bg-red-50',
      'Expert': 'text-purple-600 bg-purple-50',
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-50';
  };

  const handleDownload = async () => {
    if (!cert.download_url) {
      alert('Download not available yet. Coming soon!');
      return;
    }
    
    setDownloading(true);
    
    try {
      // Track download
      await fetch(`${API_BASE}/certifications/${cert.id}/download`, {
        method: 'POST',
      });
      
      // Open download
      window.open(cert.download_url, '_blank');
    } catch (error) {
      console.error('Error tracking download:', error);
      // Still open download even if tracking fails
      window.open(cert.download_url, '_blank');
    }
    
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleViewDetails = () => {
    window.location.href = `/certifications/${cert.slug}`;
  };

  // List View
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 flex gap-6">
        <div className="flex-shrink-0">
          {cert.featured_image ? (
            <img 
              src={cert.featured_image} 
              alt={cert.title?.rendered || cert.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Award size={40} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              {cert.provider && (
                <span className={`inline-block px-3 py-1 ${getProviderColor(cert.provider.slug)} text-white text-xs font-semibold rounded-full mb-2`}>
                  {cert.provider.name}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                {cert.title?.rendered || cert.title}
              </h3>
              {cert.cert_code && (
                <p className="text-sm text-gray-500 font-mono">{cert.cert_code}</p>
              )}
            </div>
            {featured && <Star className="text-yellow-500 fill-yellow-500 flex-shrink-0" size={24} />}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            {cert.difficulty && (
              <span className={`flex items-center gap-1 px-2 py-1 rounded ${getDifficultyColor(cert.difficulty)}`}>
                <Award size={16} />
                {cert.difficulty}
              </span>
            )}
            {cert.duration && (
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {cert.duration}
              </span>
            )}
            {cert.exam_cost && (
              <span className="flex items-center gap-1">
                <DollarSign size={16} />
                {cert.exam_cost}
              </span>
            )}
            {cert.downloads_count && (
              <span className="flex items-center gap-1">
                <Download size={16} />
                {cert.downloads_count} downloads
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={16} />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button 
              onClick={handleViewDetails}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
            >
              <BookOpen size={16} />
              View Details
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
      {/* Card Image/Icon */}
      <div className="relative h-48">
        {cert.featured_image ? (
          <img 
            src={cert.featured_image} 
            alt={cert.title?.rendered || cert.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Award size={64} className="text-white" />
          </div>
        )}
        
        {featured && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
            <Star size={16} fill="white" />
            Featured
          </div>
        )}

        {cert.premium === '1' && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            🔒 Premium
          </div>
        )}

        {cert.level && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
            {cert.level.name}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Provider Badge */}
        {cert.provider && (
          <span className={`inline-block px-3 py-1 ${getProviderColor(cert.provider.slug)} text-white text-xs font-semibold rounded-full mb-3`}>
            {cert.provider.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
          {cert.title?.rendered || cert.title}
        </h3>

        {/* Cert Code */}
        {cert.cert_code && (
          <p className="text-sm text-gray-500 font-mono mb-4">{cert.cert_code}</p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4 min-h-[80px]">
          {cert.difficulty && (
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${getDifficultyColor(cert.difficulty)}`}>
              <Award size={16} />
              <span className="font-medium">{cert.difficulty}</span>
            </div>
          )}
          {cert.duration && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{cert.duration}</span>
            </div>
          )}
          {cert.exam_cost && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} />
              <span>{cert.exam_cost}</span>
            </div>
          )}
        </div>

        {/* Resource Types */}
        {cert.resource_types && cert.resource_types.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {cert.resource_types.slice(0, 3).map(type => (
              <span key={type.id} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                {type.name}
              </span>
            ))}
            {cert.resource_types.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                +{cert.resource_types.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Download size={16} />
            {downloading ? 'Downloading...' : 'Download'}
          </button>
          <button 
            onClick={handleViewDetails}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            title="View Details"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Download Count */}
        {cert.downloads_count && parseInt(cert.downloads_count) > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
            <Download size={12} className="inline mr-1" />
            {parseInt(cert.downloads_count).toLocaleString()} downloads
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificationCard;