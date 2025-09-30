// src/components/OptimizedImage.jsx
// Lazy loading images with blur placeholder
import React, { useState, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  // Create blur placeholder (tiny base64 image)
  const blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyMzNhNTIiLz48L3N2Zz4=';

  useEffect(() => {
    if (priority) {
      // Load immediately for above-fold images
      setImageSrc(src);
    } else {
      // Lazy load for below-fold images
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        },
        { rootMargin: '50px' }
      );

      const imgElement = document.getElementById(`img-${src}`);
      if (imgElement) {
        observer.observe(imgElement);
      }

      return () => observer.disconnect();
    }
  }, [src, priority]);

  return (
    <div 
      id={`img-${src}`}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={width}
          height={height}
          sizes={sizes}
        />
      )}
    </div>
  );
};

export default OptimizedImage;