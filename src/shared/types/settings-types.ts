/**
 * TypeScript interfaces for Settings and File System Services
 * 
 * This file defines all the types used for persistent storage,
 * settings management, and file system operations.
 */

// Settings schema types
export interface UserSettings {
  // General settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Directory settings
  downloadLocation: string;
  tempDirectory: string;
  
  // Application behavior
  startMinimized: boolean;
  closeToTray: boolean;
  autoUpdate: boolean;
  
  // Video settings
  videoQuality: 'best' | 'worst' | '720p' | '1080p';
  maxConcurrentDownloads: number;
  
  // UI settings
  windowSize: {
    width: number;
    height: number;
  };
  windowPosition: {
    x: number;
    y: number;
  };
  
  // Notifications
  notificationsEnabled: boolean;
  
  // Advanced settings
  debugMode?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SettingsExportData {
  version: string;
  exportDate: Date;
  settings: Partial<UserSettings>;
}

// File system types
export interface FileSystemStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface DirectoryStructure {
  path: string;
  exists: boolean;
  files: string[];
  directories: string[];
  totalItems: number;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
  size?: number;
}

export interface PathValidationResult {
  isValid: boolean;
  isSecure: boolean;
  sanitizedPath: string;
  errors: string[];
}

// Application directory structure
export interface AppDirectories {
  userData: string;
  downloads: string;
  temp: string;
  logs: string;
  cache: string;
  dependencies: string;
  config: string;
}

// Service interfaces
export interface ISettingsService {
  // Basic operations
  get<K extends keyof UserSettings>(key: K): UserSettings[K];
  set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void;
  getAll(): UserSettings;
  reset(): void;
  
  // Advanced operations
  has(key: keyof UserSettings): boolean;
  delete(key: keyof UserSettings): void;
  
  // Validation and sanitization
  validate(): SettingsValidationResult;
  sanitize(): void;
  
  // Import/Export
  export(): SettingsExportData;
  import(data: SettingsExportData): boolean;
  
  // Utilities
  getStorePath(): string;
  initializeDefaults(): Promise<void>;
}

export interface IFileSystemService {
  // File operations
  exists(path: string): Promise<boolean>;
  readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
  writeFile(path: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void>;
  deleteFile(path: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  moveFile(source: string, destination: string): Promise<void>;
  
  // Directory operations
  ensureDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<DirectoryStructure>;
  deleteDirectory(path: string): Promise<void>;
  
  // JSON operations
  readJson<T = any>(path: string): Promise<T>;
  writeJson(path: string, data: any): Promise<void>;
  
  // Path operations
  validatePath(path: string, basePath?: string): PathValidationResult;
  sanitizePath(path: string): string;
  resolvePath(...paths: string[]): string;
  
  // Stats and info
  getStats(path: string): Promise<FileSystemStats>;
  getSize(path: string): Promise<number>;
  
  // Application directories
  getAppDirectories(): AppDirectories;
  initializeAppDirectories(): Promise<void>;
  
  // Cleanup operations
  cleanupTempFiles(): Promise<void>;
  cleanupOldLogs(maxAge: number): Promise<void>;
}

// Error types
export class SettingsError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SettingsError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public code: string, public path?: string, public details?: any) {
    super(message);
    this.name = 'FileSystemError';
  }
}

// Constants
export const DEFAULT_USER_SETTINGS: UserSettings = {
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

export const SETTINGS_SCHEMA = {
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
} as const;