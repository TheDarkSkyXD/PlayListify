"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSystemService = exports.FileSystemService = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const electron_1 = require("electron");
const settings_types_1 = require("../../shared/types/settings-types");
// Simple console logger fallback
const consoleLogger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
};
class FileSystemService {
    constructor(logger) {
        this.logger = logger || consoleLogger;
        this.appDirectories = this.initializeAppDirectoriesPaths();
        this.logger.info('FileSystemService initialized successfully', {
            appDirectories: this.appDirectories,
        });
    }
    /**
     * Check if a file or directory exists
     */
    async exists(filePath) {
        try {
            const validation = this.validatePath(filePath);
            if (!validation.isValid) {
                this.logger.warn(`Path validation failed for exists check: ${filePath}`, {
                    errors: validation.errors,
                });
                return false;
            }
            await fs.access(validation.sanitizedPath);
            this.logger.debug(`Path exists: ${filePath}`);
            return true;
        }
        catch (error) {
            this.logger.debug(`Path does not exist: ${filePath}`);
            return false;
        }
    }
    /**
     * Read a file with optional encoding
     */
    async readFile(filePath, encoding) {
        try {
            const validation = this.validatePath(filePath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid path for read operation: ${validation.errors.join(', ')}`, 'INVALID_PATH', filePath, { errors: validation.errors });
            }
            const content = encoding
                ? await fs.readFile(validation.sanitizedPath, encoding)
                : await fs.readFile(validation.sanitizedPath);
            this.logger.debug(`File read successfully: ${filePath}`, {
                size: Buffer.isBuffer(content) ? content.length : content.length,
                encoding,
            });
            return content;
        }
        catch (error) {
            this.logger.error(`Failed to read file: ${filePath}`, { error, encoding });
            throw new settings_types_1.FileSystemError(`Failed to read file: ${filePath}`, 'READ_ERROR', filePath, error);
        }
    }
    /**
     * Write content to a file
     */
    async writeFile(filePath, content, encoding) {
        try {
            const validation = this.validatePath(filePath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid path for write operation: ${validation.errors.join(', ')}`, 'INVALID_PATH', filePath, { errors: validation.errors });
            }
            // Ensure parent directory exists
            const parentDir = path.dirname(validation.sanitizedPath);
            await this.ensureDirectory(parentDir);
            // Write the file
            if (encoding && typeof content === 'string') {
                await fs.writeFile(validation.sanitizedPath, content, encoding);
            }
            else {
                await fs.writeFile(validation.sanitizedPath, content);
            }
            this.logger.info(`File written successfully: ${filePath}`, {
                size: Buffer.isBuffer(content) ? content.length : content.length,
                encoding,
            });
        }
        catch (error) {
            this.logger.error(`Failed to write file: ${filePath}`, { error, encoding });
            throw new settings_types_1.FileSystemError(`Failed to write file: ${filePath}`, 'WRITE_ERROR', filePath, error);
        }
    }
    /**
     * Delete a file
     */
    async deleteFile(filePath) {
        try {
            const validation = this.validatePath(filePath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid path for delete operation: ${validation.errors.join(', ')}`, 'INVALID_PATH', filePath, { errors: validation.errors });
            }
            if (!(await this.exists(validation.sanitizedPath))) {
                this.logger.warn(`Attempted to delete non-existent file: ${filePath}`);
                return;
            }
            await fs.remove(validation.sanitizedPath);
            this.logger.info(`File deleted successfully: ${filePath}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete file: ${filePath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to delete file: ${filePath}`, 'DELETE_ERROR', filePath, error);
        }
    }
    /**
     * Copy a file from source to destination
     */
    async copyFile(source, destination) {
        try {
            const sourceValidation = this.validatePath(source);
            const destValidation = this.validatePath(destination);
            if (!sourceValidation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid source path: ${sourceValidation.errors.join(', ')}`, 'INVALID_SOURCE_PATH', source, { errors: sourceValidation.errors });
            }
            if (!destValidation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid destination path: ${destValidation.errors.join(', ')}`, 'INVALID_DEST_PATH', destination, { errors: destValidation.errors });
            }
            // Ensure destination directory exists
            const destDir = path.dirname(destValidation.sanitizedPath);
            await this.ensureDirectory(destDir);
            await fs.copy(sourceValidation.sanitizedPath, destValidation.sanitizedPath);
            this.logger.info(`File copied successfully: ${source} -> ${destination}`);
        }
        catch (error) {
            this.logger.error(`Failed to copy file: ${source} -> ${destination}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to copy file: ${source} -> ${destination}`, 'COPY_ERROR', source, error);
        }
    }
    /**
     * Move a file from source to destination
     */
    async moveFile(source, destination) {
        try {
            const sourceValidation = this.validatePath(source);
            const destValidation = this.validatePath(destination);
            if (!sourceValidation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid source path: ${sourceValidation.errors.join(', ')}`, 'INVALID_SOURCE_PATH', source, { errors: sourceValidation.errors });
            }
            if (!destValidation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid destination path: ${destValidation.errors.join(', ')}`, 'INVALID_DEST_PATH', destination, { errors: destValidation.errors });
            }
            // Ensure destination directory exists
            const destDir = path.dirname(destValidation.sanitizedPath);
            await this.ensureDirectory(destDir);
            await fs.move(sourceValidation.sanitizedPath, destValidation.sanitizedPath);
            this.logger.info(`File moved successfully: ${source} -> ${destination}`);
        }
        catch (error) {
            this.logger.error(`Failed to move file: ${source} -> ${destination}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to move file: ${source} -> ${destination}`, 'MOVE_ERROR', source, error);
        }
    }
    /**
     * Ensure a directory exists, creating it if necessary
     */
    async ensureDirectory(dirPath) {
        try {
            const validation = this.validatePath(dirPath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid directory path: ${validation.errors.join(', ')}`, 'INVALID_PATH', dirPath, { errors: validation.errors });
            }
            await fs.ensureDir(validation.sanitizedPath);
            this.logger.debug(`Directory ensured: ${dirPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to ensure directory: ${dirPath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to ensure directory: ${dirPath}`, 'ENSURE_DIR_ERROR', dirPath, error);
        }
    }
    /**
     * List directory contents with detailed information
     */
    async listDirectory(dirPath) {
        try {
            const validation = this.validatePath(dirPath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid directory path: ${validation.errors.join(', ')}`, 'INVALID_PATH', dirPath, { errors: validation.errors });
            }
            const exists = await this.exists(validation.sanitizedPath);
            if (!exists) {
                return {
                    path: dirPath,
                    exists: false,
                    files: [],
                    directories: [],
                    totalItems: 0,
                };
            }
            const items = await fs.readdir(validation.sanitizedPath);
            const files = [];
            const directories = [];
            for (const item of items) {
                const itemPath = path.join(validation.sanitizedPath, item);
                const stats = await fs.stat(itemPath);
                if (stats.isFile()) {
                    files.push(item);
                }
                else if (stats.isDirectory()) {
                    directories.push(item);
                }
            }
            const result = {
                path: dirPath,
                exists: true,
                files,
                directories,
                totalItems: files.length + directories.length,
            };
            this.logger.debug(`Directory listed: ${dirPath}`, {
                fileCount: files.length,
                dirCount: directories.length,
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to list directory: ${dirPath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to list directory: ${dirPath}`, 'LIST_DIR_ERROR', dirPath, error);
        }
    }
    /**
     * Delete a directory and all its contents
     */
    async deleteDirectory(dirPath) {
        try {
            const validation = this.validatePath(dirPath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid directory path: ${validation.errors.join(', ')}`, 'INVALID_PATH', dirPath, { errors: validation.errors });
            }
            if (!(await this.exists(validation.sanitizedPath))) {
                this.logger.warn(`Attempted to delete non-existent directory: ${dirPath}`);
                return;
            }
            await fs.remove(validation.sanitizedPath);
            this.logger.info(`Directory deleted successfully: ${dirPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete directory: ${dirPath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to delete directory: ${dirPath}`, 'DELETE_DIR_ERROR', dirPath, error);
        }
    }
    /**
     * Read a JSON file with type safety
     */
    async readJson(filePath) {
        try {
            const content = await this.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            this.logger.debug(`JSON file read successfully: ${filePath}`);
            return data;
        }
        catch (error) {
            this.logger.error(`Failed to read JSON file: ${filePath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to read JSON file: ${filePath}`, 'READ_JSON_ERROR', filePath, error);
        }
    }
    /**
     * Write data to a JSON file with formatting
     */
    async writeJson(filePath, data) {
        try {
            const content = JSON.stringify(data, null, 2);
            await this.writeFile(filePath, content, 'utf8');
            this.logger.debug(`JSON file written successfully: ${filePath}`);
        }
        catch (error) {
            this.logger.error(`Failed to write JSON file: ${filePath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to write JSON file: ${filePath}`, 'WRITE_JSON_ERROR', filePath, error);
        }
    }
    /**
     * Validate and sanitize a file path
     */
    validatePath(inputPath, basePath) {
        const result = {
            isValid: true,
            isSecure: true,
            sanitizedPath: inputPath,
            errors: [],
        };
        try {
            // Basic validation
            if (!inputPath || typeof inputPath !== 'string') {
                result.isValid = false;
                result.errors.push('Path must be a non-empty string');
                return result;
            }
            // Sanitize the path
            result.sanitizedPath = this.sanitizePath(inputPath);
            // Check for directory traversal attempts
            if (inputPath.includes('..') || inputPath.includes('~')) {
                result.isSecure = false;
                result.errors.push('Path contains potentially unsafe characters');
            }
            // Validate against base path if provided
            if (basePath) {
                const resolvedPath = path.resolve(basePath, result.sanitizedPath);
                const resolvedBasePath = path.resolve(basePath);
                if (!resolvedPath.startsWith(resolvedBasePath)) {
                    result.isValid = false;
                    result.isSecure = false;
                    result.errors.push('Path attempts to escape base directory');
                }
            }
            // Check for invalid characters (Windows-specific)
            const invalidChars = /[<>:"|?*]/;
            if (invalidChars.test(path.basename(result.sanitizedPath))) {
                result.errors.push('Path contains invalid characters');
            }
            // Update validity based on security
            if (!result.isSecure) {
                result.isValid = false;
            }
        }
        catch (error) {
            result.isValid = false;
            result.isSecure = false;
            result.errors.push(`Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
    /**
     * Sanitize a path for safe file system operations
     */
    sanitizePath(inputPath) {
        if (!inputPath || typeof inputPath !== 'string') {
            return '';
        }
        // Normalize the path
        let sanitized = path.normalize(inputPath);
        // Remove or replace dangerous characters
        sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
        // Remove leading/trailing whitespace
        sanitized = sanitized.trim();
        // Handle multiple consecutive separators
        sanitized = sanitized.replace(/[/\\]+/g, path.sep);
        return sanitized;
    }
    /**
     * Resolve multiple path segments safely
     */
    resolvePath(...paths) {
        try {
            const resolved = path.resolve(...paths);
            return this.sanitizePath(resolved);
        }
        catch (error) {
            this.logger.error('Failed to resolve path', { paths, error });
            throw new settings_types_1.FileSystemError('Failed to resolve path', 'RESOLVE_PATH_ERROR', paths.join(' -> '), error);
        }
    }
    /**
     * Get detailed file/directory statistics
     */
    async getStats(filePath) {
        try {
            const validation = this.validatePath(filePath);
            if (!validation.isValid) {
                throw new settings_types_1.FileSystemError(`Invalid path for stats operation: ${validation.errors.join(', ')}`, 'INVALID_PATH', filePath, { errors: validation.errors });
            }
            const stats = await fs.stat(validation.sanitizedPath);
            const result = {
                size: stats.size,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                accessedAt: stats.atime,
            };
            this.logger.debug(`Stats retrieved for: ${filePath}`, result);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to get stats for: ${filePath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to get stats for: ${filePath}`, 'STATS_ERROR', filePath, error);
        }
    }
    /**
     * Get file size in bytes
     */
    async getSize(filePath) {
        try {
            const stats = await this.getStats(filePath);
            return stats.size;
        }
        catch (error) {
            this.logger.error(`Failed to get size for: ${filePath}`, { error });
            throw new settings_types_1.FileSystemError(`Failed to get size for: ${filePath}`, 'SIZE_ERROR', filePath, error);
        }
    }
    /**
     * Get application directory structure
     */
    getAppDirectories() {
        return { ...this.appDirectories };
    }
    /**
     * Initialize all application directories
     */
    async initializeAppDirectories() {
        try {
            const directories = Object.values(this.appDirectories);
            for (const dir of directories) {
                await this.ensureDirectory(dir);
            }
            this.logger.info('Application directories initialized successfully', {
                directories: this.appDirectories,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize application directories', { error });
            throw new settings_types_1.FileSystemError('Failed to initialize application directories', 'INIT_DIRS_ERROR', undefined, error);
        }
    }
    /**
     * Clean up temporary files
     */
    async cleanupTempFiles() {
        try {
            const tempDir = this.appDirectories.temp;
            if (await this.exists(tempDir)) {
                // Remove all contents but keep the directory
                const contents = await this.listDirectory(tempDir);
                for (const file of contents.files) {
                    await this.deleteFile(path.join(tempDir, file));
                }
                for (const dir of contents.directories) {
                    await this.deleteDirectory(path.join(tempDir, dir));
                }
                this.logger.info('Temporary files cleaned up successfully', {
                    filesRemoved: contents.files.length,
                    dirsRemoved: contents.directories.length,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup temporary files', { error });
            // Don't throw here - cleanup failures shouldn't break the app
        }
    }
    /**
     * Clean up old log files
     */
    async cleanupOldLogs(maxAge) {
        try {
            const logsDir = this.appDirectories.logs;
            if (!(await this.exists(logsDir))) {
                return;
            }
            const contents = await this.listDirectory(logsDir);
            const cutoffDate = new Date(Date.now() - maxAge);
            let removedCount = 0;
            for (const file of contents.files) {
                const filePath = path.join(logsDir, file);
                const stats = await this.getStats(filePath);
                if (stats.modifiedAt < cutoffDate) {
                    await this.deleteFile(filePath);
                    removedCount++;
                }
            }
            this.logger.info('Old log files cleaned up successfully', {
                removedCount,
                maxAge,
            });
        }
        catch (error) {
            this.logger.error('Failed to cleanup old logs', { error, maxAge });
            // Don't throw here - cleanup failures shouldn't break the app
        }
    }
    /**
     * Initialize application directory paths
     */
    initializeAppDirectoriesPaths() {
        const userData = electron_1.app.getPath('userData');
        return {
            userData,
            downloads: path.join(electron_1.app.getPath('downloads'), 'Playlistify'),
            temp: path.join(userData, 'temp'),
            logs: path.join(userData, 'logs'),
            cache: path.join(userData, 'cache'),
            dependencies: path.join(userData, 'dependencies'),
            config: path.join(userData, 'config'),
        };
    }
}
exports.FileSystemService = FileSystemService;
// Export a singleton instance
exports.fileSystemService = new FileSystemService();
//# sourceMappingURL=file-system-service.js.map