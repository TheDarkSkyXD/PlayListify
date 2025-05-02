// Common types used across the application

// Playlist types
export interface Playlist {
  id?: number;
  name: string;
  description?: string;
  source?: string;
  source_id?: string;
  thumbnail?: string;
  created_at: number;
  updated_at: number;
  video_count?: number;
  duration_seconds?: number;
}

// Video types
export interface Video {
  id?: number;
  video_id: string;
  title: string;
  description?: string;
  duration_seconds?: number;
  thumbnail?: string;
  author?: string;
  author_id?: string;
  published_at?: number;
  view_count?: number;
  created_at: number;
  updated_at: number;
  file_path?: string;
  file_format?: string;
  file_size_bytes?: number;
  download_status?: string;
}

// PlaylistVideo junction type
export interface PlaylistVideo {
  id?: number;
  playlist_id: number;
  video_id: number;
  position: number;
  added_at: number;
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

// Playlist related types
export interface PlaylistSummary {
  id: number;
  name: string;
  thumbnail?: string;
  video_count: number;
  duration_seconds: number;
}

export interface PlaylistVideoWithDetails {
  id: number;
  playlist_id: number;
  video_id: number;
  position: number;
  added_at: number;
  video_external_id: string;
  title: string;
  thumbnail?: string;
  duration_seconds?: number;
  author?: string;
  download_status?: string;
}

// Response types for IPC
export interface PlaylistCreateResponse {
  success: boolean;
  playlistId?: number;
  error?: string;
}

export interface PlaylistImportResponse {
  success: boolean;
  playlistId?: number;
  error?: string;
}

export interface PlaylistsResponse {
  success: boolean;
  playlists?: PlaylistSummary[];
  error?: string;
}

export interface PlaylistDetailsResponse {
  success: boolean;
  details?: {
    playlist: Playlist;
    videos: PlaylistVideoWithDetails[];
  };
  error?: string;
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