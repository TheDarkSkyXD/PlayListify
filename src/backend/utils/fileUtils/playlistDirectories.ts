import fs from 'fs-extra';
import path from 'path';
import { getSetting } from '../../services/settingsManager';
import { logToFile } from '../../services/logger';
import { sanitizeFileName } from './sanitization';
import { ensureDir, findPlaylistDirById } from './directoryOperations';
import { PlaylistMetadata } from './types';

/**
 * Note: This function is kept for backward compatibility but is no longer used directly.
 * The writePlaylistMetadata function now handles directory renaming internally.
 * @deprecated Use writePlaylistMetadata instead
 */
export async function renamePlaylistDir(
  playlistId: string,
  oldName: string,
  newName: string
): Promise<string | null> {
  console.warn('renamePlaylistDir is deprecated, use writePlaylistMetadata instead');
  const baseDir = getSetting('playlistLocation');
  const newSanitizedName = sanitizeFileName(newName);
  const newPlaylistDir = path.join(baseDir, `${playlistId}-${newSanitizedName}`);

  try {
    // Find the existing directory for this playlist ID
    const existingDir = await findPlaylistDirById(playlistId);

    if (existingDir) {
      // Skip if the directory is already named correctly
      if (existingDir === newPlaylistDir) {
        console.log(`Playlist directory already has the correct name: ${existingDir}`);
        return existingDir;
      }

      // Rename the directory
      console.log(`Renaming playlist directory from ${existingDir} to ${newPlaylistDir}`);
      await fs.move(existingDir, newPlaylistDir);
      return newPlaylistDir;
    } else {
      // If no existing directory found, create a new one
      console.log(`Creating new directory ${newPlaylistDir}`);
      await ensureDir(newPlaylistDir);
      await ensureDir(path.join(newPlaylistDir, 'metadata'));
      await ensureDir(path.join(newPlaylistDir, 'videos'));
      return newPlaylistDir;
    }
  } catch (error) {
    console.error(`Failed to rename playlist directory from ${oldName} to ${newName}:`, error);
    return null;
  }
}

/**
 * Gets all local playlists
 */
export async function getAllPlaylists(): Promise<PlaylistMetadata[]> {
  const baseDir = getSetting('playlistLocation');

  try {
    await ensureDir(baseDir);
    const items = await fs.readdir(baseDir);

    // Use a Map to store playlists by ID to handle duplicates
    const playlistsMap = new Map<string, PlaylistMetadata>();

    // Track duplicate IDs for logging
    const duplicateIds = new Set<string>();

    // Track directories by playlist ID for cleanup
    const directoriesByPlaylistId = new Map<string, { dir: string, updatedAt: number }[]>();

    for (const item of items) {
      // Only process directories
      const itemPath = path.join(baseDir, item);
      const stats = await fs.stat(itemPath);

      if (!stats.isDirectory()) continue;

      // Check if metadata exists
      const metadataPath = path.join(itemPath, 'metadata', 'playlist-info.json');
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath) as PlaylistMetadata;

          // Skip if no ID
          if (!metadata.id) {
            console.warn(`Skipping playlist with no ID in directory: ${item}`);
            continue;
          }

          // Ensure videos array is properly initialized
          if (!metadata.videos || !Array.isArray(metadata.videos)) {
            console.log(`Fixing missing videos array for playlist: ${metadata.name} (${metadata.id})`);
            metadata.videos = [];
          }

          // Track this directory for the playlist ID
          const updatedAt = new Date(metadata.updatedAt || 0).getTime();
          if (!directoriesByPlaylistId.has(metadata.id)) {
            directoriesByPlaylistId.set(metadata.id, []);
          }
          directoriesByPlaylistId.get(metadata.id)?.push({ dir: itemPath, updatedAt });

          // Check if we already have a playlist with this ID
          if (playlistsMap.has(metadata.id)) {
            // We have a duplicate, keep the one with the most recent updatedAt
            const existingPlaylist = playlistsMap.get(metadata.id)!;
            const existingUpdatedAt = new Date(existingPlaylist.updatedAt || 0).getTime();

            if (updatedAt > existingUpdatedAt) {
              // This one is newer, replace the existing one
              playlistsMap.set(metadata.id, metadata);
              console.log(`Found newer version of playlist ${metadata.name} (${metadata.id}) in ${itemPath}`);
            }

            // Track this as a duplicate for logging
            duplicateIds.add(metadata.id);
          } else {
            // First time seeing this ID, add it to the map
            playlistsMap.set(metadata.id, metadata);
          }
        } catch (parseError) {
          console.error(`Error parsing playlist metadata in ${item}:`, parseError);
        }
      }
    }

    // Log any duplicates found
    if (duplicateIds.size > 0) {
      console.warn(`Found ${duplicateIds.size} playlists with duplicate directories`);
      for (const id of duplicateIds) {
        const dirs = directoriesByPlaylistId.get(id) || [];
        console.warn(`Playlist ${id} has ${dirs.length} directories:`);
        dirs.forEach(d => console.warn(`  - ${d.dir} (updated: ${new Date(d.updatedAt).toISOString()})`));
      }
    }

    // Convert the map to an array
    return Array.from(playlistsMap.values());
  } catch (error) {
    console.error('Failed to get all playlists:', error);
    return [];
  }
}

/**
 * Gets the video file path
 */
export function getVideoFilePath(
  playlistId: string,
  playlistName: string,
  videoId: string,
  format: string = 'mp4'
): string {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  return path.join(playlistDir, 'videos', `${videoId}.${format}`);
}

/**
 * Checks if a video file exists
 */
export async function videoExists(
  playlistId: string,
  playlistName: string,
  videoId: string,
  format: string = 'mp4'
): Promise<boolean> {
  const videoPath = getVideoFilePath(playlistId, playlistName, videoId, format);
  return fs.pathExists(videoPath);
}
