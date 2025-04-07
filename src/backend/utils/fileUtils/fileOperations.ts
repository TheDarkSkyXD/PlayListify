import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { logToFile } from '../../services/logger';

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
 * Creates a unique playlist ID
 */
export function createPlaylistId(): string {
  return uuidv4();
}

/**
 * Reads a file as text
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes text to a file
 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Failed to write to file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Reads a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    console.error(`Failed to read JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes a JSON file
 */
export async function writeJsonFile<T>(filePath: string, data: T, options?: any): Promise<void> {
  try {
    const writeOptions = options ? { spaces: 2, ...options } : { spaces: 2 };
    await fs.writeJson(filePath, data, writeOptions);
  } catch (error) {
    console.error(`Failed to write JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Copies a file
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.copy(source, destination);
  } catch (error) {
    console.error(`Failed to copy file from ${source} to ${destination}:`, error);
    throw error;
  }
}

/**
 * Removes a file
 */
export async function removeFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
  } catch (error) {
    console.error(`Failed to remove file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return await fs.pathExists(filePath);
  } catch (error) {
    console.error(`Failed to check if file exists ${filePath}:`, error);
    return false;
  }
}

/**
 * Gets file stats
 */
export async function getFileStats(filePath: string): Promise<fs.Stats> {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    console.error(`Failed to get file stats for ${filePath}:`, error);
    throw error;
  }
}
