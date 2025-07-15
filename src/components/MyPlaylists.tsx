import React, { useState, useEffect } from 'react';
import { PlaylistCard } from './PlaylistCard';
import { AddPlaylistDialog } from './AddPlaylistDialog';

interface Playlist {
  id: number;
  title: string;
  description: string;
  type: 'YOUTUBE' | 'CUSTOM';
  videoCount: number;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MyPlaylistsProps {
  onPlaylistClick: (playlistId: number) => void;
}

export const MyPlaylists: React.FC<MyPlaylistsProps> = ({ onPlaylistClick }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadPlaylists();
    loadViewMode();
  }, []);

  const loadPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await window.api.playlist.getAll();
      if (response.success) {
        setPlaylists(response.data);
      } else {
        setError(response.error || 'Failed to load playlists');
      }
    } catch (error) {
      setError('An unexpected error occurred while loading playlists');
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadViewMode = async () => {
    try {
      const response = await window.api.settings.get('playlistViewMode');
      if (response.success && (response.data === 'grid' || response.data === 'list')) {
        setViewMode(response.data);
      }
    } catch (error) {
      console.error('Error loading view mode:', error);
    }
  };

  const handleViewModeToggle = async () => {
    const newViewMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newViewMode);
    
    try {
      await window.api.settings.set('playlistViewMode', newViewMode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  const handleAddPlaylist = () => {
    setShowAddDialog(true);
  };

  const handlePlaylistClick = (playlistId: number) => {
    onPlaylistClick(playlistId);
  };

  const handlePlaylistAdded = (newPlaylist: Playlist) => {
    setPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
    setShowAddDialog(false);
  };

  const handleEditPlaylist = (playlistId: number) => {
    console.log('Edit playlist:', playlistId);
  };

  const handleDeletePlaylist = (playlistId: number) => {
    console.log('Delete playlist:', playlistId);
  };

  const handleDownloadPlaylist = (playlistId: number) => {
    console.log('Download playlist:', playlistId);
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">🎵</div>
      <h3>No playlists yet</h3>
      <p>Start by creating a custom playlist or importing one from YouTube</p>
      <button className="btn-primary" onClick={handleAddPlaylist}>
        Add Your First Playlist
      </button>
    </div>
  );

  const renderError = () => (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3>Failed to load playlists</h3>
      <p>{error}</p>
      <button className="btn-secondary" onClick={loadPlaylists}>
        Try Again
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Loading playlists...</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="my-playlists">
        <div className="playlists-header">
          <h1>My Playlists</h1>
        </div>
        {renderLoading()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-playlists">
        <div className="playlists-header">
          <h1>My Playlists</h1>
        </div>
        {renderError()}
      </div>
    );
  }

  return (
    <div className="my-playlists">
      <div className="playlists-header">
        <h1>My Playlists</h1>
        <div className="playlists-actions">
          <button
            className="view-toggle-btn"
            onClick={handleViewModeToggle}
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
          <button className="btn-primary" onClick={handleAddPlaylist}>
            + Add Playlist
          </button>
        </div>
      </div>

      {playlists.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className={`playlists-container ${viewMode === 'list' ? 'playlists-list' : 'playlists-grid'}`}>
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              viewMode={viewMode}
              onClick={handlePlaylistClick}
              onEdit={handleEditPlaylist}
              onDelete={handleDeletePlaylist}
              onDownload={handleDownloadPlaylist}
            />
          ))}
        </div>
      )}

      <AddPlaylistDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onPlaylistAdded={handlePlaylistAdded}
      />
    </div>
  );
};