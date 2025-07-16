// src/frontend/hooks/useSongQueries.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ipcClient } from '../lib/ipc-client';
import { invalidationHelpers, songKeys } from '../lib/query-keys';

// Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface SongWithPlaylistInfo extends Song {
  position: number;
  added_at: string;
}

export interface CreateSongData {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface UpdateSongData {
  id: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface SongSearchFilters {
  search?: string;
  artist?: string;
  album?: string;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'title' | 'artist' | 'album' | 'duration' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Individual song query hook
export const useSong = (
  id: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<Song>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: songKeys.detail(id),
    queryFn: async () => {
      return await ipcClient.getSong(id);
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (songs don't change often)
    ...queryOptions,
  });
};

// Song list query hook
export const useSongList = (
  filters?: SongSearchFilters,
  options?: Omit<UseQueryOptions<Song[]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: songKeys.list(filters),
    queryFn: async () => {
      return await ipcClient.getAllSongs();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Song search query hook
export const useSongSearch = (
  query: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<Song[]>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: songKeys.search(query),
    queryFn: async () => {
      return await ipcClient.searchSongs(query);
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
};

// Song mutations hook
export const useSongMutations = () => {
  const queryClient = useQueryClient();

  // Create song mutation
  const createSong = useMutation({
    mutationFn: async (data: CreateSongData) => {
      return await ipcClient.createSong(data);
    },
    onSuccess: newSong => {
      // Invalidate and refetch song lists
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.songs.lists(),
      });

      // Add the new song to the cache
      queryClient.setQueryData(songKeys.detail(newSong.id), newSong);

      toast.success(`Song "${newSong.title}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to create song');
    },
  });

  // Update song mutation
  const updateSong = useMutation({
    mutationFn: async (data: UpdateSongData) => {
      return await ipcClient.updateSong(data);
    },
    onSuccess: (updatedSong, variables) => {
      // Update the specific song in cache
      queryClient.setQueryData(songKeys.detail(variables.id), updatedSong);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.songs.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.songs.search(),
      });

      toast.success(`Song "${updatedSong.title}" updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to update song');
    },
  });

  // Delete song mutation
  const deleteSong = useMutation({
    mutationFn: async (id: string) => {
      await ipcClient.deleteSong(id);
      return id;
    },
    onSuccess: deletedId => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: songKeys.detail(deletedId) });

      // Invalidate lists and searches
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.songs.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.songs.search(),
      });

      // Also invalidate any playlist queries that might contain this song
      queryClient.invalidateQueries({ queryKey: ['playlists'] });

      toast.success('Song deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to delete song');
    },
  });

  return {
    createSong,
    updateSong,
    deleteSong,
  };
};

// Optimistic updates helper for songs
export const useOptimisticSongUpdates = () => {
  const queryClient = useQueryClient();

  const optimisticallyUpdateSong = (songId: string, updates: Partial<Song>) => {
    // Get current data
    const currentData = queryClient.getQueryData<Song>(songKeys.detail(songId));

    if (currentData) {
      // Optimistically update
      queryClient.setQueryData(songKeys.detail(songId), {
        ...currentData,
        ...updates,
      });
    }

    // Return rollback function
    return () => {
      if (currentData) {
        queryClient.setQueryData(songKeys.detail(songId), currentData);
      }
    };
  };

  const optimisticallyAddToSongList = (newSong: Song) => {
    // Get current list data
    const currentLists = queryClient.getQueriesData<Song[]>({
      queryKey: songKeys.lists(),
    });

    // Add to all matching lists
    currentLists.forEach(([queryKey, data]) => {
      if (data) {
        queryClient.setQueryData(queryKey, [newSong, ...data]);
      }
    });

    // Return rollback function
    return () => {
      currentLists.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data);
        }
      });
    };
  };

  const optimisticallyRemoveFromSongList = (songId: string) => {
    // Get current list data
    const currentLists = queryClient.getQueriesData<Song[]>({
      queryKey: songKeys.lists(),
    });

    // Remove from all matching lists
    currentLists.forEach(([queryKey, data]) => {
      if (data) {
        queryClient.setQueryData(
          queryKey,
          data.filter(song => song.id !== songId),
        );
      }
    });

    // Return rollback function
    return () => {
      currentLists.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data);
        }
      });
    };
  };

  return {
    optimisticallyUpdateSong,
    optimisticallyAddToSongList,
    optimisticallyRemoveFromSongList,
  };
};

