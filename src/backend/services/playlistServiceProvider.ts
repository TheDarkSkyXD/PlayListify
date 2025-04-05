import * as playlistManager from './playlistManager';
import * as playlistManagerDb from './playlistManagerDb';
import * as dbManager from './databaseManager';
import { Playlist } from '../../shared/types/appTypes';

/**
 * Determines whether to use the database-based playlist manager
 * Always returns true as SQLite is now the default storage method
 */
export function useDatabaseManager(): boolean {
  return true;
}

/**
 * Initialize the database if needed
 */
export function initializeDatabase(): void {
  try {
    if (useDatabaseManager()) {
      dbManager.initDatabase();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

/**
 * Create a new empty playlist
 */
export async function createEmptyPlaylist(name: string, description?: string): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.createEmptyPlaylist(name, description);
  } else {
    return await playlistManager.createEmptyPlaylist(name, description);
  }
}

/**
 * Import a YouTube playlist
 */
export async function importYoutubePlaylist(
  playlistUrl: string,
  progressCallback?: (message: string, progress?: number, total?: number) => void,
  playlistInfo?: any
): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.importYoutubePlaylist(playlistUrl, progressCallback, playlistInfo);
  } else {
    return await playlistManager.importYoutubePlaylist(playlistUrl, progressCallback, playlistInfo);
  }
}

/**
 * Get all playlists
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.getAllPlaylists();
  } else {
    return await playlistManager.getAllPlaylists();
  }
}

/**
 * Get a playlist by ID
 */
export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.getPlaylistById(playlistId);
  } else {
    return await playlistManager.getPlaylistById(playlistId);
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(playlistId: string): Promise<boolean> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.deletePlaylist(playlistId);
  } else {
    await playlistManager.deletePlaylist(playlistId);
    return true; // If no error was thrown, consider it successful
  }
}

/**
 * Update a playlist
 */
export async function updatePlaylist(
  playlistId: string,
  updates: Partial<Omit<Playlist, 'id' | 'videos' | 'createdAt'>>
): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.updatePlaylist(playlistId, updates);
  } else {
    return await playlistManager.updatePlaylist(playlistId, updates);
  }
}

/**
 * Add a video to a playlist
 */
export async function addVideoToPlaylist(playlistId: string, videoUrl: string): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.addVideoToPlaylist(playlistId, videoUrl);
  } else {
    return await playlistManager.addVideoToPlaylist(playlistId, videoUrl);
  }
}

/**
 * Remove a video from a playlist
 */
export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.removeVideoFromPlaylist(playlistId, videoId);
  } else {
    return await playlistManager.removeVideoFromPlaylist(playlistId, videoId);
  }
}

/**
 * Download a video from a playlist
 */
export async function downloadPlaylistVideo(
  playlistId: string,
  videoId: string,
  options: {
    format?: string;
    quality?: string;
  } = {}
): Promise<Playlist | string> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.downloadPlaylistVideo(playlistId, videoId, options);
  } else {
    // The file-based manager returns a string (file path), but we need to maintain API compatibility
    // So we get the playlist after downloading
    const filePath = await playlistManager.downloadPlaylistVideo(playlistId, videoId, options);
    // Return the updated playlist
    return await playlistManager.getPlaylistById(playlistId) || filePath;
  }
}

/**
 * Refresh a YouTube playlist
 */
export async function refreshYoutubePlaylist(playlistId: string): Promise<Playlist> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.refreshYoutubePlaylist(playlistId);
  } else {
    return await playlistManager.refreshYoutubePlaylist(playlistId);
  }
}

/**
 * Search for playlists
 */
export async function searchPlaylists(query: string): Promise<Playlist[]> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.searchPlaylists(query);
  } else {
    // File-based manager doesn't have search, so we'll implement a basic one
    const playlists = await playlistManager.getAllPlaylists();
    const lowerQuery = query.toLowerCase();

    return playlists.filter(playlist =>
      playlist.name.toLowerCase().includes(lowerQuery) ||
      (playlist.description && playlist.description.toLowerCase().includes(lowerQuery)) ||
      playlist.videos.some(video => video.title.toLowerCase().includes(lowerQuery))
    );
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  playlistCount: number;
  videoCount: number;
  downloadedVideoCount: number;
  totalVideoSize: number;
}> {
  if (useDatabaseManager()) {
    return await playlistManagerDb.getDatabaseStats();
  } else {
    // Calculate stats from file-based playlists
    const playlists = await playlistManager.getAllPlaylists();
    const videoCount = playlists.reduce((count, playlist) => count + playlist.videos.length, 0);
    const downloadedVideos = playlists.flatMap(playlist =>
      playlist.videos.filter(video => video.downloaded)
    );
    const totalSize = downloadedVideos.reduce((total, video) => total + (video.fileSize || 0), 0);

    return {
      playlistCount: playlists.length,
      videoCount,
      downloadedVideoCount: downloadedVideos.length,
      totalVideoSize: totalSize
    };
  }
}
