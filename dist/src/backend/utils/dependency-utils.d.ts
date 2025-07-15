/**
 * Utility functions for dependency management
 * Provides helper functions for downloading, extracting, and validating dependencies
 */
import type { DependencyDownloadProgress } from '@/shared/interfaces/dependency-manager';
/**
 * Download a file from a URL with progress tracking
 */
export declare function downloadFile(url: string, destinationPath: string, onProgress?: (progress: DependencyDownloadProgress) => void): Promise<void>;
/**
 * Extract a ZIP file
 */
export declare function extractZip(zipPath: string, extractPath: string): Promise<void>;
/**
 * Extract a TAR file (with optional compression)
 */
export declare function extractTar(tarPath: string, extractPath: string): Promise<void>;
/**
 * Make a file executable (Unix-like systems)
 */
export declare function makeExecutable(filePath: string): Promise<void>;
/**
 * Validate that a binary exists and is executable
 */
export declare function validateBinary(binaryPath: string): Promise<boolean>;
/**
 * Get version information from a binary
 */
export declare function getBinaryVersion(binaryPath: string, versionArgs?: string[]): Promise<string | null>;
/**
 * Clean up temporary files and directories
 */
export declare function cleanupTempFiles(tempDir: string): Promise<void>;
/**
 * Format bytes to human-readable string
 */
export declare function formatBytes(bytes: number): string;
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
/**
 * Check if a URL is accessible
 */
export declare function checkUrlAccessibility(url: string): Promise<boolean>;
//# sourceMappingURL=dependency-utils.d.ts.map