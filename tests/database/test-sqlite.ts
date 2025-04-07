/**
 * This script tests the SQLite database directly without Electron
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

// Test database path
const dbPath = path.join(process.cwd(), 'test-database.db');

// Ensure the database directory exists
fs.ensureDirSync(path.dirname(dbPath));

// Remove test database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

console.log(`=== Testing SQLite Database at ${dbPath} ===`);

try {
  // Create/open database
  const db = new Database(dbPath, { verbose: console.log });
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  console.log('Database initialized successfully');
  
  // Create tables
  console.log('\nCreating tables...');
  
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
      id TEXT PRIMARY KEY,
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
  
  console.log('Tables created successfully');
  
  // Test inserting a playlist
  console.log('\nInserting test playlist...');
  
  const playlistId = uuidv4();
  const currentDate = new Date().toISOString();
  
  const insertPlaylist = db.prepare(`
    INSERT INTO playlists (id, name, description, thumbnail, source, sourceUrl, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertPlaylist.run(
    playlistId,
    'Test Playlist',
    'A test playlist',
    null,
    'local',
    null,
    currentDate,
    currentDate
  );
  
  console.log(`Playlist inserted with ID: ${playlistId}`);
  
  // Test inserting videos
  console.log('\nInserting test videos...');
  
  const insertVideo = db.prepare(`
    INSERT INTO videos (
      id, playlistId, title, url, thumbnail, duration, fileSize,
      downloaded, downloadPath, format, addedAt, status, downloadStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const videoId1 = uuidv4();
  insertVideo.run(
    videoId1,
    playlistId,
    'Test Video 1',
    'https://example.com/video1',
    null,
    120,
    null,
    0,
    null,
    null,
    currentDate,
    'available',
    null
  );
  
  const videoId2 = uuidv4();
  insertVideo.run(
    videoId2,
    playlistId,
    'Test Video 2',
    'https://example.com/video2',
    null,
    240,
    1024 * 1024 * 10, // 10MB
    1,
    '/path/to/video.mp4',
    'mp4',
    currentDate,
    'available',
    'completed'
  );
  
  console.log(`Videos inserted with IDs: ${videoId1}, ${videoId2}`);
  
  // Test retrieving playlist
  console.log('\nRetrieving playlist...');
  
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId);
  console.log('Playlist:', playlist);
  
  // Test retrieving videos
  console.log('\nRetrieving videos...');
  
  const videos = db.prepare('SELECT * FROM videos WHERE playlistId = ?').all(playlistId);
  console.log(`Found ${videos.length} videos:`);
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title} (${video.downloaded ? 'Downloaded' : 'Not Downloaded'})`);
  });
  
  // Test updating a video
  console.log('\nUpdating a video...');
  
  const updateVideo = db.prepare(`
    UPDATE videos SET title = ?, downloaded = ?, fileSize = ? WHERE id = ?
  `);
  
  updateVideo.run('Updated Video Title', 1, 1024 * 1024 * 20, videoId1);
  
  const updatedVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId1);
  console.log('Updated video:', updatedVideo);
  
  // Test deleting a video
  console.log('\nDeleting a video...');
  
  const deleteVideo = db.prepare('DELETE FROM videos WHERE id = ?');
  const result = deleteVideo.run(videoId2);
  
  console.log(`Deleted ${result.changes} video(s)`);
  
  // Test retrieving videos after deletion
  const remainingVideos = db.prepare('SELECT * FROM videos WHERE playlistId = ?').all(playlistId);
  console.log(`Remaining videos: ${remainingVideos.length}`);
  
  // Test deleting the playlist
  console.log('\nDeleting the playlist...');
  
  const deletePlaylist = db.prepare('DELETE FROM playlists WHERE id = ?');
  const playlistResult = deletePlaylist.run(playlistId);
  
  console.log(`Deleted ${playlistResult.changes} playlist(s)`);
  
  // Close the database
  db.close();
  
  console.log('\n=== SQLite Test Completed Successfully ===');
  
  // Clean up the test database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`Test database removed: ${dbPath}`);
  }
  
  process.exit(0);
} catch (error) {
  console.error('Test failed:', error);
  
  // Clean up the test database
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log(`Test database removed: ${dbPath}`);
    } catch (e) {
      console.error('Failed to remove test database:', e);
    }
  }
  
  process.exit(1);
}
