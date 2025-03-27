import React, { useState, useMemo } from 'react';
import PlaylistCard from './PlaylistCard';
import PlaylistFilters, { FilterOptions } from './PlaylistFilters';
import { usePlaylists, useDeletePlaylist } from '../../../services/queryHooks';
import { Playlist } from '../../../../shared/types/appTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { SortAsc, Clock, AlignJustify, Search, AlertCircle, Music, Plus, Youtube, Trash2, Play } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Skeleton } from '../../../components/ui/skeleton';

// Sorting options for playlists
type SortOption = 'newest' | 'oldest' | 'alphabetical';

interface PlaylistListProps {
  playlists: Playlist[];
}

const PlaylistList: React.FC<PlaylistListProps> = ({ playlists = [] }) => {
  const deletePlaylistMutation = useDeletePlaylist();
  const router = useRouter();
  
  // Ensure playlists is always an array
  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  
  // State for sorting and filtering
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    sources: [],
    tags: []
  });
  
  const handleDeletePlaylist = (id: string) => {
    deletePlaylistMutation.mutate(id);
  };
  
  // Collect all available tags from playlists
  const availableTags = useMemo(() => {
    // Ensure playlistsArray is an array before processing
    if (!Array.isArray(playlistsArray) || playlistsArray.length === 0) return [];
    
    const tags = new Set<string>();
    playlistsArray.forEach(playlist => {
      if (playlist && playlist.tags) {
        playlist.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags).sort();
  }, [playlistsArray]);
  
  // Collect all available sources from playlists
  const availableSources = useMemo(() => {
    // Ensure playlistsArray is an array before processing
    if (!Array.isArray(playlistsArray) || playlistsArray.length === 0) return [];
    
    const sources = new Set<string>();
    playlistsArray.forEach(playlist => {
      if (playlist && playlist.source) {
        sources.add(playlist.source);
      }
    });
    
    return Array.from(sources);
  }, [playlistsArray]);
  
  // Apply filters to playlists
  const filteredPlaylists = useMemo(() => {
    // Ensure playlistsArray is an array before processing
    if (!Array.isArray(playlistsArray) || playlistsArray.length === 0) return [];
    
    return playlistsArray.filter(playlist => {
      if (!playlist) return false;
      
      // Apply search filter
      if (filters.search && !playlist.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          (!playlist.description || !playlist.description.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }
      
      // Apply source filter
      if (filters.sources.length > 0 && playlist.source) {
        if (!filters.sources.includes(playlist.source)) {
          return false;
        }
      }
      
      // Apply tag filter
      if (filters.tags.length > 0 && playlist.tags) {
        if (!filters.tags.some(tag => playlist.tags?.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }, [playlistsArray, filters]);
  
  // Sort filtered playlists based on selected option
  const sortedAndFilteredPlaylists = useMemo(() => {
    // Ensure filteredPlaylists is an array
    if (!filteredPlaylists || !Array.isArray(filteredPlaylists) || filteredPlaylists.length === 0) {
      return [];
    }
    
    // Create a safe copy to avoid mutating the original
    const sortedPlaylists = [...filteredPlaylists];
    
    try {
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
    } catch (error) {
      console.error('Error sorting playlists:', error);
      return [];
    }
  }, [filteredPlaylists, sortOption]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Navigate to playlist view
  const navigateToPlaylist = (playlistId: string) => {
    router.navigate({
      to: '/playlist/$playlistId',
      params: { playlistId }
    });
  };

  // Empty state
  if (playlistsArray.length === 0) {
    return (
      <div className="bg-card text-card-foreground shadow rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <Youtube className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No Playlists Yet
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Use the "Create New Playlist" form above to get started or import playlists from YouTube.
          </p>
        </div>
      </div>
    );
  }

  // Add defensive check for playlists array
  const playlistsCount = playlistsArray.length;

  // Render the playlist grid with sorting options and filters
  return (
    <>
      {/* Filters */}
      <div className="mb-6">
        <PlaylistFilters
          onFilterChange={handleFilterChange}
          availableTags={availableTags}
          availableSources={availableSources}
          totalPlaylists={playlistsCount}
        />
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center">
          <Youtube className="mr-2 h-5 w-5 text-primary" />
          {sortedAndFilteredPlaylists.length} {sortedAndFilteredPlaylists.length === 1 ? 'Playlist' : 'Playlists'}
          {sortedAndFilteredPlaylists.length !== playlistsCount && (
            <span className="text-muted-foreground text-sm ml-2">
              (filtered from {playlistsCount})
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground flex items-center">
            <SortAsc className="mr-1 h-4 w-4" />
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
              <SelectItem value="newest" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" /> Newest
              </SelectItem>
              <SelectItem value="oldest" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" /> Oldest
              </SelectItem>
              <SelectItem value="alphabetical" className="flex items-center">
                <AlignJustify className="mr-2 h-4 w-4" /> A-Z
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No results after filtering */}
      {Array.isArray(sortedAndFilteredPlaylists) && sortedAndFilteredPlaylists.length === 0 && (
        <div className="bg-card text-card-foreground shadow rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              No Matching Playlists
            </h2>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Try adjusting your filters to find what you're looking for.
            </p>
            <button
              onClick={() => setFilters({ search: '', sources: [], tags: [] })}
              className="text-primary hover:underline flex items-center"
            >
              <AlertCircle className="mr-1 h-4 w-4" />
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Playlist grid */}
      {Array.isArray(sortedAndFilteredPlaylists) && sortedAndFilteredPlaylists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredPlaylists.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold truncate">
                  {playlist.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {playlist.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{playlist.videos.length} videos</span>
                  {playlist.sourceUrl && (
                    <span className="ml-auto flex items-center">
                      <Youtube className="h-3 w-3 mr-1" />
                      YouTube
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToPlaylist(playlist.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePlaylist(playlist.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export function PlaylistSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <div className="px-6 pb-2">
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
          <CardContent className="pb-2 pt-0">
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default PlaylistList; 