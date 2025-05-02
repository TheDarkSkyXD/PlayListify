import React from 'react';
import { cn } from '../../utils/cn';
import { PlaylistSummary } from '../../../shared/types';
import { usePlaylistStore } from '../../store/playlistStore';

interface ExtendedPlaylistSummary extends PlaylistSummary {
  source?: string;
}

interface PlaylistItemProps {
  playlist: ExtendedPlaylistSummary;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onPlaylistAction: (action: 'delete' | 'refresh' | 'export' | 'rename', playlist: ExtendedPlaylistSummary) => void;
}

export const PlaylistItem: React.FC<PlaylistItemProps> = ({
  playlist,
  isSelected,
  onSelect,
  onPlaylistAction,
}) => {
  const handleClick = () => {
    onSelect(playlist.id);
  };

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = formatDuration(playlist.duration_seconds || 0);

  return (
    <div
      className={cn(
        'flex items-center p-3 rounded-md cursor-pointer transition-colors group relative',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-secondary/50'
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden mr-3">
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
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
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">{playlist.name}</h3>
          <div className="hidden group-hover:flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaylistAction('rename', playlist);
              }}
              className="p-1 rounded-full hover:bg-secondary/80 text-secondary-foreground"
              aria-label="Rename playlist"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaylistAction('export', playlist);
              }}
              className="p-1 rounded-full hover:bg-secondary/80 text-secondary-foreground"
              aria-label="Export playlist"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
            
            {playlist.source === 'youtube' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaylistAction('refresh', playlist);
                }}
                className="p-1 rounded-full hover:bg-secondary/80 text-secondary-foreground"
                aria-label="Refresh playlist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaylistAction('delete', playlist);
              }}
              className="p-1 rounded-full hover:bg-destructive text-destructive-foreground"
              aria-label="Delete playlist"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
        
        <div className="flex items-center text-xs text-secondary-foreground mt-1">
          <span className="truncate">
            {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
          </span>
          <span className="mx-1">•</span>
          <span>{totalDuration}</span>
          {playlist.source && (
            <>
              <span className="mx-1">•</span>
              <span className="capitalize">{playlist.source}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 