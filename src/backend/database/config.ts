import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getSetting } from '../services/settingsManager';

/**
 * Get the path to the database file
 * During development, this will be in the project's database folder
 * In production, it will be in the user's data directory
 */
export function getDatabasePath(): string {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // In development, store the database in the project's database folder
    const dbDir = path.join(process.cwd(), 'database');
    fs.ensureDirSync(dbDir);
    return path.join(dbDir, 'playlistify.db');
  } else {
    // In production, store the database in the user's data directory
    const playlistsDir = getSetting('playlistLocation');
    return path.join(playlistsDir, 'playlistify.db');
  }
}

/**
 * Get the path to the database directory
 */
export function getDatabaseDir(): string {
  const dbPath = getDatabasePath();
  return path.dirname(dbPath);
}

/**
 * Get the database configuration
 */
export function getDatabaseConfig() {
  return {
    path: getDatabasePath(),
    dir: getDatabaseDir(),
    // Add any other database configuration options here
    useWAL: true, // Use Write-Ahead Logging for better performance
    journalMode: 'WAL', // WAL, DELETE, TRUNCATE, PERSIST, MEMORY, OFF
    synchronous: 'NORMAL', // FULL, NORMAL, OFF
    foreignKeys: true, // Enable foreign key constraints
  };
}

/**
 * Create a backup of the database
 * @param suffix Optional suffix to add to the backup filename
 * @returns Path to the backup file
 */
export function backupDatabase(suffix?: string): string {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }
  
  // Create a timestamp for the backup filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = suffix 
    ? `playlistify_backup_${timestamp}_${suffix}.db` 
    : `playlistify_backup_${timestamp}.db`;
  
  // Create the backups directory if it doesn't exist
  const backupsDir = path.join(getDatabaseDir(), 'backups');
  fs.ensureDirSync(backupsDir);
  
  // Create the backup path
  const backupPath = path.join(backupsDir, backupName);
  
  // Copy the database file to the backup path
  fs.copyFileSync(dbPath, backupPath);
  
  console.log(`Database backed up to ${backupPath}`);
  return backupPath;
}

/**
 * Restore a database backup
 * @param backupPath Path to the backup file
 * @returns Path to the restored database file
 */
export function restoreDatabase(backupPath: string): string {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at ${backupPath}`);
  }
  
  const dbPath = getDatabasePath();
  
  // Create a backup of the current database before restoring
  if (fs.existsSync(dbPath)) {
    backupDatabase('before_restore');
  }
  
  // Copy the backup file to the database path
  fs.copyFileSync(backupPath, dbPath);
  
  console.log(`Database restored from ${backupPath}`);
  return dbPath;
}

/**
 * List all database backups
 * @returns Array of backup file paths
 */
export function listDatabaseBackups(): string[] {
  const backupsDir = path.join(getDatabaseDir(), 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.db'))
    .map(file => path.join(backupsDir, file));
}
