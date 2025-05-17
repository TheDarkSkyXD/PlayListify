export * from './settings';
export * from './playlist';
export * from './ipc';
export * from './download';
export * from './electron';
export * from './yt-dlp';
export * from './video';

// Define PlaylistEntryPreview before it's used
export interface PlaylistEntryPreview {
  id: string;
  title: string;
  duration?: number; // in seconds
  thumbnail?: string; // Optional thumbnail for the entry itself
  // Add other relevant preview fields if necessary, like uploader or URL
}

// Remove local Video definition
// export interface Video {
//   id: string; // Usually the YouTube video ID
//   url: string; // Source URL of the video
//   title: string;
//   channel?: string;
//   duration?: number; // in seconds
//   thumbnailUrl?: string;
//   isAvailable: boolean;
//   isDownloaded: boolean;
//   localFilePath?: string;
//   downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | 'queued';
//   downloadProgress?: number; // 0-100
//   lastWatchedAt?: string; // ISO 8601 date string
//   watchProgress?: number; // 0-1 (percentage)
//   addedAt?: string; // ISO 8601 date string
// }

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
  message?: string;
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
// export interface DownloadQueueItem extends Video {
//   playlistId?: string;
//   status: 'pending' | 'queued' | 'downloading' | 'completed' | 'failed' | 'paused' | 'cancelled';
//   progress: number; // 0-100
//   eta?: string; // Estimated time remaining
//   speed?: string; // Download speed
//   outputPath?: string;
//   selectedFormat?: VideoFormat; // Or just a format ID string
//   requestedFormat?: Settings['downloadFormat']; // Store the format requested at add time
//   requestedQuality?: Settings['defaultQuality']; // Store the quality requested at add time
//   addedToQueueAt: string; // ISO 8601 date string
// }

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

// Remove local CreatePlaylistPayload and UpdatePlaylistPayload, rely on re-export from ./playlist
// export interface CreatePlaylistPayload {
//   name: string;
//   description?: string;
//   isPrivate?: boolean;
//   // Potentially videoIds if creating with initial videos
// }

// export interface UpdatePlaylistPayload {
//   id: string; // ID of the playlist to update
//   name?: string; // Optional: only update if provided
//   description?: string; // Optional: only update if provided
//   isPrivate?: boolean; // Optional: only update if provided
//   // Cannot change source or youtubePlaylistId via this payload usually
// }

export * from './settings';
export * from './playlist';
export * from './ipc';
export * from './download';
export * from './electron'; 

export interface SharedVideoPreviewData {
  // ... existing code ...
} 