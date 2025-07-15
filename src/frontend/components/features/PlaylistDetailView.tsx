import React, { useState, useEffect, useCallback } from 'react';
import { Video } from '../shared/data-models';

export interface PlaylistDetailViewProps {
  playlistId: number;
  onBack: () => void;
}

interface PlaylistWithVideos {
  id: number;
  title: string;
  description: string;
  type: 'YOUTUBE' | 'CUSTOM';
  videoCount: number;
  videos: Video[];
  createdAt: Date;
  updatedAt: Date;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlistId,
  onBack,
}) => {
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debounceSearch = useCallback(
    debounce((query: string, videos: Video[]) => {
      if (!query.trim()) {
        setFilteredVideos(videos);
        return;
      }

      const filtered = videos.filter(video =>
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.channelName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredVideos(filtered);
    }, 300),
    []
  );

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlistId]);

  useEffect(() => {
    if (playlist) {
      debounceSearch(searchQuery, playlist.videos);
    }
  }, [searchQuery, playlist, debounceSearch]);

  const loadPlaylistDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.playlist.getById(playlistId);
      
      if (response.success) {
        setPlaylist(response.data);
        setFilteredVideos(response.data.videos);
      } else {
        setError(response.error || 'Failed to load playlist details');
      }
    } catch (error) {
      setError('An unexpected error occurred while loading playlist details');
      console.error('Error loading playlist details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const formatDuration = (duration: string): string => {
    // Duration is already formatted from the backend
    return duration || '0:00';
  };

  const formatViewCount = (viewCount: number): string => {
    if (viewCount >= 1000000) {
      return `${(viewCount / 1000000).toFixed(1)}M views`;
    } else if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}K views`;
    } else {
      return `${viewCount} views`;
    }
  };

  const formatUploadDate = (uploadDate: Date): string => {
    return new Date(uploadDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAvailabilityStatusColor = (status: string): string => {
    switch (status) {
      case 'PUBLIC':
        return 'status-public';
      case 'PRIVATE':
        return 'status-private';
      case 'DELETED':
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  };

  const renderVideoItem = (video: Video, index: number) => (
    <div key={video.id} className="video-item">
      <div className="video-index">{index + 1}</div>
      
      <div className="video-thumbnail">
        <img
          src={video.thumbnailURL}
          alt={video.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/default-video-thumbnail.png';
          }}
        />
        <div className="video-duration">{formatDuration(video.duration)}</div>
      </div>

      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>
        <div className="video-channel">{video.channelName}</div>
        <div className="video-meta">
          <span className="video-views">{formatViewCount(video.viewCount)}</span>
          <span className="video-upload-date">
            Uploaded {formatUploadDate(video.uploadDate)}
          </span>
          <span className={`video-status ${getAvailabilityStatusColor(video.availabilityStatus)}`}>
            {video.availabilityStatus}
          </span>
        </div>
      </div>

      <div className="video-actions">
        <button
          className="video-action-btn"
          onClick={() => handleVideoAction(video.id, 'play')}
          title="Play video"
        >
          ▶
        </button>
        <button
          className="video-action-btn"
          onClick={() => handleVideoAction(video.id, 'download')}
          title="Download video"
        >
          ⬇
        </button>
        <button
          className="video-action-btn"
          onClick={() => handleVideoAction(video.id, 'remove')}
          title="Remove from playlist"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const handleVideoAction = (videoId: string, action: 'play' | 'download' | 'remove') => {
    switch (action) {
      case 'play':
        console.log('Play video:', videoId);
        // TODO: Implement video playback
        break;
      case 'download':
        console.log('Download video:', videoId);
        // TODO: Implement video download
        break;
      case 'remove':
        console.log('Remove video:', videoId);
        // TODO: Implement video removal
        break;
    }
  };

  const renderSearchResults = () => {
    if (searchQuery.trim() && filteredVideos.length === 0) {
      return (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No results found</h3>
          <p>
            No videos found matching "{searchQuery}". Try different keywords or{' '}
            <button className="link-button" onClick={clearSearch}>
              clear search
            </button>
            .
          </p>
        </div>
      );
    }

    if (filteredVideos.length === 0) {
      return (
        <div className="no-results">
          <div className="no-results-icon">📹</div>
          <h3>No videos in this playlist</h3>
          <p>This playlist doesn't contain any videos yet.</p>
        </div>
      );
    }

    return (
      <div className="video-list">
        {filteredVideos.map((video, index) => renderVideoItem(video, index))}
      </div>
    );
  };

  const renderLoading = () => (
    <div className="playlist-detail-loading">
      <div className="loading-spinner"></div>
      <p>Loading playlist details...</p>
    </div>
  );

  const renderError = () => (
    <div className="playlist-detail-error">
      <div className="error-icon">⚠️</div>
      <h3>Failed to load playlist</h3>
      <p>{error}</p>
      <div className="error-actions">
        <button className="btn-secondary" onClick={loadPlaylistDetails}>
          Try Again
        </button>
        <button className="btn-primary" onClick={onBack}>
          Go Back
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="playlist-detail-view">
        {renderLoading()}
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="playlist-detail-view">
        {renderError()}
      </div>
    );
  }

  return (
    <div className="playlist-detail-view">
      <div className="playlist-detail-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Playlists
        </button>
        
        <div className="playlist-header-content">
          <div className="playlist-header-info">
            <h1 className="playlist-detail-title">{playlist.title}</h1>
            {playlist.description && (
              <p className="playlist-detail-description">{playlist.description}</p>
            )}
            <div className="playlist-detail-meta">
              <span className="playlist-video-count">
                {playlist.videoCount} videos
              </span>
              <span className={`playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`}>
                {playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom'}
              </span>
              <span className="playlist-updated">
                Updated {formatUploadDate(playlist.updatedAt)}
              </span>
            </div>
          </div>

          <div className="playlist-header-actions">
            <button className="btn-secondary" onClick={() => console.log('Play all')}>
              ▶ Play All
            </button>
            <button className="btn-secondary" onClick={() => console.log('Download all')}>
              ⬇ Download All
            </button>
            <button className="btn-secondary" onClick={() => console.log('Edit playlist')}>
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      <div className="playlist-content">
        <div className="playlist-search-section">
          <div className="search-input-container">
            <input
              type="text"
              className="playlist-search-input"
              placeholder="Search videos by title or channel..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>
          
          {searchQuery && (
            <div className="search-results-info">
              Showing {filteredVideos.length} of {playlist.videoCount} videos
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          )}
        </div>

        <div className="playlist-videos-section">
          {renderSearchResults()}
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}