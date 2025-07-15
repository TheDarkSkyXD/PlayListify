import React, { useState, useEffect } from 'react';

export interface AddPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistAdded: (playlist: any) => void;
}

interface PlaylistPreview {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
  uploader: string;
}

export const AddPlaylistDialog: React.FC<AddPlaylistDialogProps> = ({
  isOpen,
  onClose,
  onPlaylistAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'custom'>('youtube');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube import state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playlistPreview, setPlaylistPreview] = useState<PlaylistPreview | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  // Custom playlist state
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setYoutubeUrl('');
      setPlaylistPreview(null);
      setCustomTitle('');
      setCustomDescription('');
      setError(null);
      setTitleError(null);
      setActiveTab('youtube');
    }
  }, [isOpen]);

  const validateYouTubeUrl = async (url: string) => {
    if (!url.trim()) {
      setPlaylistPreview(null);
      return;
    }

    setIsValidatingUrl(true);
    setError(null);

    try {
      const response = await window.api.youtube.validateUrl(url);
      
      if (!response.success) {
        setError(response.error || 'Invalid URL');
        setPlaylistPreview(null);
        return;
      }

      if (!response.data.isValid) {
        setError('Please enter a valid YouTube playlist URL');
        setPlaylistPreview(null);
        return;
      }

      // Get playlist metadata
      const metadataResponse = await window.api.youtube.getPlaylistMetadata(response.data.sanitizedUrl);
      
      if (metadataResponse.success) {
        setPlaylistPreview({
          title: metadataResponse.data.title,
          description: metadataResponse.data.description,
          thumbnailUrl: metadataResponse.data.thumbnailUrl,
          videoCount: metadataResponse.data.videoCount,
          uploader: metadataResponse.data.uploader,
        });
        setError(null);
      } else {
        setError(metadataResponse.error || 'Failed to fetch playlist information');
        setPlaylistPreview(null);
      }
    } catch (error) {
      setError('An unexpected error occurred while validating the URL');
      setPlaylistPreview(null);
      console.error('URL validation error:', error);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    // Debounce URL validation
    const timeoutId = setTimeout(() => {
      validateYouTubeUrl(url);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleImportPlaylist = async () => {
    if (!playlistPreview) {
      setError('Please enter a valid YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.youtube.importPlaylist(youtubeUrl);
      
      if (response.success) {
        onPlaylistAdded(response.data.playlist);
        onClose();
      } else {
        setError(response.error || 'Failed to import playlist');
      }
    } catch (error) {
      setError('An unexpected error occurred while importing the playlist');
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateCustomTitle = async (title: string) => {
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

  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setCustomTitle(title);
    validateCustomTitle(title);
  };

  const handleCreateCustomPlaylist = async () => {
    if (!(await validateCustomTitle(customTitle))) {
      return;
    }

    if (customDescription.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.playlist.create({
        title: customTitle.trim(),
        description: customDescription.trim(),
        type: 'CUSTOM',
      });

      if (response.success) {
        onPlaylistAdded(response.data);
        onClose();
      } else {
        if (response.error.includes('already exists')) {
          setTitleError(response.error);
        } else {
          setError(response.error || 'Failed to create playlist');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred while creating the playlist');
      console.error('Create playlist error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content add-playlist-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Playlist</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-tabs">
          <button
            className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`}
            onClick={() => setActiveTab('youtube')}
          >
            From YouTube
          </button>
          <button
            className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Playlist
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="youtube-tab">
              <div className="form-group">
                <label htmlFor="youtube-url">YouTube Playlist URL</label>
                <input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={handleUrlChange}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  disabled={isLoading}
                />
                {isValidatingUrl && (
                  <div className="validation-spinner">Validating URL...</div>
                )}
              </div>

              {playlistPreview && (
                <div className="playlist-preview">
                  <h3>Playlist Preview</h3>
                  <div className="preview-content">
                    {playlistPreview.thumbnailUrl && (
                      <img
                        src={playlistPreview.thumbnailUrl}
                        alt="Playlist thumbnail"
                        className="preview-thumbnail"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="preview-info">
                      <h4 className="preview-title">{playlistPreview.title}</h4>
                      <p className="preview-uploader">by {playlistPreview.uploader}</p>
                      <p className="preview-video-count">{playlistPreview.videoCount} videos</p>
                      {playlistPreview.description && (
                        <p className="preview-description">
                          {playlistPreview.description.length > 200
                            ? `${playlistPreview.description.substring(0, 200)}...`
                            : playlistPreview.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="custom-tab">
              <div className="form-group">
                <label htmlFor="custom-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  id="custom-title"
                  type="text"
                  value={customTitle}
                  onChange={handleCustomTitleChange}
                  placeholder="Enter playlist title"
                  disabled={isLoading}
                  maxLength={255}
                />
                <div className="character-count">
                  {customTitle.length}/255 characters
                </div>
                {titleError && (
                  <div className="field-error">{titleError}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="custom-description">Description</label>
                <textarea
                  id="custom-description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Enter playlist description (optional)"
                  disabled={isLoading}
                  maxLength={1000}
                  rows={4}
                />
                <div className="character-count">
                  {customDescription.length}/1000 characters
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {activeTab === 'youtube' ? (
            <button
              className="btn-primary"
              onClick={handleImportPlaylist}
              disabled={!playlistPreview || isLoading || isValidatingUrl}
            >
              {isLoading ? 'Importing...' : 'Import Playlist'}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCreateCustomPlaylist}
              disabled={!customTitle.trim() || !!titleError || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Playlist'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};