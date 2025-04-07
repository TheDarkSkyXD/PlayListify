import fs from 'fs-extra';
import path from 'path';
import { rateLimiter } from '../../rateLimiter';
import { initYtDlp, getYtDlpInstance, getFfmpegPath } from '../binary';
import { downloadFFmpegDirect } from '../directFFmpegDownload';
import { DownloadOptions } from '../types';
import { getAvailableFormats, getFormatString } from './formatSelection';
import { executeFallbackStrategy } from './fallbackStrategies';
import { cleanupPartialFiles, verifyDownloadedFile, truncateCommand } from './utils';
import { getRecommendedArgs } from './ssapHelper';

/**
 * Download a YouTube video
 */
export async function downloadVideo(
  videoUrl: string,
  outputDir: string,
  videoId: string,
  options: DownloadOptions = {}
): Promise<string> {
  console.log(`=== DOWNLOAD START: ${videoId} ===`);
  console.log(`URL: ${videoUrl}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Format: ${options.format || 'default'}, Quality: ${options.quality || 'default'}`);

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

      const ytDlp = getYtDlpInstance();

      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Set output file path
      const outputFile = path.join(outputDir, `${videoId}.${options.format || 'mp4'}`);

      // Check if FFmpeg is available (non-blocking mode)
      let ffmpegPath;
      try {
        // Use non-blocking mode to avoid waiting for FFmpeg download
        ffmpegPath = await getFfmpegPath(true);
        if (ffmpegPath) {
          console.log(`FFmpeg found at: ${ffmpegPath}`);
        } else {
          console.log('FFmpeg download in progress, continuing without waiting');
        }
      } catch (ffmpegError) {
        console.error('FFmpeg not found:', ffmpegError);
        ffmpegPath = null;
      }

      // Use smart quality selection based on the requested quality
      let maxHeight: number | 'best' = 1080; // Default to 1080p
      if (options.quality) {
        if (options.quality === 'best') {
          // For 'best' quality, we pass the 'best' string directly
          maxHeight = 'best';
          console.log('Using best available quality (no height limit)');
        } else {
          const match = options.quality.match(/(\d+)p/);
          if (match && match[1]) {
            maxHeight = parseInt(match[1], 10);
          }
        }
      }
      console.log(`Using smart quality selection with max height: ${maxHeight === 'best' ? 'best (no limit)' : `${maxHeight}p`}`);

      // Get available formats to make smart decisions
      const formatAnalysis = await getAvailableFormats(videoUrl);

      // Default format string
      const formatString = getFormatString(maxHeight);

      // Log the maximum available quality for this video
      if (formatAnalysis.maxAvailableHeight > 0) {
        if (formatAnalysis.maxAvailableHeight < maxHeight) {
          console.log(`Note: Requested quality ${maxHeight}p, but maximum available quality is ${formatAnalysis.maxAvailableHeight}p`);
          console.log(`Will download at best available quality: ${formatAnalysis.maxAvailableHeight}p`);
        } else {
          console.log(`Maximum available quality ${formatAnalysis.maxAvailableHeight}p is sufficient for requested quality ${maxHeight}p`);
        }
      }

      // Prepare the download arguments
      // Use a more robust approach to handle YouTube downloads without browser cookies
      // See: https://github.com/yt-dlp/yt-dlp/issues/12482 and https://github.com/yt-dlp/yt-dlp/issues/10927
      const args = [
        '-o', outputFile,
        '--no-playlist',
        '--progress',
        '--add-metadata',
        '--no-write-thumbnail', // Prevent writing thumbnail to a separate file
        '--embed-thumbnail', // Embed thumbnail in the video
        // Use a combination of approaches to maximize success rate
        '--extractor-args', 'youtube:player_client=android',
        // Removed --cookies-from-browser due to DPAPI decryption issues
        '--no-check-certificate', // Don't verify SSL certificates
        '--geo-bypass', // Try to bypass geo-restrictions
        '--ignore-errors', // Continue on download errors
        '--force-ipv4', // Use IPv4 to avoid IPv6 issues
        '--skip-unavailable-fragments', // Skip unavailable fragments
        '--no-cache-dir', // Disable cache
        videoUrl
      ];

      // If FFmpeg is available, use it for merging video and audio streams
      if (ffmpegPath) {
        args.push('-f', formatString);
        args.push('--ffmpeg-location', ffmpegPath);
        args.push('--merge-output-format', 'mp4');
        args.push('--embed-thumbnail'); // Embed thumbnail in the video

        // Add additional FFmpeg-specific options for better quality
        args.push('--prefer-ffmpeg'); // Prefer using FFmpeg for downloads when possible
        args.push('--postprocessor-args', 'FFmpegVideoConvertor:-c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k'); // Better video/audio quality

        console.log(`Using FFmpeg for merging streams with format: ${formatString}`);
        console.log(`FFmpeg location: ${ffmpegPath}`);
        console.log('Enhanced video quality enabled with FFmpeg post-processing');
      } else {
        // If FFmpeg is not available, we need to be careful with format selection
        console.log('FFmpeg not available, using special format selection');

        // Try to get FFmpeg again with a longer timeout
        try {
          console.log('Making one more attempt to get FFmpeg...');
          const ffmpegPathRetry = await getFfmpegPath(false, 30000); // Wait up to 30 seconds

          if (ffmpegPathRetry) {
            console.log(`FFmpeg found on retry at: ${ffmpegPathRetry}`);
            args.push('-f', formatString);
            args.push('--ffmpeg-location', ffmpegPathRetry);
            args.push('--merge-output-format', 'mp4');
            args.push('--embed-thumbnail');

            // Add additional FFmpeg-specific options for better quality
            args.push('--prefer-ffmpeg'); // Prefer using FFmpeg for downloads when possible
            args.push('--postprocessor-args', 'FFmpegVideoConvertor:-c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k'); // Better video/audio quality

            console.log(`Using FFmpeg for merging and embedding thumbnail with format: ${formatString}`);
            console.log('Enhanced video quality enabled with FFmpeg post-processing');
            return;
          }
        } catch (ffmpegRetryError) {
          console.error('Error getting FFmpeg on retry:', ffmpegRetryError);
        }

        // For HLS streams, we need to select a single format that doesn't require merging
        if (formatAnalysis.hasHlsStreams) {
          console.log('HLS streams detected but FFmpeg is not available');

          // For HLS streams without FFmpeg, we need to select a format that includes both video and audio
          if (formatAnalysis.hasMergedFormats) {
            // Use format 18 (360p MP4) or 22 (720p MP4) which are usually available and don't require FFmpeg
            if (formatAnalysis.availableFormats.find(f => f.id === '22') && maxHeight >= 720) {
              console.log('Using format 22 (720p MP4 with audio)');
              args.push('-f', '22');
            } else if (formatAnalysis.availableFormats.find(f => f.id === '18')) {
              console.log('Using format 18 (360p MP4 with audio)');
              args.push('-f', '18');
            } else {
              console.log('Using format 18/22/best as fallback');
              args.push('-f', '18/22/best');
            }
          } else {
            // If no merged formats, we need to select the best video-only format
            // This will likely fail, but it's the best we can do without FFmpeg
            console.log('No merged formats available, this may fail without FFmpeg');
            args.push('-f', 'best');
          }
        } else {
          // For regular streams, we can use 'b' to select the best merged format
          console.log('Using best merged format (b)');
          args.push('-f', 'b');
        }
      }

      console.log(`Output file: ${outputFile}`);

      // First attempt with the current args
      try {
        console.log('=== PRIMARY DOWNLOAD ATTEMPT ===');
        console.log(`Format string: ${formatString}`);
        console.log(`Command: yt-dlp ${truncateCommand(args.join(' '))}`);

        await ytDlp.execPromise(args);

        // Verify the output file exists and has a reasonable size
        const success = await verifyDownloadedFile(outputFile, () => {
          // If we have a progress callback, report 100% completion
          if (options.onProgress) {
            options.onProgress(100);
          }

          // Log the quality that was actually downloaded
          if (formatAnalysis.maxAvailableHeight > 0 && formatAnalysis.maxAvailableHeight < maxHeight) {
            console.log(`Successfully downloaded video at ${formatAnalysis.maxAvailableHeight}p quality (best available) to: ${outputFile}`);
          } else {
            console.log(`Successfully downloaded video at requested quality (${maxHeight}p) to: ${outputFile}`);
          }
        });

        if (success) {
          return outputFile;
        } else {
          throw new Error('Output file has zero size or does not exist');
        }
      } catch (primaryError: any) {
        console.error(`Error during primary download attempt:`, primaryError);

        // Check if the error is related to FFmpeg
        const isFfmpegError = primaryError.message && primaryError.message.includes('ffmpeg not found');

        // If this is an FFmpeg error and we're downloading FFmpeg in the background,
        // let's try to wait for FFmpeg to be available
        if (isFfmpegError) {
          console.log('Error is related to FFmpeg not being available');

          // Try to get FFmpeg again, but this time wait for it to be available with a longer timeout
          try {
            console.log('Waiting for FFmpeg to be available...');
            ffmpegPath = await getFfmpegPath(false, 60000); // Wait up to 60 seconds for FFmpeg
            console.log(`FFmpeg is now available at: ${ffmpegPath}`);

            // Update the args with the FFmpeg path
            const ffmpegIndex = args.indexOf('--ffmpeg-location');
            if (ffmpegIndex !== -1) {
              args[ffmpegIndex + 1] = ffmpegPath;
            } else {
              args.push('--ffmpeg-location', ffmpegPath);
            }

            // Add verbose logging to help diagnose issues
            console.log(`Updated command with FFmpeg path: yt-dlp ${truncateCommand(args.join(' '))}`);

            // Verify the FFmpeg executable exists and is accessible
            if (ffmpegPath !== 'ffmpeg') { // Skip check if using system FFmpeg
              try {
                const stats = await fs.stat(ffmpegPath);
                console.log(`FFmpeg file exists, size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              } catch (statError) {
                console.error(`Error checking FFmpeg file: ${statError}`);
              }
            }

            console.log('Retrying download with FFmpeg...');
            await ytDlp.execPromise(args);

            // Verify the output file exists and has a reasonable size
            const success = await verifyDownloadedFile(outputFile, () => {
              // If we have a progress callback, report 100% completion
              if (options.onProgress) {
                options.onProgress(100);
              }
              console.log(`Successfully downloaded video with FFmpeg to: ${outputFile}`);
            });

            if (success) {
              return outputFile;
            }
          } catch (ffmpegWaitError) {
            console.error('Error waiting for FFmpeg:', ffmpegWaitError);

            // Try direct download as a last resort
            console.log('Attempting direct FFmpeg download as a last resort...');
            try {
              const directFfmpegPath = await downloadFFmpegDirect();

              if (directFfmpegPath) {
                console.log(`Direct FFmpeg download successful, path: ${directFfmpegPath}`);

                // Update the args with the FFmpeg path
                const ffmpegIndex = args.indexOf('--ffmpeg-location');
                if (ffmpegIndex !== -1) {
                  args[ffmpegIndex + 1] = directFfmpegPath;
                } else {
                  args.push('--ffmpeg-location', directFfmpegPath);
                }

                console.log(`Retrying download with directly downloaded FFmpeg...`);
                await ytDlp.execPromise(args);

                // Verify the output file exists and has a reasonable size
                const success = await verifyDownloadedFile(outputFile, () => {
                  // If we have a progress callback, report 100% completion
                  if (options.onProgress) {
                    options.onProgress(100);
                  }
                  console.log(`Successfully downloaded video with direct FFmpeg to: ${outputFile}`);
                });

                if (success) {
                  return outputFile;
                }
              }
            } catch (directDownloadError) {
              console.error('Error with direct FFmpeg download:', directDownloadError);
            }
          }
        }

        // If we get here, we need to try a fallback approach
        return executeFallbackStrategy(
          videoUrl,
          outputFile,
          formatAnalysis,
          maxHeight,
          ffmpegPath,
          options
        );
      }
    } catch (error: any) {
      console.error(`Failed to download video ${videoId}:`, error);

      // Check if the error is related to yt-dlp not being able to merge the streams
      if (error.message && error.message.includes('merge')) {
        console.error('Error appears to be related to merging video and audio streams');
        console.error('This could be due to missing ffmpeg or other post-processing issues');
      }

      // Check if there are any partial files in the output directory
      try {
        const files = await fs.readdir(outputDir);
        const partialFiles = files.filter(file =>
          file.startsWith(videoId) &&
          (file.includes('.part') || file.includes('.f') || file.includes('.temp'))
        );

        if (partialFiles.length > 0) {
          console.error(`Found ${partialFiles.length} partial download files in ${outputDir}:`);
          partialFiles.forEach(file => console.error(`- ${file}`));
        }
      } catch (dirError) {
        console.error(`Error checking output directory for partial files:`, dirError);
      }

      throw error;
    }
  });
}
