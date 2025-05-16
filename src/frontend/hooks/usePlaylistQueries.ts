import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { IpcResponse, Playlist, PlaylistVideo, CreatePlaylistPayload, ImportYouTubePlaylistPayload, UpdatePlaylistPayload, Video, AddVideoToCustomPlaylistPayload } from '@shared/types';

// Define query keys for playlists
export const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [ ...playlistKeys.all, 'list'] as const,
  list: (filters: string) => [...playlistKeys.lists(), { filters }] as const,
  details: () => [...playlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...playlistKeys.details(), id] as const,
};

// Hook to fetch all playlists
export function useGetAllPlaylists() {
  return useQuery<Playlist[], Error>({
    queryKey: playlistKeys.lists(),
    queryFn: async () => {
      const response: IpcResponse<Playlist[]> = await window.electronAPI.playlists.getAll();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch playlists');
      }
      return response.data;
    },
  });
}

// Hook to fetch details for a single playlist (including its videos)
export function useGetPlaylistDetails(playlistId: string | null | undefined) {
  return useQuery<PlaylistVideo[], Error>({
    queryKey: playlistKeys.detail(playlistId!),
    queryFn: async () => {
      if (!playlistId) throw new Error('Playlist ID is required');
      console.log(`[useGetPlaylistDetails] Fetching videos for playlistId: ${playlistId}`);
      const response: IpcResponse<PlaylistVideo[]> = await window.electronAPI.playlists.getVideos(playlistId);
      console.log(`[useGetPlaylistDetails] Received response for ${playlistId}:`, response);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch playlist details');
      }
      return response.data;
    },
    enabled: !!playlistId, // Only run query if playlistId is truthy
  });
}

// Hook to create a new playlist
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<Playlist, Error, CreatePlaylistPayload>({
    mutationFn: async (payload) => {
      const apiPayload = {
        ...payload,
        source: 'custom' as const, // Set source for custom playlist
        youtubePlaylistId: undefined,   // Changed from null to undefined
      };
      const response: IpcResponse<{ playlistId: string }> = await window.electronAPI.playlists.create(apiPayload);
      if (!response.success || !response.data?.playlistId) {
        throw new Error(response.error || 'Failed to create playlist');
      }
      const createdPlaylist = await window.electronAPI.playlists.getById(response.data.playlistId);
      if(!createdPlaylist.success || !createdPlaylist.data) {
        throw new Error(createdPlaylist.error || 'Failed to fetch created playlist after creation');
      }
      return createdPlaylist.data;
    },
    onSuccess: (newPlaylist) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      // Optionally, update cache directly with newPlaylist
      // queryClient.setQueryData(playlistKeys.lists(), (oldData: Playlist[] | undefined) => 
      //   oldData ? [...oldData, newPlaylist] : [newPlaylist]
      // );
    },
  });
}

// Hook to import a YouTube playlist
export function useImportYouTubePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, ImportYouTubePlaylistPayload>({
    mutationFn: async (payload) => {
      // The actual payload for importFromUrl is just the URL string.
      // The backend handler for 'playlist:import-from-url' will derive name, description, source, etc.
      const response: IpcResponse<Playlist | null> = await window.electronAPI.playlists.importFromUrl(payload.youtubePlaylistUrl);
      if (!response.success || !response.data?.id) {
        throw new Error(response.error || 'Failed to import YouTube playlist');
      }
      return response.data.id;
    },
    onSuccess: (data, variables) => {
      // Invalidate first
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      // Then explicitly trigger a refetch for the list query
      queryClient.refetchQueries({ queryKey: playlistKeys.lists() });
      console.log('Import success: Invalidated and triggered refetch for playlists list.');
    },
  });
}

// Hook to update playlist details
export function useUpdatePlaylistDetails() {
  const queryClient = useQueryClient();
  return useMutation<Playlist, Error, UpdatePlaylistPayload>({
    mutationFn: async (payload) => {
      const response: IpcResponse<Playlist | null> = await window.electronAPI.playlists.updateDetails(payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update playlist details');
      }
      return response.data;
    },
    onSuccess: (updatedPlaylist, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      queryClient.setQueryData(playlistKeys.detail(updatedPlaylist.id), updatedPlaylist);
      console.log(`Playlist ${updatedPlaylist.id} details updated, queries invalidated/updated.`);
    },
    onError: (error, variables) => {
      console.error(`Error updating playlist ${variables.id}:`, error);
    },
  });
}

// Hook to delete a playlist
export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (playlistId: string) => {
      const response: IpcResponse<void> = await window.electronAPI.playlists.delete(playlistId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete playlist');
      }
      // No specific data to return on successful deletion, but an error is thrown on failure.
    },
    onSuccess: (_, playlistId) => { // playlistId is the second arg passed to onSuccess by react-query from mutate call
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      // If you want to remove it from a specific detail view if it's cached:
      queryClient.removeQueries({ queryKey: playlistKeys.detail(playlistId) });
      console.log(`Playlist ${playlistId} deletion confirmed, queries invalidated.`);
    },
    onError: (error, playlistId) => {
      console.error(`Error deleting playlist ${playlistId}:`, error);
      // Optionally, handle specific error types or show notifications
    },
  });
}

// New Hook: Add Video to Custom Playlist by URL
export function useAddVideoToCustomPlaylist() {
  const queryClient = useQueryClient();
  return useMutation<IpcResponse<Video | null>, Error, AddVideoToCustomPlaylistPayload>({ // Specify return type from IPC
    mutationFn: async (payload) => {
      console.log('[useAddVideoToCustomPlaylist] mutationFn started with payload:', payload);
      const response = await window.electronAPI.playlists.addVideoToCustomByUrl(payload);
      if (!response.success) {
        console.error('[useAddVideoToCustomPlaylist] mutationFn failed:', response.error);
        throw new Error(response.error || 'Failed to add video to custom playlist');
      }
      console.log('[useAddVideoToCustomPlaylist] mutationFn succeeded. Response:', response.data);
      return response; // Return the whole response, not just response.data
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        console.log(`[useAddVideoToCustomPlaylist] Success. Invalidating lists and detail for ${variables.playlistId}`);
        queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
        queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      }
    },
    onError: (error, variables) => {
      console.error(`[useAddVideoToCustomPlaylist] Error adding video to playlist ${variables.playlistId}:`, error);
    },
  });
}

// Hook to remove a video from a playlist
export function useRemoveVideoFromPlaylist() {
  const queryClient = useQueryClient();
  // Define the payload structure expected by the hook's mutate function
  type RemoveVideoPayload = { playlistId: string; videoId: string; };

  return useMutation<void, Error, RemoveVideoPayload>({
    mutationFn: async ({ playlistId, videoId }: RemoveVideoPayload) => {
      const response: IpcResponse<void> = await window.electronAPI.playlists.removeVideo(playlistId, videoId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove video from playlist');
      }
    },
    onSuccess: (_, variables) => { // variables contains { playlistId, videoId }
      console.log(`Video ${variables.videoId} removed from playlist ${variables.playlistId}. Invalidating queries.`);
      // Invalidate queries to refetch playlist list (for itemCount/thumbnail) and specific playlist details
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      // Also invalidate the videos query for the detail view to update the video list UI
      queryClient.invalidateQueries({ queryKey: ['playlistVideos', variables.playlistId] }); 
    },
    onError: (error, variables) => {
      console.error(`Error removing video ${variables.videoId} from playlist ${variables.playlistId}:`, error);
    },
  });
}

// Future hooks for update, etc. can be added here.
// Example: useUpdatePlaylist

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