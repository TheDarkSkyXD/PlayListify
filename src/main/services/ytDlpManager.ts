import YtDlpWrap from 'yt-dlp-wrap';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { getSetting, setSetting } from './settingsManager';
import * as fileUtils from '../utils/fileUtils';
import { Playlist, Video } from '../../shared/types/appTypes';
import { rateLimiter } from './rateLimiter';
import { app } from 'electron';
import os from 'os';
import https from 'https';
import crypto from 'crypto';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Initialize YtDlpWrap
let ytDlp: YtDlpWrap;

// Flag to track if yt-dlp is available
let _isYtDlpAvailable = false;

// Export as a function instead of a variable
export function isYtDlpAvailable(): boolean {
  return _isYtDlpAvailable;
}

// Environment detection
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

// Flag to track if download is in progress
let isDownloading = false;
let downloadProgress = 0;

/**
 * Download a file from a URL to a destination
 */
async function downloadFile(url: string, destination: string, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes && onProgress) {
          const progress = Math.floor((downloadedBytes / totalBytes) * 100);
          onProgress(progress);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        // On Windows, make the file executable
        if (os.platform() === 'win32') {
          fs.chmodSync(destination, 0o755);
        }
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Get the appropriate yt-dlp binary URL based on the platform
 */
function getYtDlpUrl(): string {
  const platform = os.platform();
  const arch = os.arch();
  
  // Latest release URL
  const base = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
  
  if (platform === 'win32') {
    return `${base}yt-dlp.exe`;
  } else if (platform === 'darwin') {
    return `${base}yt-dlp_macos`;
  } else {
    // Linux or other platforms
    if (arch === 'arm' || arch === 'arm64') {
      return `${base}yt-dlp_linux_aarch64`;
    } else {
      return `${base}yt-dlp_linux`;
    }
  }
}

/**
 * Get the default binary name based on platform
 */
function getDefaultBinaryName(): string {
  return os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
}

/**
 * Get the path where the yt-dlp binary should be stored
 */
export function getYtDlpBinPath(): string {
  if (isDevelopment()) {
    // In development, store in user data directory
    const userDataPath = app.getPath('userData');
    const devBinFolderPath = path.join(userDataPath, 'dev-bin');
    
    // Ensure the dev-bin directory exists
    if (!fs.existsSync(devBinFolderPath)) {
      fs.mkdirSync(devBinFolderPath, { recursive: true });
    }
    
    return path.join(devBinFolderPath, getDefaultBinaryName());
  } else {
    // In production, use the bundled binary
    const resourcesPath = process.resourcesPath;
    const binFolderPath = path.join(resourcesPath, 'bin');
    
    // Ensure the bin directory exists in case it wasn't created
    if (!fs.existsSync(binFolderPath)) {
      fs.mkdirSync(binFolderPath, { recursive: true });
    }
    
    return path.join(binFolderPath, getDefaultBinaryName());
  }
}

/**
 * Check if yt-dlp exists in PATH
 */
async function checkYtDlpInPath(): Promise<boolean> {
  try {
    const command = os.platform() === 'win32' 
      ? 'where yt-dlp' 
      : 'which yt-dlp';
      
    await execAsync(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Download yt-dlp if not already installed
 */
export async function downloadYtDlp(onProgress?: (progress: number) => void): Promise<string> {
  if (isDownloading) {
    throw new Error('Download already in progress');
  }
  
  try {
    isDownloading = true;
    downloadProgress = 0;
    
    const binPath = getYtDlpBinPath();
    const downloadUrl = getYtDlpUrl();
    
    console.log(`Downloading yt-dlp from ${downloadUrl} to ${binPath}`);
    
    await downloadFile(downloadUrl, binPath, (progress) => {
      downloadProgress = progress;
      if (onProgress) onProgress(progress);
    });
    
    // Set executable permission on non-Windows platforms
    if (os.platform() !== 'win32') {
      fs.chmodSync(binPath, 0o755);
    }
    
    // Update settings to point to the downloaded binary
    setSetting('ytDlpPath', binPath);
    
    console.log('yt-dlp downloaded successfully');
    return binPath;
  } catch (error) {
    console.error('Failed to download yt-dlp:', error);
    throw error;
  } finally {
    isDownloading = false;
  }
}

/**
 * Get the current download progress
 */
export function getDownloadProgress(): { isDownloading: boolean; progress: number } {
  return { isDownloading, progress: downloadProgress };
}

/**
 * Initialize the YtDlpWrap instance
 */
export async function initYtDlp(): Promise<boolean> {
  try {
    // Check if yt-dlp exists at our expected path
    const binPath = getYtDlpBinPath();
    
    if (await fs.pathExists(binPath)) {
      ytDlp = new YtDlpWrap(binPath);
    } else if (await checkYtDlpInPath()) {
      // If not, check if it's available in the system PATH
      ytDlp = new YtDlpWrap();
    } else {
      // Not found anywhere, indicate it's not available
      _isYtDlpAvailable = false;
      return false;
    }
    
    // Test that yt-dlp is working
    const version = await ytDlp.getVersion();
    console.log(`yt-dlp initialized, version: ${version}`);
    
    _isYtDlpAvailable = true;
    return true;
  } catch (error: any) {
    console.error('Failed to initialize yt-dlp:', error);
    _isYtDlpAvailable = false;
    
    // No need to throw, just return false to indicate failure
    return false;
  }
}

/**
 * Check and install yt-dlp if needed (primarily for development)
 */
export async function checkAndInstallYtDlp(): Promise<boolean> {
  try {
    // Check if yt-dlp exists and works
    const available = await initYtDlp();
    
    if (available) {
      console.log('yt-dlp is already installed and working.');
      return true;
    }
    
    console.log('yt-dlp not found or not working. Downloading...');
    
    // Download yt-dlp
    const binPath = await downloadYtDlp(progress => {
      console.log(`Downloading yt-dlp: ${progress}%`);
    });
    
    console.log(`yt-dlp downloaded to: ${binPath}`);
    
    // Verify the download worked
    const verifyAvailable = await initYtDlp();
    
    if (verifyAvailable) {
      console.log('yt-dlp installed successfully!');
      return true;
    } else {
      console.error('yt-dlp was downloaded but failed to initialize.');
      return false;
    }
  } catch (error) {
    console.error('Failed to check/install yt-dlp:', error);
    return false;
  }
}

/**
 * Ensure yt-dlp is initialized or try to install it
 */
export async function ensureYtDlp(): Promise<void> {
  if (!ytDlp || !_isYtDlpAvailable) {
    const initialized = await initYtDlp();
    
    if (!initialized) {
      // Try to download automatically
      const installed = await checkAndInstallYtDlp();
      
      if (!installed) {
        throw new Error(
          'yt-dlp is not available and could not be installed automatically.'
        );
      }
    }
  }
}

/**
 * Extract playlist info from a YouTube URL
 */
export async function getPlaylistInfo(playlistUrl: string): Promise<{
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
}> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      await ensureYtDlp();
      
      // Use yt-dlp to get playlist metadata
      const args = [
        '--dump-json',
        '--flat-playlist',
        playlistUrl
      ];
      
      // Create a temporary file to store the JSON output
      const tempJsonFile = fileUtils.getTempFilePath('json');
      
      // Run yt-dlp with output to the temp file to avoid stdout limitations
      await ytDlp.execPromise([...args, '-o', tempJsonFile]);
      
      // Read the JSON file
      const jsonStr = await fs.readFile(tempJsonFile, 'utf-8');
      
      // Clean up the temp file
      await fs.remove(tempJsonFile);
      
      // Parse the first line to get playlist info
      const playlistData = JSON.parse(jsonStr.split('\n')[0]);
      
      return {
        id: playlistData.id || '',
        title: playlistData.title || 'Untitled Playlist',
        description: playlistData.description || '',
        thumbnailUrl: playlistData.thumbnail || '',
        videoCount: playlistData.entries?.length || 0
      };
    } catch (error: any) {
      console.error('Error extracting playlist info:', error);
      throw new Error(`Failed to extract playlist info: ${error.message}`);
    }
  });
}

