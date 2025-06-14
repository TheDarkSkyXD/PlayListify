// src/frontend/hooks/usePlaylistQueries.ts
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import type {
  Playlist,
  Video,
  IpcResponse,
  MutationResponse,
  PlaylistsApiResponse, // Assuming this is what getAll might return
  PlaylistApiResponse,  // Assuming this is what getById might return
  QueryParams,
  PlaylistCreateInput, // Added import
  PlaylistUpdateInput, // Added import
} from '../../shared/types';

// --- Query Keys ---
// It's good practice to manage query keys in a structured way.
export const playlistKeys = {
  all: ['playlists'] as const,
  lists: (params?: QueryParams) => [...playlistKeys.all, 'list', params ?? {}] as const,
  details: () => [...playlistKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...playlistKeys.details(), id] as const,
};

// --- Hooks ---
// Directly use window.api, which will be mocked by Jest in tests.
/**
 * Fetches a list of all playlists.
 */
export function useGetPlaylists(params?: QueryParams) {
  return useQuery<PlaylistsApiResponse, Error>({
    queryKey: playlistKeys.lists(params), // Added queryKey
    queryFn: async () => {
          const response = await window.api.getAllPlaylists(params);
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to fetch playlists');
          }
          return response.data;
        },
    // Add other React Query options as needed, e.g., staleTime, refetchOnWindowFocus
  });
}

/**
 * Fetches a single playlist by its ID.
 */
export function useGetPlaylistById(playlistId: string | undefined) {
  return useQuery<PlaylistApiResponse, Error>({
    queryKey: playlistKeys.detail(playlistId), // Added queryKey
    queryFn: async () => {
          if (!playlistId) throw new Error('Playlist ID is required');
          const response = await window.api.getPlaylistById(playlistId);
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || `Failed to fetch playlist ${playlistId}`);
          }
          return response.data;
        },
    enabled: !!playlistId, // Only run query if playlistId is provided
  });
}

/**
 * Mutation hook for creating a new playlist.
 */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
    return useMutation<
      Playlist, // TData: Expected data from the mutation function on success
      Error,    // TError
      PlaylistCreateInput // TVariables: Input to the mutationFn
    >({
      mutationFn: async (newPlaylistData) => {
        const response = await window.api.createPlaylist(newPlaylistData);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to create playlist');
        }
        return response.data;
      },
      onSuccess: async (data) => { // Add async here
        await queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
        queryClient.setQueryData(playlistKeys.detail(data.id), data);
      },
    });
} // Closing brace for useCreatePlaylist

/**
 * Mutation hook for updating an existing playlist.
 */
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<
        Playlist, // TData
        Error,    // TError
        { id: string; data: PlaylistUpdateInput } // TVariables
      >({
        mutationFn: async ({ id, data }) => {
          const response = await window.api.updatePlaylist(id, data);
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || `Failed to update playlist ${id}`);
          }
          return response.data;
        },
        onSuccess: async (data, variables) => { // Add async here
          await queryClient.invalidateQueries({ queryKey: playlistKeys.lists() }); // Restore list invalidation
          await queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.id) });
          // queryClient.setQueryData(playlistKeys.detail(variables.id), data); // Temporarily remove for testing
        },
      });
} // Closing brace for useUpdatePlaylist

/**
 * Mutation hook for deleting a playlist.
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient(); // Added queryClient initialization
    return useMutation<
      { id: string; success: boolean }, // TData
      Error,                          // TError
      string                          // TVariables (playlistId)
    >({
      mutationFn: async (playlistId: string) => {
        const response = await window.api.deletePlaylist(playlistId); // This returns IpcResponse<boolean>
        if (!response.success) { // Check IPC success first
          throw new Error(response.error?.message || `Failed to delete playlist ${playlistId}`);
        }
        // response.data is boolean (operation success)
        return { id: playlistId, success: response.data ?? false };
      },
      onSuccess: (data, playlistId) => { // data here is { id: string; success: boolean }
        if (data.success) {
          queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
          queryClient.removeQueries({ queryKey: playlistKeys.detail(playlistId) });
        }
        // Optionally handle data.success === false (e.g. backend reported delete failed but IPC was ok)
      },
    });
} // Added missing closing brace for the file