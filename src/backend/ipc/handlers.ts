import { ipcMain, dialog, IpcMainInvokeEvent, app } from 'electron';
import * as settingsManager from '../services/settingsManager';
import * as fileUtils from '../utils/fileUtils';
import * as ytDlpManager from '../services/ytDlpManager';
import * as playlistServiceProvider from '../services/playlistServiceProvider';
import * as imageUtils from '../utils/imageUtils';
import { registerLoggerHandlers } from './loggerHandlers';
import { registerPlaylistDbHandlers } from './playlistDbHandlers';
import { registerDatabaseHandlers } from './databaseHandlers';
import { registerDownloadHandlers } from './downloadHandlers';
import { registerFormatConverterHandlers } from './formatConverterHandlers';
import path from 'path';
import fs from 'fs-extra';

/**
 * Registers all IPC handlers for the main process
 */
export function registerIpcHandlers(): void {
  // Register logger handlers
  registerLoggerHandlers();

  // Register database-based playlist handlers
  registerPlaylistDbHandlers();

  // Register database management handlers
  registerDatabaseHandlers();

  // Register download handlers
  registerDownloadHandlers();

  // Register format converter handlers
  registerFormatConverterHandlers();
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
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Directory',
        buttonLabel: 'Select',
        defaultPath: app.getPath('videos')
      });

      if (result.canceled) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('Error showing directory dialog:', error);
      throw error;
    }
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

  // Set up a direct event for progress updates
  ipcMain.on('yt:requestProgressUpdates', (event) => {
    console.log('Renderer requested progress updates');
    // Store the sender for later use
    const sender = event.sender;

    // Send a test update
    setTimeout(() => {
      console.log('Sending test progress update');
      sender.send('yt:importProgress', {
        status: 'Test from main process',
        count: 10,
        total: 100
      });
    }, 1000);
  });

  ipcMain.handle('yt:importPlaylist', async (event: IpcMainInvokeEvent, playlistUrl: string, playlistInfo?: any) => {
    console.log('[BACKEND] Received yt:importPlaylist request');
    // Pass the existing playlist info to avoid fetching it again
    return await playlistServiceProvider.importYoutubePlaylist(
      playlistUrl,
      // Create a progress callback function that sends updates to the renderer
      (status: string, count: number = 0, total: number = 0) => {
        console.log(`Sending progress update: ${status}, ${count}/${total}`);
        event.sender.send('yt:importProgress', { status, count, total });
      },
      playlistInfo
    );
  });

  ipcMain.handle('yt:checkVideoStatus', async (_: IpcMainInvokeEvent, videoUrl: string) => {
    return await ytDlpManager.checkVideoStatus(videoUrl);
  });

  ipcMain.handle('yt:downloadVideo', async (_: IpcMainInvokeEvent, videoUrl: string, outputDir: string, videoId: string, options: any) => {
    return await ytDlpManager.downloadVideo(videoUrl, outputDir, videoId, options);
  });

  // Playlist management handlers
  ipcMain.handle('playlist:create', async (_: IpcMainInvokeEvent, name: string, description?: string) => {
    return await playlistServiceProvider.createEmptyPlaylist(name, description);
  });

  ipcMain.handle('playlist:getAll', async () => {
    return await playlistServiceProvider.getAllPlaylists();
  });

  ipcMain.handle('playlist:getById', async (_: IpcMainInvokeEvent, playlistId: string) => {
    return await playlistServiceProvider.getPlaylistById(playlistId);
  });

  ipcMain.handle('playlist:delete', async (_: IpcMainInvokeEvent, playlistId: string) => {
    await playlistServiceProvider.deletePlaylist(playlistId);
    return true;
  });

  ipcMain.handle('playlist:update', async (_: IpcMainInvokeEvent, playlistId: string, updates: any) => {
    return await playlistServiceProvider.updatePlaylist(playlistId, updates);
  });

  ipcMain.handle('playlist:addVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoUrl: string) => {
    return await playlistServiceProvider.addVideoToPlaylist(playlistId, videoUrl);
  });

  ipcMain.handle('playlist:removeVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string) => {
    return await playlistServiceProvider.removeVideoFromPlaylist(playlistId, videoId);
  });

  ipcMain.handle('playlist:downloadVideo', async (_: IpcMainInvokeEvent, playlistId: string, videoId: string, options?: any) => {
    return await playlistServiceProvider.downloadPlaylistVideo(playlistId, videoId, options);
  });

  ipcMain.handle('playlist:refresh', async (_: IpcMainInvokeEvent, playlistId: string) => {
    return await playlistServiceProvider.refreshYoutubePlaylist(playlistId);
  });

  // Add new handlers for search and stats
  ipcMain.handle('playlist:search', async (_: IpcMainInvokeEvent, query: string) => {
    return await playlistServiceProvider.searchPlaylists(query);
  });

  ipcMain.handle('playlist:stats', async () => {
    return await playlistServiceProvider.getDatabaseStats();
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

  // Import YouTube playlist
  ipcMain.handle('import-youtube-playlist', async (_event, url: string, progressCallback?: (current: number, total: number) => void) => {
    try {
      console.log(`Starting YouTube playlist import for: ${url}`);

      // First get the playlist info (title, etc)
      const playlistInfo = await ytDlpManager.getPlaylistInfo(url);
      console.log(`Found playlist: "${playlistInfo.title}" with ${playlistInfo.videoCount} videos`);

      // Then extract all videos
      const videos = await ytDlpManager.getPlaylistVideos(url, (current: number) => {
        // Report progress back to renderer
        if (progressCallback) {
          progressCallback(current, playlistInfo.videoCount);
        }
      });

      console.log(`Successfully extracted ${videos.length} videos from playlist`);

      return {
        playlistInfo,
        videos
      };
    } catch (error) {
      console.error('Error importing YouTube playlist:', error);
      throw error;
    }
  });

  // Create a new playlist
  ipcMain.handle('create-playlist', async (_event, playlist: { name: string, videos: any[] }) => {
    try {
      console.log(`Creating new playlist: ${playlist.name} with ${playlist.videos.length} videos`);

      // Generate a unique ID
      const playlistId = fileUtils.createPlaylistId();

      // Create the full playlist object
      const newPlaylist = {
        id: playlistId,
        ...playlist,
        source: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create the playlist directory
      await fileUtils.createPlaylistDir(playlistId, playlist.name);

      // Save the playlist metadata
      await fileUtils.writePlaylistMetadata(playlistId, playlist.name, newPlaylist);

      console.log(`Playlist "${playlist.name}" created successfully with ID: ${playlistId}`);

      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  });
}