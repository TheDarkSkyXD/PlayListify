/**
 * Utility functions for the video player
 */

/**
 * Check if a video file exists locally
 */
export async function checkVideoFileExists(
  playlistId: string,
  playlistName: string,
  videoId: string,
  format: string = 'mp4'
): Promise<boolean> {
  try {
    return await window.electron.fs.videoExists(
      playlistId,
      playlistName,
      videoId,
      format
    );
  } catch (error) {
    console.error('Error checking if video file exists:', error);
    return false;
  }
}

/**
 * Get the file path for a video
 */
export async function getVideoFilePath(
  playlistId: string,
  playlistName: string,
  videoId: string,
  format: string = 'mp4'
): Promise<string | null> {
  try {
    // Check if the video exists locally
    const videoExists = await checkVideoFileExists(
      playlistId,
      playlistName,
      videoId,
      format
    );
    
    if (!videoExists) {
      return null;
    }
    
    // Get the download location from settings
    const downloadLocation = await window.electron.settings.get('downloadLocation');
    
    // Construct the file path
    return `file://${downloadLocation}/${playlistName}/${videoId}.${format}`;
  } catch (error) {
    console.error('Error getting video file path:', error);
    return null;
  }
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) {
    return '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get a YouTube video URL from a video ID
 */
export function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Extract YouTube video ID from a URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Regular expression to extract YouTube video ID
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Check if a URL is a valid YouTube video URL
 */
export function isYouTubeVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Regular expression to validate YouTube video URL
  const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
  
  return regExp.test(url);
}

/**
 * Get the thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
