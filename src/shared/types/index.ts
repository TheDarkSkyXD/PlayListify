// Common types used across the application

// Playlist types
export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isCustom: boolean;
  source?: string; // YouTube, Spotify, etc.
  sourceId?: string; // Original playlist ID in the source platform
  createdAt: string;
  updatedAt: string;
}

// Video types
export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  url: string;
  duration?: number; // in seconds
  author?: string;
  source: string; // YouTube, Vimeo, etc.
  sourceId: string; // Original video ID in the source platform
  createdAt: string;
  updatedAt: string;
}

// PlaylistVideo junction type
export interface PlaylistVideo {
  id: string;
  playlistId: string;
  videoId: string;
  position: number;
  addedAt: string;
}

// Download types
export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface DownloadOptions {
  format?: string;
  quality?: string;
  audioOnly?: boolean;
  subtitles?: boolean;
}

export interface Download {
  id: string;
  videoId: string;
  status: DownloadStatus;
  progress: number;
  filePath?: string;
  options: DownloadOptions;
  error?: string;
  startTime?: string;
  endTime?: string;
}

// History types
export interface HistoryItem {
  id: string;
  videoId: string;
  watchedAt: string;
  watchDuration: number; // in seconds
  completed: boolean;
} 