/**
 * Extract video entries from a YouTube playlist
 */
export async function getPlaylistVideos(playlistUrl: string): Promise<Video[]> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      await ensureYtDlp();
      
      // Get the current date string for addedAt field
      const currentDate = new Date().toISOString();
      
      // Use yt-dlp to get individual video info
      const args = [
        '--dump-json',
        '--no-playlist-metainfo',
        playlistUrl
      ];
      
      // Create a temporary file to store the JSON output
      const tempJsonFile = fileUtils.getTempFilePath('json');
      
      // Run yt-dlp with output to a temp file
      await ytDlp.execPromise([...args, '-o', tempJsonFile]);
      
      // Read the JSON file
      const jsonStr = await fs.readFile(tempJsonFile, 'utf-8');
      
      // Clean up the temp file
      await fs.remove(tempJsonFile);
      
      // Parse each line as a JSON object for each video
      const videos: Video[] = [];
      
      jsonStr.split('\n').filter(Boolean).forEach(line => {
        try {
          const videoInfo = JSON.parse(line);
          videos.push({
            id: videoInfo.id,
            title: videoInfo.title,
            url: videoInfo.webpage_url,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            downloaded: false,
            addedAt: currentDate,
            status: 'available'
          });
        } catch (e) {
          // Skip lines that can't be parsed
          console.error('Error parsing video info:', e);
        }
      });
      
      return videos;
    } catch (error: any) {
      console.error('Error extracting playlist videos:', error);
      throw new Error(`Failed to extract playlist videos: ${error.message}`);
    }
  });
}

