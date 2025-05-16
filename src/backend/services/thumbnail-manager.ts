import { IpcResponse } from '../../shared/types';
import path from 'path';
import fs from 'fs-extra'; // Use fs-extra for ensureDir and streams
import { app } from 'electron'; // To get user data path
import { pipeline } from 'node:stream/promises'; // For piping streams safely
import { Readable } from 'node:stream'; // Import Node.js Readable
import { logger } from '../utils/logger'; // Import logger

const THUMBNAIL_CACHE_DIR = path.join(app.getPath('userData'), 'thumbnails');

// Define standard YouTube thumbnail filenames in order of preference/quality
const YT_THUMBNAIL_FILES = [
  'maxresdefault.jpg', // May not always exist
  'sddefault.jpg',     // Standard definition
  'hqdefault.jpg',     // High quality
  'mqdefault.jpg',     // Medium quality
  'default.jpg',       // Low quality (guaranteed to exist)
];

// Helper to generate YouTube thumbnail URLs
function generateYtThumbnailUrl(videoId: string, filename: string): string {
  return `https://i.ytimg.com/vi/${videoId}/${filename}`;
}

// Helper to safely get file extension
function getFileExtension(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const ext = path.extname(parsedUrl.pathname).toLowerCase();
    // Basic validation for common image types
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return ext;
    }
  } catch (error) {
    logger.warn('[ThumbnailManager] Could not parse URL to get extension:', url, error);
  }
  return '.jpg'; // Default to .jpg
}

// This service would handle fetching/generating and caching thumbnails.
// For fetching, it might use yt-dlp to get a thumbnail URL or download the thumbnail.
// For caching, it might store them locally and return file paths or base64 strings.

export async function getThumbnailForVideo(
  videoId: string,
  thumbnailUrl?: string | null
): Promise<IpcResponse<string | null>> {
  logger.info('[ThumbnailManager] getThumbnailForVideo called (currently NO-OP for previews) for video ID:', videoId, 'URL:', thumbnailUrl);
  
  /*
  // Logic for downloading and caching thumbnails is currently bypassed for previews.
  // This will be re-evaluated when implementing video download functionality.

  // Original logic:
  logger.debug(\'[ThumbnailManager] Received thumbnail URL:\', thumbnailUrl);

  if (!thumbnailUrl) {
    logger.warn(\'[ThumbnailManager] No thumbnail URL provided for video:\', videoId);
    return { success: false, data: null, error: \'No thumbnail URL provided.\' };
  }

  try {
    await fs.ensureDir(THUMBNAIL_CACHE_DIR);
    logger.debug(\'[ThumbnailManager] Ensured cache directory exists:\', THUMBNAIL_CACHE_DIR);

    const fileExtension = getFileExtension(thumbnailUrl);
    const cachedFilePath = path.join(THUMBNAIL_CACHE_DIR, `${videoId}${fileExtension}`);
    logger.debug(\'[ThumbnailManager] Target cache path:\', cachedFilePath);

    if (await fs.pathExists(cachedFilePath)) {
      logger.info(\'[ThumbnailManager] Thumbnail found in cache for video ID:\', videoId, cachedFilePath);
      return { success: true, data: cachedFilePath };
    }

    logger.info(\'[ThumbnailManager] Thumbnail not cached. Attempting downloads...\');
    
    let response: Response | null = null;
    let downloadedFromUrl: string | null = thumbnailUrl;
    let foundThumbnail = false;

    if (downloadedFromUrl) {
        try {
            logger.debug(\'[ThumbnailManager] Trying initial URL:\', downloadedFromUrl);
            response = await fetch(downloadedFromUrl);
            if (response.ok && response.body) {
                foundThumbnail = true;
            } else if (response.status === 404) {
                logger.warn(`[ThumbnailManager] Initial URL (${downloadedFromUrl}) returned 404. Trying fallbacks.`);
                response = null;
            } else {
                throw new Error(`Failed to download thumbnail: ${response.status} ${response.statusText}`);
            }
        } catch (fetchError: any) {
             logger.error(\'[ThumbnailManager] Error fetching initial thumbnail URL:\', downloadedFromUrl, fetchError);
             response = null;
        }
    }

    if (!foundThumbnail) {
      downloadedFromUrl = null;
      for (const filename of YT_THUMBNAIL_FILES) {
        const fallbackUrl = generateYtThumbnailUrl(videoId, filename);
        logger.debug(\'[ThumbnailManager] Trying fallback URL:\', fallbackUrl);
        try {
          response = await fetch(fallbackUrl);
          if (response.ok && response.body) {
            logger.info(\'[ThumbnailManager] Found working thumbnail URL via fallback:\', fallbackUrl);
            downloadedFromUrl = fallbackUrl;
            foundThumbnail = true;
            break;
          }
          logger.warn(`[ThumbnailManager] Fallback URL ${fallbackUrl} failed with status ${response.status}`);
        } catch (fallbackError: any) {
          logger.error(\'[ThumbnailManager] Error fetching fallback thumbnail URL:\', fallbackUrl, fallbackError);
        }
      }
    }

    if (!foundThumbnail || !response || !response.body || !downloadedFromUrl) {
      logger.error(\'[ThumbnailManager] All thumbnail download attempts failed for video ID:\', videoId);
      throw new Error(\'Failed to download thumbnail after trying all fallbacks.\');
    }

    logger.info(\'[ThumbnailManager] Downloading from confirmed URL:\', downloadedFromUrl);
    const fileWriteStream = fs.createWriteStream(cachedFilePath);
    const reader = response.body.getReader();
    const nodeReadable = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        } catch (err) {
          this.destroy(err as Error);
        }
      }
    });

    await pipeline(nodeReadable, fileWriteStream);

    logger.info(\'[ThumbnailManager] Successfully downloaded and cached thumbnail:\', cachedFilePath);
    return { success: true, data: cachedFilePath };

  } catch (error: any) {
    logger.error(\'[ThumbnailManager] Error processing thumbnail for video ID\', videoId, error);
    return { success: false, data: null, error: error.message || \'Failed to process thumbnail\' };
  }
  */
  
  // Return a placeholder indicating no operation for now, matching expected type.
  return { success: true, data: null, message: 'Thumbnail processing deferred.' };
}

