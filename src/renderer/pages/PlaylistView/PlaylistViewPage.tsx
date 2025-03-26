import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { usePlaylist } from '../../services/queryHooks';

const PlaylistViewPage: React.FC = () => {
  const { playlistId } = useParams({ from: '/playlist/$playlistId' });
  const { data: playlist, isLoading, isError, error } = usePlaylist(playlistId);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error?.message || 'Failed to load playlist'}</span>
        </div>
        <Link to="/" className="text-primary dark:text-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  // Not found state
  if (!playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Playlist Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The playlist you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/" className="text-primary dark:text-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {playlist.name}
        </h1>
        {playlist.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {playlist.description}
          </p>
        )}
        <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="mr-4">
            Created: {new Date(playlist.createdAt).toLocaleDateString()}
          </span>
          <span>
            Last updated: {new Date(playlist.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      <nav className="mb-8">
        <Link to="/" className="text-primary dark:text-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
      </nav>

      <main className="grid grid-cols-1 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Videos ({playlist.videos.length})
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark">
                Add Videos
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                Download All
              </button>
            </div>
          </div>

          {playlist.videos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No videos in this playlist yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {playlist.videos.map((video) => (
                <li key={video.id} className="py-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                      <div className="relative w-full md:w-48 aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">No thumbnail</span>
                          </div>
                        )}
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {video.title}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="mr-3">
                          Status: 
                          <span className={`ml-1 ${
                            video.status === 'available' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {video.status || 'Unknown'}
                          </span>
                        </span>
                        {video.downloadStatus && (
                          <span>
                            Download: 
                            <span className={`ml-1 ${
                              video.downloadStatus === 'completed' 
                                ? 'text-green-600 dark:text-green-400'
                                : video.downloadStatus === 'failed'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {video.downloadStatus}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-primary dark:text-primary"
                        >
                          Watch on YouTube
                        </a>
                        <button className="text-gray-700 dark:text-gray-300 hover:underline">
                          Download
                        </button>
                        <button className="text-red-600 dark:text-red-400 hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default PlaylistViewPage; 