import React, { useState } from 'react';
import PlaylistCard from './PlaylistCard';
import { usePlaylists, useDeletePlaylist } from '../../../services/queryHooks';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { Playlist } from '../../../../shared/types/appTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
} from '../../../components/ui/dialog';

// Sorting options for playlists
type SortOption = 'newest' | 'oldest' | 'alphabetical';

const PlaylistList: React.FC = () => {
  const playlistsQuery = usePlaylists();
  const deletePlaylistMutation = useDeletePlaylist();
  
  // State for deletion confirmation
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // State for sorting
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  const handleDeletePlaylist = (id: string) => {
    setPlaylistToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (playlistToDelete) {
      deletePlaylistMutation.mutate(playlistToDelete);
      setIsDeleteModalOpen(false);
      setPlaylistToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPlaylistToDelete(null);
  };
  
  // Sort playlists based on selected option
  const sortPlaylists = (playlists: Playlist[]): Playlist[] => {
    if (!playlists) return [];
    
    const sortedPlaylists = [...playlists];
    
    switch (sortOption) {
      case 'newest':
        return sortedPlaylists.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case 'oldest':
        return sortedPlaylists.sort((a, b) => 
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case 'alphabetical':
        return sortedPlaylists.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sortedPlaylists;
    }
  };

  // Loading state
  if (playlistsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-md h-64 animate-pulse">
            <div className="bg-muted h-36"></div>
            <div className="p-4">
              <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (playlistsQuery.isError) {
    return (
      <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> Failed to load playlists.</span>
      </div>
    );
  }

  // Empty state
  if (playlistsQuery.data?.length === 0) {
    return (
      <div className="bg-card text-card-foreground shadow rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <svg 
            className="w-16 h-16 text-muted-foreground mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">
            No Playlists Yet
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first playlist or import from YouTube to get started.
          </p>
        </div>
      </div>
    );
  }

  const sortedPlaylists = sortPlaylists(playlistsQuery.data || []);

  // Render the playlist grid with sorting options
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">
          {sortedPlaylists.length} {sortedPlaylists.length === 1 ? 'Playlist' : 'Playlists'}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Sort by:
          </span>
          <Select 
            value={sortOption} 
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlaylists.map((playlist) => (
          <PlaylistCard 
            key={playlist.id} 
            playlist={playlist} 
            onDelete={handleDeletePlaylist}
          />
        ))}
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <ConfirmationModal
            title="Delete Playlist"
            message="Are you sure you want to delete this playlist? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            confirmAction={confirmDelete}
            cancelAction={cancelDelete}
            isDestructive={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaylistList; 