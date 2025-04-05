import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { getDatabasePath, getDatabaseDir, backupDatabase, restoreDatabase, listDatabaseBackups } from '../database/config';
import { runDatabaseOptimization } from '../services/databaseManager';
import { getDatabaseStats, checkDatabaseIntegrity } from '../database/optimize';

/**
 * Register IPC handlers for database operations
 */
export function registerDatabaseHandlers(): void {
  // Get database information
  ipcMain.handle('database:getInfo', async () => {
    try {
      const dbPath = getDatabasePath();
      const dbDir = getDatabaseDir();
      const stats = fs.statSync(dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      // Get database statistics
      const dbStats = getDatabaseStats();
      
      // Check database integrity
      const integrity = checkDatabaseIntegrity();
      
      return {
        success: true,
        path: dbPath,
        directory: dbDir,
        size: {
          bytes: stats.size,
          megabytes: sizeInMB
        },
        stats: dbStats,
        integrity
      };
    } catch (error) {
      console.error('Failed to get database info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Create a database backup
  ipcMain.handle('database:backup', async () => {
    try {
      const backupPath = backupDatabase();
      
      // Get backup file size
      const stats = fs.statSync(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      return {
        success: true,
        path: backupPath,
        size: {
          bytes: stats.size,
          megabytes: sizeInMB
        }
      };
    } catch (error) {
      console.error('Failed to create database backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Restore a database backup
  ipcMain.handle('database:restore', async (_, backupPath) => {
    try {
      const restoredPath = restoreDatabase(backupPath);
      
      return {
        success: true,
        path: restoredPath
      };
    } catch (error) {
      console.error('Failed to restore database backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // List database backups
  ipcMain.handle('database:listBackups', async () => {
    try {
      const backupPaths = listDatabaseBackups();
      
      // Get backup information
      const backups = backupPaths.map(backupPath => {
        const stats = fs.statSync(backupPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        // Extract date from filename
        const filename = path.basename(backupPath);
        const match = filename.match(/playlistify_backup_(.+)\.db/);
        let dateStr = match ? match[1].replace(/-/g, ':').replace(/_/g, ' ') : '';
        
        // Try to parse the date
        let date;
        try {
          date = new Date(dateStr).toLocaleString();
        } catch (e) {
          date = dateStr;
        }
        
        return {
          path: backupPath,
          filename,
          date,
          size: `${sizeInMB} MB`,
          bytes: stats.size
        };
      });
      
      // Sort backups by date (newest first)
      backups.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      return {
        success: true,
        backups
      };
    } catch (error) {
      console.error('Failed to list database backups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Optimize database
  ipcMain.handle('database:optimize', async () => {
    try {
      const success = runDatabaseOptimization();
      
      return {
        success
      };
    } catch (error) {
      console.error('Failed to optimize database:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Restart the application
  ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.exit();
  });
}
