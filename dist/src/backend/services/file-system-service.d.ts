import { IFileSystemService, FileSystemStats, DirectoryStructure, PathValidationResult, AppDirectories } from '../../shared/types/settings-types';
interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare class FileSystemService implements IFileSystemService {
    private logger;
    private appDirectories;
    constructor(logger?: Logger);
    /**
     * Check if a file or directory exists
     */
    exists(filePath: string): Promise<boolean>;
    /**
     * Read a file with optional encoding
     */
    readFile(filePath: string, encoding?: BufferEncoding): Promise<string | Buffer>;
    /**
     * Write content to a file
     */
    writeFile(filePath: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void>;
    /**
     * Delete a file
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Copy a file from source to destination
     */
    copyFile(source: string, destination: string): Promise<void>;
    /**
     * Move a file from source to destination
     */
    moveFile(source: string, destination: string): Promise<void>;
    /**
     * Ensure a directory exists, creating it if necessary
     */
    ensureDirectory(dirPath: string): Promise<void>;
    /**
     * List directory contents with detailed information
     */
    listDirectory(dirPath: string): Promise<DirectoryStructure>;
    /**
     * Delete a directory and all its contents
     */
    deleteDirectory(dirPath: string): Promise<void>;
    /**
     * Read a JSON file with type safety
     */
    readJson<T = any>(filePath: string): Promise<T>;
    /**
     * Write data to a JSON file with formatting
     */
    writeJson(filePath: string, data: any): Promise<void>;
    /**
     * Validate and sanitize a file path
     */
    validatePath(inputPath: string, basePath?: string): PathValidationResult;
    /**
     * Sanitize a path for safe file system operations
     */
    sanitizePath(inputPath: string): string;
    /**
     * Resolve multiple path segments safely
     */
    resolvePath(...paths: string[]): string;
    /**
     * Get detailed file/directory statistics
     */
    getStats(filePath: string): Promise<FileSystemStats>;
    /**
     * Get file size in bytes
     */
    getSize(filePath: string): Promise<number>;
    /**
     * Get application directory structure
     */
    getAppDirectories(): AppDirectories;
    /**
     * Initialize all application directories
     */
    initializeAppDirectories(): Promise<void>;
    /**
     * Clean up temporary files
     */
    cleanupTempFiles(): Promise<void>;
    /**
     * Clean up old log files
     */
    cleanupOldLogs(maxAge: number): Promise<void>;
    /**
     * Initialize application directory paths
     */
    private initializeAppDirectoriesPaths;
}
export declare const fileSystemService: FileSystemService;
export {};
//# sourceMappingURL=file-system-service.d.ts.map