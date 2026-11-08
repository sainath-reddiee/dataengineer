// src/components/LazyImage.jsx - OPTIMIZED VERSION (CLS < 0.1, WebP, explicit dimensions)
import { useEffect, useRef, useState } from 'react';
import { optimizeWordPressImage, generateSrcSet } from '@/utils/imageOptimizer';

const LazyImage = ({
  src,
  alt = '',
  width = 800,
  height,
  quality = 80,
  sizes = '100vw',
  className = '',
  priority = false,
  onLoad,
  onError,
}) => {
  // Default to 16:9 aspect ratio if height not provided (eliminates CLS)
  const imgHeight = height || Math.round((width * 9) / 16);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (priority) return undefined;

    if (!imgRef.current || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '150px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  const optimizedSrc = optimizeWordPressImage(src, { width, quality, format: 'webp' });
  const srcSet = generateSrcSet(src, [400, 800, 1200]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-paper-300 ${className}`}
      style={{
        aspectRatio: `${width} / ${imgHeight}`,
      }}
    >
      {!isLoaded && !hasError && !priority && (
        <div className="absolute inset-0 bg-paper-300 animate-pulse" aria-hidden="true" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-300">
          <div className="text-center text-ink-faint">
            <svg
              className="mx-auto mb-1.5 h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}

      {(isInView || priority) && !hasError && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={imgHeight}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`h-full w-full object-cover ${
            priority ? '' : `transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`
          }`}
        />
      )}
    </div>
  );
};

export default LazyImage;
