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
 * A component that displays an image with caching and fallback support.
 * It tries to load the image from the cache first, then from the network,
 * and finally falls back to a placeholder if both fail.
 */
export function CachedImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  ...props
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state when src changes
    setImageSrc(src);
    setIsLoading(true);
    setError(false);

    // Try to load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);

      // Try fallback if provided
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Use placeholder as last resort
        setImageSrc(PLACEHOLDER_IMAGE);
      }
    };

    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  // Skeleton loader while image is loading
  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        style={{ aspectRatio: '1 / 1' }}
        {...props}
      />
    );
  }

  // Render the image
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${error ? 'opacity-70' : ''}`}
      {...props}
    />
  );
}
