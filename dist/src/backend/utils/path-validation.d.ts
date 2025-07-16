import { PathValidationResult } from '../../shared/types/settings-types';
/**
 * Comprehensive path validation
 */
export declare function validatePath(inputPath: string, options?: {
    basePath?: string;
    allowRelative?: boolean;
    maxLength?: number;
}): PathValidationResult;
/**
 * Sanitize a path for safe file system operations
 */
export declare function sanitizePath(inputPath: string): string;
/**
 * Sanitize a filename (without directory path)
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Check if a path is within a base directory (no traversal)
 */
export declare function isPathWithinBase(targetPath: string, basePath: string): boolean;
/**
 * Create a unique filename if the file already exists
 */
export declare function createUniqueFilename(originalPath: string, existingFiles: string[]): string;
/**
 * Validate and normalize a directory path
 */
export declare function validateDirectoryPath(dirPath: string, basePath?: string): PathValidationResult;
/**
 * Extract safe filename from URL or arbitrary string
 */
export declare function extractSafeFilename(input: string, defaultName?: string): string;
/**
 * Format file size in human-readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Check if a path represents a hidden file/directory
 */
export declare function isHiddenPath(filePath: string): boolean;
/**
 * Get file extension in lowercase
 */
export declare function getFileExtension(filePath: string): string;
/**
 * Check if file extension is in allowed list
 */
export declare function isAllowedExtension(filePath: string, allowedExtensions: string[]): boolean;
/**
 * Validate file extension for security
 */
export declare function validateFileExtension(filePath: string): {
    isValid: boolean;
    isSafe: boolean;
    extension: string;
};
//# sourceMappingURL=path-validation.d.ts.map