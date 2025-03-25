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
  addedAt?: Date;
  status?: 'available' | 'unavailable' | 'checking';
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed';
  downloadProgress?: number;
  localPath?: string;
}

/**
 * Playlist containing videos
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videos: Video[];
  createdAt: Date;
  updatedAt: Date;
  url?: string; // Original YouTube URL if imported
  tags?: string[];
  thumbnailUrl?: string;
  isPrivate?: boolean;
  lastSyncedAt?: Date;
}

/**
 * Application settings
 */
export interface AppSettings {
  general: {
    theme: 'light' | 'dark' | 'system';
    startOnBoot: boolean;
    autoUpdate: boolean;
  };
  downloads: {
    location: string;
    maxConcurrent: number;
    videoQuality: 'highest' | 'high' | 'medium' | 'low';
    audioOnly: boolean;
    convertToMp3: boolean;
    createPlaylistFolder: boolean;
    fileNamingTemplate: string;
  };
  playback: {
    defaultVolume: number;
    autoPlay: boolean;
    loopPlaylist: boolean;
    skipUnavailable: boolean;
  };
  playlists: {
    autoSync: boolean;
    syncInterval: number; // In minutes
    checkAvailability: boolean;
  };
  accounts: {
    youtubeAccounts: Array<{
      id: string;
      email: string;
      name?: string;
      isActive: boolean;
    }>;
  };
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