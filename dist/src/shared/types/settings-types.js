"use strict";
/**
 * TypeScript interfaces for Settings and File System Services
 *
 * This file defines all the types used for persistent storage,
 * settings management, and file system operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS_SCHEMA = exports.DEFAULT_USER_SETTINGS = exports.FileSystemError = exports.SettingsError = void 0;
// Error types
class SettingsError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'SettingsError';
    }
}
exports.SettingsError = SettingsError;
class FileSystemError extends Error {
    constructor(message, code, path, details) {
        super(message);
        this.code = code;
        this.path = path;
        this.details = details;
        this.name = 'FileSystemError';
    }
}
exports.FileSystemError = FileSystemError;
// Constants
exports.DEFAULT_USER_SETTINGS = {
    theme: 'light',
    language: 'en',
    downloadLocation: '',
    tempDirectory: '',
    startMinimized: false,
    closeToTray: false,
    autoUpdate: true,
    videoQuality: 'best',
    maxConcurrentDownloads: 3,
    windowSize: {
        width: 1200,
        height: 800,
    },
    windowPosition: {
        x: 100,
        y: 100,
    },
    notificationsEnabled: true,
};
exports.SETTINGS_SCHEMA = {
    theme: {
        type: 'string',
        enum: ['light', 'dark', 'system'],
        default: 'light',
    },
    language: {
        type: 'string',
        default: 'en',
    },
    downloadLocation: {
        type: 'string',
        default: '',
    },
    tempDirectory: {
        type: 'string',
        default: '',
    },
    startMinimized: {
        type: 'boolean',
        default: false,
    },
    closeToTray: {
        type: 'boolean',
        default: false,
    },
    autoUpdate: {
        type: 'boolean',
        default: true,
    },
    videoQuality: {
        type: 'string',
        enum: ['best', 'worst', '720p', '1080p'],
        default: 'best',
    },
    maxConcurrentDownloads: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        default: 3,
    },
    windowSize: {
        type: 'object',
        properties: {
            width: { type: 'number', minimum: 800, default: 1200 },
            height: { type: 'number', minimum: 600, default: 800 },
        },
        default: { width: 1200, height: 800 },
    },
    windowPosition: {
        type: 'object',
        properties: {
            x: { type: 'number', default: 100 },
            y: { type: 'number', default: 100 },
        },
        default: { x: 100, y: 100 },
    },
    notificationsEnabled: {
        type: 'boolean',
        default: true,
    },
};
//# sourceMappingURL=settings-types.js.map