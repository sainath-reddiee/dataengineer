// src/components/LazyImage.jsx - OPTIMIZED FOR MOBILE PERFORMANCE
import React, { useEffect, useRef, useState } from 'react';
import { optimizeWordPressImage, generateSrcSet } from '@/utils/imageOptimizer';

const LazyImage = ({ 
  src, 
  alt, 
  width = 800, 
  quality = 80,
  sizes = '100vw',
  className = '',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    // Use requestIdleCallback for better performance
    const scheduleObserver = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setupObserver(), { timeout: 2000 });
      } else {
        setTimeout(() => setupObserver(), 100);
      }
    };

    const setupObserver = () => {
      if (!imgRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { 
          rootMargin: '50px', 
          threshold: 0.01 
        }
      );

      observer.observe(imgRef.current);
      observerRef.current = observer;
    };

    scheduleObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = (e) => {
    // Use requestAnimationFrame to avoid forced reflow
    requestAnimationFrame(() => {
      setIsLoaded(true);
      if (onLoad) onLoad(e);
    });
  };

  const handleError = (e) => {
    requestAnimationFrame(() => {
      setHasError(true);
      if (onError) onError(e);
    });
  };

  const optimizedSrc = optimizeWordPressImage(src, { width, quality });
  const srcSet = generateSrcSet(src, [400, 800, 1200, 1600]);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && !priority && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse" />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Image not available</span>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {(isInView || priority) && !hasError && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: '800px 400px'
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;