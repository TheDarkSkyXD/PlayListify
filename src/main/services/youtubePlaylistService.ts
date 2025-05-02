import { getDatabase } from '../database';
import { Playlist, PlaylistSummary, createPlaylist, updatePlaylistStats } from '../database/playlistQueries';
import { Video, createOrUpdateVideo } from '../database/videoQueries';
import { addVideoToPlaylist, videoExistsInPlaylist } from '../database/playlistVideoQueries';
import logger from './logService';
import ytdlpService from './ytdlpService';
import { spawn } from 'child_process';

// Interface for YouTube playlist info
export interface YouTubePlaylist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelTitle?: string;
}

// Interface for YouTube video info
export interface YouTubeVideo {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelTitle?: string;
  publishedAt?: string;
  duration?: string; // ISO 8601 duration format
}

// Import a YouTube playlist using yt-dlp
export const importYouTubePlaylist = async (
  playlistUrl: string
): Promise<number> => {
  try {
    // Validate URL format (basic validation)
    if (!playlistUrl.includes('youtube.com/playlist') && !playlistUrl.includes('list=')) {
      throw new Error('Invalid YouTube playlist URL');
    }
    
    // Get playlist info using yt-dlp
    const playlistInfo = await getYouTubePlaylistInfo(playlistUrl);
    if (!playlistInfo) {
      throw new Error('Failed to fetch playlist information');
    }
    
    // Create the playlist in our database
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    const playlist: Playlist = {
      name: playlistInfo.title,
      description: playlistInfo.description,
      source: 'youtube',
      source_id: playlistInfo.id,
      thumbnail: playlistInfo.thumbnailUrl,
      created_at: now,
      updated_at: now,
      video_count: 0, // Will be updated as videos are added
      duration_seconds: 0 // Will be updated as videos are added
    };
    
    // Create the playlist
    const playlistId = await createPlaylist(db, playlist);
    logger.info(`Created YouTube playlist "${playlistInfo.title}" with ID ${playlistId}`);
    
    // Fetch and add videos to the playlist
    await addYouTubePlaylistVideos(playlistId, playlistUrl);
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return playlistId;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Failed to import YouTube playlist ${playlistUrl}:`, error);
    } else {
      logger.error(`Failed to import YouTube playlist ${playlistUrl}:`, String(error));
    }
    throw error;
  }
};

// Get information about a YouTube playlist
export const getYouTubePlaylistInfo = async (playlistUrl: string): Promise<YouTubePlaylist & { videoCount?: number }> => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = ytdlpService.getYtdlpPath();
    const args = [
      '--dump-single-json',  // Get all playlist info in a single JSON object
      '--flat-playlist',     // Don't extract video info
      playlistUrl
    ];
    
    let output = '';
    const process = spawn(ytdlpPath, args);
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      logger.warn(`yt-dlp stderr: ${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0 && output) {
        try {
          const data = JSON.parse(output);
          
          // Extract the playlist ID
          let playlistId = '';
          if (data.id) {
            playlistId = data.id;
          } else if (playlistUrl.includes('list=')) {
            // Try to extract playlist ID from URL if not provided in data
            const match = playlistUrl.match(/list=([^&]+)/);
            if (match && match[1]) {
              playlistId = match[1];
            }
          }
          
          // Define potential thumbnail URL sources
          let thumbnailUrl = null;
          
          // 1. First try the thumbnail provided by yt-dlp
          if (data.thumbnail && !data.thumbnail.includes('no_thumbnail')) {
            thumbnailUrl = data.thumbnail;
          }
          
          // 2. If we have entries and the first option failed, try to get one from the first video
          if (!thumbnailUrl && data.entries && data.entries.length > 0) {
            const firstVideoId = data.entries[0].id;
            if (firstVideoId) {
              // Use multiple potential YouTube thumbnail formats - maxresdefault is higher quality
              thumbnailUrl = `https://img.youtube.com/vi/${firstVideoId}/maxresdefault.jpg`;
            }
          }
          
          // 3. If we have a playlist ID, try the YouTube playlist thumbnail format
          if (!thumbnailUrl && playlistId) {
            // Try a standard YouTube playlist thumbnail format
            thumbnailUrl = `https://i.ytimg.com/vi_webp/${playlistId}/maxresdefault.webp`;
          }
          
          // 4. Final fallback for standard definition
          if (!thumbnailUrl && data.entries && data.entries.length > 0) {
            const firstVideoId = data.entries[0].id;
            if (firstVideoId) {
              thumbnailUrl = `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`;
            }
          }
          
          // Log the thumbnail URL for debugging
          logger.info(`Using thumbnail URL: ${thumbnailUrl}`);
          
          const playlistInfo = {
            id: playlistId,
            title: data.title || 'Unknown Playlist',
            description: data.description,
            thumbnailUrl: thumbnailUrl,
            channelId: data.channel_id,
            channelTitle: data.channel,
            videoCount: data.entries ? data.entries.length : undefined
          };
          
          resolve(playlistInfo);
        } catch (error: unknown) {
          if (error instanceof Error) {
            reject(new Error(`Failed to parse YouTube playlist info: ${error.message}`));
          } else {
            reject(new Error(`Failed to parse YouTube playlist info: ${String(error)}`));
          }
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

// Add videos from a YouTube playlist to our database
export const addYouTubePlaylistVideos = async (playlistId: number, playlistUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = ytdlpService.getYtdlpPath();
    const args = [
      '--dump-json',
      '--flat-playlist',
      playlistUrl
    ];
    
    let videosData = '';
    const process = spawn(ytdlpPath, args);
    
    process.stdout.on('data', (data) => {
      videosData += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      logger.warn(`yt-dlp stderr: ${data}`);
    });
    
    process.on('close', async (code) => {
      if (code === 0 && videosData) {
        try {
          // Process the JSON data line by line (each line is a separate JSON object)
          const videoLines = videosData.trim().split('\n');
          let position = 1;
          
          for (const line of videoLines) {
            try {
              const videoData = JSON.parse(line);
              
              // Skip if this isn't a video entry
              if (!videoData.id || videoData._type !== 'url' || !videoData.url.includes('youtube.com/watch')) {
                continue;
              }
              
              // Create or update the video
              await processYouTubeVideo(playlistId, videoData, position);
              position++;
            } catch (error: unknown) {
              if (error instanceof Error) {
                logger.error(`Error processing video entry: ${error.message}`);
              } else {
                logger.error(`Error processing video entry: ${String(error)}`);
              }
              // Continue with next video even if this one fails
            }
          }
          
          logger.info(`Added ${position - 1} videos to playlist ID ${playlistId}`);
          resolve();
        } catch (error: unknown) {
          if (error instanceof Error) {
            reject(new Error(`Failed to process YouTube playlist videos: ${error.message}`));
          } else {
            reject(new Error(`Failed to process YouTube playlist videos: ${String(error)}`));
          }
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

// Process a YouTube video and add it to a playlist
export const processYouTubeVideo = async (
  playlistId: number, 
  videoData: any, 
  position: number
): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    // Convert duration to seconds if available
    let durationSeconds: number | undefined = undefined;
    if (videoData.duration) {
      durationSeconds = parseInt(videoData.duration);
    }
    
    // Prepare video data
    const video: Video = {
      video_id: videoData.id,
      title: videoData.title || 'Unknown Title',
      description: videoData.description,
      duration_seconds: durationSeconds,
      thumbnail: videoData.thumbnail,
      author: videoData.channel,
      author_id: videoData.channel_id,
      published_at: videoData.upload_date ? parseYouTubeDate(videoData.upload_date) : undefined,
      view_count: videoData.view_count,
      created_at: now,
      updated_at: now,
      download_status: 'not_downloaded'
    };
    
    // Create or update the video
    const videoId = await createOrUpdateVideo(db, video);
    
    // Check if video is already in the playlist
    const exists = await videoExistsInPlaylist(db, playlistId, videoId);
    if (!exists) {
      // Add video to playlist
      await addVideoToPlaylist(db, playlistId, videoId, position);
    }
  } catch (error) {
    logger.error(`Failed to process YouTube video:`, error);
    throw error;
  }
};

// Helper to convert YouTube date format to Unix timestamp
export const parseYouTubeDate = (dateStr: string): number | undefined => {
  try {
    // Expect format YYYYMMDD
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
      const day = parseInt(dateStr.substring(6, 8));
      
      const date = new Date(year, month, day);
      return Math.floor(date.getTime() / 1000);
    }
    return undefined;
  } catch (error) {
    logger.error(`Failed to parse YouTube date "${dateStr}":`, error);
    return undefined;
  }
};

// Export default object
export default {
  importYouTubePlaylist,
  getYouTubePlaylistInfo,
  addYouTubePlaylistVideos,
  processYouTubeVideo,
  parseYouTubeDate
};