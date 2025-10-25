// src/pages/certifications/FlashcardPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCertification } from '@/hooks/useCertifications';
import FlashcardViewer from '@/components/certifications/FlashcardViewer';
import { ArrowLeft, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FlashcardPage = () => {
  const { slug } = useParams();
  const { certification, loading, error } = useCertification(slug);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-16 w-16 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !certification) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-red-400">Failed to load flashcards</p>
      </div>
    );
  }

  // Parse flashcards from certification content or custom field
  // You'll need to add flashcard data to your certification posts
  const sampleFlashcards = [
    {
      question: 'What is AWS Lambda?',
      answer: 'A serverless compute service',
      explanation:
        'AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume.',
    },
    {
      question: 'What is Amazon S3?',
      answer: 'Object storage service',
      explanation:
        'S3 provides scalable object storage with 99.999999999% durability.',
    },
    {
      question: 'What is EC2?',
      answer: 'Elastic Compute Cloud',
      explanation:
        'EC2 provides resizable compute capacity in the cloud. Virtual servers.',
    },
    // Add more flashcards...
  ];

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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 gradient-text">
            {certification.title}
          </h1>
          <p className="text-gray-400">Interactive Flashcards</p>
        </div>

        <FlashcardViewer flashcards={sampleFlashcards} />
      </div>
    </div>
  );
};

export default FlashcardPage;