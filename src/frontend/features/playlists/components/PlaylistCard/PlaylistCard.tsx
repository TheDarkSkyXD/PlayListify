import React from 'react';
import PlaylistActionsDropdown from '../PlaylistActionsDropdown/PlaylistActionsDropdown';
import { PlayCircle } from 'lucide-react';
import { Playlist as SharedPlaylist } from '../../../../../shared/types/index';

export interface PlaylistCardDisplayData extends SharedPlaylist {
  videoCount: number;
  type: 'youtube' | 'custom';
  thumbnail?: string;
}

interface PlaylistCardProps {
  playlist: PlaylistCardDisplayData;
  status?: 'public' | 'private' | 'downloading' | 'error';
  onClick?: (playlistId: string) => void;
  onPlay?: (playlistId: string) => void;
  onRefresh?: (playlistId: string) => void;
  onDelete?: (playlistId: string) => void;
  onDuplicate?: (playlistId: string) => void;
  onDownload?: (playlistId: string) => void;
  onEdit?: (playlistId: string) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  status,
  onClick,
  onPlay,
  onRefresh,
  onDelete,
  onDuplicate,
  onDownload,
  onEdit,
}) => {
  const cardBaseStyle = "rounded-lg overflow-hidden shadow-lg bg-neutral-800 hover:shadow-xl transition-shadow duration-300 ease-in-out group relative";
  const statusBorderColor = status === 'error' ? 'border-red-500' : status === 'downloading' ? 'border-blue-500' : 'border-transparent';

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]') || 
        (e.target as HTMLElement).closest('[data-radix-dropdown-menu-content]')) {
      return;
    }
    onClick && onClick(playlist.id);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!(e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]') && 
          !(e.target as HTMLElement).closest('[data-radix-dropdown-menu-content]')) {
        onClick && onClick(playlist.id);
      }
    }
  };

  return (
    <div
      className={`${cardBaseStyle} border-2 ${statusBorderColor}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
    >
      <div className="absolute top-1 right-1 z-10">
        <div onClick={(e) => {
          e.stopPropagation();
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

      <div className="relative">
        {playlist.thumbnail ? (
          <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-neutral-700 flex items-center justify-center">
            <PlayCircle className="w-16 h-16 text-neutral-500" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate" title={playlist.name}>{playlist.name}</h3>
        {playlist.description && (
          <p className="text-sm text-neutral-400 mt-1 h-10 overflow-hidden text-ellipsis" title={playlist.description}>
            {playlist.description}
          </p>
        )}
        <div className="mt-2 flex justify-between items-center text-xs text-neutral-400">
          <span>{playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}</span>
          {status && (
            <span className={`capitalize px-2 py-1 rounded-full text-xs ${status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-neutral-700'}`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard; 