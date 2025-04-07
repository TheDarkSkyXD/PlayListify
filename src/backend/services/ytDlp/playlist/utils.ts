import { logToFile } from '../../logger';

/**
 * Extracts the playlist ID from a YouTube URL
 */
export function extractPlaylistId(url: string): string | null {
  try {
    // Extract playlist ID from URL
    const match = url.match(/list=([^&]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    logToFile('ERROR', `Failed to extract playlist ID from URL: ${error}`);
    return null;
  }
}

/**
 * Validates a YouTube playlist URL
 */
export function isValidPlaylistUrl(url: string): boolean {
  try {
    // Check if the URL is a valid YouTube URL
    const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
    
    // Check if it contains a playlist ID
    const hasPlaylistId = url.includes('list=');
    
    return isYouTubeUrl && hasPlaylistId;
  } catch (error) {
    logToFile('ERROR', `Failed to validate playlist URL: ${error}`);
    return false;
  }
}

/**
 * Constructs a YouTube playlist URL from a playlist ID
 */
export function constructPlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}

/**
 * Constructs a YouTube video URL from a video ID
 */
export function constructVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
