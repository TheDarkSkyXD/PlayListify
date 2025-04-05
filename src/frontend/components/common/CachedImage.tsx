import React, { useState, useEffect } from 'react';

// Placeholder image for when all else fails
const PLACEHOLDER_IMAGE = '/placeholder.png';

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

    // Check if this is a YouTube thumbnail URL
    const isYouTubeThumbnail = src.includes('i.ytimg.com/vi/');

    // Try to load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoading(false);
    };

    img.onerror = () => {
      // If this is a YouTube thumbnail, try alternative formats
      if (isYouTubeThumbnail) {
        // Extract video ID from URL
        const match = src.match(/\/vi\/([^/]+)\//);
        if (match && match[1]) {
          const videoId = match[1];

          // Try different thumbnail formats
          tryAlternativeThumbnails(videoId);
          return;
        }
      }

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

    // Function to try different YouTube thumbnail formats
    const tryAlternativeThumbnails = (videoId: string) => {
      // Different thumbnail formats to try in order
      const formats = [
        'hqdefault.jpg',      // High quality - most reliably available
        'mqdefault.jpg',      // Medium quality
        'sddefault.jpg',      // SD quality
        'default.jpg',        // Default quality
        'maxresdefault.jpg'   // HD quality - least reliably available
      ];

      // Get the current format from the URL
      const currentFormat = src.split('/').pop() || '';

      // Find the index of the current format
      const currentIndex = formats.indexOf(currentFormat);

      // Start trying from the next format
      const startIndex = currentIndex === -1 ? 0 : currentIndex + 1;

      // Try each format in sequence
      const tryNextFormat = (index: number) => {
        if (index >= formats.length) {
          // We've tried all formats, use fallback
          setError(true);
          setIsLoading(false);

          if (fallbackSrc) {
            setImageSrc(fallbackSrc);
          } else {
            setImageSrc(PLACEHOLDER_IMAGE);
          }
          return;
        }

        const format = formats[index];
        const newUrl = `https://i.ytimg.com/vi/${videoId}/${format}`;

        const testImg = new Image();
        testImg.src = newUrl;

        testImg.onload = () => {
          // This format works, use it
          setImageSrc(newUrl);
          setIsLoading(false);
        };

        testImg.onerror = () => {
          // Try the next format
          tryNextFormat(index + 1);
        };
      };

      // Start trying formats
      tryNextFormat(startIndex);
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
