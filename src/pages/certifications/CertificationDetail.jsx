// src/pages/certifications/CertificationDetail.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCertification } from '@/hooks/useCertifications';
import MetaTags from '@/components/SEO/MetaTags';
import { Loader, ArrowLeft, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CertificationDetail = () => {
  const { slug } = useParams();
  const { certification, loading, error } = useCertification(slug);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-16 w-16 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto px-6 py-12 text-center text-red-500 bg-red-900/50 p-8 rounded-lg">{error}</div>;
  }
  
  if (!certification) {
    return <div className="container mx-auto px-6 py-12 text-center">Certification not found.</div>;
  }

  return (
    <>
      <MetaTags
        title={`${certification.title} - Certification Hub`}
        description={certification.excerpt}
      />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/certifications" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all certifications
        </Link>
        
        <div className="flex items-start gap-6 mb-8">
          {certification.featured_image && (
            <img src={certification.featured_image} alt={certification.title} className="w-24 h-24 object-contain rounded-lg bg-white/10 p-2" />
          )}
          <div>
            <h1 className="text-4xl font-black mb-2 gradient-text">{certification.title}</h1>
            <p className="text-lg text-gray-300">{certification.cert_official_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Cost</p>
            <p className="font-bold text-lg">{certification.exam_cost}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Duration</p>
            <p className="font-bold text-lg">{certification.duration}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Questions</p>
            <p className="font-bold text-lg">{certification.questions_count}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Passing Score</p>
            <p className="font-bold text-lg">{certification.passing_score}</p>
          </div>
        </div>

        {certification.download_url && (
          <div className="my-8">
            <Button asChild size="lg" className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold group">
              <a href={certification.download_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Download Study Guide
              </a>
            </Button>
          </div>
        )}

        <div className="prose prose-invert max-w-none article-content" dangerouslySetInnerHTML={{ __html: certification.content }} />
      </div>
    </>
  );
};

export default CertificationDetail;