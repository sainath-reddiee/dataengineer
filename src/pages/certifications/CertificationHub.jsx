import React, { useState, useEffect } from 'react';
import { Search, Award, Sparkles } from 'lucide-react';
import CertificationCard from '../../components/certifications/CertificationCard';
import CertificationFilter from '../../components/certifications/CertificationFilter';
import EmptyState from '../../components/certifications/EmptyState';

/**
 * CertificationHub - Main Landing Page
 * File: src/pages/certifications/CertificationHub.jsx
 */

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

  const API_BASE = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all certifications
      const certsResponse = await fetch(`${API_BASE}/certification?per_page=100&_embed`);
      const certsData = await certsResponse.json();
      setCertifications(certsData);

      // Fetch featured
      try {
        const featuredResponse = await fetch(`${API_BASE}/certifications/featured`);
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          setFeatured(featuredData);
        }
      } catch (err) {
        console.log('Featured endpoint not available yet');
      }

      // Fetch stats
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
      import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, Award, Clock, DollarSign, BookOpen, CheckCircle } from 'lucide-react';

// Main Certification Hub Component
const CertificationHub = () => {
  const [certifications, setCertifications] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const API_BASE = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all certifications
      const certsResponse = await fetch(`${API_BASE}/certification?per_page=100&_embed`);
      const certsData = await certsResponse.json();
      setCertifications(certsData);

      // Fetch featured
      const featuredResponse = await fetch(`${API_BASE}/certifications/featured`);
      const featuredData = await featuredResponse.json();
      setFeatured(featuredData);

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE}/certifications/stats`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      setLoading(false);
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'aws': 'bg-orange-500',
      'azure': 'bg-blue-500',
      'snowflake': 'bg-cyan-500',
      'gcp': 'bg-red-500',
      'dbt': 'bg-orange-600',
      'databricks': 'bg-red-600',
    };
    return colors[provider?.toLowerCase()] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'text-green-600',
      'Intermediate': 'text-orange-600',
      'Advanced': 'text-red-600',
      'Expert': 'text-purple-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  const filteredCertifications = certifications.filter(cert => {
    const matchesProvider = selectedProvider === 'all' || 
                           cert.provider?.slug === selectedProvider;
    const matchesLevel = selectedLevel === 'all' || 
                        cert.level?.slug === selectedLevel;
    const matchesSearch = !searchQuery || 
                         cert.title.rendered.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.cert_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesProvider && matchesLevel && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            
            {/* Search Bar */}
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

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">{stats.total_certifications}</div>
                <div className="text-blue-100">Total Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">{stats.providers?.length || 0}</div>
                <div className="text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
                <div className="text-4xl font-bold mb-2">
                  {stats.most_popular?.reduce((sum, cert) => sum + parseInt(cert.downloads || 0), 0)}
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
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Filter size={20} />
                Filters
              </h3>

              {/* Provider Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Providers</option>
                  {stats?.providers?.map(provider => (
                    <option key={provider.slug} value={provider.slug}>
                      {provider.name} ({provider.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="foundational">Foundational</option>
                  <option value="associate">Associate</option>
                  <option value="professional">Professional</option>
                  <option value="specialty">Specialty</option>
                  <option value="expert">Expert</option>
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
                    className={`flex-1 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSelectedProvider('all');
                  setSelectedLevel('all');
                  setSearchQuery('');
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Certifications Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                All Certifications ({filteredCertifications.length})
              </h2>
            </div>

            {filteredCertifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No certifications found matching your criteria.</p>
              </div>
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

// Certification Card Component
const CertificationCard = ({ cert, featured = false, viewMode = 'grid' }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cert.download_url) return;
    
    setDownloading(true);
    
    try {
      // Track download
      await fetch(`https://app.dataengineerhub.blog/wp-json/wp/v2/certifications/${cert.id}/download`, {
        method: 'POST',
      });
      
      // Open download
      window.open(cert.download_url, '_blank');
    } catch (error) {
      console.error('Error tracking download:', error);
    }
    
    setDownloading(false);
  };

  const getProviderColor = (provider) => {
    const colors = {
      'aws': 'bg-orange-500',
      'azure': 'bg-blue-500',
      'snowflake': 'bg-cyan-500',
      'gcp': 'bg-red-500',
      'dbt': 'bg-orange-600',
    };
    return colors[provider?.toLowerCase()] || 'bg-gray-500';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition flex gap-6">
        <div className="flex-shrink-0">
          {cert.featured_image ? (
            <img 
              src={cert.featured_image} 
              alt={cert.title.rendered}
              className="w-24 h-24 object-cover rounded"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
              <Award size={40} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              {cert.provider && (
                <span className={`inline-block px-3 py-1 ${getProviderColor(cert.provider.slug)} text-white text-xs font-semibold rounded-full mb-2`}>
                  {cert.provider.name}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {cert.title.rendered}
              </h3>
              {cert.cert_code && (
                <p className="text-sm text-gray-500 font-mono">{cert.cert_code}</p>
              )}
            </div>
            {featured && <Star className="text-yellow-500 fill-yellow-500" size={24} />}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            {cert.difficulty && (
              <span className="flex items-center gap-1">
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

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!cert.download_url || downloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={16} />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
      {/* Card Image/Icon */}
      <div className="relative">
        {cert.featured_image ? (
          <img 
            src={cert.featured_image} 
            alt={cert.title.rendered}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Award size={64} className="text-white" />
          </div>
        )}
        
        {featured && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star size={16} fill="white" />
            Featured
          </div>
        )}

        {cert.premium === '1' && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            🔒 Premium
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {cert.title.rendered}
        </h3>

        {/* Cert Code */}
        {cert.cert_code && (
          <p className="text-sm text-gray-500 font-mono mb-4">{cert.cert_code}</p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {cert.difficulty && (
            <div className="flex items-center gap-2">
              <Award size={16} />
              <span>Difficulty: {cert.difficulty}</span>
            </div>
          )}
          {cert.duration && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Duration: {cert.duration}</span>
            </div>
          )}
          {cert.exam_cost && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} />
              <span>Cost: {cert.exam_cost}</span>
            </div>
          )}
          {cert.downloads_count && (
            <div className="flex items-center gap-2">
              <Download size={16} />
              <span>{cert.downloads_count} downloads</span>
            </div>
          )}
        </div>

        {/* Resource Types */}
        {cert.resource_types && cert.resource_types.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {cert.resource_types.map(type => (
              <span key={type.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {type.name}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={!cert.download_url || downloading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {downloading ? 'Downloading...' : 'Download'}
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
            <BookOpen size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificationHub;