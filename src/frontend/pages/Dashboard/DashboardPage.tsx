import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { usePlaylists } from '../../services/queryHooks';
import {
  Home,
  Settings,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Youtube,
  Layout,
  Play,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import AppLayout from '../../components/Layout/AppLayout';
import { AddPlaylistDialog } from '../../features/playlists/components/AddPlaylistDialog';

const DashboardPage: React.FC = () => {
  const { data: playlists, isLoading, error } = usePlaylists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Count total playlists
  const playlistCount = Array.isArray(playlists) ? playlists.length : 0;

  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <header className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Home className="mr-3 h-8 w-8 text-primary" />
              Dashboard
            </h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Play className="mr-2 h-4 w-4" />
              Add Playlist
            </Button>
            <AddPlaylistDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
            />
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your YouTube playlists and downloads
          </p>
        </header>

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

          <div className="grid grid-cols-1 gap-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-primary/20 text-primary">
                    <Layout className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Playlists</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{playlistCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200">
                    <Youtube className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">YouTube Playlists</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Downloads</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Playlists Preview */}
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Layout className="mr-2 h-6 w-6 text-primary" />
                  Your Playlists
                </h2>
                <Button variant="outline" asChild>
                  <Link to="/playlists" className="flex items-center">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {playlistCount === 0
                  ? "You don't have any playlists yet. Create your first playlist to get started."
                  : `You have ${playlistCount} playlist${playlistCount !== 1 ? 's' : ''}. Manage them in the My Playlists section.`}
              </p>
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
    </AppLayout>
  );
};

export default DashboardPage;