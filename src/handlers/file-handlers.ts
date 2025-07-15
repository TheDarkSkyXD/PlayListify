import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { FileUtils } from '../utils/fileUtils';
import * as path from 'path';

export const registerFileHandlers = (): void => {
  // Check if file exists
  ipcMain.handle('file:exists', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const exists = await FileUtils.exists(filePath);
      return { success: true, data: exists };
    } catch (error) {
      console.error('File exists error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Read JSON file
  ipcMain.handle('file:readJson', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      if (!FileUtils.validatePath(filePath, appDataPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const data = await FileUtils.readJson(filePath);
      return { success: true, data };
    } catch (error) {
      console.error('File readJson error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Write JSON file
  ipcMain.handle('file:writeJson', async (event: IpcMainInvokeEvent, filePath: string, data: any) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      if (!FileUtils.validatePath(filePath, appDataPath)) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.writeJson(filePath, data);
      return { success: true };
    } catch (error) {
      console.error('File writeJson error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Read text file
  ipcMain.handle('file:readText', async (event: IpcMainInvokeEvent, filePath: string, encoding: BufferEncoding = 'utf-8') => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const content = await FileUtils.readText(filePath, encoding);
      return { success: true, data: content };
    } catch (error) {
      console.error('File readText error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Write text file
  ipcMain.handle('file:writeText', async (event: IpcMainInvokeEvent, filePath: string, content: string, encoding: BufferEncoding = 'utf-8') => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      if (!FileUtils.validatePath(filePath, appDataPath)) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.writeText(filePath, content, encoding);
      return { success: true };
    } catch (error) {
      console.error('File writeText error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Delete file
  ipcMain.handle('file:delete', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.deleteFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('File delete error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Copy file
  ipcMain.handle('file:copy', async (event: IpcMainInvokeEvent, src: string, dest: string) => {
    try {
      // Validate paths for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if ((!FileUtils.validatePath(src, appDataPath) && !FileUtils.validatePath(src, downloadsPath)) ||
          (!FileUtils.validatePath(dest, appDataPath) && !FileUtils.validatePath(dest, downloadsPath))) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.copyFile(src, dest);
      return { success: true };
    } catch (error) {
      console.error('File copy error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Move file
  ipcMain.handle('file:move', async (event: IpcMainInvokeEvent, src: string, dest: string) => {
    try {
      // Validate paths for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if ((!FileUtils.validatePath(src, appDataPath) && !FileUtils.validatePath(src, downloadsPath)) ||
          (!FileUtils.validatePath(dest, appDataPath) && !FileUtils.validatePath(dest, downloadsPath))) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.moveFile(src, dest);
      return { success: true };
    } catch (error) {
      console.error('File move error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get file stats
  ipcMain.handle('file:getStats', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const stats = await FileUtils.getStats(filePath);
      return { success: true, data: {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: stats.mtime,
        ctime: stats.ctime,
        atime: stats.atime
      }};
    } catch (error) {
      console.error('File getStats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // List files in directory
  ipcMain.handle('file:listFiles', async (event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(dirPath, appDataPath) && 
          !FileUtils.validatePath(dirPath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const files = await FileUtils.listFiles(dirPath);
      return { success: true, data: files };
    } catch (error) {
      console.error('File listFiles error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // List directories
  ipcMain.handle('file:listDirectories', async (event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(dirPath, appDataPath) && 
          !FileUtils.validatePath(dirPath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const directories = await FileUtils.listDirectories(dirPath);
      return { success: true, data: directories };
    } catch (error) {
      console.error('File listDirectories error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Ensure directory exists
  ipcMain.handle('file:ensureDirectory', async (event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(dirPath, appDataPath) && 
          !FileUtils.validatePath(dirPath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      await FileUtils.ensureDirectory(dirPath);
      return { success: true };
    } catch (error) {
      console.error('File ensureDirectory error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get file size
  ipcMain.handle('file:getSize', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const size = await FileUtils.getFileSize(filePath);
      return { success: true, data: size };
    } catch (error) {
      console.error('File getSize error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Format file size
  ipcMain.handle('file:formatSize', async (event: IpcMainInvokeEvent, bytes: number) => {
    try {
      const formatted = FileUtils.formatFileSize(bytes);
      return { success: true, data: formatted };
    } catch (error) {
      console.error('File formatSize error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Sanitize filename
  ipcMain.handle('file:sanitizeFilename', async (event: IpcMainInvokeEvent, filename: string) => {
    try {
      const sanitized = FileUtils.sanitizeFilename(filename);
      return { success: true, data: sanitized };
    } catch (error) {
      console.error('File sanitizeFilename error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Create unique filename
  ipcMain.handle('file:createUniqueFilename', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Validate path for security
      const appDataPath = FileUtils.getAppDataPath();
      const downloadsPath = FileUtils.getDownloadsPath();
      
      if (!FileUtils.validatePath(filePath, appDataPath) && 
          !FileUtils.validatePath(filePath, downloadsPath)) {
        throw new Error('Path validation failed - access denied');
      }

      const uniqueName = await FileUtils.createUniqueFilename(filePath);
      return { success: true, data: uniqueName };
    } catch (error) {
      console.error('File createUniqueFilename error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get application paths
  ipcMain.handle('file:getAppPaths', async (event: IpcMainInvokeEvent) => {
    try {
      const paths = {
        appData: FileUtils.getAppDataPath(),
        downloads: FileUtils.getDownloadsPath(),
        logs: FileUtils.getLogsPath(),
        binaries: FileUtils.getBinariesPath(),
        cache: FileUtils.getCachePath(),
      };
      return { success: true, data: paths };
    } catch (error) {
      console.error('File getAppPaths error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Initialize directories
  ipcMain.handle('file:initializeDirectories', async (event: IpcMainInvokeEvent) => {
    try {
      await FileUtils.initializeDirectories();
      return { success: true };
    } catch (error) {
      console.error('File initializeDirectories error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Cleanup temp files
  ipcMain.handle('file:cleanupTempFiles', async (event: IpcMainInvokeEvent) => {
    try {
      await FileUtils.cleanupTempFiles();
      return { success: true };
    } catch (error) {
      console.error('File cleanupTempFiles error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log('File IPC handlers registered');
};