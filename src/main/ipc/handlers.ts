import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as settingsManager from '../services/settingsManager';
import * as fileUtils from '../utils/fileUtils';
import * as ytDlpManager from '../services/ytDlpManager';
import * as playlistManager from '../services/playlistManager';
import * as imageUtils from '../utils/imageUtils';
import path from 'path';
import fs from 'fs-extra';
import { ytDlpHandlers } from './ytDlp';

// Define type for settings keys
type SettingsKey = keyof ReturnType<typeof settingsManager.getAllSettings>;

// Create empty mock handlers for modules we haven't implemented yet
const settingsHandlersMock = {};
const fileSystemHandlersMock = {};
const imageHandlersMock = {};
const youtubeHandlersMock = {};
const playlistHandlersMock = {};

/**
 * Registers all IPC handlers for the main process
 */
export function registerIpcHandlers(): void {
  // Register all IPC handlers
  registerHandlers(settingsHandlersMock);
  registerHandlers(fileSystemHandlersMock);
  registerHandlers(imageHandlersMock);
  registerHandlers(youtubeHandlersMock);
  registerHandlers(playlistHandlersMock);
  registerHandlers(ytDlpHandlers);
}

function registerHandlers(handlers: { [key: string]: (...args: any[]) => Promise<any> }) {
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return await handler(...args);
      } catch (error) {
        console.error(`Error in IPC handler for channel "${channel}":`, error);
        throw error;
      }
    });
  }
}

// Settings related handlers
ipcMain.handle('settings:get', (_: IpcMainInvokeEvent, key: string) => {
  return settingsManager.getSetting(key as any);
});

ipcMain.handle('settings:set', (_: IpcMainInvokeEvent, key: string, value: any) => {
  settingsManager.setSetting(key as any, value);
  return true;
});

ipcMain.handle('settings:getAll', () => {
  return settingsManager.getAllSettings();
});

ipcMain.handle('settings:reset', (_: IpcMainInvokeEvent, key: string) => {
  settingsManager.resetSetting(key as any);
  return true;
});

ipcMain.handle('settings:resetAll', () => {
  settingsManager.resetAllSettings();
  return true;
});

// File system related handlers
ipcMain.handle('fs:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('fs:createPlaylistDir', async (_: IpcMainInvokeEvent, playlistId: string, playlistName: string) => {
  return await fileUtils.createPlaylistDir(playlistId, playlistName);
});

ipcMain.handle('fs:writePlaylistMetadata', async (_: IpcMainInvokeEvent, playlistId: string, playlistName: string, metadata: any) => {
  await fileUtils.writePlaylistMetadata(playlistId, playlistName, metadata);
  return true;
});

ipcMain.handle('fs:readPlaylistMetadata', async (_: IpcMainInvokeEvent, playlistId: string, playlistName: string) => {
  return await fileUtils.readPlaylistMetadata(playlistId, playlistName);
});

ipcMain.handle('fs:getAllPlaylists', async () => {
  return await fileUtils.getAllPlaylists();
});

ipcMain.handle('fs:deletePlaylist', async (_: IpcMainInvokeEvent, playlistId: string, playlistName: string) => {
  await fileUtils.deletePlaylist(playlistId, playlistName);
  return true;
});

ipcMain.handle('fs:videoExists', async (_: IpcMainInvokeEvent, playlistId: string, playlistName: string, videoId: string, format: string) => {
  return await fileUtils.videoExists(playlistId, playlistName, videoId, format);
});

ipcMain.handle('fs:getFileSize', async (_: IpcMainInvokeEvent, filePath: string) => {
  return await fileUtils.getFileSize(filePath);
});

ipcMain.handle('fs:getFreeDiskSpace', async () => {
  return await fileUtils.getFreeDiskSpace();
});

// Image utilities
ipcMain.handle('image:cache', async (_: IpcMainInvokeEvent, url: string) => {
  return await imageUtils.downloadImage(url);
});

ipcMain.handle('image:getLocalPath', async (_: IpcMainInvokeEvent, url: string, downloadIfMissing: boolean = true) => {
  return await imageUtils.getLocalImagePath(url, downloadIfMissing);
});

