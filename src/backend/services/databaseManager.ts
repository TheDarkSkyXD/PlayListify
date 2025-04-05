import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { Playlist, Video } from '../../shared/types/appTypes';
import { getSetting } from './settingsManager';
import { getDatabaseConfig } from '../database/config';
import { optimizeDatabase } from '../database/optimize';

// Database instance
let db: Database.Database | null = null;

/**
 * Initialize the database
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  try {
    // Get database path from configuration
    const dbConfig = getDatabaseConfig();
    const dbPath = dbConfig.path;

    // Ensure directory exists
    fs.ensureDirSync(path.dirname(dbPath));

    // Create/open database
    db = new Database(dbPath, { verbose: getSetting('debug') ? console.log : undefined });

    // Apply database configuration
    if (dbConfig.useWAL) {
      db.pragma(`journal_mode = ${dbConfig.journalMode}`);
    }

    // Set synchronous mode
    db.pragma(`synchronous = ${dbConfig.synchronous}`);

    // Enable foreign keys if configured
    if (dbConfig.foreignKeys) {
      db.pragma('foreign_keys = ON');
    }

    // Create tables if they don't exist
    createTables();

    console.log(`Database initialized at ${dbPath}`);

    return db;
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Create database tables if they don't exist
 */
function createTables(): void {
  if (!db) throw new Error('Database not initialized');

  // Create playlists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      source TEXT,
      sourceUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Create videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT NOT NULL,
      playlistId TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      duration INTEGER,
      fileSize INTEGER,
      downloaded BOOLEAN NOT NULL DEFAULT 0,
      downloadPath TEXT,
      format TEXT,
      addedAt TEXT NOT NULL,
      status TEXT,
      downloadStatus TEXT,
      PRIMARY KEY (id, playlistId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE
    );
  `);

  // Create tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // Create playlist_tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_tags (
      playlistId TEXT NOT NULL,
      tagId INTEGER NOT NULL,
      PRIMARY KEY (playlistId, tagId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_videos_playlistId ON videos(playlistId);
    CREATE INDEX IF NOT EXISTS idx_videos_downloaded ON videos(downloaded);
    CREATE INDEX IF NOT EXISTS idx_playlists_updatedAt ON playlists(updatedAt);
  `);
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Create a new playlist
 */
export function createPlaylist(playlist: Playlist): Playlist {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO playlists (id, name, description, thumbnail, source, sourceUrl, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    playlist.id,
    playlist.name,
    playlist.description || null,
    playlist.thumbnail || null,
    playlist.source || 'local',
    playlist.sourceUrl || null,
    playlist.createdAt,
    playlist.updatedAt
  );

  return playlist;
}

/**
 * Get a playlist by ID
 */
export function getPlaylistById(playlistId: string): Playlist | null {
  const db = getDatabase();

  // Get playlist
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId) as Playlist | undefined;

  if (!playlist) return null;

  // Get videos for this playlist
  const videos = db.prepare('SELECT * FROM videos WHERE playlistId = ?').all(playlistId) as Video[];

  // Get tags for this playlist
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN playlist_tags pt ON t.id = pt.tagId
    WHERE pt.playlistId = ?
  `).all(playlistId).map(row => (row as any).name) as string[];

  return {
    ...playlist,
    videos: videos || [],
    tags: tags || []
  };
}

/**
 * Get all playlists
 */
export function getAllPlaylists(): Playlist[] {
  const db = getDatabase();

  // Get all playlists
  const playlists = db.prepare('SELECT * FROM playlists').all() as Playlist[];

  // For each playlist, get its videos and tags
  return playlists.map(playlist => {
    // Get videos for this playlist
    const videos = db.prepare('SELECT * FROM videos WHERE playlistId = ?').all(playlist.id) as Video[];

    // Get tags for this playlist
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN playlist_tags pt ON t.id = pt.tagId
      WHERE pt.playlistId = ?
    `).all(playlist.id).map(row => (row as any).name) as string[];

    return {
      ...playlist,
      videos: videos || [],
      tags: tags || []
    };
  });
}

