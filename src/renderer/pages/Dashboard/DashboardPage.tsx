import React from 'react';
import { Link } from '@tanstack/react-router';
import PlaylistList, { PlaylistSkeleton } from '../../features/playlists/components/PlaylistList';
import CreatePlaylistForm from '../../features/playlists/components/CreatePlaylistForm';
import { usePlaylists } from '../../services/queryHooks';
import { 
  Home, 
  Settings, 
  AlertTriangle, 
  Clock, 
  Download, 
  RefreshCw,
  Youtube,
  Layout
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const DashboardPage: React.FC = () => {
  const { data: playlists, isLoading, error } = usePlaylists();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Youtube className="mr-3 h-8 w-8 text-primary" />
          PlayListify Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage your YouTube playlists and downloads
        </p>
      </header>
      
      <nav className="mb-8 flex space-x-4 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <Button asChild variant="ghost" className="text-primary dark:text-primary font-medium">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </nav>
      
      <main>
        {/* Error display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error.message || String(error)}</span>
            </div>
          </div>
        )}
        
        {/* Create new playlist form */}
        <CreatePlaylistForm />
        
        <div className="grid grid-cols-1 gap-6">
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Layout className="mr-2 h-6 w-6 text-primary" />
              Your Playlists
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Browse, search, and filter your playlists. Use the search bar to find specific playlists,
              or filter by source and tags.
            </p>
            {error ? (
              <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">{error.message || String(error)}</span>
              </div>
            ) : isLoading ? (
              <PlaylistSkeleton count={3} />
            ) : (
              <PlaylistList playlists={Array.isArray(playlists) ? playlists : []} />
            )}
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your recent activity will appear here.
              </p>
            </section>
            
            {/* Quick Actions */}
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Youtube className="mr-2 h-5 w-5" />
                  Import from YouTube
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-5 w-5" />
                  Download All
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync Playlists
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 