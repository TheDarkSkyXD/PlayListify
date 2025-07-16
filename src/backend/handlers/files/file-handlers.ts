import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import { createIPCHandler } from '../index';
import { FileSystemService } from '../../services/file-system-service';

// Initialize file system service
const fileSystemService = new FileSystemService();

export function registerFileHandlers(): void {
  // Check if file exists
  ipcMain.handle('fs:exists', createIPCHandler(async (filePath: string) => {
    return await fileSystemService.exists(filePath);
  }));

  // Read JSON file
  ipcMain.handle('fs:readJson', createIPCHandler(async (filePath: string) => {
    return await fileSystemService.readJson(filePath);
  }));

  // Write JSON file
  ipcMain.handle('fs:writeJson', createIPCHandler(async (filePath: string, data: any) => {
    await fileSystemService.writeJson(filePath, data);
    return { success: true };
  }));

  // Read text file
  ipcMain.handle('fs:readText', createIPCHandler(async (filePath: string, encoding?: BufferEncoding) => {
    return await fileSystemService.readFile(filePath, encoding);
  }));

  // Write text file
  ipcMain.handle('fs:writeText', createIPCHandler(async (filePath: string, content: string, encoding?: BufferEncoding) => {
    await fileSystemService.writeFile(filePath, content, encoding);
    return { success: true };
  }));

  // Delete file
  ipcMain.handle('fs:delete', createIPCHandler(async (filePath: string) => {
    await fileSystemService.deleteFile(filePath);
    return { success: true };
  }));

  // Copy file
  ipcMain.handle('fs:copy', createIPCHandler(async (src: string, dest: string) => {
    await fileSystemService.copyFile(src, dest);
    return { success: true };
  }));

  // Move file
  ipcMain.handle('fs:move', createIPCHandler(async (src: string, dest: string) => {
    await fileSystemService.moveFile(src, dest);
    return { success: true };
  }));

  // Get file stats
  ipcMain.handle('fs:getStats', createIPCHandler(async (filePath: string) => {
    const stats = await fileSystemService.getStats(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile,
      isDirectory: stats.isDirectory,
      mtime: stats.modifiedAt,
      ctime: stats.createdAt,
      atime: stats.accessedAt
    };
  }));

  // List files in directory (using listDirectory method)
  ipcMain.handle('fs:listFiles', createIPCHandler(async (dirPath: string) => {
    const dirStructure = await fileSystemService.listDirectory(dirPath);
    return dirStructure.files;
  }));

  // List directories (using listDirectory method)
  ipcMain.handle('fs:listDirectories', createIPCHandler(async (dirPath: string) => {
    const dirStructure = await fileSystemService.listDirectory(dirPath);
    return dirStructure.directories;
  }));

  // Ensure directory exists
  ipcMain.handle('fs:ensureDirectory', createIPCHandler(async (dirPath: string) => {
    await fileSystemService.ensureDirectory(dirPath);
    return { success: true };
  }));

  // Get file size
  ipcMain.handle('fs:getSize', createIPCHandler(async (filePath: string) => {
    return await fileSystemService.getSize(filePath);
  }));

  // Format file size (utility method - implement inline)
  ipcMain.handle('fs:formatSize', createIPCHandler(async (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }));

  // Sanitize filename (using sanitizePath method)
  ipcMain.handle('fs:sanitizeFilename', createIPCHandler(async (filename: string) => {
    return fileSystemService.sanitizePath(filename);
  }));

  // Create unique filename (implement inline)
  ipcMain.handle('fs:createUniqueFilename', createIPCHandler(async (filePath: string) => {
    let counter = 1;
    let uniquePath = filePath;
    
    while (await fileSystemService.exists(uniquePath)) {
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      uniquePath = path.join(dir, `${base}_${counter}${ext}`);
      counter++;
    }
    
    return uniquePath;
  }));

  // Get application paths
  ipcMain.handle('fs:getAppPaths', createIPCHandler(async () => {
    return fileSystemService.getAppDirectories();
  }));

  // Initialize directories
  ipcMain.handle('fs:initializeDirectories', createIPCHandler(async () => {
    await fileSystemService.initializeAppDirectories();
    return { success: true };
  }));

  // Cleanup temp files
  ipcMain.handle('fs:cleanupTempFiles', createIPCHandler(async () => {
    await fileSystemService.cleanupTempFiles();
    return { success: true };
  }));

  // Select directory dialog
  ipcMain.handle('fs:selectDirectory', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow || new BrowserWindow(), {
      properties: ['openDirectory'],
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  }));

  console.log('✅ File system IPC handlers registered');
};