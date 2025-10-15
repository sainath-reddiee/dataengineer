// src/pages/certifications/CertificationHub.jsx - FINAL VERSION WITH RESOURCE TYPE FILTERING
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCertifications } from '@/hooks/useCertifications';
import CertificationCard from '@/components/certifications/CertificationCard';
import CertificationFilter from '@/components/certifications/CertificationFilter';
import MetaTags from '@/components/SEO/MetaTags';
import { Loader, ServerCrash, Search } from 'lucide-react';

const CertificationHub = () => {
  const { certifications, loading, error } = useCertifications();
  const [filters, setFilters] = useState({
    provider: 'all',
    level: 'all',
    resource_type: 'all', // ✅ NEW: Filter state
    search: '',
  });

  const filteredCertifications = useMemo(() => {
    return certifications.filter(cert => {
      const searchMatch = cert.title.toLowerCase().includes(filters.search.toLowerCase()) || cert.cert_code?.toLowerCase().includes(filters.search.toLowerCase());
      const providerMatch = filters.provider === 'all' || cert.provider?.slug === filters.provider;
      const levelMatch = filters.level === 'all' || cert.level?.slug === filters.level;
      // ✅ NEW: Apply resource type filter
      const resourceTypeMatch = filters.resource_type === 'all' || cert.resource_types?.some(rt => rt.slug === filters.resource_type);

      return searchMatch && providerMatch && levelMatch && resourceTypeMatch;
    });
  }, [certifications, filters]);

  const providers = useMemo(() => {
      const allProviders = certifications.map(c => c.provider).filter(Boolean);
      const uniqueProviders = [...new Map(allProviders.map(item => [item['slug'], item])).values()];
      return uniqueProviders.sort((a, b) => a.name.localeCompare(b.name));
  }, [certifications]);
  
  const levels = useMemo(() => {
      const allLevels = certifications.map(c => c.level).filter(Boolean);
      const uniqueLevels = [...new Map(allLevels.map(item => [item['slug'], item])).values()];
      const sortOrder = ['Foundational', 'Associate', 'Professional', 'Specialty', 'Expert'];
      return uniqueLevels.sort((a, b) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));
  }, [certifications]);

  // ✅ NEW: Prepare unique resource types for the filter dropdown
  const resourceTypes = useMemo(() => {
      const allResourceTypes = certifications.flatMap(c => c.resource_types || []).filter(Boolean);
      const uniqueResourceTypes = [...new Map(allResourceTypes.map(item => [item['slug'], item])).values()];
      return uniqueResourceTypes.sort((a, b) => a.name.localeCompare(b.name));
  }, [certifications]);


  return (
    <>
      <MetaTags
        title="Certification Hub - DataEngineer Hub"
        description="Explore study guides, practice questions, and cheat sheets for top data engineering certifications from AWS, Azure, Snowflake, and more."
      />
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 gradient-text">Certification Hub</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Your central resource for data engineering certification guides, practice questions, and study materials.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4 xl:w-1/5">
            <CertificationFilter 
              filters={filters} 
              setFilters={setFilters} 
              providers={providers}
              levels={levels}
              resourceTypes={resourceTypes} // ✅ NEW: Pass data to filter
            />
          </aside>
          
          <main className="w-full lg:w-3/4 xl:w-4/5">
            {loading && (
              <div className="flex justify-center items-center h-96">
                <Loader className="h-12 w-12 animate-spin text-blue-400" />
              </div>
            )}
            {error && (
              <div className="bg-red-900/50 text-red-300 p-6 rounded-lg flex flex-col items-center text-center">
                  <ServerCrash className="h-12 w-12 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Could Not Load Resources</h3>
                  <p className="text-sm">{error}</p>
              </div>
            )}
            
            {!loading && !error && (
              <>
                <div className="mb-6 text-sm text-gray-400">
                  Showing <span className="font-bold text-white">{filteredCertifications.length}</span> of <span className="font-bold text-white">{certifications.length}</span> resources.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCertifications.length > 0 ? (
                    filteredCertifications.map(cert => (
                      <Link to={`/certifications/${cert.slug}`} key={cert.id} className="block">
                        <CertificationCard certification={cert} />
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-slate-800/50 rounded-lg flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-500 mb-4" />
                      <h3 className="text-2xl font-bold text-gray-300">No Certifications Found</h3>
                      <p className="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CertificationHub;