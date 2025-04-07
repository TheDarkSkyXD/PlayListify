/**
 * Types for file utility functions
 */

/**
 * Playlist directory information
 */
export interface PlaylistDirectoryInfo {
  dir: string;
  updatedAt: number;
}

/**
 * Playlist metadata information
 */
export interface PlaylistMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  videos: Array<any>;
  source?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Disk space information
 */
export interface DiskSpaceInfo {
  free: number;
  total: number;
  used: number;
}
