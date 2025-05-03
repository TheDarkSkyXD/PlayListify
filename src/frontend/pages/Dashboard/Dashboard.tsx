import React from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Import } from 'lucide-react';
import { usePlaylistStore } from '../../store/playlistStore';
import { useGetAllPlaylists } from '../../hooks/usePlaylistQueries';

export const DashboardPage: React.FC = () => {
  // Fetch playlists using React Query
  const { data: playlists = [], isLoading, error } = useGetAllPlaylists();
  
  // Get modal state setters from playlistStore
  const { 
    setIsCreatingPlaylist, 
    setIsImportingPlaylist 
  } = usePlaylistStore();
  
  // Open create playlist modal
  const handleCreatePlaylist = () => {
    setIsCreatingPlaylist(true);
  };
  
  // Open import playlist modal
  const handleImportPlaylist = () => {
    setIsImportingPlaylist(true);
  };
  
  // Get the 3 most recent playlists
  // Sort by ID since we don't have a created_at field in the PlaylistSummary type
  // Higher IDs are likely more recent in a typical auto-increment database
  const recentPlaylists = [...playlists]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome to PlayListify</h2>
        <p className="mb-4">
          Your YouTube playlist manager and downloader. Use the navigation to explore your playlists or view your downloads.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border rounded-md p-4 hover:bg-secondary/10 transition-colors">
            <h3 className="font-medium mb-2">My Playlists</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View, manage, and create YouTube playlists
            </p>
            <Link to="/playlists" className="text-primary hover:underline">
              Go to Playlists →
            </Link>
          </div>
          
          <div className="border rounded-md p-4 hover:bg-secondary/10 transition-colors">
            <h3 className="font-medium mb-2">Downloads</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your downloaded videos
            </p>
            <Link to="/downloads" className="text-primary hover:underline">
              Go to Downloads →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Playlists Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Playlists</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleCreatePlaylist}
              className="flex items-center text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </button>
            <button 
              onClick={handleImportPlaylist}
              className="flex items-center text-sm px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              <Import className="w-4 h-4 mr-1" />
              Import
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card animate-pulse h-40 rounded-md border"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            Error loading playlists. Please try again later.
          </div>
        ) : recentPlaylists.length === 0 ? (
          <div className="bg-muted p-8 rounded-md text-center">
            <p className="text-muted-foreground mb-4">You don't have any playlists yet.</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleCreatePlaylist}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Create Playlist
              </button>
              <button 
                onClick={handleImportPlaylist}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
              >
                Import from YouTube
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                to="/playlists"
                className="bg-card border rounded-md p-4 hover:bg-secondary/10 transition-colors"
              >
                <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                  {playlist.thumbnailUrl ? (
                    <img 
                      src={playlist.thumbnailUrl} 
                      alt={playlist.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-muted-foreground">No Thumbnail</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium truncate">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {playlist.videoCount || 0} videos
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 