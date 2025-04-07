import { getYtDlpInstance, initYtDlp } from '../../ytDlpManager';
import { logToFile } from '../../logger';
import { videoRateLimiter } from '../config';
import { Video } from '../../../../shared/types/appTypes';
import { YouTubeVideoInfo, PlaylistProgressCallback } from './types';

/**
 * Gets videos from a YouTube playlist
 */
export async function getPlaylistVideos(
  playlistUrl: string,
  onProgress?: PlaylistProgressCallback
): Promise<Video[]> {
  logToFile('INFO', `Getting videos for playlist ${playlistUrl}`);

  try {
    // Ensure yt-dlp is initialized
    await initYtDlp();

    // Get the yt-dlp instance
    const ytDlpInstance = getYtDlpInstance();

    // Use yt-dlp to get playlist videos
    const args = [
      '--dump-json',
      '--flat-playlist',
      playlistUrl
    ];

    // Call onProgress with "starting" status
    if (onProgress) {
      onProgress('starting');
    }

    const result = await ytDlpInstance.execPromise(args);

    // Parse the JSON result
    let lines: string[] = [];
    try {
      // Handle different return types from execPromise
      if (typeof result === 'string') {
        lines = result.split('\n').filter((line: string) => line.trim().length > 0);
      } else if (result && typeof result === 'object') {
        // Use type assertion to handle the case where stdout exists
        const resultObj = result as any;
        if (resultObj.stdout) {
          lines = resultObj.stdout.split('\n').filter((line: string) => line.trim().length > 0);
        }
      }
    } catch (parseError) {
      logToFile('ERROR', `Error parsing playlist videos: ${parseError}`);
      throw new Error(`Failed to parse playlist videos: ${parseError.message}`);
    }

    if (lines.length === 0) {
      logToFile('WARN', 'No videos found in playlist');
      return [];
    }

    // Call onProgress with "processing" status and total count
    if (onProgress) {
      onProgress('processing', 0, lines.length);
    }

    // Process each video
    const videos: Video[] = [];
    let processedCount = 0;

    for (const line of lines) {
      try {
        // Parse the JSON for this video
        const videoInfo: YouTubeVideoInfo = JSON.parse(line);

        // Skip private or deleted videos
        const isPrivate = videoInfo.title === 'Private video' ||
                         videoInfo.title === '[Private video]' ||
                         videoInfo.title === 'Deleted video';

        if (isPrivate) {
          logToFile('INFO', `Skipping private/deleted video: ${videoInfo.id}`);
          continue;
        }

        // Create a Video object
        const video: Video = {
          id: videoInfo.id,
          title: videoInfo.title,
          url: videoInfo.url || `https://www.youtube.com/watch?v=${videoInfo.id}`,
          // Ensure we always have a valid thumbnail URL
          thumbnail: videoInfo.thumbnail || `https://i.ytimg.com/vi/${videoInfo.id}/hqdefault.jpg`,
          duration: videoInfo.duration || 0,
          addedAt: new Date().toISOString(),
          downloaded: false, // Default to not downloaded
          maxQuality: 'unknown' // Default to unknown quality
        };

        videos.push(video);

        // Update progress
        processedCount++;
        if (onProgress) {
          onProgress('processing', processedCount, lines.length);
        }

        // Apply rate limiting to avoid overwhelming the YouTube API
        await videoRateLimiter.delay();
      } catch (videoError) {
        logToFile('ERROR', `Error processing video: ${videoError}`);
        // Continue with the next video
      }
    }

    // Count how many private videos were skipped
    const skippedCount = lines.length - videos.length;

    // Call onProgress with "completed" status
    if (onProgress) {
      if (skippedCount > 0) {
        onProgress(`${skippedCount} private/deleted videos were skipped`, videos.length, lines.length);
      }
      onProgress('completed', videos.length, videos.length);
    }

    logToFile('INFO', `Found ${videos.length} videos in playlist`);
    return videos;
  } catch (error) {
    logToFile('ERROR', `Failed to get playlist videos: ${error}`);
    throw error;
  }
}
