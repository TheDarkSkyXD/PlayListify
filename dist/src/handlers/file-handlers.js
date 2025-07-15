"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = void 0;
const electron_1 = require("electron");
const fileUtils_1 = require("../utils/fileUtils");
const registerFileHandlers = () => {
    // Check if file exists
    electron_1.ipcMain.handle('file:exists', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const exists = await fileUtils_1.FileUtils.exists(filePath);
            return { success: true, data: exists };
        }
        catch (error) {
            console.error('File exists error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Read JSON file
    electron_1.ipcMain.handle('file:readJson', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const data = await fileUtils_1.FileUtils.readJson(filePath);
            return { success: true, data };
        }
        catch (error) {
            console.error('File readJson error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Write JSON file
    electron_1.ipcMain.handle('file:writeJson', async (event, filePath, data) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath)) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.writeJson(filePath, data);
            return { success: true };
        }
        catch (error) {
            console.error('File writeJson error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Read text file
    electron_1.ipcMain.handle('file:readText', async (event, filePath, encoding = 'utf-8') => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const content = await fileUtils_1.FileUtils.readText(filePath, encoding);
            return { success: true, data: content };
        }
        catch (error) {
            console.error('File readText error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Write text file
    electron_1.ipcMain.handle('file:writeText', async (event, filePath, content, encoding = 'utf-8') => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath)) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.writeText(filePath, content, encoding);
            return { success: true };
        }
        catch (error) {
            console.error('File writeText error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Delete file
    electron_1.ipcMain.handle('file:delete', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.deleteFile(filePath);
            return { success: true };
        }
        catch (error) {
            console.error('File delete error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Copy file
    electron_1.ipcMain.handle('file:copy', async (event, src, dest) => {
        try {
            // Validate paths for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if ((!fileUtils_1.FileUtils.validatePath(src, appDataPath) && !fileUtils_1.FileUtils.validatePath(src, downloadsPath)) ||
                (!fileUtils_1.FileUtils.validatePath(dest, appDataPath) && !fileUtils_1.FileUtils.validatePath(dest, downloadsPath))) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.copyFile(src, dest);
            return { success: true };
        }
        catch (error) {
            console.error('File copy error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Move file
    electron_1.ipcMain.handle('file:move', async (event, src, dest) => {
        try {
            // Validate paths for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if ((!fileUtils_1.FileUtils.validatePath(src, appDataPath) && !fileUtils_1.FileUtils.validatePath(src, downloadsPath)) ||
                (!fileUtils_1.FileUtils.validatePath(dest, appDataPath) && !fileUtils_1.FileUtils.validatePath(dest, downloadsPath))) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.moveFile(src, dest);
            return { success: true };
        }
        catch (error) {
            console.error('File move error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get file stats
    electron_1.ipcMain.handle('file:getStats', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const stats = await fileUtils_1.FileUtils.getStats(filePath);
            return { success: true, data: {
                    size: stats.size,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    mtime: stats.mtime,
                    ctime: stats.ctime,
                    atime: stats.atime
                } };
        }
        catch (error) {
            console.error('File getStats error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // List files in directory
    electron_1.ipcMain.handle('file:listFiles', async (event, dirPath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(dirPath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(dirPath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const files = await fileUtils_1.FileUtils.listFiles(dirPath);
            return { success: true, data: files };
        }
        catch (error) {
            console.error('File listFiles error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // List directories
    electron_1.ipcMain.handle('file:listDirectories', async (event, dirPath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(dirPath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(dirPath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const directories = await fileUtils_1.FileUtils.listDirectories(dirPath);
            return { success: true, data: directories };
        }
        catch (error) {
            console.error('File listDirectories error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Ensure directory exists
    electron_1.ipcMain.handle('file:ensureDirectory', async (event, dirPath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(dirPath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(dirPath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            await fileUtils_1.FileUtils.ensureDirectory(dirPath);
            return { success: true };
        }
        catch (error) {
            console.error('File ensureDirectory error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get file size
    electron_1.ipcMain.handle('file:getSize', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const size = await fileUtils_1.FileUtils.getFileSize(filePath);
            return { success: true, data: size };
        }
        catch (error) {
            console.error('File getSize error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Format file size
    electron_1.ipcMain.handle('file:formatSize', async (event, bytes) => {
        try {
            const formatted = fileUtils_1.FileUtils.formatFileSize(bytes);
            return { success: true, data: formatted };
        }
        catch (error) {
            console.error('File formatSize error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Sanitize filename
    electron_1.ipcMain.handle('file:sanitizeFilename', async (event, filename) => {
        try {
            const sanitized = fileUtils_1.FileUtils.sanitizeFilename(filename);
            return { success: true, data: sanitized };
        }
        catch (error) {
            console.error('File sanitizeFilename error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Create unique filename
    electron_1.ipcMain.handle('file:createUniqueFilename', async (event, filePath) => {
        try {
            // Validate path for security
            const appDataPath = fileUtils_1.FileUtils.getAppDataPath();
            const downloadsPath = fileUtils_1.FileUtils.getDownloadsPath();
            if (!fileUtils_1.FileUtils.validatePath(filePath, appDataPath) &&
                !fileUtils_1.FileUtils.validatePath(filePath, downloadsPath)) {
                throw new Error('Path validation failed - access denied');
            }
            const uniqueName = await fileUtils_1.FileUtils.createUniqueFilename(filePath);
            return { success: true, data: uniqueName };
        }
        catch (error) {
            console.error('File createUniqueFilename error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get application paths
    electron_1.ipcMain.handle('file:getAppPaths', async (event) => {
        try {
            const paths = {
                appData: fileUtils_1.FileUtils.getAppDataPath(),
                downloads: fileUtils_1.FileUtils.getDownloadsPath(),
                logs: fileUtils_1.FileUtils.getLogsPath(),
                binaries: fileUtils_1.FileUtils.getBinariesPath(),
                cache: fileUtils_1.FileUtils.getCachePath(),
            };
            return { success: true, data: paths };
        }
        catch (error) {
            console.error('File getAppPaths error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Initialize directories
    electron_1.ipcMain.handle('file:initializeDirectories', async (event) => {
        try {
            await fileUtils_1.FileUtils.initializeDirectories();
            return { success: true };
        }
        catch (error) {
            console.error('File initializeDirectories error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Cleanup temp files
    electron_1.ipcMain.handle('file:cleanupTempFiles', async (event) => {
        try {
            await fileUtils_1.FileUtils.cleanupTempFiles();
            return { success: true };
        }
        catch (error) {
            console.error('File cleanupTempFiles error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    console.log('File IPC handlers registered');
};
exports.registerFileHandlers = registerFileHandlers;
//# sourceMappingURL=file-handlers.js.map