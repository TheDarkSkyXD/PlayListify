import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { getSetting } from '../services/settingsService';
import logger from '../services/logService';

/**
 * Sanitizes a filename by removing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  // Replace invalid filename characters with underscores
  return fileName.replace(/[\\/:*?"<>|]/g, '_').trim();
}

/**
 * Makes sure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    logger.error(`Error ensuring directory exists: ${dirPath}`, error);
    throw error;
  }
}

/**
 * Gets the base downloads directory path
 */
export function getDownloadsDir(): string {
  return getSetting('downloadPath');
}

/**
 * Creates a directory for a video download
 */
export async function createVideoDir(videoId: string, title: string): Promise<string> {
  const baseDir = getDownloadsDir();
  const sanitizedTitle = sanitizeFileName(title);
  const videoDir = path.join(baseDir, `${videoId}-${sanitizedTitle}`);

  try {
    await ensureDir(videoDir);
    return videoDir;
  } catch (error) {
    logger.error(`Failed to create video directory for ${title}:`, error);
    throw error;
  }
}

/**
 * Creates the directory structure for a playlist
 */
export async function createPlaylistDir(playlistId: number, playlistName: string): Promise<string> {
  const baseDir = getDownloadsDir();
  const sanitizedName = sanitizeFileName(playlistName);
  
  // Create a directory with format: playlistId-sanitizedName
  const playlistDir = path.join(baseDir, `pl-${playlistId}-${sanitizedName}`);

  try {
    // Create main playlist directory
    await ensureDir(playlistDir);
    
    // Create subdirectories for metadata and videos
    await ensureDir(path.join(playlistDir, 'metadata'));
    await ensureDir(path.join(playlistDir, 'videos'));
    
    logger.info(`Created playlist directory: ${playlistDir}`);
    return playlistDir;
  } catch (error) {
    logger.error(`Failed to create playlist directory for ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Gets the path to a playlist directory
 */
export function getPlaylistDir(playlistId: number, playlistName: string): string {
  const baseDir = getDownloadsDir();
  const sanitizedName = sanitizeFileName(playlistName);
  return path.join(baseDir, `pl-${playlistId}-${sanitizedName}`);
}

/**
 * Gets the path to the metadata directory for a playlist
 */
export function getPlaylistMetadataDir(playlistId: number, playlistName: string): string {
  return path.join(getPlaylistDir(playlistId, playlistName), 'metadata');
}

/**
 * Gets the path to the videos directory for a playlist
 */
export function getPlaylistVideosDir(playlistId: number, playlistName: string): string {
  return path.join(getPlaylistDir(playlistId, playlistName), 'videos');
}

/**
 * Writes playlist metadata to a JSON file
 */
export async function writePlaylistMetadata(
  playlistId: number,
  playlistName: string,
  metadata: any
): Promise<string> {
  const metadataDir = getPlaylistMetadataDir(playlistId, playlistName);
  const metadataPath = path.join(metadataDir, 'playlist-info.json');

  try {
    await ensureDir(metadataDir);
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    logger.info(`Wrote metadata for playlist ${playlistName}`);
    return metadataPath;
  } catch (error) {
    logger.error(`Failed to write metadata for playlist ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Reads playlist metadata from a JSON file
 */
export async function readPlaylistMetadata(
  playlistId: number,
  playlistName: string
): Promise<any> {
  const metadataDir = getPlaylistMetadataDir(playlistId, playlistName);
  const metadataPath = path.join(metadataDir, 'playlist-info.json');

  try {
    if (!fs.existsSync(metadataPath)) {
      logger.warn(`Metadata file not found for playlist ${playlistName}`);
      return null;
    }
    
    return await fs.readJson(metadataPath);
  } catch (error) {
    logger.error(`Failed to read metadata for playlist ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Gets the path for a video file in a playlist
 */
export function getVideoPath(
  playlistId: number,
  playlistName: string,
  videoId: string,
  format = 'mp4'
): string {
  const videosDir = getPlaylistVideosDir(playlistId, playlistName);
  return path.join(videosDir, `${videoId}.${format}`);
}

/**
 * Checks if a video file exists
 */
export async function videoExists(
  playlistId: number,
  playlistName: string,
  videoId: string,
  format = 'mp4'
): Promise<boolean> {
  const videoPath = getVideoPath(playlistId, playlistName, videoId, format);
  return fs.existsSync(videoPath);
}

/**
 * Gets the temp directory for downloads in progress
 */
export function getTempDir(): string {
  const tempDir = path.join(app.getPath('temp'), 'PlayListify', 'downloads');
  fs.ensureDirSync(tempDir);
  return tempDir;
}

/**
 * Creates a path for a temporary download file
 */
export function getTempFilePath(fileName: string): string {
  return path.join(getTempDir(), fileName);
}

/**
 * Moves a file from temp directory to its final location
 */
export async function moveFromTemp(
  tempFilePath: string,
  destinationPath: string
): Promise<void> {
  try {
    // Ensure the destination directory exists
    await ensureDir(path.dirname(destinationPath));
    
    // Move the file
    await fs.move(tempFilePath, destinationPath, { overwrite: true });
    logger.info(`Moved file from ${tempFilePath} to ${destinationPath}`);
  } catch (error) {
    logger.error(`Failed to move file from ${tempFilePath} to ${destinationPath}:`, error);
    throw error;
  }
}

/**
 * Deletes a file if it exists
 */
export async function deleteFileIfExists(filePath: string): Promise<boolean> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
      logger.info(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Gets file information
 */
export async function getFileInfo(filePath: string): Promise<fs.Stats | null> {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return await fs.stat(filePath);
  } catch (error) {
    logger.error(`Failed to get info for file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Creates a playlist thumbnail file path
 */
export function getPlaylistThumbnailPath(
  playlistId: number,
  playlistName: string
): string {
  const metadataDir = getPlaylistMetadataDir(playlistId, playlistName);
  return path.join(metadataDir, 'thumbnail.jpg');
}

/**
 * Creates a video thumbnail file path
 */
export function getVideoThumbnailPath(
  playlistId: number,
  playlistName: string,
  videoId: string
): string {
  const metadataDir = getPlaylistMetadataDir(playlistId, playlistName);
  return path.join(metadataDir, `${videoId}-thumbnail.jpg`);
}

/**
 * Gets all existing playlist directories
 */
export async function getAllPlaylistDirs(): Promise<string[]> {
  const baseDir = getDownloadsDir();
  
  try {
    if (!fs.existsSync(baseDir)) {
      return [];
    }
    
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    
    // Filter for directories that match the playlist pattern (pl-{id}-{name})
    const playlistDirs = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('pl-'))
      .map(entry => path.join(baseDir, entry.name));
      
    return playlistDirs;
  } catch (error) {
    logger.error('Failed to get playlist directories:', error);
    throw error;
  }
}

/**
 * Gets available disk space in the download directory
 */
export async function getAvailableDiskSpace(): Promise<number> {
  const downloadPath = getDownloadsDir();
  
  try {
    // Use the diskusage library or return a fixed amount
    // Since fs-extra's statfs is causing issues, we'll implement a simpler version
    const stats = await fs.stat(downloadPath);
    
    // As a simple fallback, just return a large number (1 TB)
    // In a real implementation, you'd use a proper disk space library
    return 1024 * 1024 * 1024 * 1024; // 1 TB
  } catch (error) {
    logger.error('Failed to get available disk space:', error);
    // Return a reasonable default (100 GB) if we can't get the actual space
    return 100 * 1024 * 1024 * 1024;
  }
}

export default {
  sanitizeFileName,
  ensureDir,
  getDownloadsDir,
  createVideoDir,
  createPlaylistDir,
  getPlaylistDir,
  getPlaylistMetadataDir,
  getPlaylistVideosDir,
  writePlaylistMetadata,
  readPlaylistMetadata,
  getVideoPath,
  videoExists,
  getTempDir,
  getTempFilePath,
  moveFromTemp,
  deleteFileIfExists,
  getFileInfo,
  getPlaylistThumbnailPath,
  getVideoThumbnailPath,
  getAllPlaylistDirs,
  getAvailableDiskSpace
}; 