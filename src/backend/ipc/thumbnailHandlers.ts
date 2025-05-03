import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import thumbnailService from '../services/thumbnailService';
import logger from '../services/logService';
import fs from 'fs-extra';
import path from 'path';

// Persistent storage for failed video IDs
const FAILED_IDS_FILE = path.join(app.getPath('userData'), 'failed-thumbnail-ids.json');

// Cache of failed video IDs to reduce logging noise
let failedVideoIds = new Set<string>();

// Load failed video IDs from persistent storage
const loadFailedVideoIds = async (): Promise<void> => {
  try {
    if (await fs.pathExists(FAILED_IDS_FILE)) {
      const data = await fs.readJson(FAILED_IDS_FILE);
      if (Array.isArray(data)) {
        failedVideoIds = new Set(data);
        logger.debug(`Loaded ${failedVideoIds.size} failed video IDs from storage`);
      }
    }
  } catch (error) {
    logger.warn(`Failed to load failed video IDs: ${error}`);
  }
};

// Save failed video IDs to persistent storage
const saveFailedVideoIds = async (): Promise<void> => {
  try {
    await fs.writeJson(FAILED_IDS_FILE, Array.from(failedVideoIds));
  } catch (error) {
    logger.warn(`Failed to save failed video IDs: ${error}`);
  }
};

// Add a video ID to the failed list and persist it
const addFailedVideoId = async (videoId: string): Promise<void> => {
  if (!videoId || failedVideoIds.has(videoId)) return;
  
  failedVideoIds.add(videoId);
  await saveFailedVideoIds();
};

// Initialize failed video IDs
loadFailedVideoIds().catch(error => 
  logger.error(`Error initializing failed video IDs: ${error}`)
);

// Add IPC channel for synchronizing failed IDs with renderer process
ipcMain.handle(
  IPC_CHANNELS.SYNC_FAILED_THUMBNAIL_IDS,
  async (_, ids: string[]) => {
    // Merge IDs from renderer with our list
    if (Array.isArray(ids)) {
      ids.forEach(id => failedVideoIds.add(id));
      await saveFailedVideoIds();
    }
    
    // Return current list of failed IDs
    return Array.from(failedVideoIds);
  }
);

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
            // Check if this video ID is already known to fail
            if (failedVideoIds.has(videoId)) {
              // Don't log errors for known-failed video IDs to reduce noise
              return { 
                success: false, 
                error: `Video ID ${videoId} is known to be unavailable` 
              };
            }
            
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
            
            // Limit to max 2 attempts to reduce API calls for likely-failing videos
            const maxAttempts = 2;
            const urlsToTry = orderedThumbnailUrls.slice(0, maxAttempts);
            
            // Try each thumbnail URL in sequence until one works
            for (const thumbnailUrl of urlsToTry) {
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
            // Add to failed video IDs set to prevent future logging
            await addFailedVideoId(videoId);
            
            // Only log at warning level instead of error to reduce noise
            logger.warn(`All YouTube thumbnail formats failed for video ID: ${videoId}`);
            return { 
              success: false, 
              error: `Failed to fetch thumbnail for video ID ${videoId}` 
            };
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