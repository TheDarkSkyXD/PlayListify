import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import { app } from 'electron';
import logger from './logService';

// Directory for caching thumbnails
const THUMBNAIL_CACHE_DIR = path.join(app.getPath('userData'), 'thumbnail-cache');

// Ensure the cache directory exists
fs.ensureDirSync(THUMBNAIL_CACHE_DIR);

// Helper to generate cache key from URL
const getCacheKey = (url: string): string => {
  return url
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric chars with underscore
    .substring(0, 200); // Limit filename length
};

// Check if a cache entry exists
const getCachedThumbnail = async (url: string): Promise<string | null> => {
  try {
    const cacheKey = getCacheKey(url);
    const cachePath = path.join(THUMBNAIL_CACHE_DIR, `${cacheKey}.cache`);
    
    // Check if cache exists
    if (await fs.pathExists(cachePath)) {
      try {
        // Check if it's less than 7 days old
        const stats = await fs.stat(cachePath);
        const age = Date.now() - stats.mtimeMs;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (age < maxAge) {
          const cachedData = await fs.readFile(cachePath, 'utf8');
          if (cachedData && cachedData.startsWith('data:')) {
            logger.debug(`Loaded thumbnail from cache: ${cacheKey}`);
            return cachedData;
          }
        } else {
          logger.debug(`Cached thumbnail expired: ${cacheKey}`);
          await fs.remove(cachePath); // Remove expired cache
        }
      } catch (error) {
        logger.warn(`Failed to read cached thumbnail, will re-fetch: ${error}`);
        // Continue to fetch if cache read fails
      }
    }
    return null;
  } catch (error) {
    logger.error(`Cache error: ${error}`);
    return null;
  }
};

/**
 * Fetches an image from a URL and converts it to a data URL
 * @param imageUrl The URL of the image to fetch
 * @returns A Promise that resolves to a data URL containing the image data
 */
export const fetchImageAsDataUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error(`Invalid URL: ${imageUrl}`);
  }
  
  // Try to get from cache first
  const cachedData = await getCachedThumbnail(imageUrl);
  if (cachedData) {
    return cachedData;
  }
  
  const cacheKey = getCacheKey(imageUrl);
  const cachePath = path.join(THUMBNAIL_CACHE_DIR, `${cacheKey}.cache`);
  
  return new Promise((resolve, reject) => {
    // Set a timeout for the request
    const timeoutMs = 5000;
    const timeout = setTimeout(() => {
      reject(new Error(`Thumbnail fetch timed out after ${timeoutMs}ms for URL: ${imageUrl}`));
    }, timeoutMs);
    
    const options = {
      timeout: timeoutMs,
      headers: {
        // Use a common User-Agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    https.get(imageUrl, options, (response) => {
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
        reject(new Error(`Failed to fetch image: HTTP ${response.statusCode} for URL: ${imageUrl}`));
        return;
      }
      
      // Get the content type
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      // Check content length to ensure it's an actual image
      if (response.headers['content-length'] && 
          parseInt(response.headers['content-length']) < 100) {
        clearTimeout(timeout);
        reject(new Error(`Response too small to be an image (${response.headers['content-length']} bytes)`));
        return;
      }
      
      // Collect the data
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', async () => {
        clearTimeout(timeout);
        try {
          const buffer = Buffer.concat(chunks);
          
          // Verify we have some data
          if (buffer.length < 100) {
            reject(new Error(`Response data too small to be an image (${buffer.length} bytes)`));
            return;
          }
          
          // Convert to data URL
          const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
          
          // Verify it's a valid data URL
          if (!dataUrl.startsWith('data:')) {
            reject(new Error('Generated data URL is invalid'));
            return;
          }
          
          // Cache the result
          try {
            await fs.writeFile(cachePath, dataUrl);
            logger.debug(`Cached thumbnail: ${cacheKey}`);
          } catch (cacheError) {
            logger.warn(`Failed to cache thumbnail: ${cacheError}`);
            // Continue even if caching fails
          }
          
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
  
  // Define all possible YouTube thumbnail URLs in order of preference
  return [
    // Most reliable first - hqdefault is almost always available
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,      // HQ (480x360) - ytimg.com domain
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,    // HQ (480x360)
    
    // Medium quality options
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,      // MQ (320x180) - ytimg.com domain
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,    // MQ (320x180)
    
    // Try standard definition
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,      // SD (640x480) - ytimg.com domain
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,    // SD (640x480)
    
    // Try WebP versions next (modern format, potentially more efficient)
    `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,  // HQ WebP
    `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`,  // MQ WebP
    `https://i.ytimg.com/vi_webp/${videoId}/sddefault.webp`,  // SD WebP
    
    // Try highest quality versions last (not always available)
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,  // HD (1080p) - ytimg.com domain
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // HD (1080p)
    `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`, // HD WebP
    
    // Last resort - lowest quality
    `https://i.ytimg.com/vi/${videoId}/default.jpg`,        // Default (120x90) - ytimg.com domain
    `https://img.youtube.com/vi/${videoId}/default.jpg`,      // Default (120x90)
    `https://i.ytimg.com/vi_webp/${videoId}/default.webp`    // Default WebP
  ];
};

// Function to extract YouTube video ID from a playlist thumbnail URL
export const extractVideoIdFromThumbnail = (thumbnailUrl: string): string | null => {
  // Try to match video ID patterns in the URL
  const match = thumbnailUrl.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//) || 
                thumbnailUrl.match(/\/([a-zA-Z0-9_-]{11})\/(?:default|[mhs]qdefault|maxresdefault|sd[default])\.(?:jpg|webp)/);
  
  return match ? match[1] : null;
};

export default {
  fetchImageAsDataUrl,
  getYouTubeThumbnailUrls,
  extractVideoIdFromThumbnail
}; 