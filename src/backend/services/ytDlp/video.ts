import { rateLimiter } from '../rateLimiter';
import { initYtDlp, getYtDlpInstance } from './binary';
import fs from 'fs-extra';
import path from 'path';
import { getSetting } from '../settingsManager';

/**
 * Check if a YouTube video is still available and return its information
 */
export async function checkVideoStatus(videoUrl: string): Promise<{
  available: boolean;
  info?: {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: number;
    channel?: string;
  };
  error?: string;
}> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      if (!await initYtDlp()) {
        await initYtDlp();
      }

      // Use --dump-json to get video information
      const ytDlp = getYtDlpInstance();
      const args = ['--dump-json', '--no-playlist', '--no-check-certificate', videoUrl];
      const result = await ytDlp.execPromise(args);

      if (!result || !result.trim()) {
        return { available: false, error: 'No data returned from yt-dlp' };
      }

      // Parse video info
      const videoInfo = JSON.parse(result);

      return {
        available: true,
        info: {
          id: videoInfo.id,
          title: videoInfo.title,
          url: videoInfo.webpage_url || videoUrl,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration || 0,
          channel: videoInfo.channel || videoInfo.uploader
        }
      };
    } catch (error: any) {
      console.error(`Video check failed for ${videoUrl}:`, error);
      return {
        available: false,
        error: error.message || 'Video is not available'
      };
    }
  });
}

/**
 * Download a video from YouTube
 */
export async function downloadVideo(
  videoUrl: string,
  outputDir: string,
  videoId: string,
  options: {
    format?: string;
    quality?: string;
  } = {}
): Promise<string> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      if (!await initYtDlp()) {
        await initYtDlp();
      }

      const ytDlp = getYtDlpInstance();

      // Ensure the output directory exists
      await fs.ensureDir(outputDir);

      // Determine format string based on settings
      const format = options.format || getSetting('downloadFormat');
      const quality = options.quality || getSetting('maxQuality');

      let formatString: string;

      if (format === 'mp3') {
        formatString = 'bestaudio[ext=m4a]/bestaudio';
      } else if (format === 'best') {
        formatString = 'bestvideo+bestaudio/best';
      } else {
        // Handle video quality selection
        switch (quality) {
          case '360p':
            formatString = 'bestvideo[height<=360]+bestaudio/best[height<=360]';
            break;
          case '480p':
            formatString = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
            break;
          case '720p':
            formatString = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
            break;
          case '1080p':
            formatString = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
            break;
          case '1440p':
            formatString = 'bestvideo[height<=1440]+bestaudio/best[height<=1440]';
            break;
          case '2160p':
            formatString = 'bestvideo[height<=2160]+bestaudio/best[height<=2160]';
            break;
          default:
            formatString = 'bestvideo[height<=1080]+bestaudio/best';
        }
      }

      // Construct output filename
      const outputFile = path.join(outputDir, `${videoId}.${format === 'mp3' ? 'mp3' : 'mp4'}`);

      // Arguments for yt-dlp
      const args = [
        '-f', formatString,
        '-o', outputFile,
        '--no-playlist',
        videoUrl
      ];

      // For mp3 format, add post-processing for conversion
      if (format === 'mp3') {
        args.push('--extract-audio', '--audio-format', 'mp3');
      }

      // Execute the download
      await ytDlp.execPromise(args);

      return outputFile;
    } catch (error: any) {
      console.error(`Failed to download video ${videoId}:`, error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  });
}
