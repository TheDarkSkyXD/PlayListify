import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import { app } from 'electron';
import logger from './logService';

// Directory for caching thumbnails
const THUMBNAIL_CACHE_DIR = path.join(app.getPath('userData'), 'thumbnail-cache');

// Ensure the cache directory exists
fs.ensureDirSync(THUMBNAIL_CACHE_DIR);

/**
 * Fetches an image from a URL and converts it to a data URL
 * @param imageUrl The URL of the image to fetch
 * @returns A Promise that resolves to a data URL containing the image data
 */
export const fetchImageAsDataUrl = async (imageUrl: string): Promise<string> => {
  const cacheKey = imageUrl
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric chars with underscore
    .substring(0, 200); // Limit filename length
  const cachePath = path.join(THUMBNAIL_CACHE_DIR, `${cacheKey}.cache`);
  
  // Check if we have this image cached
  if (await fs.pathExists(cachePath)) {
    try {
      const cachedData = await fs.readFile(cachePath, 'utf8');
      logger.debug(`Loaded thumbnail from cache: ${cacheKey}`);
      return cachedData;
    } catch (error) {
      logger.warn(`Failed to read cached thumbnail, will re-fetch: ${error}`);
      // Continue to fetch if cache read fails
    }
  }
  
  return new Promise((resolve, reject) => {
    // Set a timeout for the request
    const timeoutMs = 5000;
    const timeout = setTimeout(() => {
      reject(new Error(`Thumbnail fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    https.get(imageUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        clearTimeout(timeout);
        if (response.headers.location) {
          logger.debug(`Following redirect for thumbnail: ${response.headers.location}`);
          fetchImageAsDataUrl(response.headers.location)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('Redirect with no location header'));
        }
        return;
      }
      
      // Check if the request was successful
      if (response.statusCode !== 200) {
        clearTimeout(timeout);
        reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        return;
      }
      
      // Get the content type
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      // Collect the data
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', async () => {
        clearTimeout(timeout);
        try {
          const buffer = Buffer.concat(chunks);
          // Convert to data URL
          const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
          
          // Cache the result
          await fs.writeFile(cachePath, dataUrl);
          logger.debug(`Cached thumbnail: ${cacheKey}`);
          
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      });
      
      response.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

// Function to generate YouTube thumbnail URLs from video ID
export const getYouTubeThumbnailUrls = (videoId: string): string[] => {
  if (!videoId) return [];
  
  return [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // HD (1080p)
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,    // SD (640x480)
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,    // HQ (480x360)
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,    // MQ (320x180)
    `https://img.youtube.com/vi/${videoId}/default.jpg`,      // Default (120x90)
  ];
};

// Function to extract YouTube video ID from a playlist thumbnail URL
export const extractVideoIdFromThumbnail = (thumbnailUrl: string): string | null => {
  // Try to match video ID patterns in the URL
  const match = thumbnailUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\//) || 
                thumbnailUrl.match(/\/([a-zA-Z0-9_-]{11})\/default\.jpg/);
  
  return match ? match[1] : null;
};

export default {
  fetchImageAsDataUrl,
  getYouTubeThumbnailUrls,
  extractVideoIdFromThumbnail
}; 