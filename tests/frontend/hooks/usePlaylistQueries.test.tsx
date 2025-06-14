// tests/frontend/hooks/usePlaylistQueries.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGetPlaylists, useGetPlaylistById, useCreatePlaylist, useUpdatePlaylist, useDeletePlaylist, playlistKeys } from '@/frontend/hooks/usePlaylistQueries';
import { IpcResponse, Playlist, PlaylistsApiResponse, PlaylistCreateInput, PlaylistUpdateInput, QueryParams } from '@/shared/types';

const mockApi = window.api as jest.Mocked<typeof window.api>;

const createQueryClientWrapper = (): { wrapper: React.FC<{ children: React.ReactNode }>, client: QueryClient } => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, 
      },
    },
  });
  const WrapperComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
  return { wrapper: WrapperComponent, client: queryClient };
};

const mockPlaylistsData: Playlist[] = [
  { id: 'pl1', name: 'Chill Vibes', videoCount: 10, videos: [], source: 'local', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z', description: 'Relaxing tunes.' },
  { id: 'pl2', name: 'Workout Mix', videoCount: 20, videos: [], source: 'youtube', youtubePlaylistId: 'ytpl2', createdAt: '2023-01-02T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z', description: 'High energy mix.' },
];

const mockPaginatedResponse: PlaylistsApiResponse = {
  items: mockPlaylistsData,
  totalItems: 2,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe('usePlaylistQueries', () => {
  beforeEach(() => {
    mockApi.getAllPlaylists.mockReset();
    mockApi.getPlaylistById.mockReset();
    mockApi.createPlaylist.mockReset();
    mockApi.updatePlaylist.mockReset();
    mockApi.deletePlaylist.mockReset();
  });

  describe('useGetPlaylists', () => {
    it('should fetch playlists successfully', async () => {
      mockApi.getAllPlaylists.mockResolvedValueOnce({ success: true, data: mockPaginatedResponse } as IpcResponse<PlaylistsApiResponse>);
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylists(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPaginatedResponse);
    });

    it('should fetch playlists with query params', async () => {
      const params: QueryParams = { page: 2, limit: 5 };
      mockApi.getAllPlaylists.mockResolvedValueOnce({ success: true, data: { ...mockPaginatedResponse, currentPage: 2, items: [] } } as IpcResponse<PlaylistsApiResponse>);
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylists(params), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllPlaylists).toHaveBeenCalledWith(params);
    });

    it('should handle error when fetching playlists', async () => {
      mockApi.getAllPlaylists.mockResolvedValueOnce({ success: false, error: { message: 'Fetch List Error' } } as IpcResponse<PlaylistsApiResponse>);
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylists(), { wrapper });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as Error).message).toBe('Fetch List Error');
    });
  });

  describe('useGetPlaylistById', () => {
    it('should fetch a single playlist successfully', async () => {
      const playlistId = 'pl1';
      const mockPlaylist = mockPlaylistsData[0];
      mockApi.getPlaylistById.mockResolvedValueOnce({ success: true, data: mockPlaylist } as IpcResponse<Playlist>);
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylistById(playlistId), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getPlaylistById).toHaveBeenCalledWith(playlistId);
    });

    it('should not fetch if playlistId is undefined', () => {
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylistById(undefined), { wrapper });
      expect(result.current.isPending).toBe(true);
      expect(result.current.isFetching).toBe(false);
    });

    it('should handle error when fetching a single playlist by id', async () => {
      const playlistId = 'pl-error';
      mockApi.getPlaylistById.mockResolvedValueOnce({ success: false, error: { message: 'Fetch Detail Error' } } as IpcResponse<Playlist>);
      const { wrapper } = createQueryClientWrapper();
      const { result } = renderHook(() => useGetPlaylistById(playlistId), { wrapper });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as Error).message).toBe('Fetch Detail Error');
    });
  });

  describe('useCreatePlaylist', () => {
    it('should create a playlist successfully', async () => {
      const newPlaylistInput: PlaylistCreateInput = { name: 'New Awesome Playlist', source: 'local', description: 'test' };
      const createdPlaylist: Playlist = { ...newPlaylistInput, id: 'pl-new', videoCount: 0, videos: [], createdAt: '2023-01-03T00:00:00Z', updatedAt: '2023-01-03T00:00:00Z' };
      const { wrapper, client: queryClient } = createQueryClientWrapper();
      mockApi.getAllPlaylists.mockResolvedValueOnce({ success: true, data: mockPaginatedResponse } as IpcResponse<PlaylistsApiResponse>);
      renderHook(() => useGetPlaylists(), { wrapper });
      await waitFor(() => expect(queryClient.getQueryState(playlistKeys.lists())?.status).toBe('success'));
      mockApi.createPlaylist.mockResolvedValueOnce({ success: true, data: createdPlaylist } as IpcResponse<Playlist>);
      const { result } = renderHook(() => useCreatePlaylist(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync(newPlaylistInput);
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(createdPlaylist);
      expect(queryClient.getQueryState(playlistKeys.lists())?.isInvalidated).toBe(true);
    });
  });

  describe('useUpdatePlaylist', () => {
    it('should update a playlist successfully', async () => {
      const playlistId = 'pl1';
      const updatePayload: PlaylistUpdateInput = { name: 'Updated Chill Beats' };
      const updatedPlaylist: Playlist = { ...mockPlaylistsData[0], ...updatePayload, updatedAt: new Date().toISOString() };
      const { wrapper, client: queryClient } = createQueryClientWrapper();
      mockApi.getPlaylistById.mockResolvedValueOnce({ success: true, data: mockPlaylistsData[0] } as IpcResponse<Playlist>);
      renderHook(() => useGetPlaylistById(playlistId), { wrapper });
      await waitFor(() => expect(queryClient.getQueryState(playlistKeys.detail(playlistId))?.status).toBe('success'));
      mockApi.updatePlaylist.mockResolvedValueOnce({ success: true, data: updatedPlaylist } as IpcResponse<Playlist>);
      const { result } = renderHook(() => useUpdatePlaylist(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({ id: playlistId, data: updatePayload });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(updatedPlaylist);
      await waitFor(() => expect(queryClient.getQueryState(playlistKeys.detail(playlistId))?.isInvalidated).toBe(true));
    });
  });

  describe('useDeletePlaylist', () => {
    it('should delete a playlist successfully', async () => {
      const playlistId = 'pl1';
      mockApi.deletePlaylist.mockResolvedValueOnce({ success: true, data: true } as IpcResponse<boolean>);
      const { wrapper, client: queryClient } = createQueryClientWrapper();
      const { result } = renderHook(() => useDeletePlaylist(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync(playlistId);
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ id: playlistId, success: true });
      expect(queryClient.getQueryState(playlistKeys.detail(playlistId))).toBeUndefined();
    });
  });
});