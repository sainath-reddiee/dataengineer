// src/pages/certifications/CertificationHub.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCertifications } from '@/hooks/useCertifications';
import CertificationCard from '@/components/certifications/CertificationCard';
import CertificationFilter from '@/components/certifications/CertificationFilter';
import MetaTags from '@/components/SEO/MetaTags';
import { Loader } from 'lucide-react';

const CertificationHub = () => {
  const { certifications, loading, error } = useCertifications();
  const [filters, setFilters] = useState({
    provider: 'all',
    level: 'all',
    resource_type: 'all',
    search: '',
  });

  const filteredCertifications = useMemo(() => {
    return certifications.filter(cert => {
      const searchMatch = cert.title.toLowerCase().includes(filters.search.toLowerCase());
      const providerMatch = filters.provider === 'all' || cert.provider?.slug === filters.provider;
      const levelMatch = filters.level === 'all' || cert.level?.slug === filters.level;
      const resourceMatch = filters.resource_type === 'all' || cert.resource_types?.some(rt => rt.slug === filters.resource_type);

      return searchMatch && providerMatch && levelMatch && resourceMatch;
    });
  }, [certifications, filters]);

  const providers = useMemo(() => [...new Set(certifications.map(c => c.provider?.name).filter(Boolean))], [certifications]);

  return (
    <>
      <MetaTags
        title="Certification Hub - DataEngineer Hub"
        description="Your central place for all data engineering certification resources, guides, and practice materials."
      />
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 gradient-text">Certification Hub</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore study guides, practice questions, and cheat sheets for top data engineering certifications.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-1/4">
            <CertificationFilter filters={filters} setFilters={setFilters} providers={providers} />
          </aside>
          
          <main className="w-full md:w-3/4">
            {loading && (
              <div className="flex justify-center items-center h-64">
                <Loader className="h-12 w-12 animate-spin text-blue-400" />
              </div>
            )}
            {error && <p className="text-red-500 bg-red-900/50 p-4 rounded-lg">{error}</p>}
            
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCertifications.length > 0 ? (
                  filteredCertifications.map(cert => (
                    <Link to={`/certifications/${cert.slug}`} key={cert.id} className="block">
                      <CertificationCard certification={cert} />
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-slate-800/50 rounded-lg">
                    <h3 className="text-2xl font-bold text-gray-300">No certifications found</h3>
                    <p className="text-gray-400 mt-2">Try adjusting your filters or check back later!</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CertificationHub;