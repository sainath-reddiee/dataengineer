// src/pages/certifications/ResourceTypePage.jsx - NEW FILE
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCertifications, useResourceTypes } from '@/hooks/useCertifications';
import CertificationCard from '@/components/certifications/CertificationCard';
import CertificationCardSkeleton from '@/components/certifications/CertificationCardSkeleton';
import MetaTags from '@/components/SEO/MetaTags';
import { ArrowLeft, Loader, ServerCrash, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResourceTypePage = () => {
  const { resourceTypeSlug } = useParams();
  const { certifications, loading, error } = useCertifications({ resourceTypeSlug });
  const { resourceTypes } = useResourceTypes();

  const currentResourceType = resourceTypes.find(rt => rt.slug === resourceTypeSlug);
  const resourceTypeName = currentResourceType ? currentResourceType.name : resourceTypeSlug.replace(/-/g, ' ');

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <CertificationCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12 text-center text-red-400 bg-red-900/50 p-8 rounded-lg">
        <ServerCrash className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Could Not Load Resources</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title={`${resourceTypeName} - Certification Resources`}
        description={`Browse all ${resourceTypeName} for data engineering certifications.`}
      />
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
            <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
                <Link to="/certifications">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Certification Hub
                </Link>
            </Button>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-sm border border-green-400/30 mb-6">
              <FileText className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <span className="gradient-text">{resourceTypeName}</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {currentResourceType?.description || `All available ${resourceTypeName.toLowerCase()} for your certification prep.`}
          </p>
        </div>

        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {certifications.map(cert => (
              <Link to={`/certifications/${cert.slug}`} key={cert.id} className="block">
                <CertificationCard certification={cert} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800/50 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-300">No Resources Found</h3>
            <p className="text-gray-400 mt-2">There are currently no resources of this type available.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ResourceTypePage;