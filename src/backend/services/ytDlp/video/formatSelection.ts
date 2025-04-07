import { VideoFormat, FormatAnalysisResult } from '../types';
import { getYtDlpInstance } from '../binary';
import { getRecommendedArgs } from './ssapHelper';

/**
 * Get available formats for a video
 */
export async function getAvailableFormats(videoUrl: string): Promise<FormatAnalysisResult> {
  console.log('Listing available formats for smart quality selection...');
  const ytDlp = getYtDlpInstance();

  // Use a robust approach to get available formats without browser cookies
  // See: https://github.com/yt-dlp/yt-dlp/issues/12482 and https://github.com/yt-dlp/yt-dlp/issues/10927
  const formatsArgs = [
    '--list-formats',
    '--no-playlist',
    '--extractor-args', 'youtube:player_client=android',
    // Removed --cookies-from-browser due to DPAPI decryption issues
    '--no-check-certificate',
    '--geo-bypass',
    '--force-ipv4',
    '--no-cache-dir',
    videoUrl
  ];

  const result: FormatAnalysisResult = {
    availableFormats: [],
    hasHlsStreams: false,
    hasMergedFormats: false,
    maxAvailableHeight: 0
  };

  try {
    console.log('Executing yt-dlp to get available formats...');
    const formatsResult = await ytDlp.execPromise(formatsArgs);
    console.log('Successfully retrieved available formats');

    // Parse the formats output
    const lines = formatsResult.split('\n');
    for (const line of lines) {
      if (line.includes('audio only') || line.includes('video only') || (line.match(/^\d+\s+/) && !line.includes('storyboard'))) {
        const format: VideoFormat = {
          id: line.match(/^(\d+)/)?.[1] || '',
          ext: line.match(/^\d+\s+(\w+)/)?.[1] || '',
          resolution: line.match(/\s+(\d+x\d+|\w+ only)/)?.[1] || '',
          fps: parseInt(line.match(/\s+(\d+)\s+fps/)?.[1] || '0', 10),
          filesize: line.match(/\s+(\~?\s*[\d\.]+\w+)/)?.[1] || '',
          tbr: parseInt(line.match(/\s+(\d+)k\s+/)?.[1] || '0', 10),
          protocol: line.match(/\s+(\w+)\s+\|/)?.[1] || '',
          vcodec: line.match(/\|\s+(\w+\.\w+|\w+)\s+/)?.[1] || '',
          acodec: line.match(/\s+(\w+\.\w+|\w+)\s+audio/)?.[1] || '',
          isAudioOnly: line.includes('audio only'),
          isVideoOnly: line.includes('video only'),
          height: parseInt(line.match(/\s+(\d+)x\d+/)?.[1] || '0', 10),
          line: line
        };

        result.availableFormats.push(format);

        // Check for HLS streams
        if (line.includes('m3u8')) {
          result.hasHlsStreams = true;
        }

        // Check for merged formats (not audio only or video only)
        if (!line.includes('audio only') && !line.includes('video only') && line.match(/^\d+\s+/)) {
          result.hasMergedFormats = true;
        }

        // Track maximum available height
        if (format.height > result.maxAvailableHeight) {
          result.maxAvailableHeight = format.height;
        }
      }
    }

    console.log(`Format analysis: hasHlsStreams=${result.hasHlsStreams}, hasMergedFormats=${result.hasMergedFormats}, maxAvailableHeight=${result.maxAvailableHeight}`);
    console.log(`Maximum available height for this video: ${result.maxAvailableHeight}p`);

    return result;
  } catch (formatsError: any) {
    console.error('Error getting available formats:', formatsError);
    console.error('Error details:', formatsError.message || 'Unknown error');

    // Set a default maxAvailableHeight if we couldn't determine it
    // This ensures videos still have a quality label even if we can't determine the exact quality
    if (result.maxAvailableHeight === 0) {
      result.maxAvailableHeight = 720; // Default to 720p as a reasonable assumption
      console.log('Setting default maxAvailableHeight to 720p due to error');
    }

    return result;
  }
}

/**
 * Get the format string based on the requested quality
 * This uses a sophisticated format selection to ensure we get the best available quality
 * up to the requested maximum height, or the absolute best quality if 'best' is selected.
 */
export function getFormatString(maxHeight: number | 'best'): string {
  // If 'best' is selected, don't limit by height
  if (maxHeight === 'best') {
    // This format string prioritizes the best video and audio quality available
    return 'bestvideo+bestaudio/best';
  }

  // For specific height limits, use a more sophisticated format string:
  // 1. Try to get the best video with height <= maxHeight and best audio
  // 2. If that fails, try to get the best video with height <= maxHeight
  // 3. If that fails, try to get the best video (regardless of height) and best audio
  // 4. If that fails, try to get the best available format

  // Use a more precise format string that prioritizes exact resolution matches
  // This will try to get the exact resolution first, then fall back to lower resolutions
  return `bestvideo[height=${maxHeight}]+bestaudio/bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/bestvideo[height<=${maxHeight}]/bestvideo+bestaudio/best`;
}

/**
 * Get the best format that doesn't require FFmpeg
 */
export function getBestFormatWithoutFFmpeg(
  availableFormats: VideoFormat[],
  maxHeight: number | 'best'
): string {
  // Format 18 is 360p MP4 with audio, which is usually available and doesn't require FFmpeg
  // Format 22 is 720p MP4 with audio, which is usually available and doesn't require FFmpeg
  const format18 = availableFormats.find(f => f.id === '18');
  const format22 = availableFormats.find(f => f.id === '22');

  if (maxHeight === 'best') {
    // For 'best' quality, prefer format 22 if available
    if (format22) {
      console.log('Using format 22 (720p MP4 with audio)');
      return '22';
    } else if (format18) {
      console.log('Using format 18 (360p MP4 with audio)');
      return '18';
    }
  } else if (format22 && maxHeight >= 720) {
    console.log('Using format 22 (720p MP4 with audio)');
    return '22';
  } else if (format18) {
    console.log('Using format 18 (360p MP4 with audio)');
    return '18';
  } else {
    console.log('Using format 18/22/best as fallback');
    return '18/22/best';
  }
}

/**
 * Get the best audio-only format
 */
export function getBestAudioFormat(availableFormats: VideoFormat[]): VideoFormat | null {
  const audioFormats = availableFormats.filter(f => f.isAudioOnly);
  if (audioFormats.length === 0) {
    return null;
  }

  // Sort by id (lower is usually more compatible)
  audioFormats.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  return audioFormats[0];
}

/**
 * Get the lowest quality format
 */
export function getLowestQualityFormat(availableFormats: VideoFormat[]): VideoFormat | null {
  if (availableFormats.length === 0) {
    return null;
  }

  // Sort formats by height (ascending)
  const sortedFormats = [...availableFormats].filter(f => f.height > 0);
  sortedFormats.sort((a, b) => a.height - b.height);

  return sortedFormats.length > 0 ? sortedFormats[0] : null;
}
