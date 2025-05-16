import React from 'react';
import { Playlist } from '../../../../shared/types/index'; // Adjusted path for shared types
import PlaylistItemRow from '../PlaylistItemRow/PlaylistItemRow'; // Corrected import path
import { ListChecks } from 'lucide-react'; // Icon for empty state

interface PlaylistListViewProps {
  playlists: Playlist[];
  isLoading: boolean;
  error?: string | null;
  onPlayPlaylist?: (playlistId: string) => void;
  onRefreshPlaylist?: (playlistId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onDuplicatePlaylist?: (playlistId: string) => void;
  onDownloadPlaylist?: (playlistId: string) => void;
  onEditPlaylistDetails?: (playlistId: string) => void;
  onPlaylistClick?: (playlistId: string) => void;
}

const PlaylistListView: React.FC<PlaylistListViewProps> = ({
  playlists,
  isLoading,
  error,
  onPlayPlaylist,
  onRefreshPlaylist,
  onDeletePlaylist,
  onDuplicatePlaylist,
  onDownloadPlaylist,
  onEditPlaylistDetails,
  onPlaylistClick,
}) => {
  if (isLoading) {
    // Basic skeleton for list view - can be enhanced later
    return (
      <div className="space-y-2 p-1">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center p-3 bg-neutral-800/60 rounded-md animate-pulse">
            <div className="w-16 h-9 bg-neutral-700 rounded mr-4 shrink-0"></div>
            <div className="flex-grow space-y-2">
              <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
              <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
            </div>
            <div className="w-10 h-5 bg-neutral-700 rounded mx-2 shrink-0"></div>
            <div className="w-8 h-8 bg-neutral-700 rounded shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4 text-red-400">
        <p className="text-lg font-semibold">Error loading playlists</p>
        <p className="text-sm">{error}</p>
        {/* Future: Add a retry button */}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <ListChecks className="mx-auto h-12 w-12 text-neutral-500" />
        <p className="mt-4 text-lg font-medium">No Playlists Found</p>
        <p className="text-sm">
          Try adjusting your filters or create a new playlist!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-1">
      {playlists.map((playlist) => (
        <PlaylistItemRow 
          key={playlist.id} 
          playlist={playlist} 
          onPlay={onPlayPlaylist}
          onRefresh={onRefreshPlaylist}
          onDelete={onDeletePlaylist}
          onDuplicate={onDuplicatePlaylist}
          onDownload={onDownloadPlaylist}
          onEdit={onEditPlaylistDetails}
          onClick={onPlaylistClick}
        />
      ))}
    </div>
  );
};

export default PlaylistListView; 