import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIPC } from './useIPC';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import {
  Playlist,
  PlaylistSummary,
  PlaylistVideoWithDetails,
  PlaylistCreateResponse,
  PlaylistsResponse,
  PlaylistDetailsResponse,
  PlaylistUpdateResponse,
  PlaylistDeleteResponse,
  PlaylistRefreshResponse,
  PlaylistExportResponse,
  VideoAddResponse,
  VideoRemoveResponse,
  VideoUpdatePositionResponse,
} from '../../shared/types';

// Query keys
export const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [...playlistKeys.all, 'list'] as const,
  list: (filters: string) => [...playlistKeys.lists(), { filters }] as const,
  details: () => [...playlistKeys.all, 'detail'] as const,
  detail: (id: number) => [...playlistKeys.details(), id] as const,
};

// Add this to the existing interface imports
interface YouTubePlaylistInfoResponse {
  success: boolean;
  playlistInfo?: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    channelTitle?: string;
    videoCount?: number;
  };
  error?: string;
}

// Get all playlists
export const useGetAllPlaylists = () => {
  const { invoke } = useIPC<void, PlaylistsResponse>(IPC_CHANNELS.PLAYLIST_GET_ALL);
  
  return useQuery({
    queryKey: playlistKeys.lists(),
    queryFn: async () => {
      const response = await invoke();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch playlists');
      }
      return response.playlists || [];
    },
  });
};

// Get playlist details
export const useGetPlaylistDetails = (playlistId: number) => {
  const { invoke } = useIPC<{ playlistId: number }, PlaylistDetailsResponse>(IPC_CHANNELS.PLAYLIST_GET);
  
  return useQuery({
    queryKey: playlistKeys.detail(playlistId),
    queryFn: async () => {
      const response = await invoke({ playlistId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch playlist details');
      }
      return response.details;
    },
    enabled: !!playlistId,
  });
};

// Create custom playlist
export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<{ name: string; description?: string }, PlaylistCreateResponse>(
    IPC_CHANNELS.PLAYLIST_CREATE
  );
  
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const response = await invoke({ name, description });
      if (!response.success) {
        throw new Error(response.error || 'Failed to create playlist');
      }
      return response.playlistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Import YouTube playlist
export const useImportPlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<{ url: string }, PlaylistCreateResponse>(IPC_CHANNELS.PLAYLIST_IMPORT);
  
  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      const response = await invoke({ url });
      if (!response.success) {
        throw new Error(response.error || 'Failed to import playlist');
      }
      return response.playlistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Update playlist
export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<
    { playlistId: number; updates: Partial<Playlist> },
    PlaylistUpdateResponse
  >(IPC_CHANNELS.PLAYLIST_UPDATE);
  
  return useMutation({
    mutationFn: async ({
      playlistId,
      updates,
    }: {
      playlistId: number;
      updates: Partial<Playlist>;
    }) => {
      const response = await invoke({ playlistId, updates });
      if (!response.success) {
        throw new Error(response.error || 'Failed to update playlist');
      }
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Delete playlist
export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<{ playlistId: number }, PlaylistDeleteResponse>(
    IPC_CHANNELS.PLAYLIST_DELETE
  );
  
  return useMutation({
    mutationFn: async ({ playlistId }: { playlistId: number }) => {
      const response = await invoke({ playlistId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete playlist');
      }
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
      queryClient.removeQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
    },
  });
};

// Refresh playlist
export const useRefreshPlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<{ playlistId: number }, PlaylistRefreshResponse>(
    IPC_CHANNELS.PLAYLIST_REFRESH
  );
  
  return useMutation({
    mutationFn: async ({ playlistId }: { playlistId: number }) => {
      const response = await invoke({ playlistId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to refresh playlist');
      }
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Export playlist to JSON
export const useExportPlaylist = () => {
  const { invoke } = useIPC<{ playlistId: number }, PlaylistExportResponse>(
    IPC_CHANNELS.PLAYLIST_EXPORT
  );
  
  return useMutation({
    mutationFn: async ({ playlistId }: { playlistId: number }) => {
      const response = await invoke({ playlistId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to export playlist');
      }
      return response.jsonData;
    },
  });
};

// Import playlist from JSON
export const useImportPlaylistFromJson = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<{ jsonData: string }, PlaylistCreateResponse>(
    IPC_CHANNELS.PLAYLIST_IMPORT_JSON
  );
  
  return useMutation({
    mutationFn: async ({ jsonData }: { jsonData: string }) => {
      const response = await invoke({ jsonData });
      if (!response.success) {
        throw new Error(response.error || 'Failed to import playlist from JSON');
      }
      return response.playlistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Add video to playlist
export const useAddVideoToPlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<
    {
      playlistId: number;
      videoData: {
        video_id: string;
        title: string;
        duration_seconds?: number;
        thumbnail?: string;
        author?: string;
      };
    },
    VideoAddResponse
  >(IPC_CHANNELS.VIDEO_ADD);
  
  return useMutation({
    mutationFn: async ({
      playlistId,
      videoData,
    }: {
      playlistId: number;
      videoData: {
        video_id: string;
        title: string;
        duration_seconds?: number;
        thumbnail?: string;
        author?: string;
      };
    }) => {
      const response = await invoke({ playlistId, videoData });
      if (!response.success) {
        throw new Error(response.error || 'Failed to add video to playlist');
      }
      return response.playlistVideoId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Remove video from playlist
export const useRemoveVideoFromPlaylist = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<
    { playlistId: number; videoId: number },
    VideoRemoveResponse
  >(IPC_CHANNELS.VIDEO_REMOVE);
  
  return useMutation({
    mutationFn: async ({
      playlistId,
      videoId,
    }: {
      playlistId: number;
      videoId: number;
    }) => {
      const response = await invoke({ playlistId, videoId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove video from playlist');
      }
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
      queryClient.invalidateQueries({ queryKey: playlistKeys.lists() });
    },
  });
};

// Update video position
export const useUpdateVideoPosition = () => {
  const queryClient = useQueryClient();
  const { invoke } = useIPC<
    { playlistId: number; videoId: number; newPosition: number },
    VideoUpdatePositionResponse
  >(IPC_CHANNELS.VIDEO_UPDATE_POSITION);
  
  return useMutation({
    mutationFn: async ({
      playlistId,
      videoId,
      newPosition,
    }: {
      playlistId: number;
      videoId: number;
      newPosition: number;
    }) => {
      const response = await invoke({ playlistId, videoId, newPosition });
      if (!response.success) {
        throw new Error(response.error || 'Failed to update video position');
      }
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
    },
  });
};

// Get YouTube playlist info (to preview before importing)
export const useGetYouTubePlaylistInfo = () => {
  const { invoke } = useIPC<{ url: string }, YouTubePlaylistInfoResponse>(
    IPC_CHANNELS.PLAYLIST_GET_YOUTUBE_INFO
  );
  
  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      const response = await invoke({ url });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch YouTube playlist info');
      }
      return response.playlistInfo;
    },
  });
}; 