/**
 * Update a playlist
 */
export function updatePlaylist(playlistId: string, updates: Partial<Playlist>): Playlist | null {
  const db = getDatabase();

  // Start a transaction
  const updatePlaylist = db.transaction((playlistId: string, updates: Partial<Playlist>) => {
    // Update the updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Build the update query dynamically based on provided fields
    const fields = Object.keys(updates).filter(key =>
      key !== 'id' && key !== 'videos' && key !== 'tags'
    );

    if (fields.length === 0) return getPlaylistById(playlistId);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);

    // Update playlist
    db.prepare(`UPDATE playlists SET ${setClause} WHERE id = ?`).run(...values, playlistId);

    // Handle tags if provided
    if (updates.tags) {
      // Remove existing tags
      db.prepare('DELETE FROM playlist_tags WHERE playlistId = ?').run(playlistId);

      // Add new tags
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
      const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
      const linkTag = db.prepare('INSERT INTO playlist_tags (playlistId, tagId) VALUES (?, ?)');

      for (const tagName of updates.tags) {
        insertTag.run(tagName);
        const tagId = (getTagId.get(tagName) as any)?.id;
        if (tagId) {
          linkTag.run(playlistId, tagId);
        }
      }
    }

    return getPlaylistById(playlistId);
  });

  return updatePlaylist(playlistId, updates);
}

/**
 * Delete a playlist
 */
export function deletePlaylist(playlistId: string): boolean {
  const db = getDatabase();

  // Start a transaction
  const deletePlaylistTx = db.transaction((playlistId: string) => {
    // Delete playlist (cascade will delete videos and playlist_tags)
    const result = db.prepare('DELETE FROM playlists WHERE id = ?').run(playlistId);
    return result.changes > 0;
  });

  return deletePlaylistTx(playlistId);
}

/**
 * Add a video to a playlist
 */
