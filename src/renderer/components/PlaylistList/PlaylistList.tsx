import React, { useState } from 'react';
import { useGetAllPlaylists } from '../../hooks/usePlaylistQueries';
import { PlaylistSummary } from '../../../shared/types';
import { Button } from '../ui/Button';
import { PlaylistItem } from './PlaylistItem';
import { PlaylistActionsBar } from './PlaylistActionsBar';
import { usePlaylistStore } from '../../store/playlistStore';

// Extend the PlaylistSummary type to include source
interface ExtendedPlaylistSummary extends PlaylistSummary {
  source?: string;
}

interface PlaylistListProps {
  onCreatePlaylist: () => void;
  onImportPlaylist: () => void;
  onImportJson: () => void;
  onPlaylistAction: (action: 'delete' | 'refresh' | 'export' | 'rename', playlist: ExtendedPlaylistSummary) => void;
}

export const PlaylistList: React.FC<PlaylistListProps> = ({
  onCreatePlaylist,
  onImportPlaylist,
  onImportJson,
  onPlaylistAction,
}) => {
  const { data: playlists, isLoading, error } = useGetAllPlaylists();
  const { selectedPlaylistId, setSelectedPlaylistId } = usePlaylistStore();

  // Handle playlist selection
  const handleSelectPlaylist = (id: number) => {
    setSelectedPlaylistId(id);
  };

  // Component to show if there are no playlists
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-secondary-foreground/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
      <p className="text-secondary-foreground/70 mb-4">
        Create a new playlist or import one from YouTube
      </p>
      <div className="flex space-x-2">
        <Button onClick={onCreatePlaylist} variant="default" size="sm">
          Create Playlist
        </Button>
        <Button onClick={onImportPlaylist} variant="outline" size="sm">
          Import from YouTube
        </Button>
      </div>
    </div>
  );

  // Component to show while loading
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2 text-secondary-foreground/70">Loading playlists...</p>
    </div>
  );

  // Component to show if there's an error
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-destructive mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load playlists</h3>
      <p className="text-secondary-foreground/70 mb-4">
        {error instanceof Error ? error.message : 'An error occurred while loading playlists.'}
      </p>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        size="sm"
      >
        Retry
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <PlaylistActionsBar
        onCreatePlaylist={onCreatePlaylist}
        onImportPlaylist={onImportPlaylist}
        onImportJson={onImportJson}
      />

      <div className="overflow-y-auto flex-grow">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : !playlists || playlists.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-2 space-y-2">
            {playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist as ExtendedPlaylistSummary}
                isSelected={playlist.id === selectedPlaylistId}
                onSelect={handleSelectPlaylist}
                onPlaylistAction={onPlaylistAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 