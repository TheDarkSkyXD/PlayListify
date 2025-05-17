import React from 'react';
import { Playlist } from '../../../../shared/types/index'; // Adjusted path for shared types
import PlaylistActionsDropdown from '../../../features/playlists/components/PlaylistActionsDropdown/PlaylistActionsDropdown';
import { Music2, Youtube, ListMusic } from 'lucide-react'; // Icons for source

interface PlaylistItemRowProps {
  playlist: Playlist;
  onPlay?: (playlistId: string) => void;
  onRefresh?: (playlistId: string) => void;
  onDelete?: (playlistId: string) => void;
  onDuplicate?: (playlistId: string) => void;
  onDownload?: (playlistId: string) => void;
  onEdit?: (playlistId: string) => void;
  onClick?: (playlistId: string) => void; // For navigating to playlist detail
}

const PlaylistItemRow: React.FC<PlaylistItemRowProps> = ({
  playlist,
  onPlay,
  onRefresh,
  onDelete,
  onDuplicate,
  onDownload,
  onEdit,
  onClick,
}) => {
  const getSourceIcon = () => {
    if (playlist.source === 'youtube') {
      return <Youtube className="h-5 w-5 text-red-500" />;
    }
    return <ListMusic className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div 
      className="flex items-center p-3 hover:bg-neutral-800/70 rounded-md cursor-pointer transition-colors duration-150 group"
      onClick={(e) => {
        // Prevent click action if the click originated from within the dropdown trigger button
        if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
          return;
        }
        onClick && onClick(playlist.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Check if focus is on the row itself and not on the dropdown trigger
          if (!(e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
            onClick && onClick(playlist.id);
          }
        }
      }}
      role="button"
      tabIndex={0} // Row is focusable, but click action specific
    >
      {/* Thumbnail Placeholder or Actual Thumbnail */}
      <div className="w-16 h-9 bg-neutral-700 rounded flex items-center justify-center mr-4 shrink-0">
        {playlist.thumbnail ? (
          <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover rounded" />
        ) : (
          <Music2 className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Playlist Info */}
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">{playlist.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {playlist.item_count} items {playlist.description && `• ${playlist.description}`}
        </p>
      </div>

      {/* Source Icon */}
      <div className="w-10 shrink-0 flex items-center justify-center mx-2" title={`Source: ${playlist.source}`}>
        {getSourceIcon()}
      </div>

      {/* Actions Dropdown - now always visible */}
      <div className="ml-auto shrink-0"> {/* Removed opacity classes, added ml-auto for positioning */}
        {/* Wrap PlaylistActionsDropdown to stop propagation */}
        <div onClick={(e) => {
          e.stopPropagation();
          // console.log('PlaylistItemRow: Dropdown wrapper clicked, propagation stopped.'); // Removed
        }}>
          <PlaylistActionsDropdown 
            playlist={playlist} 
            onPlay={onPlay}
            onRefresh={onRefresh}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onDownload={onDownload}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaylistItemRow; 