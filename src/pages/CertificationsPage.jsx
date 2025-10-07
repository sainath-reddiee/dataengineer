// src/pages/CertificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Users, BookOpen, TrendingUp } from 'lucide-react';
import certificationApi from '@/services/certificationApi';
import MetaTags from '@/components/SEO/MetaTags';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const data = await certificationApi.getCertifications();
        setCertifications(data);
      } catch (error) {
        console.error('Failed to load certifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCerts();
  }, []);
  
  const getCertIcon = (title) => {
    if (title.includes('Snowflake')) return '❄️';
    if (title.includes('AWS')) return '☁️';
    if (title.includes('Azure')) return '🔷';
    return '🎓';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <>
      <MetaTags
        title="Certification Prep - Practice Questions for Data Engineering Certs"
        description="Prepare for Snowflake, AWS, Azure certifications with real exam questions. Practice tests for SnowPro Core, AWS Solutions Architect, Azure Data Engineer and more."
        keywords="certification prep, snowflake certification, aws certification, azure certification, practice questions"
      />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-6 py-3 mb-6">
            <Award className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-200">Certification Prep</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Master Your <span className="gradient-text">Certifications</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Practice with real exam questions from Snowflake, AWS, Azure and more.
            Updated regularly with community-verified answers and explanations.
          </p>
          
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">{certifications.length}+</div>
              <div className="text-sm text-gray-400">Certifications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">5K+</div>
              <div className="text-sm text-gray-400">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">95%</div>
              <div className="text-sm text-gray-400">Pass Rate</div>
            </div>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/certifications/${cert.slug}`}
                className="block h-full group"
              >
                <div className="tech-card rounded-2xl p-6 h-full flex flex-col hover:scale-105 transition-transform">
                  <div className="text-5xl mb-4">{getCertIcon(cert.title)}</div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                    {cert.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 flex-grow">
                    {cert.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <BookOpen className="h-4 w-4" />
                      <span>{cert.question_count} questions</span>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CertificationsPage;