import React from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { playlistRoute } from '../../routes/routes';

export const PlaylistViewPage: React.FC = () => {
  const { id } = useParams({ from: playlistRoute.id });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Playlist: {id}
        </h1>
        <Link
          to="/"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Videos
            </h2>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Add Video
            </button>
          </div>

          <div className="space-y-4">
            {/* Video list will go here */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-gray-600 dark:text-gray-300">
                No videos in this playlist yet. Add some videos to get started!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 