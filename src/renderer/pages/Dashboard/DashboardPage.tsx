import React from 'react';
import { Link } from '@tanstack/react-router';
import PlaylistList from '../../features/playlists/components/PlaylistList';
import CreatePlaylistForm from '../../features/playlists/components/CreatePlaylistForm';
import usePlaylistStore from '../../stores/playlistStore';

const DashboardPage: React.FC = () => {
  const { isLoading, error } = usePlaylistStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          PlayListify Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage your YouTube playlists and downloads
        </p>
      </header>
      
      <nav className="mb-8 flex space-x-4 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <Link to="/" className="text-primary dark:text-primary hover:underline font-medium">
          Dashboard
        </Link>
        <Link to="/settings" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:underline">
          Settings
        </Link>
      </nav>
      
      <main>
        {/* Error display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {/* Create new playlist form */}
        <CreatePlaylistForm />
        
        <div className="grid grid-cols-1 gap-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Playlists
            </h2>
            <PlaylistList />
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your recent activity will appear here.
              </p>
            </section>
            
            {/* Quick Actions */}
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                  Import from YouTube
                </button>
                <button className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                  Download All
                </button>
                <button className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                  Sync Playlists
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 