export function addVideo(playlistId: string, video: Video): Video {
  const db = getDatabase();

  // Check if the video already exists in this playlist
  const existingVideo = db.prepare(
    'SELECT * FROM videos WHERE id = ? AND playlistId = ?'
  ).get(video.id, playlistId) as Video | undefined;

  if (existingVideo) {
    // Video already exists in this playlist, return it
    console.log(`Video ${video.id} (${video.title}) already exists in playlist ${playlistId}, skipping insert`);
    return existingVideo;
  }

  // Insert the video
  const stmt = db.prepare(`
    INSERT INTO videos (
      id, playlistId, title, url, thumbnail, duration, fileSize,
      downloaded, downloadPath, format, addedAt, status, downloadStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    video.id,
    playlistId,
    video.title,
    video.url,
    video.thumbnail || null,
    video.duration || null,
    video.fileSize || null,
    video.downloaded ? 1 : 0,
    video.downloadPath || null,
    video.format || null,
    video.addedAt || new Date().toISOString(),
    video.status || null,
    video.downloadStatus || null
  );

  // Update playlist updatedAt timestamp
  db.prepare('UPDATE playlists SET updatedAt = ? WHERE id = ?').run(
    new Date().toISOString(),
    playlistId
  );

  return video;
}

/**
 * Update a video
 */
export function updateVideo(videoId: string, updates: Partial<Video>): Video | null {
  const db = getDatabase();

  // Get the current video to find its playlist
  const currentVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId) as Video | undefined;
  if (!currentVideo) return null;

  const playlistId = currentVideo.playlistId;

  // Build the update query dynamically based on provided fields
  const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'playlistId');

  if (fields.length === 0) return currentVideo;

  const setClause = fields.map(field => {
    // Special handling for boolean fields
    if (field === 'downloaded') {
      return 'downloaded = ?';
    }
    return `${field} = ?`;
  }).join(', ');

  const values = fields.map(field => {
    // Convert boolean to integer for SQLite
    if (field === 'downloaded') {
      return (updates as any)[field] ? 1 : 0;
    }
    return (updates as any)[field];
  });

  // Update video - now using composite key
  db.prepare(`UPDATE videos SET ${setClause} WHERE id = ? AND playlistId = ?`)
    .run(...values, videoId, playlistId);

  // Update playlist updatedAt timestamp
  db.prepare('UPDATE playlists SET updatedAt = ? WHERE id = ?').run(
    new Date().toISOString(),
    playlistId
  );

  // Get updated video - now using composite key
  return db.prepare('SELECT * FROM videos WHERE id = ? AND playlistId = ?')
    .get(videoId, playlistId) as Video;
}

/**
 * Get a video by ID from a specific playlist
 */
export function getVideoById(videoId: string, playlistId: string): Video | null {
  const db = getDatabase();

  // Get the video using composite key
  const video = db.prepare('SELECT * FROM videos WHERE id = ? AND playlistId = ?')
    .get(videoId, playlistId) as Video | undefined;

  return video || null;
}

/**
 * Delete a video from a specific playlist
 */
export function deleteVideo(videoId: string, playlistId: string): boolean {
  const db = getDatabase();

  // Delete the video using composite key
  const result = db.prepare('DELETE FROM videos WHERE id = ? AND playlistId = ?')
    .run(videoId, playlistId);

  if (result.changes > 0) {
    // Update playlist updatedAt timestamp
    db.prepare('UPDATE playlists SET updatedAt = ? WHERE id = ?').run(
      new Date().toISOString(),
      playlistId
    );
    return true;
  }

  return false;
}

/**
 * Search for playlists
 */
export function searchPlaylists(query: string): Playlist[] {
  const db = getDatabase();

  const searchTerm = `%${query}%`;

  // Search playlists
  const playlists = db.prepare(`
    SELECT DISTINCT p.* FROM playlists p
    LEFT JOIN videos v ON p.id = v.playlistId
    LEFT JOIN playlist_tags pt ON p.id = pt.playlistId
    LEFT JOIN tags t ON pt.tagId = t.id
    WHERE
      p.name LIKE ? OR
      p.description LIKE ? OR
      v.title LIKE ? OR
      t.name LIKE ?
  `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Playlist[];

  // For each playlist, get its videos and tags
  return playlists.map(playlist => {
    // Get videos for this playlist
    const videos = db.prepare('SELECT * FROM videos WHERE playlistId = ?').all(playlist.id) as Video[];

    // Get tags for this playlist
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN playlist_tags pt ON t.id = pt.tagId
      WHERE pt.playlistId = ?
    `).all(playlist.id).map(row => (row as any).name) as string[];

    return {
      ...playlist,
      videos: videos || [],
      tags: tags || []
    };
  });
}

/**
 * Get statistics about the database
 */
export function getDatabaseStats(): {
  playlistCount: number;
  videoCount: number;
  downloadedVideoCount: number;
  totalVideoSize: number;
} {
  const db = getDatabase();

  const playlistCount = db.prepare('SELECT COUNT(*) as count FROM playlists').get() as { count: number };
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number };
  const downloadedVideoCount = db.prepare('SELECT COUNT(*) as count FROM videos WHERE downloaded = 1').get() as { count: number };
  const totalVideoSize = db.prepare('SELECT SUM(fileSize) as total FROM videos WHERE fileSize IS NOT NULL').get() as { total: number | null };

  return {
    playlistCount: playlistCount.count,
    videoCount: videoCount.count,
    downloadedVideoCount: downloadedVideoCount.count,
    totalVideoSize: totalVideoSize.total || 0
  };
}

/**
 * Run database optimization
 * This creates indexes and runs VACUUM to improve performance
 * @returns True if optimization was successful, false otherwise
 */
export function runDatabaseOptimization(): boolean {
  return optimizeDatabase();
}
