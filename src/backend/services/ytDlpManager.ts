/**
 * YtDlpManager - Facade for the modular ytDlp service
 *
 * This file re-exports all functionality from the ytDlp module
 * to maintain backward compatibility while using the new modular structure.
 */

// Import all functionality from the ytDlp module
import {
  // Binary and initialization
  getBundledYtDlpPath,
  getYtDlpInstance,
  initYtDlp,
  execAsync,
  getFfmpegPath,
  getBundledFfmpegDir,
  initFFmpeg,

  // Configuration
  MAX_BUFFER_SIZE,
  DEFAULT_TIMEOUT_MS,
  VideoProcessingRateLimiter,
  videoRateLimiter,

  // Playlist operations
  getPlaylistInfo,
  getPlaylistVideos,
  importYoutubePlaylist,

  // Video operations
  checkVideoStatus,
  downloadVideo
} from './ytDlp/index';

// Re-export all functions from the ytDlp module

/**
 * Get the path to the bundled yt-dlp binary in production mode
 */
export { getBundledYtDlpPath };

/**
 * Get the current ytDlp instance or initialize a new one
 */
export { getYtDlpInstance };

/**
 * Initialize the YtDlpWrap instance
 */
export { initYtDlp };

/**
 * Initialize FFmpeg
 */
export { initFFmpeg };

/**
 * Promisified exec function for running shell commands
 */
export { execAsync };

/**
 * Default max buffer size for yt-dlp commands (increased to 100MB)
 */
export { MAX_BUFFER_SIZE };

/**
 * Default timeout for yt-dlp operations (2 minutes)
 */
export { DEFAULT_TIMEOUT_MS };

/**
 * Video processing rate limiter class to make progress bar movement visible
 */
export { VideoProcessingRateLimiter };

/**
 * Instance of VideoProcessingRateLimiter with default 2000ms delay
 */
export { videoRateLimiter };

/**
 * Extract playlist info from a YouTube URL
 */
export { getPlaylistInfo };

/**
 * Extract video entries from a YouTube playlist
 */
export { getPlaylistVideos };

/**
 * Import a YouTube playlist and save it locally
 */
export { importYoutubePlaylist };

/**
 * Check if a YouTube video is still available
 */
export { checkVideoStatus };

/**
 * Download a video from YouTube
 */
export { downloadVideo };

