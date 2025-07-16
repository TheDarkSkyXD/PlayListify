// src/frontend/hooks/usePlaylistQueries.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ipcClient } from '../lib/ipc-client';
import { invalidationHelpers, playlistKeys } from '../lib/query-keys';

// Types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithStats extends Playlist {
  video_count: number;
  total_duration: number;
}

export interface PlaylistWithMetadata extends Playlist {
  metadata: {
    tags: string[];
    isPrivate: boolean;
    createdBy?: string;
    lastModified: string;
    statistics: {
      totalDuration: number;
      songCount: number;
      averageSongDuration: number;
      mostRecentlyAdded?: string;
    };
  };
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface UpdatePlaylistData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface PlaylistSearchFilters {
  search?: string;
  tags?: string[];
  isPrivate?: boolean;
  minSongCount?: number;
  maxSongCount?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'song_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Individual playlist query hook
export const usePlaylist = (
  id: string,
  options?: {
    includeMetadata?: boolean;
    enabled?: boolean;
  } & Omit<
    UseQueryOptions<Playlist | PlaylistWithMetadata>,
    'queryKey' | 'queryFn'
  >,
) => {
  const {
    includeMetadata = false,
    enabled = true,
    ...queryOptions
  } = options || {};

  return useQuery({
    queryKey: playlistKeys.detail(id, { includeMetadata }),
    queryFn: async () => {
      if (includeMetadata) {
        return await ipcClient.getPlaylistWithMetadata(id);
      } else {
        return await ipcClient.getPlaylist(id, false);
      }
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
};

// Playlist list query hook
export const usePlaylistList = (
  filters?: PlaylistSearchFilters,
  options?: Omit<UseQueryOptions<PlaylistWithStats[]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: playlistKeys.list(filters),
    queryFn: async () => {
      if (filters?.search) {
        return await ipcClient.searchPlaylists(
          filters.search,
          filters.tags,
          filters.isPrivate,
        );
      } else {
        return await ipcClient.getAllPlaylists();
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Advanced playlist search hook
export const usePlaylistSearch = (
  criteria: any,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<PlaylistWithMetadata[]>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: playlistKeys.advancedSearch(criteria),
    queryFn: async () => {
      return await ipcClient.searchPlaylistsAdvanced(criteria);
    },
    enabled: enabled && !!criteria,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...queryOptions,
  });
};

// Playlist songs query hook
export const usePlaylistSongs = (
  playlistId: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: playlistKeys.songs(playlistId),
    queryFn: async () => {
      return await ipcClient.getPlaylistSongs(playlistId);
    },
    enabled: enabled && !!playlistId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...queryOptions,
  });
};

// Playlist statistics query hook
export const usePlaylistStats = (
  playlistId: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: playlistKeys.stats(playlistId),
    queryFn: async () => {
      return await ipcClient.getPlaylistStats(playlistId);
    },
    enabled: enabled && !!playlistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
};

// Playlist integrity validation hook
export const usePlaylistIntegrity = (
  playlistId: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = false, ...queryOptions } = options || {}; // Disabled by default

  return useQuery({
    queryKey: playlistKeys.integrity(playlistId),
    queryFn: async () => {
      return await ipcClient.validatePlaylistIntegrity(playlistId);
    },
    enabled: enabled && !!playlistId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...queryOptions,
  });
};

// All tags query hook
export const useAllTags = (
  options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: playlistKeys.tags(),
    queryFn: async () => {
      return await ipcClient.getAllTags();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Playlist mutations hook
export const usePlaylistMutations = () => {
  const queryClient = useQueryClient();

  // Create playlist mutation
  const createPlaylist = useMutation({
    mutationFn: async (data: CreatePlaylistData) => {
      return await ipcClient.createPlaylist(data);
    },
    onSuccess: newPlaylist => {
      // Invalidate and refetch playlist lists
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.playlists.lists(),
      });
      queryClient.invalidateQueries({ queryKey: playlistKeys.tags() });

      // Add the new playlist to the cache
      queryClient.setQueryData(
        playlistKeys.detail(newPlaylist.id),
        newPlaylist,
      );

      toast.success(`Playlist "${newPlaylist.name}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to create playlist');
    },
  });

  // Update playlist mutation
  const updatePlaylist = useMutation({
    mutationFn: async (data: UpdatePlaylistData) => {
      return await ipcClient.updatePlaylist(data);
    },
    onSuccess: (updatedPlaylist, variables) => {
      // Update the specific playlist in cache
      queryClient.setQueryData(
        playlistKeys.detail(variables.id),
        updatedPlaylist,
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.playlists.lists(),
      });
      queryClient.invalidateQueries({ queryKey: playlistKeys.tags() });

      toast.success(`Playlist "${updatedPlaylist.name}" updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to update playlist');
    },
  });

  // Delete playlist mutation
  const deletePlaylist = useMutation({
    mutationFn: async (id: string) => {
      await ipcClient.deletePlaylist(id);
      return id;
    },
    onSuccess: deletedId => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: playlistKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: playlistKeys.songs(deletedId) });
      queryClient.removeQueries({ queryKey: playlistKeys.stats(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.playlists.lists(),
      });

      toast.success('Playlist deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to delete playlist');
    },
  });

  // Duplicate playlist mutation
  const duplicatePlaylist = useMutation({
    mutationFn: async (data: {
      sourceId: string;
      newName?: string;
      includeSongs?: boolean;
      includeMetadata?: boolean;
    }) => {
      return await ipcClient.duplicatePlaylist(data);
    },
    onSuccess: newPlaylist => {
      // Invalidate lists to show the new playlist
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.playlists.lists(),
      });

      // Add the new playlist to cache
      queryClient.setQueryData(
        playlistKeys.detail(newPlaylist.id),
        newPlaylist,
      );

      toast.success(`Playlist duplicated as "${newPlaylist.name}"`);
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to duplicate playlist');
    },
  });

