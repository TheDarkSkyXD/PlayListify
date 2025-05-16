import { getVideoMetadata } from './ytDlpManager';
import { logger } from '../utils/logger';
import { YtDlpVideoInfoRaw } from '../../shared/types/yt-dlp';
// The frontend for "Add Video to Playlist" dialog uses YtDlpVideoInfoRaw for preview
// so we can directly return that type if getVideoMetadata provides it.

export function cleanYouTubeVideoUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if ((parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') && parsedUrl.pathname === '/watch') {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) {
        logger.debug(`[YouTubeVideoPreviewService] Cleaning URL. Original: ${url}, Cleaned: https://www.youtube.com/watch?v=${videoId}`);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } else if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.substring(1); // Remove leading '/'
      if (videoId) {
        logger.debug(`[YouTubeVideoPreviewService] Cleaning youtu.be URL. Original: ${url}, Cleaned: https://www.youtube.com/watch?v=${videoId}`);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
  } catch (e) {
    logger.warn(`[YouTubeVideoPreviewService] Failed to parse or clean URL: ${url}`, e);
    // Fallback to original URL if parsing/cleaning fails
  }
  return url; // Return original if not a recognized YouTube video URL or if cleaning fails
}

export async function fetchYouTubeVideoPreview(videoUrl: string): Promise<YtDlpVideoInfoRaw | null> {
  logger.info(`[YouTubeVideoPreviewService] Fetching video preview for raw URL: ${videoUrl}`);
  
  if (!videoUrl || typeof videoUrl !== 'string') {
    logger.warn('[YouTubeVideoPreviewService] Invalid videoUrl received.');
    return null;
  }

  const cleanedVideoUrl = cleanYouTubeVideoUrl(videoUrl);
  // No change in logging here as getVideoMetadata will log the URL it receives.

  try {
    const metadata = await getVideoMetadata(cleanedVideoUrl);
    
    if (metadata) {
      logger.info(`[YouTubeVideoPreviewService] Successfully fetched metadata for: ${metadata.title} (using URL: ${cleanedVideoUrl})`);
      return metadata;
    } else {
      logger.warn(`[YouTubeVideoPreviewService] No metadata returned for cleaned URL: ${cleanedVideoUrl} (original: ${videoUrl})`);
      return null;
    }
  } catch (error: any) {
    logger.error(`[YouTubeVideoPreviewService] Error fetching video metadata for cleaned URL ${cleanedVideoUrl} (original: ${videoUrl}): ${error.message}`, error);
    return null;
  }
} 