/**
 * Import a YouTube playlist and save it locally
 */
export async function importYoutubePlaylist(playlistUrl: string): Promise<Playlist> {
  try {
    // Verify yt-dlp is available before attempting anything
    await ensureYtDlp();
    
    // Get playlist general info
    const playlistInfo = await getPlaylistInfo(playlistUrl);
    
    // Get all videos in the playlist
    const videos = await getPlaylistVideos(playlistUrl);
    
    // Create a new playlist object
    const currentDate = new Date().toISOString();
    const playlistId = fileUtils.createPlaylistId();
    
    const playlist: Playlist = {
      id: playlistId,
      name: playlistInfo.title,
      description: playlistInfo.description,
      thumbnail: playlistInfo.thumbnailUrl,
      videos,
      source: 'youtube',
      sourceUrl: playlistUrl,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    // Create a directory for the playlist
    await fileUtils.createPlaylistDir(playlistId, playlist.name);
    
    // Save playlist metadata
    await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);
    
    return playlist;
  } catch (error: any) {
    console.error('Error importing YouTube playlist:', error);
    throw new Error(`Failed to import YouTube playlist: ${error.message}`);
  }
}

/**
 * Check if a YouTube video is still available
 */
export async function checkVideoStatus(videoUrl: string): Promise<'available' | 'unavailable'> {
  try {
    await ensureYtDlp();
    
    // Try to get the title of the video - if it succeeds, video is available
    const args = ['--get-title', videoUrl];
    await ytDlp.execPromise(args);
    return 'available';
  } catch (error: any) {
    console.error(`Video check failed for ${videoUrl}:`, error);
    return 'unavailable';
  }
}

/**
 * Download a video from YouTube
 */
export async function downloadVideo(
  videoUrl: string,
  outputDir: string,
  videoId: string,
  options: {
    format?: string;
    quality?: string;
  } = {}
): Promise<string> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      await ensureYtDlp();
      
      // Ensure the output directory exists
      await fs.ensureDir(outputDir);
      
      // Determine format string based on settings
      const format = options.format || getSetting('downloadFormat');
      const quality = options.quality || getSetting('maxQuality');
      
      let formatString: string;
      
      if (format === 'mp3') {
        formatString = 'bestaudio[ext=m4a]/bestaudio';
      } else if (format === 'best') {
        formatString = 'bestvideo+bestaudio/best';
      } else {
        // Handle video quality selection
        switch (quality) {
          case '360p':
            formatString = 'bestvideo[height<=360]+bestaudio/best[height<=360]';
            break;
          case '480p':
            formatString = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
            break;
          case '720p':
            formatString = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
            break;
          case '1080p':
            formatString = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
            break;
          case '1440p':
            formatString = 'bestvideo[height<=1440]+bestaudio/best[height<=1440]';
            break;
          case '2160p':
            formatString = 'bestvideo[height<=2160]+bestaudio/best[height<=2160]';
            break;
          default:
            formatString = 'bestvideo[height<=1080]+bestaudio/best';
        }
      }
      
      // Construct output filename
      const outputFile = path.join(outputDir, `${videoId}.${format === 'mp3' ? 'mp3' : 'mp4'}`);
      
      // Arguments for yt-dlp
      const args = [
        '-f', formatString,
        '-o', outputFile,
        '--no-playlist',
        videoUrl
      ];
      
      // For mp3 format, add post-processing for conversion
      if (format === 'mp3') {
        args.push('--extract-audio', '--audio-format', 'mp3');
      }
      
      // Execute the download
      await ytDlp.execPromise(args);
      
      return outputFile;
    } catch (error: any) {
      console.error(`Failed to download video ${videoId}:`, error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  });
}

/**
 * Get video information for a single video
 */
export async function getVideoInfo(videoUrl: string): Promise<any> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      await ensureYtDlp();
      
      // Use yt-dlp to get video metadata
      const args = [
        '--dump-json',
        '--no-playlist',
        videoUrl
      ];
      
      // Create a temporary file to store the JSON output
      const tempJsonFile = fileUtils.getTempFilePath('json');
      
      // Run yt-dlp with output to the temp file to avoid stdout limitations
      await ytDlp.execPromise([...args, '-o', tempJsonFile]);
      
      // Read the JSON file
      const jsonStr = await fs.readFile(tempJsonFile, 'utf-8');
      
      // Clean up the temp file
      await fs.remove(tempJsonFile);
      
      // Parse the JSON to get video info
      const videoInfo = JSON.parse(jsonStr);
      
      return videoInfo;
    } catch (error: any) {
      console.error('Error extracting video info:', error);
      throw new Error(`Failed to extract video info: ${error.message}`);
    }
  });
} 