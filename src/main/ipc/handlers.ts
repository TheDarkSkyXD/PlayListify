import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as settingsManager from '../services/settingsManager';
import * as fileUtils from '../utils/fileUtils';
import path from 'path';
import fs from 'fs-extra';

// Define type for settings keys
type SettingsKey = keyof ReturnType<typeof settingsManager.getAllSettings>;

/**
 * Registers all IPC handlers for the main process
 */
export function registerIpcHandlers(): void {
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
} 