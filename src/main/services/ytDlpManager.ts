import YtDlpWrap from 'yt-dlp-wrap';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getSetting } from './settingsManager';
import * as fileUtils from '../utils/fileUtils';
import { Playlist, Video } from '../../shared/types/appTypes';
import { rateLimiter } from './rateLimiter';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Default max buffer size for yt-dlp commands (increased to 100MB)
const MAX_BUFFER_SIZE = 100 * 1024 * 1024; // 100MB

// Initialize YtDlpWrap
let ytDlp: YtDlpWrap;

/**
 * Get the path to the bundled yt-dlp binary in production mode
 */
function getBundledYtDlpPath(): string {
  // Determine the expected path based on the platform
  let binaryName: string;
  if (process.platform === 'win32') {
    binaryName = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    binaryName = 'yt-dlp';
  } else {
    // Linux
    binaryName = 'yt-dlp';
  }

  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'ytdlp', binaryName);
  }

  // In production
  let resourcesPath: string;
  if (process.env.NODE_ENV === 'production') {
    resourcesPath = process.resourcesPath;
  } else {
    // Fallback for testing or other environments
    resourcesPath = path.join(app.getAppPath(), '..', 'resources');
  }

  return path.join(resourcesPath, 'ytdlp', binaryName);
}

/**
 * Initialize the YtDlpWrap instance
 */
export async function initYtDlp(customBinaryPath?: string): Promise<void> {
  try {
    // If a custom binary path is directly provided, use it
    if (customBinaryPath && await fs.pathExists(customBinaryPath)) {
      ytDlp = new YtDlpWrap(customBinaryPath);
      console.log(`Using custom yt-dlp binary at: ${customBinaryPath}`);
    } 
    // Check if the setting for ytDlpPath exists
    else if (getSetting('ytDlpPath')) {
      const settingsPath = getSetting('ytDlpPath') as string;
      if (await fs.pathExists(settingsPath)) {
        ytDlp = new YtDlpWrap(settingsPath);
        console.log(`Using yt-dlp from settings at: ${settingsPath}`);
      }
    }
    // Check for bundled binary in production mode
    else if (await fs.pathExists(getBundledYtDlpPath())) {
      const bundledPath = getBundledYtDlpPath();
      ytDlp = new YtDlpWrap(bundledPath);
      console.log(`Using bundled yt-dlp binary at: ${bundledPath}`);
    }
    // If all else fails, let yt-dlp-wrap try to find or download it
    else {
      console.log('No existing yt-dlp binary found, letting yt-dlp-wrap handle it...');
      ytDlp = new YtDlpWrap();
    }
    
    // Test that yt-dlp is working and log version info
    const version = await ytDlp.getVersion();
    console.log(`yt-dlp initialized, version: ${version}`);
    
    // Log available commands 
    try {
      const { stdout } = await execAsync(`"${getBundledYtDlpPath()}" --help`, {
        maxBuffer: MAX_BUFFER_SIZE
      });
      console.log('Available yt-dlp commands:', 
        stdout.split('\n')
             .filter(line => line.includes('--'))
             .slice(0, 5)
             .join('\n  ') + 
        '\n  ... (truncated)'
      );
    } catch (e) {
      console.log('Could not retrieve yt-dlp help information');
    }
    
    return;
  } catch (error: any) {
    console.error('Failed to initialize yt-dlp:', error);
    throw new Error('Failed to initialize yt-dlp. Please check if it is installed correctly.');
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
      if (!ytDlp) {
        await initYtDlp();
      }
      
      console.log(`Getting playlist info for: ${playlistUrl}`);
      
      // Direct method - capture stdout directly with increased maxBuffer
      const { stdout } = await execAsync(`"${getBundledYtDlpPath()}" --dump-json --flat-playlist "${playlistUrl}"`, {
        maxBuffer: MAX_BUFFER_SIZE
      });
      
      if (!stdout || stdout.trim() === '') {
        throw new Error('No data returned from yt-dlp');
      }
      
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        throw new Error('No valid JSON data in response');
      }
      
      // Parse the first line to get playlist info
      const playlistData = JSON.parse(lines[0]);
      
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
export async function getPlaylistVideos(playlistUrl: string, progressCallback?: (currentCount: number) => void): Promise<Video[]> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      if (!ytDlp) {
        await initYtDlp();
      }
      
      // Get the current date string for addedAt field
      const currentDate = new Date().toISOString();
      
      console.log(`Getting playlist videos for: ${playlistUrl}`);
      
      // Define a timeout for the yt-dlp command (2 minutes)
      const TIMEOUT_MS = 2 * 60 * 1000;
      
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out after 2 minutes')), TIMEOUT_MS);
      });
      
      // Create the actual command promise - using flat-playlist for faster loading
      const commandPromise = execAsync(`"${getBundledYtDlpPath()}" --dump-json --flat-playlist "${playlistUrl}"`, { 
        maxBuffer: MAX_BUFFER_SIZE 
      });
      
      // Race the command against the timeout
      console.log(`Executing yt-dlp command with ${TIMEOUT_MS}ms timeout...`);
      const { stdout } = await Promise.race([commandPromise, timeoutPromise]) as { stdout: string };
      
      console.log('Command completed, processing results...');
      
      if (!stdout || stdout.trim() === '') {
        console.error('No data returned from yt-dlp command');
        throw new Error('No data returned from yt-dlp');
      }
      
      // Parse each line as a JSON object for each video
      const videos: Video[] = [];
      const lines = stdout.split('\n').filter(Boolean);
      
      console.log(`Found ${lines.length} video entries to process`);
      
      lines.forEach((line, index) => {
        try {
          const videoInfo = JSON.parse(line);
          videos.push({
            id: videoInfo.id,
            title: videoInfo.title || `Video ${index + 1}`,
            url: videoInfo.url || `https://www.youtube.com/watch?v=${videoInfo.id}`,
            thumbnail: videoInfo.thumbnail || '', // thumbnails may not be available in flat-playlist mode
            duration: videoInfo.duration || 0, // duration may not be available in flat-playlist mode
            downloaded: false,
            addedAt: currentDate,
            status: 'available'
          });
          progressCallback?.(index + 1);
        } catch (e) {
          // Skip lines that can't be parsed
          console.error('Error parsing video info:', e);
        }
      });
      
      console.log(`Successfully processed ${videos.length} videos from playlist`);
      
      // Handle if we got no videos but no error was thrown
      if (videos.length === 0) {
        console.error('No videos could be processed from the playlist');
        throw new Error('Failed to extract videos from playlist. The playlist might be private, empty, or invalid.');
      }
      
      return videos;
    } catch (error: any) {
      console.error('Error extracting playlist videos:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('timed out')) {
        throw new Error('The playlist import timed out. This could be because the playlist is too large or YouTube is throttling requests.');
      } else if (error.message.includes('Private video')) {
        throw new Error('This playlist contains private videos that cannot be accessed.');
      } else if (error.message.includes('sign in')) {
        throw new Error('This playlist requires you to sign in to YouTube.');
      } else {
        throw new Error(`Failed to extract playlist videos: ${error.message}`);
      }
    }
  });
}

