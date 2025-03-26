import React from 'react';
import { Link } from '@tanstack/react-router';
import { Playlist } from '../../../../shared/types/appTypes';
import CachedImage from '../../../components/CachedImage';
import { Clock, Trash2, Youtube, Folder, Calendar } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (id: string) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onDelete }) => {
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(playlist.id);
    }
  };

  // Format the date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    // If less than 24 hours ago, show relative time
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours < 1) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise, format as date
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Get video count
  const videoCount: number = playlist.videos.length;
  
  // Calculate total duration if available
  const getTotalDuration = (): string | null => {
    if (!playlist.videos.some(video => video.duration)) return null;
    
    const totalSeconds = playlist.videos.reduce((acc, video) => {
      return acc + (video.duration || 0);
    }, 0);
    
    if (totalSeconds === 0) return null;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };
  
  // Get appropriate thumbnail source
  const defaultThumbnail = '/assets/images/playlist-default.jpg';
  const thumbnailSrc = playlist.thumbnail || 
    (playlist.videos.length > 0 && playlist.videos[0]?.thumbnail) || 
    defaultThumbnail;
  
  // Source indicator
  const sourceLabel = playlist.source === 'youtube' ? 'YouTube' : 'Local';
  const SourceIcon = playlist.source === 'youtube' ? Youtube : Folder;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <Link
        to="/playlist/$playlistId"
        params={{ playlistId: playlist.id }}
        className="block h-full"
      >
        <div className="relative pb-[56.25%] bg-gray-200 dark:bg-gray-700">
          <CachedImage 
            src={thumbnailSrc}
            fallbackSrc={defaultThumbnail}
            alt={playlist.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <SourceIcon className="h-3 w-3" />
            <span>{sourceLabel}</span>
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <span>{videoCount} {videoCount === 1 ? 'video' : 'videos'}</span>
            {getTotalDuration() && (
              <>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3" />
                <span>{getTotalDuration()}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Updated: {formatDate(playlist.updatedAt)}</span>
            </span>
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                aria-label="Delete playlist"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PlaylistCard; 