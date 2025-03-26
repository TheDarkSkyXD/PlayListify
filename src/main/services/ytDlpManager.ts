import YtDlpWrap from 'yt-dlp-wrap';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { getSetting } from './settingsManager';
import * as fileUtils from '../utils/fileUtils';
import { Playlist, Video } from '../../shared/types/appTypes';
import { rateLimiter } from './rateLimiter';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Initialize YtDlpWrap
let ytDlp: YtDlpWrap;

/**
 * Initialize the YtDlpWrap instance
 */
export async function initYtDlp(customBinaryPath?: string): Promise<void> {
  try {
    // If a custom binary path is directly provided, use it
    if (customBinaryPath && await fs.pathExists(customBinaryPath)) {
      ytDlp = new YtDlpWrap(customBinaryPath);
      console.log(`Using custom yt-dlp binary at: ${customBinaryPath}`);
      return;
    }
    
    // In development mode, we'll rely on our setup service to handle yt-dlp
    // In production, we'll use the default behavior or let yt-dlp-wrap download it
    ytDlp = new YtDlpWrap();
    
    // Test that yt-dlp is working
    const version = await ytDlp.getVersion();
    console.log(`yt-dlp initialized, version: ${version}`);
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
      if (!ytDlp) {
        await initYtDlp();
      }
      
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