export interface Playlist {
  id: string;
  name: string;
  source: 'custom' | 'youtube';
  itemCount: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  description?: string;
  youtubePlaylistId?: string; // Only if source is 'youtube'
}

export interface Video {
  id: string; // Usually the YouTube video ID
  url: string; // Source URL of the video
  title: string;
  channel?: string;
  duration?: number; // in seconds
  thumbnailUrl?: string;
  isAvailable: boolean;
  isDownloaded: boolean;
  localFilePath?: string;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | 'queued';
  downloadProgress?: number; // 0-100
  lastWatchedAt?: string; // ISO 8601 date string
  watchProgress?: number; // 0-1 (percentage)
  addedAt?: string; // ISO 8601 date string
}

export interface PlaylistVideo extends Video {
  playlistId: string;
  position: number; // Order within the playlist
}

export interface Settings {
  downloadLocation: string;
  defaultQuality: 'best' | '1080p' | '720p' | '480p' | '360p';
  downloadFormat?: 'mp4' | 'webm' | 'mkv' | 'best';
  concurrentDownloads: number;
  theme: 'light' | 'dark' | 'system';
  checkForUpdates: boolean;
  // Add other settings as needed
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Example for a specific error type
export interface AppError {
  message: string;
  code?: string; // Optional error code
  details?: any;
}

// You can expand this with more specific types as features are built.
// For example, for yt-dlp formats:
export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  fps?: number;
  filesize?: number;
  tbr?: number; // Target bitrate
  vcodec?: string;
  acodec?: string;
  // ... other fields from yt-dlp format listing
}

// For download queue items if needed in frontend state
export interface DownloadQueueItem extends Video {
  playlistId?: string;
  status: 'pending' | 'queued' | 'downloading' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  eta?: string; // Estimated time remaining
  speed?: string; // Download speed
  outputPath?: string;
  selectedFormat?: VideoFormat; // Or just a format ID string
  requestedFormat?: Settings['downloadFormat']; // Store the format requested at add time
  requestedQuality?: Settings['defaultQuality']; // Store the quality requested at add time
  addedToQueueAt: string; // ISO 8601 date string
}

export type { VideoQuality, Theme } from './settings';
// Make sure UserSettings in settings.ts is the source of truth
// export interface UserSettings { // Commenting out the local definition
//   downloadLocation: string;
//   maxConcurrentDownloads: number;
//   defaultQuality: VideoQuality; 
//   theme: Theme; 
//   notifyOnDownloadComplete: boolean;
//   autoStartDownloads: boolean;
//   minimizeToTray: boolean;
//   developerMode: boolean;
//   downloadFormat?: 'mp4' | 'webm' | 'mp3' | 'opus' | 'flac' | 'wav' | 'best'; // This was added here
//   // Add other settings as needed
// }

// Re-export UserSettings from settings.ts
export type { UserSettings } from './settings'; 