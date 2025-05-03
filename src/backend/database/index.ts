// import Database from 'better-sqlite3';
import Database from './sqlite-adapter';
// import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';
import logger from '../services/logService';

// Database version for migrations
const DB_VERSION = 1;

// Flag to track shutdown status
let isShuttingDown = false;

// Define database file path with production safeguards
const getDbPath = () => {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'playlistify.db');
    
    // Ensure the directory exists
    fs.ensureDirSync(path.dirname(dbPath));
    
    // Log path for debugging
    logger.info(`Database path resolved to: ${dbPath}`);
    
    return dbPath;
  } catch (error) {
    // Fallback to a safer path if there's an error
    logger.error('Error resolving database path:', error);
    const fallbackPath = path.join(process.env.NODE_ENV === 'development' 
      ? process.cwd() 
      : path.dirname(app.getAppPath()), 
      'playlistify.db');
    
    logger.info(`Using fallback database path: ${fallbackPath}`);
    return fallbackPath;
  }
};

// Define type for app_meta row
interface AppMetaRow {
  key: string;
  value: string;
}

// SQL Schema - embedded to avoid file access issues with webpack
const SCHEMA_SQL = `
-- PlayListify Database Schema
-- Version 1.0

-- Application metadata for version tracking and settings
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT, -- 'youtube', 'custom', etc.
  source_id TEXT, -- YouTube playlist ID or other external identifier
  thumbnail TEXT, -- URL or path to thumbnail image
  created_at INTEGER NOT NULL, -- Unix timestamp
  updated_at INTEGER NOT NULL, -- Unix timestamp
  video_count INTEGER DEFAULT 0, -- Cache of video count for performance
  duration_seconds INTEGER DEFAULT 0 -- Cache of total duration for performance
);

-- Videos table (all known videos, not necessarily in a playlist)
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT UNIQUE NOT NULL, -- YouTube video ID or other external identifier
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  thumbnail TEXT, -- URL or path to thumbnail image
  author TEXT, -- Channel or creator name
  author_id TEXT, -- Channel ID or creator identifier
  published_at INTEGER, -- Unix timestamp
  view_count INTEGER,
  created_at INTEGER NOT NULL, -- Unix timestamp (when added to our DB)
  updated_at INTEGER NOT NULL, -- Unix timestamp (when info last updated)
  file_path TEXT, -- Local file path if downloaded
  file_format TEXT, -- mp4, mp3, etc.
  file_size_bytes INTEGER, -- Size of downloaded file
  download_status TEXT -- 'pending', 'downloading', 'complete', 'error', etc.
);

-- PlaylistVideos join table (maps videos to playlists with order)
CREATE TABLE IF NOT EXISTS playlist_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  position INTEGER NOT NULL, -- Order within playlist
  added_at INTEGER NOT NULL, -- Unix timestamp
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, video_id) -- Prevent duplicates in the same playlist
);

-- History table for tracking video views and play position
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  playlist_id INTEGER, -- Optional, as a video might be played outside a playlist
  position_seconds REAL DEFAULT 0, -- Last playback position
  completed BOOLEAN DEFAULT 0, -- Whether the video was watched to completion
  played_at INTEGER NOT NULL, -- Unix timestamp when played
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
);

-- Downloads table for tracking download history and status
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  format TEXT NOT NULL, -- mp4, mp3, etc.
  quality TEXT, -- 360p, 720p, etc.
  size_bytes INTEGER,
  started_at INTEGER NOT NULL, -- Unix timestamp
  completed_at INTEGER, -- Unix timestamp
  status TEXT NOT NULL, -- 'pending', 'downloading', 'complete', 'error', etc.
  progress REAL DEFAULT 0, -- 0-100
  error_message TEXT, -- Error message if status is 'error'
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Tags table for organizing playlists
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT, -- Optional color hex code
  created_at INTEGER NOT NULL -- Unix timestamp
);

-- PlaylistTags join table
CREATE TABLE IF NOT EXISTS playlist_tags (
  playlist_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, tag_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_history_video_id ON history(video_id);
CREATE INDEX IF NOT EXISTS idx_history_played_at ON history(played_at);
CREATE INDEX IF NOT EXISTS idx_downloads_video_id ON downloads(video_id);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
`;

