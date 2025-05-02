import { getDatabase } from '../database/index';
import {
  Playlist,
  PlaylistSummary,
  createPlaylist,
  getPlaylistById,
  getAllPlaylists,
  updatePlaylist,
  deletePlaylist,
  updatePlaylistStats
} from '../database/playlistQueries';
import {
  Video,
  createOrUpdateVideo,
  getVideoByExternalId
} from '../database/videoQueries';
import {
  addVideoToPlaylist,
  getPlaylistVideos,
  removeVideoFromPlaylist,
  updateVideoPosition,
  videoExistsInPlaylist
} from '../database/playlistVideoQueries';
import logger from './logService';
import ytdlpService from './ytdlpService';
import { spawn } from 'child_process';
import Database from '../database/sqlite-adapter';

// Interface for YouTube playlist info
interface YouTubePlaylist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelTitle?: string;
}

// Interface for YouTube video info
interface YouTubeVideo {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelTitle?: string;
  publishedAt?: string;
  duration?: string; // ISO 8601 duration format
}

// Import specialized services
import youtubePlaylistService from './youtubePlaylistService';
import playlistImportExportService from './playlistImportExportService';
import playlistVideoService from './playlistVideoService';
import type { PlaylistVideoWithDetails } from './playlistVideoService';

// Export types for use in IPC handlers
export { Playlist, PlaylistSummary };
export type { PlaylistVideoWithDetails };

// Create a custom playlist (empty)
export const createCustomPlaylist = async (
  name: string,
  description?: string
): Promise<number> => {
  try {
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    const playlist: Playlist = {
      name,
      description,
      source: 'custom',
      created_at: now,
      updated_at: now,
      video_count: 0,
      duration_seconds: 0
    };
    
    const id = await createPlaylist(db, playlist);
    logger.info(`Created custom playlist "${name}" with ID ${id}`);
    return id;
  } catch (error) {
    logger.error(`Failed to create custom playlist "${name}":`, error);
    throw error;
  }
};

