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
      // Only log the domain part of the URL to reduce log noise
      const urlForLogs = url ? new URL(url).hostname : 'invalid-url';
      logger.debug(`Fetching thumbnail from: ${urlForLogs}`);
      
      try {
        // Early rejection for invalid URLs
        if (!url || typeof url !== 'string' || !url.trim()) {
          logger.warn('Invalid thumbnail URL provided');
          throw new Error('Invalid or empty URL provided');
        }
        
        // Handle YouTube thumbnails with special logic
        if (url.includes('youtube.com/vi/') || url.includes('ytimg.com/vi') || url.includes('ytimg.com/vi_webp')) {
          // Extract video ID from URL
          const videoId = thumbnailService.extractVideoIdFromThumbnail(url);
          
          if (videoId) {
            logger.debug(`Processing YouTube thumbnail for video ID: ${videoId}`);
            
            // Get sorted list of thumbnail URLs to try
            const thumbnailUrls = thumbnailService.getYouTubeThumbnailUrls(videoId);
            
            // Prioritize thumbnail URLs based on the requested format
            // The goal is to try the most reliable formats first
            let orderedThumbnailUrls: string[] = [];
            
            // Determine the priority based on the URL format requested
            if (url.includes('hqdefault')) {
              // If hqdefault was requested (most reliable), try it and similar formats first
              orderedThumbnailUrls = [
                ...thumbnailUrls.filter(u => u.includes('hqdefault')),
                ...thumbnailUrls.filter(u => !u.includes('hqdefault') && !u.includes('maxresdefault'))
              ];
            } 
            else if (url.includes('mqdefault')) {
              // If mqdefault was requested, try it and similar formats first
              orderedThumbnailUrls = [
                ...thumbnailUrls.filter(u => u.includes('mqdefault')),
                ...thumbnailUrls.filter(u => u.includes('hqdefault')),
                ...thumbnailUrls.filter(u => !u.includes('mqdefault') && !u.includes('hqdefault') && !u.includes('maxresdefault'))
              ];
            }
            else if (url.includes('sddefault')) {
              // If sddefault was requested, try it, then hqdefault as a reliable fallback
              orderedThumbnailUrls = [
                ...thumbnailUrls.filter(u => u.includes('sddefault')),
                ...thumbnailUrls.filter(u => u.includes('hqdefault')),
                ...thumbnailUrls.filter(u => !u.includes('sddefault') && !u.includes('hqdefault') && !u.includes('maxresdefault'))
              ];
            }
            else if (url.includes('maxresdefault')) {
              // If maxresdefault was requested (less reliable), try more reliable formats first
              orderedThumbnailUrls = [
                ...thumbnailUrls.filter(u => u.includes('hqdefault')),
                ...thumbnailUrls.filter(u => u.includes('mqdefault')),
                ...thumbnailUrls.filter(u => u.includes('sddefault')),
                ...thumbnailUrls.filter(u => u.includes('maxresdefault'))
              ];
            }
            else {
              // Default ordering from most reliable to least reliable
              orderedThumbnailUrls = thumbnailUrls;
            }
            
            // Add the original URL as the first option if not already in the list
            // This respects the component's explicit request but still has fallbacks
            if (!orderedThumbnailUrls.includes(url)) {
              orderedThumbnailUrls.unshift(url);
            }
            
            // Remove duplicates that might have been introduced
            orderedThumbnailUrls = Array.from(new Set(orderedThumbnailUrls));
            
            let lastError = null;
            
            // Try each thumbnail URL in sequence until one works
            for (const thumbnailUrl of orderedThumbnailUrls) {
              try {
                // Don't log each attempt to keep logs clean
                const dataUrl = await thumbnailService.fetchImageAsDataUrl(thumbnailUrl);
                logger.debug(`Successfully fetched YouTube thumbnail for video ID: ${videoId}`);
                return { success: true, dataUrl };
              } catch (error) {
                lastError = error;
                // Don't log each failure to reduce noise
                // Continue to the next URL
              }
            }
            
            // If all attempts failed
            const errorMsg = `All YouTube thumbnail formats failed for video ID: ${videoId}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
          } else {
            logger.warn(`Could not extract video ID from YouTube thumbnail URL`);
          }
        }
        
        // For non-YouTube URLs or when video ID extraction failed, try direct URL
        const dataUrl = await thumbnailService.fetchImageAsDataUrl(url);
        return { success: true, dataUrl };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to fetch thumbnail: ${errorMsg}`);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
    }
  );
}; 