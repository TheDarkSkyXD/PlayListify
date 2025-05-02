import React from 'react';
import { cn } from '../../utils/cn';
import { PlaylistVideoWithDetails } from '../../../shared/types';
import { DownloadButton } from '../ui/DownloadButton';
import { useThumbnail } from '../../hooks/useThumbnail';

interface VideoItemProps {
  video: PlaylistVideoWithDetails;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onVideoAction: (action: 'play' | 'download' | 'remove', video: PlaylistVideoWithDetails) => void;
  isDragging?: boolean;
  onDragStart?: (video: PlaylistVideoWithDetails) => void;
  onDragOver?: (video: PlaylistVideoWithDetails) => void;
  onDragEnd?: () => void;
}

// ThumbnailImage component to handle YouTube thumbnail loading with fallbacks
const ThumbnailImage = ({ videoId, thumbnail, title }: { videoId?: string, thumbnail?: string, title: string }) => {
  // Extract video ID from the thumbnail URL if not provided directly
  const extractedVideoId = !videoId && thumbnail ? 
    thumbnail.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//)?.at(1) || 
    thumbnail.match(/\/([a-zA-Z0-9_-]{11})\//)?.at(1) : null;
  
  // Use extracted or provided videoId
  const ytVideoId = videoId || extractedVideoId;
  
  // For YouTube videos, prioritize reliable formats to avoid 404s
  let thumbUrl = thumbnail;
  let fallbackUrl;
  
  if (ytVideoId) {
    // Always use hqdefault as primary - it's the most reliable format across all videos
    thumbUrl = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`;
    
    // Set up multiple fallbacks
    fallbackUrl = [
      `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${ytVideoId}/mqdefault.jpg`
    ].join('|');
  }
  
  const { dataUrl, isLoading, error } = useThumbnail(thumbUrl, fallbackUrl);
  
  if (isLoading) {
    return (
      <div className="w-full h-full bg-secondary flex items-center justify-center">
        <svg className="animate-spin h-5 w-5 text-secondary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (error || !dataUrl) {
    return (
      <div className="w-full h-full bg-secondary flex items-center justify-center text-secondary-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }
  
  return (
    <img
      src={dataUrl}
      alt={title}
      className="w-full h-full object-cover"
      onError={(e) => {
        // Add additional error handling if image fails to load
        console.error("Image load error", e);
        // The component will re-render with error state
      }}
    />
  );
};

export const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isSelected,
  onSelect,
  onVideoAction,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  // Format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle click to select the video
  const handleClick = () => {
    onSelect(video.id);
  };

  // Determine if the video is downloaded
  const isDownloaded = video.download_status === 'completed';

  // Handle drag and drop for reordering
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(video);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      e.preventDefault();
      onDragOver(video);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center p-3 rounded-md cursor-pointer transition-colors group relative',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-secondary/50',
        isDragging && 'opacity-50',
        video.position % 2 === 0 ? 'bg-secondary/10' : 'bg-transparent'
      )}
      onClick={handleClick}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Position indicator */}
      <div className="flex-shrink-0 w-8 text-center text-sm text-secondary-foreground mr-2">
        {video.position}
      </div>
      
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-12 rounded overflow-hidden mr-3 relative">
        <ThumbnailImage 
          videoId={video.video_external_id} 
          thumbnail={video.thumbnail} 
          title={video.title} 
        />
        
        {/* Duration overlay */}
        <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-tl">
          {formatDuration(video.duration_seconds)}
        </div>
      </div>
      
      {/* Video details */}
      <div className="flex-grow min-w-0">
        <h3 className="font-medium truncate">{video.title}</h3>
        
        <div className="flex items-center text-xs text-secondary-foreground mt-1">
          {video.author && (
            <span className="truncate">{video.author}</span>
          )}
          
          {isDownloaded && (
            <>
              <span className="mx-1">•</span>
              <span className="text-emerald-500 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Downloaded
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex-shrink-0 hidden group-hover:flex items-center space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoAction('play', video);
          }}
          className="p-1.5 rounded-full hover:bg-primary/20 text-primary"
          aria-label="Play video"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoAction('download', video);
          }}
          className={cn(
            "p-1.5 rounded-full hover:bg-primary/20 text-primary",
            isDownloaded && "text-emerald-500 hover:bg-emerald-100/20"
          )}
          aria-label={isDownloaded ? "Downloaded" : "Download video"}
          disabled={isDownloaded}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isDownloaded ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            )}
          </svg>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoAction('remove', video);
          }}
          className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive"
          aria-label="Remove video"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Download button */}
      <div className="flex items-center space-x-2">
        <DownloadButton videoId={String(video.video_id)} videoTitle={video.title} size="sm" />
      </div>
    </div>
  );
}; 