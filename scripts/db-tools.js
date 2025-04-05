#!/usr/bin/env node

/**
 * Database management tools for development
 * 
 * Usage:
 *   npm run db:info - Show database information
 *   npm run db:backup - Create a database backup
 *   npm run db:restore <backup-file> - Restore a database backup
 *   npm run db:clear - Clear the database (delete all data)
 *   npm run db:reset - Reset the database (delete and recreate)
 */

const path = require('path');
const fs = require('fs-extra');
const Database = require('better-sqlite3');
const readline = require('readline');

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
  const dbDir = process.env.PLAYLISTIFY_DB_DIR || path.join(process.cwd(), 'database');
  return path.join(dbDir, 'playlistify.db');
}

// Get database directory
function getDatabaseDir() {
  return path.dirname(getDatabasePath());
}

// Create a backup of the database
async function backupDatabase(suffix) {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at ${dbPath}`);
    return null;
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

// Restore a database backup
async function restoreDatabase(backupPath) {
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}`);
    return false;
  }
  
  const dbPath = getDatabasePath();
  
  // Create a backup of the current database before restoring
  if (fs.existsSync(dbPath)) {
    await backupDatabase('before_restore');
  }
  
  // Copy the backup file to the database path
  fs.copyFileSync(backupPath, dbPath);
  
  console.log(`Database restored from ${backupPath}`);
  return true;
}

// List all database backups
function listDatabaseBackups() {
  const backupsDir = path.join(getDatabaseDir(), 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.db'))
    .map(file => path.join(backupsDir, file));
}

// Clear the database (delete all data)
async function clearDatabase() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at ${dbPath}`);
    return false;
  }
  
  // Create a backup before clearing
  await backupDatabase('before_clear');
  
  try {
    // Open the database
    const db = new Database(dbPath);
    
    // Get all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    // Disable foreign keys temporarily
    db.pragma('foreign_keys = OFF');
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Delete data from all tables
      for (const table of tables) {
        db.prepare(`DELETE FROM ${table.name}`).run();
        console.log(`Cleared table: ${table.name}`);
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      console.log('Database cleared successfully');
      return true;
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      console.error('Failed to clear database:', error);
      return false;
    } finally {
      // Re-enable foreign keys
      db.pragma('foreign_keys = ON');
      
      // Close the database
      db.close();
    }
  } catch (error) {
    console.error('Failed to open database:', error);
    return false;
  }
}

// Reset the database (delete and recreate)
async function resetDatabase() {
  const dbPath = getDatabasePath();
  
  // Create a backup before resetting
  if (fs.existsSync(dbPath)) {
    await backupDatabase('before_reset');
  }
  
  // Delete the database file
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    
    // Also remove the WAL and SHM files if they exist
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    
    console.log('Database files deleted');
  }
  
  console.log('Database reset complete');
  return true;
}

// Show database information
async function showDatabaseInfo() {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.log(`Database file not found at ${dbPath}`);
    return;
  }
  
  try {
    // Open the database
    const db = new Database(dbPath);
    
    // Get database file size
    const stats = fs.statSync(dbPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('=== Database Information ===');
    console.log(`Path: ${dbPath}`);
    console.log(`Size: ${fileSizeMB} MB`);
    
    // Get journal mode
    const journalMode = db.pragma('journal_mode', { simple: true });
    console.log(`Journal Mode: ${journalMode}`);
    
    // Get synchronous mode
    const synchronous = db.pragma('synchronous', { simple: true });
    console.log(`Synchronous Mode: ${synchronous}`);
    
    // Get foreign keys status
    const foreignKeys = db.pragma('foreign_keys', { simple: true });
    console.log(`Foreign Keys: ${foreignKeys ? 'ON' : 'OFF'}`);
    
    // Get all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    console.log('\n=== Tables ===');
    
    // Get row counts for each table
    for (const table of tables) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
      console.log(`${table.name}: ${count} rows`);
      
      // Get table schema
      const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
      console.log('  Columns:');
      schema.forEach(col => {
        console.log(`    ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
      });
      
      console.log('');
    }
    
    // Get all indexes
    const indexes = db.prepare(`
      SELECT name, tbl_name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    console.log('=== Indexes ===');
    for (const index of indexes) {
      console.log(`${index.name} (on ${index.tbl_name})`);
    }
    
    // Close the database
    db.close();
  } catch (error) {
    console.error('Failed to get database information:', error);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('Please specify a command:');
    console.log('  info - Show database information');
    console.log('  backup - Create a database backup');
    console.log('  restore <backup-file> - Restore a database backup');
    console.log('  clear - Clear the database (delete all data)');
    console.log('  reset - Reset the database (delete and recreate)');
    rl.close();
    return;
  }
  
  switch (command) {
    case 'info':
      await showDatabaseInfo();
      break;
      
    case 'backup':
      await backupDatabase();
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.log('Please specify a backup file to restore');
        
        // List available backups
        const backups = listDatabaseBackups();
        if (backups.length > 0) {
          console.log('\nAvailable backups:');
          backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${path.basename(backup)}`);
          });
        } else {
          console.log('\nNo backups found');
        }
      } else {
        const confirmed = await confirm(`Are you sure you want to restore the database from ${backupPath}?`);
        if (confirmed) {
          await restoreDatabase(backupPath);
        } else {
          console.log('Restore cancelled');
        }
      }
      break;
      
    case 'clear':
      const clearConfirmed = await confirm('Are you sure you want to clear all data from the database?');
      if (clearConfirmed) {
        await clearDatabase();
      } else {
        console.log('Clear cancelled');
      }
      break;
      
    case 'reset':
      const resetConfirmed = await confirm('Are you sure you want to reset the database? This will delete all data and recreate the database.');
      if (resetConfirmed) {
        await resetDatabase();
      } else {
        console.log('Reset cancelled');
      }
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      break;
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
