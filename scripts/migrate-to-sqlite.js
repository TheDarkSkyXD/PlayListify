#!/usr/bin/env node

/**
 * This script migrates playlists and videos from the file system to SQLite database
 */

const electron = require('electron');
const path = require('path');
const fs = require('fs-extra');
const readline = require('readline');
const Database = require('better-sqlite3');

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

// Main migration function
async function runMigration() {
  try {
    console.log('=== PlayListify SQLite Migration Tool ===');
    console.log('This tool will migrate your playlists and videos from the file system to a SQLite database.');
    console.log('A backup will be created before migration.');
    console.log('');

    // Ask for confirmation
    const confirmed = await confirm('Do you want to proceed with the migration?');

    if (!confirmed) {
      console.log('Migration cancelled.');
      rl.close();
      process.exit(0);
      return;
    }

    console.log('\nStarting migration to SQLite...');

    // Create a simple migration function
    async function migrateToSqlite() {
      console.log('Starting migration to SQLite...');

      // Get user settings
      const userDataPath = process.env.APPDATA ||
        (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
      const settingsPath = path.join(userDataPath, 'playlistify', 'settings.json');

      if (!fs.existsSync(settingsPath)) {
        throw new Error(`Settings file not found at ${settingsPath}`);
      }

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const playlistsDir = settings.playlistLocation || path.join(userDataPath, 'playlistify', 'playlists');

      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(userDataPath, 'playlistify', 'backups', `playlists_backup_${timestamp}`);

      console.log(`Creating backup at ${backupDir}...`);
      await fs.ensureDir(backupDir);
      await fs.copy(playlistsDir, backupDir);
      console.log('Backup created successfully.');

      // Get database path from environment variable or use default
      const dbDir = process.env.PLAYLISTIFY_DB_DIR || path.join(process.cwd(), 'database');
      const dbPath = path.join(dbDir, 'playlistify.db');
      console.log(`Initializing database at ${dbPath}...`);

      // Ensure database directory exists
      fs.ensureDirSync(dbDir);

      // Check if database exists and delete it if it does
      if (fs.existsSync(dbPath)) {
        console.log('Database already exists. Removing it...');
        fs.unlinkSync(dbPath);

        // Also remove the WAL and SHM files if they exist
        const walPath = `${dbPath}-wal`;
        const shmPath = `${dbPath}-shm`;
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
      }

      const db = new Database(dbPath, { verbose: console.log });
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('foreign_keys = ON');

      // Create tables
      console.log('Creating database tables...');

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

      console.log('Tables created successfully.');

      // Migrate playlists
      console.log('\nMigrating playlists...');

      // Get all playlist directories
      const playlistDirs = fs.readdirSync(playlistsDir)
        .filter(dir => fs.statSync(path.join(playlistsDir, dir)).isDirectory())
        .filter(dir => dir.includes('-')); // Playlist directories have format: id-name

      console.log(`Found ${playlistDirs.length} playlist directories.`);

      let migratedCount = 0;
      let failedCount = 0;

      for (const dir of playlistDirs) {
        try {
          const playlistId = dir.split('-')[0];
          const metadataPath = path.join(playlistsDir, dir, 'metadata', 'playlist-info.json');

          if (!fs.existsSync(metadataPath)) {
            console.log(`Skipping ${dir}: No metadata found.`);
            continue;
          }

          const playlistData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

          // Insert playlist
          const insertPlaylist = db.prepare(`
            INSERT INTO playlists (id, name, description, thumbnail, source, sourceUrl, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          insertPlaylist.run(
            playlistData.id,
            playlistData.name,
            playlistData.description || null,
            playlistData.thumbnail || null,
            playlistData.source || 'local',
            playlistData.sourceUrl || null,
            playlistData.createdAt || new Date().toISOString(),
            playlistData.updatedAt || new Date().toISOString()
          );

          // Insert videos
          if (playlistData.videos && playlistData.videos.length > 0) {
            const insertVideo = db.prepare(`
              INSERT INTO videos (
                id, playlistId, title, url, thumbnail, duration, fileSize,
                downloaded, downloadPath, format, addedAt, status, downloadStatus
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const video of playlistData.videos) {
              insertVideo.run(
                video.id,
                playlistData.id, // Use the ID from the playlist data, not from the directory
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
            }
          }

          console.log(`Migrated playlist: ${playlistData.name} (${playlistId}) with ${playlistData.videos?.length || 0} videos.`);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate playlist ${dir}:`, error);
          failedCount++;
        }
      }

      // Close the database
      db.close();

      console.log('\nMigration summary:');
      console.log(`- Playlists migrated: ${migratedCount}`);
      console.log(`- Playlists failed: ${failedCount}`);

      // Update settings to enable SQLite
      settings.useSqliteDatabase = true;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('\nSettings updated to use SQLite database.');

      return { success: true, migratedCount, failedCount };
    }

    // Run the migration
    await migrateToSqlite();

    console.log('\nMigration completed successfully.');
    console.log('You can now restart the application to use the SQLite database.');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the migration
runMigration();
