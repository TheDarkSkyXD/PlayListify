import React from 'react';
import { Link } from '@tanstack/react-router';
import { Playlist } from '../../../../shared/types/appTypes';

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (id: string) => void;
}

const PlaylistCard = ({ playlist, onDelete }: PlaylistCardProps): React.ReactElement => {
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(playlist.id);
    }
  };

  // Format the date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString();
  };

  // Get video count
  const videoCount: number = playlist.videos.length;
  
  // Get playlist thumbnail or use default
  const thumbnail: string = playlist.thumbnailUrl || 
    playlist.videos[0]?.thumbnail || 
    '/assets/images/playlist-default.jpg';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link
        to="/playlist/$playlistId"
        params={{ playlistId: playlist.id }}
        className="block h-full"
      >
        <div className="relative pb-[56.25%] bg-gray-200 dark:bg-gray-700">
          <img 
            src={thumbnail}
            alt={playlist.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
              const target = e.currentTarget;
              target.src = '/assets/images/playlist-default.jpg';
            }}
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {formatDate(playlist.updatedAt)}
            </span>
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 text-sm"
                aria-label="Delete playlist"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PlaylistCard; 