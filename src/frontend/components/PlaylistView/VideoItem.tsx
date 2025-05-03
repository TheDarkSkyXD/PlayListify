import React from 'react';
import { cn } from '../../utils/cn';
import { PlaylistVideoWithDetails } from '../../../shared/types/appTypes';
import { VideoThumbnail } from './VideoThumbnail';

// Define database-specific interface instead of extending
export interface PlaylistVideoFromDb {
  id: number;
  video_external_id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration_seconds?: number;
  author?: string;
  download_status?: string;
  position: number;
  description?: string;
  addedAt: string;
  status: string;
  downloaded: boolean;
}

interface VideoItemProps {
  video: PlaylistVideoFromDb;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onVideoAction: (action: 'play' | 'download' | 'remove', video: PlaylistVideoFromDb) => void;
  isDragging?: boolean;
  onDragStart?: (video: PlaylistVideoFromDb) => void;
  onDragOver?: (video: PlaylistVideoFromDb) => void;
  onDragEnd?: () => void;
}

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
        <VideoThumbnail 
          videoId={video.video_external_id} 
          thumbnailUrl={video.thumbnail}
          title={video.title} 
          className="w-full h-full"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoAction('remove', video);
          }}
          className="p-1.5 rounded-full hover:bg-red-100/20 text-red-500"
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
    </div>
  );
}; 