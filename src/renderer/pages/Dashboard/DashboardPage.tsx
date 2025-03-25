import React from 'react';
import { Link } from '@tanstack/react-router';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Link
          to="/settings"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Settings
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Playlist cards will go here */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Playlists
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            No playlists yet. Create your first playlist to get started!
          </p>
        </div>
      </div>
    </div>
  );
}; 