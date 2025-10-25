// src/pages/certifications/CertificationDetail.jsx - FINAL VERSION
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCertification } from '@/hooks/useCertifications';
import MetaTags from '@/components/SEO/MetaTags';
import { Loader, ArrowLeft, Download, Star, BookOpen, Award, Clock, DollarSign, FileQuestion, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CertificationDetail = () => {
  const { slug } = useParams();
  const { certification, loading, error } = useCertification(slug);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <Loader className="h-16 w-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading certification details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center bg-red-900/50 text-red-300 p-8 rounded-xl border border-red-500/20">
          <h2 className="text-2xl font-bold mb-2">Error Loading Certification</h2>
          <p className="text-red-200">{error}</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/certifications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certifications
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!certification) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Certification not found</h2>
        <Button asChild variant="outline">
          <Link to="/certifications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Certifications
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title={`${certification.title} - Certification Hub`}
        description={certification.excerpt?.replace(/<[^>]*>/g, '') || `Complete study guide and resources for ${certification.title}`}
        keywords={`${certification.title}, certification, study guide, practice questions, ${certification.provider?.name || ''}`}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          {/* Back Button */}
          <Button
            asChild
            variant="ghost"
            className="mb-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Link to="/certifications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all certifications
            </Link>
          </Button>
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Logo */}
              {certification.featured_image && (
                <div className="flex-shrink-0">
                  <img 
                    src={certification.featured_image} 
                    alt={certification.title} 
                    className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-xl bg-white/5 p-4 border border-slate-700/50" 
                  />
                </div>
              )}
              
              {/* Title & Info */}
              <div className="flex-grow">
                {/* Provider Badge */}
                {certification.provider && (
                  <div className="mb-3">
                    <span className="inline-flex items-center text-sm font-semibold text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
                      <Award className="h-4 w-4 mr-2" />
                      {certification.provider.name}
                    </span>
                  </div>
                )}
                
                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-black mb-3 gradient-text leading-tight">
                  {certification.title}
                </h1>
                
                {/* Official Name */}
                {certification.cert_official_name && (
                  <p className="text-lg text-gray-300 mb-4">{certification.cert_official_name}</p>
                )}
                
                {/* Level & Featured Badges */}
                <div className="flex flex-wrap gap-2">
                  {certification.level && (
                    <span className="inline-flex items-center text-sm font-medium text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30">
                      <Target className="h-4 w-4 mr-1.5" />
                      {certification.level.name}
                    </span>
                  )}
                  {certification.featured && (
                    <span className="inline-flex items-center text-sm font-bold text-yellow-300 bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-500/30">
                      <Star className="h-4 w-4 mr-1.5 fill-yellow-300" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {certification.exam_cost && (
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-5 rounded-xl border border-green-500/30">
                <DollarSign className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-sm text-green-300 mb-1">Exam Cost</p>
                <p className="font-bold text-xl text-white">{certification.exam_cost}</p>
              </div>
            )}
            
            {certification.duration && (
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-5 rounded-xl border border-blue-500/30">
                <Clock className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-sm text-blue-300 mb-1">Duration</p>
                <p className="font-bold text-xl text-white">{certification.duration}</p>
              </div>
            )}
            
            {certification.questions_count && (
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-5 rounded-xl border border-purple-500/30">
                <FileQuestion className="h-8 w-8 text-purple-400 mb-2" />
                <p className="text-sm text-purple-300 mb-1">Questions</p>
                <p className="font-bold text-xl text-white">{certification.questions_count}</p>
              </div>
            )}
            
            {certification.passing_score && (
              <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-5 rounded-xl border border-orange-500/30">
                <Target className="h-8 w-8 text-orange-400 mb-2" />
                <p className="text-sm text-orange-300 mb-1">Passing Score</p>
                <p className="font-bold text-xl text-white">{certification.passing_score}</p>
              </div>
            )}
          </div>

          {/* Resource Types */}
          {certification.resource_types && certification.resource_types.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
                Available Resources
              </h2>
              <div className="flex flex-wrap gap-3">
                {certification.resource_types.map(rt => (
                  <span 
                    key={rt.slug} 
                    className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                  >
                    {rt.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            {/* Download Button */}
            {certification.download_url && (
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold text-lg py-6 group"
              >
                <a href={certification.download_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                  Download Study Guide
                </a>
              </Button>
            )}

            {/* Flashcard Button */}
            {certification.flashcards && certification.flashcards.length > 0 && (
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg py-6 group"
              >
                <Link to={`/certifications/${certification.slug}/flashcards`}>
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform inline-block">🎴</span>
                  Study with Flashcards ({certification.flashcards.length} cards)
                </Link>
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8">
            {/* Excerpt */}
            {certification.excerpt && (
              <div 
                className="text-lg text-gray-300 mb-8 leading-relaxed pb-8 border-b border-slate-700/50" 
                dangerouslySetInnerHTML={{ __html: certification.excerpt }} 
              />
            )}

            {/* Full Content */}
            <div 
              className="prose prose-invert max-w-none article-content prose-headings:gradient-text prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-blue-900/30 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700" 
              dangerouslySetInnerHTML={{ __html: certification.content }} 
            />
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-400/20 rounded-2xl text-center">
            <h3 className="text-2xl font-bold mb-4 gradient-text">
              Ready to Get Certified?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Start your certification journey today with our comprehensive study materials and practice resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                <Link to="/certifications">Browse All Certifications</Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to="/articles">Read Related Articles</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificationDetail;