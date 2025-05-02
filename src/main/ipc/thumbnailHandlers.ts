import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import thumbnailService from '../services/thumbnailService';
import logger from '../services/logService';

// Register thumbnail-related IPC handlers
export const registerThumbnailHandlers = (): void => {
  // Fetch thumbnail as data URL
  ipcMain.handle(
    IPC_CHANNELS.THUMBNAIL_FETCH,
    async (_, { url }: { url: string }) => {
      logger.debug(`Fetching thumbnail as data URL: ${url}`);
      try {
        // If this is a YouTube video thumbnail, try multiple resolutions if needed
        if (url.includes('youtube.com/vi/') || url.includes('ytimg.com')) {
          const videoId = thumbnailService.extractVideoIdFromThumbnail(url);
          if (videoId) {
            const thumbnailUrls = thumbnailService.getYouTubeThumbnailUrls(videoId);
            
            // Try each thumbnail URL in sequence until one works
            for (const thumbnailUrl of thumbnailUrls) {
              try {
                const dataUrl = await thumbnailService.fetchImageAsDataUrl(thumbnailUrl);
                return { success: true, dataUrl };
              } catch (error) {
                logger.debug(`Failed to fetch thumbnail ${thumbnailUrl}: ${error}`);
                // Continue to the next URL
              }
            }
            // If all attempts failed, throw error to use fallback
            throw new Error('All thumbnail URLs failed');
          }
        }
        
        // If not a YouTube URL or video ID extraction failed, try direct URL
        const dataUrl = await thumbnailService.fetchImageAsDataUrl(url);
        return { success: true, dataUrl };
      } catch (error) {
        logger.error(`Failed to fetch thumbnail: ${error}`);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }
  );
}; 