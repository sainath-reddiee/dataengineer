// src/pages/certifications/CertificationHub.jsx - IMPROVED VERSION
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCertifications } from '@/hooks/useCertifications';
import CertificationCard from '@/components/certifications/CertificationCard';
import CertificationFilter from '@/components/certifications/CertificationFilter';
import CertificationCardSkeleton from '@/components/certifications/CertificationCardSkeleton';
import MetaTags from '@/components/SEO/MetaTags';
import { 
  ServerCrash, 
  Search, 
  Award, 
  BookOpen, 
  Users, 
  TrendingUp,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CertificationHub = () => {
  const { certifications, loading, error } = useCertifications();
  const [filters, setFilters] = useState({
    provider: 'all',
    level: 'all',
    search: '',
  });

  const filteredCertifications = useMemo(() => {
    if (!certifications || certifications.length === 0) {
      return [];
    }
    
    return certifications.filter(cert => {
      const certTitle = cert.title || '';
      const certCode = cert.cert_code || '';

      const searchMatch = certTitle.toLowerCase().includes(filters.search.toLowerCase()) || 
                         certCode.toLowerCase().includes(filters.search.toLowerCase());
      const providerMatch = filters.provider === 'all' || cert.provider?.slug === filters.provider;
      const levelMatch = filters.level === 'all' || cert.level?.slug === filters.level;

      return searchMatch && providerMatch && levelMatch;
    });
  }, [certifications, filters]);

  const providers = useMemo(() => {
    if (!certifications) return [];
    const allProviders = certifications.map(c => c.provider).filter(Boolean);
    const uniqueProviders = [...new Map(allProviders.map(item => [item['slug'], item])).values()];
    return uniqueProviders.sort((a, b) => a.name.localeCompare(b.name));
  }, [certifications]);
  
  const levels = useMemo(() => {
    if (!certifications) return [];
    const allLevels = certifications.map(c => c.level).filter(Boolean);
    const uniqueLevels = [...new Map(allLevels.map(item => [item['slug'], item])).values()];
    const sortOrder = ['Foundational', 'Associate', 'Professional', 'Specialty', 'Expert'];
    return uniqueLevels.sort((a, b) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));
  }, [certifications]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!certifications || certifications.length === 0) {
      return {
        totalCertifications: 0,
        totalProviders: 0,
        totalResourceTypes: 0,
        featuredCount: 0
      };
    }

    const resourceTypesSet = new Set();
    let featuredCount = 0;

    certifications.forEach(cert => {
      if (cert.resource_types) {
        cert.resource_types.forEach(rt => resourceTypesSet.add(rt.slug));
      }
      if (cert.featured) featuredCount++;
    });

    return {
      totalCertifications: certifications.length,
      totalProviders: providers.length,
      totalResourceTypes: resourceTypesSet.size,
      featuredCount
    };
  }, [certifications, providers]);

  const areFiltersActive = filters.provider !== 'all' || filters.level !== 'all' || filters.search !== '';

  return (
    <>
      <MetaTags
        title="Certification Hub - Master Data Engineering Certifications"
        description="Explore comprehensive study guides, practice questions, and cheat sheets for top data engineering certifications from AWS, Azure, Snowflake, GCP, and more."
        keywords="data engineering certifications, AWS certifications, Azure certifications, Snowflake certification, certification study guide"
      />
      <div className="container mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3 mb-6">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">Your Certification Success Starts Here</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="gradient-text">Certification Hub</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Your central resource for data engineering certification guides, practice questions, cheat sheets, and study materials. 
            Master the certifications that matter.
          </p>

          {/* Stats Cards */}
          {!loading && !error && certifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
            >
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
                <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalCertifications}</div>
                <div className="text-sm text-gray-400">Certifications</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
                <BookOpen className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalResourceTypes}</div>
                <div className="text-sm text-gray-400">Resource Types</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalProviders}</div>
                <div className="text-sm text-gray-400">Providers</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4">
                <TrendingUp className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.featuredCount}</div>
                <div className="text-sm text-gray-400">Featured</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-1/4 xl:w-1/5">
            <CertificationFilter 
              filters={filters} 
              setFilters={setFilters} 
              providers={providers}
              levels={levels}
            />
            {areFiltersActive && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-blue-400 hover:bg-blue-500/10 border border-blue-500/20"
                onClick={() => setFilters({ provider: 'all', level: 'all', search: '' })}
              >
                Clear All Filters
              </Button>
            )}

            {/* Quick Stats in Sidebar */}
            {!loading && filteredCertifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50"
              >
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Showing:</span>
                    <span className="text-white font-medium">{filteredCertifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-medium">{certifications.length}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </aside>
          
          {/* Main Content */}
          <main className="w-full lg:w-3/4 xl:w-4/5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/50 text-red-300 p-8 rounded-xl flex flex-col items-center text-center border border-red-500/20"
              >
                <ServerCrash className="h-16 w-16 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Could Not Load Resources</h3>
                <p className="text-sm text-red-200">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-red-400/50 text-red-300 hover:bg-red-500/20"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </motion.div>
            )}
            
            {!error && (
              <>
                {/* Results Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center justify-between"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {areFiltersActive ? 'Filtered Results' : 'All Certifications'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {loading 
                        ? 'Loading resources...' 
                        : `${filteredCertifications.length} ${filteredCertifications.length === 1 ? 'certification' : 'certifications'} available`
                      }
                    </p>
                  </div>
                </motion.div>

                {/* Certifications Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <CertificationCardSkeleton key={index} />
                    ))}
                  </div>
                ) : filteredCertifications.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {filteredCertifications.map((cert, index) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link to={`/certifications/${cert.slug}`} className="block h-full">
                          <CertificationCard certification={cert} />
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-slate-800/50 rounded-xl flex flex-col items-center border border-slate-700/50"
                  >
                    <Search className="h-16 w-16 text-gray-500 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-300 mb-2">No Certifications Found</h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      {areFiltersActive 
                        ? "No certifications match your current filters. Try adjusting your search criteria." 
                        : "Check back later for new certification guides and resources!"
                      }
                    </p>
                    {areFiltersActive && (
                      <Button 
                        onClick={() => setFilters({ provider: 'all', level: 'all', search: '' })}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </main>
        </div>

        {/* CTA Section */}
        {!loading && !error && certifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-400/20 rounded-2xl text-center"
          >
            <h3 className="text-2xl font-bold mb-4 gradient-text">
              Can't Find What You're Looking For?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              We're constantly adding new certification resources. Have a suggestion? 
              Let us know what certifications you'd like to see covered!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                <Link to="/contact">Request a Certification</Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to="/articles">Browse Articles</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default CertificationHub;