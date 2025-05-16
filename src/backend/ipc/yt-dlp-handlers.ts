import { ipcMain } from 'electron';
import YTDlpWrap from 'yt-dlp-wrap'; // Import YTDlpWrap
import {
  IPC_CHANNELS,
  // Ensure this matches the actual structure if it's an object/enum
} from '../../shared/constants/ipc-channels';
import type { IpcResponse, PlaylistPreviewData, PlaylistEntryPreview } from '../../shared/types'; // Assuming DownloadVideoOptions might be here or in a dedicated file
// Import shared types directly
import type { YtDlpFullPlaylistRawData, YtDlpVideoInfoRaw } from '../../shared/types/yt-dlp'; // Changed YtDlpPlaylistMetadataRaw
import { 
  getPlaylistMetadata, 
  getVideoMetadata, // Ensure this is correctly imported
  getYtDlpInstance, // Import getYtDlpInstance
  // YtDlpPlaylistMetadataRaw, // Removed from here
  // downloadVideo as ytDlpDownloadVideo, // Assuming this is for YTDLP_DOWNLOAD_VIDEO
  // YTDlpDownloadOptions, // Assuming this is for YTDLP_DOWNLOAD_VIDEO
} from '../services/ytDlpManager';
import { fetchYouTubePlaylistPreview } from '../services/youtube-playlist-preview-service'; // Import the new service
import { fetchYouTubeVideoPreview } from '../services/youtube-video-preview-service'; // Import the video preview service
import { logger } from '../utils/logger';
import { ProcessedPlaylistMetadata } from '../../shared/types/yt-dlp'; // Changed YtDlpPlaylistMetadata to ProcessedPlaylistMetadata

// If DownloadVideoOptions is specific to YTDLP_DOWNLOAD_VIDEO, ensure it's correctly typed/imported for that handler
type DownloadVideoOptions = any; // Placeholder if not immediately found, should be replaced with actual type

// Define ThumbnailDetail based on its usage as an inline type within YtDlpVideoInfoRaw
// This is used for typing parameters in sort functions for thumbnail arrays.
type ThumbnailDetail = {
  url: string;
  preference?: number;
  id?: string;
  height?: number;
  width?: number;
  resolution?: string;
};

export function registerYtDlpHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.YTDLP_GET_PLAYLIST_METADATA, async (_event, playlistUrl: string, _maxItems?: number): Promise<IpcResponse<YtDlpVideoInfoRaw[]>> => {
    logger.info(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Received request for URL: ${playlistUrl}`);
    try {
      const playlistData: ProcessedPlaylistMetadata | null = await getPlaylistMetadata(playlistUrl /*, pass overrideArgs here if needed [] */);
      
      if (!playlistData) {
        logger.warn(`[IPC:YTDLP_GET_PLAYLIST_METADATA] No metadata returned for URL: ${playlistUrl}`);
        return { success: false, error: 'No playlist metadata found.', data: [] };
      }

      const videoEntries = Array.isArray(playlistData.entries) ? playlistData.entries : [];
      logger.info(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Successfully fetched ${videoEntries.length} metadata entries for URL: ${playlistUrl}`);
      return { success: true, data: videoEntries };
    } catch (error: any) {
      logger.error(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Error: ${error.message}`);
      return { success: false, error: error.message || 'Failed to fetch playlist metadata from yt-dlp', data: [] };
    }
  });

  ipcMain.handle(IPC_CHANNELS.YTDLP_GET_QUICK_PLAYLIST_PREVIEW, async (_event, url: string): Promise<IpcResponse<PlaylistPreviewData>> => {
    logger.info(`[IPC Handler] YTDLP_GET_QUICK_PLAYLIST_PREVIEW received for URL: ${url}`);
    try {
      const previewData = await fetchYouTubePlaylistPreview(url);

      if (!previewData) {
        logger.warn(`[IPC Handler] No preview data returned from YouTubePlaylistPreviewService for ${url}`);
        return { success: false, error: 'Could not fetch playlist preview information.' };
      }

      logger.info(`[IPC Handler] Successfully prepared quick preview via service for ${previewData.title} (${previewData.id})`);
      return { success: true, data: previewData };

    } catch (error: any) {
      logger.error(`[IPC Handler] Error in YTDLP_GET_QUICK_PLAYLIST_PREVIEW for ${url}: ${error.message}`, error);
      // The service might return null for handled errors, or throw for unexpected ones.
      // This catch block handles errors thrown by the service or other unexpected issues.
      if (error.message && error.message.includes('This playlist type is unviewable')) {
        return { success: false, error: 'This type of YouTube playlist (e.g., Mixes or Radio) cannot be imported or previewed.' };
      }
      return { success: false, error: error.message || 'An unexpected error occurred while fetching playlist preview.' };
    }
  });

  // Handler for fetching single video metadata for preview
  ipcMain.handle(IPC_CHANNELS.GET_VIDEO_METADATA_FOR_PREVIEW, async (_event, videoUrl: string): Promise<IpcResponse<YtDlpVideoInfoRaw>> => {
    logger.info(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Received request for URL: ${videoUrl}`);
    
    // Input validation is handled by the service, but can also be here for an early exit.
    if (!videoUrl || typeof videoUrl !== 'string') {
      logger.warn('[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Invalid videoUrl received.');
      return { success: false, error: 'Invalid video URL provided.' };
    }

    try {
      const metadata = await fetchYouTubeVideoPreview(videoUrl);
      
      if (metadata) {
        logger.info(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Successfully fetched metadata via service for: ${metadata.title}`);
        return { success: true, data: metadata };
      } else {
        // The service returns null on errors (e.g., yt-dlp error or no metadata found)
        logger.warn(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] No metadata returned from service for URL: ${videoUrl}`);
        return { success: false, error: 'No metadata found for the provided URL or an error occurred.' };
      }
    } catch (error: any) {
      // This catch is for unexpected errors not handled by the service returning null
      logger.error(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Unexpected error fetching metadata for ${videoUrl}: ${error.message}`);
      return { success: false, error: error.message || 'Failed to fetch video metadata for preview due to an unexpected error.' };
    }
  });

  // Placeholder for the existing YTDLP_DOWNLOAD_VIDEO handler to resolve linter error contextually
  ipcMain.handle(IPC_CHANNELS.YTDLP_DOWNLOAD_VIDEO, async (_event, options: DownloadVideoOptions) => {
    logger.info('[IPC:YTDLP_DOWNLOAD_VIDEO] Received request with options:', options ? Object.keys(options) : 'null');
    // Actual implementation for YTDLP_DOWNLOAD_VIDEO would go here.
    // For now, returning a placeholder response.
    return { success: false, error: 'YTDLP_DOWNLOAD_VIDEO handler not fully implemented in this refactor step.' };
  });

  // ... other handlers like YTDLP_CHECK_AVAILABILITY, YTDLP_GET_AVAILABLE_QUALITIES ...

  console.log('[IPC Handlers] yt-dlp handlers registered.');
} 