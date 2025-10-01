// src/hooks/useApiDebugger.js
import { useState, useEffect } from 'react';
import wordpressApi from '@/services/wordpressApi';

export const useApiDebugger = () => {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebugParam = urlParams.has('debug');
    const hasDebugStorage = localStorage.getItem('api-debug') === 'true';
    
    if (hasDebugParam || hasDebugStorage) {
      setDebugMode(true);
      if (hasDebugParam) {
        localStorage.setItem('api-debug', 'true');
      }
    }

    window.debugAPI = {
      clearCache: () => wordpressApi.clearCache(),
      testConnection: () => wordpressApi.healthCheck(),
      getApiInstance: () => wordpressApi,
      toggleDebug: () => {
        const newValue = !debugMode;
        setDebugMode(newValue);
        localStorage.setItem('api-debug', newValue.toString());
        if (!newValue) {
          const url = new URL(window.location);
          url.searchParams.delete('debug');
          window.history.replaceState({}, '', url);
        }
      }
    };
  }, [debugMode]);

  return { debugMode };
};