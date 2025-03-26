import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';
import crypto from 'crypto';

// Directory for cached images
const CACHE_DIR = path.join(app.getPath('userData'), 'imageCache');

/**
 * Ensures the cache directory exists
 */
export async function ensureCacheDir(): Promise<void> {
  await fs.ensureDir(CACHE_DIR);
}

/**
 * Creates a hash of a URL to use as a filename
 */
function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Downloads an image from a URL and saves it to the cache
 */
export async function downloadImage(url: string): Promise<string> {
  // Make sure cache directory exists
  await ensureCacheDir();
  
  // Create a hash of the URL to use as a filename
  const urlHash = hashUrl(url);
  const ext = path.extname(url) || '.jpg'; // Default to .jpg if no extension
  const filename = `${urlHash}${ext}`;
  const localPath = path.join(CACHE_DIR, filename);
  
  // Check if the file already exists in cache
  if (await fs.pathExists(localPath)) {
    return `file://${localPath}`;
  }
  
  try {
    // Download the image
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // Save the image to the cache
    await fs.writeFile(localPath, Buffer.from(response.data, 'binary'));
    
    return `file://${localPath}`;
  } catch (error: any) {
    console.error(`Failed to download image from ${url}:`, error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Gets the local path for an image URL
 * If the image isn't cached, it downloads it first
 */
export async function getLocalImagePath(url: string, downloadIfMissing: boolean = true): Promise<string> {
  // Skip if it's already a local file
  if (url.startsWith('file://') || url.startsWith('/')) {
    return url;
  }
  
  // Make sure cache directory exists
  await ensureCacheDir();
  
  // Create a hash of the URL to use as a filename
  const urlHash = hashUrl(url);
  const ext = path.extname(url) || '.jpg'; // Default to .jpg if no extension
  const filename = `${urlHash}${ext}`;
  const localPath = path.join(CACHE_DIR, filename);
  
  // Check if the file already exists in cache
  if (await fs.pathExists(localPath)) {
    return `file://${localPath}`;
  }
  
  // Download if requested and not already cached
  if (downloadIfMissing) {
    return await downloadImage(url);
  }
  
  // Return null if not cached and not downloading
  return '';
}

/**
 * Clears old cached images to free up space
 * @param maxAgeDays Maximum age of images to keep in days
 */
export async function clearOldCachedImages(maxAgeDays: number = 30): Promise<void> {
  try {
    // Make sure cache directory exists
    await ensureCacheDir();
    
    // Get all files in the cache directory
    const files = await fs.readdir(CACHE_DIR);
    
    // Calculate the cutoff date
    const now = new Date();
    const cutoffTime = now.getTime() - (maxAgeDays * 24 * 60 * 60 * 1000);
    
    // Loop through each file and delete if older than cutoff
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < cutoffTime) {
        await fs.remove(filePath);
      }
    }
  } catch (error: any) {
    console.error('Error cleaning up image cache:', error.message);
  }
} 