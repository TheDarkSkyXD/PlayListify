// src/frontend/components/features/PlaylistGrid.tsx

import {
  Calendar,
  Clock,
  Globe,
  Lock,
  MoreVertical,
  Music,
  Play,
  Plus,
} from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  usePlaylistSelection,
  usePlaylistUIStore,
} from '../../stores/usePlaylistUIStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import {
  BulkPlaylistContextMenu,
  PlaylistContextMenu,
} from './PlaylistContextMenu';

// Playlist interface
export interface Playlist {
  id: string;
  title: string;
  description?: string;
  type: 'custom' | 'youtube';
  source?: string;
  videoCount: number;
  totalDuration: number; // in seconds
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface PlaylistGridProps {
  playlists: Playlist[];
  viewMode: 'grid' | 'list';
  onPlaylistSelect: (id: string) => void;
  onPlaylistAction: (action: string, id: string) => void;
  onAddPlaylist?: () => void;
  className?: string;
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Helper function to format date
function formatDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Selection Header Component
const SelectionHeader: React.FC<{
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: string, ids: string[]) => void;
  selectedPlaylists: Playlist[];
}> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  selectedPlaylists,
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className='mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-4'>
      <div className='flex items-center gap-3'>
        <Checkbox
          checked={allSelected}
          ref={el => {
            if (el) el.indeterminate = someSelected;
          }}
          onCheckedChange={allSelected ? onClearSelection : onSelectAll}
        />
        <span className='text-sm font-medium'>
          {selectedCount > 0
            ? `${selectedCount} of ${totalCount} playlists selected`
            : `Select all ${totalCount} playlists`}
        </span>
      </div>

