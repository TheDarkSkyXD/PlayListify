import React from 'react';
import { useParams } from '@tanstack/react-router';

const PlaylistViewPage: React.FC = () => {
  const { playlistId } = useParams({ from: '/playlist/$playlistId' });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Playlist Details
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Playlist ID: {playlistId}
        </p>
      </header>
      <main className="grid grid-cols-1 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Videos
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              No videos in this playlist yet.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlaylistViewPage; 