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

// Default placeholder image path
const DEFAULT_PLACEHOLDER_PATH = path.join(app.getAppPath(), 'public', 'placeholder.png');

/**
 * Try different YouTube thumbnail formats
 * @param videoId YouTube video ID
 */
async function tryYouTubeThumbnailFormats(videoId: string): Promise<string | null> {
  // Different thumbnail formats to try in order of preference
  const formats = [
    'hqdefault.jpg',      // High quality - most reliably available
    'mqdefault.jpg',      // Medium quality
    'sddefault.jpg',      // SD quality
    'default.jpg',        // Default quality
    'maxresdefault.jpg'   // HD quality - least reliably available
  ];

  for (const format of formats) {
    const url = `https://i.ytimg.com/vi/${videoId}/` + format;
    try {
      // Try to fetch the image - just checking if it exists
      await axios.get(url, {
        responseType: 'arraybuffer',
        validateStatus: status => status === 200 // Only accept 200 OK
      });

      // If we get here, the image exists
      return url;
    } catch (error) {
      // Continue to the next format if this one fails
      console.log(`Thumbnail format ${format} not available for video ${videoId}, trying next format...`);
    }
  }

  // If all formats fail, return null
  return null;
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
    // Check if this is a YouTube thumbnail and try different formats if needed
    const youtubeMatch = url.match(/https:\/\/i\.ytimg\.com\/vi\/([^/]+)\//);
    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      const bestThumbnailUrl = await tryYouTubeThumbnailFormats(videoId);

      if (bestThumbnailUrl) {
        // Use the best available thumbnail format
        const response = await axios.get(bestThumbnailUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(localPath, Buffer.from(response.data, 'binary'));
        return `file://${localPath}`;
      } else {
        // If no thumbnail is available, use a placeholder
        if (await fs.pathExists(DEFAULT_PLACEHOLDER_PATH)) {
          await fs.copy(DEFAULT_PLACEHOLDER_PATH, localPath);
          return `file://${localPath}`;
        } else {
          console.error('Default placeholder image not found at:', DEFAULT_PLACEHOLDER_PATH);
          throw new Error('No thumbnail available and placeholder not found');
        }
      }
    }

    // For non-YouTube images, proceed normally
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(localPath, Buffer.from(response.data, 'binary'));
    return `file://${localPath}`;
  } catch (error: any) {
    console.error(`Failed to download image from ${url}:`, error.message);

    // Try to use placeholder image if available
    try {
      if (await fs.pathExists(DEFAULT_PLACEHOLDER_PATH)) {
        await fs.copy(DEFAULT_PLACEHOLDER_PATH, localPath);
        return `file://${localPath}`;
      }
    } catch (placeholderError) {
      console.error('Failed to use placeholder image:', placeholderError);
    }

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