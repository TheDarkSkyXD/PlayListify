import fs from 'fs-extra';
import { getYtDlpInstance, updateYtDlp, getFfmpegPath } from '../binary';
import { downloadFFmpegDirect } from '../directFFmpegDownload';
import { VideoFormat, DownloadOptions, FormatAnalysisResult } from '../types';
import { cleanupPartialFiles, verifyDownloadedFile, truncateCommand } from './utils';
import { getBestFormatWithoutFFmpeg, getBestAudioFormat, getLowestQualityFormat } from './formatSelection';
import { getRecommendedArgs, getFallbackArgs } from './ssapHelper';

/**
 * Execute a fallback download strategy
 */
export async function executeFallbackStrategy(
  videoUrl: string,
  outputFile: string,
  formatAnalysis: FormatAnalysisResult,
  maxHeight: number | 'best',
  ffmpegPath: string | null,
  options: DownloadOptions
): Promise<string> {
  console.log('=== FALLBACK DOWNLOAD ATTEMPT ===');
  console.log('Primary download failed, trying with fallback format...');

  // Create a copy of the base args for the fallback attempt
  // Use a different approach for the fallback without browser cookies
  // See: https://github.com/yt-dlp/yt-dlp/issues/12482 and https://github.com/yt-dlp/yt-dlp/issues/10927
  const fallbackArgs = [
    '-o', outputFile,
    '--no-playlist',
    '--progress',
    '--add-metadata',
    '--no-write-thumbnail', // Prevent writing thumbnail to a separate file
    '--embed-thumbnail', // Embed thumbnail in the video
    // Try a different player client
    '--extractor-args', 'youtube:player_client=ios',
    // Removed --cookies-from-browser due to DPAPI decryption issues
    '--no-check-certificate', // Don't verify SSL certificates
    '--geo-bypass', // Try to bypass geo-restrictions
    '--ignore-errors', // Continue on download errors
    '--force-ipv4', // Use IPv4 to avoid IPv6 issues
    '--skip-unavailable-fragments', // Skip unavailable fragments
    '--no-cache-dir', // Disable cache
    videoUrl
  ];

  // Try to use a specific format ID that doesn't require FFmpeg
  // First, check if there are any formats that match our quality requirements
  const availableFormats = formatAnalysis.availableFormats.filter(f => !f.isAudioOnly && f.height > 0);

  // Sort formats by height in descending order
  availableFormats.sort((a, b) => b.height - a.height);

  // Handle 'best' quality option or find the best format that's less than or equal to our maxHeight
  if (maxHeight === 'best') {
    // For 'best' quality, get the highest resolution format available
    const bestFormat = availableFormats[0]; // Already sorted by height in descending order
    if (bestFormat) {
      console.log(`Using best available format: ID ${bestFormat.id} with height ${bestFormat.height}p`);
      fallbackArgs.push('-f', bestFormat.id);
    } else {
      // If no video formats available, use the standard fallback
      const formatId = getBestFormatWithoutFFmpeg(formatAnalysis.availableFormats, 9999); // Use a very high number
      console.log(`No video formats found, using fallback format: ${formatId}`);
      fallbackArgs.push('-f', formatId);
    }
  } else {
    // For specific height limits, find the best format that's less than or equal to our maxHeight
    const bestMatchingFormat = availableFormats.find(f => f.height <= maxHeight);

    if (bestMatchingFormat) {
      console.log(`Found best matching format: ID ${bestMatchingFormat.id} with height ${bestMatchingFormat.height}p`);
      fallbackArgs.push('-f', bestMatchingFormat.id);
    } else {
      // If no matching format, use the standard fallback
      const formatId = getBestFormatWithoutFFmpeg(formatAnalysis.availableFormats, maxHeight as number);
      console.log(`No exact matching format found, using fallback format: ${formatId}`);
      fallbackArgs.push('-f', formatId);
    }
  }

  // Add FFmpeg if available
  if (ffmpegPath) {
    fallbackArgs.push('--ffmpeg-location', ffmpegPath);
    fallbackArgs.push('--merge-output-format', 'mp4');
    fallbackArgs.push('--embed-thumbnail'); // Embed thumbnail in the video

    // Add additional FFmpeg-specific options for better quality
    fallbackArgs.push('--prefer-ffmpeg'); // Prefer using FFmpeg for downloads when possible
    fallbackArgs.push('--postprocessor-args', 'FFmpegVideoConvertor:-c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k'); // Better video/audio quality

    console.log(`Using FFmpeg in fallback strategy at: ${ffmpegPath}`);
    console.log('Enhanced video quality enabled with FFmpeg post-processing');

    // Verify the FFmpeg executable exists and is accessible
    if (ffmpegPath !== 'ffmpeg') { // Skip check if using system FFmpeg
      try {
        const stats = await fs.stat(ffmpegPath);
        console.log(`FFmpeg file exists, size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (statError) {
        console.error(`Error checking FFmpeg file: ${statError}`);

        // Try to get FFmpeg with direct download
        try {
          console.log('FFmpeg file check failed, attempting direct download...');
          const directFfmpegPath = await downloadFFmpegDirect();

          if (directFfmpegPath) {
            console.log(`Direct FFmpeg download successful, path: ${directFfmpegPath}`);

            // Update the args with the direct FFmpeg path
            const ffmpegIndex = fallbackArgs.indexOf('--ffmpeg-location');
            if (ffmpegIndex !== -1) {
              fallbackArgs[ffmpegIndex + 1] = directFfmpegPath;
            } else {
              fallbackArgs.push('--ffmpeg-location', directFfmpegPath);
              fallbackArgs.push('--merge-output-format', 'mp4');
            }
          }
        } catch (directDownloadError) {
          console.error('Error with direct FFmpeg download in fallback:', directDownloadError);
        }
      }
    }
  } else {
    // If FFmpeg is not available, try direct download
    try {
      console.log('FFmpeg not available, attempting direct download...');
      const directFfmpegPath = await downloadFFmpegDirect();

      if (directFfmpegPath) {
        console.log(`Direct FFmpeg download successful, path: ${directFfmpegPath}`);
        fallbackArgs.push('--ffmpeg-location', directFfmpegPath);
        fallbackArgs.push('--merge-output-format', 'mp4');
      }
    } catch (directDownloadError) {
      console.error('Error with direct FFmpeg download in fallback:', directDownloadError);
    }
  }

  try {
    const ytDlp = getYtDlpInstance();
    console.log(`Command: yt-dlp ${truncateCommand(fallbackArgs.join(' '))}`);
    console.log(`Executing yt-dlp with fallback args...`);
    await ytDlp.execPromise(fallbackArgs);

    // Verify the output file exists and has a reasonable size
    const success = await verifyDownloadedFile(outputFile, () => {
      console.log(`Fallback download successful: ${outputFile}`);
      // If we have a progress callback, report 100% completion
      if (options.onProgress) {
        options.onProgress(100);
      }
    });

    if (success) {
      return outputFile;
    } else {
      throw new Error(`Output file has zero size or does not exist after fallback download`);
    }
  } catch (fallbackError) {
    console.error(`Error during fallback download attempt:`, fallbackError);

    // Clean up any partial files
    await cleanupPartialFiles(outputFile);

    // Try the last resort strategy
    return executeLastResortStrategy(videoUrl, outputFile, formatAnalysis, ffmpegPath, options);
  }
}

/**
 * Execute a last resort download strategy
 */
export async function executeLastResortStrategy(
  videoUrl: string,
  outputFile: string,
  formatAnalysis: FormatAnalysisResult,
  ffmpegPath: string | null,
  options: DownloadOptions
): Promise<string> {
  console.log('=== LAST RESORT DOWNLOAD ATTEMPT ===');
  console.log('Second attempt failed, trying with last resort approach...');

  // Try to update yt-dlp as a last resort
  try {
    console.log('Attempting to update yt-dlp as a last resort...');
    const updated = await updateYtDlp();
    console.log(`yt-dlp update ${updated ? 'successful' : 'not needed or failed'}`);
  } catch (updateError) {
    console.error('Error updating yt-dlp:', updateError);
  }

  // Create a copy of the base args for the last fallback attempt
  // Try a completely different approach for the last resort without browser cookies
  // See: https://github.com/yt-dlp/yt-dlp/issues/10927
  const lastFallbackArgs = [
    '-o', outputFile,
    '--no-playlist',
    '--progress',
    '--add-metadata',
    '--no-write-thumbnail', // Prevent writing thumbnail to a separate file
    '--embed-thumbnail', // Embed thumbnail in the video
    // Use a completely different approach with TVHTML5 client
    '--extractor-args', 'youtube:player_client=TVHTML5',
    '--no-check-certificate',
    '--no-cache-dir',
    '--no-part',
    '--prefer-insecure',
    '--geo-bypass',
    '--ignore-errors',
    '--force-ipv4',
    '--skip-unavailable-fragments',
    // Removed --cookies-from-browser due to DPAPI decryption issues
    // Add user-agent to mimic a real browser
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    '--referer', 'https://www.youtube.com/',
    // Try with a simpler format selection
    '-f', 'best[height<=720]/best',
    videoUrl
  ];

  // For HLS streams, we need a completely different approach
  if (formatAnalysis.hasHlsStreams) {
    console.log('HLS streams detected, using last resort strategy');

    // Try to download just the audio as a last resort
    console.log('Trying to download just the audio as a last resort');

    // First, try to find an audio-only format
    const bestAudioFormat = getBestAudioFormat(formatAnalysis.availableFormats);
    if (bestAudioFormat) {
      console.log(`Found best audio-only format: ${bestAudioFormat.id}`);
      lastFallbackArgs.push('-f', bestAudioFormat.id);

      // Change the output file extension to match the audio format
      const audioExt = bestAudioFormat.line.match(/\s+(\w+)\s+audio only/);
      if (audioExt && audioExt[1]) {
        const newOutputFile = outputFile.replace(/\.mp4$/, `.${audioExt[1]}`);
        // Replace the output file in the args
        lastFallbackArgs[1] = newOutputFile;
        console.log(`Changed output file to: ${newOutputFile}`);
      }
    } else {
      // If we can't find an audio format, try with the simplest possible approach
      console.log('No audio format found, trying with simplest possible approach');
      lastFallbackArgs.push('-f', '18/17/36/13/5');
    }
  } else if (formatAnalysis.availableFormats.length > 0) {
    // Try with the lowest quality format
    const lowestFormat = getLowestQualityFormat(formatAnalysis.availableFormats);
    if (lowestFormat) {
      console.log(`Trying with lowest available quality: ${lowestFormat.height}p`);
      lastFallbackArgs.push('-f', lowestFormat.id);
    } else {
      // If we don't have a valid format, use legacy format codes
      console.log('No suitable format found, using legacy format codes');
      lastFallbackArgs.push('-f', '18/17/36/13/5');
    }

    // Add FFmpeg if available
    if (ffmpegPath) {
      lastFallbackArgs.push('--ffmpeg-location', ffmpegPath);
      lastFallbackArgs.push('--merge-output-format', 'mp4');
      lastFallbackArgs.push('--embed-thumbnail'); // Embed thumbnail in the video

      // Add additional FFmpeg-specific options for better quality
      lastFallbackArgs.push('--prefer-ffmpeg'); // Prefer using FFmpeg for downloads when possible
      lastFallbackArgs.push('--postprocessor-args', 'FFmpegVideoConvertor:-c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k'); // Better video/audio quality

      console.log(`Using FFmpeg in last resort strategy at: ${ffmpegPath}`);
      console.log('Enhanced video quality enabled with FFmpeg post-processing');

      // Verify the FFmpeg executable exists and is accessible
      if (ffmpegPath !== 'ffmpeg') { // Skip check if using system FFmpeg
        try {
          const stats = await fs.stat(ffmpegPath);
          console.log(`FFmpeg file exists, size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (statError) {
          console.error(`Error checking FFmpeg file in last resort: ${statError}`);
        }
      }
    }
  } else {
    // If we don't have format information, use legacy format codes
    console.log('No format information available, using legacy format codes');
    lastFallbackArgs.push('-f', '18/17/36/13/5');
  }

  try {
    const ytDlp = getYtDlpInstance();
    console.log(`Command: yt-dlp ${truncateCommand(lastFallbackArgs.join(' '))}`);
    console.log(`Executing yt-dlp with last fallback args...`);
    await ytDlp.execPromise(lastFallbackArgs);

    // Get the actual output file (it might have been changed)
    const actualOutputFile = lastFallbackArgs[1];

    // Verify the output file exists and has a reasonable size
    const success = await verifyDownloadedFile(actualOutputFile, () => {
      console.log(`Last resort download successful: ${actualOutputFile}`);
      // If we have a progress callback, report 100% completion
      if (options.onProgress) {
        options.onProgress(100);
      }
    });

    if (success) {
      return actualOutputFile;
    } else {
      throw new Error(`Output file has zero size or does not exist after last resort download`);
    }
  } catch (lastFallbackError) {
    console.error(`Error during last fallback download attempt:`, lastFallbackError);

    // Clean up any partial files
    await cleanupPartialFiles(outputFile);

    // All attempts failed
    throw new Error(`All download attempts failed: ${lastFallbackError.message}`);
  }
}
