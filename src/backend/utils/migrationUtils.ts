import { Playlist, Video } from '../../shared/types/appTypes';
import * as fileUtils from './fileUtils';
import * as dbManager from '../services/databaseManager';

/**
 * Migrate all playlists from file system to SQLite database
 */
export async function migrateAllPlaylists(): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Initialize the database
    dbManager.initDatabase();

    // Get all playlists from file system
    const playlists = await fileUtils.getAllPlaylists();

    const result = {
      success: true,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Migrate each playlist
    for (const playlist of playlists) {
      try {
        await migratePlaylist(playlist);
        result.migrated++;
      } catch (error: any) {
        console.error(`Failed to migrate playlist ${playlist.name} (${playlist.id}):`, error);
        result.failed++;
        result.errors.push(`Playlist ${playlist.name} (${playlist.id}): ${error.message}`);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [error.message]
    };
  }
}

/**
 * Migrate a single playlist from file system to SQLite database
 */
export async function migratePlaylist(playlist: Playlist): Promise<boolean> {
  try {
    // Check if playlist already exists in database
    const existingPlaylist = dbManager.getPlaylistById(playlist.id);

    if (existingPlaylist) {
      console.log(`Playlist ${playlist.name} (${playlist.id}) already exists in database, skipping`);
      return true;
    }

    // Create playlist in database
    dbManager.createPlaylist(playlist);

    // Migrate videos
    if (playlist.videos && playlist.videos.length > 0) {
      for (const video of playlist.videos) {
        dbManager.addVideo(playlist.id, video);
      }
    }

    console.log(`Migrated playlist ${playlist.name} (${playlist.id}) with ${playlist.videos?.length || 0} videos`);
    return true;
  } catch (error: any) {
    console.error(`Failed to migrate playlist ${playlist.name} (${playlist.id}):`, error);
    throw error;
  }
}

/**
 * Verify migration by comparing file system and database
 */
export async function verifyMigration(): Promise<{
  success: boolean;
  playlistsInFiles: number;
  playlistsInDb: number;
  videosInFiles: number;
  videosInDb: number;
  missingPlaylists: string[];
  missingVideos: string[];
}> {
  try {
    // Get playlists from file system
    const filePlaylists = await fileUtils.getAllPlaylists();

    // Get playlists from database
    const dbPlaylists = dbManager.getAllPlaylists();

    // Count videos
    const fileVideosCount = filePlaylists.reduce((count, playlist) => count + (playlist.videos?.length || 0), 0);
    const dbVideosCount = dbPlaylists.reduce((count, playlist) => count + (playlist.videos?.length || 0), 0);

    // Find missing playlists
    const dbPlaylistIds = new Set(dbPlaylists.map(p => p.id));

    const missingPlaylists = filePlaylists
      .filter(p => !dbPlaylistIds.has(p.id))
      .map(p => `${p.name} (${p.id})`);

    // Find missing videos
    const missingVideos: string[] = [];

    for (const filePlaylist of filePlaylists) {
      const dbPlaylist = dbPlaylists.find(p => p.id === filePlaylist.id);

      if (dbPlaylist) {
        const fileVideoIds = new Set(filePlaylist.videos?.map((v: Video) => v.id) || []);
        const dbVideoIds = new Set(dbPlaylist.videos?.map((v: Video) => v.id) || []);

        const missingVideoIds = Array.from(fileVideoIds).filter((id) => !dbVideoIds.has(id as string));

        for (const videoId of missingVideoIds) {
          const video = filePlaylist.videos?.find((v: Video) => v.id === videoId);
          if (video) {
            missingVideos.push(`${video.title} (${video.id}) in playlist ${filePlaylist.name}`);
          }
        }
      }
    }

    return {
      success: missingPlaylists.length === 0 && missingVideos.length === 0,
      playlistsInFiles: filePlaylists.length,
      playlistsInDb: dbPlaylists.length,
      videosInFiles: fileVideosCount,
      videosInDb: dbVideosCount,
      missingPlaylists,
      missingVideos
    };
  } catch (error: any) {
    console.error('Verification failed:', error);
    return {
      success: false,
      playlistsInFiles: 0,
      playlistsInDb: 0,
      videosInFiles: 0,
      videosInDb: 0,
      missingPlaylists: [],
      missingVideos: []
    };
  }
}
