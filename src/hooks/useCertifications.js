// src/hooks/useCertifications.js
import { useState, useEffect, useCallback } from 'react';
import wordpressApi from '@/services/wordpressApi';

export const useCertifications = (options = {}) => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { resourceTypeSlug } = options;

  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedCertifications;
      if (resourceTypeSlug) {
        fetchedCertifications = await wordpressApi.getCertificationsByResourceType(resourceTypeSlug, options);
      } else {
        fetchedCertifications = await wordpressApi.getCertifications(options);
      }
      
      setCertifications(fetchedCertifications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options), resourceTypeSlug]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  return { certifications, loading, error, refetch: fetchCertifications };
};

export const useCertification = (slug) => {
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertification = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedCertification = await wordpressApi.getCertificationBySlug(slug);
      setCertification(fetchedCertification);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCertification();
  }, [fetchCertification]);

  return { certification, loading, error, refetch: fetchCertification };
};

export const useResourceTypes = () => {
    const [resourceTypes, setResourceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchResourceTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedResourceTypes = await wordpressApi.getResourceTypes();
            setResourceTypes(fetchedResourceTypes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResourceTypes();
    }, [fetchResourceTypes]);

    return { resourceTypes, loading, error, refetch: fetchResourceTypes };
};