/**
 * Gets a representative thumbnail for a playlist.
 * @param playlistId The ID of the playlist.
 * @returns Promise<IpcResponse<string | null>> Path to the thumbnail or null.
 */
export async function getThumbnailForPlaylist(playlistId: string): Promise<IpcResponse<string | null>> {
  logger.info('[ThumbnailManager] getThumbnailForPlaylist called for playlist ID:', playlistId);
  // TODO: Implement playlist thumbnail logic:
  // 1. Fetch playlist details (e.g., from playlist-manager.ts) to get its videos.
  // 2. Pick a video (e.g., the first one) and get its thumbnail using getThumbnailForVideo.
  // 3. Or, if playlists can have their own custom thumbnails, check for that.

  // For now, return null as it's not implemented
  return { success: true, data: null, message: 'Playlist thumbnail retrieval not implemented yet.' };
}

/**
 * Clears the local thumbnail cache directory.
 * @returns Promise<IpcResponse<void>>
 */
export async function clearThumbnailCache(): Promise<IpcResponse<void>> {
  logger.info('[ThumbnailManager] clearThumbnailCache called');
  try {
    // Cache path is currently fixed, defined by THUMBNAIL_CACHE_DIR.
    // If dynamic paths based on settings are needed later, this logic would change.
    await fs.emptyDir(THUMBNAIL_CACHE_DIR); // Use fs-extra's emptyDir
    logger.info('[ThumbnailManager] Thumbnail cache cleared successfully at:', THUMBNAIL_CACHE_DIR);
    return { success: true };
  } catch (error: any) {
    // Log specific error if possible (e.g., permissions)
    let errorMessage = 'Failed to clear cache';
    if (error.code === 'EACCES') {
      errorMessage = 'Permission denied when trying to clear cache';
      logger.error(`[ThumbnailManager] ${errorMessage} at ${THUMBNAIL_CACHE_DIR}`, error);
    } else {
      logger.error('[ThumbnailManager] Failed to clear thumbnail cache:', error);
    }
    return { success: false, error: `${errorMessage}: ${error.message}` };
  }
}

// Ensure the cache directory exists on startup (optional, handled by getThumbnailForVideo currently)
// fs.ensureDirSync(THUMBNAIL_CACHE_DIR); 
// logger.info('[ThumbnailManager] Cache directory ensured at:', THUMBNAIL_CACHE_DIR); 