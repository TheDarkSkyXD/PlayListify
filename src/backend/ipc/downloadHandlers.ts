import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { downloadManager } from '../services/downloadManager';
import * as ytDlpManager from '../services/ytDlpManager';
import { logToFile } from '../services/logger';

// Helper function to ensure download manager is initialized
function ensureDownloadManagerInitialized() {
  if (!downloadManager.isInitialized()) {
    downloadManager.initialize();
  }
}

/**
 * Register download manager IPC handlers
 */
export function registerDownloadHandlers(): void {
  // Add a video to the download queue
  ipcMain.handle(
    'download:addToQueue',
    async (
      _: IpcMainInvokeEvent,
      videoUrl: string,
      videoId: string,
      title: string,
      outputDir: string,
      options: any = {},
      playlistId?: string,
      thumbnail?: string
    ) => {
      logToFile('INFO', `Adding download to queue: ${title}`);
      ensureDownloadManagerInitialized();
      return await downloadManager.addToQueue(
        videoUrl,
        videoId,
        title,
        outputDir,
        options,
        playlistId,
        thumbnail
      );
    }
  );

  // Add multiple videos to the download queue
  ipcMain.handle(
    'download:addMultipleToQueue',
    async (
      _: IpcMainInvokeEvent,
      videos: Array<{
        videoId: string;
        url: string;
        title: string;
        thumbnail?: string;
      }>,
      playlistId: string,
      playlistName: string
    ) => {
      logToFile('INFO', `Adding ${videos.length} videos to download queue for playlist ${playlistName}`);
      ensureDownloadManagerInitialized();
      return await downloadManager.addMultipleToQueue(videos, playlistId, playlistName);
    }
  );

  // Pause a download
  ipcMain.handle('download:pause', (_: IpcMainInvokeEvent, downloadId: string) => {
    logToFile('INFO', `Pausing download: ${downloadId}`);
    ensureDownloadManagerInitialized();
    return downloadManager.pauseDownload(downloadId);
  });

  // Resume a download
  ipcMain.handle('download:resume', (_: IpcMainInvokeEvent, downloadId: string) => {
    logToFile('INFO', `Resuming download: ${downloadId}`);
    ensureDownloadManagerInitialized();
    return downloadManager.resumeDownload(downloadId);
  });

  // Cancel a download
  ipcMain.handle('download:cancel', (_: IpcMainInvokeEvent, downloadId: string) => {
    logToFile('INFO', `Canceling download: ${downloadId}`);
    ensureDownloadManagerInitialized();
    return downloadManager.cancelDownload(downloadId);
  });

  // Remove a download from the list
  ipcMain.handle('download:remove', (_: IpcMainInvokeEvent, downloadId: string) => {
    logToFile('INFO', `Removing download: ${downloadId}`);
    ensureDownloadManagerInitialized();
    return downloadManager.removeDownload(downloadId);
  });

  // Get all downloads
  ipcMain.handle('download:getAll', () => {
    ensureDownloadManagerInitialized();
    return downloadManager.getAllDownloads();
  });

  // Get a download by ID
  ipcMain.handle('download:getById', (_: IpcMainInvokeEvent, downloadId: string) => {
    ensureDownloadManagerInitialized();
    return downloadManager.getDownload(downloadId);
  });

  // Get downloads by playlist ID
  ipcMain.handle('download:getByPlaylist', (_: IpcMainInvokeEvent, playlistId: string) => {
    ensureDownloadManagerInitialized();
    return downloadManager.getDownloadsByPlaylist(playlistId);
  });

  // Get downloads by status
  ipcMain.handle('download:getByStatus', (_: IpcMainInvokeEvent, status: string) => {
    ensureDownloadManagerInitialized();
    return downloadManager.getDownloadsByStatus(status as any);
  });

  // Get queue statistics
  ipcMain.handle('download:getQueueStats', () => {
    ensureDownloadManagerInitialized();
    return downloadManager.getQueueStats();
  });

  // Check if a video is available
  ipcMain.handle('download:checkVideoStatus', async (_: IpcMainInvokeEvent, videoUrl: string) => {
    logToFile('INFO', `Checking video status: ${videoUrl}`);
    return await ytDlpManager.checkVideoStatus(videoUrl);
  });
}
