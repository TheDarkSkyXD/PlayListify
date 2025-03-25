import React from 'react';
import { Link } from '@tanstack/react-router';

const DashboardPage: React.FC = () => {
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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Playlist cards */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Playlists
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No playlists yet. Create your first playlist to get started!
            </p>
            <button className="mt-4 btn btn-primary bg-primary hover:bg-primary-dark">
              Create Playlist
            </button>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your recent activity will appear here.
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage; 