/**
 * Core application types for Playlistify
 */

/**
 * Video item within a playlist
 */
export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: number;
  downloaded: boolean;
  downloadPath?: string;
  format?: string;
  addedAt: string;
  status?: 'available' | 'unavailable' | 'processing' | 'unknown';
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Playlist containing videos
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  videos: Video[];
  source?: 'youtube' | 'local' | 'other';
  sourceUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Application settings
 */
export interface AppSettings {
  // General settings
  theme: 'light' | 'dark' | 'system';
  checkForUpdates: boolean;
  startAtLogin: boolean;
  minimizeToTray: boolean;
  
  // Download settings
  downloadLocation: string;
  concurrentDownloads: number;
  downloadFormat: 'mp4' | 'webm' | 'mp3' | 'best';
  maxQuality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
  autoConvertToMp3: boolean;
  
  // Playback settings
  defaultVolume: number;
  autoPlay: boolean;
  
  // Playlist settings
  playlistLocation: string;
  autoRefreshPlaylists: boolean;
  refreshInterval: number; // in milliseconds
  
  // YouTube API settings
  youtubeApiKey?: string;
  
  // Saved accounts/tokens
  accounts?: Record<string, { refreshToken: string }>;
  
  // Advanced settings
  ytDlpPath?: string;
  ffmpegPath?: string;
  debug: boolean;
}

/**
 * Error types
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// File system validation result
export interface PathValidationResult {
  valid: boolean;
  error?: string;
}

// Download options for videos
export interface DownloadOptions {
  format?: 'mp4' | 'webm' | 'mp3' | 'best';
  quality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
}

// Playlist update options
export type PlaylistUpdateOptions = Partial<Omit<Playlist, 'id' | 'videos' | 'createdAt'>>;

// API exposed to renderer via preload script
export interface Api {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  
  // Settings API
  settings: {
    get: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>;
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;
    getAll: () => Promise<AppSettings>;
    reset: <K extends keyof AppSettings>(key: K) => Promise<boolean>;
    resetAll: () => Promise<boolean>;
  };
  
  // File system API
  fs: {
    selectDirectory: () => Promise<string | null>;
    createPlaylistDir: (playlistId: string, playlistName: string) => Promise<string>;
    writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => Promise<boolean>;
    readPlaylistMetadata: (playlistId: string, playlistName: string) => Promise<any>;
    getAllPlaylists: () => Promise<any[]>;
    deletePlaylist: (playlistId: string, playlistName: string) => Promise<boolean>;
    videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => Promise<boolean>;
    getFileSize: (filePath: string) => Promise<number>;
    getFreeDiskSpace: () => Promise<number>;
    validatePath: (dirPath: string) => Promise<PathValidationResult>;
  };
  
  // Image utilities
  images: {
    cacheImage: (url: string) => Promise<string>;
    getLocalPath: (url: string, downloadIfMissing?: boolean) => Promise<string>;
    clearCache: (maxAgeDays?: number) => Promise<boolean>;
  };
  
  // YouTube API
  youtube: {
    getPlaylistInfo: (playlistUrl: string) => Promise<{
      id: string;
      title: string;
      description: string;
      thumbnailUrl: string;
      videoCount: number;
    }>;
    getPlaylistVideos: (playlistUrl: string) => Promise<Video[]>;
    importPlaylist: (playlistUrl: string) => Promise<Playlist>;
    checkVideoStatus: (videoUrl: string) => Promise<'available' | 'unavailable'>;
    downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: DownloadOptions) => Promise<string>;
  };
  
  // yt-dlp management API
  ytDlp: {
    getStatus: () => Promise<{ available: boolean; errorMessage: string }>;
    download: () => Promise<{ success: boolean; path: string; error?: string }>;
    getDownloadProgress: () => Promise<{ isDownloading: boolean; progress: number }>;
  };
  
  // Playlist management API
  playlists: {
    create: (name: string, description?: string) => Promise<Playlist>;
    getAll: () => Promise<Playlist[]>;
    getById: (playlistId: string) => Promise<Playlist | null>;
    delete: (playlistId: string) => Promise<boolean>;
    update: (playlistId: string, updates: PlaylistUpdateOptions) => Promise<Playlist>;
    addVideo: (playlistId: string, videoUrl: string) => Promise<Playlist>;
    removeVideo: (playlistId: string, videoId: string) => Promise<Playlist>;
    downloadVideo: (playlistId: string, videoId: string, options?: DownloadOptions) => Promise<string>;
    refresh: (playlistId: string) => Promise<Playlist>;
  };
}

export type PlaylistSource = 'local' | 'youtube' | 'custom'; 