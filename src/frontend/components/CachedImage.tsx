import React, { useState, useEffect } from 'react';
import { Lock, VideoOff, ImageOff } from 'lucide-react'; // Assuming lucide-react is installed and configured

// A generic, small, transparent PNG as a base64 encoded placeholder
// You can replace this with a more specific placeholder image or SVG if desired.
const DEFAULT_HARDCODED_FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string; // A secondary fallback image URL (e.g., local asset)
  alt: string; // Alt text is important for accessibility
  videoStatus?: 'private' | 'deleted' | 'unavailable' | 'normal'; // New prop
}

const PlaceholderDiv: React.FC<React.PropsWithChildren<{
  icon?: React.ElementType;
  text: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}>> = ({ icon: Icon, text, alt, width, height, className }) => (
  <div
    role="img"
    aria-label={alt}
    className={`flex flex-col items-center justify-center bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 ${className || ''}`}
    style={{
      width: width || '100%', // Default to 100% if not specified
      height: height || '100%', // Default to 100% if not specified
      aspectRatio: width && height ? undefined : '16/9', // Maintain aspect ratio if only one or no dimension is given
    }}
  >
    {Icon && <Icon size={48} className="mb-2" />}
    <span className="text-xs text-center p-1">{text}</span>
  </div>
);

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallbackSrc,
  alt,
  videoStatus = 'normal', // Default to normal
  onError,
  className,
  width,
  height,
  ...props
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(src);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // When src prop changes, reset error state and update currentImageSrc
    console.log(`[CachedImage] useEffect: src changed. Old src: ${currentImageSrc}, New src: ${src}, Alt: ${alt}`);
    setCurrentImageSrc(src);
    setImageError(false);
  }, [src, alt]); // Added alt to dep array for logging context, though not strictly necessary for effect logic

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[CachedImage] handleError: Error loading image. Target src was: ${(event.target as HTMLImageElement)?.src}, Alt: ${alt}`, event);
    setImageError(true); // Mark that an error occurred
    if (onError) {
      onError(event);
    }
  };

  // Determine what to render based on status and error state
  console.log(`[CachedImage] Render: currentImageSrc: ${currentImageSrc}, imageError: ${imageError}, videoStatus: ${videoStatus}, Alt: ${alt}`);

  // 1. Handle specific video statuses first
  if (videoStatus === 'private') {
    return <PlaceholderDiv icon={Lock} text="Video is Private" alt={alt || "Private video placeholder"} width={width} height={height} className={className} />;
  }
  if (videoStatus === 'deleted') {
    return <PlaceholderDiv icon={VideoOff} text="Video Deleted" alt={alt || "Deleted video placeholder"} width={width} height={height} className={className} />;
  }
  if (videoStatus === 'unavailable') {
      return <PlaceholderDiv icon={ImageOff} text="Thumbnail Unavailable" alt={alt || "Thumbnail unavailable placeholder"} width={width} height={height} className={className} />;
  }

  // 2. Handle 'normal' status (or default)
  // Primary condition: if imageError is true, we need to decide between fallback or generic placeholder.
  if (imageError) {
    if (fallbackSrc) {
      // Attempt to use fallbackSrc. If this also errors, handleError will be called again, 
      // imageError will remain true, and we'll fall into the 'else' block next render.
      // To prevent potential infinite loops if fallbackSrc is also bad and keeps erroring,
      // we might need a more robust state like 'fallbackAttempted'.
      // For now, assume `handleError` correctly sets `imageError` for the main `src` first.
      // If `currentImageSrc` was the one that errored, and `fallbackSrc` is available:
      console.log(`[CachedImage] Primary src errored. Trying fallbackSrc: ${fallbackSrc}, Alt: ${alt}`);
      return (
        <img
          src={fallbackSrc} // Try fallback
          alt={alt}
          onError={(e) => { 
            // If fallback also errors, log it and ensure we show the generic placeholder next.
            // This specific onError for fallback won't re-trigger the main `handleError` for `currentImageSrc`
            // but we effectively want the same outcome: show generic placeholder.
            // We'll rely on the fact that `imageError` is already true.
            console.error(`[CachedImage] FallbackSrc also errored: ${fallbackSrc}, Alt: ${alt}`, e);
            // To ensure generic placeholder on next render if fallback fails:
            // We could set currentImageSrc to a special value or add another state.
            // For simplicity, the existing logic will go to generic placeholder if imageError is true and fallbackSrc part is skipped.
            // Let's explicitly set currentImageSrc to undefined so the next check correctly shows placeholder
            setCurrentImageSrc(undefined); // This will ensure the next block shows generic placeholder.
          }}
          className={className}
          width={width}
          height={height}
          {...props}
        />
      );
    } else {
      // imageError is true, and no fallbackSrc
      console.log(`[CachedImage] Primary src errored and no fallbackSrc. Displaying generic placeholder. Alt: ${alt}`);
      return <PlaceholderDiv icon={ImageOff} text={alt || "Image Error"} alt={alt || "Image error placeholder"} width={width} height={height} className={className} />;
    }
  }

  // If no error yet, but currentImageSrc is not available (e.g. undefined or empty string passed as prop)
  if (!currentImageSrc) {
    if (fallbackSrc) {
      console.log(`[CachedImage] No primary src. Using fallbackSrc: ${fallbackSrc}, Alt: ${alt}`);
      // Render fallback directly if no primary src was provided
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          onError={handleError} // If this fallback errors, it will set imageError for next render.
          className={className}
          width={width}
          height={height}
          {...props}
        />
      );
    } else {
      // No primary src and no fallbackSrc
      console.log(`[CachedImage] No primary src and no fallbackSrc. Displaying generic placeholder. Alt: ${alt}`);
      return <PlaceholderDiv icon={ImageOff} text={alt || "Image Unavailable"} alt={alt || "Image unavailable placeholder"} width={width} height={height} className={className} />;
    }
  }

  // 3. If status is normal, no error, and currentImageSrc is valid, render the image
  console.log(`[CachedImage] Attempting to render primary image. Src: ${currentImageSrc}, Alt: ${alt}, imageError: ${imageError}, videoStatus: ${videoStatus}`);
  return (
    <img
      src={currentImageSrc}
      alt={alt}
      onError={handleError}
      className={className}
      width={width}
      height={height}
      {...props}
    />
  );
};

export default CachedImage; 