      {selectedCount > 0 && (
        <div className='flex items-center gap-2'>
          <BulkPlaylistContextMenu
            selectedPlaylists={selectedPlaylists}
            onAction={onBulkAction}
          />
          <Button variant='ghost' size='sm' onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};

// Enhanced Playlist Card Component with selection and context menu
const PlaylistCard: React.FC<{
  playlist: Playlist;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onAction: (action: string, id: string) => void;
  onToggleSelection: (id: string) => void;
}> = ({
  playlist,
  isSelected,
  isSelectionMode,
  onSelect,
  onAction,
  onToggleSelection,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      onToggleSelection(playlist.id);
    } else {
      onSelect(playlist.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onAction('menu', playlist.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isSelectionMode) {
          onToggleSelection(playlist.id);
        } else {
          onSelect(playlist.id);
        }
        break;
      case 'Delete':
        e.preventDefault();
        onAction('delete', playlist.id);
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onAction('edit', playlist.id);
        }
        break;
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring hover:shadow-md',
        isSelected && 'bg-primary/5 ring-2 ring-primary',
        isSelectionMode && 'hover:bg-muted/50',
      )}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role='button'
      aria-selected={isSelected}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(playlist.id)}
                onClick={e => e.stopPropagation()}
                className='mt-1'
              />
            )}
            <div className='min-w-0 flex-1'>
              <CardTitle className='truncate text-lg'>
                {playlist.title}
              </CardTitle>
              {playlist.description && (
                <CardDescription className='mt-1 line-clamp-2'>
                  {playlist.description}
                </CardDescription>
              )}
            </div>
          </div>
          <PlaylistContextMenu
            playlist={playlist}
            onAction={onAction}
            trigger={
              <Button
                variant='ghost'
                size='sm'
                className='opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className='h-4 w-4' />
              </Button>
            }
          />
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-3'>
          {/* Stats */}
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Music className='h-3 w-3' />
              <span>{playlist.videoCount} videos</span>
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              <span>{formatDuration(playlist.totalDuration)}</span>
            </div>
            <div className='flex items-center gap-1'>
              {playlist.isPrivate ? (
                <Lock className='h-3 w-3' />
              ) : (
                <Globe className='h-3 w-3' />
              )}
              <span>{playlist.isPrivate ? 'Private' : 'Public'}</span>
            </div>
          </div>

          {/* Tags */}
          {playlist.tags.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {playlist.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant='secondary' className='text-xs'>
                  {tag}
                </Badge>
              ))}
              {playlist.tags.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{playlist.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-between pt-2'>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Calendar className='h-3 w-3' />
              <span>Updated {formatDate(playlist.updatedAt)}</span>
            </div>
            <Button
              size='sm'
              variant='ghost'
              className='opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'
              onClick={e => {
                e.stopPropagation();
                onAction('play', playlist.id);
              }}
            >
              <Play className='mr-1 h-3 w-3' />
              Play
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Playlist List Item Component with selection and context menu
const PlaylistListItem: React.FC<{
  playlist: Playlist;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onAction: (action: string, id: string) => void;
  onToggleSelection: (id: string) => void;
}> = ({
  playlist,
  isSelected,
  isSelectionMode,
  onSelect,
  onAction,
  onToggleSelection,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      onToggleSelection(playlist.id);
    } else {
      onSelect(playlist.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onAction('menu', playlist.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isSelectionMode) {
          onToggleSelection(playlist.id);
        } else {
          onSelect(playlist.id);
        }
        break;
      case 'Delete':
        e.preventDefault();
        onAction('delete', playlist.id);
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onAction('edit', playlist.id);
        }
        break;
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring hover:shadow-sm',
        isSelected && 'bg-primary/5 ring-2 ring-primary',
        isSelectionMode && 'hover:bg-muted/50',
      )}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role='button'
      aria-selected={isSelected}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex min-w-0 flex-1 items-center gap-3'>
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(playlist.id)}
                onClick={e => e.stopPropagation()}
              />
            )}
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-3'>
                <div className='min-w-0 flex-1'>
                  <h3 className='truncate font-medium'>{playlist.title}</h3>
                  {playlist.description && (
                    <p className='mt-1 truncate text-sm text-muted-foreground'>
                      {playlist.description}
                    </p>
                  )}
                </div>

                <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Music className='h-3 w-3' />
                    <span>{playlist.videoCount}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    <span>{formatDuration(playlist.totalDuration)}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    {playlist.isPrivate ? (
                      <Lock className='h-3 w-3' />
                    ) : (
                      <Globe className='h-3 w-3' />
                    )}
                  </div>
                  <span className='text-xs'>
                    {formatDate(playlist.updatedAt)}
                  </span>
                </div>
              </div>

              {playlist.tags.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-1'>
                  {playlist.tags.slice(0, 5).map(tag => (
                    <Badge key={tag} variant='secondary' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                  {playlist.tags.length > 5 && (
                    <Badge variant='outline' className='text-xs'>
                      +{playlist.tags.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='ml-4 flex items-center gap-2'>
            <Button
              size='sm'
              variant='ghost'
              className='opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'
              onClick={e => {
                e.stopPropagation();
                onAction('play', playlist.id);
              }}
            >
              <Play className='mr-1 h-3 w-3' />
              Play
            </Button>
            <PlaylistContextMenu
              playlist={playlist}
              onAction={onAction}
              trigger={
                <Button
                  variant='ghost'
                  size='sm'
                  className='opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className='h-4 w-4' />
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddPlaylist?: () => void }> = ({
  onAddPlaylist,
}) => {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center'>
      <div className='mb-4 rounded-full bg-muted p-6'>
        <Music className='h-12 w-12 text-muted-foreground' />
      </div>
      <h3 className='mb-2 text-lg font-medium'>No playlists found</h3>
      <p className='mb-6 max-w-md text-muted-foreground'>
        You don't have any playlists yet. Create your first playlist to get
        started.
      </p>
      {onAddPlaylist && (
        <Button onClick={onAddPlaylist}>
          <Plus className='mr-2 h-4 w-4' />
          Create Playlist
        </Button>
      )}
    </div>
  );
};

// Main PlaylistGrid Component with enhanced functionality
export const PlaylistGrid: React.FC<PlaylistGridProps> = ({
  playlists,
  viewMode,
  onPlaylistSelect,
  onPlaylistAction,
  onAddPlaylist,
  className,
}) => {
  const { selectedPlaylists, isSelectionMode } = usePlaylistSelection();
  const {
    togglePlaylistSelection,
    selectAllPlaylists,
    clearSelection,
    setSelectionMode,
  } = usePlaylistUIStore();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (!isSelectionMode) {
              setSelectionMode(true);
            }
            selectAllPlaylists(playlists.map(p => p.id));
          }
          break;
        case 'Escape':
          if (isSelectionMode) {
            e.preventDefault();
            clearSelection();
          }
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey && !isSelectionMode) {
            e.preventDefault();
            setSelectionMode(true);
          }
          break;
      }
    },
    [
      isSelectionMode,
      playlists,
      selectAllPlaylists,
      clearSelection,
      setSelectionMode,
    ],
  );

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle bulk actions
  const handleBulkAction = (action: string, playlistIds: string[]) => {
    // For now, just call the individual action for each playlist
    // In a real implementation, this would be optimized for bulk operations
    playlistIds.forEach(id => {
      onPlaylistAction(action.replace('-all', ''), id);
    });

    // Clear selection after bulk action
    if (action.includes('delete')) {
      clearSelection();
    }
  };

  // Handle selection actions
  const handleSelectAll = () => {
    if (!isSelectionMode) {
      setSelectionMode(true);
    }
    selectAllPlaylists(playlists.map(p => p.id));
  };

  const handleToggleSelection = (id: string) => {
    if (!isSelectionMode) {
      setSelectionMode(true);
    }
    togglePlaylistSelection(id);
  };

  if (playlists.length === 0) {
    return <EmptyState onAddPlaylist={onAddPlaylist} />;
  }

  const selectedPlaylistObjects = playlists.filter(p =>
    selectedPlaylists.includes(p.id),
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selection Header */}
      {(isSelectionMode || selectedPlaylists.length > 0) && (
        <SelectionHeader
          selectedCount={selectedPlaylists.length}
          totalCount={playlists.length}
          onSelectAll={handleSelectAll}
          onClearSelection={clearSelection}
          onBulkAction={handleBulkAction}
          selectedPlaylists={selectedPlaylistObjects}
        />
      )}

      {/* Playlist Grid/List */}
      {viewMode === 'list' ? (
        <div className='space-y-3'>
          {playlists.map(playlist => (
            <PlaylistListItem
              key={playlist.id}
              playlist={playlist}
              isSelected={selectedPlaylists.includes(playlist.id)}
              isSelectionMode={isSelectionMode}
              onSelect={onPlaylistSelect}
              onAction={onPlaylistAction}
              onToggleSelection={handleToggleSelection}
            />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isSelected={selectedPlaylists.includes(playlist.id)}
              isSelectionMode={isSelectionMode}
              onSelect={onPlaylistSelect}
              onAction={onPlaylistAction}
              onToggleSelection={handleToggleSelection}
            />
          ))}
        </div>
      )}

      {/* Keyboard shortcuts help */}
      {isSelectionMode && (
        <div className='border-t pt-4 text-center text-xs text-muted-foreground'>
          <p>
            <kbd className='rounded bg-muted px-1 py-0.5 text-xs'>Ctrl+A</kbd>{' '}
            Select all •
            <kbd className='ml-1 rounded bg-muted px-1 py-0.5 text-xs'>Esc</kbd>{' '}
            Clear selection •
            <kbd className='ml-1 rounded bg-muted px-1 py-0.5 text-xs'>Del</kbd>{' '}
            Delete •
            <kbd className='ml-1 rounded bg-muted px-1 py-0.5 text-xs'>E</kbd>{' '}
            Edit
          </p>
        </div>
      )}
    </div>
  );
};
