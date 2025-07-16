"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePath = validatePath;
exports.sanitizePath = sanitizePath;
exports.sanitizeFilename = sanitizeFilename;
exports.isPathWithinBase = isPathWithinBase;
exports.createUniqueFilename = createUniqueFilename;
exports.validateDirectoryPath = validateDirectoryPath;
exports.extractSafeFilename = extractSafeFilename;
exports.formatFileSize = formatFileSize;
exports.isHiddenPath = isHiddenPath;
exports.getFileExtension = getFileExtension;
exports.isAllowedExtension = isAllowedExtension;
exports.validateFileExtension = validateFileExtension;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
/**
 * Path validation and sanitization utilities
 *
 * This module provides comprehensive path validation and sanitization
 * functions to ensure secure file system operations.
 */
// Dangerous path patterns to check for
const DANGEROUS_PATTERNS = [
    /\.\./, // Directory traversal
    /~/, // Home directory reference
    /\$\{.*\}/, // Variable expansion
    /`.*`/, // Command substitution
    /\|/, // Pipe character
    /;/, // Command separator
    /&/, // Background process
];
// Invalid filename characters (Windows + additional safety)
const INVALID_FILENAME_CHARS = /[<>:"|?*\x00-\x1f]/;
// Reserved Windows filenames
const RESERVED_NAMES = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];
/**
 * Comprehensive path validation
 */
function validatePath(inputPath, options = {}) {
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
        // Length validation
        const maxLength = options.maxLength || 260; // Windows MAX_PATH
        if (inputPath.length > maxLength) {
            result.isValid = false;
            result.errors.push(`Path exceeds maximum length of ${maxLength} characters`);
        }
        // Sanitize the path first
        result.sanitizedPath = sanitizePath(inputPath);
        // Check for dangerous patterns
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(inputPath)) {
                result.isSecure = false;
                result.errors.push('Path contains potentially dangerous patterns');
                break;
            }
        }
        // Check for invalid filename characters
        const filename = path.basename(result.sanitizedPath);
        if (INVALID_FILENAME_CHARS.test(filename)) {
            result.errors.push('Filename contains invalid characters');
        }
        // Check for reserved names (Windows)
        const nameWithoutExt = path.parse(filename).name.toUpperCase();
        if (RESERVED_NAMES.includes(nameWithoutExt)) {
            result.errors.push('Filename uses a reserved system name');
        }
        // Relative path validation
        if (!options.allowRelative && !path.isAbsolute(result.sanitizedPath)) {
            result.errors.push('Relative paths are not allowed');
        }
        // Base path validation (directory traversal protection)
        if (options.basePath) {
            const resolvedPath = path.resolve(options.basePath, result.sanitizedPath);
            const resolvedBasePath = path.resolve(options.basePath);
            if (!resolvedPath.startsWith(resolvedBasePath + path.sep) && resolvedPath !== resolvedBasePath) {
                result.isValid = false;
                result.isSecure = false;
                result.errors.push('Path attempts to escape base directory');
            }
        }
        // Update validity based on security and other checks
        if (!result.isSecure || result.errors.length > 0) {
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
function sanitizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
        return '';
    }
    let sanitized = inputPath;
    // Normalize path separators
    sanitized = path.normalize(sanitized);
    // Remove or replace invalid characters
    sanitized = sanitized.replace(INVALID_FILENAME_CHARS, '_');
    // Remove leading/trailing whitespace
    sanitized = sanitized.trim();
    // Handle multiple consecutive separators
    sanitized = sanitized.replace(/[/\\]+/g, path.sep);
    // Remove trailing dots and spaces (Windows issue)
    const parts = sanitized.split(path.sep);
    const cleanedParts = parts.map(part => {
        return part.replace(/[. ]+$/, '');
    });
    sanitized = cleanedParts.join(path.sep);
    return sanitized;
}
/**
 * Sanitize a filename (without directory path)
 */
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return '';
    }
    let sanitized = filename;
    // Remove or replace invalid characters
    sanitized = sanitized.replace(INVALID_FILENAME_CHARS, '_');
    // Remove leading/trailing whitespace and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
    // Handle reserved names
    const nameWithoutExt = path.parse(sanitized).name.toUpperCase();
    if (RESERVED_NAMES.includes(nameWithoutExt)) {
        const ext = path.parse(sanitized).ext;
        sanitized = `${sanitized}_file${ext}`;
    }
    // Ensure filename is not empty
    if (!sanitized) {
        sanitized = 'unnamed_file';
    }
    return sanitized;
}
/**
 * Check if a path is within a base directory (no traversal)
 */
function isPathWithinBase(targetPath, basePath) {
    try {
        const resolvedTarget = path.resolve(basePath, targetPath);
        const resolvedBase = path.resolve(basePath);
        return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
    }
    catch {
        return false;
    }
}
/**
 * Create a unique filename if the file already exists
 */
function createUniqueFilename(originalPath, existingFiles) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const nameWithoutExt = path.basename(originalPath, ext);
    let counter = 1;
    let newPath = originalPath;
    while (existingFiles.includes(path.basename(newPath))) {
        newPath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
    }
    return newPath;
}
/**
 * Validate and normalize a directory path
 */
function validateDirectoryPath(dirPath, basePath) {
    const result = validatePath(dirPath, { basePath, allowRelative: false });
    // Additional directory-specific validation
    if (result.isValid) {
        // Ensure path ends with separator for consistency
        if (!result.sanitizedPath.endsWith(path.sep)) {
            result.sanitizedPath += path.sep;
        }
    }
    return result;
}
/**
 * Extract safe filename from URL or arbitrary string
 */
function extractSafeFilename(input, defaultName = 'file') {
    if (!input || typeof input !== 'string') {
        return defaultName;
    }
    // If it's a URL, extract the filename part
    try {
        const url = new URL(input);
        const pathname = url.pathname;
        const filename = path.basename(pathname);
        if (filename && filename !== '/') {
            return sanitizeFilename(filename);
        }
    }
    catch {
        // Not a valid URL, treat as regular string
    }
    // Extract filename-like part from string
    const parts = input.split(/[/\\]/);
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
        return sanitizeFilename(lastPart);
    }
    return defaultName;
}
/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
}
/**
 * Check if a path represents a hidden file/directory
 */
function isHiddenPath(filePath) {
    const basename = path.basename(filePath);
    return basename.startsWith('.') && basename !== '.' && basename !== '..';
}
/**
 * Get file extension in lowercase
 */
function getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
}
/**
 * Check if file extension is in allowed list
 */
function isAllowedExtension(filePath, allowedExtensions) {
    const ext = getFileExtension(filePath);
    return allowedExtensions.map(e => e.toLowerCase()).includes(ext);
}
/**
 * Validate file extension for security
 */
function validateFileExtension(filePath) {
    const ext = getFileExtension(filePath);
    // Dangerous extensions that should never be allowed
    const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
        '.app', '.deb', '.pkg', '.dmg', '.run', '.sh', '.ps1'
    ];
    // Generally safe extensions for media and documents
    const safeExtensions = [
        '.mp4', '.mp3', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
        '.txt', '.json', '.xml', '.csv', '.log'
    ];
    const isSafe = !dangerousExtensions.includes(ext) && safeExtensions.includes(ext);
    const isValid = ext.length > 0 && ext.length <= 10; // Reasonable extension length
    return {
        isValid,
        isSafe,
        extension: ext
    };
}
//# sourceMappingURL=path-validation.js.map