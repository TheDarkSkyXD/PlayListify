import React from 'react';
// Assuming PlaylistCard is located here, adjust if necessary. 
// Based on workflow, PlaylistCard.tsx is in features/playlists/components/PlaylistCard/PlaylistCard.tsx
import PlaylistCard from '../../../features/playlists/components/PlaylistCard/PlaylistCard'; 
import AddNewPlaylistCard from '../../../features/playlists/components/AddNewPlaylistCard/AddNewPlaylistCard'; // Import the new component
// import { useGetAllPlaylists } from '../../../hooks/usePlaylistQueries'; // Removed, data will come via props
// Import the shared Playlist type - this should be the single source of truth
import { Playlist } from '../../../../shared/types/index'; // Assuming index.ts re-exports the correct Playlist type
import { Loader2, AlertTriangle, ListChecks } from 'lucide-react'; // Removed PlusCircle
// import { ResponsiveMasonry, Masonry } from 'react-responsive-masonry'; // Removed unused import

// Placeholder for Playlist type, assuming it will be defined in shared types
// e.g., import { Playlist } from '@/shared/types';

// Updated PlaylistGridProps to accept playlists, isLoading, and error from parent
interface PlaylistGridProps {
  playlists: Playlist[];
  isLoading: boolean;
  error?: string | null;
  onAddNewPlaylistClick?: () => void; // Add new prop for the click handler
  onPlayPlaylist?: (playlistId: string) => void;
  onRefreshPlaylist?: (playlistId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onDuplicatePlaylist?: (playlistId: string) => void;
  onDownloadPlaylist?: (playlistId: string) => void;
  onEditPlaylistDetails?: (playlistId: string) => void;
  onPlaylistClick?: (playlistId: string) => void;
}

// PlaylistGrid will now fetch its own data, so it only needs action handlers as props.
const PlaylistGrid: React.FC<PlaylistGridProps> = ({
  playlists,
  isLoading,
  error,
  onAddNewPlaylistClick, // Destructure the new prop
  onPlayPlaylist,
  onRefreshPlaylist,
  onDeletePlaylist,
  onDuplicatePlaylist,
  onDownloadPlaylist,
  onEditPlaylistDetails,
  onPlaylistClick,
}) => {
  // const { data: playlists, isLoading, error } = useGetAllPlaylists(); // Removed internal data fetching

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-1">
        {/* Render 5 playlist skeletons initially */}
        {[...Array(5)].map((_, index) => (
          <div key={`playlist-skeleton-${index}`} className="bg-neutral-200 dark:bg-neutral-800/60 rounded-lg p-4 animate-pulse space-y-3">
            <div className="aspect-video bg-neutral-300 dark:bg-neutral-700 rounded-md"></div>
            <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4"></div>
          </div>
        ))}
        {/* Render AddNewPlaylistCard skeleton if the handler is provided */}
        {onAddNewPlaylistClick && (
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-800/60 rounded-lg p-4 animate-pulse flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-neutral-300 dark:bg-neutral-700 rounded-full mb-3"></div>
                <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
            </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4 text-red-500 dark:text-red-400">
        <AlertTriangle className="mx-auto h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">Error loading playlists</p>
        <p className="text-sm">{error}</p>
        {/* Future: Add a retry button, e.g., onClick={() => queryClient.refetchQueries(playlistKeys.lists())} */}
      </div>
    );
  }

  // If there are no playlists and no function to add a new one, show empty message.
  if (playlists.length === 0 && !onAddNewPlaylistClick) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <ListChecks className="mx-auto h-12 w-12 text-neutral-500 dark:text-neutral-400" />
        <p className="mt-4 text-lg font-medium">No Playlists Found</p>
        <p className="text-sm">
          It looks like you don't have any playlists yet, or they don't match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-1">
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={{
            ...playlist,
            videoCount: playlist.itemCount,
            type: playlist.source,
            thumbnail: playlist.thumbnail,
          }}
          onClick={() => onPlaylistClick && onPlaylistClick(playlist.id)}
          onPlay={() => onPlayPlaylist && onPlayPlaylist(playlist.id)}
          onRefresh={() => onRefreshPlaylist && onRefreshPlaylist(playlist.id)}
          onDelete={() => onDeletePlaylist && onDeletePlaylist(playlist.id)}
          onDuplicate={() => onDuplicatePlaylist && onDuplicatePlaylist(playlist.id)}
          onDownload={() => onDownloadPlaylist && onDownloadPlaylist(playlist.id)}
          onEdit={() => onEditPlaylistDetails && onEditPlaylistDetails(playlist.id)}
        />
      ))}
      {/* Render AddNewPlaylistCard if the click handler is provided. It will flow into the grid. */}
      {onAddNewPlaylistClick && (
        <AddNewPlaylistCard onClick={onAddNewPlaylistClick} />
      )}
    </div>
  );
};

export default PlaylistGrid; 