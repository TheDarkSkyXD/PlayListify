#!/usr/bin/env node

/**
 * This script updates the database schema to use a composite primary key for videos
 * It works with any Node.js version and doesn't require native module compilation
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const readline = require('readline');

// Check if better-sqlite3 is available
let Database;
try {
  Database = require('better-sqlite3');
  console.log('Using better-sqlite3 module');
} catch (error) {
  console.log('better-sqlite3 module not available, using fallback method');
  Database = null;
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Get database path
function getDatabasePath() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, use the database in the project's database folder
    return path.join(process.cwd(), 'database', 'playlistify.db');
  } else {
    // In production, use the database in the user's data directory
    const userDataPath = process.env.APPDATA ||
      (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
    return path.join(userDataPath, 'playlistify', 'playlists', 'playlistify.db');
  }
}

/**
 * Update database schema using better-sqlite3
 */
async function updateSchemaWithSqlite3(dbPath) {
  console.log('Updating schema using better-sqlite3...');

  // Open the database
  const db = new Database(dbPath);

  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();

  try {
    // Check if videos table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='videos'").get();

    if (!tableExists) {
      console.log('Videos table does not exist. No changes needed.');
      db.prepare('COMMIT').run();
      return true;
    }

    console.log('Updating videos table schema...');

    // Get all videos
    const videos = db.prepare('SELECT * FROM videos').all();
    console.log(`Found ${videos.length} videos`);

    // Create a temporary table with the new schema
    db.exec(`
      CREATE TABLE videos_new (
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

    // Copy data to the new table
    const insertStmt = db.prepare(`
      INSERT INTO videos_new (
        id, playlistId, title, url, thumbnail, duration, fileSize,
        downloaded, downloadPath, format, addedAt, status, downloadStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Track duplicates
    const seen = new Set();
    let duplicates = 0;

    // Insert each video, skipping duplicates
    for (const video of videos) {
      const key = `${video.id}-${video.playlistId}`;

      if (seen.has(key)) {
        console.log(`Skipping duplicate: ${key}`);
        duplicates++;
        continue;
      }

      seen.add(key);

      try {
        insertStmt.run(
          video.id,
          video.playlistId,
          video.title,
          video.url,
          video.thumbnail,
          video.duration,
          video.fileSize,
          video.downloaded,
          video.downloadPath,
          video.format,
          video.addedAt,
          video.status,
          video.downloadStatus
        );
      } catch (err) {
        console.error(`Error inserting video ${video.id} for playlist ${video.playlistId}:`, err.message);
      }
    }

    // Drop the old table and rename the new one
    db.exec('DROP TABLE videos');
    db.exec('ALTER TABLE videos_new RENAME TO videos');

    // Create an index for faster lookups
    db.exec('CREATE INDEX IF NOT EXISTS idx_videos_playlist ON videos(playlistId)');

    // Commit the transaction
    db.prepare('COMMIT').run();

    console.log(`Schema update completed successfully`);
    console.log(`Processed ${videos.length} videos`);
    console.log(`Skipped ${duplicates} duplicates`);

    // Close the database
    db.close();

    return true;
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Error updating schema:', error);

    // Close the database
    db.close();
    return false;
  }
}

/**
 * Update database schema using SQLite CLI
 * This is a fallback method when better-sqlite3 is not available
 */
async function updateSchemaWithSQLiteCLI(dbPath) {
  console.log('Updating schema using SQLite CLI...');

  try {
    // Create a temporary SQL file
    const sqlFilePath = path.join(path.dirname(dbPath), 'update_schema.sql');

    // Write the SQL commands to the file
    fs.writeFileSync(sqlFilePath, `
      -- Begin transaction
      BEGIN TRANSACTION;

      -- Check if videos table exists
      SELECT name FROM sqlite_master WHERE type='table' AND name='videos';

      -- Create a temporary table with the new schema
      CREATE TABLE videos_new (
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

      -- Copy data to the new table
      INSERT INTO videos_new
      SELECT id, playlistId, title, url, thumbnail, duration, fileSize,
             downloaded, downloadPath, format, addedAt, status, downloadStatus
      FROM videos
      GROUP BY id, playlistId;

      -- Drop the old table and rename the new one
      DROP TABLE videos;
      ALTER TABLE videos_new RENAME TO videos;

      -- Create an index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_videos_playlist ON videos(playlistId);

      -- Commit the transaction
      COMMIT;
    `);

    // Execute the SQL file using sqlite3 CLI
    console.log('Executing SQL commands...');
    execSync(`sqlite3 "${dbPath}" < "${sqlFilePath}"`, { stdio: 'inherit' });

    // Remove the temporary SQL file
    fs.unlinkSync(sqlFilePath);

    console.log('Schema update completed successfully');
    return true;
  } catch (error) {
    console.error('Error updating schema with SQLite CLI:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const dbPath = getDatabasePath();

    if (!fs.existsSync(dbPath)) {
      console.error(`Database file not found at ${dbPath}`);
      rl.close();
      return;
    }

    console.log(`Found database at ${dbPath}`);

    // Create a backup before making changes
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${dbPath}.backup-${timestamp}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Created backup at ${backupPath}`);

    // Confirm before proceeding
    const confirmed = await confirm('This will update the database schema. Continue?');
    if (!confirmed) {
      console.log('Operation cancelled');
      rl.close();
      return;
    }

    // Update the schema using the appropriate method
    let success = false;
    if (Database) {
      success = await updateSchemaWithSqlite3(dbPath);
    } else {
      success = await updateSchemaWithSQLiteCLI(dbPath);
    }

    if (success) {
      console.log('Database schema updated successfully');
    } else {
      console.error('Failed to update database schema');
    }

    rl.close();
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

// Run the main function
main();