// Prefetch helpers for songs
export const useSongPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchSong = (id: string) => {
    return queryClient.prefetchQuery({
      queryKey: songKeys.detail(id),
      queryFn: async () => {
        return await ipcClient.getSong(id);
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchSongList = (filters?: SongSearchFilters) => {
    return queryClient.prefetchQuery({
      queryKey: songKeys.list(filters),
      queryFn: async () => {
        return await ipcClient.getAllSongs();
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchSongSearch = (query: string) => {
    if (!query || query.trim().length === 0) return;

    return queryClient.prefetchQuery({
      queryKey: songKeys.search(query),
      queryFn: async () => {
        return await ipcClient.searchSongs(query);
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchSong,
    prefetchSongList,
    prefetchSongSearch,
  };
};

// Cache utilities for songs
export const useSongCache = () => {
  const queryClient = useQueryClient();

  const getSongFromCache = (id: string): Song | undefined => {
    return queryClient.getQueryData<Song>(songKeys.detail(id));
  };

  const setSongInCache = (song: Song) => {
    queryClient.setQueryData(songKeys.detail(song.id), song);
  };

  const removeSongFromCache = (id: string) => {
    queryClient.removeQueries({ queryKey: songKeys.detail(id) });
  };

  const invalidateSongQueries = (id?: string) => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: songKeys.detail(id) });
    } else {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    }
  };

  const getSongListFromCache = (
    filters?: SongSearchFilters,
  ): Song[] | undefined => {
    return queryClient.getQueryData<Song[]>(songKeys.list(filters));
  };

  const setSongListInCache = (songs: Song[], filters?: SongSearchFilters) => {
    queryClient.setQueryData(songKeys.list(filters), songs);
  };

  return {
    getSongFromCache,
    setSongInCache,
    removeSongFromCache,
    invalidateSongQueries,
    getSongListFromCache,
    setSongListInCache,
  };
};

// Bulk operations hook
export const useBulkSongOperations = () => {
  const queryClient = useQueryClient();

  const bulkDeleteSongs = useMutation({
    mutationFn: async (songIds: string[]) => {
      // Delete songs one by one (could be optimized with a bulk API)
      const results = await Promise.allSettled(
        songIds.map(id => ipcClient.deleteSong(id)),
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: songIds.length };
    },
    onSuccess: result => {
      // Invalidate all song-related queries
      queryClient.invalidateQueries({ queryKey: songKeys.all });
      queryClient.invalidateQueries({ queryKey: ['playlists'] }); // Songs might be in playlists

      if (result.failed > 0) {
        toast.error(
          `${result.successful} songs deleted, ${result.failed} failed`,
        );
      } else {
        toast.success(`${result.successful} songs deleted successfully`);
      }
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to delete songs');
    },
  });

  const bulkUpdateSongs = useMutation({
    mutationFn: async (
      updates: Array<{ id: string; data: Partial<UpdateSongData> }>,
    ) => {
      // Update songs one by one (could be optimized with a bulk API)
      const results = await Promise.allSettled(
        updates.map(({ id, data }) => ipcClient.updateSong({ id, ...data })),
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: updates.length };
    },
    onSuccess: result => {
      // Invalidate all song-related queries
      queryClient.invalidateQueries({ queryKey: songKeys.all });

      if (result.failed > 0) {
        toast.error(
          `${result.successful} songs updated, ${result.failed} failed`,
        );
      } else {
        toast.success(`${result.successful} songs updated successfully`);
      }
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to update songs');
    },
  });

  return {
    bulkDeleteSongs,
    bulkUpdateSongs,
  };
};

// Song analytics hook
export const useSongAnalytics = () => {
  const { data: songs } = useSongList();

  const analytics = React.useMemo(() => {
    if (!songs) return null;

    const totalSongs = songs.length;
    const totalDuration = songs.reduce(
      (sum, song) => sum + (song.duration || 0),
      0,
    );
    const averageDuration = totalSongs > 0 ? totalDuration / totalSongs : 0;

    // Group by artist
    const artistCounts = songs.reduce(
      (acc, song) => {
        acc[song.artist] = (acc[song.artist] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by album
    const albumCounts = songs.reduce(
      (acc, song) => {
        if (song.album) {
          acc[song.album] = (acc[song.album] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Top artists
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([artist, count]) => ({ artist, count }));

    // Top albums
    const topAlbums = Object.entries(albumCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([album, count]) => ({ album, count }));

    return {
      totalSongs,
      totalDuration,
      averageDuration,
      uniqueArtists: Object.keys(artistCounts).length,
      uniqueAlbums: Object.keys(albumCounts).length,
      topArtists,
      topAlbums,
    };
  }, [songs]);

  return analytics;
};
