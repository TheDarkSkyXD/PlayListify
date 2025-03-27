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
 * Writes playlist metadata to JSON file
 */
export async function writePlaylistMetadata(
  playlistId: string,
  playlistName: string,
  metadata: any
): Promise<void> {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  const metadataDir = path.join(playlistDir, 'metadata');
  const metadataPath = path.join(metadataDir, 'playlist-info.json');
  
  try {
    await ensureDir(metadataDir);
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
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
      return await fs.readJson(metadataPath);
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
    
    const playlists = [];
    for (const item of items) {
      // Only process directories
      const itemPath = path.join(baseDir, item);
      const stats = await fs.stat(itemPath);
      
      if (!stats.isDirectory()) continue;
      
      // Check if metadata exists
      const metadataPath = path.join(itemPath, 'metadata', 'playlist-info.json');
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        playlists.push(metadata);
      }
    }
    
    return playlists;
  } catch (error) {
    console.error('Failed to read playlists:', error);
    return [];
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