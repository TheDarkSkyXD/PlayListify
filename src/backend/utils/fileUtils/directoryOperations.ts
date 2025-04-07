import fs from 'fs-extra';
import path from 'path';
import { getSetting } from '../../services/settingsManager';
import { logToFile } from '../../services/logger';
import { sanitizeFileName } from './sanitization';
import { PlaylistDirectoryInfo } from './types';

/**
 * Ensures a directory exists, creates it if it doesn't
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    console.log(`Ensuring directory exists: ${dirPath}`);
    logToFile('INFO', `Ensuring directory exists: ${dirPath}`);
    await fs.ensureDir(dirPath);

    // Verify the directory was created
    const dirExists = await fs.pathExists(dirPath);
    if (!dirExists) {
      console.error(`Failed to create directory: ${dirPath}`);
      logToFile('ERROR', `Failed to create directory: ${dirPath}`);
      throw new Error(`Failed to create directory: ${dirPath}`);
    }

    console.log(`Directory created/verified: ${dirPath}`);
    logToFile('INFO', `Directory created/verified: ${dirPath}`);
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    logToFile('ERROR', `Failed to create directory ${dirPath}: ${error}`);
    throw error;
  }
}

/**
 * Creates the playlist directory structure
 */
export async function createPlaylistDir(playlistId: string, playlistName: string): Promise<string> {
  const baseDir = getSetting('playlistLocation');
  // Use a sanitized version of the playlist name for the folder
  const sanitizedName = sanitizeFileName(playlistName);
  // Create a directory with format: playlistId-sanitizedName
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);

  try {
    await ensureDir(playlistDir);
    // Create subdirectories for metadata and videos
    await ensureDir(path.join(playlistDir, 'metadata'));
    await ensureDir(path.join(playlistDir, 'videos'));
    return playlistDir;
  } catch (error) {
    console.error(`Failed to create playlist directory for ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Creates a download directory for a playlist
 * @param playlistId The ID of the playlist
 * @param playlistName The name of the playlist
 * @param customLocation Optional custom download location
 * @param createPlaylistFolder Whether to create a separate folder for the playlist
 */
export async function createDownloadDir(
  playlistId: string,
  playlistName: string,
  customLocation?: string,
  createPlaylistFolder: boolean = true
): Promise<string> {
  // Use custom location if provided, otherwise use the default setting
  let baseDir = customLocation || getSetting('downloadLocation');

  try {
    console.log(`Creating download directory at: ${baseDir}`);
    logToFile('INFO', `Creating download directory at: ${baseDir}`);

    // Ensure the base directory exists
    await fs.ensureDir(baseDir);

    // Verify the directory was created
    const dirExists = await fs.pathExists(baseDir);
    if (!dirExists) {
      console.error(`Failed to create base directory: ${baseDir}`);
      logToFile('ERROR', `Failed to create base directory: ${baseDir}`);
      throw new Error(`Failed to create base directory: ${baseDir}`);
    }

    logToFile('INFO', `Base directory created/verified: ${baseDir}`);

    let finalDir = baseDir;

    if (createPlaylistFolder) {
      // Use a sanitized version of the playlist name for the folder
      const sanitizedName = sanitizeFileName(playlistName);
      // Create a directory with format: playlistId-sanitizedName
      const downloadDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);

      console.log(`Creating playlist folder: ${downloadDir}`);
      logToFile('INFO', `Creating playlist folder: ${downloadDir}`);
      await fs.ensureDir(downloadDir);

      // Verify the directory was created
      const downloadDirExists = await fs.pathExists(downloadDir);
      if (!downloadDirExists) {
        console.error(`Failed to create playlist folder: ${downloadDir}`);
        logToFile('ERROR', `Failed to create playlist folder: ${downloadDir}`);
        throw new Error(`Failed to create playlist folder: ${downloadDir}`);
      }

      // Create a videos subfolder
      const videosDir = path.join(downloadDir, 'videos');
      console.log(`Creating videos directory at: ${videosDir}`);
      logToFile('INFO', `Creating videos directory at: ${videosDir}`);
      await fs.ensureDir(videosDir);

      // Verify the videos directory was created
      const videosDirExists = await fs.pathExists(videosDir);
      if (!videosDirExists) {
        console.error(`Failed to create videos directory: ${videosDir}`);
        logToFile('ERROR', `Failed to create videos directory: ${videosDir}`);
        throw new Error(`Failed to create videos directory: ${videosDir}`);
      }

      finalDir = videosDir;
    }

    return finalDir;
  } catch (error) {
    console.error(`Failed to create download directory:`, error);
    logToFile('ERROR', `Failed to create download directory: ${error}`);
    throw error;
  }
}

/**
 * Finds a playlist directory by ID, regardless of name
 */
export async function findPlaylistDirById(playlistId: string): Promise<string | null> {
  const baseDir = getSetting('playlistLocation');

  try {
    await ensureDir(baseDir);
    const items = await fs.readdir(baseDir);

    for (const item of items) {
      // Check if the directory name starts with the playlist ID
      if (item.startsWith(`${playlistId}-`)) {
        return path.join(baseDir, item);
      }
    }

    return null; // No matching directory found
  } catch (error) {
    console.error(`Failed to find playlist directory for ID ${playlistId}:`, error);
    return null;
  }
}

/**
 * Scans for duplicate playlist directories
 */
export async function scanForDuplicatePlaylistDirectories(): Promise<Map<string, PlaylistDirectoryInfo[]>> {
  const baseDir = getSetting('playlistLocation');
  const directoriesByPlaylistId = new Map<string, PlaylistDirectoryInfo[]>();

  try {
    await ensureDir(baseDir);
    const items = await fs.readdir(baseDir);

    console.log(`Scanning ${items.length} items in ${baseDir} for duplicate playlist directories...`);

    for (const item of items) {
      // Only process directories
      const itemPath = path.join(baseDir, item);
      const stats = await fs.stat(itemPath);

      if (!stats.isDirectory()) continue;

      // Check if metadata exists
      const metadataPath = path.join(itemPath, 'metadata', 'playlist-info.json');
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath);

          // Skip if no ID
          if (!metadata.id) {
            console.warn(`Skipping playlist with no ID in directory: ${item}`);
            continue;
          }

          // Track this directory for the playlist ID
          const updatedAt = new Date(metadata.updatedAt || 0).getTime();
          if (!directoriesByPlaylistId.has(metadata.id)) {
            directoriesByPlaylistId.set(metadata.id, []);
          }
          directoriesByPlaylistId.get(metadata.id)?.push({ dir: itemPath, updatedAt });
        } catch (parseError) {
          console.error(`Error parsing playlist metadata in ${item}:`, parseError);
        }
      }
    }

    // Log the results
    let duplicateCount = 0;
    for (const [id, dirs] of directoriesByPlaylistId.entries()) {
      if (dirs.length > 1) {
        duplicateCount++;
        console.log(`Found ${dirs.length} directories for playlist ID ${id}:`);
        dirs.forEach(d => console.log(`  - ${d.dir} (updated: ${new Date(d.updatedAt).toISOString()})`));
      }
    }

    console.log(`Found ${duplicateCount} playlists with duplicate directories`);
    return directoriesByPlaylistId;
  } catch (error) {
    console.error('Error scanning for duplicate playlist directories:', error);
    return new Map();
  }
}

/**
 * Cleans up duplicate playlist directories, keeping only the newest one for each playlist ID
 */
export async function cleanupDuplicatePlaylistDirectories(
  directoriesByPlaylistId?: Map<string, PlaylistDirectoryInfo[]>
): Promise<void> {
  // If no directories map is provided, scan for duplicates first
  if (!directoriesByPlaylistId) {
    console.log('No directories map provided, scanning for duplicates...');
    directoriesByPlaylistId = await scanForDuplicatePlaylistDirectories();
  }
  console.log('Starting cleanup of duplicate playlist directories...');
  let totalRemoved = 0;
  let totalFailed = 0;

  for (const [playlistId, directories] of directoriesByPlaylistId.entries()) {
    // Skip if there's only one directory for this playlist ID
    if (directories.length <= 1) {
      console.log(`Playlist ${playlistId} has only one directory, skipping cleanup.`);
      continue;
    }

    console.log(`Found ${directories.length} directories for playlist ${playlistId}`);

    // Sort directories by updatedAt timestamp (newest first)
    directories.sort((a, b) => b.updatedAt - a.updatedAt);

    // Keep the newest directory, remove the rest
    const newestDir = directories[0].dir;
    console.log(`Keeping newest directory for playlist ${playlistId}: ${newestDir} (updated at ${new Date(directories[0].updatedAt).toISOString()})`);

    // Remove older directories
    for (let i = 1; i < directories.length; i++) {
      const oldDir = directories[i].dir;
      console.log(`Removing older directory: ${oldDir} (updated at ${new Date(directories[i].updatedAt).toISOString()})`);

      try {
        // Check if the directory still exists
        if (await fs.pathExists(oldDir)) {
          await fs.remove(oldDir);
          console.log(`Successfully removed directory: ${oldDir}`);
          totalRemoved++;
        } else {
          console.log(`Directory ${oldDir} no longer exists, skipping removal`);
        }
      } catch (error) {
        console.error(`Failed to remove duplicate directory ${oldDir}:`, error);
        totalFailed++;
      }
    }
  }

  console.log(`Cleanup complete. Removed ${totalRemoved} duplicate directories. Failed to remove ${totalFailed} directories.`);
}

/**
 * Deletes a playlist directory and all its contents
 */
export async function deletePlaylist(playlistId: string, playlistName: string): Promise<void> {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);

  try {
    if (await fs.pathExists(playlistDir)) {
      await fs.remove(playlistDir);
    }
  } catch (error) {
    console.error(`Failed to delete playlist ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Gets free disk space on the drive containing the playlist directory
 */
export async function getFreeDiskSpace(): Promise<number> {
  try {
    const baseDir = getSetting('playlistLocation');
    // Use disk-space library or node-os-utils in a real implementation
    // This is a placeholder since fs.statfs is not properly typed in fs-extra
    const stats = await fs.stat(baseDir);
    // Just return a placeholder value since we can't use statfs without proper typing
    return Number.MAX_SAFE_INTEGER; // In a real implementation, use proper disk space check
  } catch (error) {
    console.error('Failed to get free disk space:', error);
    return 0;
  }
}

/**
 * Moves a file from source to destination
 */
export async function moveFile(source: string, destination: string): Promise<void> {
  try {
    await fs.move(source, destination, { overwrite: true });
  } catch (error) {
    console.error(`Failed to move file from ${source} to ${destination}:`, error);
    throw error;
  }
}
