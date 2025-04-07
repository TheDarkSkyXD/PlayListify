import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { downloadManager } from '../services/downloadManager/index';
import * as ytDlpManager from '../services/ytDlpManager';
import { logToFile } from '../services/logger';

// Helper function to ensure download manager is initialized
function ensureDownloadManagerInitialized() {
  if (!downloadManager.isInitialized()) {
    logToFile('INFO', 'Download manager not initialized, initializing now...');
    downloadManager.initialize();
  } else {
    logToFile('INFO', 'Download manager already initialized');
  }
}

/**
 * Register download manager IPC handlers
 */
export function registerDownloadHandlers(): void {
  // Make sure the download manager is initialized
  ensureDownloadManagerInitialized();
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
      playlistName: string,
      customLocation?: string,
      createPlaylistFolder: boolean = true
    ) => {
      logToFile('INFO', '=== DOWNLOAD HANDLERS ADD MULTIPLE TO QUEUE START ===');
      try {
        logToFile('INFO', `IPC: download:addMultipleToQueue called with ${videos.length} videos for playlist ${playlistName}`);
        logToFile('INFO', `Custom location: ${customLocation || 'Not specified'}`);
        logToFile('INFO', `Create playlist folder: ${createPlaylistFolder}`);

        // Log the first few videos for debugging
        if (videos.length > 0) {
          const firstFew = videos.slice(0, Math.min(3, videos.length));
          firstFew.forEach(video => {
            logToFile('INFO', `Video to download: ${video.title} (${video.videoId}) - URL: ${video.url}`);
          });
        } else {
          logToFile('WARN', 'No videos to download!');
        }

        ensureDownloadManagerInitialized();

        // Check if the download manager is initialized
        if (!downloadManager.isInitialized()) {
          logToFile('ERROR', 'Download manager is not initialized after ensureDownloadManagerInitialized call!');
          return [];
        }

        // Check if videos array is valid
        if (!Array.isArray(videos) || videos.length === 0) {
          logToFile('ERROR', 'Invalid videos array provided to addMultipleToQueue');
          return [];
        }

        const downloadIds = await downloadManager.addMultipleToQueue(
          videos,
          playlistId,
          playlistName,
          customLocation,
          createPlaylistFolder
        );

        logToFile('INFO', `IPC: download:addMultipleToQueue returning ${downloadIds.length} download IDs`);

        // Verify the downloads were added to the download manager
        const allDownloads = downloadManager.getAllDownloads();
        logToFile('INFO', `Current downloads in manager: ${allDownloads.length}`);

        // Log the first few downloads for debugging
        if (allDownloads.length > 0) {
          const firstFew = allDownloads.slice(0, Math.min(3, allDownloads.length));
          firstFew.forEach(download => {
            logToFile('INFO', `Download in manager: ${download.id}, Title: ${download.title}, Status: ${download.status}`);
          });
        }

        // Force send download updates to the renderer for each download
        // This ensures the frontend is aware of all downloads
        if (allDownloads.length > 0) {
          logToFile('INFO', 'Forcing download updates to renderer for all downloads');
          allDownloads.forEach(download => {
            downloadManager.sendDownloadUpdate(download);
          });
        }

        logToFile('INFO', '=== DOWNLOAD HANDLERS ADD MULTIPLE TO QUEUE COMPLETE ===');
        return downloadIds;
      } catch (error) {
        logToFile('ERROR', `Error in download:addMultipleToQueue: ${error}`);
        logToFile('INFO', '=== DOWNLOAD HANDLERS ADD MULTIPLE TO QUEUE ERROR ===');
        return [];
      }
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
    logToFile('INFO', '=== DOWNLOAD HANDLERS GET ALL START ===');
    logToFile('INFO', 'IPC: download:getAll called');
    ensureDownloadManagerInitialized();

    // Check if the download manager is initialized
    if (!downloadManager.isInitialized()) {
      logToFile('ERROR', 'Download manager is not initialized after ensureDownloadManagerInitialized call!');
      return [];
    }

    const downloads = downloadManager.getAllDownloads();
    logToFile('INFO', `IPC: download:getAll returning ${downloads.length} downloads`);

    // Log the first few downloads for debugging
    if (downloads.length > 0) {
      const firstFew = downloads.slice(0, Math.min(3, downloads.length));
      firstFew.forEach(download => {
        logToFile('INFO', `Download: ${download.id}, Title: ${download.title}, Status: ${download.status}, Progress: ${download.progress}`);
      });
    } else {
      logToFile('WARN', 'No downloads found in the download manager');

      // Check the internal state of the download manager
      logToFile('INFO', `Download manager downloads map size: ${downloadManager.getDownloadsMapSize()}`);
    }

    logToFile('INFO', '=== DOWNLOAD HANDLERS GET ALL COMPLETE ===');
    return downloads;
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