// Initialize database connection
export const initDatabase = async (): Promise<Database> => {
  try {
    // Ensure the directory exists
    const dbPath = getDbPath();
    fs.ensureDirSync(path.dirname(dbPath));
    logger.info(`Using database at ${dbPath}`);

    // Create or open the database
    const db = new Database(dbPath);
    
    // Enable foreign keys
    await db.pragma('foreign_keys = ON');
    logger.info('Foreign key constraints enabled');
    
    // Check if this is a new database (needs initialization)
    try {
      const tableExists = await db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_meta'")
        .get();
      
      if (!tableExists) {
        logger.info('Initializing new database with schema');
        // Initialize new database with schema
        await initializeSchema(db);
        
        // Save the current version
        await db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('version', DB_VERSION.toString());
        logger.info(`Database initialized at version ${DB_VERSION}`);
      } else {
        // Check version and run migrations if needed
        try {
          const versionRow = await db.prepare("SELECT value FROM app_meta WHERE key='version'").get() as AppMetaRow | undefined;
          const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;
          
          if (currentVersion < DB_VERSION) {
            logger.info(`Migrating database from version ${currentVersion} to ${DB_VERSION}`);
            // Run migrations
            await runMigrations(db, currentVersion, DB_VERSION);
            logger.info(`Database migrated to version ${DB_VERSION}`);
          } else {
            logger.info(`Database already at version ${currentVersion}, no migration needed`);
          }
        } catch (error) {
          logger.error('Error checking database version:', error);
          // If we can't read the version, re-initialize the schema
          logger.info('Attempting to repair database schema...');
          await initializeSchema(db);
        }
      }
      
      // Verify tables exist
      await verifyDatabaseTables(db);
      
      return db;
    } catch (error) {
      logger.error('Error during database initialization check:', error);
      // Try to initialize the schema anyway as a recovery step
      await initializeSchema(db);
      await verifyDatabaseTables(db);
      return db;
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Initialize schema for a new database
const initializeSchema = async (db: Database): Promise<void> => {
  try {
    // Use embedded schema instead of reading from file
    await db.exec(SCHEMA_SQL);
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema:', error);
    throw error;
  }
};

// Run migrations to update database schema when needed
const runMigrations = async (db: Database, fromVersion: number, toVersion: number): Promise<void> => {
  try {
    // Execute schema SQL (safe because of IF NOT EXISTS)
    await db.exec(SCHEMA_SQL);
    
    // Update the stored version
    await db.prepare("UPDATE app_meta SET value = ? WHERE key = 'version'").run(toVersion.toString());
    logger.info(`Database migrated from version ${fromVersion} to ${toVersion}`);
  } catch (error) {
    logger.error(`Failed to migrate database from version ${fromVersion} to ${toVersion}:`, error);
    throw error;
  }
};

// Verify all required tables exist in the database
const verifyDatabaseTables = async (db: Database): Promise<void> => {
  const requiredTables = [
    'app_meta',
    'playlists',
    'videos',
    'playlist_videos',
    'history',
    'downloads',
    'tags',
    'playlist_tags'
  ];
  
  let missingTables = false;
  
  for (const table of requiredTables) {
    try {
      const tableExists = await db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(table);
      
      if (!tableExists) {
        logger.error(`Required table '${table}' not found in database`);
        missingTables = true;
      } else {
        logger.debug(`Verified table '${table}' exists`);
      }
    } catch (error) {
      logger.error(`Error checking for table '${table}':`, error);
      missingTables = true;
    }
  }
  
  // If any tables are missing, try to repair the database
  if (missingTables) {
    logger.info('Attempting to repair database schema due to missing tables...');
    await initializeSchema(db);
    
    // Verify tables again after repair
    for (const table of requiredTables) {
      try {
        const tableExistsAfterRepair = await db
          .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
          .get(table);
        
        if (!tableExistsAfterRepair) {
          throw new Error(`Failed to create required table '${table}' during repair`);
        } else {
          logger.info(`Table '${table}' created successfully during repair`);
        }
      } catch (error) {
        logger.error(`Error verifying table '${table}' after repair:`, error);
        throw error;
      }
    }
  }
  
  logger.info('All required database tables verified');
};

// Export a singleton instance
export const getDatabase = (() => {
  let db: Database | null = null;
  
  return async (): Promise<Database> => {
    if (!db) {
      db = await initDatabase();
    }
    return db;
  };
})();

// Clean shutdown function to ensure database is properly closed
export const closeDatabase = async (): Promise<void> => {
  if (isShuttingDown) {
    logger.debug('Database already in shutdown process, ignoring additional close request');
    return;
  }
  
  isShuttingDown = true;
  
  try {
    const db = await getDatabase();
    logger.info('Closing database connection...');
    
    // Add a small delay to allow any in-flight queries to complete
    await new Promise(resolve => setTimeout(resolve, 100)); 
    
    await db.close();
    logger.info('Database closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
  // Do not reset isShuttingDown after completion - we're shutting down the app
  // so we don't need to accept any more database operations
};

// Set up app lifecycle handlers for clean shutdown
if (app) {
  // Disable the automatic app lifecycle handler since we're handling it in main/index.ts
  // This prevents multiple close attempts when the app is shutting down
  
  // DO NOT register will-quit handlers here - they're handled in main/index.ts
} 