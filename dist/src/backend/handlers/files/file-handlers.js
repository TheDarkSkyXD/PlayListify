"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = registerFileHandlers;
const tslib_1 = require("tslib");
const electron_1 = require("electron");
const path = tslib_1.__importStar(require("path"));
const index_1 = require("../index");
const file_system_service_1 = require("../../services/file-system-service");
// Initialize file system service
const fileSystemService = new file_system_service_1.FileSystemService();
function registerFileHandlers() {
    // Check if file exists
    electron_1.ipcMain.handle('fs:exists', (0, index_1.createIPCHandler)(async (filePath) => {
        return await fileSystemService.exists(filePath);
    }));
    // Read JSON file
    electron_1.ipcMain.handle('fs:readJson', (0, index_1.createIPCHandler)(async (filePath) => {
        return await fileSystemService.readJson(filePath);
    }));
    // Write JSON file
    electron_1.ipcMain.handle('fs:writeJson', (0, index_1.createIPCHandler)(async (filePath, data) => {
        await fileSystemService.writeJson(filePath, data);
        return { success: true };
    }));
    // Read text file
    electron_1.ipcMain.handle('fs:readText', (0, index_1.createIPCHandler)(async (filePath, encoding) => {
        return await fileSystemService.readFile(filePath, encoding);
    }));
    // Write text file
    electron_1.ipcMain.handle('fs:writeText', (0, index_1.createIPCHandler)(async (filePath, content, encoding) => {
        await fileSystemService.writeFile(filePath, content, encoding);
        return { success: true };
    }));
    // Delete file
    electron_1.ipcMain.handle('fs:delete', (0, index_1.createIPCHandler)(async (filePath) => {
        await fileSystemService.deleteFile(filePath);
        return { success: true };
    }));
    // Copy file
    electron_1.ipcMain.handle('fs:copy', (0, index_1.createIPCHandler)(async (src, dest) => {
        await fileSystemService.copyFile(src, dest);
        return { success: true };
    }));
    // Move file
    electron_1.ipcMain.handle('fs:move', (0, index_1.createIPCHandler)(async (src, dest) => {
        await fileSystemService.moveFile(src, dest);
        return { success: true };
    }));
    // Get file stats
    electron_1.ipcMain.handle('fs:getStats', (0, index_1.createIPCHandler)(async (filePath) => {
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
    electron_1.ipcMain.handle('fs:listFiles', (0, index_1.createIPCHandler)(async (dirPath) => {
        const dirStructure = await fileSystemService.listDirectory(dirPath);
        return dirStructure.files;
    }));
    // List directories (using listDirectory method)
    electron_1.ipcMain.handle('fs:listDirectories', (0, index_1.createIPCHandler)(async (dirPath) => {
        const dirStructure = await fileSystemService.listDirectory(dirPath);
        return dirStructure.directories;
    }));
    // Ensure directory exists
    electron_1.ipcMain.handle('fs:ensureDirectory', (0, index_1.createIPCHandler)(async (dirPath) => {
        await fileSystemService.ensureDirectory(dirPath);
        return { success: true };
    }));
    // Get file size
    electron_1.ipcMain.handle('fs:getSize', (0, index_1.createIPCHandler)(async (filePath) => {
        return await fileSystemService.getSize(filePath);
    }));
    // Format file size (utility method - implement inline)
    electron_1.ipcMain.handle('fs:formatSize', (0, index_1.createIPCHandler)(async (bytes) => {
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
    electron_1.ipcMain.handle('fs:sanitizeFilename', (0, index_1.createIPCHandler)(async (filename) => {
        return fileSystemService.sanitizePath(filename);
    }));
    // Create unique filename (implement inline)
    electron_1.ipcMain.handle('fs:createUniqueFilename', (0, index_1.createIPCHandler)(async (filePath) => {
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
    electron_1.ipcMain.handle('fs:getAppPaths', (0, index_1.createIPCHandler)(async () => {
        return fileSystemService.getAppDirectories();
    }));
    // Initialize directories
    electron_1.ipcMain.handle('fs:initializeDirectories', (0, index_1.createIPCHandler)(async () => {
        await fileSystemService.initializeAppDirectories();
        return { success: true };
    }));
    // Cleanup temp files
    electron_1.ipcMain.handle('fs:cleanupTempFiles', (0, index_1.createIPCHandler)(async () => {
        await fileSystemService.cleanupTempFiles();
        return { success: true };
    }));
    // Select directory dialog
    electron_1.ipcMain.handle('fs:selectDirectory', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = await electron_1.dialog.showOpenDialog(focusedWindow || new electron_1.BrowserWindow(), {
            properties: ['openDirectory'],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    }));
    console.log('✅ File system IPC handlers registered');
}
;
//# sourceMappingURL=file-handlers.js.map