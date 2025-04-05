import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getSetting } from '../services/settingsManager';

/**
 * Ensures a directory exists, creates it if it doesn't
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
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
 */
export async function createDownloadDir(playlistId: string, playlistName: string): Promise<string> {
  const baseDir = getSetting('downloadLocation');
  // Use a sanitized version of the playlist name for the folder
  const sanitizedName = sanitizeFileName(playlistName);
  // Create a directory with format: playlistId-sanitizedName
  const downloadDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  const videosDir = path.join(downloadDir, 'videos');

  try {
    await ensureDir(downloadDir);
    await ensureDir(videosDir);
    return videosDir;
  } catch (error) {
    console.error(`Failed to create download directory for ${playlistName}:`, error);
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

// Note: This function is kept for backward compatibility but is no longer used directly.
// The writePlaylistMetadata function now handles directory renaming internally.
/**
 * Renames a playlist directory when the name changes
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
      // If the directory already has the correct name, just return it
      if (existingDir === newPlaylistDir) {
        return existingDir;
      }

      // Check if the new directory already exists (shouldn't happen, but just in case)
      if (await fs.pathExists(newPlaylistDir) && existingDir !== newPlaylistDir) {
        // Remove the new directory if it exists
        await fs.remove(newPlaylistDir);
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
 * Writes playlist metadata to JSON file
 */
export async function writePlaylistMetadata(
  playlistId: string,
  playlistName: string,
  metadata: any,
  oldName?: string
): Promise<void> {
  const baseDir = getSetting('playlistLocation');
  let playlistDir: string;

  // First, try to find an existing directory for this playlist ID
  const existingDir = await findPlaylistDirById(playlistId);

  if (existingDir) {
    // We found an existing directory for this playlist ID
    const sanitizedNewName = sanitizeFileName(playlistName);
    const expectedNewPath = path.join(baseDir, `${playlistId}-${sanitizedNewName}`);

    // Check if we need to rename the directory (name has changed)
    if (existingDir !== expectedNewPath) {
      console.log(`Renaming playlist directory from ${existingDir} to ${expectedNewPath}`);
      try {
        // Ensure the target directory doesn't exist before moving
        if (await fs.pathExists(expectedNewPath) && existingDir !== expectedNewPath) {
          console.warn(`Target directory ${expectedNewPath} already exists, removing it first`);
          await fs.remove(expectedNewPath);
        }

        // Rename the directory
        await fs.move(existingDir, expectedNewPath);
        playlistDir = expectedNewPath;
      } catch (error) {
        console.error(`Failed to rename directory from ${existingDir} to ${expectedNewPath}:`, error);
        // If rename fails, use the existing directory
        playlistDir = existingDir;
      }
    } else {
      // No need to rename, use the existing directory
      playlistDir = existingDir;
    }
  } else {
    // No existing directory found, create a new one
    const sanitizedName = sanitizeFileName(playlistName);
    playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
    console.log(`Creating new playlist directory: ${playlistDir}`);
    await ensureDir(playlistDir);
    await ensureDir(path.join(playlistDir, 'metadata'));
    await ensureDir(path.join(playlistDir, 'videos'));
  }

  // Write the metadata file
  const metadataPath = path.join(playlistDir, 'metadata', 'playlist-info.json');
  try {
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    console.log(`Successfully wrote metadata for playlist ${playlistName} to ${metadataPath}`);
  } catch (error) {
    console.error(`Failed to write metadata for playlist ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Reads playlist metadata from JSON file
 */
export async function readPlaylistMetadata(
  playlistId: string,
  playlistName: string
): Promise<any> {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  const metadataPath = path.join(playlistDir, 'metadata', 'playlist-info.json');

  try {
    if (await fs.pathExists(metadataPath)) {
      const metadata = await fs.readJson(metadataPath);

      // Ensure videos array is properly initialized
      if (!metadata.videos || !Array.isArray(metadata.videos)) {
        console.log(`Fixing missing videos array for playlist: ${metadata.name} (${metadata.id})`);
        metadata.videos = [];
      }

      return metadata;
    }
    return null;
  } catch (error) {
    console.error(`Failed to read metadata for playlist ${playlistName}:`, error);
    throw error;
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

/**
 * Gets all local playlists
 */
export async function getAllPlaylists(): Promise<any[]> {
  const baseDir = getSetting('playlistLocation');

  try {
    await ensureDir(baseDir);
    const items = await fs.readdir(baseDir);

    // Use a Map to store playlists by ID to handle duplicates
    const playlistsMap = new Map();

    // Track duplicate IDs for logging
    const duplicateIds = new Set();

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
          const metadata = await fs.readJson(metadataPath);

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
            // If this is a newer version (based on updatedAt), use it instead
            const existingPlaylist = playlistsMap.get(metadata.id);
            const existingDate = new Date(existingPlaylist.updatedAt || 0).getTime();

            if (updatedAt > existingDate) {
              // This is a newer version, replace the existing one
              playlistsMap.set(metadata.id, metadata);
              console.log(`Found newer version of playlist ${metadata.id} in directory: ${item}`);
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

    // Log any duplicates we found
    if (duplicateIds.size > 0) {
      console.warn(`Found ${duplicateIds.size} duplicate playlist IDs: ${Array.from(duplicateIds).join(', ')}`);

      // Schedule cleanup of duplicate directories
      setTimeout(() => {
        cleanupDuplicatePlaylistDirectories(directoriesByPlaylistId);
      }, 1000);
    }

    // Convert the Map values to an array
    const playlists = Array.from(playlistsMap.values());
    console.log(`Returning ${playlists.length} playlists (filtered from ${items.length} total directories)`);

    return playlists;
  } catch (error) {
    console.error('Failed to read playlists:', error);
    return [];
  }
}

/**
 * Cleans up duplicate playlist directories, keeping only the newest one for each playlist ID
 */
export async function cleanupDuplicatePlaylistDirectories(
  directoriesByPlaylistId?: Map<string, { dir: string, updatedAt: number }[]>
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
      const oldDirDate = new Date(directories[i].updatedAt).toISOString();
      try {
        // Check if the directory still exists (it might have been removed already)
        if (await fs.pathExists(oldDir)) {
          console.log(`Removing duplicate directory for playlist ${playlistId}: ${oldDir} (updated at ${oldDirDate})`);
          await fs.remove(oldDir);
          totalRemoved++;

          // Verify that the directory was actually removed
          if (await fs.pathExists(oldDir)) {
            console.error(`Failed to remove directory ${oldDir} - it still exists after removal attempt`);
            totalFailed++;
          } else {
            console.log(`Successfully removed directory ${oldDir}`);
          }
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
 * Scans for duplicate playlist directories
 */
export async function scanForDuplicatePlaylistDirectories(): Promise<Map<string, { dir: string, updatedAt: number }[]>> {
  const baseDir = getSetting('playlistLocation');
  const directoriesByPlaylistId = new Map<string, { dir: string, updatedAt: number }[]>();

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

    // Count duplicates
    let duplicateCount = 0;
    for (const [playlistId, directories] of directoriesByPlaylistId.entries()) {
      if (directories.length > 1) {
        duplicateCount++;
        console.log(`Found ${directories.length} directories for playlist ${playlistId}`);
      }
    }

    console.log(`Scan complete. Found ${duplicateCount} playlists with duplicate directories.`);
    return directoriesByPlaylistId;
  } catch (error) {
    console.error('Failed to scan for duplicate playlist directories:', error);
    return new Map();
  }
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
 * Sanitizes a filename to be safe for all operating systems
 */
export function sanitizeFileName(fileName: string): string {
  // Replace invalid characters with a hyphen
  return fileName
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Gets a temporary file path
 */
export function getTempFilePath(extension: string = 'tmp'): string {
  const tempDir = app.getPath('temp');
  const tempFileName = `playlistify-${uuidv4()}.${extension}`;

  // Ensure temp directory exists
  fs.ensureDirSync(tempDir);

  // Generate the full path
  const tempFilePath = path.join(tempDir, tempFileName);

  // Validate the path
  if (!tempFilePath || tempFilePath.length === 0) {
    throw new Error('Failed to generate a valid temporary file path');
  }

  // For debugging
  console.log(`Generated temp file path: ${tempFilePath}`);

  return tempFilePath;
}

/**
 * Gets the size of a file
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Failed to get size of file ${filePath}:`, error);
    return 0;
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

/**
 * Creates a unique playlist ID
 */
export function createPlaylistId(): string {
  return uuidv4();
}