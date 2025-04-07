import fs from 'fs-extra';
import path from 'path';
import { getSetting } from '../../services/settingsManager';
import { logToFile } from '../../services/logger';
import { sanitizeFileName } from './sanitization';
import { ensureDir, findPlaylistDirById } from './directoryOperations';
import { PlaylistMetadata } from './types';

/**
 * Writes playlist metadata to JSON file
 */
export async function writePlaylistMetadata(
  playlistId: string,
  playlistName: string,
  metadata: PlaylistMetadata,
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

  // Write the metadata to the JSON file
  const metadataPath = path.join(playlistDir, 'metadata', 'playlist-info.json');
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
}

/**
 * Reads playlist metadata from JSON file
 */
export async function readPlaylistMetadata(
  playlistId: string,
  playlistName: string
): Promise<PlaylistMetadata | null> {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  const metadataPath = path.join(playlistDir, 'metadata', 'playlist-info.json');

  try {
    // Check if the metadata file exists
    if (await fs.pathExists(metadataPath)) {
      // Read and parse the metadata file
      const metadata = await fs.readJson(metadataPath);
      return metadata;
    } else {
      // Try to find the playlist directory by ID, regardless of name
      const existingDir = await findPlaylistDirById(playlistId);
      if (existingDir) {
        // Found a directory with this ID, try to read the metadata
        const altMetadataPath = path.join(existingDir, 'metadata', 'playlist-info.json');
        if (await fs.pathExists(altMetadataPath)) {
          const metadata = await fs.readJson(altMetadataPath);
          return metadata;
        }
      }

      // Metadata file not found
      console.error(`Playlist metadata file not found: ${metadataPath}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to read playlist metadata for ${playlistName}:`, error);
    return null;
  }
}
