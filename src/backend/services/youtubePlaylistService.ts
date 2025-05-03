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
  thumbnailUrl?: string | null;  // Allow null value
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
      thumbnail: playlistInfo.thumbnailUrl ?? undefined,
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

// Enhanced thumbnail extraction function for playlists
const extractBestThumbnailUrl = (playlistData: any): string | null => {
  // Log thumbnail debugging info
  const thumbDebugInfo = {
    hasPlaylists: !!playlistData.id,
    hasEntries: !!playlistData.entries && Array.isArray(playlistData.entries) && playlistData.entries.length > 0,
    firstVideoId: playlistData.entries && playlistData.entries.length > 0 ? playlistData.entries[0]?.id : null, 
    hasCustomThumbnail: !!playlistData.playlist_thumbnail || !!playlistData.thumbnail_url,
    hasThumbnailArray: !!playlistData.thumbnails && Array.isArray(playlistData.thumbnails),
    thumbnailCount: playlistData.thumbnails?.length || 0
  };
  logger.debug(`Thumbnail debug info: ${JSON.stringify(thumbDebugInfo)}`);

  // FIRST PRIORITY: Always prefer custom set playlist thumbnails
  if (playlistData.thumbnail_url && 
      typeof playlistData.thumbnail_url === 'string' && 
      playlistData.thumbnail_url.startsWith('http')) {
    logger.info(`Using custom playlist thumbnail_url field`);
    return playlistData.thumbnail_url;
  }
  
  if (playlistData.playlist_thumbnail && 
      typeof playlistData.playlist_thumbnail === 'string' && 
      playlistData.playlist_thumbnail.startsWith('http')) {
    logger.info(`Using custom playlist_thumbnail field`);
    return playlistData.playlist_thumbnail;
  }

  // SECOND PRIORITY: For official playlists, YouTube almost always uses the FIRST video as the thumbnail
  // So prioritize the first video if available
  if (playlistData.entries && Array.isArray(playlistData.entries) && playlistData.entries.length > 0) {
    const firstVideo = playlistData.entries[0];
    if (firstVideo && firstVideo.id && typeof firstVideo.id === 'string') {
      logger.info(`Using first video (${firstVideo.id}) for playlist thumbnail`);
      return `https://i.ytimg.com/vi/${firstVideo.id}/hqdefault.jpg`;
    }
  }
  
  // THIRD PRIORITY: Check if we have a video ID in the URL that can be used as the thumbnail
  // This is common for playlists that start with a specific video
  if (playlistData._url && typeof playlistData._url === 'string') {
    const videoIdMatch = playlistData._url.match(/[?&]v=([^&]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];
      logger.info(`Using video ID from URL (${videoId}) for playlist thumbnail`);
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  // FOURTH PRIORITY: Try to find a thumbnail that might be the playlist's default
  if (playlistData.thumbnails && Array.isArray(playlistData.thumbnails) && playlistData.thumbnails.length > 0) {
    // Filter out empty or non-URL thumbnails
    const validThumbnails = playlistData.thumbnails.filter(
      (t: any) => t && t.url && typeof t.url === 'string' && t.url.startsWith('http')
    );
    
    if (validThumbnails.length > 0) {
      // Look for thumbnails with playlist indicators
      const playlistThumbnail = validThumbnails.find((t: any) => 
        t.id === 'playlist' || 
        t.type === 'playlist' || 
        (t.preference && t.preference.includes('playlist'))
      );
      
      if (playlistThumbnail) {
        logger.info(`Found explicit playlist thumbnail in thumbnails array`);
        return playlistThumbnail.url;
      }
      
      // If a thumbnail URL contains '/vi/' (video ID indicator), extract that ID and use it
      // as it's likely the first or featured video
      for (const thumb of validThumbnails) {
        if (thumb.url.includes('/vi/')) {
          const match = thumb.url.match(/\/vi\/([^\/]+)\//);
          if (match && match[1]) {
            const videoId = match[1];
            logger.info(`Extracted video ID ${videoId} from thumbnail URL for playlist thumbnail`);
            return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }
        }
      }
      
      // As a last resort, use any valid thumbnail
      logger.info(`Using first available thumbnail from array as fallback`);
      return validThumbnails[0].url;
    }
  }
  
  // FIFTH PRIORITY: Try the single thumbnail field
  if (playlistData.thumbnail && 
      typeof playlistData.thumbnail === 'string' && 
      playlistData.thumbnail.startsWith('http')) {
    logger.info(`Using single thumbnail field`);
    return playlistData.thumbnail;
  }
  
  // Last attempt - try direct YouTube API URL formats
  if (playlistData.id && typeof playlistData.id === 'string' && playlistData.id.length > 5) {
    if (playlistData.id.startsWith('PL') || playlistData.id.startsWith('OL')) {
      logger.info(`Attempting direct YouTube API playlist thumbnail for ID: ${playlistData.id}`);
      return `https://i.ytimg.com/vi/PL${playlistData.id}/hqdefault.jpg`;
    }
  }
  
  logger.warn(`No valid thumbnail found for playlist ${playlistData.id || 'unknown'}`);
  return null;
};

// Get information about a YouTube playlist
export const getYouTubePlaylistInfo = async (playlistUrl: string): Promise<YouTubePlaylist & { videoCount?: number }> => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = ytdlpService.getYtdlpPath();
    const args = [
      '--dump-single-json',  // Get all playlist info in a single JSON object
      '--flat-playlist',     // Don't extract video info
      '--no-warnings',       // Reduce unnecessary warnings in logs
      playlistUrl
    ];
    
    // Extract video ID and playlist ID from the URL for debugging
    const videoIdMatch = playlistUrl.match(/[?&]v=([^&]+)/);
    const playlistIdMatch = playlistUrl.match(/[?&]list=([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : 'none';
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : 'none';
    
    logger.debug(`Fetching YouTube playlist info: ${playlistUrl}`);
    logger.debug(`Extracted from URL - Video ID: ${videoId}, Playlist ID: ${playlistId}`);
    
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
          
          // Debug log some of the raw data to help understand structure
          const debugInfo = {
            id: data.id,
            hasCustomThumbnail: !!data.playlist_thumbnail,
            thumbnailFields: Object.keys(data).filter(k => k.includes('thumbnail') || k.includes('thumb')),
            thumbnailCount: data.thumbnails?.length || 0,
            entryCount: data.entries?.length || 0
          };
          logger.debug(`Playlist data received: ${JSON.stringify(debugInfo)}`);
          
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
          
          // Extract the best thumbnail URL
          const thumbnailUrl = extractBestThumbnailUrl(data);
          
          // Create playlist info object
          const playlistInfo = {
            id: playlistId,
            title: data.title || 'Unknown Playlist',
            description: data.description,
            thumbnailUrl: thumbnailUrl,
            channelId: data.channel_id,
            channelTitle: data.channel,
            videoCount: data.entries ? data.entries.length : undefined
          };
          
          // Only log the final result without the full URL to reduce log noise
          if (thumbnailUrl) {
            logger.info(`Found thumbnail for playlist: ${playlistId}`);
          } else {
            logger.info(`No thumbnail found for playlist: ${playlistId}`);
          }
          
          resolve(playlistInfo);
        } catch (error: unknown) {
          if (error instanceof Error) {
            reject(new Error(`Failed to parse YouTube playlist info: ${error.message}`));
          } else {
            reject(new Error(`Failed to parse YouTube playlist info: ${String(error)}`));
          }
        }
      } else {
        // Improved error message with more context
        const errorMsg = `yt-dlp exited with code ${code} for playlist: ${playlistUrl}`;
        logger.error(errorMsg);
        
        if (output) {
          logger.error(`yt-dlp output: ${output}`);
        }
        
        reject(new Error(errorMsg));
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
        // Improved error message with more context
        const errorMsg = `yt-dlp exited with code ${code} while fetching videos for playlist: ${playlistUrl}`;
        logger.error(errorMsg);
        
        if (videosData) {
          logger.error(`yt-dlp output: ${videosData}`);
        }
        
        reject(new Error(errorMsg));
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