ipcMain.handle('image:clearCache', async (_: IpcMainInvokeEvent, maxAgeDays: number = 30) => {
  await imageUtils.clearOldCachedImages(maxAgeDays);
  return true;
});

// YouTube and playlist handlers
ipcMain.handle('yt:getPlaylistInfo', async (_: IpcMainInvokeEvent, playlistUrl: string) => {
  return await ytDlpManager.getPlaylistInfo(playlistUrl);
});

ipcMain.handle('yt:getPlaylistVideos', async (_: IpcMainInvokeEvent, playlistUrl: string) => {
  return await ytDlpManager.getPlaylistVideos(playlistUrl);
});

ipcMain.handle('yt:importPlaylist', async (_: IpcMainInvokeEvent, playlistUrl: string) => {
  return await playlistManager.importYoutubePlaylist(playlistUrl);
});

ipcMain.handle('yt:checkVideoStatus', async (_: IpcMainInvokeEvent, videoUrl: string) => {
  return await ytDlpManager.checkVideoStatus(videoUrl);
});

ipcMain.handle('yt:downloadVideo', async (_: IpcMainInvokeEvent, videoUrl: string, outputDir: string, videoId: string, options: any) => {
  return await ytDlpManager.downloadVideo(videoUrl, outputDir, videoId, options);
});

// Playlist management handlers
ipcMain.handle('playlist:create', async (_: IpcMainInvokeEvent, name: string, description?: string) => {
  return await playlistManager.createEmptyPlaylist(name, description);
});

ipcMain.handle('playlist:getAll', async () => {
  return await playlistManager.getAllPlaylists();
});

ipcMain.handle('playlist:getById', async (_: IpcMainInvokeEvent, playlistId: string) => {
  return await playlistManager.getPlaylistById(playlistId);
});

ipcMain.handle('playlist:delete', async (_: IpcMainInvokeEvent, playlistId: string) => {
  await playlistManager.deletePlaylist(playlistId);
  return true;
});

ipcMain.handle('playlist:update', async (_: IpcMainInvokeEvent, playlistId: string, updates: any) => {
  return await playlistManager.updatePlaylist(playlistId, updates);
});

ipcMain.handle('playlist:addVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoUrl: string) => {
  return await playlistManager.addVideoToPlaylist(playlistId, videoUrl);
});

ipcMain.handle('playlist:removeVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string) => {
  return await playlistManager.removeVideoFromPlaylist(playlistId, videoId);
});

ipcMain.handle('playlist:downloadVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string, options?: any) => {
  return await playlistManager.downloadPlaylistVideo(playlistId, videoId, options);
});

ipcMain.handle('playlist:refresh', async (_: IpcMainInvokeEvent, playlistId: string) => {
  return await playlistManager.refreshYoutubePlaylist(playlistId);
});

// Filesystem validation
ipcMain.handle('fs:validatePath', async (_: IpcMainInvokeEvent, dirPath: string) => {
  try {
    // Check if path exists
    const exists = await fs.pathExists(dirPath);
    if (!exists) {
      return { valid: false, error: 'Path does not exist' };
    }

    // Check if it's a directory
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return { valid: false, error: 'Path is not a directory' };
    }

    // Check if it's writable
    try {
      const testFile = path.join(dirPath, '.playlistify-write-test');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Directory is not writable' };
    }
  } catch (error) {
    return { valid: false, error: 'Invalid path' };
  }
});

// Add a handler for getting yt-dlp status
ipcMain.handle('yt:getStatus', async () => {
  const isAvailable = ytDlpManager.isYtDlpAvailable();
  return {
    available: isAvailable,
    errorMessage: isAvailable ? '' : 'yt-dlp is not available. Please restart the application if this persists.'
  };
});

// Add handlers for yt-dlp download operations
ipcMain.handle('yt:download', async () => {
  try {
    const path = await ytDlpManager.downloadYtDlp();
    return { success: true, path };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred during download' 
    };
  }
});

ipcMain.handle('yt:downloadProgress', () => {
  return ytDlpManager.getDownloadProgress();
}); 