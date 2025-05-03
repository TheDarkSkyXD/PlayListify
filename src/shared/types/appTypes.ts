// App information interface
export interface AppInfo {
  name: string;
  version: string;
  electronVersion: string;
  nodeVersion: string;
  chromiumVersion: string;
  platform: string;
  arch: string;
  userDataPath: string;
}

// Playlist related interfaces
export interface PlaylistSummary {
  id: number;
  name: string;
  description?: string;
  videoCount: number;
  thumbnailUrl?: string;
  updatedAt: string;
}

export interface Playlist extends PlaylistSummary {
  videos: PlaylistVideo[];
  createdAt: string;
  lastOpened?: string;
  tags?: string[];
}

export interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number; // in seconds
  status: VideoStatus;
  downloaded: boolean;
  addedAt: string;
  position: number;
}

export interface PlaylistVideoWithDetails extends PlaylistVideo {
  description?: string;
  author?: string;
  viewCount?: number;
  publishedAt?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  status: VideoStatus;
  downloaded: boolean;
  addedAt: string;
}

export type VideoStatus = 'available' | 'unavailable' | 'private' | 'deleted' | 'unknown';

// Response interfaces
export interface PlaylistsResponse {
  success: boolean;
  playlists?: PlaylistSummary[];
  error?: string;
}

export interface PlaylistDetailsResponse {
  success: boolean;
  playlist?: Playlist;
  details?: Playlist;
  error?: string;
}

export interface PlaylistCreateResponse {
  success: boolean;
  playlistId?: number;
  error?: string;
}

export interface PlaylistImportResponse {
  success: boolean;
  playlistId?: number;
  playlistName?: string;
  error?: string;
  warnings?: string[];
}

export interface PlaylistUpdateResponse {
  success: boolean;
  error?: string;
}

export interface PlaylistDeleteResponse {
  success: boolean;
  error?: string;
}

export interface PlaylistRefreshResponse {
  success: boolean;
  error?: string;
}

export interface PlaylistExportResponse {
  success: boolean;
  jsonData?: string;
  error?: string;
}

export interface VideoAddResponse {
  success: boolean;
  videoId?: string;
  playlistVideoId?: number;
  error?: string;
}

export interface VideoRemoveResponse {
  success: boolean;
  error?: string;
}

export interface VideoUpdatePositionResponse {
  success: boolean;
  error?: string;
}

// Download related interfaces
export interface DownloadOptions {
  format?: 'mp4' | 'webm' | 'mp3' | 'best';
  quality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best';
  audioOnly?: boolean;
  outputDir?: string;
}

export interface DownloadItem {
  id: string;
  videoId: string;
  playlistId?: number;
  url: string;
  title: string;
  outputDir: string;
  status: DownloadStatus;
  progress: number;
  format: string;
  quality: string;
  addedAt: string;
  completedAt?: string;
  thumbnail?: string;
  error?: string;
}

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';

// Settings interface
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  downloadPath: string;
  maxConcurrentDownloads: number;
  autoUpdateCheck: boolean;
  ffmpegPath?: string;
  ytdlpPath?: string;
  defaultFormat: 'mp4' | 'webm' | 'mp3' | 'best';
  defaultQuality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best';
  autoConvertToMp3: boolean;
  minimizeToTray: boolean;
  startAtLogin: boolean;
}

// Error handling
export interface AppError {
  message: string;
  code?: string;
  details?: any;
} 