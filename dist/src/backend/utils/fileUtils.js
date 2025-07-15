"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const electron_1 = require("electron");
class FileUtils {
    /**
     * Check if a file exists
     */
    static async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Create a directory if it doesn't exist
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.ensureDir(dirPath);
        }
        catch (error) {
            throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Read a JSON file
     */
    static async readJson(filePath) {
        try {
            const data = await fs.readJson(filePath);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to read JSON file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Write a JSON file
     */
    static async writeJson(filePath, data, options) {
        try {
            await fs.writeJson(filePath, data, { spaces: 2, ...options });
        }
        catch (error) {
            throw new Error(`Failed to write JSON file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Read a text file
     */
    static async readText(filePath, encoding = 'utf-8') {
        try {
            return await fs.readFile(filePath, encoding);
        }
        catch (error) {
            throw new Error(`Failed to read text file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Write a text file
     */
    static async writeText(filePath, content, encoding = 'utf-8') {
        try {
            await fs.writeFile(filePath, content, encoding);
        }
        catch (error) {
            throw new Error(`Failed to write text file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a file
     */
    static async deleteFile(filePath) {
        try {
            await fs.remove(filePath);
        }
        catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Copy a file
     */
    static async copyFile(src, dest) {
        try {
            await fs.copy(src, dest);
        }
        catch (error) {
            throw new Error(`Failed to copy file from ${src} to ${dest}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Move a file
     */
    static async moveFile(src, dest) {
        try {
            await fs.move(src, dest);
        }
        catch (error) {
            throw new Error(`Failed to move file from ${src} to ${dest}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get file stats
     */
    static async getStats(filePath) {
        try {
            return await fs.stat(filePath);
        }
        catch (error) {
            throw new Error(`Failed to get stats for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * List files in a directory
     */
    static async listFiles(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            return files.filter(async (file) => {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                return stats.isFile();
            });
        }
        catch (error) {
            throw new Error(`Failed to list files in ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * List directories in a directory
     */
    static async listDirectories(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            const directories = [];
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    directories.push(file);
                }
            }
            return directories;
        }
        catch (error) {
            throw new Error(`Failed to list directories in ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate that a path is safe (no directory traversal)
     */
    static validatePath(inputPath, basePath) {
        try {
            const resolvedPath = path.resolve(basePath, inputPath);
            const resolvedBasePath = path.resolve(basePath);
            // Check if the resolved path is within the base path
            return resolvedPath.startsWith(resolvedBasePath);
        }
        catch {
            return false;
        }
    }
    /**
     * Get application data directory
     */
    static getAppDataPath() {
        return electron_1.app.getPath('userData');
    }
    /**
     * Get downloads directory
     */
    static getDownloadsPath() {
        return electron_1.app.getPath('downloads');
    }
    /**
     * Get application logs directory
     */
    static getLogsPath() {
        return path.join(this.getAppDataPath(), 'logs');
    }
    /**
     * Get application binaries directory
     */
    static getBinariesPath() {
        return path.join(this.getAppDataPath(), 'binaries');
    }
    /**
     * Get application cache directory
     */
    static getCachePath() {
        return path.join(this.getAppDataPath(), 'cache');
    }
    /**
     * Initialize all required directories
     */
    static async initializeDirectories() {
        const directories = [
            this.getAppDataPath(),
            this.getLogsPath(),
            this.getBinariesPath(),
            this.getCachePath(),
            path.join(this.getDownloadsPath(), 'PlayListify'),
        ];
        for (const dir of directories) {
            await this.ensureDirectory(dir);
        }
    }
    /**
     * Clean up temporary files
     */
    static async cleanupTempFiles() {
        const tempDir = path.join(this.getAppDataPath(), 'temp');
        if (await this.exists(tempDir)) {
            try {
                await fs.remove(tempDir);
                await this.ensureDirectory(tempDir);
            }
            catch (error) {
                console.error('Failed to cleanup temp files:', error);
            }
        }
    }
    /**
     * Get file size in bytes
     */
    static async getFileSize(filePath) {
        try {
            const stats = await this.getStats(filePath);
            return stats.size;
        }
        catch (error) {
            throw new Error(`Failed to get file size for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    /**
     * Get file extension
     */
    static getFileExtension(filePath) {
        return path.extname(filePath).toLowerCase();
    }
    /**
     * Get filename without extension
     */
    static getFileNameWithoutExtension(filePath) {
        return path.basename(filePath, path.extname(filePath));
    }
    /**
     * Sanitize filename for safe file system operations
     */
    static sanitizeFilename(filename) {
        // Replace invalid characters with underscores
        return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
    }
    /**
     * Create a unique filename if file already exists
     */
    static async createUniqueFilename(filePath) {
        if (!(await this.exists(filePath))) {
            return filePath;
        }
        const dir = path.dirname(filePath);
        const name = this.getFileNameWithoutExtension(filePath);
        const ext = this.getFileExtension(filePath);
        let counter = 1;
        let newFilePath;
        do {
            newFilePath = path.join(dir, `${name}_${counter}${ext}`);
            counter++;
        } while (await this.exists(newFilePath));
        return newFilePath;
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=fileUtils.js.map