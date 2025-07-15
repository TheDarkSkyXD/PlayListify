import React, { useState, useEffect } from 'react';

export interface EditPlaylistDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistUpdated: (updatedPlaylist: any) => void;
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

export const EditPlaylistDetailsDialog: React.FC<EditPlaylistDetailsDialogProps> = ({
  isOpen,
  onClose,
  onPlaylistUpdated,
  playlistId,
}) => {
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && playlistId) {
      loadPlaylistDetails();
    }
  }, [isOpen, playlistId]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setTitle('');
      setDescription('');
      setError(null);
      setTitleError(null);
      setPlaylist(null);
    }
  }, [isOpen]);

  const loadPlaylistDetails = async () => {
    setIsLoadingPlaylist(true);
    setError(null);

    try {
      const response = await window.api.playlist.getById(playlistId);
      
      if (response.success) {
        setPlaylist(response.data);
        setTitle(response.data.title);
        setDescription(response.data.description || '');
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

  const validateTitle = (title: string): boolean => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }

    if (title.length > 255) {
      setTitleError('Title cannot exceed 255 characters');
      return false;
    }

    setTitleError(null);
    return true;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSave = async () => {
    if (!validateTitle(title)) {
      return;
    }

    if (description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    if (!playlist) {
      setError('Playlist data not loaded');
      return;
    }

    // Check if anything has changed
    const hasChanges = title.trim() !== playlist.title || description.trim() !== (playlist.description || '');
    
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.playlist.update(playlistId, {
        title: title.trim(),
        description: description.trim(),
      });

      if (response.success) {
        onPlaylistUpdated(response.data);
        onClose();
      } else {
        if (response.error.includes('already exists')) {
          setTitleError(response.error);
        } else {
          setError(response.error || 'Failed to update playlist');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred while updating the playlist');
      console.error('Update playlist error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (playlist) {
      setTitle(playlist.title);
      setDescription(playlist.description || '');
    }
    setError(null);
    setTitleError(null);
    onClose();
  };

  const hasUnsavedChanges = playlist && (
    title.trim() !== playlist.title || 
    description.trim() !== (playlist.description || '')
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div className="modal-content edit-playlist-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Playlist Details</h2>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
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
            <div className="edit-playlist-form">
              <div className="form-group">
                <label htmlFor="edit-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter playlist title"
                  disabled={isLoading}
                  maxLength={255}
                />
                <div className="character-count">
                  {title.length}/255 characters
                </div>
                {titleError && (
                  <div className="field-error">{titleError}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter playlist description (optional)"
                  disabled={isLoading}
                  maxLength={1000}
                  rows={4}
                />
                <div className="character-count">
                  {description.length}/1000 characters
                </div>
              </div>

              <div className="playlist-info">
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className={`playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`}>
                    {playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Videos:</span>
                  <span className="info-value">{playlist.videoCount} videos</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">
                    {new Date(playlist.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">
                    {new Date(playlist.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {playlist.type === 'YOUTUBE' && (
                <div className="youtube-playlist-notice">
                  <p>
                    <strong>Note:</strong> This is a YouTube playlist. Only the title and description 
                    can be edited. The original playlist content will remain unchanged.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Failed to load playlist</h3>
              <p>Could not load playlist details for editing.</p>
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
            className="btn-primary"
            onClick={handleSave}
            disabled={
              !playlist || 
              !title.trim() || 
              !!titleError || 
              isLoading || 
              isLoadingPlaylist ||
              !hasUnsavedChanges
            }
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};