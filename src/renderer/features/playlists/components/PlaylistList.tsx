import React from 'react';
import PlaylistCard from './PlaylistCard';
import { usePlaylists, useDeletePlaylist } from '../../../services/queryHooks';

const PlaylistList: React.FC = () => {
  const playlistsQuery = usePlaylists();
  const deletePlaylistMutation = useDeletePlaylist();

  const handleDeletePlaylist = (id: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylistMutation.mutate(id);
    }
  };

  // Loading state
  if (playlistsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64 animate-pulse">
            <div className="bg-gray-300 dark:bg-gray-700 h-36"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (playlistsQuery.isError) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> Failed to load playlists.</span>
      </div>
    );
  }

  // Empty state
  if (playlistsQuery.data?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          No Playlists Yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create your first playlist to get started.
        </p>
        <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors">
          Create Playlist
        </button>
      </div>
    );
  }

  // Render the playlist grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playlistsQuery.data?.map((playlist) => (
        <PlaylistCard 
          key={playlist.id} 
          playlist={playlist} 
          onDelete={handleDeletePlaylist}
        />
      ))}
    </div>
  );
};

export default PlaylistList; 