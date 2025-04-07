import { rateLimiter } from '../../rateLimiter';
import { initYtDlp, getYtDlpInstance } from '../binary';
import { VideoStatusResult } from '../types';
import { getAvailableFormats } from './formatSelection';

/**
 * Check if a YouTube video is still available and return its information
 */
export async function checkVideoStatus(videoUrl: string): Promise<VideoStatusResult> {
  // Use the rate limiter to execute this function
  const limiterName: string = 'yt-dlp';
  return rateLimiter.execute(limiterName, async () => {
    try {
      // Ensure yt-dlp is initialized
      try {
        await initYtDlp();
      } catch (error) {
        console.error('Failed to initialize yt-dlp, retrying...', error);
        await initYtDlp();
      }

      // Use --dump-json to get video information
      const ytDlp = getYtDlpInstance();

      // Use a robust approach to check video status without browser cookies
      // See: https://github.com/yt-dlp/yt-dlp/issues/12482 and https://github.com/yt-dlp/yt-dlp/issues/10927
      const args = [
        '--dump-json',
        '--no-playlist',
        '--no-check-certificate',
        '--extractor-args', 'youtube:player_client=android',
        // Removed --cookies-from-browser due to DPAPI decryption issues
        '--geo-bypass',
        '--force-ipv4',
        '--no-cache-dir',
        videoUrl
      ];
      const result = await ytDlp.execPromise(args);

      if (!result || !result.trim()) {
        return { available: false, error: 'No data returned from yt-dlp' };
      }

      // Parse video info
      const videoInfo = JSON.parse(result);

      // Get available formats to determine maximum quality
      let maxQuality = 'unknown';
      try {
        console.log(`Getting format information for video: ${videoInfo.id}`);
        const formatAnalysis = await getAvailableFormats(videoUrl);

        // If we have a valid height, convert it to a standard quality label
        if (formatAnalysis.maxAvailableHeight > 0) {
          // Convert height to standard quality label
          if (formatAnalysis.maxAvailableHeight >= 8000) {
            maxQuality = '8K';
          } else if (formatAnalysis.maxAvailableHeight >= 4000) {
            maxQuality = '4K';
          } else if (formatAnalysis.maxAvailableHeight >= 2160) {
            maxQuality = '2160p';
          } else if (formatAnalysis.maxAvailableHeight >= 1440) {
            maxQuality = '1440p';
          } else if (formatAnalysis.maxAvailableHeight >= 1080) {
            maxQuality = '1080p';
          } else if (formatAnalysis.maxAvailableHeight >= 720) {
            maxQuality = '720p';
          } else if (formatAnalysis.maxAvailableHeight >= 480) {
            maxQuality = '480p';
          } else if (formatAnalysis.maxAvailableHeight >= 360) {
            maxQuality = '360p';
          } else {
            maxQuality = `${formatAnalysis.maxAvailableHeight}p`;
          }
          console.log(`Determined quality for video ${videoInfo.id}: ${maxQuality}`);
        } else {
          // If we couldn't determine the height, use a default value
          maxQuality = '720p'; // Default to 720p as a reasonable assumption
          console.log(`Using default quality for video ${videoInfo.id}: ${maxQuality}`);
        }
      } catch (formatError: any) {
        console.error(`Error getting format information for video ${videoInfo.id}:`, formatError);
        console.error('Error details:', formatError.message || 'Unknown error');

        // Use a default quality if we couldn't determine it
        maxQuality = '720p'; // Default to 720p as a reasonable assumption
        console.log(`Using default quality due to error for video ${videoInfo.id}: ${maxQuality}`);
      }

      return {
        available: true,
        info: {
          id: videoInfo.id,
          title: videoInfo.title,
          url: videoInfo.webpage_url || videoUrl,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          channel: videoInfo.channel,
          maxQuality: maxQuality
        }
      };
    } catch (error: any) {
      console.error('Error checking video status:', error);
      return {
        available: false,
        error: error.message || 'Unknown error'
      };
    }
  });
}
