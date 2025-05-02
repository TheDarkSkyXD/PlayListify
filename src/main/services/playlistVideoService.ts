import { getDatabase } from '../database';
import { updatePlaylistStats } from '../database/playlistQueries';
import { Video, createOrUpdateVideo } from '../database/videoQueries';
import {
  addVideoToPlaylist,
  getPlaylistVideos,
  removeVideoFromPlaylist,
  updateVideoPosition,
  videoExistsInPlaylist,
  PlaylistVideoWithDetails as DatabasePlaylistVideoWithDetails
} from '../database/playlistVideoQueries';
import logger from './logService';

// Re-export the type with a service-specific name
export type PlaylistVideoWithDetails = DatabasePlaylistVideoWithDetails;

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

// Get all videos in a playlist
export const getPlaylistVideosService = async (
  playlistId: number
): Promise<PlaylistVideoWithDetails[]> => {
  try {
    const db = await getDatabase();
    return await getPlaylistVideos(db, playlistId);
  } catch (error) {
    logger.error(`Failed to get videos for playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Check if a video exists in a playlist
export const videoExistsInPlaylistService = async (
  playlistId: number,
  videoId: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    return await videoExistsInPlaylist(db, playlistId, videoId);
  } catch (error) {
    logger.error(`Failed to check if video ID ${videoId} exists in playlist ID ${playlistId}:`, error);
    throw error;
  }
};

export default {
  addVideoToPlaylistService,
  removeVideoFromPlaylistService,
  updateVideoPositionService,
  getPlaylistVideosService,
  videoExistsInPlaylistService
}; 