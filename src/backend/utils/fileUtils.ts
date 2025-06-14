import fs from 'fs-extra';
import path from 'path';
import type { Playlist } from '../../shared/types'; // Import Playlist type
// We might need pathUtils for resolving application-specific paths
// import { getPlaylistsBasePath } from './pathUtils'; // Assuming pathUtils.ts exists and exports this

/**
 * Ensures that a directory exists. If the directory structure does not exist, it is created.
 * @param dirPath The path to the directory.
 * @returns Promise<void>
 */
export const ensureDir = async (dirPath: string): Promise<void> => {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`Error ensuring directory ${dirPath}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Reads a file.
 * @param filePath The path to the file.
 * @param encoding The encoding to use (default: 'utf8').
 * @returns Promise<string> The content of the file.
 */
export const readFile = async (filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> => {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Writes data to a file, replacing the file if it already exists.
 * @param filePath The path to the file.
 * @param data The content to write.
 * @returns Promise<void>
 */
export const writeFile = async (filePath: string, data: string | NodeJS.ArrayBufferView): Promise<void> => {
  try {
    await fs.writeFile(filePath, data);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Removes a file or directory. The directory can have contents.
 * @param itemPath The path to the file or directory.
 * @returns Promise<void>
 */
export const remove = async (itemPath: string): Promise<void> => {
  try {
    await fs.remove(itemPath);
  } catch (error) {
    console.error(`Error removing item ${itemPath}:`, error);
    throw error;
  }
};

/**
 * Checks if a path exists.
 * @param itemPath The path to check.
 * @returns Promise<boolean> True if the path exists, false otherwise.
 */
export const pathExists = async (itemPath: string): Promise<boolean> => {
  try {
    return await fs.pathExists(itemPath);
  } catch (error) {
    console.error(`Error checking path existence for ${itemPath}:`, error);
    // For pathExists, fs-extra typically doesn't throw for non-existence but other errors.
    // If it's critical to know it's not an access error but truly non-existent,
    // fs.pathExists itself returns false for non-existent paths without throwing.
    // We'll re-throw other unexpected errors.
    throw error;
  }
};

/**
 * Moves a file or directory.
 * @param srcPath The source path.
 * @param destPath The destination path.
 * @param options Options for fs.move (e.g., overwrite).
 * @returns Promise<void>
 */
export const move = async (srcPath: string, destPath: string, options?: fs.MoveOptions): Promise<void> => {
  try {
    await fs.move(srcPath, destPath, options);
  } catch (error) {
    console.error(`Error moving item from ${srcPath} to ${destPath}:`, error);
    throw error;
  }
};

/**
 * Copies a file or directory.
 * @param srcPath The source path.
 * @param destPath The destination path.
 * @param options Options for fs.copy (e.g., overwrite, filter).
 * @returns Promise<void>
 */
export const copy = async (srcPath: string, destPath: string, options?: fs.CopyOptions): Promise<void> => {
  try {
    await fs.copy(srcPath, destPath, options);
  } catch (error) {
    console.error(`Error copying item from ${srcPath} to ${destPath}:`, error);
    throw error;
  }
};

/**
 * Sanitizes a filename by removing or replacing characters that are not allowed in file systems.
 * This is a basic implementation. A more robust solution might use a library or more extensive regex.
 * @param filename The original filename.
 * @returns string The sanitized filename.
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';
  // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/[\s]+/g, '_');
};


/**
 * Checks if a given path is valid.
 * This is a basic check; more sophisticated validation might be needed based on OS or specific rules.
 * For now, it checks if it's an absolute path and doesn't contain obviously invalid characters
 * after basic sanitization (though `sanitizeFilename` is for filenames, not full paths).
 * A truly robust `isValidPath` is complex and OS-dependent.
 * This function primarily checks for null/empty and if it's an absolute path.
 * @param filePath The path to validate.
 * @returns boolean True if the path is considered valid for basic use, false otherwise.
 */
export const isValidPath = (filePath: string): boolean => {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  // Check if it's an absolute path
  if (!path.isAbsolute(filePath)) {
    // console.warn(`Path is not absolute: ${filePath}`);
    return false;
  }
  // Add more checks if necessary, e.g., for invalid characters in path segments, length, etc.
  // For example, checking for null bytes which can be a security risk.
  if (filePath.includes('\0')) {
    return false;
  }
  return true;
};


// Playlist specific utilities will be added here.
// For example:
// export const getPlaylistPath = async (playlistName: string): Promise<string> => {
//   const playlistsBase = await getPlaylistsBasePath(); // Assuming this function exists and gives the root for playlists
//   const sanitizedName = sanitizeFilename(playlistName);
//   return path.join(playlistsBase, sanitizedName);
// };

// export const createPlaylistDirectory = async (playlistName: string): Promise<string> => {
//   const playlistPath = await getPlaylistPath(playlistName);
//   await ensureDir(playlistPath);
//   return playlistPath;
// };

// export const deletePlaylistDirectory = async (playlistName: string): Promise<void> => {
//   const playlistPath = await getPlaylistPath(playlistName);
//   await remove(playlistPath);
// };

// Placeholder for now, assuming pathUtils might provide this
// const DUMMY_PLAYLISTS_BASE_PATH = path.join(process.cwd(), 'user_data', 'playlists');
// fs.ensureDirSync(DUMMY_PLAYLISTS_BASE_PATH); // Ensure it exists for conceptual testing

/**
 * Creates a directory for a new playlist.
 * Assumes a base path for playlists is defined elsewhere (e.g., via settings or pathUtils).
 * For now, it will use a placeholder relative to where the app runs or a configured path.
 * @param playlistName The name of the playlist.
 * @param basePath The base path where playlist directories are stored.
 * @returns Promise<string> The full path to the created playlist directory.
 */
// export const createPlaylistDirectory = async (playlistName: string, basePath: string = DUMMY_PLAYLISTS_BASE_PATH): Promise<string> => {
//   if (!isValidPath(basePath)) {
//     throw new Error(`Invalid base path: ${basePath}`);
//   }
//   const sanitizedPlaylistName = sanitizeFilename(playlistName);
//   if (!sanitizedPlaylistName) {
//     throw new Error('Playlist name cannot be empty or only invalid characters.');
//   }
//   const playlistPath = path.join(basePath, sanitizedPlaylistName);
//   await ensureDir(playlistPath);
//   return playlistPath;
// };

/**
 * Deletes a playlist directory.
 * @param playlistPath The full path to the playlist directory.
 * @returns Promise<void>
 */
// export const deletePlaylistDirectory = async (playlistPath: string): Promise<void> => {
//   if (!isValidPath(playlistPath)) {
//     throw new Error(`Invalid playlist path for deletion: ${playlistPath}`);
//   }
//   // Add a safety check: ensure it's within an expected base directory if possible
//   // For example: if (!playlistPath.startsWith(await getPlaylistsBasePath())) throw new Error('Path is outside expected playlist directory.');
//   await remove(playlistPath);
// };

// --- Future additions for playlist metadata ---
/**
 * Creates a directory for a new playlist.
 * @param playlistName The name of the playlist.
 * @param basePath The base path where playlist directories are stored.
 * @returns Promise<string> The full path to the created playlist directory.
 * @throws Error if playlistName is invalid or basePath is invalid.
 */
export const createPlaylistDirectory = async (playlistName: string, basePath: string): Promise<string> => {
  if (!isValidPath(basePath)) {
    // This check is basic, ensure basePath itself is a secure and valid location
    console.error(`Invalid base path provided for playlist creation: ${basePath}`);
    throw new Error(`Invalid base path: ${basePath}`);
  }
  const sanitizedPlaylistName = sanitizeFilename(playlistName);
  if (!sanitizedPlaylistName) {
    throw new Error('Playlist name cannot be empty or resolve to an empty string after sanitization.');
  }
  const playlistPath = path.join(basePath, sanitizedPlaylistName);
  await ensureDir(playlistPath);
  // Optional: Create an initial empty metadata file
  // const initialMetadata: Partial<Playlist> = {
  //   id: sanitizedPlaylistName, // Or generate a UUID
  //   name: playlistName,
  //   videos: [],
  //   videoCount: 0,
  //   source: 'local',
  //   createdAt: new Date().toISOString(),
  //   updatedAt: new Date().toISOString(),
  // };
  // await writePlaylistMetadata(playlistPath, initialMetadata as Playlist);
  return playlistPath;
};

/**
 * Deletes a playlist directory.
 * @param playlistPath The full path to the playlist directory to delete.
 * @returns Promise<void>
 * @throws Error if playlistPath is invalid.
 */
export const deletePlaylistDirectory = async (playlistPath: string): Promise<void> => {
  if (!isValidPath(playlistPath)) {
    // A more robust check might ensure it's within an expected parent directory
    // (e.g., if (!playlistPath.startsWith(await getPlaylistsBasePathFromSettings())))
    console.error(`Invalid playlist path provided for deletion: ${playlistPath}`);
    throw new Error(`Invalid playlist path for deletion: ${playlistPath}`);
  }
  // Potentially add a check to ensure it's not deleting outside an expected scope
  await remove(playlistPath);
};

const DEFAULT_METADATA_FILENAME = 'playlist.json';

/**
 * Reads playlist metadata from a JSON file within the playlist directory.
 * @param playlistPath The path to the playlist directory.
 * @param metadataFilename The name of the metadata file (default: 'playlist.json').
 * @returns Promise<Playlist | null> The parsed playlist metadata, or null if not found or error.
 */
export const readPlaylistMetadata = async (
  playlistPath: string,
  metadataFilename = DEFAULT_METADATA_FILENAME
): Promise<Playlist | null> => {
  if (!isValidPath(playlistPath)) {
    console.error(`Invalid playlist path for reading metadata: ${playlistPath}`);
    return null;
  }
  const metadataFilePath = path.join(playlistPath, metadataFilename);
  try {
    if (!(await pathExists(metadataFilePath))) {
      return null;
    }
    const fileContent = await readFile(metadataFilePath);
    return JSON.parse(fileContent) as Playlist;
  } catch (error) {
    console.error(`Error reading playlist metadata from ${metadataFilePath}:`, error);
    return null; // Or re-throw if the caller should handle it more strictly
  }
};

/**
 * Writes playlist metadata to a JSON file within the playlist directory.
 * @param playlistPath The path to the playlist directory.
 * @param metadata The Playlist object to write.
 * @param metadataFilename The name of the metadata file (default: 'playlist.json').
 * @returns Promise<void>
 */
export const writePlaylistMetadata = async (
  playlistPath: string,
  metadata: Playlist,
  metadataFilename = DEFAULT_METADATA_FILENAME
): Promise<void> => {
  if (!isValidPath(playlistPath)) {
    console.error(`Invalid playlist path for writing metadata: ${playlistPath}`);
    throw new Error(`Invalid playlist path for writing metadata: ${playlistPath}`);
  }
  if (!metadata) {
    throw new Error('Playlist metadata cannot be null or undefined.');
  }
  const metadataFilePath = path.join(playlistPath, metadataFilename);
  try {
    const jsonString = JSON.stringify(metadata, null, 2); // Pretty print JSON
    await writeFile(metadataFilePath, jsonString);
  } catch (error) {
    console.error(`Error writing playlist metadata to ${metadataFilePath}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
};