  return {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
  };
};

// Playlist song mutations hook
export const usePlaylistSongMutations = (playlistId: string) => {
  const queryClient = useQueryClient();

  // Add song to playlist mutation
  const addSongToPlaylist = useMutation({
    mutationFn: async (data: { songId: string; position?: number }) => {
      return await ipcClient.addSongToPlaylist({
        playlistId,
        songId: data.songId,
        position: data.position,
      });
    },
    onSuccess: () => {
      // Invalidate playlist songs and stats
      queryClient.invalidateQueries({
        queryKey: playlistKeys.songs(playlistId),
      });
      queryClient.invalidateQueries({
        queryKey: playlistKeys.stats(playlistId),
      });
      queryClient.invalidateQueries({
        queryKey: playlistKeys.detail(playlistId),
      });

      toast.success('Song added to playlist');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to add song to playlist');
    },
  });

  // Remove song from playlist mutation
  const removeSongFromPlaylist = useMutation({
    mutationFn: async (songId: string) => {
      return await ipcClient.removeSongFromPlaylist(playlistId, songId);
    },
    onSuccess: () => {
      // Invalidate playlist songs and stats
      queryClient.invalidateQueries({
        queryKey: playlistKeys.songs(playlistId),
      });
      queryClient.invalidateQueries({
        queryKey: playlistKeys.stats(playlistId),
      });
      queryClient.invalidateQueries({
        queryKey: playlistKeys.detail(playlistId),
      });

      toast.success('Song removed from playlist');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to remove song from playlist');
    },
  });

  // Reorder song in playlist mutation
  const reorderSongInPlaylist = useMutation({
    mutationFn: async (data: { songId: string; newPosition: number }) => {
      return await ipcClient.reorderSongInPlaylist({
        playlistId,
        songId: data.songId,
        newPosition: data.newPosition,
      });
    },
    onSuccess: () => {
      // Invalidate playlist songs to reflect new order
      queryClient.invalidateQueries({
        queryKey: playlistKeys.songs(playlistId),
      });

      toast.success('Song reordered successfully');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to reorder song');
    },
  });

  return {
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderSongInPlaylist,
  };
};

