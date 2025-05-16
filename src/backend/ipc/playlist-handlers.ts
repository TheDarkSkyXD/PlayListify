import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

// Import from new custom playlist service
import {
  createNewCustomPlaylist,
  addVideoToCustomPlaylistByUrl as addVideoToCustomPlaylistByUrlService,
} from '../services/custom-playlist-service';

// Import from new YouTube import service
import { importPlaylistFromUrl as importPlaylistFromUrlService } from '../services/youtube-import-service';

// Import remaining generic functions from playlist-manager
import {
  getAllPlaylists,
  getPlaylistById,
  updatePlaylistDetails,
  deletePlaylist,
  addVideoToPlaylist, // This is for imported playlists, remains in playlist-manager
  removeVideoFromPlaylist,
  reorderVideosInPlaylist,
  getAllVideosForPlaylist,
} from '../services/playlist-manager';

// Types
import type { 
  IpcResponse, 
  Playlist, 
  Video, 
  PlaylistVideo, 
  UpdatePlaylistPayload, 
  AddVideoByUrlPayload, 
  CreatePlaylistPayload, // For PLAYLIST_CREATE handler
  VideoAddDetails      // For PLAYLIST_ADD_VIDEO handler (imported playlists)
} from '../../shared/types';

export function registerPlaylistHandlers() {
  // Handler for creating a NEW CUSTOM playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_CREATE, async (_event, details: CreatePlaylistPayload) => {
    return createNewCustomPlaylist(details);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_ALL, async () => {
    return getAllPlaylists();
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_BY_ID, async (_event, id: string) => {
    return getPlaylistById(id);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_UPDATE_DETAILS, async (_event, payload: UpdatePlaylistPayload) => {
    return updatePlaylistDetails(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_DELETE, async (_event, id: string) => {
    return deletePlaylist(id);
  });

  // Handler for adding a video to an IMPORTED playlist (uses junction table)
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_ADD_VIDEO, async (_event, playlistId: string, videoDetails: VideoAddDetails) => {
    return addVideoToPlaylist(playlistId, videoDetails);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_REMOVE_VIDEO, async (_event, playlistId: string, videoId: string) => {
    return removeVideoFromPlaylist(playlistId, videoId);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_REORDER_VIDEOS, async (_event, playlistId: string, videoIdsInOrder: string[]) => {
    return reorderVideosInPlaylist(playlistId, videoIdsInOrder);
  });

  // Handler for IMPORTING a playlist from YouTube URL
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_IMPORT_FROM_URL, async (_event, url: string) => {
    return importPlaylistFromUrlService(url);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_ALL_VIDEOS, async (_event, playlistId: string) => {
    try {
      const videos = await getAllVideosForPlaylist(playlistId);
      // Ensure a consistent IpcResponse structure
      if (videos === null) { // Check if getAllVideosForPlaylist returned null (e.g. playlist not found)
        return { success: false, error: 'Playlist not found or no videos.', data: null };
      }
      return { success: true, data: videos };
    } catch (error: any) {
      console.error(`Error getting all videos for playlist ${playlistId}:`, error);
      return { success: false, error: error.message || 'Failed to get videos for playlist', data: null };
    }
  });

  // Handler for adding a video BY URL to a CUSTOM playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_ADD_VIDEO_BY_URL, async (_event, payload: AddVideoByUrlPayload): Promise<IpcResponse<Video | null>> => {
    try {
      if (!payload || typeof payload.playlistId !== 'string' || typeof payload.videoUrl !== 'string') {
        return { success: false, error: 'Invalid payload: playlistId and videoUrl are required.', data: null };
      }
      return addVideoToCustomPlaylistByUrlService(payload.playlistId, payload.videoUrl);
    } catch (error: any) {
      console.error(`Error adding video by URL to playlist ${payload?.playlistId}:`, error);
      return { success: false, error: error.message || 'Failed to add video by URL', data: null };
    }
  });

  console.log('[IPC Handlers] Playlist handlers registered with updated service calls.');
} 