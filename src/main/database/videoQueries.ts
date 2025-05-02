import { getDatabase } from './index';
import logger from '../services/logService';
import Database from './sqlite-adapter';

// Database variable to be initialized
let db: any;

// Initialize the database
async function initDb() {
  db = await getDatabase();
}

// Call initDb immediately
initDb().catch(error => {
  logger.error('Failed to initialize database in videoQueries:', error);
});

// Type definitions for Video entities
export interface Video {
  id?: number;
  video_id: string; // External video ID (e.g., YouTube)
  title: string;
  description?: string;
  duration_seconds?: number;
  thumbnail?: string;
  author?: string;
  author_id?: string;
  published_at?: number;
  view_count?: number;
  created_at: number;
  updated_at: number;
  file_path?: string;
  file_format?: string;
  file_size_bytes?: number;
  download_status?: string;
  local_file_path?: string; // Path to downloaded file
}

export interface VideoSummary {
  id: number;
  video_id: string;
  title: string;
  thumbnail?: string;
  duration_seconds?: number;
  author?: string;
  download_status?: string;
}

// Create a new video or update if it already exists
export const createOrUpdateVideo = async (
  db: Database,
  video: Video
): Promise<number> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Set created_at and updated_at if not provided
    if (!video.created_at) video.created_at = now;
    if (!video.updated_at) video.updated_at = now;
    
    // Check if video already exists
    const existingVideo = await db.prepare(
      'SELECT id FROM videos WHERE video_id = ?'
    ).get(video.video_id);
    
    if (existingVideo) {
      // Update existing video
      await db.prepare(`
        UPDATE videos SET
          title = ?,
          description = ?,
          duration_seconds = ?,
          thumbnail = ?,
          author = ?,
          author_id = ?,
          published_at = ?,
          view_count = ?,
          updated_at = ?,
          file_path = COALESCE(?, file_path),
          file_format = COALESCE(?, file_format),
          file_size_bytes = COALESCE(?, file_size_bytes),
          download_status = COALESCE(?, download_status)
        WHERE id = ?
      `).run(
        video.title,
        video.description || null,
        video.duration_seconds || null,
        video.thumbnail || null,
        video.author || null,
        video.author_id || null,
        video.published_at || null,
        video.view_count || null,
        video.updated_at,
        video.file_path || null,
        video.file_format || null,
        video.file_size_bytes || null,
        video.download_status || null,
        existingVideo.id
      );
      
      logger.info(`Updated video: ${video.title} (ID: ${existingVideo.id})`);
      return existingVideo.id;
    } else {
      // Insert new video
      const result = await db.prepare(`
        INSERT INTO videos (
          video_id, title, description, duration_seconds, thumbnail,
          author, author_id, published_at, view_count, created_at, updated_at,
          file_path, file_format, file_size_bytes, download_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        video.video_id,
        video.title,
        video.description || null,
        video.duration_seconds || null,
        video.thumbnail || null,
        video.author || null,
        video.author_id || null,
        video.published_at || null,
        video.view_count || null,
        video.created_at,
        video.updated_at,
        video.file_path || null,
        video.file_format || null,
        video.file_size_bytes || null,
        video.download_status || null
      );
      
      const id = result.lastInsertRowid as number;
      logger.info(`Created video: ${video.title} (ID: ${id})`);
      return id;
    }
  } catch (error) {
    logger.error(`Failed to create/update video with external ID ${video.video_id}:`, error);
    throw error;
  }
};

// Get a video by internal ID
export const getVideoById = async (
  db: Database,
  id: number
): Promise<Video | null> => {
  try {
    const video = await db.prepare(`
      SELECT * FROM videos WHERE id = ?
    `).get(id);
    
    return video || null;
  } catch (error) {
    logger.error(`Failed to get video with ID ${id}:`, error);
    throw error;
  }
};

// Get a video by external video_id
export const getVideoByExternalId = async (
  db: Database,
  videoId: string
): Promise<Video | null> => {
  try {
    const video = await db.prepare(`
      SELECT * FROM videos WHERE video_id = ?
    `).get(videoId);
    
    return video || null;
  } catch (error) {
    logger.error(`Failed to get video with external ID ${videoId}:`, error);
    throw error;
  }
};

// Get all videos (basic info for listing)
export const getAllVideos = async (
  db: Database,
  limit: number = 100,
  offset: number = 0
): Promise<VideoSummary[]> => {
  try {
    const videos = await db.prepare(`
      SELECT id, video_id, title, thumbnail, duration_seconds, author, download_status 
      FROM videos 
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    return videos;
  } catch (error) {
    logger.error('Failed to get all videos:', error);
    throw error;
  }
};

// Update video download status and file info
export const updateVideoDownloadInfo = async (
  db: Database,
  id: number,
  filePath: string,
  fileFormat: string,
  fileSizeBytes: number,
  downloadStatus: string
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      UPDATE videos
      SET
        file_path = ?,
        file_format = ?,
        file_size_bytes = ?,
        download_status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      filePath,
      fileFormat,
      fileSizeBytes,
      downloadStatus,
      Math.floor(Date.now() / 1000),
      id
    );
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Updated download info for video ID ${id}: status=${downloadStatus}`);
    } else {
      logger.warn(`Failed to update download info for video ID ${id}`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to update download info for video ID ${id}:`, error);
    throw error;
  }
};

// Delete a video
export const deleteVideo = async (
  db: Database,
  id: number
): Promise<boolean> => {
  try {
    const result = await db.prepare(`
      DELETE FROM videos WHERE id = ?
    `).run(id);
    
    const success = (result.changes || 0) > 0;
    if (success) {
      logger.info(`Deleted video ID ${id}`);
    } else {
      logger.warn(`No video found with ID ${id} to delete`);
    }
    
    return success;
  } catch (error) {
    logger.error(`Failed to delete video with ID ${id}:`, error);
    throw error;
  }
};

// Search videos by title, description, or author
export const searchVideos = async (
  db: Database,
  searchTerm: string,
  limit: number = 100,
  offset: number = 0
): Promise<VideoSummary[]> => {
  try {
    const searchPattern = `%${searchTerm}%`;
    const videos = await db.prepare(`
      SELECT id, video_id, title, thumbnail, duration_seconds, author, download_status 
      FROM videos 
      WHERE 
        title LIKE ? OR 
        description LIKE ? OR 
        author LIKE ?
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `).all(searchPattern, searchPattern, searchPattern, limit, offset);
    
    return videos;
  } catch (error) {
    logger.error(`Failed to search videos with term '${searchTerm}':`, error);
    throw error;
  }
};

/**
 * Update video download status
 */
export function updateVideoDownloadStatus(
  videoId: string, 
  status: 'not_downloaded' | 'queued' | 'downloading' | 'downloaded' | 'download_failed',
  localFilePath?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const updateQuery = localFilePath
        ? 'UPDATE videos SET download_status = ?, local_file_path = ? WHERE id = ?'
        : 'UPDATE videos SET download_status = ? WHERE id = ?';
      
      const params = localFilePath
        ? [status, localFilePath, videoId]
        : [status, videoId];
      
      db.prepare(updateQuery).run(...params);
      resolve();
    } catch (error) {
      logger.error(`Failed to update video download status: ${videoId}`, { error });
      reject(error);
    }
  });
} 