// Optimistic updates helper
export const useOptimisticPlaylistUpdates = () => {
  const queryClient = useQueryClient();

  const optimisticallyUpdatePlaylist = (
    playlistId: string,
    updates: Partial<Playlist>,
  ) => {
    // Get current data
    const currentData = queryClient.getQueryData<Playlist>(
      playlistKeys.detail(playlistId),
    );

    if (currentData) {
      // Optimistically update
      queryClient.setQueryData(playlistKeys.detail(playlistId), {
        ...currentData,
        ...updates,
      });
    }

    // Return rollback function
    return () => {
      if (currentData) {
        queryClient.setQueryData(playlistKeys.detail(playlistId), currentData);
      }
    };
  };

  const optimisticallyAddToPlaylistList = (newPlaylist: Playlist) => {
    // Get current list data
    const currentLists = queryClient.getQueriesData<PlaylistWithStats[]>({
      queryKey: playlistKeys.lists(),
    });

    // Add to all matching lists
    currentLists.forEach(([queryKey, data]) => {
      if (data) {
        queryClient.setQueryData(queryKey, [newPlaylist, ...data]);
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

  const optimisticallyRemoveFromPlaylistList = (playlistId: string) => {
    // Get current list data
    const currentLists = queryClient.getQueriesData<PlaylistWithStats[]>({
      queryKey: playlistKeys.lists(),
    });

    // Remove from all matching lists
    currentLists.forEach(([queryKey, data]) => {
      if (data) {
        queryClient.setQueryData(
          queryKey,
          data.filter(playlist => playlist.id !== playlistId),
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
    optimisticallyUpdatePlaylist,
    optimisticallyAddToPlaylistList,
    optimisticallyRemoveFromPlaylistList,
  };
};

// Prefetch helpers
export const usePlaylistPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchPlaylist = (id: string, includeMetadata: boolean = false) => {
    return queryClient.prefetchQuery({
      queryKey: playlistKeys.detail(id, { includeMetadata }),
      queryFn: async () => {
        if (includeMetadata) {
          return await ipcClient.getPlaylistWithMetadata(id);
        } else {
          return await ipcClient.getPlaylist(id, false);
        }
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchPlaylistSongs = (playlistId: string) => {
    return queryClient.prefetchQuery({
      queryKey: playlistKeys.songs(playlistId),
      queryFn: async () => {
        return await ipcClient.getPlaylistSongs(playlistId);
      },
      staleTime: 3 * 60 * 1000,
    });
  };

  const prefetchPlaylistList = (filters?: PlaylistSearchFilters) => {
    return queryClient.prefetchQuery({
      queryKey: playlistKeys.list(filters),
      queryFn: async () => {
        if (filters?.search) {
          return await ipcClient.searchPlaylists(
            filters.search,
            filters.tags,
            filters.isPrivate,
          );
        } else {
          return await ipcClient.getAllPlaylists();
        }
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchPlaylist,
    prefetchPlaylistSongs,
    prefetchPlaylistList,
  };
};

// Cache utilities
export const usePlaylistCache = () => {
  const queryClient = useQueryClient();

  const getPlaylistFromCache = (id: string): Playlist | undefined => {
    return queryClient.getQueryData<Playlist>(playlistKeys.detail(id));
  };

  const setPlaylistInCache = (playlist: Playlist) => {
    queryClient.setQueryData(playlistKeys.detail(playlist.id), playlist);
  };

  const removePlaylistFromCache = (id: string) => {
    queryClient.removeQueries({ queryKey: playlistKeys.detail(id) });
    queryClient.removeQueries({ queryKey: playlistKeys.songs(id) });
    queryClient.removeQueries({ queryKey: playlistKeys.stats(id) });
  };

  const invalidatePlaylistQueries = (id?: string) => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.songs(id) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.stats(id) });
    } else {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    }
  };

  return {
    getPlaylistFromCache,
    setPlaylistInCache,
    removePlaylistFromCache,
    invalidatePlaylistQueries,
  };
};