/**
 * Import a YouTube playlist and save it locally
 */
export async function importYoutubePlaylist(playlistUrl: string, progressCallback?: (status: string, count?: number, total?: number) => void): Promise<Playlist> {
  try {
    // Report starting status
    progressCallback?.('Starting playlist import...');
    console.log(`Starting import for playlist: ${playlistUrl}`);
    
    // Get playlist general info
    progressCallback?.('Retrieving playlist information...');
    let playlistInfo: any;
    
    try {
      console.log('Fetching playlist info...');
      playlistInfo = await getPlaylistInfo(playlistUrl);
      console.log(`Found playlist: "${playlistInfo.title}" with ${playlistInfo.videoCount} videos`);
    } catch (error: any) {
      console.error('Error retrieving playlist info:', error);
      progressCallback?.(`Error: ${error.message}`);
      throw new Error(`Failed to retrieve playlist info: ${error.message}`);
    }
    
    // Report playlist found
    progressCallback?.(`Found playlist: ${playlistInfo.title} (${playlistInfo.videoCount} videos)`);
    
    // Get all videos in the playlist
    progressCallback?.('Retrieving videos...', 0, playlistInfo.videoCount);
    let videos: Video[] = [];
    
    try {
      console.log('Fetching videos from playlist...');
      videos = await getPlaylistVideos(playlistUrl, (currentCount) => {
        progressCallback?.('Retrieving videos...', currentCount, playlistInfo.videoCount);
        console.log(`Processed ${currentCount} of approximately ${playlistInfo.videoCount} videos`);
      });
      console.log(`Successfully retrieved ${videos.length} videos`);
    } catch (error: any) {
      console.error('Error retrieving playlist videos:', error);
      progressCallback?.(`Error: ${error.message}`);
      throw new Error(`Failed to retrieve playlist videos: ${error.message}`);
    }
    
    // Report videos retrieved
    progressCallback?.(`Retrieved ${videos.length} videos`, videos.length, playlistInfo.videoCount);
    
    // Create a new playlist object
    progressCallback?.('Creating playlist...');
    console.log('Creating playlist in local database...');
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
    progressCallback?.('Saving playlist metadata...');
    console.log(`Creating directory for playlist ID: ${playlistId}`);
    
    try {
      await fileUtils.createPlaylistDir(playlistId, playlist.name);
      console.log('Playlist directory created successfully');
      
      // Save playlist metadata
      console.log('Saving playlist metadata...');
      await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);
      console.log('Playlist metadata saved successfully');
    } catch (error: any) {
      console.error('Error saving playlist:', error);
      progressCallback?.(`Error: ${error.message}`);
      throw new Error(`Failed to save playlist: ${error.message}`);
    }
    
    progressCallback?.('Import complete!', videos.length, videos.length);
    console.log(`Playlist "${playlist.name}" imported successfully with ${videos.length} videos`);
    return playlist;
  } catch (error: any) {
    console.error('Error importing YouTube playlist:', error);
    progressCallback?.(`Error: ${error.message}`);
    throw new Error(`Failed to import YouTube playlist: ${error.message}`);
  }
}

/**
 * Check if a YouTube video is still available
 */
export async function checkVideoStatus(videoUrl: string): Promise<'available' | 'unavailable'> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      if (!ytDlp) {
        await initYtDlp();
      }
      
      // Try to get the title of the video - if it succeeds, video is available
      const args = ['--get-title', videoUrl];
      await ytDlp.execPromise(args);
      return 'available';
    } catch (error: any) {
      console.error(`Video check failed for ${videoUrl}:`, error);
      return 'unavailable';
    }
  });
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
      if (!ytDlp) {
        await initYtDlp();
      }
      
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