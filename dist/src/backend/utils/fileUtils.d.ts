import * as fs from 'fs-extra';
export declare class FileUtils {
    /**
     * Check if a file exists
     */
    static exists(filePath: string): Promise<boolean>;
    /**
     * Create a directory if it doesn't exist
     */
    static ensureDirectory(dirPath: string): Promise<void>;
    /**
     * Read a JSON file
     */
    static readJson<T = any>(filePath: string): Promise<T>;
    /**
     * Write a JSON file
     */
    static writeJson(filePath: string, data: any, options?: fs.WriteOptions): Promise<void>;
    /**
     * Read a text file
     */
    static readText(filePath: string, encoding?: BufferEncoding): Promise<string>;
    /**
     * Write a text file
     */
    static writeText(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
    /**
     * Delete a file
     */
    static deleteFile(filePath: string): Promise<void>;
    /**
     * Copy a file
     */
    static copyFile(src: string, dest: string): Promise<void>;
    /**
     * Move a file
     */
    static moveFile(src: string, dest: string): Promise<void>;
    /**
     * Get file stats
     */
    static getStats(filePath: string): Promise<fs.Stats>;
    /**
     * List files in a directory
     */
    static listFiles(dirPath: string): Promise<string[]>;
    /**
     * List directories in a directory
     */
    static listDirectories(dirPath: string): Promise<string[]>;
    /**
     * Validate that a path is safe (no directory traversal)
     */
    static validatePath(inputPath: string, basePath: string): boolean;
    /**
     * Get application data directory
     */
    static getAppDataPath(): string;
    /**
     * Get downloads directory
     */
    static getDownloadsPath(): string;
    /**
     * Get application logs directory
     */
    static getLogsPath(): string;
    /**
     * Get application binaries directory
     */
    static getBinariesPath(): string;
    /**
     * Get application cache directory
     */
    static getCachePath(): string;
    /**
     * Initialize all required directories
     */
    static initializeDirectories(): Promise<void>;
    /**
     * Clean up temporary files
     */
    static cleanupTempFiles(): Promise<void>;
    /**
     * Get file size in bytes
     */
    static getFileSize(filePath: string): Promise<number>;
    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes: number): string;
    /**
     * Get file extension
     */
    static getFileExtension(filePath: string): string;
    /**
     * Get filename without extension
     */
    static getFileNameWithoutExtension(filePath: string): string;
    /**
     * Sanitize filename for safe file system operations
     */
    static sanitizeFilename(filename: string): string;
    /**
     * Create a unique filename if file already exists
     */
    static createUniqueFilename(filePath: string): Promise<string>;
}
//# sourceMappingURL=fileUtils.d.ts.map