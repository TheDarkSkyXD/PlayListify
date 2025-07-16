import { Plus } from 'lucide-react';
import React from 'react';
import { PlaylistActionsBar } from '../components/features/PlaylistActionsBar';
import {
  PlaylistGrid,
  type Playlist,
} from '../components/features/PlaylistGrid';
import { Button } from '../components/ui/button';
import {
  usePlaylistFilters,
  usePlaylistSorting,
  usePlaylistUIStore,
  usePlaylistViewMode,
} from '../stores/usePlaylistUIStore';
import {
  filterAndSortPlaylists,
  getFilterSummary,
  getPaginationInfo,
  paginatePlaylists,
} from '../utils/playlist-filters';

export const Playlists: React.FC = () => {
  // Mock data for demonstration - convert to match Playlist interface
  const mockPlaylists: Playlist[] = [
    {
      id: '1',
      title: 'Coding Music',
      description: 'Focus music for programming sessions',
      type: 'custom',
      videoCount: 25,
      totalDuration: 8100, // 2h 15m in seconds
      tags: ['coding', 'focus', 'instrumental'],
      isPrivate: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
    {
      id: '2',
      title: 'Workout Hits',
      description: 'High-energy music for workouts',
      type: 'youtube',
      source: 'https://youtube.com/playlist?list=example1',
      videoCount: 18,
      totalDuration: 5520, // 1h 32m in seconds
      tags: ['workout', 'energy', 'motivation'],
      isPrivate: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
    {
      id: '3',
      title: 'Study Focus',
      description: 'Ambient and instrumental music for studying',
      type: 'custom',
      videoCount: 12,
      totalDuration: 2700, // 45m in seconds
      tags: ['study', 'ambient', 'focus'],
      isPrivate: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
    {
      id: '4',
      title: 'Chill Vibes',
      description: 'Relaxing music for downtime',
      type: 'youtube',
      source: 'https://youtube.com/playlist?list=example2',
      videoCount: 30,
      totalDuration: 12000, // 3h 20m in seconds
      tags: ['chill', 'relax', 'ambient'],
      isPrivate: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
  ];

  // Get state from stores
  const filters = usePlaylistFilters();
  const { sortBy, sortOrder } = usePlaylistSorting();
  const viewMode = usePlaylistViewMode();
  const { currentPage, itemsPerPage, setCurrentPage } = usePlaylistUIStore();

  // Apply filtering and sorting
  const filteredAndSortedPlaylists = React.useMemo(() => {
    return filterAndSortPlaylists(mockPlaylists, filters, sortBy, sortOrder);
  }, [mockPlaylists, filters, sortBy, sortOrder]);

  // Apply pagination
  const paginatedPlaylists = React.useMemo(() => {
    return paginatePlaylists(
      filteredAndSortedPlaylists,
      currentPage,
      itemsPerPage,
    );
  }, [filteredAndSortedPlaylists, currentPage, itemsPerPage]);

  // Get pagination info
  const paginationInfo = React.useMemo(() => {
    return getPaginationInfo(
      filteredAndSortedPlaylists.length,
      currentPage,
      itemsPerPage,
    );
  }, [filteredAndSortedPlaylists.length, currentPage, itemsPerPage]);

  // Get filter summary
  const filterSummary = React.useMemo(() => {
    return getFilterSummary(
      filters,
      mockPlaylists.length,
      filteredAndSortedPlaylists.length,
    );
  }, [filters, mockPlaylists.length, filteredAndSortedPlaylists.length]);

  // Handlers
  const handlePlaylistSelect = (id: string) => {
    console.log('Selected playlist:', id);
    // TODO: Navigate to playlist detail view
  };

  const handlePlaylistAction = (action: string, id: string) => {
    console.log('Playlist action:', action, 'for playlist:', id);

    // Handle different playlist actions
    switch (action) {
      case 'play':
        console.log('Playing playlist:', id);
        // TODO: Implement play functionality
        break;
      case 'edit':
        console.log('Editing playlist:', id);
        // TODO: Open edit dialog
        break;
      case 'duplicate':
        console.log('Duplicating playlist:', id);
        // TODO: Implement duplicate functionality
        break;
      case 'delete':
        console.log('Deleting playlist:', id);
        // TODO: Show confirmation dialog and delete
        break;
      case 'download':
        console.log('Downloading playlist:', id);
        // TODO: Implement download functionality
        break;
      case 'share':
        console.log('Sharing playlist:', id);
        // TODO: Implement share functionality
        break;
      case 'toggle-privacy':
        console.log('Toggling privacy for playlist:', id);
        // TODO: Implement privacy toggle
        break;
      case 'toggle-favorite':
        console.log('Toggling favorite for playlist:', id);
        // TODO: Implement favorite toggle
        break;
      case 'open-source':
        const playlist = mockPlaylists.find(p => p.id === id);
        if (playlist?.source) {
          window.open(playlist.source, '_blank');
        }
        break;
      default:
        console.log('Unknown action:', action, 'for playlist:', id);
    }
  };

  const handleAddPlaylist = () => {
    console.log('Add playlist clicked');
    // TODO: Open add playlist dialog
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Playlists</h1>
          <p className='mt-2 text-muted-foreground'>
            Manage your YouTube playlists and downloads
          </p>
        </div>
        <Button onClick={handleAddPlaylist}>
          <Plus className='mr-2 h-4 w-4' />
          Create Playlist
        </Button>
      </div>

      {/* Actions Bar with Search and Filters */}
      <PlaylistActionsBar onAddPlaylist={handleAddPlaylist} />

      {/* Filter Summary */}
      {filteredAndSortedPlaylists.length !== mockPlaylists.length && (
        <div className='text-sm text-muted-foreground'>{filterSummary}</div>
      )}

      {/* Playlists Grid */}
      <PlaylistGrid
        playlists={paginatedPlaylists}
        viewMode={viewMode}
        onPlaylistSelect={handlePlaylistSelect}
        onPlaylistAction={handlePlaylistAction}
        onAddPlaylist={handleAddPlaylist}
      />

      {/* Pagination */}
      {filteredAndSortedPlaylists.length > itemsPerPage && (
        <div className='flex items-center justify-center space-x-2 pt-6'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!paginationInfo.hasPreviousPage}
          >
            Previous
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {currentPage} of {paginationInfo.totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!paginationInfo.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
