import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import {
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  updatePlaylistDetails,
  deletePlaylist,
  addVideoToPlaylist,
  getVideosByPlaylistId, // Assuming this function exists in playlist-manager
  removeVideoFromPlaylist,
  reorderVideosInPlaylist,
  importPlaylistFromUrl,
} from '../services/playlist-manager';
import type { IpcResponse, Playlist, Video, PlaylistVideo } from '../../shared/types';

// Define types for handler arguments to match service functions & preload expectations
// These might need adjustment based on actual preload.ts and service function signatures
type PlaylistCreationDetailsArgs = Parameters<typeof createPlaylist>[0];
type PlaylistUpdateDetailsArgs = Parameters<typeof updatePlaylistDetails>[1];
type VideoAddDetailsArgs = Parameters<typeof addVideoToPlaylist>[1];

export function registerPlaylistHandlers() {
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_CREATE, async (_event, details: PlaylistCreationDetailsArgs) => {
    return createPlaylist(details);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_ALL, async () => {
    return getAllPlaylists();
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_BY_ID, async (_event, id: string) => {
    return getPlaylistById(id);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_UPDATE_DETAILS, async (_event, id: string, details: PlaylistUpdateDetailsArgs) => {
    return updatePlaylistDetails(id, details);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_DELETE, async (_event, id: string) => {
    return deletePlaylist(id);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_ADD_VIDEO, async (_event, playlistId: string, videoDetails: VideoAddDetailsArgs) => {
    return addVideoToPlaylist(playlistId, videoDetails);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_VIDEOS, async (_event, playlistId: string) => {
    return getVideosByPlaylistId(playlistId);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_REMOVE_VIDEO, async (_event, playlistId: string, videoId: string) => {
    return removeVideoFromPlaylist(playlistId, videoId);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_REORDER_VIDEOS, async (_event, playlistId: string, videoIdsInOrder: string[]) => {
    return reorderVideosInPlaylist(playlistId, videoIdsInOrder);
  });

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_IMPORT_FROM_URL, async (_event, url: string) => {
    return importPlaylistFromUrl(url);
  });

  console.log('[IPC Handlers] Playlist handlers registered.');
} 