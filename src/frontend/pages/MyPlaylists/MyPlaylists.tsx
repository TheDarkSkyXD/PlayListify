import React, { useState, useMemo, useEffect } from 'react';
import PlaylistGrid from '../../components/PlaylistGrid/PlaylistGrid/PlaylistGrid';
import AddNewPlaylistDialog from '../../components/Modals/AddNewPlaylistDialog/AddNewPlaylistDialog';
import { Button } from '../../components/ui/button';
import { LayoutGrid, List, Plus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import PlaylistActionsBar, { PlaylistSortOption, PlaylistFilterSource } from '../../components/PlaylistGrid/PlaylistActionsBar/PlaylistActionsBar';
import ConfirmDeleteDialog from '../../components/Modals/ConfirmDeleteDialog/ConfirmDeleteDialog';
import EditPlaylistDetailsDialog from '../../components/Modals/EditPlaylistDetailsDialog/EditPlaylistDetailsDialog';
import { useDeletePlaylist, useGetAllPlaylists, useGetPlaylistDetails } from '../../hooks/usePlaylistQueries';
import { Playlist as SharedPlaylist } from '../../../shared/types/index';
import PlaylistListView from '../../components/PlaylistListView/PlaylistListView/PlaylistListView';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/frontend/components/ui/tooltip';
import PlaylistDetailView from '../../components/PlaylistDetailView/PlaylistDetailView';
import { PlaylistVideo, Playlist } from '../../../shared/types';

const MyPlaylists: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<SharedPlaylist | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [rawSearchInput, setRawSearchInput] = useState('');

  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState<PlaylistSortOption>('date_added_newest');
  const [currentFilterSource, setCurrentFilterSource] = useState<PlaylistFilterSource>('all');

  const deletePlaylistMutation = useDeletePlaylist();
  const { data: allPlaylists, isLoading: isLoadingPlaylists, error: playlistsError } = useGetAllPlaylists();

  useEffect(() => {
    // if (allPlaylists) {
    //   console.log('MyPlaylists.tsx: allPlaylists updated', JSON.stringify(allPlaylists.map(p => ({id: p.id, name: p.name, itemCount: p.itemCount})), null, 2));
    // }
  }, [allPlaylists]);

  // --- REMOVE TEMPORARY COMMENT OUT and MOCK DATA --- 
  const {
    data: selectedPlaylistVideos,
    isLoading: isLoadingVideos,
    error: videosError,
    refetch: refetchSelectedPlaylistVideos,
  } = useGetPlaylistDetails(selectedPlaylistId);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchQuery(rawSearchInput.toLowerCase());
    }, 300);
    return () => {
      clearTimeout(timerId);
    };
  }, [rawSearchInput]);

  const handleRawSearchChange = (query: string) => {
    setRawSearchInput(query);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const handleSortChange = (sortOption: PlaylistSortOption) => {
    setCurrentSort(sortOption);
  };

  const handleFilterSourceChange = (filterSource: PlaylistFilterSource) => {
    setCurrentFilterSource(filterSource);
  };

  const handleClearFilters = () => {
    setRawSearchInput('');
    setCurrentFilterSource('all');
    setCurrentSort('date_added_newest');
  };

  const handlePlayPlaylist = (playlistId: string) => { /* console.log('Play playlist:', playlistId); */ };
  const handleRefreshPlaylist = (playlistId: string) => { /* console.log('Refresh playlist:', playlistId); */ };
  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (playlistToDelete) {
      deletePlaylistMutation.mutate(playlistToDelete, {
        onSuccess: () => {
          console.log('Playlist deleted successfully', playlistToDelete);
        },
        onError: (error: Error) => console.error('Failed to delete playlist:', error),
        onSettled: () => {
          setIsConfirmDeleteDialogOpen(false);
          setPlaylistToDelete(null);
          setSelectedPlaylistId(null);
        }
      });
    }
  };

  const handleDuplicatePlaylist = (playlistId: string) => { /* console.log('Duplicate playlist:', playlistId); */ };
  const handleDownloadPlaylist = (playlistId: string) => { /* console.log('Download playlist:', playlistId); */ };
  
  const handleEditPlaylistDetails = (playlistId: string) => {
    const foundPlaylist = allPlaylists?.find(p => p.id === playlistId);
    if (foundPlaylist) {
      setPlaylistToEdit(foundPlaylist);
      setIsEditDialogOpen(true);
    } else {
      console.error('Playlist not found for editing:', playlistId);
    }
  };
  
  const handlePlaylistClick = (playlistId: string) => {
    // console.log(`Playlist clicked, setting selectedPlaylistId: ${playlistId}`);
    setSelectedPlaylistId(playlistId);
  };

  const handleGoBackToPlaylists = () => {
    setSelectedPlaylistId(null);
  };

  const handleRefetchPlaylistAndVideos = () => {
    if (selectedPlaylistId) {
      // console.log('Refetching videos (disabled) for playlist:', selectedPlaylistId);
      refetchSelectedPlaylistVideos(); // Make sure this uses the real refetch
    }
  };

  const displayedPlaylists = useMemo(() => {
    if (!allPlaylists) return [];
    let filtered = allPlaylists;
    if (currentFilterSource !== 'all') {
      filtered = filtered.filter(p => p.source === currentFilterSource);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery) || 
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }
    switch (currentSort) {
      case 'name_asc': return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc': return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
      case 'date_added_newest': return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date_added_oldest': return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'item_count_most': return [...filtered].sort((a, b) => b.itemCount - a.itemCount);
      case 'item_count_least': return [...filtered].sort((a, b) => a.itemCount - b.itemCount);
      default: return filtered;
    }
  }, [allPlaylists, searchQuery, currentFilterSource, currentSort]);

  const handleAddNewPlaylistClick = () => {
    setIsAddDialogOpen(true);
  };

  const selectedPlaylist = useMemo(() => {
    return allPlaylists?.find(p => p.id === selectedPlaylistId);
  }, [allPlaylists, selectedPlaylistId]);

  const renderDetailView = () => {
    if (!selectedPlaylistId || !selectedPlaylist) {
      return null; 
    }

    if (isLoadingVideos) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading playlist videos...</p>
        </div>
      );
    }

    if (videosError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-xl font-semibold mb-2">Error loading videos</p>
          <p className="text-center">
            {(videosError as Error)?.message || 'An unexpected error occurred.'}
          </p>
          <Button variant="outline" onClick={handleGoBackToPlaylists} className="mt-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefetchPlaylistAndVideos} 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <PlaylistDetailView 
        playlist={selectedPlaylist}
        videos={selectedPlaylistVideos || []}
        onBack={handleGoBackToPlaylists}
        refetchPlaylist={handleRefetchPlaylistAndVideos}
      />
    );
  };

  if (isLoadingPlaylists && !selectedPlaylistId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading playlists...</p>
      </div>
    );
  }

  if (playlistsError && !selectedPlaylistId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Error loading playlists: {playlistsError.message}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
      {selectedPlaylistId ? (
        renderDetailView()
      ) : (
        <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">My Playlists</h1>
        <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
                      onClick={toggleViewMode} 
                      aria-label={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}
          >
                      {viewMode === 'grid' ? <List className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}</p>
                  </TooltipContent>
                </Tooltip>
          
                <Tooltip>
                  <TooltipTrigger asChild>
          <Button 
            variant="default" 
            onClick={handleAddNewPlaylistClick} 
            className="flex items-center ml-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Playlist
          </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new playlist or import from YouTube</p>
                  </TooltipContent>
                </Tooltip>
        </div>
      </div>

      <PlaylistActionsBar 
        searchQuery={rawSearchInput}
        onSearchChange={handleRawSearchChange}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        currentFilterSource={currentFilterSource}
        onFilterSourceChange={handleFilterSourceChange}
        onClearFilters={handleClearFilters}
      />

      <div className="flex-grow overflow-y-auto pb-4">
        {viewMode === 'grid' ? (
          <PlaylistGrid 
            playlists={displayedPlaylists}
            isLoading={isLoadingPlaylists}
            error={playlistsError?.message}
            onPlayPlaylist={handlePlayPlaylist}
            onRefreshPlaylist={handleRefreshPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDuplicatePlaylist={handleDuplicatePlaylist}
            onDownloadPlaylist={handleDownloadPlaylist}
            onEditPlaylistDetails={handleEditPlaylistDetails}
            onPlaylistClick={handlePlaylistClick}
            onAddNewPlaylistClick={handleAddNewPlaylistClick}
          />
        ) : (
          <PlaylistListView 
            playlists={displayedPlaylists}
            isLoading={isLoadingPlaylists}
            error={playlistsError?.message}
            onPlayPlaylist={handlePlayPlaylist}
            onRefreshPlaylist={handleRefreshPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDuplicatePlaylist={handleDuplicatePlaylist}
            onDownloadPlaylist={handleDownloadPlaylist}
            onEditPlaylistDetails={handleEditPlaylistDetails}
            onPlaylistClick={handlePlaylistClick}
          />
        )}
      </div>
        </>
      )}

        <AddNewPlaylistDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <ConfirmDeleteDialog 
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        title="Delete Playlist?"
        message={`Are you sure you want to delete this playlist? This action cannot be undone.`}
        onConfirm={confirmDelete}
        isDestructive
        confirmButtonText={deletePlaylistMutation.isPending ? "Deleting..." : "Delete"}
      />
        <EditPlaylistDetailsDialog 
          playlist={playlistToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
      />
    </div>
    </TooltipProvider>
  );
};

export default MyPlaylists; 