import React, { useState } from 'react';
import { Library, AlertTriangle, Plus } from 'lucide-react';
import { usePlaylists } from '../../services/queryHooks';
import PlaylistList, { PlaylistSkeleton } from '../../features/playlists/components/PlaylistList';
import { Button } from '../../components/ui/button';
import AppLayout from '../../components/Layout/AppLayout';
import { AddPlaylistDialog } from '../../features/playlists/components/AddPlaylistDialog';

const PlaylistsPage: React.FC = () => {
  const { data: playlists, isLoading, error } = usePlaylists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <header className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Library className="mr-3 h-8 w-8 text-primary" />
              My Playlists
            </h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Playlist
            </Button>
            <AddPlaylistDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
            />
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Browse and manage all your playlists in one place
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

          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                All Playlists
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Search, filter, and manage your YouTube playlists
              </p>
            </div>

            {error ? (
              <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">{error.message || String(error)}</span>
              </div>
            ) : isLoading ? (
              <PlaylistSkeleton count={6} />
            ) : (
              <PlaylistList playlists={Array.isArray(playlists) ? playlists : []} />
            )}
          </section>
        </main>
      </div>
    </AppLayout>
  );
};

export default PlaylistsPage;