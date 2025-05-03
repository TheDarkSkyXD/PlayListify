import Database from './sqlite-adapter';
import logger from '../services/logService';

// Type definitions for Playlist entities
export interface Playlist {
  id?: number;
  name: string;
  description?: string;
  source?: string;
  source_id?: string;
  thumbnail?: string;
  created_at: number;
  updated_at: number;
  video_count?: number;
  duration_seconds?: number;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  thumbnail?: string;
  video_count: number;
  duration_seconds: number;
}

// Create a new playlist
export const createPlaylist = async (
  db: Database,
  playlist: Playlist
): Promise<number> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Set created_at and updated_at if not provided
    if (!playlist.created_at) playlist.created_at = now;
    if (!playlist.updated_at) playlist.updated_at = now;
    
    // Insert the playlist
    const result = await db.prepare(`
      INSERT INTO playlists 
      (name, description, source, source_id, thumbnail, created_at, updated_at, video_count, duration_seconds) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      playlist.name,
      playlist.description || null,
      playlist.source || null,
      playlist.source_id || null,
      playlist.thumbnail || null,
      playlist.created_at,
      playlist.updated_at,
      playlist.video_count || 0,
      playlist.duration_seconds || 0
    );
    
    // Get the ID of the newly inserted playlist
    const id = result.lastInsertRowid as number;
    logger.info(`Created playlist: ${playlist.name} (ID: ${id})`);
    
    return id;
  } catch (error) {
    logger.error('Failed to create playlist:', error);
    throw error;
  }
};

// Get a playlist by ID
export const getPlaylistById = async (
  db: Database,
  id: number
): Promise<Playlist | null> => {
  try {
    const playlist = await db.prepare(`
      SELECT * FROM playlists WHERE id = ?
    `).get(id);
    
    return playlist || null;
  } catch (error) {
    logger.error(`Failed to get playlist with ID ${id}:`, error);
    throw error;
  }
};

// Get all playlists (basic info for listing)
export const getAllPlaylists = async (
  db: Database
): Promise<PlaylistSummary[]> => {
  try {
    const playlists = await db.prepare(`
      SELECT id, name, thumbnail, video_count, duration_seconds 
      FROM playlists 
      ORDER BY name ASC
    `).all();
    
    return playlists;
  } catch (error) {
    logger.error('Failed to get all playlists:', error);
    throw error;
  }
};

// Update a playlist
export const updatePlaylist = async (
  db: Database,
  id: number,
  updates: Partial<Playlist>
): Promise<boolean> => {
  try {
    // Build the update query dynamically based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    
    // Always update updated_at
    updates.updated_at = Math.floor(Date.now() / 1000);
    
    // Add each field to the update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    // Add the playlist ID to the values array
    values.push(id);
    
    // Execute the update query
    const result = await db.prepare(`
      UPDATE playlists 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `).run(...values);
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Updated playlist ID ${id}`);
    } else {
      logger.warn(`No changes made to playlist ID ${id}`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to update playlist with ID ${id}:`, error);
    throw error;
  }
};

// Delete a playlist
export const deletePlaylist = async (
  db: Database,
  id: number
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      DELETE FROM playlists WHERE id = ?
    `).run(id);
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Deleted playlist ID ${id}`);
    } else {
      logger.warn(`No playlist found with ID ${id} to delete`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to delete playlist with ID ${id}:`, error);
    throw error;
  }
};

// Update playlist video count and duration
export const updatePlaylistStats = async (
  db: Database,
  id: number
): Promise<boolean> => {
  try {
    // Get video count and total duration
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as video_count,
        COALESCE(SUM(v.duration_seconds), 0) as duration_seconds
      FROM playlist_videos pv
      JOIN videos v ON pv.video_id = v.id
      WHERE pv.playlist_id = ?
    `).get(id);
    
    // Update the playlist
    const result = await db.prepare(`
      UPDATE playlists
      SET 
        video_count = ?,
        duration_seconds = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      stats.video_count || 0,
      stats.duration_seconds || 0,
      Math.floor(Date.now() / 1000),
      id
    );
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Updated stats for playlist ID ${id}: ${stats.video_count} videos, ${stats.duration_seconds} seconds`);
    } else {
      logger.warn(`Failed to update stats for playlist ID ${id}`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to update stats for playlist ID ${id}:`, error);
    throw error;
  }
}; 