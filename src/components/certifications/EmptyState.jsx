import React from 'react';
import { Sparkles, Coffee, Clock } from 'lucide-react';

/**
 * EmptyState Component
 * Shows friendly messages when no data is available
 * File: src/components/certifications/EmptyState.jsx
 */

const EmptyState = ({ type = 'default', providerName = '' }) => {
  const getContent = () => {
    switch (type) {
      case 'cooking':
        return {
          icon: <Coffee className="w-20 h-20 text-orange-500 animate-bounce" />,
          title: '🍳 Cooking Up Something Special!',
          message: providerName 
            ? `We're currently preparing ${providerName} certification resources. Check back soon!`
            : 'We\'re currently preparing new certification resources. Check back soon!',
          emoji: '👨‍🍳',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      
      case 'no-results':
        return {
          icon: <Sparkles className="w-20 h-20 text-blue-500" />,
          title: 'No Results Found',
          message: 'Try adjusting your filters or search query to find what you\'re looking for.',
          emoji: '🔍',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      case 'coming-soon':
        return {
          icon: <Clock className="w-20 h-20 text-purple-500" />,
          title: 'Coming Soon!',
          message: providerName
            ? `${providerName} certifications are on our roadmap. Stay tuned!`
            : 'More certifications are on the way. Stay tuned!',
          emoji: '⏰',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      
      default:
        return {
          icon: <Sparkles className="w-20 h-20 text-gray-400" />,
          title: 'Nothing Here Yet',
          message: 'No certifications available at the moment.',
          emoji: '📚',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const content = getContent();

  return (
    <div className={`${content.bgColor} border-2 ${content.borderColor} rounded-xl p-12 text-center`}>
      <div className="flex justify-center mb-6">
        {content.icon}
      </div>
      
      <div className="mb-4">
        <span className="text-6xl mb-4 inline-block">{content.emoji}</span>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {content.title}
      </h3>
      
      <p className="text-gray-600 max-w-md mx-auto mb-6 text-lg">
        {content.message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          onClick={() => window.location.href = '/certifications'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
        >
          Browse All Certifications
        </button>
        
        <button 
          onClick={() => window.location.href = '/articles'}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
        >
          Read Articles Instead
        </button>
      </div>
      
      {type === 'cooking' && (
        <p className="mt-6 text-sm text-gray-500">
          💡 Want to be notified when new resources are added?{' '}
          <a href="/subscribe" className="text-blue-600 hover:underline font-medium">
            Subscribe to our newsletter
          </a>
        </p>
      )}
    </div>
  );
};

export default EmptyState;