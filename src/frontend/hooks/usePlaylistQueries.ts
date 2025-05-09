import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Playlist, PlaylistVideo, IpcResponse } from '../../shared/types';

// Define query keys for playlists
const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [...playlistKeys.all, 'list'] as const,
  list: (filters: string) => [...playlistKeys.lists(), { filters }] as const, // Example if filtering is added
  details: () => [...playlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...playlistKeys.details(), id] as const,
};

// Hook to fetch all playlists
export function usePlaylists() {
  return useQuery<Playlist[], Error>({
    queryKey: playlistKeys.lists(),
    queryFn: async () => {
      const response: IpcResponse<Playlist[]> = await window.electronAPI.invoke('playlist:get-all');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch playlists');
      }
      return response.data;
    },
    // Example: staleTime and gcTime can be configured here or globally
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch details for a single playlist (including its videos)
export function usePlaylistDetails(playlistId: string | null) {
  return useQuery<PlaylistVideo[], Error>({
    queryKey: playlistKeys.detail(playlistId!),
    queryFn: async () => {
      if (!playlistId) throw new Error('Playlist ID is required');
      const response: IpcResponse<PlaylistVideo[]> = await window.electronAPI.invoke('playlist:get-details', playlistId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch playlist details');
      }
      return response.data;
    },
    enabled: !!playlistId, // Only run query if playlistId is truthy
  });
}

// Hook to create a new custom playlist
interface CreatePlaylistPayload {
  name: string;
  description?: string;
}
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<Playlist, Error, CreatePlaylistPayload>({
    mutationFn: async (payload) => {
      const response: IpcResponse<Playlist> = await window.electronAPI.invoke('playlist:create', payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create playlist');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch all playlists list
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      // Potentially update Zustand store here if it's managing UI state directly not derived from queries
      // Example: playlistStore.getState().addPlaylist(newPlaylistData); 
    },
    // onError: (error) => { /* Handle error, e.g., show toast */ }
  });
}

// Hook to import a YouTube playlist
interface ImportYouTubePlaylistPayload {
  youtubeUrl: string;
}
export function useImportYouTubePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<Playlist, Error, ImportYouTubePlaylistPayload>({
    mutationFn: async (payload) => {
      const response: IpcResponse<Playlist> = await window.electronAPI.invoke('playlist:import-youtube', payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to import YouTube playlist');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      // Potentially update Zustand store here
    },
  });
}

// Future hooks for update, delete, etc. can be added here.
// Example: useUpdatePlaylist, useDeletePlaylist

// Example: Store synchronization (conceptual)
// This would typically be done within the onSuccess/onSettled callbacks of mutations,
// or via a subscription to queryCache if more complex sync logic is needed.
// For instance, if a Zustand store holds a copy of playlists for some UI reason:
// import { playlistStore } from '../store/playlistStore'; // Assuming Zustand store exists
//
// onSuccess in useCreatePlaylist:
// (newPlaylist) => {
//   queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
//   playlistStore.getState().addPlaylistToStore(newPlaylist); // Example action
// }
//
// Similarly for useImportYouTubePlaylist or when a list is fetched in usePlaylists:
// onSuccess for usePlaylists queryFn:
// (data) => {
//   playlistStore.getState().setPlaylistsInStore(data);
//   return data;
// }
// This pattern is useful if Zustand is the single source of truth for some components,
// otherwise, relying on React Query's cache and `useQuery` is often sufficient. 