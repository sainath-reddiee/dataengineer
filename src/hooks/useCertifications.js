// src/hooks/useCertifications.js - ENHANCED WITH DEV MODE
import { useState, useEffect } from 'react';
import { certificationApi } from '@/services/certificationApi';

// Import sample data for development
import { 
  sampleCertifications, 
  sampleProviders, 
  sampleLevels, 
  sampleResourceTypes,
  filterCertifications as filterSampleCerts,
  getCertificationsByResourceType as getSampleByResourceType
} from '@/utils/sampleCertificationData';

// Check if we should use sample data
const USE_SAMPLE_DATA = import.meta.env.DEV && import.meta.env.VITE_USE_SAMPLE_CERT_DATA === 'true';

/**
 * Hook to fetch all certifications with optional filtering
 */
export const useCertifications = (filters = {}) => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_SAMPLE_DATA) {
          // Simulate API delay in development
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let data = [...sampleCertifications];
          
          // Apply resource type filter if provided
          if (filters.resourceTypeSlug) {
            data = getSampleByResourceType(data, filters.resourceTypeSlug);
          }
          
          setCertifications(data);
          console.log('✅ Using sample certification data in development mode');
        } else {
          const data = await certificationApi.getAllCertifications(filters);
          setCertifications(data);
        }
      } catch (err) {
        console.error('Error fetching certifications:', err);
        setError(err.message || 'Failed to load certifications');
        
        // Fallback to sample data on error in development
        if (import.meta.env.DEV) {
          console.warn('⚠️ API failed, falling back to sample data');
          setCertifications(sampleCertifications);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [filters.resourceTypeSlug]);

  return { certifications, loading, error };
};

/**
 * Hook to fetch a single certification by slug
 */
export const useCertification = (slug) => {
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertification = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (USE_SAMPLE_DATA) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const data = sampleCertifications.find(cert => cert.slug === slug);
          if (!data) {
            throw new Error('Certification not found');
          }
          setCertification(data);
          console.log('✅ Using sample certification data in development mode');
        } else {
          const data = await certificationApi.getCertificationBySlug(slug);
          setCertification(data);
        }
      } catch (err) {
        console.error(`Error fetching certification ${slug}:`, err);
        setError(err.message || 'Failed to load certification');
        
        // Fallback to sample data on error in development
        if (import.meta.env.DEV) {
          const sampleData = sampleCertifications.find(cert => cert.slug === slug);
          if (sampleData) {
            console.warn('⚠️ API failed, falling back to sample data');
            setCertification(sampleData);
            setError(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCertification();
  }, [slug]);

  return { certification, loading, error };
};

/**
 * Hook to fetch all providers
 */
export const useProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_SAMPLE_DATA) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setProviders(sampleProviders);
          console.log('✅ Using sample provider data in development mode');
        } else {
          const data = await certificationApi.getProviders();
          setProviders(data);
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError(err.message || 'Failed to load providers');
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ API failed, falling back to sample data');
          setProviders(sampleProviders);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return { providers, loading, error };
};

/**
 * Hook to fetch all levels
 */
export const useLevels = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLevels = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_SAMPLE_DATA) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setLevels(sampleLevels);
          console.log('✅ Using sample level data in development mode');
        } else {
          const data = await certificationApi.getLevels();
          setLevels(data);
        }
      } catch (err) {
        console.error('Error fetching levels:', err);
        setError(err.message || 'Failed to load levels');
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ API failed, falling back to sample data');
          setLevels(sampleLevels);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, []);

  return { levels, loading, error };
};

/**
 * Hook to fetch all resource types
 */
export const useResourceTypes = () => {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResourceTypes = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_SAMPLE_DATA) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setResourceTypes(sampleResourceTypes);
          console.log('✅ Using sample resource type data in development mode');
        } else {
          const data = await certificationApi.getResourceTypes();
          setResourceTypes(data);
        }
      } catch (err) {
        console.error('Error fetching resource types:', err);
        setError(err.message || 'Failed to load resource types');
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ API failed, falling back to sample data');
          setResourceTypes(sampleResourceTypes);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResourceTypes();
  }, []);

  return { resourceTypes, loading, error };
};