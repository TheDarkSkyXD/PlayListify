import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { getSetting, setSetting } from './settingsManager';
import * as migrationUtils from '../utils/migrationUtils';
import * as dbManager from './databaseManager';
import { getDatabasePath } from '../database/config';

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  // Check if migration has already been performed
  const migrationCompleted = getSetting('migrationCompleted');
  if (migrationCompleted) {
    return false;
  }
  
  // Check if there are playlists to migrate
  const playlistsDir = getSetting('playlistLocation');
  if (!fs.existsSync(playlistsDir)) {
    // No playlists directory, no migration needed
    setSetting('migrationCompleted', true);
    return false;
  }
  
  // Check if there are playlist directories
  const playlistDirs = fs.readdirSync(playlistsDir)
    .filter(dir => fs.statSync(path.join(playlistsDir, dir)).isDirectory())
    .filter(dir => dir.includes('-')); // Playlist directories have format: id-name
  
  if (playlistDirs.length === 0) {
    // No playlists to migrate
    setSetting('migrationCompleted', true);
    return false;
  }
  
  return true;
}

/**
 * Run the migration process
 */
export async function runMigration(): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}> {
  console.log('Starting migration to SQLite...');
  
  try {
    // Create a backup before migration
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const playlistsDir = getSetting('playlistLocation');
    const backupDir = path.join(
      app.getPath('userData'),
      'backups',
      `playlists_backup_${timestamp}`
    );
    
    console.log(`Creating backup at ${backupDir}...`);
    await fs.ensureDir(backupDir);
    await fs.copy(playlistsDir, backupDir);
    console.log('Backup created successfully.');
    
    // Initialize the database
    dbManager.initDatabase();
    console.log('Database initialized');
    
    // Migrate all playlists
    const result = await migrationUtils.migrateAllPlaylists();
    
    console.log('Migration completed with the following results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Playlists migrated: ${result.migrated}`);
    console.log(`- Playlists failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Mark migration as completed
    setSetting('migrationCompleted', true);
    
    return result;
  } catch (error: any) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [error.message]
    };
  }
}

/**
 * Check if the database exists
 */
export function databaseExists(): boolean {
  const dbPath = getDatabasePath();
  return fs.existsSync(dbPath);
}

/**
 * Initialize the database and run migration if needed
 */
export async function initializeDatabaseAndMigrate(): Promise<void> {
  try {
    // Initialize the database
    dbManager.initDatabase();
    
    // Check if migration is needed
    if (isMigrationNeeded()) {
      console.log('Migration needed, running migration...');
      await runMigration();
    } else {
      console.log('No migration needed.');
    }
  } catch (error: any) {
    console.error('Failed to initialize database or run migration:', error);
  }
}
