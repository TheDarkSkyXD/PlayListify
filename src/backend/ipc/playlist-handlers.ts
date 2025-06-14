// src/backend/ipc/playlist-handlers.ts
import { ipcMain } from 'electron';
import type {
  IpcResponse,
  Playlist,
  PlaylistCreateInput,
  PlaylistUpdateInput,
  Video,
  QueryParams,
  PaginatedResponse,
} from '../../shared/types';
// Assume a PlaylistService or PlaylistManager will exist
// import { playlistService } from '../services/playlistService'; // Placeholder
// import { playlistManager } from '../services/playlistManager'; // Placeholder for DB backed one

export function registerPlaylistHandlers(): void {
  ipcMain.handle(
    'get-all-playlists',
    async (event, params?: QueryParams): Promise<IpcResponse<PaginatedResponse<Playlist>>> => {
      try {
        console.log('IPC: get-all-playlists request received, params:', params);
        // const playlists = await playlistService.getAllPlaylists(params);
        // For now, return a placeholder
        const placeholderResponse: PaginatedResponse<Playlist> = {
          items: [],
          totalItems: 0,
          currentPage: params?.page || 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
        return { success: true, data: placeholderResponse };
      } catch (error: any) {
        console.error('Error getting all playlists:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to get playlists.',
            code: 'GET_PLAYLISTS_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'get-playlist-by-id',
    async (event, id: string): Promise<IpcResponse<Playlist | null>> => {
      try {
        console.log(`IPC: get-playlist-by-id request for ${id}`);
        // const playlist = await playlistService.getPlaylistById(id);
        // For now, return null
        return { success: true, data: null };
      } catch (error: any) {
        console.error(`Error getting playlist ${id}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to get playlist ${id}.`,
            code: 'GET_PLAYLIST_ID_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'create-playlist',
    async (event, playlistInput: PlaylistCreateInput): Promise<IpcResponse<Playlist>> => {
      try {
        console.log('IPC: create-playlist request received:', playlistInput);
        // const newPlaylist = await playlistService.createPlaylist(playlistInput);
        // For now, return a placeholder
        const placeholderPlaylist: Playlist = {
          id: `fake-pl-${Date.now()}`,
          name: playlistInput.name,
          description: playlistInput.description,
          videos: playlistInput.videos || [],
          videoCount: playlistInput.videos?.length || 0,
          source: playlistInput.source,
          youtubePlaylistId: playlistInput.youtubePlaylistId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderPlaylist };
      } catch (error: any) {
        console.error('Error creating playlist:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to create playlist.',
            code: 'CREATE_PLAYLIST_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'update-playlist',
    async (event, id: string, playlistUpdate: PlaylistUpdateInput): Promise<IpcResponse<Playlist>> => {
      try {
        console.log(`IPC: update-playlist request for ${id}:`, playlistUpdate);
        // const updatedPlaylist = await playlistService.updatePlaylist(id, playlistUpdate);
        // For now, return a placeholder
        const placeholderPlaylist: Playlist = { // This needs to be fetched first in reality
          id,
          name: playlistUpdate.name || 'Updated Playlist',
          description: playlistUpdate.description,
          videos: playlistUpdate.videos || [],
          videoCount: playlistUpdate.videos?.length || 0,
          source: 'local', // Assuming update is for local
          createdAt: new Date().toISOString(), // This would be original
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderPlaylist };
      } catch (error: any) {
        console.error(`Error updating playlist ${id}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to update playlist ${id}.`,
            code: 'UPDATE_PLAYLIST_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'delete-playlist',
    async (event, id: string): Promise<IpcResponse<boolean>> => {
      try {
        console.log(`IPC: delete-playlist request for ${id}`);
        // await playlistService.deletePlaylist(id);
        return { success: true, data: true }; // Placeholder
      } catch (error: any) {
        console.error(`Error deleting playlist ${id}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to delete playlist ${id}.`,
            code: 'DELETE_PLAYLIST_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'add-video-to-playlist',
    async (event, playlistId: string, video: Video): Promise<IpcResponse<Playlist>> => {
      try {
        console.log(`IPC: add-video-to-playlist request for playlist ${playlistId}:`, video);
        // const updatedPlaylist = await playlistService.addVideoToPlaylist(playlistId, video);
        // For now, return a placeholder
         const placeholderPlaylist: Playlist = {
          id: playlistId,
          name: 'Playlist with new video',
          videos: [video],
          videoCount: 1,
          source: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderPlaylist };
      } catch (error: any) {
        console.error(`Error adding video to playlist ${playlistId}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to add video to playlist ${playlistId}.`,
            code: 'ADD_VIDEO_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'remove-video-from-playlist',
    async (event, playlistId: string, videoId: string): Promise<IpcResponse<Playlist>> => {
      try {
        console.log(`IPC: remove-video-from-playlist request for playlist ${playlistId}, video ${videoId}`);
        // const updatedPlaylist = await playlistService.removeVideoFromPlaylist(playlistId, videoId);
        // For now, return a placeholder
        const placeholderPlaylist: Playlist = {
          id: playlistId,
          name: 'Playlist with video removed',
          videos: [],
          videoCount: 0,
          source: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderPlaylist };
      } catch (error: any) {
        console.error(`Error removing video from playlist ${playlistId}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to remove video from playlist ${playlistId}.`,
            code: 'REMOVE_VIDEO_ERROR',
          },
        };
      }
    }
  );
  
  ipcMain.handle(
    'import-youtube-playlist',
    async (event, youtubePlaylistUrl: string): Promise<IpcResponse<Playlist>> => {
      try {
        console.log('IPC: import-youtube-playlist request received:', youtubePlaylistUrl);
        // This would involve ytDlpManager to fetch metadata, then playlistService to save.
        // const newPlaylist = await playlistService.importYouTubePlaylist(youtubePlaylistUrl);
        const placeholderPlaylist: Playlist = {
          id: `fake-ytpl-${Date.now()}`,
          name: 'Imported YouTube Playlist',
          videos: [],
          videoCount: 0,
          source: 'youtube',
          youtubePlaylistId: 'some-yt-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderPlaylist };
      } catch (error: any) {
        console.error('Error importing YouTube playlist:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to import YouTube playlist.',
            code: 'IMPORT_YT_PLAYLIST_ERROR',
          },
        };
      }
    }
  );

  console.log('Playlist IPC handlers registered.');
}