import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as playlistManagerDb from '../services/playlistManagerDb';
import { updateVideoQuality, updatePlaylistVideoQualities, updateAllVideoQualities } from '../services/ytDlp/video';

/**
 * Registers all IPC handlers for playlist operations using the SQLite database
 */
export function registerPlaylistDbHandlers(): void {
  // Playlist management handlers
  ipcMain.handle('playlist-db:create', async (_: IpcMainInvokeEvent, name: string, description?: string) => {
    return await playlistManagerDb.createEmptyPlaylist(name, description);
  });

  ipcMain.handle('playlist-db:getAll', async () => {
    return await playlistManagerDb.getAllPlaylists();
  });

  ipcMain.handle('playlist-db:getById', async (_: IpcMainInvokeEvent, playlistId: string) => {
    return await playlistManagerDb.getPlaylistById(playlistId);
  });

  ipcMain.handle('playlist-db:delete', async (_: IpcMainInvokeEvent, playlistId: string) => {
    return await playlistManagerDb.deletePlaylist(playlistId);
  });

  ipcMain.handle('playlist-db:update', async (_: IpcMainInvokeEvent, playlistId: string, updates: any) => {
    return await playlistManagerDb.updatePlaylist(playlistId, updates);
  });

  ipcMain.handle('playlist-db:addVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoUrl: string) => {
    return await playlistManagerDb.addVideoToPlaylist(playlistId, videoUrl);
  });

  ipcMain.handle('playlist-db:removeVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string) => {
    return await playlistManagerDb.removeVideoFromPlaylist(playlistId, videoId);
  });

  ipcMain.handle('playlist-db:downloadVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string, options?: any) => {
    return await playlistManagerDb.downloadPlaylistVideo(playlistId, videoId, options);
  });

  ipcMain.handle('playlist-db:refresh', async (_: IpcMainInvokeEvent, playlistId: string) => {
    return await playlistManagerDb.refreshYoutubePlaylist(playlistId);
  });

  ipcMain.handle('playlist-db:search', async (_: IpcMainInvokeEvent, query: string) => {
    return await playlistManagerDb.searchPlaylists(query);
  });

  ipcMain.handle('playlist-db:stats', async () => {
    return await playlistManagerDb.getDatabaseStats();
  });

  // Import YouTube playlist with progress updates
  ipcMain.handle('playlist-db:importYoutube', async (event: IpcMainInvokeEvent, playlistUrl: string, playlistInfo?: any) => {
    console.log('[BACKEND] Received playlist-db:importYoutube request');

    return await playlistManagerDb.importYoutubePlaylist(
      playlistUrl,
      // Create a progress callback function that sends updates to the renderer
      (status: string, count: number = 0, total: number = 0) => {
        console.log(`Sending progress update: ${status}, ${count}/${total}`);
        event.sender.send('playlist-db:importProgress', { status, count, total });
      },
      playlistInfo
    );
  });

  // Video quality update handlers
  ipcMain.handle('playlist-db:updateVideoQuality', async (_: IpcMainInvokeEvent, videoId: string, playlistId: string) => {
    // Get the video from the database
    const playlist = await playlistManagerDb.getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    const video = playlist.videos.find(v => v.id === videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found in playlist ${playlistId}`);
    }

    // Update the video quality
    return await updateVideoQuality(video);
  });

  ipcMain.handle('playlist-db:updatePlaylistVideoQualities', async (event: IpcMainInvokeEvent, playlistId: string) => {
    // Create a progress callback function that sends updates to the renderer
    return await updatePlaylistVideoQualities(
      playlistId,
      (status: string, count: number = 0, total: number = 0) => {
        console.log(`Sending quality update progress: ${status}, ${count}/${total}`);
        event.sender.send('playlist-db:qualityUpdateProgress', { status, count, total });
      }
    );
  });

  ipcMain.handle('playlist-db:updateAllVideoQualities', async (event: IpcMainInvokeEvent) => {
    // Create a progress callback function that sends updates to the renderer
    return await updateAllVideoQualities(
      (status: string, count: number = 0, total: number = 0) => {
        console.log(`Sending quality update progress: ${status}, ${count}/${total}`);
        event.sender.send('playlist-db:qualityUpdateProgress', { status, count, total });
      }
    );
  });
}
