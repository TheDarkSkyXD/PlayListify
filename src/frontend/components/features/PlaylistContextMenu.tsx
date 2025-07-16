// src/frontend/components/features/PlaylistContextMenu.tsx

import {
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  MoreVertical,
  Play,
  Share,
  Star,
  Trash2,
} from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Playlist } from './PlaylistGrid';

export interface PlaylistContextMenuProps {
  playlist: Playlist;
  onAction: (action: string, playlistId: string) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const PlaylistContextMenu: React.FC<PlaylistContextMenuProps> = ({
  playlist,
  onAction,
  trigger,
  align = 'end',
  side = 'bottom',
}) => {
  const handleAction = (action: string) => {
    onAction(action, playlist.id);
  };

  const defaultTrigger = (
    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
      <MoreVertical className='h-4 w-4' />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className='w-56'>
        <DropdownMenuLabel>{playlist.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Primary Actions */}
        <DropdownMenuItem onClick={() => handleAction('play')}>
          <Play className='mr-2 h-4 w-4' />
          Play Playlist
          <DropdownMenuShortcut>Space</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction('view')}>
          <Eye className='mr-2 h-4 w-4' />
          View Details
          <DropdownMenuShortcut>Enter</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Edit Actions */}
        <DropdownMenuItem onClick={() => handleAction('edit')}>
          <Edit className='mr-2 h-4 w-4' />
          Edit Playlist
          <DropdownMenuShortcut>E</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction('duplicate')}>
          <Copy className='mr-2 h-4 w-4' />
          Duplicate
          <DropdownMenuShortcut>Ctrl+D</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Privacy Toggle */}
        <DropdownMenuItem onClick={() => handleAction('toggle-privacy')}>
          {playlist.isPrivate ? (
            <>
              <Eye className='mr-2 h-4 w-4' />
              Make Public
            </>
          ) : (
            <>
              <EyeOff className='mr-2 h-4 w-4' />
              Make Private
            </>
          )}
        </DropdownMenuItem>

        {/* Favorite Toggle */}
        <DropdownMenuItem onClick={() => handleAction('toggle-favorite')}>
          <Star className='mr-2 h-4 w-4' />
          Add to Favorites
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Share Actions */}
        <DropdownMenuItem onClick={() => handleAction('share')}>
          <Share className='mr-2 h-4 w-4' />
          Share Playlist
          <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
        </DropdownMenuItem>

        {playlist.type === 'youtube' && playlist.source && (
          <DropdownMenuItem onClick={() => handleAction('open-source')}>
            <ExternalLink className='mr-2 h-4 w-4' />
            Open on YouTube
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Download Actions */}
        <DropdownMenuItem onClick={() => handleAction('download')}>
          <Download className='mr-2 h-4 w-4' />
          Download Playlist
          <DropdownMenuShortcut>Ctrl+↓</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Destructive Actions */}
        <DropdownMenuItem
          onClick={() => handleAction('delete')}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Playlist
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Bulk Actions Context Menu for multiple selected playlists
export interface BulkPlaylistContextMenuProps {
  selectedPlaylists: Playlist[];
  onAction: (action: string, playlistIds: string[]) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const BulkPlaylistContextMenu: React.FC<
  BulkPlaylistContextMenuProps
> = ({
  selectedPlaylists,
  onAction,
  trigger,
  align = 'end',
  side = 'bottom',
}) => {
  const playlistIds = selectedPlaylists.map(p => p.id);
  const selectedCount = selectedPlaylists.length;

  const handleAction = (action: string) => {
    onAction(action, playlistIds);
  };

  const defaultTrigger = (
    <Button variant='outline' size='sm'>
      <MoreVertical className='mr-2 h-4 w-4' />
      Actions ({selectedCount})
    </Button>
  );

  // Check if all selected playlists are private/public for toggle actions
  const allPrivate = selectedPlaylists.every(p => p.isPrivate);
  const allPublic = selectedPlaylists.every(p => !p.isPrivate);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className='w-56'>
        <DropdownMenuLabel>
          {selectedCount} Playlist{selectedCount > 1 ? 's' : ''} Selected
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Bulk Actions */}
        <DropdownMenuItem onClick={() => handleAction('download-all')}>
          <Download className='mr-2 h-4 w-4' />
          Download All
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction('export-all')}>
          <Share className='mr-2 h-4 w-4' />
          Export All
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Privacy Actions */}
        {!allPrivate && (
          <DropdownMenuItem onClick={() => handleAction('make-private')}>
            <EyeOff className='mr-2 h-4 w-4' />
            Make All Private
          </DropdownMenuItem>
        )}

        {!allPublic && (
          <DropdownMenuItem onClick={() => handleAction('make-public')}>
            <Eye className='mr-2 h-4 w-4' />
            Make All Public
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => handleAction('add-to-favorites')}>
          <Star className='mr-2 h-4 w-4' />
          Add All to Favorites
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Destructive Actions */}
        <DropdownMenuItem
          onClick={() => handleAction('delete-all')}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete All Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Quick Actions Component - for common actions without dropdown
export interface PlaylistQuickActionsProps {
  playlist: Playlist;
  onAction: (action: string, playlistId: string) => void;
  showLabels?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

export const PlaylistQuickActions: React.FC<PlaylistQuickActionsProps> = ({
  playlist,
  onAction,
  showLabels = false,
  variant = 'ghost',
  size = 'sm',
}) => {
  const handleAction = (action: string) => {
    onAction(action, playlist.id);
  };

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant={variant}
        size={size}
        onClick={() => handleAction('play')}
        title='Play Playlist'
      >
        <Play className='h-4 w-4' />
        {showLabels && <span className='ml-1'>Play</span>}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleAction('toggle-favorite')}
        title='Add to Favorites'
      >
        <Heart className='h-4 w-4' />
        {showLabels && <span className='ml-1'>Favorite</span>}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleAction('download')}
        title='Download Playlist'
      >
        <Download className='h-4 w-4' />
        {showLabels && <span className='ml-1'>Download</span>}
      </Button>

      <PlaylistContextMenu
        playlist={playlist}
        onAction={onAction}
        trigger={
          <Button variant={variant} size={size} title='More Actions'>
            <MoreVertical className='h-4 w-4' />
            {showLabels && <span className='ml-1'>More</span>}
          </Button>
        }
      />
    </div>
  );
};
