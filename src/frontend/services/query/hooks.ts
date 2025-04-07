import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playlistService } from '../playlistService';
import { Playlist, Video } from '../../../shared/types/appTypes';
import usePlaylistStore from '../../stores/playlistStore';
import React from 'react';
import { QUERY_KEYS } from './keys';
import { useToast } from '../../components/ui/use-toast';

/**
 * Hook to fetch all playlists and sync with store
 */
export function usePlaylists() {
  const { setPlaylists, setLoading, setError } = usePlaylistStore();

  const query = useQuery({
    queryKey: [QUERY_KEYS.playlists],
    queryFn: playlistService.getPlaylists,
    select: (data) => {
      if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('usePlaylists: expected array but got', typeof data);
        return [];
      }
    }
  });

  // Use effect pattern for store updates
  React.useEffect(() => {
    if (query.status === 'pending') {
      setLoading(true);
    }

    if (query.status === 'success') {
      const playlists = Array.isArray(query.data) ? query.data : [];
      setPlaylists(playlists);
      setError(null);
      setLoading(false);
    }

    if (query.status === 'error' && query.error) {
      setError(query.error.message);
      setLoading(false);
    }
  }, [query.status, query.data, query.error, setPlaylists, setLoading, setError]);

  return query;
}

/**
 * Hook to fetch a single playlist by ID
 */
export function usePlaylist(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.playlist(id),
    queryFn: () => playlistService.getPlaylist(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new playlist
 */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) =>
      playlistService.createPlaylist(playlist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });
}

/**
 * Hook to update an existing playlist
 */
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlist: Playlist) => playlistService.updatePlaylist(playlist),
    onSuccess: (data: Playlist) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(data.id) });
    },
  });
}

/**
 * Hook to delete a playlist
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => playlistService.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });
}

/**
 * Hook to import a YouTube playlist
 */
export function useImportPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => playlistService.importPlaylist(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });
}

/**
 * Hook to add a video to a playlist
 */
export function useAddVideoToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, video }: { playlistId: string; video: Omit<Video, 'id'> }) =>
      playlistService.addVideoToPlaylist(playlistId, video),
    onSuccess: (_, variables) => {
      // Invalidate and refetch the specific playlist query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(variables.playlistId) });

      // Also invalidate and refetch the playlists list query to update the playlists page
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });
}

/**
 * Hook to remove a video from a playlist
 */
export function useRemoveVideoFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      playlistService.removeVideoFromPlaylist(playlistId, videoId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch the specific playlist query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(variables.playlistId) });

      // Also invalidate and refetch the playlists list query to update the playlists page
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });
}

/**
 * Hook to download a video
 */
export function useDownloadVideo() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      playlistService.downloadVideo(playlistId, videoId, setProgress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(variables.playlistId) });
    },
  });

  return { ...mutation, progress };
}

/**
 * Hook to download an entire playlist
 */
export function useDownloadPlaylist() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (options: {
      playlistId: string;
      downloadLocation?: string;
      createPlaylistFolder?: boolean;
      format?: string;
      quality?: string;
    }) => {
      console.log('=== DOWNLOAD MUTATION START ===');
      console.log('useDownloadPlaylist: Starting download with options:', options);
      try {
        console.log('useDownloadPlaylist: Calling playlistService.downloadPlaylist...');
        const result = await playlistService.downloadPlaylist(options, (completed: number, total: number) => {
          console.log(`useDownloadPlaylist: Progress update - ${completed}/${total}`);
          setProgress({ completed, total });
        });
        console.log('useDownloadPlaylist: Download completed with result:', result);
        console.log('=== DOWNLOAD MUTATION COMPLETE ===');
        return result;
      } catch (error) {
        console.error('useDownloadPlaylist: Error downloading playlist:', error);
        console.log('=== DOWNLOAD MUTATION ERROR ===');
        throw error;
      }
    },
    onSuccess: (result, options) => {
      console.log('useDownloadPlaylist: onSuccess called with result:', result);

      // Check if the result is a special message about already downloaded videos
      if (result && typeof result === 'object' && 'status' in result && result.status === 'already-downloaded') {
        console.log('useDownloadPlaylist: All videos already downloaded');
        // Show a toast notification
        toast({
          title: 'No Videos to Download',
          description: result.message || 'All videos in this playlist are already downloaded.',
          variant: 'default'
        });
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(options.playlistId) });
    },
    onError: (error) => {
      console.error('useDownloadPlaylist: onError called with error:', error);
      // Show an error toast
      toast({
        title: 'Download Error',
        description: error instanceof Error ? error.message : 'An error occurred while downloading the playlist.',
        variant: 'destructive'
      });
    }
  });

  return { ...mutation, progress };
}
