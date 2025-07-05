// src/shared/data-models.ts

/**
 * This file defines the TypeScript interfaces for all data models used in the
 * Playlistify application. These models represent the structure of the data
 * stored and manipulated by the application.
 */

//==============================================================================
// Core Data Models
//==============================================================================

/**
 * Represents a user account in the system.
 */
export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a playlist of videos.
 */
export interface Playlist {
  id: number;
  userId: number;
  title: string;
  description: string;
  type: 'YOUTUBE' | 'CUSTOM';
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheck: Date;
}

/**
 * Represents a video.
 */
export interface Video {
  id: string;
  title: string;
  channelName: string;
  duration: string;
  viewCount: number;
  uploadDate: Date;
  thumbnailURL: string;
  availabilityStatus: 'LIVE' | 'PUBLIC' | 'PRIVATE' | 'DELETED';
  downloadedQuality?: string;
  downloadPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents the relationship between playlists and videos (many-to-many relationship).
 */
export interface PlaylistVideo {
  playlistId: number;
  videoId: string;
  order: number;
}

/**
 * Represents a background task (e.g., importing a playlist, downloading videos).
 */
export interface BackgroundTask {
  id: number;
  type: 'IMPORT_PLAYLIST' | 'DOWNLOAD_VIDEO' | 'REFRESH_PLAYLIST';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  targetId: string;
  parentId?: number;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

//==============================================================================
// Type Aliases and Utility Types
//==============================================================================

/**
 * Union type for all playlist types
 */
export type PlaylistType = Playlist['type'];

/**
 * Union type for all video availability statuses
 */
export type VideoAvailabilityStatus = Video['availabilityStatus'];

/**
 * Union type for all background task types
 */
export type BackgroundTaskType = BackgroundTask['type'];

/**
 * Union type for all background task statuses
 */
export type BackgroundTaskStatus = BackgroundTask['status'];

//==============================================================================
// Input/Output Types for API Operations
//==============================================================================

/**
 * Input type for creating a new playlist
 */
export interface CreatePlaylistInput {
  title: string;
  description?: string;
  type: PlaylistType;
}

/**
 * Input type for importing a playlist from URL
 */
export interface ImportPlaylistInput {
  url: string;
}

/**
 * Input type for downloading a video
 */
export interface DownloadVideoInput {
  videoId: string;
  quality: string;
  format: 'mp4' | 'mp3';
  downloadPath: string;
}

/**
 * Input type for getting playlist details
 */
export interface GetPlaylistDetailsInput {
  playlistId: number;
}

/**
 * Input type for settings operations
 */
export interface SettingsInput {
  key: string;
  value?: any;
}

//==============================================================================
// Event Payload Types
//==============================================================================

/**
 * Payload for download progress events
 */
export interface DownloadProgressPayload {
  taskId: number;
  progress: number;
  speed: string;
}

/**
 * Payload for application error events
 */
export interface AppErrorPayload {
  title: string;
  message: string;
}
