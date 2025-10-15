// src/pages/certifications/CertificationHub.jsx - FINAL, CORRECTED, AND IMPROVED VERSION
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCertifications } from '@/hooks/useCertifications';
import CertificationCard from '@/components/certifications/CertificationCard';
import CertificationFilter from '@/components/certifications/CertificationFilter';
import CertificationCardSkeleton from '@/components/certifications/CertificationCardSkeleton'; // Import skeleton
import MetaTags from '@/components/SEO/MetaTags';
import { ServerCrash, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarAd from '@/components/SidebarAd';

const CertificationHub = () => {
  const { certifications, loading, error } = useCertifications();
  const [filters, setFilters] = useState({
    provider: 'all',
    level: 'all',
    search: '',
  });

  const filteredCertifications = useMemo(() => {
    // If certifications haven't loaded yet, return an empty array.
    if (!certifications || certifications.length === 0) {
      return [];
    }
    
    return certifications.filter(cert => {
      // Defensive checks to prevent crashes if data is missing
      const certTitle = cert.title || '';
      const certCode = cert.cert_code || '';

      const searchMatch = certTitle.toLowerCase().includes(filters.search.toLowerCase()) || certCode.toLowerCase().includes(filters.search.toLowerCase());
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

  // Check if any filters are active
  const areFiltersActive = filters.provider !== 'all' || filters.level !== 'all' || filters.search !== '';

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

        <div className="grid lg:grid-cols-[240px_1fr_240px] gap-8">
            <SidebarAd position="sidebar-left" />

            <main className="lg:col-span-1">
                <div className="flex flex-col lg:flex-row gap-8">
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
                            className="w-full mt-4 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => setFilters({ provider: 'all', level: 'all', search: '' })}
                        >
                            Clear All Filters
                        </Button>
                        )}
                    </aside>
                    
                    <div className="w-full lg:w-3/4 xl:w-4/5">
                        {error && (
                        <div className="bg-red-900/50 text-red-300 p-6 rounded-lg flex flex-col items-center text-center">
                            <ServerCrash className="h-12 w-12 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Could Not Load Resources</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                        )}
                        
                        {!error && (
                        <>
                            <div className="mb-6 text-sm text-gray-400">
                            {loading ? 'Loading resources...' : `Showing ${filteredCertifications.length} of ${certifications.length} resources.`}
                            </div>

                            {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, index) => (
                                <CertificationCardSkeleton key={index} />
                                ))}
                            </div>
                            ) : filteredCertifications.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredCertifications.map(cert => (
                                <Link to={`/certifications/${cert.slug}`} key={cert.id} className="block">
                                    <CertificationCard certification={cert} />
                                </Link>
                                ))}
                            </div>
                            ) : (
                            <div className="col-span-full text-center py-20 bg-slate-800/50 rounded-lg flex flex-col items-center">
                                <Search className="h-12 w-12 text-gray-500 mb-4" />
                                <h3 className="text-2xl font-bold text-gray-300">No Certifications Found</h3>
                                <p className="text-gray-400 mt-2">
                                {areFiltersActive ? "Try adjusting your filters or clear them to see all resources." : "Check back later for new certification guides!"}
                                </p>
                            </div>
                            )}
                        </>
                        )}
                    </div>
                </div>
            </main>

            <SidebarAd position="sidebar-right" />
        </div>
      </div>
    </>
  );
};

export default CertificationHub;