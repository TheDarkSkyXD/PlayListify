import { 
  simplifyPlaylistUrl,
  ensureYtDlpBinaryIsReady,
  fetchPlaylistShellInfoWithYtDlp,
  fetchPlaylistVideoDurationsWithYtDlp,
  getBestThumbnail
} from './ytDlpManager';
import { logger } from '../utils/logger';
import { YtDlpFlatPlaylistInfo } from '../../shared/types/yt-dlp'; // YtDlpFlatPlaylistInfo is needed
import { PlaylistPreviewData } from '../../shared/types';

// Define ThumbnailDetail based on its usage as an inline type within YtDlpVideoInfoRaw
// This is used for typing parameters in sort functions for thumbnail arrays.
type ThumbnailDetail = { // This type is also defined in ytDlpManager, consider moving to shared types if not already
  url: string;
  preference?: number;
  id?: string;
  height?: number;
  width?: number;
  resolution?: string;
};

export async function fetchYouTubePlaylistPreview(playlistUrl: string, overrideArgs: string[] = []): Promise<PlaylistPreviewData | null> {
  logger.info(`[YouTubePlaylistPreviewService] Fetching quick preview for URL: ${playlistUrl}`);
  const functionStartTime = performance.now();

  try {
    const simplifiedUrl = simplifyPlaylistUrl(playlistUrl);
    const { ytDlpInstance, ytDlpBinaryPath } = await ensureYtDlpBinaryIsReady();

    // Perform calls concurrently
    const [shellInfoResult, durationsResult] = await Promise.all([
      fetchPlaylistShellInfoWithYtDlp(simplifiedUrl, overrideArgs, ytDlpInstance, ytDlpBinaryPath),
      fetchPlaylistVideoDurationsWithYtDlp(simplifiedUrl, ytDlpInstance, ytDlpBinaryPath) // overrideArgs not typically needed for duration print
    ]);

    if (!shellInfoResult && (!durationsResult || durationsResult.videoCountFromDurations === 0)) {
      logger.warn(`[YouTubePlaylistPreviewService] Both shell info and duration fetching failed or yielded no data for ${simplifiedUrl}`);
      return null;
    }

    let totalDurationSec = 0;
    let videoCount = 0;
    let isDurationApproximate = !durationsResult?.isDurationSummationComplete; // If undefined, it's approximate

    if (durationsResult) {
      totalDurationSec = durationsResult.durations.reduce((acc, dur) => acc + dur, 0);
      videoCount = durationsResult.videoCountFromDurations;
    }
    
    // Use shellInfo for primary metadata and override videoCount if shell info has a more reliable count
    const playlistId = shellInfoResult?.id || simplifiedUrl;
    const title = shellInfoResult?.title || 'Unknown Playlist';
    const uploader = shellInfoResult?.uploader || shellInfoResult?.channel;
    const webpage_url = shellInfoResult?.webpage_url;
    
    let bestThumbnailUrl: string | undefined = undefined;
    if (shellInfoResult?.thumbnails && shellInfoResult.thumbnails.length > 0) {
      bestThumbnailUrl = getBestThumbnail(shellInfoResult.thumbnails as ThumbnailDetail[]);
    }
    if (!bestThumbnailUrl && shellInfoResult?.thumbnail) { // Fallback to single thumbnail string
      bestThumbnailUrl = shellInfoResult.thumbnail;
    }

    // Consolidate video count and approximation status
    if (shellInfoResult && typeof shellInfoResult.playlist_count === 'number') {
      if (videoCount !== shellInfoResult.playlist_count) {
        logger.warn(`[YouTubePlaylistPreviewService] Video count mismatch for ${simplifiedUrl}: shell info count (${shellInfoResult.playlist_count}), duration lines count (${videoCount}).`);
        isDurationApproximate = true; // Mismatch implies approximation
      }
      videoCount = Math.max(videoCount, shellInfoResult.playlist_count); // Prefer higher count
    } else if (!durationsResult) { // If durationsResult failed, playlist_count from shell is our only hope
        isDurationApproximate = true; // Cannot be sure without duration data
        videoCount = shellInfoResult?.playlist_count || 0;
    }
    

    const previewData: PlaylistPreviewData = {
      id: playlistId,
      title: title,
      thumbnailUrl: bestThumbnailUrl,
      videoCount: videoCount,
      total_duration_seconds: totalDurationSec,
      uploader: uploader,
      webpage_url: webpage_url,
      isDurationApproximate: isDurationApproximate,
    };
    
    const overallDuration = performance.now() - functionStartTime;
    logger.info(`[YouTubePlaylistPreviewService] Successfully prepared quick preview for ${previewData.title} (${previewData.id}) in ${overallDuration.toFixed(2)}ms`);
    return previewData;

  } catch (error: any) {
    const overallDuration = performance.now() - functionStartTime;
    logger.error(`[YouTubePlaylistPreviewService] Error fetching playlist preview for ${playlistUrl} after ${overallDuration.toFixed(2)}ms: ${error.message}`, error);
    return null;
  }
} 