import React from 'react';
import { Filter, X, Grid, List } from 'lucide-react';

/**
 * CertificationFilter Component
 * Sidebar filter for certifications
 * File: src/components/certifications/CertificationFilter.jsx
 */

const CertificationFilter = ({
  providers = [],
  selectedProvider,
  setSelectedProvider,
  selectedLevel,
  setSelectedLevel,
  selectedResourceType,
  setSelectedResourceType,
  viewMode,
  setViewMode,
  onReset
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h3>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          title="Reset all filters"
        >
          <X size={16} />
          Reset
        </button>
      </div>

      {/* Provider Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Providers</option>
          {providers.map(provider => (
            <option key={provider.slug} value={provider.slug}>
              {provider.name} ({provider.count})
            </option>
          ))}
        </select>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certification Level
        </label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Levels</option>
          <option value="foundational">Foundational</option>
          <option value="practitioner">Practitioner</option>
          <option value="associate">Associate</option>
          <option value="professional">Professional</option>
          <option value="specialty">Specialty</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      {/* Resource Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resource Type
        </label>
        <select
          value={selectedResourceType}
          onChange={(e) => setSelectedResourceType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Types</option>
          <option value="cheat-sheet">Cheat Sheet</option>
          <option value="practice-questions">Practice Questions</option>
          <option value="study-guide">Study Guide</option>
          <option value="exam-tips">Exam Tips</option>
          <option value="flashcards">Flashcards</option>
          <option value="video-guide">Video Guide</option>
        </select>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {providers.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Available Providers
          </h4>
          <div className="space-y-2">
            {providers.map(provider => (
              <button
                key={provider.slug}
                onClick={() => setSelectedProvider(provider.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                  selectedProvider === provider.slug
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{provider.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedProvider === provider.slug
                      ? 'bg-blue-200'
                      : 'bg-gray-200'
                  }`}>
                    {provider.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Use filters to quickly find certifications that match your career goals.
        </p>
      </div>
    </div>
  );
};

export default CertificationFilter;