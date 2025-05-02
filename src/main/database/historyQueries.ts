import Database from './sqlite-adapter';
import logger from '../services/logService';

// Type definitions for History entities
export interface History {
  id?: number;
  video_id: number;
  playlist_id?: number;
  position_seconds: number;
  completed: boolean;
  played_at: number;
}

export interface HistoryWithVideoDetails {
  id: number;
  video_id: number;
  playlist_id?: number;
  position_seconds: number;
  completed: boolean;
  played_at: number;
  video_external_id: string;
  title: string;
  thumbnail?: string;
  duration_seconds?: number;
  author?: string;
  playlist_name?: string;
}

// Record a video play event
export const recordVideoPlay = async (
  db: Database,
  videoId: number,
  playlistId?: number,
  positionSeconds: number = 0,
  completed: boolean = false
): Promise<number> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Insert history entry
    const result = await db.prepare(`
      INSERT INTO history (video_id, playlist_id, position_seconds, completed, played_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(videoId, playlistId || null, positionSeconds, completed ? 1 : 0, now);
    
    const id = result.lastInsertRowid as number;
    logger.info(`Recorded play event for video ID ${videoId}: position=${positionSeconds}, completed=${completed}`);
    
    return id;
  } catch (error) {
    logger.error(`Failed to record play event for video ID ${videoId}:`, error);
    throw error;
  }
};

// Update playback position for a history entry
export const updatePlaybackPosition = async (
  db: Database,
  historyId: number,
  positionSeconds: number,
  completed: boolean = false
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      UPDATE history
      SET position_seconds = ?, completed = ?
      WHERE id = ?
    `).run(positionSeconds, completed ? 1 : 0, historyId);
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Updated playback position for history ID ${historyId}: position=${positionSeconds}, completed=${completed}`);
    } else {
      logger.warn(`No history entry found with ID ${historyId}`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to update playback position for history ID ${historyId}:`, error);
    throw error;
  }
};

// Get most recent history entries with video details
export const getRecentHistory = async (
  db: Database,
  limit: number = 50,
  offset: number = 0
): Promise<HistoryWithVideoDetails[]> => {
  try {
    const history = await db.prepare(`
      SELECT 
        h.id, h.video_id, h.playlist_id, h.position_seconds, h.completed, h.played_at,
        v.video_id as video_external_id, v.title, v.thumbnail, v.duration_seconds, v.author,
        p.name as playlist_name
      FROM history h
      JOIN videos v ON h.video_id = v.id
      LEFT JOIN playlists p ON h.playlist_id = p.id
      ORDER BY h.played_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    return history;
  } catch (error) {
    logger.error('Failed to get recent history:', error);
    throw error;
  }
};

// Get play history for a specific video
export const getVideoHistory = async (
  db: Database,
  videoId: number
): Promise<History[]> => {
  try {
    const history = await db.prepare(`
      SELECT * FROM history
      WHERE video_id = ?
      ORDER BY played_at DESC
    `).all(videoId);
    
    return history;
  } catch (error) {
    logger.error(`Failed to get history for video ID ${videoId}:`, error);
    throw error;
  }
};

// Get the most recent play for a video
export const getMostRecentPlay = async (
  db: Database,
  videoId: number
): Promise<History | null> => {
  try {
    const history = await db.prepare(`
      SELECT * FROM history
      WHERE video_id = ?
      ORDER BY played_at DESC
      LIMIT 1
    `).get(videoId);
    
    return history || null;
  } catch (error) {
    logger.error(`Failed to get most recent play for video ID ${videoId}:`, error);
    throw error;
  }
};

// Delete history entries for a specific video
export const deleteVideoHistory = async (
  db: Database,
  videoId: number
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      DELETE FROM history
      WHERE video_id = ?
    `).run(videoId);
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Deleted history entries for video ID ${videoId}`);
    } else {
      logger.warn(`No history entries found for video ID ${videoId}`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to delete history for video ID ${videoId}:`, error);
    throw error;
  }
};

// Clear all history
export const clearAllHistory = async (
  db: Database
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      DELETE FROM history
    `).run();
    
    const entriesDeleted = result.changes || 0;
    logger.info(`Cleared all history: ${entriesDeleted} entries deleted`);
    
    return true;
  } catch (error) {
    logger.error('Failed to clear all history:', error);
    throw error;
  }
};

// Get most-watched videos
export const getMostWatchedVideos = async (
  db: Database,
  limit: number = 10
): Promise<{ video_id: number; count: number; title: string; thumbnail?: string; }[]> => {
  try {
    const videos = await db.prepare(`
      SELECT 
        h.video_id, COUNT(*) as count, 
        v.title, v.thumbnail
      FROM history h
      JOIN videos v ON h.video_id = v.id
      GROUP BY h.video_id
      ORDER BY count DESC
      LIMIT ?
    `).all(limit);
    
    return videos;
  } catch (error) {
    logger.error('Failed to get most-watched videos:', error);
    throw error;
  }
}; 