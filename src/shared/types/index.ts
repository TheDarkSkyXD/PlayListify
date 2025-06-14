// src/shared/types/index.ts

export interface Video {
  id: string; // YouTube video ID
  title: string;
  artist?: string; // Or channelName
  thumbnailUrl?: string;
  duration?: number; // in seconds
  url: string; // YouTube video URL
  filePath?: string; // Path to downloaded file
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused' | 'queued';
  downloadProgress?: number; // 0-100
  isLive?: boolean;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
  channelId?: string;
  channelTitle?: string;
  // Add other video-specific fields as needed
}

export interface Playlist {
  id: string; // Unique identifier (e.g., YouTube Playlist ID or local UUID)
  name: string;
  description?: string;
  videos: Video[];
  videoCount: number;
  thumbnailUrl?: string; // Usually the thumbnail of the first video
  source: 'youtube' | 'local' | 'imported'; // To distinguish origin
  youtubePlaylistId?: string; // If imported from YouTube
  lastRefreshed?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Add other playlist-specific fields as needed
}

export interface PlaylistCreateInput {
  name: string;
  description?: string;
  videos?: Video[]; // Optional: can be empty or populated later
  source: 'youtube' | 'local' | 'imported';
  youtubePlaylistId?: string;
}

export interface PlaylistUpdateInput {
  name?: string;
  description?: string;
  videos?: Video[]; // Allows complete replacement of videos
  // Note: 'source' and 'youtubePlaylistId' are generally not updatable after creation
  // 'id', 'createdAt', 'updatedAt', 'videoCount' are managed by the service
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  downloadLocation: string;
  concurrentDownloads: number; // Max number of concurrent downloads
  maxQuality: '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best';
  downloadFormat: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'opus'; // Add more as needed
  autoUpdatePlaylists: boolean;
  refreshIntervalHours: number; // For auto-updating playlists
  enableNotifications: boolean;
  currentUserAccount?: Partial<UserAccount> | null; // For storing very basic current user info
  // Add other settings fields as needed
}

export interface DownloadItem {
  id: string; // Unique ID for the download task
  videoId: string;
  playlistId?: string; // Optional, if part of a playlist download
  title: string;
  thumbnailUrl?: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  speed?: string; // e.g., "1.5 MB/s"
  eta?: string; // e.g., "5 min"
  filePath?: string; // Path to the downloaded file
  format: string; // e.g., 'mp4', 'mp3'
  quality: string; // e.g., '1080p'
  error?: string; // Error message if failed
  addedAt: string; // ISO date string
  // Add other download-specific fields as needed
}

export interface DownloadRequest {
  video: Video; // The video to download
  playlistId?: string; // Optional: if part of a playlist
  format?: string; // e.g., 'mp4', 'mp3' - will come from settings or user choice
  quality?: string; // e.g., '1080p', '720p' - will come from settings or user choice
}

export interface UserAccount {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  authProvider: 'google' | 'none'; // Example
  accessToken?: string; // Store securely
  refreshToken?: string; // Store securely
  // Add other user-specific fields as needed
}

export interface ErrorResponse {
  message: string;
  code?: string | number; // Optional error code
  details?: any; // Additional error details
}

// IPC related types
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

// For React Query mutations, often a simple success/error is enough,
// or sometimes you need to return the created/updated entity.
export interface MutationResponse<T = any> extends IpcResponse<T> {}

// Generic type for API responses that might be paginated
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Example of a more specific API response for playlists
export interface PlaylistsApiResponse extends PaginatedResponse<Playlist> {}
export interface PlaylistApiResponse extends Playlist {}


// General application status or health check
export interface AppStatus {
  version: string;
  isOnline: boolean;
  dependencies: {
    ffmpeg: 'installed' | 'not_installed' | 'checking';
    ytDlp: 'installed' | 'not_installed' | 'checking';
  };
}

// You can expand this file with more specific types as the application grows.
// For example, types for history items, specific API call payloads, etc.

export type SortOrder = 'asc' | 'desc';

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  filter?: Record<string, any>; // Generic filter object
}