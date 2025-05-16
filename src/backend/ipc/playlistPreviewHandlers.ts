import { ipcMain } from 'electron';
import { fetchYouTubePlaylistPreview } from '../services/youtube-playlist-preview-service';
import { logger } from '../utils/logger';

export function registerPlaylistPreviewHandlers() {
  ipcMain.handle('yt-playlist-preview:fetch', async (event, playlistUrl: string, overrideArgs?: string[]) => {
    logger.info(`[IPC] Received 'yt-playlist-preview:fetch' for URL: ${playlistUrl}`);
    try {
      const previewData = await fetchYouTubePlaylistPreview(playlistUrl, overrideArgs || []);
      if (previewData) {
        return { success: true, data: previewData };
      } else {
        // If previewData is null, it means the service handled the error logging and determined no data could be returned.
        // The service itself might have logged more specific errors.
        logger.warn(`[IPC] 'yt-playlist-preview:fetch' for ${playlistUrl} returned null data from service.`);
        return { success: false, error: 'Failed to fetch playlist preview. See backend logs for details.' };
      }
    } catch (error: any) {
      logger.error(`[IPC] Unexpected error in 'yt-playlist-preview:fetch' for ${playlistUrl}: ${error.message}`, error);
      return { success: false, error: error.message || 'An unexpected error occurred while fetching playlist preview.' };
    }
  });
  logger.info('[IPC] Registered YouTube playlist preview handlers.');
} 