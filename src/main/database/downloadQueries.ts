import { getDatabase } from './index';
import logger from '../services/logService';

// Database variable to be initialized
let db: any;

// Initialize the database
async function initDb() {
  db = await getDatabase();
}

// Call initDb immediately
initDb().catch(error => {
  logger.error('Failed to initialize database in downloadQueries:', error);
});

export interface Download {
  id: string;
  video_id: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  download_path: string;
  format_id: string;
  filename: string;
  final_path?: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadUpdate extends Partial<Download> {
  id: string;
  video_id: string;
}

/**
 * Add or update a download record
 */
export function addOrUpdateDownload(download: DownloadUpdate): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if download exists
      const existingDownload = db.prepare('SELECT * FROM downloads WHERE id = ?').get(download.id);
      
      if (existingDownload) {
        // Update existing record
        const updateValues: any = { ...download };
        delete updateValues.id; // Remove ID from update values

        // Build the SET part of the query
        const sets = Object.keys(updateValues)
          .filter(key => updateValues[key] !== undefined)
          .map(key => `${key} = ?`)
          .join(', ');
        
        if (sets.length === 0) {
          resolve();
          return;
        }
        
        const updateParams = Object.keys(updateValues)
          .filter(key => updateValues[key] !== undefined)
          .map(key => updateValues[key]);
        
        const query = `UPDATE downloads SET ${sets} WHERE id = ?`;
        
        db.prepare(query).run(...updateParams, download.id);
        logger.debug(`Updated download ${download.id}`);
        resolve();
      } else {
        // Insert new record
        const columns = Object.keys(download).filter(k => download[k as keyof DownloadUpdate] !== undefined);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(k => download[k as keyof DownloadUpdate]);
        
        const query = `INSERT INTO downloads (${columns.join(', ')}) VALUES (${placeholders})`;
        db.prepare(query).run(...values);
        logger.debug(`Created download ${download.id}`);
        resolve();
      }
    } catch (error) {
      logger.error(`Failed to add/update download ${download.id}`, { error });
      reject(error);
    }
  });
}

/**
 * Get a single download by ID
 */
export function getDownloadById(id: string): Promise<Download | null> {
  return new Promise((resolve, reject) => {
    try {
      const download = db.prepare('SELECT * FROM downloads WHERE id = ?').get(id);
      resolve(download || null);
    } catch (error) {
      logger.error(`Failed to get download ${id}`, { error });
      reject(error);
    }
  });
}

/**
 * Get downloads by status
 */
export function getDownloadsByStatus(statuses: string[]): Promise<Download[]> {
  return new Promise((resolve, reject) => {
    try {
      const placeholders = statuses.map(() => '?').join(', ');
      const query = `SELECT * FROM downloads WHERE status IN (${placeholders}) ORDER BY created_at DESC`;
      
      const downloads = db.prepare(query).all(...statuses);
      resolve(downloads);
    } catch (error) {
      logger.error(`Failed to get downloads by status`, { error });
      reject(error);
    }
  });
}

/**
 * Get downloads by video ID
 */
export function getDownloadsByVideoId(videoId: string): Promise<Download[]> {
  return new Promise((resolve, reject) => {
    try {
      const downloads = db.prepare('SELECT * FROM downloads WHERE video_id = ? ORDER BY created_at DESC').all(videoId);
      resolve(downloads);
    } catch (error) {
      logger.error(`Failed to get downloads for video ${videoId}`, { error });
      reject(error);
    }
  });
}

/**
 * Delete a download by ID
 */
export function deleteDownload(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
      logger.debug(`Deleted download ${id}`);
      resolve();
    } catch (error) {
      logger.error(`Failed to delete download ${id}`, { error });
      reject(error);
    }
  });
}

/**
 * Clear all download history
 */
export function clearDownloadHistory(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.prepare('DELETE FROM downloads WHERE status IN ("completed", "failed", "cancelled")').run();
      logger.info('Cleared download history');
      resolve();
    } catch (error) {
      logger.error('Failed to clear download history', { error });
      reject(error);
    }
  });
} 