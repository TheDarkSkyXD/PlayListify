import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as playlistManagerDb from '../services/playlistManagerDb';

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
}
