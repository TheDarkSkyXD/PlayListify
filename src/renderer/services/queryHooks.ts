import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  importPlaylist
} from './playlistService';
import { Playlist } from '../../shared/types/appTypes';
import usePlaylistStore from '../stores/playlistStore';
import React from 'react';

// Query keys
export const QUERY_KEYS = {
  playlists: 'playlists',
  playlist: (id: string) => ['playlist', id],
};

/**
 * Hook to fetch all playlists and sync with store
 */
export const usePlaylists = () => {
  const { setPlaylists, setLoading, setError } = usePlaylistStore();
  
  const query = useQuery<Playlist[], Error>({
    queryKey: [QUERY_KEYS.playlists],
    queryFn: fetchPlaylists,
  });
  
  // Use effect pattern for store updates
  React.useEffect(() => {
    if (query.status === 'pending') {
      setLoading(true);
    }
    
    if (query.status === 'success') {
      setPlaylists(query.data);
      setError(null);
      setLoading(false);
    }
    
    if (query.status === 'error' && query.error) {
      setError(query.error.message);
      setLoading(false);
    }
  }, [query.status, query.data, query.error, setPlaylists, setLoading, setError]);
  
  return query;
};

/**
 * Hook to fetch a single playlist by ID
 */
export const usePlaylist = (id: string) => {
  return useQuery<Playlist | null, Error>({
    queryKey: QUERY_KEYS.playlist(id),
    queryFn: () => fetchPlaylistById(id),
    enabled: !!id
  });
};

/**
 * Hook to create a new playlist
 */
export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  const { addPlaylist } = usePlaylistStore();

  return useMutation<
    Playlist, 
    Error, 
    Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>
  >({
    mutationFn: createPlaylist,
    onSuccess: (newPlaylist) => {
      // Update the store
      addPlaylist(newPlaylist);
      // Invalidate the playlist list query to refetch
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    }
  });
};

/**
 * Hook to update a playlist
 */
export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();
  const { updatePlaylist: updatePlaylistInStore } = usePlaylistStore();

  return useMutation<
    Playlist,
    Error,
    { id: string, playlist: Partial<Playlist> }
  >({
    mutationFn: ({ id, playlist }) => updatePlaylist(id, playlist),
    onSuccess: (updatedPlaylist) => {
      // Update the store
      updatePlaylistInStore(updatedPlaylist.id, updatedPlaylist);
      // Invalidate both the list query and the specific playlist query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(updatedPlaylist.id) });
    }
  });
};

/**
 * Hook to delete a playlist
 */
export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();
  const { removePlaylist } = usePlaylistStore();

  return useMutation<void, Error, string>({
    mutationFn: deletePlaylist,
    onSuccess: (_, playlistId) => {
      // Update the store
      removePlaylist(playlistId);
      // Invalidate the playlist list query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    }
  });
};

/**
 * Hook to import a playlist from YouTube
 */
export const useImportPlaylist = () => {
  const queryClient = useQueryClient();
  const { addPlaylist } = usePlaylistStore();

  return useMutation<Playlist, Error, string>({
    mutationFn: importPlaylist,
    onSuccess: (importedPlaylist) => {
      // Update the store
      addPlaylist(importedPlaylist);
      // Invalidate the playlist list query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
    }
  });
}; 