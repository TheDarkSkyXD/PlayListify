/**
 * Application constants for Playlistify
 */

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'playlistify-settings',
  PLAYLISTS: 'playlistify-playlists',
  THEME: 'playlistify-theme',
  LAST_DIRECTORY: 'playlistify-last-directory'
};

// API & Query keys
export const QUERY_KEYS = {
  playlists: 'playlists',
  playlist: 'playlist',
  videos: 'videos',
  settings: 'settings'
};

// Default settings
export const DEFAULT_SETTINGS = {
  // General settings
  theme: 'system',
  checkForUpdates: true,
  startAtLogin: false,
  minimizeToTray: true,
  
  // Download settings
  downloadLocation: '', // Will be set to Downloads folder in settings manager
  concurrentDownloads: 3,
  downloadFormat: 'mp4',
  maxQuality: '1080p',
  autoConvertToMp3: false,
  
  // Playback settings
  defaultVolume: 70,
  autoPlay: false,
  
  // Playlist settings
  playlistLocation: '', // Will be set in settings manager
  autoRefreshPlaylists: false,
  refreshInterval: 86400000, // 24 hours in milliseconds
  
  // Rate limiting settings
  apiRateLimit: {
    maxRequests: 60,
    perMinute: 1
  },
  
  // Advanced settings
  ytDlpPath: '',
  ffmpegPath: '',
  debug: false
};

// Video formats
export const VIDEO_FORMATS = ['mp4', 'webm', 'mkv'];
export const AUDIO_FORMATS = ['mp3', 'aac', 'flac', 'opus', 'm4a'];

// Video quality options
export const VIDEO_QUALITIES = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];

// Rate limiting constants
export const RATE_LIMITS = {
  YOUTUBE_API: {
    maxRequests: 60,
    perMinute: 1,
    cooldownMs: 2000 // Cooldown between requests in milliseconds
  },
  YT_DLP: {
    maxRequests: 10,
    perMinute: 1,
    cooldownMs: 6000 // More conservative cooldown for yt-dlp
  }
};

// File paths
export const PATHS = {
  CACHE_DIR: 'cache',
  THUMBNAILS_DIR: 'thumbnails',
  TEMP_DIR: 'temp',
  LOGS_DIR: 'logs'
};

// UI constants
export const UI = {
  ANIMATION_DURATION: 300, // ms
  TOAST_DURATION: 4000, // ms
  MAX_PLAYLISTS_PER_PAGE: 12,
  THUMBNAIL_WIDTH: 320,
  THUMBNAIL_HEIGHT: 180
}; 