import React, { useState, useEffect } from 'react';

// Placeholder image as base64 string for when all else fails
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIHJ4PSI4IiBmaWxsPSIjMUUyOTNCIiAvPjxwYXRoIGQ9Ik0xNTAgNzVDMTUwIDcyLjIzODYgMTUyLjIzOSA3MCAxNTUgNzBIMjAwQzIwMi43NjEgNzAgMjA1IDcyLjIzODYgMjA1IDc1VjE3NUMyMDUgMTc3Ljc2MSAyMDIuNzYxIDE4MCAyMDAgMTgwSDE1NUMxNTIuMjM5IDE4MCAxNTAgMTc3Ljc2MSAxNTAgMTc1Vjc1WiIgZmlsbD0iIzY0NzQ4QiIgLz48cGF0aCBkPSJNOTUgMTAwQzk1IDk3LjIzODYgOTcuMjM4NiA5NSAxMDAgOTVIMTQ1QzE0Ny43NjEgOTUgMTUwIDk3LjIzODYgMTUwIDEwMFYyMDBDMTUwIDIwMi43NjEgMTQ3Ljc2MSAyMDUgMTQ1IDIwNUgxMDBDOTcuMjM4NiAyMDUgOTUgMjAyLjc2MSA5NSAyMDBWMTAwWiIgZmlsbD0iIzk0QTNCOCIgLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjQwIiBmaWxsPSIjNDc1NTY5IiAvPjxwYXRoIGQ9Ik0xNDAgMTMwTDE3MCAxNTBMMTQwIDE3MFYxMzBaIiBmaWxsPSIjRjhGQUZDIiAvPjx0ZXh0IHg9IjE1MCIgeT0iMjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGOEZBRkMiPlBsYXlsaXN0PC90ZXh0Pjwvc3ZnPg==';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

/**
 * Component for displaying images with local caching to avoid CSP issues
 * Automatically caches remote images locally and handles loading/error states
 */
const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallbackSrc = '/assets/images/playlist-default.jpg',
  alt,
  className = '',
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    
    // Skip for already local paths
    if (src.startsWith('file://') || src.startsWith('/') || src.startsWith('data:')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }
    
    // Check if the API is available
    if (typeof window !== 'undefined' && window.api && window.api.images) {
      // Try to get the cached version or download if needed
      const getLocalImage = async () => {
        try {
          const localPath = await window.api.images.getLocalPath(src, true);
          setImageSrc(localPath);
          setLoading(false);
        } catch (err) {
          console.error('Failed to cache image:', err);
          setError(true);
          setLoading(false);
          // Try to use fallback image
          if (fallbackSrc.startsWith('data:')) {
            setImageSrc(fallbackSrc);
          } else {
            // Test if the fallback path is accessible
            fetch(fallbackSrc)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Fallback image not found');
                }
                setImageSrc(fallbackSrc);
              })
              .catch(() => {
                // If fallback image fails, use hardcoded placeholder
                setImageSrc(PLACEHOLDER_IMAGE);
              });
          }
        }
      };
      
      getLocalImage();
    } else {
      // If API is not available, just use the original source
      console.warn('Image caching API not available, using original source');
      setImageSrc(src);
      setLoading(false);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    setError(true);
    setLoading(false);
    // If the image still fails, use the hardcoded placeholder
    if (imageSrc === fallbackSrc) {
      setImageSrc(PLACEHOLDER_IMAGE);
    } else {
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <>
      {loading && (
        <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
      )}
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`${className} ${loading ? 'hidden' : ''}`} 
        onError={handleError}
        {...rest}
      />
    </>
  );
};

export default CachedImage; 