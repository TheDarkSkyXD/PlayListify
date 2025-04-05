import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { getSetting } from '../services/settingsManager';
import { format } from 'date-fns';

/**
 * Create a backup of the playlists directory before migration
 */
export async function backupPlaylistsDirectory(): Promise<string> {
  try {
    // Get the playlists directory
    const playlistsDir = getSetting('playlistLocation');
    
    // Create a backup directory with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backupDir = path.join(
      app.getPath('userData'),
      'backups',
      `playlists_backup_${timestamp}`
    );
    
    // Ensure the backup directory exists
    await fs.ensureDir(backupDir);
    
    // Copy all files from the playlists directory to the backup directory
    console.log(`Creating backup of playlists directory at ${backupDir}...`);
    await fs.copy(playlistsDir, backupDir);
    
    console.log(`Backup created successfully at ${backupDir}`);
    return backupDir;
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Run this function before migration to create a backup
 */
export async function backupBeforeMigration(): Promise<string> {
  try {
    // Wait for app to be ready
    if (!app.isReady()) {
      await new Promise<void>((resolve) => {
        app.on('ready', () => resolve());
      });
    }
    
    // Create backup
    const backupDir = await backupPlaylistsDirectory();
    
    return backupDir;
  } catch (error: any) {
    console.error('Backup failed:', error);
    throw error;
  }
}

// Run the backup if this script is executed directly
if (require.main === module) {
  backupBeforeMigration()
    .then((backupDir) => {
      console.log(`Backup completed at: ${backupDir}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}
