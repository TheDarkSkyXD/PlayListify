import React, { useState } from 'react';

export interface PlaylistCardProps {
  playlist: {
    id: number;
    title: string;
    description: string;
    type: 'YOUTUBE' | 'CUSTOM';
    videoCount: number;
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  viewMode: 'grid' | 'list';
  onClick: (playlistId: number) => void;
  onEdit?: (playlistId: number) => void;
  onDelete?: (playlistId: number) => void;
  onDownload?: (playlistId: number) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  viewMode,
  onClick,
  onEdit,
  onDelete,
  onDownload,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('.playlist-actions')) {
      return;
    }
    onClick(playlist.id);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderThumbnail = () => {
    if (imageError || !playlist.thumbnailUrl) {
      return (
        <div className="playlist-thumbnail-placeholder">
          <span className="playlist-icon">
            {playlist.type === 'YOUTUBE' ? '📺' : '🎵'}
          </span>
        </div>
      );
    }

    return (
      <img
        src={playlist.thumbnailUrl}
        alt={playlist.title}
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  const renderActions = () => (
    <div
      className={`playlist-actions ${showActions ? 'show' : ''}`}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        className="playlist-action-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        title="More actions"
      >
        ⋮
      </button>
      
      {showActions && (
        <div className="playlist-actions-menu">
          {onEdit && (
            <button
              className="action-item"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(playlist.id);
                setShowActions(false);
              }}
            >
              <span className="action-icon">✏️</span>
              Edit Details
            </button>
          )}
          
          {onDownload && (
            <button
              className="action-item"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(playlist.id);
                setShowActions(false);
              }}
            >
              <span className="action-icon">⬇️</span>
              Download All
            </button>
          )}
          
          {onDelete && (
            <button
              className="action-item action-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(playlist.id);
                setShowActions(false);
              }}
            >
              <span className="action-icon">🗑️</span>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div
        className="playlist-card playlist-card-list"
        onClick={handleCardClick}
      >
        <div className="playlist-thumbnail">
          {renderThumbnail()}
        </div>
        
        <div className="playlist-info">
          <div className="playlist-main-info">
            <h3 className="playlist-title">{playlist.title}</h3>
            <p className="playlist-description">
              {truncateText(playlist.description, 100)}
            </p>
          </div>
          
          <div className="playlist-meta">
            <span className="video-count">{playlist.videoCount} videos</span>
            <span className={`playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`}>
              {playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom'}
            </span>
            <span className="playlist-date">
              Updated {formatDate(playlist.updatedAt)}
            </span>
          </div>
        </div>

        {renderActions()}
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="playlist-card playlist-card-grid"
      onClick={handleCardClick}
    >
      <div className="playlist-thumbnail">
        {renderThumbnail()}
        <div className="playlist-overlay">
          <span className="video-count-overlay">{playlist.videoCount} videos</span>
        </div>
      </div>
      
      <div className="playlist-info">
        <h3 className="playlist-title" title={playlist.title}>
          {truncateText(playlist.title, 40)}
        </h3>
        
        {playlist.description && (
          <p className="playlist-description" title={playlist.description}>
            {truncateText(playlist.description, 60)}
          </p>
        )}
        
        <div className="playlist-meta">
          <span className={`playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`}>
            {playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom'}
          </span>
          <span className="playlist-date">
            {formatDate(playlist.updatedAt)}
          </span>
        </div>
      </div>

      {renderActions()}
    </div>
  );
};