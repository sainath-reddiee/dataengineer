import React, { useState, useEffect } from 'react';
import { Search, Award, Sparkles, Star, Grid, List, Filter, X, Clock, DollarSign, Download, BookOpen, ChevronRight, Loader, Trophy, TrendingUp } from 'lucide-react';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

// ============================================================================
// COMPONENT 1: EmptyState
// ============================================================================
const EmptyState = ({ type = 'default', providerName = '' }) => {
  const getContent = () => {
    switch (type) {
      case 'cooking':
        return {
          icon: '🍳',
          title: 'Cooking Up Something Special!',
          message: providerName 
            ? `We're currently preparing ${providerName} certification resources. Check back soon!`
            : 'We\'re currently preparing new certification resources. Check back soon!',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      
      case 'no-results':
        return {
          icon: '🔍',
          title: 'No Results Found',
          message: 'Try adjusting your filters or search query to find what you\'re looking for.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      case 'coming-soon':
        return {
          icon: '⏰',
          title: 'Coming Soon!',
          message: providerName
            ? `${providerName} certifications are on our roadmap. Stay tuned!`
            : 'More certifications are on the way. Stay tuned!',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      
      default:
        return {
          icon: '📚',
          title: 'Nothing Here Yet',
          message: 'No certifications available at the moment.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const content = getContent();

  return (
    <div className={`${content.bgColor} border-2 ${content.borderColor} rounded-xl p-12 text-center`}>
      <div className="text-6xl mb-4">{content.icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{content.title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6 text-lg">{content.message}</p>
      
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
          <a href="/newsletter" className="text-blue-600 hover:underline font-medium">
            Subscribe to our newsletter
          </a>
        </p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT 2: CertificationCard
// ============================================================================
const CertificationCard = ({ cert, viewMode = 'grid', featured = false }) => {
  const [downloading, setDownloading] = useState(false);

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
      alert('Download coming soon! We\'re preparing this resource.');
      return;
    }
    
    setDownloading(true);
    
    try {
      await fetch(`${API_BASE}/certifications/${cert.id}/download`, {
        method: 'POST',
      });
      window.open(cert.download_url, '_blank');
    } catch (error) {
      console.error('Error:', error);
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
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
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
        {cert.provider && (
          <span className={`inline-block px-3 py-1 ${getProviderColor(cert.provider.slug)} text-white text-xs font-semibold rounded-full mb-3`}>
            {cert.provider.name}
          </span>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
          {cert.title?.rendered || cert.title}
        </h3>

        {cert.cert_code && (
          <p className="text-sm text-gray-500 font-mono mb-4">{cert.cert_code}</p>
        )}

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

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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

// ============================================================================
// COMPONENT 3: CertificationFilter
// ============================================================================
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
        >
          <X size={16} />
          Reset
        </button>
      </div>

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

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Use filters to quickly find certifications that match your career goals.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE: CertificationHub
// ============================================================================
const CertificationHub = () => {
  const [certifications, setCertifications] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const certsResponse = await fetch(`${API_BASE}/certification?per_page=100&_embed`);
      const certsData = await certsResponse.json();
      setCertifications(certsData);

      try {
        const featuredResponse = await fetch(`${API_BASE}/certifications/featured`);
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          setFeatured(featuredData);
        }
      } catch (err) {
        console.log('Featured endpoint not available yet');
      }

      try {
        const statsResponse = await fetch(`${API_BASE}/certifications/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (err) {
        console.log('Stats endpoint not available yet');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      setLoading(false);
    }
  };

  const filteredCertifications = certifications.filter(cert => {
    const matchesProvider = selectedProvider === 'all' || 
                           cert.provider?.slug === selectedProvider;
    const matchesLevel = selectedLevel === 'all' || 
                        cert.level?.slug === selectedLevel;
    const matchesSearch = !searchQuery || 
                         cert.title?.rendered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.cert_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesProvider && matchesLevel && matchesSearch;
  });

  const handleReset = () => {
    setSelectedProvider('all');
    setSelectedLevel('all');
    setSelectedResourceType('all');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <Loader className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Award size={48} />
              Certification Hub
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Your Complete Data Engineering Certification Prep Resource
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search certifications by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">{stats.total_certifications || certifications.length}</div>
                <div className="text-blue-100">Total Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">{stats.providers?.length || 0}</div>
                <div className="text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">
                  {stats.most_popular?.reduce((sum, cert) => sum + parseInt(cert.downloads || 0), 0) || 0}
                </div>
                <div className="text-blue-100">Total Downloads</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Featured Certifications */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Featured Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.slice(0, 6).map(cert => (
              <CertificationCard key={cert.id} cert={cert} featured={true} />
            ))}
          </div>
        </div>
      )}

      {/* Filters and Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <CertificationFilter
              providers={stats?.providers || []}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              selectedResourceType={selectedResourceType}
              setSelectedResourceType={setSelectedResourceType}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onReset={handleReset}
            />
          </div>

          {/* Certifications Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                All Certifications ({filteredCertifications.length})
              </h2>
            </div>

            {filteredCertifications.length === 0 ? (
              certifications.length === 0 ? (
                <EmptyState type="cooking" />
              ) : (
                <EmptyState type="no-results" />
              )
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                : 'space-y-4'
              }>
                {filteredCertifications.map(cert => (
                  <CertificationCard 
                    key={cert.id} 
                    cert={cert} 
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationHub;