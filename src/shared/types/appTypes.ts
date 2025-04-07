/**
 * Core application types for Playlistify
 */

/**
 * Download status types
 */
export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';

/**
 * Download item interface
 */
export interface DownloadItem {
  id: string;
  videoId: string;
  playlistId?: string;
  url: string;
  title: string;
  outputDir: string;
  outputPath?: string;
  status: DownloadStatus;
  progress: number;
  speed?: string;
  eta?: string;
  size?: string;
  error?: string;
  format?: string;
  quality?: string;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  thumbnail?: string;
}

/**
 * Download options interface
 */
export interface DownloadOptions {
  format?: 'mp4' | 'webm' | 'mp3' | 'best';
  quality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best';
}

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
  playlistId?: string; // Reference to the parent playlist
  maxQuality?: string; // Maximum available quality for this video (e.g., '1080p', '4K')
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

// These are already defined above
// export interface DownloadOptions {
//   format?: 'mp4' | 'webm' | 'mp3' | 'best';
//   quality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
// }

// Supported output formats
export type OutputFormat = 'mp4' | 'webm' | 'mp3' | 'aac' | 'flac' | 'opus' | 'm4a';

// Conversion options
export interface ConversionOptions {
  format: OutputFormat;
  quality?: string;
  audioBitrate?: string;
  videoBitrate?: string;
  width?: number;
  height?: number;
  fps?: number;
  startTime?: string;
  endTime?: string;
  metadata?: Record<string, string>;
}

// Conversion progress
export interface ConversionProgress {
  percent: number;
  fps?: number;
  kbps?: number;
  targetSize?: number;
  currentSize?: number;
  timemark?: string;
  eta?: string;
}

// Conversion result
export interface ConversionResult {
  success: boolean;
  outputPath: string;
  duration: number;
  format: string;
  size: number;
  error?: string;
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
    importPlaylist: (playlistUrl: string, playlistInfo?: any) => Promise<Playlist>;
    checkVideoStatus: (videoUrl: string) => Promise<{
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
    }>;
    downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: DownloadOptions) => Promise<string>;
    onImportProgress: (callback: (data: { status: string, count?: number, total?: number }) => void) => (() => void);
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

  // Database management API
  database: {
    getInfo: () => Promise<{
      success: boolean;
      path?: string;
      directory?: string;
      size?: {
        bytes: number;
        megabytes: string;
      };
      stats?: any;
      integrity?: any;
      error?: string;
    }>;
    backup: () => Promise<{
      success: boolean;
      path?: string;
      size?: {
        bytes: number;
        megabytes: string;
      };
      error?: string;
    }>;
    restore: (backupPath: string) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
    }>;
    listBackups: () => Promise<{
      success: boolean;
      backups?: Array<{
        path: string;
        filename: string;
        date: string;
        size: string;
        bytes: number;
      }>;
      error?: string;
    }>;
    optimize: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };

  // Application management API
  app: {
    restart: () => Promise<void>;
  };

  // Download manager API
  downloads: {
    addToQueue: (
      videoUrl: string,
      videoId: string,
      title: string,
      outputDir: string,
      options?: DownloadOptions,
      playlistId?: string,
      thumbnail?: string
    ) => Promise<string>;
    addMultipleToQueue: (
      videos: Array<{videoId: string, url: string, title: string, thumbnail?: string}>,
      playlistId: string,
      playlistName: string
    ) => Promise<string[]>;
    pause: (downloadId: string) => Promise<boolean>;
    resume: (downloadId: string) => Promise<boolean>;
    cancel: (downloadId: string) => Promise<boolean>;
    remove: (downloadId: string) => Promise<boolean>;
    getAll: () => Promise<DownloadItem[]>;
    getById: (downloadId: string) => Promise<DownloadItem | undefined>;
    getByPlaylist: (playlistId: string) => Promise<DownloadItem[]>;
    getByStatus: (status: DownloadStatus) => Promise<DownloadItem[]>;
    getQueueStats: () => Promise<{
      pending: number;
      active: number;
      completed: number;
      failed: number;
      paused: number;
      canceled: number;
      total: number;
    }>;
    checkVideoStatus: (videoUrl: string) => Promise<{
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
    }>;
    onDownloadUpdate: (callback: (download: DownloadItem) => void) => () => void;
  };

  // Format converter API
  formatConverter: {
    initFFmpeg: () => Promise<{ success: boolean; error?: string }>;
    convertFile: (
      inputPath: string,
      options: ConversionOptions
    ) => Promise<{
      success: boolean;
      result?: ConversionResult;
      progressChannel?: string;
      error?: string;
    }>;
    convertDownloadedVideo: (
      downloadId: string,
      options: ConversionOptions
    ) => Promise<{
      success: boolean;
      result?: ConversionResult;
      progressChannel?: string;
      error?: string;
    }>;
    extractAudio: (
      inputPath: string,
      format?: string
    ) => Promise<{
      success: boolean;
      result?: ConversionResult;
      progressChannel?: string;
      error?: string;
    }>;
    changeResolution: (
      inputPath: string,
      quality: string
    ) => Promise<{
      success: boolean;
      result?: ConversionResult;
      progressChannel?: string;
      error?: string;
    }>;
    trimVideo: (
      inputPath: string,
      startTime: string,
      endTime: string
    ) => Promise<{
      success: boolean;
      result?: ConversionResult;
      progressChannel?: string;
      error?: string;
    }>;
    getAvailableFormats: () => Promise<{
      video: string[];
      audio: string[];
    }>;
    getAvailableQualities: () => Promise<string[]>;
    getVideoDuration: (filePath: string) => Promise<{
      success: boolean;
      duration?: number;
      formattedDuration?: string;
      error?: string;
    }>;
    onConversionProgress: (
      channel: string,
      callback: (progress: ConversionProgress) => void
    ) => () => void;
  };
}

// Extend the Window interface to include our API
declare global {
  interface Window {
    electron: Api;
  }
}