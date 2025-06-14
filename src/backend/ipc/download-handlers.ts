// src/backend/ipc/download-handlers.ts
import { ipcMain } from 'electron';
import type { IpcResponse, DownloadItem, Video, DownloadRequest } from '../../shared/types';
// Assume a DownloadManager service will exist
// import { downloadManager } from '../services/downloadManager'; // Placeholder

export function registerDownloadHandlers(): void {
  ipcMain.handle(
    'download-video',
    async (event, request: DownloadRequest): Promise<IpcResponse<DownloadItem>> => {
      try {
        console.log('IPC: download-video request received:', request);
        // const downloadItem = await downloadManager.addToQueue(
        //   request.video.url,
        //   request.video.id,
        //   request.video.title,
        //   // request.outputDir, // This would come from settingsService.get('downloadLocation') + playlistName (if any)
        //   { format: request.format, quality: request.quality },
        //   request.playlistId,
        //   request.video.thumbnailUrl
        // );
        // For now, return a placeholder until downloadManager is integrated
        const placeholderItem: DownloadItem = {
          id: `fake-dl-${Date.now()}`,
          videoId: request.video.id,
          playlistId: request.playlistId,
          title: request.video.title,
          thumbnailUrl: request.video.thumbnailUrl,
          status: 'queued',
          progress: 0,
          format: request.format || 'mp4',
          quality: request.quality || '1080p',
          addedAt: new Date().toISOString(),
        };
        return { success: true, data: placeholderItem };
      } catch (error: any) {
        console.error('Error handling download-video request:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to initiate video download.',
            code: 'DOWNLOAD_VIDEO_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'get-download-queue',
    async (): Promise<IpcResponse<DownloadItem[]>> => {
      try {
        // const queue = downloadManager.getQueue();
        // For now, return an empty array
        return { success: true, data: [] };
      } catch (error: any) {
        console.error('Error getting download queue:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to get download queue.',
            code: 'GET_QUEUE_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'pause-download',
    async (event, downloadId: string): Promise<IpcResponse<boolean>> => {
      try {
        // await downloadManager.pauseDownload(downloadId);
        console.log(`IPC: pause-download request for ${downloadId}`);
        return { success: true, data: true }; // Placeholder
      } catch (error: any) {
        console.error(`Error pausing download ${downloadId}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to pause download ${downloadId}.`,
            code: 'PAUSE_DOWNLOAD_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'resume-download',
    async (event, downloadId: string): Promise<IpcResponse<boolean>> => {
      try {
        // await downloadManager.resumeDownload(downloadId);
        console.log(`IPC: resume-download request for ${downloadId}`);
        return { success: true, data: true }; // Placeholder
      } catch (error: any) {
        console.error(`Error resuming download ${downloadId}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to resume download ${downloadId}.`,
            code: 'RESUME_DOWNLOAD_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'cancel-download',
    async (event, downloadId: string): Promise<IpcResponse<boolean>> => {
      try {
        // await downloadManager.cancelDownload(downloadId);
        console.log(`IPC: cancel-download request for ${downloadId}`);
        return { success: true, data: true }; // Placeholder
      } catch (error: any) {
        console.error(`Error cancelling download ${downloadId}:`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to cancel download ${downloadId}.`,
            code: 'CANCEL_DOWNLOAD_ERROR',
          },
        };
      }
    }
  );
  
  // Handler to clear completed/failed downloads
  ipcMain.handle(
    'clear-finished-downloads',
    async (): Promise<IpcResponse<boolean>> => {
      try {
        // await downloadManager.clearFinished();
        console.log('IPC: clear-finished-downloads request');
        return { success: true, data: true }; // Placeholder
      } catch (error: any) {
        console.error('Error clearing finished downloads:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to clear finished downloads.',
            code: 'CLEAR_FINISHED_ERROR',
          },
        };
      }
    }
  );

  console.log('Download IPC handlers registered.');
}