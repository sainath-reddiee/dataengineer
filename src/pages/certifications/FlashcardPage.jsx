// src/pages/certifications/FlashcardPage.jsx - CORRECTED with relative imports
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCertification } from '../../hooks/useCertifications';
import FlashcardViewer from '../../components/certifications/FlashcardViewer';
import MetaTags from '../../components/SEO/MetaTags';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

const FlashcardPage = () => {
  const { slug } = useParams();
  const { certification, loading, error } = useCertification(slug);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Add keyboard shortcuts for better UX
      // These will be handled by FlashcardViewer component
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <Loader className="h-16 w-16 animate-spin text-blue-400 mb-4" />
        <p className="text-gray-400">Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Flashcards</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <Button asChild variant="outline" className="border-blue-400/50 text-blue-300">
              <Link to="/certifications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Certifications
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Certification Not Found</h2>
            <p className="text-gray-400 mb-6">The requested certification could not be found.</p>
            <Button asChild variant="outline" className="border-blue-400/50 text-blue-300">
              <Link to="/certifications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Certifications
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get flashcards from certification data or use sample data
  const flashcards = certification.flashcards && certification.flashcards.length > 0
    ? certification.flashcards
    : getSampleFlashcards(certification.title);

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
        <div className="container mx-auto px-6">
          <Button
            asChild
            variant="ghost"
            className="mb-6 text-blue-400 hover:text-blue-300"
          >
            <Link to={`/certifications/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certification
            </Link>
          </Button>

          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🎴</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Flashcards Available</h2>
            <p className="text-gray-400 mb-6">
              Flashcards haven't been created for this certification yet.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={`/certifications/${slug}`}>
                View Certification Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title={`${certification.title} - Flashcards | Certification Hub`}
        description={`Study ${certification.title} with interactive flashcards. ${flashcards.length} cards available.`}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
        <div className="container mx-auto px-6">
          <Button
            asChild
            variant="ghost"
            className="mb-6 text-blue-400 hover:text-blue-300"
          >
            <Link to={`/certifications/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certification
            </Link>
          </Button>

          <div className="text-center mb-8">
            {certification.featured_image && (
              <img
                src={certification.featured_image}
                alt={certification.title}
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            )}
            <h1 className="text-4xl font-black mb-2 gradient-text">
              {certification.title}
            </h1>
            <p className="text-gray-400">Interactive Flashcards • {flashcards.length} Cards</p>
          </div>

          <FlashcardViewer flashcards={flashcards} />

          {/* Additional Study Resources */}
          <div className="max-w-4xl mx-auto mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">More Study Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                asChild
                variant="outline"
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to={`/certifications/${slug}`}>
                  View Full Guide
                </Link>
              </Button>
              {certification.download_url && (
                <Button
                  asChild
                  variant="outline"
                  className="border-green-400/50 text-green-300 hover:bg-green-500/20"
                >
                  <a href={certification.download_url} target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
              >
                <Link to="/certifications">
                  Browse All Certs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper function to generate sample flashcards based on certification
function getSampleFlashcards(title) {
  // Return empty array if no sample data
  // In production, this would fetch from your API
  if (title.includes('AWS')) {
    return [
      {
        question: 'What is AWS Lambda?',
        answer: 'A serverless compute service that runs code in response to events',
        explanation:
          'AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume. There is no charge when your code is not running.',
      },
      {
        question: 'What is Amazon S3?',
        answer: 'Simple Storage Service - Object storage built to store and retrieve any amount of data',
        explanation:
          'S3 provides industry-leading scalability, data availability, security, and performance. It offers 99.999999999% (11 9s) of durability.',
      },
      {
        question: 'What is Amazon EC2?',
        answer: 'Elastic Compute Cloud - Scalable virtual servers in the cloud',
        explanation:
          'EC2 provides secure, resizable compute capacity in the cloud. You can scale up or down to handle changes in requirements or spikes in popularity.',
      },
    ];
  }
  
  return [];
}

export default FlashcardPage;