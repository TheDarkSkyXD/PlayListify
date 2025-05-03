import { ipcMain, dialog } from 'electron';
import { z } from 'zod';
import downloadService, { FormatSelection } from '../services/downloadService';
import logger from '../services/logService';
import { v4 as uuidv4 } from 'uuid';

// Define the interface for download options
interface DownloadOptions {
  videoId: string;
  formatId?: string;
  quality?: 'best' | 'worst' | '1080p' | '720p' | '480p' | '360p' | 'audio';
  downloadPath?: string;
  filename?: string;
  audioOnly?: boolean;
}

interface PlaylistDownloadOptions {
  playlistId: string;
  formatId?: string;
  quality?: 'best' | 'worst' | '1080p' | '720p' | '480p' | '360p' | 'audio';
  downloadPath?: string;
  audioOnly?: boolean;
}

// Schemas for validation
const videoUrlSchema = z.string().url();

const startVideoDownloadSchema = z.object({
  videoId: z.string(),
  formatId: z.string().optional(),
  quality: z.enum(['best', 'worst', '1080p', '720p', '480p', '360p', 'audio']).optional(),
  downloadPath: z.string().optional(),
  filename: z.string().optional(),
  audioOnly: z.boolean().optional()
});

const startPlaylistDownloadSchema = z.object({
  playlistId: z.string(),
  formatId: z.string().optional(),
  quality: z.enum(['best', 'worst', '1080p', '720p', '480p', '360p', 'audio']).optional(),
  downloadPath: z.string().optional(),
  audioOnly: z.boolean().optional()
});

// Helper function to handle errors safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Register all download-related handlers
export function registerDownloadHandlers() {
  // Get available formats for a video
  ipcMain.handle('download:get-formats', async (event, videoUrl: string) => {
    try {
      // Validate the video URL
      videoUrlSchema.parse(videoUrl);
      
      logger.info(`Getting formats for ${videoUrl}`);
      const formats = await downloadService.getFormats(videoUrl);
      
      return { success: true, data: formats };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get formats: ${errorMessage}`, { error });
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid video URL' 
          : `Failed to get formats: ${errorMessage}`
      };
    }
  });

  // Start downloading a single video
  ipcMain.handle('download:start-video', async (event, options: DownloadOptions) => {
    try {
      // Validate options
      const validatedOptions = startVideoDownloadSchema.parse(options);
      
      logger.info(`Starting download for video ${validatedOptions.videoId}`);
      // Use downloadVideo method which exists in the service
      const downloadId = uuidv4(); // Generate a new download ID
      await downloadService.downloadVideo(
        downloadId,
        validatedOptions.videoId,
        validatedOptions.formatId || 'best',
        validatedOptions.quality || 'best'
      );
      
      return { success: true, data: { downloadId } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to start video download: ${errorMessage}`, { error });
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid download options' 
          : `Failed to start download: ${errorMessage}`
      };
    }
  });

  // Start downloading all videos in a playlist
  ipcMain.handle('download:start-playlist', async (event, options: PlaylistDownloadOptions) => {
    try {
      // Validate options
      const validatedOptions = startPlaylistDownloadSchema.parse(options);
      const { playlistId } = validatedOptions;
      
      logger.info(`Starting download for playlist ${playlistId}`);
      // Use downloadPlaylist method which exists in the service
      const downloadIds = await downloadService.downloadPlaylist(
        playlistId,
        validatedOptions.formatId || 'best',
        validatedOptions.quality || 'best'
      );
      
      return { success: true, data: { downloadIds } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to start playlist download: ${errorMessage}`, { error });
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid download options' 
          : `Failed to start download: ${errorMessage}`
      };
    }
  });

  // Get current download queue status
  ipcMain.handle('download:get-queue', async () => {
    try {
      const queueStatus = await downloadService.getQueueStatus();
      return { success: true, data: queueStatus };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get queue status: ${errorMessage}`, { error });
      return { success: false, error: `Failed to get queue status: ${errorMessage}` };
    }
  });

  // Additional handler with the name used by the hook
  ipcMain.handle('download:get-queue-status', async () => {
    try {
      const queueStatus = await downloadService.getQueueStatus();
      return { success: true, data: queueStatus };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get queue status: ${errorMessage}`, { error });
      return { success: false, error: `Failed to get queue status: ${errorMessage}` };
    }
  });

  // Cancel a download
  ipcMain.handle('download:cancel', async (event, downloadId: string) => {
    try {
      await downloadService.cancelDownload(downloadId);
      return { success: true, data: { cancelled: true } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to cancel download: ${errorMessage}`, { error });
      return { success: false, error: `Failed to cancel download: ${errorMessage}` };
    }
  });

  // Retry a failed download
  ipcMain.handle('download:retry', async (event, downloadId: string) => {
    try {
      await downloadService.retryDownload(downloadId);
      return { success: true, data: { retried: true } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to retry download: ${errorMessage}`, { error });
      return { success: false, error: `Failed to retry download: ${errorMessage}` };
    }
  });

  // Select download directory
  ipcMain.handle('download:select-directory', async (event) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Download Location'
      });
      
      if (canceled) {
        return { success: false, data: null };
      }
      
      return { success: true, data: { path: filePaths[0] } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to select directory: ${errorMessage}`, { error });
      return { success: false, error: `Failed to select directory: ${errorMessage}` };
    }
  });
}

export default registerDownloadHandlers; 