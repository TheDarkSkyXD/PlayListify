/**
 * Shared TypeScript interfaces for IPC communication between main and renderer processes
 * This file defines the secure API surface exposed through the preload script
 */

// Application operations interface
export interface AppAPI {
  getVersion(): Promise<string>;
  quit(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  isMaximized(): Promise<boolean>;
  unmaximize(): Promise<void>;
  close(): Promise<void>;
}

// File system operations interface
export interface FileSystemAPI {
  exists(path: string): Promise<boolean>;
  readJson(path: string): Promise<any>;
  writeJson(path: string, data: any): Promise<void>;
  readText(path: string, encoding?: BufferEncoding): Promise<string>;
  writeText(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
  delete(path: string): Promise<void>;
  copy(src: string, dest: string): Promise<void>;
  move(src: string, dest: string): Promise<void>;
  getStats(path: string): Promise<any>;
  listFiles(dirPath: string): Promise<string[]>;
  listDirectories(dirPath: string): Promise<string[]>;
  ensureDirectory(dirPath: string): Promise<void>;
  getSize(path: string): Promise<number>;
  formatSize(bytes: number): Promise<string>;
  sanitizeFilename(filename: string): Promise<string>;
  createUniqueFilename(path: string): Promise<string>;
  getAppPaths(): Promise<any>;
  initializeDirectories(): Promise<void>;
  cleanupTempFiles(): Promise<void>;
  selectDirectory(): Promise<string | null>;
}

// Settings management interface
export interface SettingsAPI {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  getAll(): Promise<any>;
  reset(): Promise<void>;
  hasCustomValue(key: string): Promise<boolean>;
  getStorePath(): Promise<string>;
  validate(): Promise<boolean>;
  export(): Promise<string>;
  import(jsonString: string): Promise<boolean>;
  initializeDownloadLocation(): Promise<void>;
}

// Playlist operations interface (for future implementation)
export interface PlaylistAPI {
  getAll(options?: any): Promise<any>;
  getById(playlistId: number): Promise<any>;
  create(input: any): Promise<any>;
  update(playlistId: number, updates: any): Promise<any>;
  delete(playlistId: number): Promise<any>;
  searchVideos(options: any): Promise<any>;
  addVideo(playlistId: number, videoId: string): Promise<any>;
  removeVideo(playlistId: number, videoId: string): Promise<any>;
  reorderVideos(playlistId: number, videoOrders: any[]): Promise<any>;
  getStats(playlistId: number): Promise<any>;
}

// YouTube operations interface (for future implementation)
export interface YouTubeAPI {
  getPlaylistMetadata(url: string): Promise<any>;
  importPlaylist(url: string): Promise<any>;
  getVideoQualities(videoId: string): Promise<any>;
  checkAvailability(): Promise<any>;
  updateYtDlp(): Promise<any>;
  validateUrl(url: string): Promise<any>;
  onImportProgress(callback: (event: any, data: any) => void): void;
}

// Dependency management interface
export interface DependencyAPI {
  checkStatus(): Promise<any>;
  getStatus(): Promise<any>;
  install(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<any>;
  validate(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<boolean>;
  getVersion(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<string | null>;
  getPath(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<string>;
  cleanup(): Promise<any>;
  areAllReady(): Promise<boolean>;
  isInitialized(): Promise<boolean>;
  onStatusUpdated(callback: (event: any, status: any) => void): void;
  onDownloadProgress(callback: (event: any, progress: any) => void): void;
  onInstallStarted(callback: (event: any, dependency: string) => void): void;
  onInstallCompleted(callback: (event: any, dependency: string) => void): void;
  onInstallFailed(callback: (event: any, data: any) => void): void;
}

// Main Electron API interface exposed to renderer
export interface ElectronAPI {
  app: AppAPI;
  fs: FileSystemAPI;
  settings: SettingsAPI;
  playlist: PlaylistAPI;
  youtube: YouTubeAPI;
  dependency: DependencyAPI;
  
  // Legacy methods for backward compatibility
  getPlaylistMetadata: (url: string) => Promise<any>;
  startImport: (url: string) => Promise<any>;
  onTaskUpdate: (callback: (event: any, data: any) => void) => void;
  getPlaylistDetails: (playlistId: string) => Promise<any>;
  getPlaylists: () => Promise<any>;
}

// Window interface extension (will be merged with existing declarations)
export interface WindowAPI extends ElectronAPI {}

// Application configuration interfaces
export interface AppConfig {
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    center: boolean;
  };
  security: {
    nodeIntegration: boolean;
    contextIsolation: boolean;
    webSecurity: boolean;
    allowRunningInsecureContent: boolean;
    experimentalFeatures: boolean;
  };
  development: {
    devTools: boolean;
    hotReload: boolean;
    debugLogging: boolean;
  };
}

// User settings schema
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
  
  // Window state
  windowSize?: { width: number; height: number };
  windowPosition?: { x: number; y: number };
  
  // Development settings (dev mode only)
  debugMode?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

// IPC channel names (for type safety)
export const IPC_CHANNELS = {
  // App channels
  APP_GET_VERSION: 'app:getVersion',
  APP_QUIT: 'app:quit',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_IS_MAXIMIZED: 'app:isMaximized',
  APP_UNMAXIMIZE: 'app:unmaximize',
  APP_CLOSE: 'app:close',
  
  // File system channels
  FS_EXISTS: 'fs:exists',
  FS_READ_JSON: 'fs:readJson',
  FS_WRITE_JSON: 'fs:writeJson',
  FS_READ_TEXT: 'fs:readText',
  FS_WRITE_TEXT: 'fs:writeText',
  FS_DELETE: 'fs:delete',
  FS_COPY: 'fs:copy',
  FS_MOVE: 'fs:move',
  FS_GET_STATS: 'fs:getStats',
  FS_LIST_FILES: 'fs:listFiles',
  FS_LIST_DIRECTORIES: 'fs:listDirectories',
  FS_ENSURE_DIRECTORY: 'fs:ensureDirectory',
  FS_GET_SIZE: 'fs:getSize',
  FS_FORMAT_SIZE: 'fs:formatSize',
  FS_SANITIZE_FILENAME: 'fs:sanitizeFilename',
  FS_CREATE_UNIQUE_FILENAME: 'fs:createUniqueFilename',
  FS_GET_APP_PATHS: 'fs:getAppPaths',
  FS_INITIALIZE_DIRECTORIES: 'fs:initializeDirectories',
  FS_CLEANUP_TEMP_FILES: 'fs:cleanupTempFiles',
  FS_SELECT_DIRECTORY: 'fs:selectDirectory',
  
  // Settings channels
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_HAS_CUSTOM_VALUE: 'settings:hasCustomValue',
  SETTINGS_GET_STORE_PATH: 'settings:getStorePath',
  SETTINGS_VALIDATE: 'settings:validate',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_IMPORT: 'settings:import',
  SETTINGS_INITIALIZE_DOWNLOAD_LOCATION: 'settings:initializeDownloadLocation',
  
  // Dependency channels
  DEPENDENCY_CHECK_STATUS: 'dependency:checkStatus',
  DEPENDENCY_GET_STATUS: 'dependency:getStatus',
  DEPENDENCY_INSTALL: 'dependency:install',
  DEPENDENCY_VALIDATE: 'dependency:validate',
  DEPENDENCY_GET_VERSION: 'dependency:getVersion',
  DEPENDENCY_GET_PATH: 'dependency:getPath',
  DEPENDENCY_CLEANUP: 'dependency:cleanup',
  DEPENDENCY_ARE_ALL_READY: 'dependency:areAllReady',
  DEPENDENCY_IS_INITIALIZED: 'dependency:isInitialized',
  DEPENDENCY_STATUS_UPDATED: 'dependency:statusUpdated',
  DEPENDENCY_DOWNLOAD_PROGRESS: 'dependency:downloadProgress',
  DEPENDENCY_INSTALL_STARTED: 'dependency:installStarted',
  DEPENDENCY_INSTALL_COMPLETED: 'dependency:installCompleted',
  DEPENDENCY_INSTALL_FAILED: 'dependency:installFailed',
  
  // Legacy channels (for backward compatibility)
  GET_PLAYLIST_METADATA: 'playlist:getMetadata',
  START_IMPORT: 'import:start',
  TASK_UPDATE: 'task:update',
  GET_PLAYLIST_DETAILS: 'getPlaylistDetails',
  GET_PLAYLISTS: 'getPlaylists',
} as const;

// Type for IPC channel names
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];