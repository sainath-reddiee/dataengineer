// src/services/certificationApi.js
// API service for fetching certification data from WordPress REST API

const API_BASE_URL = import.meta.env.VITE_WP_API_URL || 'https://your-wordpress-site.com/wp-json/wp/v2';

/**
 * Fetch all certifications with optional filters
 */
const getAllCertifications = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query params if provided
    if (filters.provider && filters.provider !== 'all') {
      params.append('provider', filters.provider);
    }
    if (filters.level && filters.level !== 'all') {
      params.append('level', filters.level);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.resourceTypeSlug) {
      params.append('resource_type', filters.resourceTypeSlug);
    }
    
    // Add pagination params (you can make these configurable)
    params.append('per_page', '100');
    params.append('_embed', '1'); // Include embedded data like featured images
    
    const url = `${API_BASE_URL}/certifications?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching certifications:', error);
    throw error;
  }
};

/**
 * Fetch a single certification by slug
 */
const getCertificationBySlug = async (slug) => {
  try {
    const url = `${API_BASE_URL}/certifications?slug=${slug}&_embed=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Certification not found');
    }
    
    return data[0]; // WordPress returns an array even for single slug queries
  } catch (error) {
    console.error(`Error fetching certification ${slug}:`, error);
    throw error;
  }
};

/**
 * Fetch all providers (taxonomy)
 */
const getProviders = async () => {
  try {
    const url = `${API_BASE_URL}/provider?per_page=100`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

/**
 * Fetch all levels (taxonomy)
 */
const getLevels = async () => {
  try {
    const url = `${API_BASE_URL}/level?per_page=100`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching levels:', error);
    throw error;
  }
};

/**
 * Fetch all resource types (taxonomy)
 */
const getResourceTypes = async () => {
  try {
    const url = `${API_BASE_URL}/resource-type?per_page=100`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching resource types:', error);
    throw error;
  }
};

export const certificationApi = {
  getAllCertifications,
  getCertificationBySlug,
  getProviders,
  getLevels,
  getResourceTypes,
};