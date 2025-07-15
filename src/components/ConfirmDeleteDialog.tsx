import React, { useState, useEffect } from 'react';

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  playlistId: number;
}

interface PlaylistDetails {
  id: number;
  title: string;
  description: string;
  type: 'YOUTUBE' | 'CUSTOM';
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playlistId,
}) => {
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && playlistId) {
      loadPlaylistDetails();
    }
  }, [isOpen, playlistId]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setPlaylist(null);
      setError(null);
    }
  }, [isOpen]);

  const loadPlaylistDetails = async () => {
    setIsLoadingPlaylist(true);
    setError(null);

    try {
      const response = await window.api.playlist.getById(playlistId);
      
      if (response.success) {
        setPlaylist(response.data);
      } else {
        setError(response.error || 'Failed to load playlist details');
      }
    } catch (error) {
      setError('An unexpected error occurred while loading playlist details');
      console.error('Error loading playlist details:', error);
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!playlist) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.playlist.delete(playlistId);
      
      if (response.success) {
        onConfirm();
        onClose();
      } else {
        setError(response.error || 'Failed to delete playlist');
      }
    } catch (error) {
      setError('An unexpected error occurred while deleting the playlist');
      console.error('Delete playlist error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div className="modal-content confirm-delete-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Playlist</h2>
          <button 
            className="modal-close" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            <div className="delete-warning-icon">⚠️</div>
            <h3>Are you sure you want to delete this playlist?</h3>
            <p>
              This action cannot be undone. The playlist and all its data will be permanently removed.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoadingPlaylist ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading playlist details...</p>
            </div>
          ) : playlist ? (
            <div className="playlist-delete-details">
              <h4>Playlist Details</h4>
              <ul className="delete-details-list">
                <li>
                  <strong>Title:</strong> {playlist.title}
                </li>
                <li>
                  <strong>Type:</strong> 
                  <span className={`playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`}>
                    {playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom'}
                  </span>
                </li>
                <li>
                  <strong>Videos:</strong> {playlist.videoCount} videos
                </li>
                <li>
                  <strong>Created:</strong> {new Date(playlist.createdAt).toLocaleDateString()}
                </li>
                <li>
                  <strong>Updated:</strong> {new Date(playlist.updatedAt).toLocaleDateString()}
                </li>
              </ul>
              
              {playlist.description && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Description:</strong>
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {playlist.description.length > 200 
                      ? `${playlist.description.substring(0, 200)}...` 
                      : playlist.description
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Failed to load playlist</h3>
              <p>Could not load playlist details for deletion confirmation.</p>
            </div>
          )}

          {playlist && playlist.type === 'YOUTUBE' && (
            <div className="youtube-playlist-notice">
              <p>
                <strong>Note:</strong> This will only remove the playlist from PlayListify. 
                The original YouTube playlist will remain untouched.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirmDelete}
            disabled={!playlist || isLoading || isLoadingPlaylist}
          >
            {isLoading ? 'Deleting...' : 'Delete Playlist'}
          </button>
        </div>
      </div>
    </div>
  );
};