// Import a YouTube playlist using yt-dlp
export const importYouTubePlaylist = async (
  playlistUrl: string
): Promise<number> => {
  try {
    logger.info(`Importing YouTube playlist from ${playlistUrl}`);
    
    // Validate URL format
    if (!playlistUrl.includes('youtube.com') && !playlistUrl.includes('youtu.be')) {
      throw new Error('Invalid YouTube URL');
    }
    
    // Get playlist information
    const playlistInfo = await getYouTubePlaylistInfo(playlistUrl);
    
    if (!playlistInfo) {
      throw new Error('Failed to fetch playlist information');
    }
    
    // Get database connection
    const db = await getDatabase();
    
    // Use transaction to ensure all database operations succeed or fail together
    return await db.transaction(async (db) => {
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
      
      // Fetch videos data outside the transaction to avoid long-running transaction
      const videosData = await fetchYouTubePlaylistVideos(playlistUrl);
      
      // Now process the videos within the transaction
      if (videosData && videosData.length > 0) {
        let position = 1;
        for (const videoData of videosData) {
          try {
            // Skip if this isn't a video entry
            if (!videoData.id || videoData._type !== 'url' || !videoData.url.includes('youtube.com/watch')) {
              continue;
            }
            
            await processYouTubeVideoWithTransaction(db, playlistId, videoData, position);
            position++;
          } catch (error) {
            logger.error(`Error processing video in playlist ${playlistId}:`, error);
            // Continue with next video even if this one fails
          }
        }
        logger.info(`Added ${position - 1} videos to playlist ID ${playlistId}`);
      } else {
        logger.warn(`No videos found in playlist ${playlistUrl}`);
      }
      
      // Update playlist stats
      await updatePlaylistStats(db, playlistId);
      
      return playlistId;
    });
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
const getYouTubePlaylistInfo = async (playlistUrl: string): Promise<YouTubePlaylist> => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = ytdlpService.getYtdlpPath();
    const args = [
      '--dump-json',
      '--flat-playlist',
      '--playlist-end', '1', // We just need playlist info, not all videos
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
          
          const playlistInfo: YouTubePlaylist = {
            id: data.id,
            title: data.title || 'Unknown Playlist',
            description: data.description,
            thumbnailUrl: data.thumbnail,
            channelId: data.channel_id,
            channelTitle: data.channel
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

// Fetch YouTube playlist videos as a separate step
const fetchYouTubePlaylistVideos = async (playlistUrl: string): Promise<any[]> => {
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
    
    process.on('close', (code) => {
      if (code === 0 && videosData) {
        try {
          // Process the JSON data line by line (each line is a separate JSON object)
          const videoLines = videosData.trim().split('\n');
          const videos = videoLines.map(line => {
            try {
              return JSON.parse(line);
            } catch (error) {
              logger.error(`Error parsing video JSON: ${error}`);
              return null;
            }
          }).filter(video => video !== null);
          
          resolve(videos);
        } catch (error) {
          reject(new Error(`Failed to process YouTube playlist videos: ${error}`));
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

// Process a YouTube video and add it to a playlist (within transaction)
const processYouTubeVideoWithTransaction = async (
  db: Database,
  playlistId: number, 
  videoData: any, 
  position: number
): Promise<void> => {
  try {
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
    
    // Add to playlist
    await addVideoToPlaylist(db, playlistId, videoId, position);
  } catch (error) {
    logger.error(`Failed to process YouTube video ${videoData?.id || 'unknown'}:`, error);
    throw error;
  }
};

// Helper to convert YouTube date format to Unix timestamp
const parseYouTubeDate = (dateStr: string): number | undefined => {
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

// Get all playlists
export const getAllPlaylistsService = async (): Promise<PlaylistSummary[]> => {
  try {
    const db = await getDatabase();
    return await getAllPlaylists(db);
  } catch (error) {
    logger.error('Failed to get all playlists:', error);
    throw error;
  }
};

// Get playlist details including videos
export const getPlaylistDetails = async (
  playlistId: number
): Promise<{ playlist: Playlist, videos: PlaylistVideoWithDetails[] }> => {
  try {
    const db = await getDatabase();
    
    // Get playlist info
    const playlist = await getPlaylistById(db, playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    
    // Get playlist videos
    const videos = await playlistVideoService.getPlaylistVideosService(playlistId);
    
    return { playlist, videos };
  } catch (error) {
    logger.error(`Failed to get details for playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Update playlist info
export const updatePlaylistInfo = async (
  playlistId: number,
  updates: Partial<Playlist>
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    return await updatePlaylist(db, playlistId, updates);
  } catch (error) {
    logger.error(`Failed to update playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Delete playlist
export const deletePlaylistService = async (
  playlistId: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    return await deletePlaylist(db, playlistId);
  } catch (error) {
    logger.error(`Failed to delete playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Add video to playlist
export const addVideoToPlaylistService = async (
  playlistId: number,
  videoData: {
    video_id: string;
    title: string;
    duration_seconds?: number;
    thumbnail?: string;
    author?: string;
  }
): Promise<number> => {
  try {
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    // Create or update the video
    const video: Video = {
      video_id: videoData.video_id,
      title: videoData.title,
      duration_seconds: videoData.duration_seconds,
      thumbnail: videoData.thumbnail,
      author: videoData.author,
      created_at: now,
      updated_at: now,
      download_status: 'not_downloaded'
    };
    
    const videoId = await createOrUpdateVideo(db, video);
    
    // Check if video is already in the playlist
    const exists = await videoExistsInPlaylist(db, playlistId, videoId);
    if (exists) {
      throw new Error('Video already exists in this playlist');
    }
    
    // Add video to playlist
    const playlistVideoId = await addVideoToPlaylist(db, playlistId, videoId);
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return playlistVideoId;
  } catch (error) {
    logger.error(`Failed to add video to playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Remove video from playlist
export const removeVideoFromPlaylistService = async (
  playlistId: number,
  videoId: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    const result = await removeVideoFromPlaylist(db, playlistId, videoId);
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return result;
  } catch (error) {
    logger.error(`Failed to remove video ID ${videoId} from playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Update video position in playlist
export const updateVideoPositionService = async (
  playlistId: number,
  videoId: number,
  newPosition: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    return await updateVideoPosition(db, playlistId, videoId, newPosition);
  } catch (error) {
    logger.error(`Failed to update position of video ID ${videoId} in playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Refresh a YouTube playlist
export const refreshPlaylist = async (
  playlistId: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    
    // Get playlist info
    const playlist = await getPlaylistById(db, playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    
    // Verify it's a YouTube playlist
    if (playlist.source !== 'youtube' || !playlist.source_id) {
      throw new Error('Only YouTube playlists can be refreshed');
    }
    
    // Construct YouTube playlist URL
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.source_id}`;
    
    // Refresh playlist videos
    await youtubePlaylistService.addYouTubePlaylistVideos(playlistId, playlistUrl);
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return true;
  } catch (error) {
    logger.error(`Failed to refresh playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Export a playlist to JSON
export const exportPlaylistToJson = async (
  playlistId: number
): Promise<string> => {
  try {
    const details = await getPlaylistDetails(playlistId);
    
    // Create export object
    const exportData = {
      playlist: {
        name: details.playlist.name,
        description: details.playlist.description,
        source: details.playlist.source,
        source_id: details.playlist.source_id,
        exported_at: new Date().toISOString()
      },
      videos: details.videos.map(v => ({
        video_id: v.video_external_id,
        title: v.title,
        thumbnail: v.thumbnail,
        duration_seconds: v.duration_seconds,
        author: v.author,
        position: v.position
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error(`Failed to export playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Import a playlist from JSON
export const importPlaylistFromJson = async (
  jsonData: string
): Promise<number> => {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate basic structure
    if (!data.playlist || !data.playlist.name || !Array.isArray(data.videos)) {
      throw new Error('Invalid playlist JSON format');
    }
    
    // Create the playlist
    const playlistId = await createCustomPlaylist(
      data.playlist.name,
      data.playlist.description
    );
    
    // Add videos to the playlist
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < data.videos.length; i++) {
      const videoData = data.videos[i];
      
      // Create or update the video
      const video: Video = {
        video_id: videoData.video_id,
        title: videoData.title || 'Unknown Title',
        duration_seconds: videoData.duration_seconds,
        thumbnail: videoData.thumbnail,
        author: videoData.author,
        created_at: now,
        updated_at: now,
        download_status: 'not_downloaded'
      };
      
      const videoId = await createOrUpdateVideo(db, video);
      
      // Add to playlist
      await addVideoToPlaylist(db, playlistId, videoId, videoData.position || i + 1);
    }
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return playlistId;
  } catch (error) {
    logger.error('Failed to import playlist from JSON:', error);
    throw error;
  }
};

// Create a combined service object that acts as a Facade
export default {
  // Core playlist operations
  createCustomPlaylist,
  getAllPlaylistsService,
  getPlaylistDetails,
  updatePlaylistInfo,
  deletePlaylistService,
  
  // YouTube-specific operations (delegated to youtubePlaylistService)
  importYouTubePlaylist: youtubePlaylistService.importYouTubePlaylist,
  refreshPlaylist: async (playlistId: number): Promise<boolean> => {
    try {
      const db = await getDatabase();
      
      // Get playlist info
      const playlist = await getPlaylistById(db, playlistId);
      if (!playlist) {
        throw new Error(`Playlist with ID ${playlistId} not found`);
      }
      
      // Verify it's a YouTube playlist
      if (playlist.source !== 'youtube' || !playlist.source_id) {
        throw new Error('Only YouTube playlists can be refreshed');
      }
      
      // Construct YouTube playlist URL
      const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.source_id}`;
      
      // Refresh playlist videos
      await youtubePlaylistService.addYouTubePlaylistVideos(playlistId, playlistUrl);
      
      // Update playlist stats
      await updatePlaylistStats(db, playlistId);
      
      return true;
    } catch (error) {
      logger.error(`Failed to refresh playlist ID ${playlistId}:`, error);
      throw error;
    }
  },
  
  // Import/export operations (delegated to playlistImportExportService)
  exportPlaylistToJson: playlistImportExportService.exportPlaylistToJson,
  importPlaylistFromJson: playlistImportExportService.importPlaylistFromJson,
  
  // Video-in-playlist operations (delegated to playlistVideoService)
  addVideoToPlaylistService: playlistVideoService.addVideoToPlaylistService,
  removeVideoFromPlaylistService: playlistVideoService.removeVideoFromPlaylistService,
  updateVideoPositionService: playlistVideoService.updateVideoPositionService,
  videoExistsInPlaylistService: playlistVideoService.videoExistsInPlaylistService
}; 