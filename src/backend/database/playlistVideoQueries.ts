import Database from './sqlite-adapter';
import logger from '../services/logService';
import { updatePlaylistStats } from './playlistQueries';
import { getDatabase } from './index';

// Database variable to be initialized
let db: any;

// Initialize the database
async function initDb() {
  db = await getDatabase();
}

// Call initDb immediately
initDb().catch(error => {
  logger.error('Failed to initialize database in playlistVideoQueries:', error);
});

// Type definitions for PlaylistVideo entities
export interface PlaylistVideo {
  id?: number;
  playlist_id: number;
  video_id: number;
  position: number;
  added_at: number;
}

export interface PlaylistVideoWithDetails {
  id: number;
  playlist_id: number;
  video_id: number;
  position: number;
  added_at: number;
  video_external_id: string;
  title: string;
  thumbnail?: string;
  duration_seconds?: number;
  author?: string;
  download_status?: string;
}

// Add a video to a playlist
export const addVideoToPlaylist = async (
  db: Database,
  playlistId: number,
  videoId: number,
  position?: number
): Promise<number> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Get current max position if not specified
      if (position === undefined) {
        const maxPosition = await db.prepare(`
          SELECT MAX(position) as max_pos FROM playlist_videos WHERE playlist_id = ?
        `).get(playlistId);
        
        position = (maxPosition?.max_pos || 0) + 1;
      }
      
      // Insert the playlist video entry
      const result = await db.prepare(`
        INSERT INTO playlist_videos (playlist_id, video_id, position, added_at)
        VALUES (?, ?, ?, ?)
      `).run(playlistId, videoId, position, now);
      
      // Update playlist stats (video count and duration)
      await updatePlaylistStats(db, playlistId);
      
      // Commit transaction
      await db.exec('COMMIT');
      
      const id = result.lastInsertRowid as number;
      logger.info(`Added video ID ${videoId} to playlist ID ${playlistId} at position ${position}`);
      
      return id;
    } catch (error) {
      // Rollback on error
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to add video ID ${videoId} to playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Get all videos in a playlist
export const getPlaylistVideos = async (
  db: Database,
  playlistId: number
): Promise<PlaylistVideoWithDetails[]> => {
  try {
    const videos = await db.prepare(`
      SELECT 
        pv.id, pv.playlist_id, pv.video_id, pv.position, pv.added_at,
        v.video_id as video_external_id, v.title, v.thumbnail, 
        v.duration_seconds, v.author, v.download_status
      FROM playlist_videos pv
      JOIN videos v ON pv.video_id = v.id
      WHERE pv.playlist_id = ?
      ORDER BY pv.position ASC
    `).all(playlistId);
    
    return videos;
  } catch (error) {
    logger.error(`Failed to get videos for playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Remove a video from a playlist
export const removeVideoFromPlaylist = async (
  db: Database,
  playlistId: number,
  videoId: number
): Promise<boolean> => {
  try {
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Get the position of the video to be removed
      const videoToRemove = await db.prepare(`
        SELECT position FROM playlist_videos 
        WHERE playlist_id = ? AND video_id = ?
      `).get(playlistId, videoId);
      
      if (!videoToRemove) {
        await db.exec('ROLLBACK');
        logger.warn(`Video ID ${videoId} not found in playlist ID ${playlistId}`);
        return false;
      }
      
      // Delete the playlist video entry
      await db.prepare(`
        DELETE FROM playlist_videos 
        WHERE playlist_id = ? AND video_id = ?
      `).run(playlistId, videoId);
      
      // Reorder positions for remaining videos
      await db.prepare(`
        UPDATE playlist_videos 
        SET position = position - 1 
        WHERE playlist_id = ? AND position > ?
      `).run(playlistId, videoToRemove.position);
      
      // Update playlist stats
      await updatePlaylistStats(db, playlistId);
      
      // Commit transaction
      await db.exec('COMMIT');
      
      logger.info(`Removed video ID ${videoId} from playlist ID ${playlistId}`);
      return true;
    } catch (error) {
      // Rollback on error
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to remove video ID ${videoId} from playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Update video position in playlist
export const updateVideoPosition = async (
  db: Database,
  playlistId: number,
  videoId: number,
  newPosition: number
): Promise<boolean> => {
  try {
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Get the current position of the video
      const video = await db.prepare(`
        SELECT position FROM playlist_videos 
        WHERE playlist_id = ? AND video_id = ?
      `).get(playlistId, videoId);
      
      if (!video) {
        await db.exec('ROLLBACK');
        logger.warn(`Video ID ${videoId} not found in playlist ID ${playlistId}`);
        return false;
      }
      
      const currentPosition = video.position;
      
      // Skip if position hasn't changed
      if (currentPosition === newPosition) {
        await db.exec('ROLLBACK');
        return true;
      }
      
      if (newPosition < currentPosition) {
        // Moving up: Shift videos between new and current position down
        await db.prepare(`
          UPDATE playlist_videos 
          SET position = position + 1 
          WHERE playlist_id = ? AND position >= ? AND position < ?
        `).run(playlistId, newPosition, currentPosition);
      } else {
        // Moving down: Shift videos between current and new position up
        await db.prepare(`
          UPDATE playlist_videos 
          SET position = position - 1 
          WHERE playlist_id = ? AND position > ? AND position <= ?
        `).run(playlistId, currentPosition, newPosition);
      }
      
      // Update the position of the video
      await db.prepare(`
        UPDATE playlist_videos 
        SET position = ? 
        WHERE playlist_id = ? AND video_id = ?
      `).run(newPosition, playlistId, videoId);
      
      // Commit transaction
      await db.exec('COMMIT');
      
      logger.info(`Updated position of video ID ${videoId} in playlist ID ${playlistId} from ${currentPosition} to ${newPosition}`);
      return true;
    } catch (error) {
      // Rollback on error
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to update position of video ID ${videoId} in playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Check if a video exists in a playlist
export const videoExistsInPlaylist = async (
  db: Database,
  playlistId: number,
  videoId: number
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      SELECT 1 FROM playlist_videos 
      WHERE playlist_id = ? AND video_id = ?
      LIMIT 1
    `).get(playlistId, videoId);
    
    return !!result;
  } catch (error) {
    logger.error(`Failed to check if video ID ${videoId} exists in playlist ID ${playlistId}:`, error);
    throw error;
  }
}; 