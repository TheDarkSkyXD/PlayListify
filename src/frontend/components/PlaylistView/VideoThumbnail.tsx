import React, { useState, useEffect } from 'react';
import { useThumbnail } from '../../hooks/useThumbnail';
import { useVideoStatus } from '../../hooks/useVideoStatus';

interface VideoThumbnailProps {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  isPrivate?: boolean;
  isDeleted?: boolean;
  className?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoId,
  title,
  thumbnailUrl,
  isPrivate: initialIsPrivate = false,
  isDeleted: initialIsDeleted = false,
  className = ''
}) => {
  // Default fallback base64 encoded placeholder image (gray with play button)
  const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjI3MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PGNpcmNsZSBjeD0iMjQwIiBjeT0iMTM1IiByPSI0MCIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNMjI1IDExNUwyNjUgMTM1TDIyNSAxNTVaIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+";
  
  // Private video fallback (gray with lock icon)
  const privateVideoFallback = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjI3MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PHJlY3QgeD0iMjEwIiB5PSIxMTUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgcng9IjUiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIyMjUiIHk9Ijk1IiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHJ4PSIxNSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSIyNDAiIGN5PSIxNDAiIHI9IjgiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIyMzgiIHk9IjE0MCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=";
  
  // Deleted video fallback (gray with X icon)
  const deletedVideoFallback = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjI3MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PGNpcmNsZSBjeD0iMjQwIiBjeT0iMTM1IiByPSI0MCIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNMjIwIDExNUwyNjAgMTU1TTIyMCAxNTVMMjYwIDExNSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==";
  
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  
  // Check if the video is private or deleted (either passed in as props or detected)
  const { status: videoStatus, isLoading: isCheckingStatus } = useVideoStatus(videoId);
  
  // Combine initial status with the checked status
  const isPrivate = initialIsPrivate || (videoStatus?.isPrivate ?? false);
  const isDeleted = initialIsDeleted || (videoStatus?.isDeleted ?? false);
  
  // Only proceed with thumbnail fetching if the video is not private or deleted
  const shouldFetchThumbnail = !isPrivate && !isDeleted;
  
  // Build YouTube thumbnail URL if not provided and thumbnail should be fetched
  let thumbUrl = thumbnailUrl;
  if (shouldFetchThumbnail && !thumbUrl && videoId) {
    thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // Setup fallback URLs if thumbnail should be fetched
  let fallbackUrl = '';
  if (shouldFetchThumbnail && videoId) {
    fallbackUrl = [
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    ].join('|');
  }
  
  // Only fetch thumbnail if it's needed
  const { dataUrl, isLoading, error } = useThumbnail(
    shouldFetchThumbnail ? thumbUrl || '' : '', 
    shouldFetchThumbnail ? fallbackUrl : ''
  );
  
  // If the video is flagged as private, use private fallback immediately
  if (isPrivate) {
    return (
      <img 
        src={privateVideoFallback}
        alt={`${title} (Private Video)`}
        className={`w-full h-auto object-cover rounded-md ${className}`}
        style={{ maxWidth: '480px', aspectRatio: '16/9' }}
      />
    );
  }
  
  // If the video is flagged as deleted, use deleted fallback immediately
  if (isDeleted) {
    return (
      <img 
        src={deletedVideoFallback}
        alt={`${title} (Deleted Video)`}
        className={`w-full h-auto object-cover rounded-md ${className}`}
        style={{ maxWidth: '480px', aspectRatio: '16/9' }}
      />
    );
  }
  
  // Retry loading thumbnail if we get an error
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);
  
  if (isLoading || isCheckingStatus) {
    return (
      <div className={`bg-secondary/50 rounded-md flex items-center justify-center ${className}`}
           style={{ aspectRatio: '16/9' }}>
        <svg 
          className="h-8 w-8 animate-spin text-primary/70" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }
  
  if (error || !dataUrl) {
    // If all attempts fail, use the default fallback
    return (
      <img 
        src={fallbackImage}
        alt={title || 'Video thumbnail'}
        className={`w-full h-auto object-cover rounded-md ${className}`}
        style={{ maxWidth: '480px', aspectRatio: '16/9' }}
      />
    );
  }
  
  return (
    <img 
      src={dataUrl}
      alt={title || 'Video thumbnail'}
      className={`w-full h-auto object-cover rounded-md ${className}`}
      style={{ maxWidth: '480px', aspectRatio: '16/9' }}
      onError={() => {
        // If loading fails, use the default fallback
        if (retryCount >= maxRetries) {
          return fallbackImage;
        }
        return '';
      }}
    />
  );
}; 